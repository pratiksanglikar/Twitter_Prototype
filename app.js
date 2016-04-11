var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require("http");
var session = require("express-session");
var mongoStore = require("connect-mongo")(session);

var routes = require('./routes/index');
var users = require('./routes/users');
var auth = require('./routes/authentication');
var feed = require('./routes/feed');
var search = require('./routes/search');
var mongodbhandler = require('./javascripts/mongodbhandler');
var RabbitMQClient = require("./rpc/client");
var app = express();

// view engine setup
app.set('port', 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: '$@n-j05e-5+@+e-un!ver5!+y',
	resave: false,  //don't save session if unmodified
	saveUninitialized: false,	// don't create session until something stored
	duration: 30 * 60 * 1000,
	activeDuration: 5 * 60 * 1000,
	store: new mongoStore({
		url: mongodbhandler.MONGODBURL
	})
}));

app.use(function(req, res, next) {
	if (req.session && req.session.user) {
		var twitterHandle = req.session.user.twitterHandle.trim().replace('@','');
		res.header("Cache-Control", "no-cache, no-store, must-revalidate");
		res.header("Pragma", "no-cache");
		res.header("Expires", 0);
		var authPromise = RabbitMQClient.request("user_queue",{type: "user_auth", twitterHandle: twitterHandle});
		authPromise.done( function ( response ) {
			if(response.statusCode === 200) {
				var user = response.response;
				req.user = user;
				delete req.user.password; // delete the password from the session
				req.session.user = user;  // refresh the session value
				res.locals.user = user;
				next();
			} else {
				next();
			}
		}, function (error) {
			next();
		});
	} else {
		next();
	}
});

app.use('/', routes);
app.use('/users', users);
app.use('/auth', auth);
app.use('/feed', feed);
app.use('/search', search);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

mongodbhandler.connect(mongodbhandler.MONGODBURL, function(){
	console.log('Connected to mongo at: ' + mongodbhandler.MONGODBURL);
	http.createServer(app).listen(app.get('port'), function() {
		console.log("Server started on port : " , app.get("port"));
	});
});

module.exports = app;
