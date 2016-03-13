var express = require('express');
var router = express.Router();
var Auth = require('./authentication');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Twitter' });
 });

router.get("/home", Auth.requireLogin, function( req, res) {
  res.render('home', {title: "Home"});
});

module.exports = router;
