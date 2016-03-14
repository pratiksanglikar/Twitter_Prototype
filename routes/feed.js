/**
 * Created by pratiksanglikar on 07/03/16.
 */
var express = require('express');
var router = express.Router();
var FeedHandler = require('../javascripts/feedhandler');
var Auth = require('./authentication');
var UserHandler = require('../javascripts/userhandler');

/**
 * calculates the feed for given user.
 */
router.get('/', Auth.requireLogin, function(req, res) {
	var twitterHandle = req.user.twitterHandle;
	var promise = FeedHandler.createFeed(twitterHandle);
	promise.done( function ( result ) {
		res.send({"success" : true, "result" : result });
	}, function( error ) {
		res.send({"success" : false, "error" : error });
	});
});

/**
 * gets the tweets of given twitterHandle
 * if the loggedInUser is following required user.
 */
router.get('/:twitterHandle', Auth.requireLogin, function(req, res) {
	var twitterHandle = req.user.twitterHandle;
	var personRequested = req.params.twitterHandle;
	twitterHandle = twitterHandle.trim().replace('@','');
	personRequested = personRequested.trim().replace('@','');
	var promise = UserHandler.isFollowedBy(personRequested, twitterHandle);
	promise.done( function() {
		var foundPromise = UserHandler.findUser( personRequested );
		foundPromise.done( function( result ) {
			res.send( result );
		}, function( error ) {
			res.send( {"success" : false, "error" : error});
		});
	}, function ( error ) {
		res.send( {"success" : false, "error" : error});
	});
});

/**
 * posts new tweet for given user.
 */
router.post('/', Auth.requireLogin, function(req, res, next) {
	var twitterHandle = req.user.twitterHandle;
	var twitterText = req.body.twitterText;
	var postTweetPromise = FeedHandler.postTweet(twitterHandle, twitterText);
	postTweetPromise.done( function( result ) {
		res.send({ "success" : true });
	}, function( error ) {
		res.send({ "success" : false, "error" : error });
	});
});

/**
 * retweets the tweet with given tweet_id.
 */
router.post('/retweet/:tweet_id', Auth.requireLogin, function (req, res, next) {
	var twitterHandle = req.user.twitterHandle;
	var tweet_id = req.params.tweet_id;
	var retweetPromise = FeedHandler.retweet( twitterHandle, tweet_id );
	retweetPromise.done( function( result ) {
		res.send({ "success" : true , "result" : result });
	}, function( error ) {
		res.send({ "success" : false, "error" : error });
	});
});

module.exports = router;