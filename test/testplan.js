/**
 * Created by pratiksanglikar on 18/03/16.
 */
var request = require('request'),
	assert = require("assert"),
	http = require("http");

describe("url tests", function() {

	it("Should return login page", function(done) {
		http.get("http://localhost:3000/auth/login", function(res) {
			assert.equal(200, res.statusCode);
			done();
		});
	});

	it("Should not return the home page if the url is wrong", function(done){
		http.get("http://localhost:3000/negativetest", function(res) {
			assert.equal(404, res.statusCode);
			done();
		});
	});

	it("Should authenticate user on correct twitterHandle password combination", function(done) {
		request.post(
			"http://localhost:3000/auth/login",
			{ form:
				{
					twitterHandle: "pratiksanglikar",
					password:"pratik123"
				}
			},
			function (error, response) {
				var responseJSON = JSON.parse(response.body);
				assert.equal(true, responseJSON.success);
				done();
			}
		);
	});

	it("Should not authenticate user on incorrect password for a twitterHandle", function (done) {
		request.post(
			"http://localhost:3000/auth/login",
			{
				form:
				{
					twitterHandle: "pratiksanglikar",
					password:"pratik12345"
				}
			},
			function (error, response) {
				var responseJSON = JSON.parse(response.body);
				assert.equal(false, responseJSON.success);
				done();
			}
		);
	});

	it("Should return login page if user is not signed in", function (done) {
		request.get(
			"http://localhost:3000/feed",
			function (error, response) {
				assert.equal(200, response.statusCode);
				done();
			}
		);
	});
});