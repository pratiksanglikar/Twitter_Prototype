/**
 * Created by pratiksanglikar on 09/04/16.
 */
var amqp = require("amqp");
var q = require("q");
var connection = amqp.createConnection({
		host:"127.0.0.1"
	});
var rpc = new (require("./amqrpc"))(connection);

exports.request = function (queueName, payload) {
	var deferred = q.defer();
	rpc.request(queueName, payload, function(err, response){
		if(err) {
			deferred.reject(err);
		}
		else {
			deferred.resolve(response);
		}
	});
	return deferred.promise;
}