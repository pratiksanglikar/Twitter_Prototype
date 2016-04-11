/**
 * Created by pratiksanglikar on 07/03/16.
 */
var express = require('express');
var router = express.Router();
var Auth = require('./authentication');
var RabbitMQClient = require("../rpc/client");

/**
 * calculates the feed for given user.
 */
router.get('/', Auth.requireLogin, function(req, res) {
	var twitterHandle = req.user.twitterHandle;
	var payload = {
		type: "create_feed",
		twitterHandle: twitterHandle
	};
	var promise = RabbitMQClient.request("feed_queue",payload);
	promise.done(function (response) {
		if(response.statusCode === 200) {
			res.send({"success" : true, "result" : response.response });
		} else {
			res.send(500, {"success" : false, "error" : "Some Error occurred!" });
		}
	}, function (error) {
		res.send({"success" : false, "error" : error });
	});
});

/**
 * posts new tweet for given user.
 */
router.post('/', Auth.requireLogin, function(req, res) {
	var twitterHandle = req.user.twitterHandle;
	var twitterText = req.body.twitterText;
	var payload = {
		type: "post_tweet",
		twitterHandle: twitterHandle,
		twitterText: twitterText,
		firstName: req.user.firstName,
		lastName: req.user.lastName
	}
	var postTweetPromise = RabbitMQClient.request("feed_queue", payload);
	postTweetPromise.done( function( response ) {
		if(response.statusCode === 200) {
			res.send({ "success": true });
		} else {
			res.send({"success": false, "error": "Something went wrong!"});
		}
	}, function( error ) {
		res.send({ "success" : false, "error" : error });
	});
});

/**
 * retweets the tweet with given tweet_id.
 */
router.post('/retweet/:tweet_id', Auth.requireLogin, function (req, res) {
	var twitterHandle = req.user.twitterHandle;
	var tweet_id = req.params.tweet_id;
	var payload = {
		type: "retweet",
		twitterHandle: twitterHandle,
		tweet_id: tweet_id,
		firstName: req.user.firstName,
		lastName: req.user.lastName
	};
	var retweetPromise = RabbitMQClient.request("feed_queue", payload);
	retweetPromise.done( function( result ) {
		if(result.statusCode === 200) {
			res.send({ "success" : true , "result" : result.response });
		} else {
			res.send({ "success" : false , "error" : result.response });
		}
	}, function( error ) {
		res.send({ "success" : false, "error" : error });
	});
});

module.exports = router;