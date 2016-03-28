/**
 * Created by pratiksanglikar on 07/03/16.
 */

//var MySQLHandler = require('./mysqlhandler');
var Crypto = require('crypto');
var Q = require('q');
var MongoDB = require("./mongodbhandler");
var assert = require("assert");

/**
 * creates the feed for given twitterHandle.
 * @param twitterHandle
 * @returns {promise}
 */
exports.createFeed = function (twitterHandle) {
	return _createFeed(twitterHandle);
}

/**
 * generates the string of the date object in the format that is required to insert date in mysql
 * @param date
 * @returns {String}
 */
exports.generateDateString = function (date) {
	return _generateDateString(date);
}

/**
 * gets the tweets of user specified by twitterHandle
 * @param twitterHandle
 * @returns {promise}
 */
exports.getTweetsOfUser = function (twitterHandle) {
	var deferred = Q.defer();
	twitterHandle = twitterHandle.trim().replace('@', '');
	var cursor = MongoDB.collection("tweets").find({
		twitterHandle: twitterHandle
	});
	var tweets = [];
	cursor.each(function (err, doc) {
		if (err) {
			deferred.reject(err);
		}
		if (doc != null) {
			tweets = doc;
		} else {
			deferred.resolve(tweets);
		}
	});
	return deferred.promise;
}

/**
 * posts a new tweet for given user.
 * @param tweeterHandle
 * @param tweetText
 * @returns {promise}
 */
exports.postTweet = function (tweeterHandle, tweetText, firstName, lastName) {
	return _postTweet(tweeterHandle, tweetText, firstName, lastName);
}

/**
 * retweets a tweet with provided tweet_id
 * @param tweeterHandle
 * @param tweetID
 * @returns {promise}
 */
exports.retweet = function (tweeterHandle, tweetID, firstName, lastName) {
	return _retweet(tweeterHandle, tweetID, firstName, lastName);
}

/**
 * TODO fix this
 * @param searchTerm
 * @returns {*}
 */
exports.searchTweetsWithHashTag = function (searchTerm) {
	searchTerm = searchTerm.trim().replace('#', '');
	var deferred = Q.defer();
	var feed = [];
	var cursor = MongoDB.collection("tweets").find({
		"tags": searchTerm
	});
	cursor.each(function (err, doc) {
		if (err) {
			deferred.reject(err);
		}
		if (doc != null) {
			feed = feed.concat(doc);
		} else {
			deferred.resolve(feed);
		}
	});
	return deferred.promise;
}

/**
 * Posts a new tweet to users account.
 * @param tweeterHandle
 * @param tweetText
 * @returns {promise}
 * @private
 */
_postTweet = function (tweeterHandle, tweetText, firstName, lastName) {
	var deferred = Q.defer();
	var currentTimeStamp = new Date();
	tweeterHandle = tweeterHandle.trim().replace('@', '');
	var tweetId = _generateTweetId(tweeterHandle, currentTimeStamp);
	var hashtags = _processHashTags(tweetText);
	var tweet = {
		created_on: currentTimeStamp,
		tweet_id: tweetId,
		tweet_text: tweetText,
		tags: hashtags,
		twitterHandle: tweeterHandle,
		firstName: firstName,
		lastName: lastName
	};
	MongoDB.collection("tweets").insert(tweet).then(function () {
		deferred.resolve({"success": true});
	}).catch(function (error) {
		deferred.reject({"success": false, "error": error});
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
_generateTweetId = function (tweeterHandle, currentTimeStamp) {
	tweeterHandle = tweeterHandle.trim().replace('@', '');
	var id = Crypto.createHash('sha1').update(tweeterHandle + currentTimeStamp.toString()).digest('hex');
	return id;
}

/**
 * generates the string of the date object in the form which is required to insert the dates into mysql database.
 * @param date
 * @returns {string} date as a string.
 * @private
 */
_generateDateString = function (date) {
	if (!date) {
		return '';
	}
	if (date instanceof Number) {
		date = new Date(date);
	}
	if (date instanceof Date) {
		var string = '';
		string += date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate() + ' ' + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
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
_processHashTags = function (tweetText) {
	var hashTags = [];
	tweetText = tweetText.replace('\n', " ");
	var words = tweetText.split(' ');
	for (var i = 0; i < words.length; i++) {
		if (words[i].startsWith('#')) {
			var word = words[i].trim().replace('#', '');
			word = word.replace(/[^a-zA-Z ]/g, "");
			hashTags.push(word);
		}
	}
	return hashTags;
}

/**
 * TODO modularize
 * inserts the entry of retweet of any tweet into the database.
 * @param twitterHandle
 * @param tweetId
 * @returns {promise}
 * @private
 */
_retweet = function (twitterHandle, tweetId, firstName, lastName) {
	twitterHandle = twitterHandle.trim().replace('@', '');

	var newTweetId = _generateTweetId(twitterHandle, new Date());
	var deferred = Q.defer();
	var cursor = MongoDB.collection("tweets").find({
		"tweet_id": tweetId
	});
	cursor.each(function (err, doc) {
		var tweet = null;
		if (err) {
			deferred.reject(err);
		} else {
			if (doc != null) {
				tweet = doc;
				if(tweet != null) {
					tweet._id = null;
					tweet.tweet_id = newTweetId;
					tweet.created_on = new Date();
					tweet.twitterHandle = twitterHandle;
					tweet.firstName = firstName;
					tweet.lastName = lastName;
					tweet.isRetweet = true;
					var cursor1 = MongoDB.collection("tweets").insert(tweet);
					cursor1.then(function () {
						deferred.resolve();
					}).catch(function (error) {
						deferred.reject(error);
					});
				} else {
					deferred.reject("Tweet not found!");
				}

			}
		}
	});
	return deferred.promise;
}

/**
 * creates a feed for given user.
 * @param twitterHandle
 * @returns {promise}
 * @private
 */
_createFeed = function (twitterHandle) {
	var promise = Q.defer();
	var feed = [];
	twitterHandle = twitterHandle.trim().replace('@', "");
	var cursor = MongoDB.collection("users").find({
		"twitterHandle": twitterHandle
	});
	cursor.each(function (err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			var followingCursor = MongoDB.collection("tweets").find({twitterHandle: {$in: doc.following}});
			followingCursor.each(function (err, tweets) {
				if (tweets != null) {
					feed = feed.concat(tweets);
				} else {
					promise.resolve(_sortByDateDesceding(feed, "created_on"));
				}
			});
		}
	});
	return promise.promise;
}

/**
 * sorts the array according to descending order of dates.
 * @param array array to be sorted.
 * @param attribute name of the attribute which contains dates
 * @returns {array} sorted array.
 * @private
 */
_sortByDateDesceding = function (array, attribute) {
	array.sort(function (a, b) {
		var keyA = new Date(a[attribute]),
			keyB = new Date(b[attribute]);
		// Compare the 2 dates
		if (keyA < keyB) return 1;
		if (keyA > keyB) return -1;
		return 0;
	});
	return array;
}