/**
 * Created by pratiksanglikar on 02/03/16.
 */
var mysql = require('mysql');
var Q = require('q');

exports.executeQuery = function( sqlQuery ) {
	console.log("Executing query : " + sqlQuery);
	var promise = _getConnection();
	var deferred = Q.defer();
	promise.done(function (connection) {
		connection.query(sqlQuery, function(err, rows) {
			if ( !err ) {
				connection.commit(function (error, result) {
					if( error ) {
						deferred.reject( error );
					} else {
						deferred.resolve( rows );
					}
					connection.release();
				});
			}
			else {
				deferred.reject( err );
			}
		});
	}, function( error ){
		deferred.reject( error );
	});
	return deferred.promise;
}

exports.executeTransaction = function( queries ) {
	var deferred = Q.defer();
	var connectionPromise = _getConnection();
	var results = [];
	connectionPromise.done( function( connection ) {
		connection.beginTransaction(function ( error ) {
			if( error ) {
				deferred.reject( error );
			} else {
				for( var i = 0; i < queries.length; i++) {
					console.log("Executing transaction query : " + queries[i]);
					connection.query(queries[i], function( error, result ) {
						if( error ) {
							connection.rollback();
							deferred.reject( error );
						} else {
							results.push( result );
						}
					});
				}
				connection.commit( function( error ) {
					if( error ) {
						deferred.reject( error );
					} else {
						deferred.resolve( results );
					}
				});
			}
		});
	}, function ( error ) {
		deferred.reject( error );
	});

	return deferred.promise;
}

var pool = null;

function _getPool() {
	if( pool == undefined ) {
		pool  = mysql.createPool({
			host     : 'localhost',
			user     : 'root',
			password : 'pratik2901',
			database : 'twitter'
		});
	}
	return pool;
}

function _getConnection() {
	pool = _getPool();
	var deferred = Q.defer();
	pool.getConnection(function (err, connection) {
		if(err) {
			deferred.reject(err);
		} else {
			deferred.resolve(connection);
		}
	});
	return deferred.promise;
}