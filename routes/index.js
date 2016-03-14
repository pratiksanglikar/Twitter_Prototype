var express = require('express');
var router = express.Router();
var Auth = require('./authentication');

/**
 * returns the index page for the twitter.
 */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Twitter' });
 });

/**
 * returns the home page for the loggedIn user.
 */
router.get("/home", Auth.requireLogin, function( req, res) {
  res.render('home', {title: "Home"});
});

module.exports = router;
