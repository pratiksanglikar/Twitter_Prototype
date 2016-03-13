/**
 * Created by pratiksanglikar on 06/03/16.
 */
var express = require('express');
var router = express.Router();
var userhandler = require('../javascripts/userhandler');
var PasswordManager = require('../javascripts/passwordmanager');

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.send('respond with a resource');
});

router.get('/login', function(req, res, next) {
	res.render('./login', { title : "Login" });
});

router.post('/login', function(req, res, next) {
	var twitterHandle = req.body.twitterHandle.trim().replace('@','');
	var userPromise = userhandler.findUserForAuthentication( twitterHandle );

	userPromise.done( function( user ) {
		var password = PasswordManager.encryptPassword(req.body.password);
		if (password === user.password) {
			// sets a cookie with the user's info
			req.session.user = user;
			res.send({"success": true});
		} else {
			res.send({"success": false,"error" : "Invalid Password!"});
		}
		//console.log('User @' + user.twitterHandle + ' found!');
		//res.send('User @' + user.twitterHandle + ' found!');
	}, function( error ) {
		var finalError = error || "User not found";
		res.render({"success": false, "error" : finalError});
	});
});

router.get('/logout', function(req, res, next) {
	req.session.reset();
	res.redirect('/');
});

router.requireLogin  = function(req, res, next) {
	if (!req.user) {
		res.redirect('/auth/login');
	} else {
		next();
	}
};

module.exports = router;