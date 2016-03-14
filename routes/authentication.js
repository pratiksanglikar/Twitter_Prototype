/**
 * Created by pratiksanglikar on 06/03/16.
 */
var express = require('express');
var router = express.Router();
var userhandler = require('../javascripts/userhandler');
var PasswordManager = require('../javascripts/passwordmanager');

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
	var userPromise = userhandler.findUserForAuthentication( twitterHandle );

	userPromise.done( function( user ) {
		var password = PasswordManager.encryptPassword(req.body.password);
		if (password === user.password) {
			req.session.user = user;
			res.send({"success": true});
		} else {
			res.send({"success": false,"error" : "Invalid Password!"});
		}
	}, function( error ) {
		var finalError = error || "User not found";
		res.render({"success": false, "error" : finalError});
	});
});

/**
 * logouts the user from system.
 */
router.get('/logout', function(req, res, next) {
	req.session.reset();
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