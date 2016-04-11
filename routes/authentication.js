/**
 * Created by pratiksanglikar on 06/03/16.
 */
var express = require('express');
var router = express.Router();
var rabbitMQClient = require("../rpc/client");

/**
 * returns the login page
 */
router.get('/login', function(req, res, next) {
	res.render('./login', { title : "Login" });
});

/**
 * Authenticates the user with given username and password
 */
router.post('/login', function(req, res) {
	var twitterHandle = req.body.twitterHandle.trim().replace('@','');
	var payload = {
		"type": "login",
		"twitterHandle" : twitterHandle,
		"password" : req.body.password
	};

	var userPromise = rabbitMQClient.request('auth_queue', payload);
	userPromise.done( function( response ) {
			if(response.statusCode === 200) {
				req.session.user = response.response;
				req.user = response.response;
				res.send({
					"success": true,
					"response" : response.response
				});
			} else {
				res.send({
					"success": false,
					"error" : response.response
				});
			}
		}, function( error ) {
		var finalError = error || "User not found";
		res.send({
			"success": false,
			"error" : finalError
		});
	});
});

/**
 * logouts the user from system.
 */
router.get('/logout', function(req, res, next) {
	req.session.destroy();
	res.redirect('/');
});

/**
 * function that checks if the user is logged in or not.
 * If not logged in, the user is redirected to login page.
 * @param req
 * @param res
 * @param next
 */
router.requireLogin  = function(req, res, next) {
	if (!req.user) {
		res.redirect('/auth/login');
	} else {
		next();
	}
};

module.exports = router;