/**
 * Created by pratiksanglikar on 07/03/16.
 */

var MySQLHandler = require('./mysqlhandler');
var Crypto = require('crypto');
var Q = require('q');

exports.createFeed = function ( twitterHandle ) {
	return _createFeed( twitterHandle );
}

exports.generateDateString = function( date ) {
	return _generateDateString( date );
}

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

exports.postTweet = function ( tweeterHandle, tweetText ) {
	return _postTweet( tweeterHandle, tweetText );
}

exports.retweet = function( tweeterHandle, tweetID ) {
	return _retweet( tweeterHandle, tweetID );
}

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

_generateTweetId = function( tweeterHandle, currentTimeStamp ) {
	tweeterHandle = tweeterHandle.trim().replace('@','');
	var id = Crypto.createHash('sha1').update(tweeterHandle + currentTimeStamp.toString()).digest('hex');
	return id;
}

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

_processHashTags = function( tweetText ) {
	var hashTags = [];
	var words = tweetText.split(' ');
	for(var i=0; i < words.length; i++) {
		if(words[i].startsWith('#')) {
			var word = words[i].trim().replace('#','');
			hashTags.push(word);
		}
	}
	return hashTags;
}

_insertHashTags = function( tweetId, hashTags ) {
	var queries = [];
	for(var j = 0 ; j < hashTags.length; j++) {
		hashTags[j] = hashTags[j].replace(/[^a-zA-Z ]/g, "");
		var query = 'insert into hashtags values(\'' + tweetId + '\',\'' + hashTags[j] + '\');';
		queries.push(query);
	}
	return MySQLHandler.executeTransaction( queries );
}

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