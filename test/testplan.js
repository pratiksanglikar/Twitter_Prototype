/**
 * Created by pratiksanglikar on 18/03/16.
 */
var request = require('request'),
	assert = require("assert"),
	http = require("http");

describe("url tests", function() {
	
	beforeEach(function(done) {
		request.post(
			"http://localhost:3000/auth/login",
			{ form:
				{
					twitterHandle: "pratiksanglikar",
					password:"pratik123"
				}
			},
			function (error, response) {
				done();
			}
		);
	});

	it("Should redirect to login page", function(done) {
		http.get("http://localhost:3000/feed", function(res) {
			assert.equal(302, res.statusCode);
			done();
		});
	});

	it("Should return status 404 if incorrect url is specified", function(done){
		http.get("http://localhost:3000/negativetest", function(res) {
			assert.equal(404, res.statusCode);
			done();
		});
	});

	it("Should NOT authenticate the user on incorrect twitterHandle password combination", function(done) {
		request.post(
			"http://localhost:3000/auth/login",
			{ form:
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

	it("Should not search tweets if the user is not logged in", function (done) {
		request.get(
			"http://localhost:3000/search/@pratiksanglikar",
			function (error, response) {
				assert.equal(200, response.statusCode);
				done();
			}
		);
	});

	it("Shourld not post the tweet if the user is not signed in", function (done) {
		request.post(
			"http://localhost:3000/feed",
			function (error, response) {
				assert.equal(302, response.statusCode);
				done();
			}
		);
	});
});