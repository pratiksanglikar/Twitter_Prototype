/**
 * Created by pratiksanglikar on 07/03/16.
 */
var express = require('express');
var router = express.Router();
var Userhandler = require('../javascripts/userhandler');
var FeedHandler = require('../javascripts/feedhandler');
var Auth = require('./authentication');

router.get('/:searchTerm', Auth.requireLogin, function (req, res) {
	var searchTerm = req.params.searchTerm;
	if (searchTerm.startsWith('@')) {
		var promise = Userhandler.findUser(searchTerm);
		promise.done(function (result) {
			var isFollowedByPromise = Userhandler.isFollowedBy( searchTerm, req.user.twitterHandle );
			isFollowedByPromise.done( function ( isFollowed ) {
				result[0].isFollowed = isFollowed.success;
				res.send({
					"type": "user",
					"success": true,
					"result": result
				});
			}, function( error ) {
				res.send({
					"type" : "user",
					"success": false,
					"error": error
				});
			});

		}, function (error) {
			res.send({
				"type" : "user",
				"success": false,
				"error": error
			});
		});
	} else {
		var promise = FeedHandler.searchTweetsWithHashTag(searchTerm);
		promise.done(function (result) {
			res.send({
				"type" : "tweets",
				"success": true,
				"result": result
			});
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