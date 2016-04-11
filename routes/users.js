var express = require('express');
var router = express.Router();
var Auth = require('./authentication');
var RabbitMQClient = require("../rpc/client");

/**
 * gets the information about the current logged in user.
 */
router.get("/currentuser", Auth.requireLogin, function (req, res) {
	var payload = {
		"type": "find_user",
		"twitterHandle": req.user.twitterHandle
	};
	var promise = RabbitMQClient.request("user_queue", payload);
	promise.done(function (result) {
		if (result.statusCode === 200) {
			res.send(result.response);
		} else {
			res.send(500, "Oops! Something went wrong!");
		}
	}, function (error) {
		res.send(500, error);
	});
});

/**
 * sign ups the new user.
 */
router.post('/', function (req, res) {
	var payload = {
		type: "sign_up",
		info: {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			twitterHandle: req.body.twitterHandle,
			emailID: req.body.emailID,
			password: req.body.password,
			phoneNumber: req.body.phoneNumber,
			birthDate: req.body.birthDate,
			location: req.body.location
		}
	};
	var resultPromise = RabbitMQClient.request("user_queue", payload);
	resultPromise.done(function (result) {
		if(result.statusCode === 200) {
			res.send({"success": true, "result": result.response });
		} else {
			res.send(500, {"success": false, "error": result.response });
		}
	}, function (error) {
		res.send(500, {"success": false, "error": error});
	});
});

/**
 * allows the logged in user to follow another user specified by twitterHandle.
 */
router.get('/follow/:twitterHandle', Auth.requireLogin, function (req, res) {
	var payload = {
		type: "follow",
		ownHandle: req.user.twitterHandle,
		theirHandle: req.params.twitterHandle
	};
	var promise = RabbitMQClient.request("user_queue", payload);
	promise.done(function (result) {
		if(result.statusCode === 200) {
			res.send({ "success": true, "result": result.response });
		} else {
			res.send(500, { "success": false, "error": "Oops! Something went wrong!"});
		}
	}, function (error) {
		res.send({"success": false, "error": error});
	});
});

/**
 * allows the user to unfollow another user specified by twitterHandle.
 */
router.get('/unfollow/:twitterHandle', Auth.requireLogin, function (req, res) {
	var payload = {
		type: "unfollow",
		ownHandle: req.user.twitterHandle,
		theirHandle: req.params.twitterHandle
	};
	var promise = RabbitMQClient.request("user_queue", payload);
	promise.done(function (result) {
		if(result.statusCode === 200) {
			res.send({"success": true, "result": result.response });
		} else {
			res.send({"success": false, "error": "Oops! Something went wrong!"});
		}
	}, function (error) {
		res.send({"success": false, "error": error});
	});
});

/**
 * checks if the twitterHandle specified is already in use.
 */
router.get('/checkhandle/:twitterHandle', function (req, res) {
	var payload = {
		type: "check_handle",
		twitterHandle: req.params.twitterHandle.trim().replace('@', '')
	};
	var promise = RabbitMQClient.request("user_queue", payload);
	promise.done(function (result) {
		if(result.statusCode === 200) {
			res.send({"success": true, "result": result.response });
		} else {
			res.send({"success": false, error: "Oops! Something went wrong!"});
		}
	}, function (error) {
		res.send({"success": false, "error": error});
	});
});

/**
 * checks if the email specified is already in use.
 */
router.get('/checkemail/:email', function (req, res) {
	var payload = {
		type: "check_email",
		email: req.params.email.trim()
	};
	var promise = RabbitMQClient.request("user_queue", payload);
	promise.done(function (result) {
		if(result.statusCode === 200) {
			res.send({"success": true });
		} else {
			res.send({"success": false });
		}
	}, function (error) {
		res.send({ "success": false, "error": error });
	});
});

module.exports = router;