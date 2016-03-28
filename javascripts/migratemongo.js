/**
 * Created by pratiksanglikar on 25/03/16.
 */

/**
 * NOT FOR PRODUCTION.
 * This was just to migrate data from mysql to mongodb.
 */

var mysql = require('./mysqlhandler');
var mongo = require('./mongodbhandler');
var Q = require('q');

exports.migrate = function () {
	var query = "select twitterHandle from users";
	var promise = mysql.executeQuery(query);
	promise.done(function (result) {
		for(var i = 0; i < result.length; i++) {
			console.log("Fetching results for : " + result[i].twitterHandle);
			migrate1( result[i].twitterHandle );
		}
	});
}

migrate1 = function ( twitterHandle ) {
	var user = {};
	var twitterHandle = twitterHandle.trim().replace('@',"");
	var userQueries = [
		"select * from users where twitterHandle = \'"+twitterHandle+"\';",
		"select followedBy from followers where twitterHandle = \'"+twitterHandle+"\';",
		"select twitterHandle from followers where followedBy = \'"+twitterHandle+"\';"];
	var tweetQuery =
		"select * from tweets INNER JOIN tweet_data on tweet_data.tweet_id = tweets.tweet_id where tweets.twitterHandle = \'"+twitterHandle+"\';";
	userQueries.push(tweetQuery);

	var userPromise = mysql.executeTransaction(userQueries);
	userPromise.done(function ( result ) {
		user = _convertUser(result[0][0]);
		user.followers = _convertFollowersToArray(result[1], "followedBy");
		user.following = _convertFollowersToArray(result[2], "twitterHandle");
		var tweetPromise = _convertTweets(result[3], user);
		tweetPromise.done(function (tweets) {
			//user.tweets = tweets;
			_writeToMongoDB(user, tweets, function (err, result) {
				//assert.equal(err, null);
				console.log("Inserted User : " + user.twitterHandle + " to mongo successfully");
			});
		});

	});
}

_writeToMongoDB = function (user, tweets, callback) {
	mongo.collection("users").insertOne(user);
	mongo.collection("tweets").insert(tweets);
	callback();
}

_convertFollowersToArray = function (result, picker) {
	var followers = [];
	for(var i=0; i < result.length; i++) {
		followers.push(result[i][picker]);
	}
	return followers;
}

_convertUser = function (user) {
	var birth = new Date(user.birthDate);
	var convertedUser = {
		twitterHandle: user.twitterHandle,
		firstName: user.firstName,
		lastName: user.lastName,
		emailID: user.emailID,
		password: user.password,
		phoneNumber: user.phoneNumber,
		location: user.location,
		birthYear: birth.getUTCFullYear(),
		birthMonth: birth.getUTCMonth(),
		birthDay: birth.getUTCDate()
	}
	return convertedUser;
}

_convertTweets = function (result, user) {
	var tweets = [];
	var deferred = Q.defer();
	for(var i =0; i < result.length; i++) {
		var tweet = {
			tweet_id: result[i].tweet_id,
			tweet_text: result[i].tweet_text,
			created_on: result[i].created_on,
			firstName: user.firstName,
			lastName: user.lastName,
			twitterHandle: user.twitterHandle
		}
		tweets.push(tweet);
	}
	var promise = _getHashTags(tweets);
	promise.done(function (tweet) {
		deferred.resolve(tweet);
	});
	return deferred.promise;
}

_getHashTags = function (tweets) {
	var queryArray = [];
	for(var i = 0; i < tweets.length ; i++) {
		var mysqlquery = "select tag from hashtags where tweet_id = \'" + tweets[i].tweet_id + "\';";
		queryArray.push(mysqlquery);
	}
	var deferred = Q.defer();
	var promise = mysql.executeTransaction(queryArray);
	promise.done( function ( hashtagResult ) {
		for(var j=0; j< hashtagResult.length; j++) {
			tweets[j].tags = _convertTags(hashtagResult[j]);
			deferred.resolve(tweets);
		}
	});
	return deferred.promise;
}

_convertTags = function (hashtags) {
	var tags = [];
	for(var i=0;i<hashtags.length;i++) {
		tags.push(hashtags[i].tag);
	}
	return tags;
}


/*
var bulk = db.collection.initializeOrderedBulkOp(),
	count = 0;

db.collections.find({ "tweets.createdOn": { "$exists": true } }).forEach(function(doc) {
	doc.users.forEach(function(tweet) {
		if ( tweet.hasOwnProperty("tweets.createdOn") ) {
			bulk.find({}).updateOne({
				"$set": { "tweets.$.created_on": tweet.createdOn}
			});
			bulk.find({}).updateOne({
				"$unset": { "tweets.$.createdOn": 1 }
			});
			count += 2;
		}
	});
});

if ( count % 500 !== 0 )
	bulk.execute();*/
