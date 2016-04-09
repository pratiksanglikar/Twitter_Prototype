/**
 * Created by pratiksanglikar on 25/03/16.
 */
//const MONGODBURL = "mongodb://localhost:27017/twitter";
const MONGODBURL = "mongodb://pratik_twitter:sjsutwitter@ds019980.mlab.com:19980/twitter";
exports.MONGODBURL = MONGODBURL;

var MongoClient = require('mongodb').MongoClient;
var db;
var connected = false;

/**
 * Connects to the MongoDB Database with the provided URL
 */
exports.connect = function(url, callback) {
	url = process.env.PROD_MONGODB;
	console.log(url);
	MongoClient.connect(url, function(err, _db){
		if (err)
		{
			throw new Error('Could not connect: ' + err);
		}
		db = _db;
		connected = true;
		callback(db);
	});
};

/**
 * Returns the collection on the selected database
 */
exports.collection = function(name) {
	if (!connected) {
		throw new Error('Must connect to Mongo before calling "collection"');
	}
	return db.collection(name);
};
