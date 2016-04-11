/**
 * Created by pratiksanglikar on 07/03/16.
 */
var express = require('express');
var router = express.Router();
var Auth = require('./authentication');
var RabbitMQClient = require("../rpc/client");

/**
 * searches the given term and returns the results.
 */
router.get('/:searchTerm', Auth.requireLogin, function (req, res) {
	var searchTerm = req.params.searchTerm;
	if (searchTerm.startsWith('@')) {
		var payload = {
			type: "find_user",
			searchTerm: searchTerm
		};
		var promise = RabbitMQClient.request("user_queue", payload);
		promise.done(function (result) {
			if(result.statusCode === 200) {
				console.log("user is found, checking followed by");
				var isFollowedByPromise = RabbitMQClient.request( "user_queue", {
					type: "is_followed",
					ownHandle: req.user.twitterHandle,
					theirHandle: searchTerm
				} );

				isFollowedByPromise.done( function ( isFollowed ) {
					if(isFollowed.statusCode === 200) {
						result.response.isFollowed = isFollowed.response;
						res.send({
							"type": "user",
							"success": true,
							"result": result.response
						});
					} else {
						res.send({
							"type" : "user",
							"success": false,
							"error": "Oops! Something went wrong!"
						});
					}
				}, function( error ) {
					res.send({
						"type" : "user",
						"success": false,
						"error": error
					});
				});
			}
		}, function (error) {
			res.send({
				"type" : "user",
				"success": false,
				"error": error
			});
		});
	} else {
		var promise = RabbitMQClient.request("feed_queue", {type:"search_hashtag",searchTerm: searchTerm});
		promise.done(function (result) {
			if(result.statusCode === 200) {
				res.send({
					"type" : "tweets",
					"success": true,
					"result": result.response
				});
			} else {
				res.send({
					"type" : "tweets",
					"success": false,
					"result": result.response
				});
			}
		}, function (error) {
			res.send({
				"type" : "tweets",
				"success": false,
				"error": error
			});
		});
	}
});

module.exports = router;