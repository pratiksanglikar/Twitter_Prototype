var express = require('express');
var router = express.Router();
var userhandler = require('../javascripts/userhandler');
var Auth = require('./authentication');

/**
 * gets the information of user specified by twitterHandle
 */
router.get('/find/:twitterHandle', Auth.requireLogin, function(req, res, next) {
	var resultPromise = userhandler.findUser( req.param.twitterHandle );
	resultPromise.done(function( result ) {
		console.log("Found User : " + result);
	}, function ( error ) {
		console.log("Error : " + error);
	});
});

/**
 * gets the information about the current logged in user.
 */
router.get("/currentuser", Auth.requireLogin, function( req, res) {
	var promise = userhandler.findUser(req.user.twitterHandle);
	promise.done(function( result ) {
		res.send( result );
	}, function( error ) {
		res.send( error );
	});

});

/**
 * sign ups the new user.
 */
router.post('/', function(req, res, next) {
    var info = {
            firstName:        req.body.firstName,
            lastName:         req.body.lastName,
            twitterHandle:    req.body.twitterHandle,
            emailID:          req.body.emailID,
            password:         req.body.password,
            phoneNumber:      req.body.phoneNumber,
			birthDate:		  req.body.birthDate,
			location:		  req.body.location
        };

    var resultPromise = userhandler.signup( info );

    resultPromise.done( function( result ) {
		console.log( result );
        res.send({"success" : true, "result" : result});
    }, function( error ) {
		console.log( error )
        res.send({"success" : false, "error" : error});
    });
});

/**
 * allows the logged in user to follow another user specified by twitterHandle.
 */
router.get('/follow/:twitterHandle', Auth.requireLogin, function (req, res, next) {
	var ownHandle = req.user.twitterHandle;
	var theirHandle = req.params.twitterHandle;
	var promise = userhandler.follow( ownHandle, theirHandle );
	promise.done( function (result) {
		res.send({"success" : true, "result" : result});
	}, function ( error ) {
		res.send({"success" : false, "error" : error});
	});
});

/**
 * allows the user to unfollow another user specified by twitterHandle.
 */
router.get('/unfollow/:twitterHandle', Auth.requireLogin, function (req, res, next) {
	var ownHandle = req.user.twitterHandle;
	var theirHandle = req.params.twitterHandle;
	var promise = userhandler.unfollow( ownHandle, theirHandle );
	promise.done( function (result) {
		res.send({"success" : true, "result" : result});
	}, function ( error ) {
		res.send({"success" : false, "error" : error});
	});
});

/**
 * checks if the twitterHandle specified is already in use.
 */
router.get('/checkhandle/:twitterHandle', function( req, res) {
	var twitterHandle = req.params.twitterHandle.trim().replace('@','');
	var promise = userhandler.checkUniqueTwitterHandle(twitterHandle);
	promise.done(function (result) {
		res.send({"success" : true});
	}, function( error ) {
		res.send({"success" : false , "error" : error});
	});
});

/**
 * checks if the email specified is already in use.
 */
router.get('/checkemail/:email', function( req, res) {
	var email = req.params.email.trim();
	var promise = userhandler.checkUniqueEmailID(email);
	promise.done(function (result) {
		res.send({"success" : true});
	}, function( error ) {
		res.send({"success" : false , "error" : error});
	});
});

module.exports = router;