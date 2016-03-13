/**
 * Created by pratiksanglikar on 02/03/16.
 */

var passwordManager = require('./passwordManager');
var mysqlHandler = require('./mysqlhandler');
var FeedHandler = require('./feedhandler');
var Q = require('q');

exports.signup = function( info ) {
	info = _sanitizeInput( info );
	var deferred = Q.defer();
	var twitterHandle = info.twitterHandle.trim().replace('@','');
	var validationPromise = _validateSignUpInfo( info );
	validationPromise.done(function() {
		var query = _createSignUpQuery( info );
		var resultPromise = mysqlHandler.executeQuery( query );
		resultPromise.done( function ( result ) {
			var promise = mysqlHandler.executeQuery('insert into followers values (\'' + twitterHandle + "\',\'" + twitterHandle + "\');");
			promise.done( function() {
				deferred.resolve( result );
			}, function (error) {
				deferred.reject( error );
			});
		}, function( error ) {
			deferred.reject( error );
		});

	}, function( error ) {
		deferred.reject( error )
	});
	return deferred.promise;
}

exports.checkUniqueTwitterHandle = function ( twitterHandle ) {
	return _checkUniqueTwitterHandle( twitterHandle.trim() );
}

exports.checkUniqueEmailID = function ( emailID ) {
	return _checkUniqueEmailID( emailID.trim() );
}

exports.findUserForAuthentication = function( twitterHandle ) {
	var deferred = Q.defer();
	var foundPromise = _findUserByHandle( twitterHandle );
	foundPromise.done(function ( user ) {
		deferred.resolve( {
			"twitterHandle" : user[0].twitterHandle,
			"password" : user[0].password
		} );
	}, function ( error ){
		deferred.reject( error );
	});
	return deferred.promise;
}

exports.findUser = function( twitterHandle ) {
	twitterHandle = twitterHandle.trim().replace('@','');
	var queries = [],
		deferred = Q.defer();
	queries[0] = "Select * from users where twitterHandle = \'" + twitterHandle + "\';";
	queries[1] = "select count(*) from followers where twitterHandle = \'" + twitterHandle + "\';";
	queries[2] = "select count(*) from tweets where twitterHandle = \'" + twitterHandle + "\';";
	queries[3] = "SELECT count(*) from followers where followedBy = \'" + twitterHandle + "\'";
	var promise = mysqlHandler.executeTransaction( queries );
	promise.done( function( results ) {
		results[0][0].followers = results[1][0]["count(*)"];
		results[0][0].tweets = results[2][0]["count(*)"];
		results[0][0].following = results[3][0]["count(*)"];
		deferred.resolve(results[0]);
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

exports.follow = function( ownHandle, handleToBeFollowed ) {
	ownHandle = ownHandle.trim().replace('@','');
	handleToBeFollowed = handleToBeFollowed.trim().replace('@','');
	var deferred = Q.defer();
	var query = 'insert into followers values(\'' + handleToBeFollowed + "\',\'" + ownHandle + "\');";
	var queryPromise = mysqlHandler.executeQuery( query );
	queryPromise.done( function ( result ) {
		deferred.resolve( result );
	}, function( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

exports.unfollow = function( ownHandle, handleToBeFollowed ) {
	ownHandle = ownHandle.trim().replace('@','');
	handleToBeFollowed = handleToBeFollowed.trim().replace('@','');
	var deferred = Q.defer();
	var query = 'delete from followers where twitterHandle=\'' + handleToBeFollowed + "\' AND followedBy = \'" + ownHandle + "\';";
	var queryPromise = mysqlHandler.executeQuery( query );
	queryPromise.done( function ( result ) {
		deferred.resolve( result );
	}, function( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

exports.isFollowedBy = function( personHandle, isFollowedByHandle ) {
	personHandle = personHandle.trim().replace('@','');
	isFollowedByHandle = isFollowedByHandle.trim().replace('@','');
	var deferred = Q.defer();
	var query = 'SELECT * from followers WHERE twitterHandle = \'' + personHandle + "\' AND followedBy = \'" + isFollowedByHandle + "\';";
	var promise = mysqlHandler.executeQuery( query );
	promise.done( function( result ) {
		if(result.length > 0) {
			deferred.resolve({ "success" : true });
		} else {
			deferred.resolve({ "success": false });
		}
	}, function( error ) {
		deferred.reject( {"success" : false, "error" : error });
	});
	return deferred.promise;
}

_createSignUpQuery = function( info ) {
	var twitterHandle = info.twitterHandle;
	var password = passwordManager.encryptPassword( info.password );
	var birthdate = FeedHandler.generateDateString( new Date(info.birthDate ));
	twitterHandle = twitterHandle.replace('@','');
	var query = "insert into users values(\'";
		query += twitterHandle + "\',\'";
		query += info.firstName + "\',\'";
		query += info.lastName + "\',\'";
		query += info.emailID + "\',\'";
		query += password + "\',\'";
		query += info.phoneNumber + "\',\'";
		query += birthdate + "\',\'";
		query += info.location + "\');";
	return query;
}

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

_checkUniqueConstraints = function ( info ) {
	var twitterHandle = info.twitterHandle;
	var emailID = info.emailID;
	return Q.all([_checkUniqueTwitterHandle( twitterHandle ), _checkUniqueEmailID( emailID )]);
}

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

_checkUniqueTwitterHandle = function( twitterHandle ) {
	var query = "SELECT twitterHandle from users where twitterHandle = \'" + twitterHandle + "\';";
	var promise = mysqlHandler.executeQuery(query);
	var deferred = Q.defer();
	promise.done( function( result ) {
		if(result && result.length > 0) {
			deferred.reject("twitter handle already registered");
		} else {
			deferred.resolve();
		}
	}, function (error) {
		deferred.reject( error );
	});
	return deferred.promise;
}

_checkUniqueEmailID = function( emailID ) {
	var query = "SELECT twitterHandle from users where emailID = \'" + emailID + "\';";
	var promise = mysqlHandler.executeQuery( query );
	var deferred = Q.defer();
	promise.done(function( result ) {
		if(result && result.length > 0) {
			deferred.reject("email id already registered");
		} else {
			deferred.resolve();
		}
	}, function( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

_findUserByHandle = function( twitterHandle ) {
	var query = "Select * from users where twitterHandle = \'" + twitterHandle + "\';";
	var queryPromise = mysqlHandler.executeQuery( query );
	var deferred = Q.defer();
	queryPromise.done(function( result ) {
		if(result.length > 0) {
			deferred.resolve( result );
		} else {
			deferred.reject("User " + twitterHandle + " not found.");
		}
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

_getNumberOfFollowers = function( twitterHandle ) {
	var query = "select count(*) from followers where twitterHandle = \'" + twitterHandle + "\'";
	var queryPromise = mysqlHandler.executeQuery( query );
	var deferred = Q.defer();
	queryPromise.done( function (result) {
		deferred.resolve( result );
	}, function (error) {
		deferred.reject( error );
	});
	return deferred.promise;
}

_getNumberOfTweets = function( twitterHandle ) {
	var query = "select count(*) from tweets where twitterHandle = \'" + twitterHandle + "\'";
	var queryPromise = mysqlHandler.executeQuery( query );
	var deferred = Q.defer();
	queryPromise.done( function (result) {
		deferred.resolve( result );
	}, function (error) {
		deferred.reject( error );
	});
	return deferred.promise;
}