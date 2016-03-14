/**
 * Created by pratiksanglikar on 07/03/16.
 */

var MySQLHandler = require('./mysqlhandler');
var Crypto = require('crypto');
var Q = require('q');

/**
 * creates the feed for given twitterHandle.
 * @param twitterHandle
 * @returns {promise}
 */
exports.createFeed = function ( twitterHandle ) {
	return _createFeed( twitterHandle );
}

/**
 * generates the string of the date object in the format that is required to insert date in mysql
 * @param date
 * @returns {String}
 */
exports.generateDateString = function( date ) {
	return _generateDateString( date );
}

/**
 * gets the tweets of user specified by twitterHandle
 * @param twitterHandle
 * @returns {promise}
 */
exports.getTweetsOfUser = function ( twitterHandle ) {
	var deferred = Q.defer();
	twitterHandle = twitterHandle.trim().replace('@','');
	var query = "SELECT tweets.tweet_id, tweet_data.tweet_text, tweet_data.created_on, tweets.twitterHandle ";
		query += "FROM tweet_data, tweets WHERE tweets.twitterHandle = \'" + twitterHandle + "\' AND ";
		query += "(tweet_data.tweet_id = tweets.tweet_id OR tweets.retweet_of_id = tweet_data.tweet_id);";
	var promise = MySQLHandler.executeQuery( query );
	promise.done( function( result ) {
		deferred.resolve( result );
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

/**
 * posts a new tweet for given user.
 * @param tweeterHandle
 * @param tweetText
 * @returns {promise}
 */
exports.postTweet = function ( tweeterHandle, tweetText ) {
	return _postTweet( tweeterHandle, tweetText );
}

/**
 * retweets a tweet with provided tweet_id
 * @param tweeterHandle
 * @param tweetID
 * @returns {promise}
 */
exports.retweet = function( tweeterHandle, tweetID ) {
	return _retweet( tweeterHandle, tweetID );
}

/**
 * searches all tweets which contain searchTerm as hashTag
 * @param searchTerm
 * @returns {promise}
 */
exports.searchTweetsWithHashTag = function ( searchTerm ) {
	searchTerm = searchTerm.trim().replace('#','');
	var deferred = Q.defer();
	var query = "SELECT distinct tweets.tweet_id, tweet_data.tweet_text,tweet_data.created_on,users.twitterHandle,users.firstName,users.lastName ";
	query += "FROM tweets,tweet_data,users,hashtags ";
	query += "WHERE (tweet_data.tweet_id = tweets.tweet_id OR tweets.retweet_of_id = tweet_data.tweet_id) AND ";
	query += "users.twitterHandle = tweets.twitterHandle AND tweets.tweet_id IN ( SELECT hashtags.tweet_id FROM hashtags WHERE hashtags.tag = \'";
	query += searchTerm + "\') ORDER BY tweet_data.created_on DESC;";

	var promise = MySQLHandler.executeQuery(query);
	promise.done( function ( result ) {
		deferred.resolve( result );
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

/**
 * inserts the new tweet into the database.
 * @param tweeterHandle
 * @param tweetText
 * @returns {promise}
 * @private
 */
_postTweet = function( tweeterHandle, tweetText ) {
	var deferred = Q.defer();
	var currentTimeStamp = new Date();
	tweeterHandle = tweeterHandle.trim().replace('@','');
	var tweetId = _generateTweetId ( tweeterHandle, currentTimeStamp );
	var query = "insert into tweets (`tweet_id`, `twitterHandle`) values(\'" + tweetId + "\',\'" + tweeterHandle + "\');";
	var tweetCreationPromise = MySQLHandler.executeQuery(query);
	tweetCreationPromise.done( function( result ) {
		var tweetDataQuery = 'insert into tweet_data values(\'' + tweetId + '\',\'' + tweetText + "\',\'" + _generateDateString(currentTimeStamp) + "\');";
		var tweetDataPromise = MySQLHandler.executeQuery(tweetDataQuery);
		tweetDataPromise.done( function( result ) {
			var hashTags = _processHashTags( tweetText );
			if(hashTags.length > 0) {
				var promise = _insertHashTags( tweetId, hashTags );
				promise.done(function( result ) {
					deferred.resolve({ "success" : true });
				}, function( error ) {
					deferred.reject( error );
				});
			} else {
				deferred.resolve({ "success" : true });
			}
		}, function( error ) {
			deferred.reject( error );
		});
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

/**
 * generates the new tweet id by calculating hash of current date and current logged in user.
 * @param tweeterHandle
 * @param currentTimeStamp
 * @returns {String} tweet_id
 * @private
 */
_generateTweetId = function( tweeterHandle, currentTimeStamp ) {
	tweeterHandle = tweeterHandle.trim().replace('@','');
	var id = Crypto.createHash('sha1').update(tweeterHandle + currentTimeStamp.toString()).digest('hex');
	return id;
}

/**
 * generates the string of the date object in the form which is required to insert the dates into mysql database.
 * @param date
 * @returns {string} date as a string.
 * @private
 */
_generateDateString = function( date ) {
	if(!date) {
		return '';
	}
	if(date instanceof Number) {
		date = new Date(date);
	}
	if(date instanceof Date) {
		var string = '';
		string += date.getUTCFullYear() + '-' + (date.getUTCMonth()+1) + '-' + date.getUTCDate() + ' ' + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
		return string;
	}
	return "";
}

/**
 * separates out hashtags from given string.
 * Note: hashtags containing any special characters are sanitized to keep only a-z and A-Z characters.
 * @param tweetText
 * @returns {Array} returns array of hashtags from the string.
 * @private
 */
_processHashTags = function( tweetText ) {
	var hashTags = [];
	var words = tweetText.split(' ');
	for(var i=0; i < words.length; i++) {
		if(words[i].startsWith('#')) {
			var word = words[i].trim().replace('#','');
			word = word.replace(/[^a-zA-Z ]/g, "");
			hashTags.push(word);
		}
	}
	return hashTags;
}

/**
 * inserts the given array of hashtags against given tweet id into the database.
 * @param tweetId
 * @param hashTags
 * @private
 */
_insertHashTags = function( tweetId, hashTags ) {
	var queries = [];
	for(var j = 0 ; j < hashTags.length; j++) {
		var query = 'insert into hashtags values(\'' + tweetId + '\',\'' + hashTags[j] + '\');';
		queries.push(query);
	}
	return MySQLHandler.executeTransaction( queries );
}

/**
 * inserts the entry of retweet of any tweet into the database.
 * @param twitterHandle
 * @param tweetId
 * @returns {promise}
 * @private
 */
_retweet = function( twitterHandle, tweetId ) {
	twitterHandle = twitterHandle.trim().replace('@','');
	var newTweetId = _generateTweetId( twitterHandle, new Date());
	var query = "insert into tweets values(\'" + newTweetId + "\',\'" + tweetId + "\',\'" + twitterHandle + "\');";
	var promise = MySQLHandler.executeQuery(query);
	var deferred  = Q.defer();
	promise.done( function ( result ) {
		deferred.resolve({"success" : true, "result" : result});
	}, function (error) {
		deferred.reject({"success": false, "error" : error});
	});
	return deferred.promise;
}

/**
 * creates the feed for the user specified by twitterHandle
 * feed consists of tweets and retweets of his followers and his own.
 * @param twitterHandle
 * @returns {promise}
 * @private
 */
_createFeed = function( twitterHandle ) {
	twitterHandle = twitterHandle.trim().replace('@','');
	var deferred = Q.defer();
	var query =  "SELECT tweets.tweet_id, tweet_data.tweet_text,tweet_data.created_on,users.twitterHandle,users.firstName,users.lastName ";
		query += "FROM tweets, tweet_data, users ";
		query += "WHERE";
		query += "(tweet_data.tweet_id = tweets.tweet_id OR tweets.retweet_of_id = tweet_data.tweet_id) AND ";
		query += "users.twitterHandle = tweets.twitterHandle AND ";
		query += "tweets.twitterHandle IN ( SELECT followers.twitterHandle FROM followers WHERE followers.followedBy = \'" + twitterHandle + "\') ORDER BY tweet_data.created_on DESC;";
	var queryPromise = MySQLHandler.executeQuery(query);
	queryPromise.done( function ( result ) {
		deferred.resolve( result );
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}