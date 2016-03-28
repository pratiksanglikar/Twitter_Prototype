/**
 * Created by pratiksanglikar on 02/03/16.
 */

var passwordManager = require('./passwordmanager');
var mysqlHandler = require('./mysqlhandler');
var MongoDB = require("./mongodbhandler");
var FeedHandler = require('./feedhandler');
var Q = require('q');

/**
 * sign ups the new user.
 * @param info
 * @returns {promise}
 */
exports.signup = function( info ) {
	info = _sanitizeInput( info );
	var deferred = Q.defer();
	var validationPromise = _validateSignUpInfo( info );
	validationPromise.done(function() {
		info.password = passwordManager.encryptPassword(info.password);
		info.following = [info.twitterHandle];
		info.followers = [info.twitterHandle];
		info.tweets = [];
		var cursor = MongoDB.collection("users").insert(info);
		cursor.then(function () {
			deferred.resolve();
		}).catch( function(error)  {
			deferred.reject( error );
		});
	}, function( error ) {
		deferred.reject( error )
	});
	return deferred.promise;
}

/**
 * checks if the provided twitter handle is already used.
 * @param twitterHandle
 * @returns {promise}
 */
exports.checkUniqueTwitterHandle = function ( twitterHandle ) {
	return _checkUniqueTwitterHandle( twitterHandle.trim() );
}

/**
 * checks if the provided email id is already used.
 * @param emailID
 * @returns {promise}
 */
exports.checkUniqueEmailID = function ( emailID ) {
	return _checkUniqueEmailID( emailID.trim() );
}

/**
 * finds username and password of the user for authentication purposes.
 * @param twitterHandle
 * @returns {promise}
 */
exports.findUserForAuthentication = function( twitterHandle ) {
	var deferred = Q.defer();
	var cursor = MongoDB.collection("users").find({twitterHandle: twitterHandle});
	var user = null;
	cursor.each(function (err, doc) {
		if(err) {
			deferred.reject( err );
		}
		if(doc != null) {
			user = doc;
		} else {
			if(user == null) {
				deferred.reject("User not found!");
			} else {
				deferred.resolve( {
					"twitterHandle": user.twitterHandle,
					"password": user.password,
					"firstName": user.firstName,
					"lastName": user.lastName
				} );
			}
		}
	})
	return deferred.promise;
}

/**
 * finds all information about the user including tweet count, followers and following.
 * @param twitterHandle
 * @returns {promise}
 */
exports.findUser = function( twitterHandle ) {
	twitterHandle = twitterHandle.trim().replace('@','');
	var deferred = Q.defer();
	var user = null;
	var cursor = MongoDB.collection("users").find({twitterHandle: twitterHandle});
	cursor.each(function (err, doc) {
		if( err ) {
			deferred.reject( err );
		}
		if( doc != null) {
			user = doc;
		} else {
			if(user) {
				user.following = user.following.length;
				user.followers = user.followers.length;
				user.tweets = null;
				var tweets = 0;
				MongoDB.collection("tweets").find({twitterHandle: twitterHandle}).toArray(function (err, documents) {
					user.tweets = documents.length;
					deferred.resolve(user);
				});
			} else {
				deferred.reject("User not found!");
			}
		}
	})
	return deferred.promise;
}

/**
 * creates a database entry when logged in user follows another user.
 * @param ownHandle
 * @param handleToBeFollowed
 * @returns {promise}
 */
exports.follow = function( ownHandle, handleToBeFollowed ) {
	ownHandle = ownHandle.trim().replace('@','');
	handleToBeFollowed = handleToBeFollowed.trim().replace('@','');
	var deferred = Q.defer();
	var cursor = MongoDB.collection("users").update({
		twitterHandle: ownHandle
	}, {
		$push: {
			following: handleToBeFollowed
		}
	}).then(function () {
		MongoDB.collection("users").update({
			twitterHandle: handleToBeFollowed
		}, {
			$push: {
				followers: ownHandle
			}
		}).then(function () {
			deferred.resolve({"success": true});
		}).catch(function (error) {
			deferred.reject({"success": false, "error": error});
		});
	}).catch(function (error) {
		deferred.reject({"success": false, "error": error});
	});
	return deferred.promise;
}

/**
 * deletes the entry of currently logged in user unfollows another user.
 * @param ownHandle
 * @param handleToBeFollowed
 * @returns {promise}
 */
exports.unfollow = function( ownHandle, handleToBeFollowed ) {
	var deferred = Q.defer();
	ownHandle = ownHandle.trim().replace('@','');
	handleToBeFollowed = handleToBeFollowed.trim().replace('@','');
	MongoDB.collection("users").update({
		twitterHandle: ownHandle
	}, {
			$pull:
				{
					following: handleToBeFollowed
				}
	}).then(function () {
		MongoDB.collection("users").update({
			twitterHandle: handleToBeFollowed
		}, {
			$pull:
			{
				followers: ownHandle
			}
		}).then(function () {
			deferred.resolve({"success" : true});
		});
	});

	return deferred.promise;
}

/**
 * checks if the user with handle - 'personHandle' is followed by person with handle 'isFollowedByHandle'
 * @param personHandle
 * @param isFollowedByHandle
 * @returns {promise}
 */
exports.isFollowedBy = function( personHandle, isFollowedByHandle ) {
	personHandle = personHandle.trim().replace('@','');
	var user = null;
	isFollowedByHandle = isFollowedByHandle.trim().replace('@','');
	var deferred = Q.defer();
	var cursor = MongoDB.collection("users").find({twitterHandle: personHandle});
	cursor.each(function (err, doc) {
		if(err) {
			deferred.reject(err);
		} if(doc != null) {
			user = doc;
		} else {
			if(user) {
				var isFollowedBy = _contains(user.followers,isFollowedByHandle);
				if(isFollowedBy) {
					deferred.resolve({"success": true});
				} else {
					deferred.resolve({"success": false});
				}
			} else {
				deferred.reject({"success": false, "error": "User not found!"});
			}
		}
	});
	return deferred.promise;
}

/**
 * checks if the array contains certain value.
 * @param array
 * @param value
 * @returns {boolean}
 * @private
 */
_contains = function (array, value) {
	if(array instanceof Array) {
		for(var i = 0 ; i < array.length; i++) {
			if(array[i] === value) {
				return true;
			}
		}
		return false;
	} else {
		throw "Not an array";
	}
}

/**
 * validates if all the information entered is valid.
 * @param info
 * @returns {promise}
 * @private
 */
_validateSignUpInfo = function( info ) {
	var deferred = Q.defer();
	var promise = _checkUniqueConstraints( info );
	promise.done(function () {
		if(_checkNotNullConstraints( info )) {
			deferred.resolve();
		}
		else {
			deferred.reject();
		}
	}, function( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

/**
 * checks if any of the required information is missing from the data.
 * @param info
 * @returns {boolean}
 * @private
 */
_checkNotNullConstraints = function ( info ) {
	if ((info.twitterHandle === '') ||
		(info.firstName === '') ||
		(info.lastName === '') ||
		(info.emailID === '') ||
		(info.password === '') ||
		(info.birthDate === '')) {
		return false;
	}
	return true;
}

/**
 * checks if the twitterHandle or email id is already in use.
 * @param info
 * @returns {promise}
 * @private
 */
_checkUniqueConstraints = function ( info ) {
	var twitterHandle = info.twitterHandle;
	var emailID = info.emailID;
	return Q.all([_checkUniqueTwitterHandle( twitterHandle ), _checkUniqueEmailID( emailID )]);
}

/**
 * sanitizes the given input before entering in database.
 * @param info
 * @returns {promise}
 * @private
 */
_sanitizeInput = function ( info ) {
	info.twitterHandle = info.twitterHandle.trim().replace('@','');
	info.firstName = info.firstName.trim();
	info.lastName = info.lastName.trim();
	info.emailID = info.emailID.trim();
	info.password = info.password.trim();
	info.phoneNumber = info.phoneNumber.trim();
	info.location = info.location.trim();
	return info;
}

/**
 * checks if the given twitterHandle is already in use.
 * @param twitterHandle
 * @returns {promise}
 * @private
 */
_checkUniqueTwitterHandle = function( twitterHandle ) {
	var deferred = Q.defer();
	var user = null;
	var cursor = MongoDB.collection("users").find({twitterHandle: twitterHandle});
	cursor.each(function (err, doc) {
		if(err) {
			deferred.reject(err);
		} if( doc != null) {
			user = doc;
		} else if(user){
			deferred.reject("TwitterHandle already in use");
		} else {
			deferred.resolve();
		}
	});
	return deferred.promise;
}

/**
 * checks if the given email id is already in use.
 * @param emailID
 * @returns {promise}
 * @private
 */
_checkUniqueEmailID = function( emailID ) {
	var deferred = Q.defer();
	var user = null;
	var cursor = MongoDB.collection("users").find({emailID: emailID});
	cursor.each(function (err, doc) {
		if(err) {
			deferred.reject(err);
		} if( doc != null) {
			user = doc;
		} else if(user){
			deferred.reject("EmailID already in use");
		} else {
			deferred.resolve();
		}
	});
	return deferred.promise;
}

/**
 * finds the user with given handle.
 * @param twitterHandle
 * @returns {promise}
 * @private
 */
_findUserByHandle = function( twitterHandle ) {
	var deferred = Q.defer();
	var user = null;
	var cursor = MongoDB.collection("users").find({twitterHandle: twitterHandle});
	cursor.each(function (err, doc) {
		if(err) {
			deferred.reject(err);
		} if( doc != null) {
			user = doc;
		} else if(user){
			deferred.resolve(user);
		} else {
			deferred.reject("User not found!");
		}
	});
	return deferred.promise;
}