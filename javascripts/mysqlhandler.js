/**
 * Created by pratiksanglikar on 02/03/16.
 */
var mysql = require('mysql');
var Q = require('q');

exports.executeQuery = function( sqlQuery ) {
	//console.log("Executing query : " + sqlQuery);
	var promise = _getConnection();
	var deferred = Q.defer();
	promise.done(function (connection) {
		connection.query(sqlQuery, function(err, rows) {
			if ( !err ) {
				connection.commit(function (error, result) {
					if( error ) {
						deferred.reject( error );
						_releaseConnection(connection);
					} else {
						deferred.resolve( rows );
						_releaseConnection(connection);
					}
				});
			}
			else {
				deferred.reject( err );
				_releaseConnection(connection);
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
				_releaseConnection(connection);
			} else {
				for( var i = 0; i < queries.length; i++) {
					//console.log("Executing transaction query : " + queries[i]);
					connection.query(queries[i], function( error, result ) {
						if( error ) {
							connection.rollback();
							deferred.reject( error );
							_releaseConnection(connection);
						} else {
							results.push( result );
						}
					});
				}
				connection.commit( function( error ) {
					if( error ) {
						deferred.reject( error );
						_releaseConnection(connection);
					} else {
						deferred.resolve( results );
						_releaseConnection(connection);
					}
				});
			}
		});
	}, function ( error ) {
		deferred.reject( error );
		_releaseConnection(connection);
	});

	return deferred.promise;
}

var pool = null;

function _getPool() {
	if( pool == undefined ) {
		pool  = _createPool({
			host     : 'localhost',
			user     : 'root',
			password : 'pratik2901',
			database : 'twitter',
			poolsize : 25
		});
	}
	return pool;
}

function _createPool( config ) {
	console.log("Creating pool of size : " + config.poolsize);
	var pool = {
		_connections: [],
		getConnection: function () {
			var connection = this._connections.shift();
			var def = Q.defer();
			connection.connect( function( error ) {
				if( !error ) {
					def.resolve( connection );
				} else {
					def.reject( error );
				}
			});
			return def.promise;
		},

		release: function( connection ) {
			connection.end();
			this._connections.push( connection );
		}
	}
	var poolSize = config.poolsize || 10;
	for( var i = 0 ; i < poolSize ; i++) {
		var connection = mysql.createConnection({
			host: config.host,
			user: config.user,
			password: config.password,
			database: config.database
		});
		pool._connections.push( connection );
	}
	return pool;
}

function _getConnection() {
	pool = _getPool();
	var deferred = Q.defer();
	var promise = pool.getConnection();
	promise.done(function( connection ) {
		if( connection ) {
			deferred.resolve(connection);
		} 
	}, function ( error ) {
		deferred.reject( error );
	});
	return deferred.promise;
}

function _releaseConnection( connection ) {
	pool = _getPool();
	try {
		pool.release( connection );
	} catch ( error ) {
		console.log( error );
	}
}