/**
 * Created by pratiksanglikar on 08/03/16.
 */
var app = angular.module('Twitter', ["ngRoute"]);

app.directive('hashtag', ['$timeout', '$compile',
	function($timeout, $compile) {
		return {
			restrict: 'A',
			scope: {
				tClick: '&termClick'
			},
			link: function(scope, element, attrs) {
				$timeout(function() {
					var html = element.html();

					if (html === '') {
						return false;
					}

					if (attrs.termClick) {
						html = html.replace(/(^|\s)*#(\w+)/g, '$1<a ng-click="tClick({$event: $event})" class="hashtag">#$2</a>');
					}

					element.html(html);

					$compile(element.contents())(scope);
				}, 0);
			}
		};
	}
]);

app.factory('userservice', function ($q, $http) {
	var UserService = {
		signUp: function (data) {
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: 'http://localhost:3000/users/',
				data: data
			}).then(function (data) {
				deferred.resolve();
			}, function (error) {
				deferred.reject();
			});
			return deferred.promise;
		},

		checkUniqueTwitterHandle: function (twitterHandle) {
			twitterHandle = twitterHandle.trim().replace('@', '');
			var url = 'http://localhost:3000/users/checkhandle/' + twitterHandle;
			var def = $q.defer();

			$http({
				method: 'GET',
				url: url
			}).then(function successCallBack(data) {
				console.log(data.data.success);
				if (data.data.success) {
					def.resolve();
				} else {
					def.reject();
				}
			}, function errorCallback(error) {
				def.reject(error);
			});
			return def.promise;
		},

		checkUniqueEmailID: function (emailID) {
			var url = 'http://localhost:3000/users/checkemail/' + emailID;
			var def = $q.defer();

			$http({
				method: 'GET',
				url: url
			}).then(function successCallBack(data) {
				console.log(data.data.success);
				if (data.data.success) {
					def.resolve();
				} else {
					def.reject();
				}
			}, function errorCallback(error) {
				def.reject(error);
			});
			return def.promise;
		},

		login: function (data) {
			var url = "http://localhost:3000/auth/login";
			var def = $q.defer();
			$http({
				method: 'POST',
				url: url,
				data: data
			}).then(function (data) {
				if (data.data.success) {
					def.resolve();
				} else {
					def.reject(data.data.error);
				}

			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		},

		getCurrentLoggedInUser: function () {
			var def = $q.defer();
			$http({
				method: 'GET',
				url: 'http://localhost:3000/users/currentuser'
			}).then(function (result) {
				def.resolve(result.data[0]);
			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		},
		
		follow: function ( twitterHandle ) {
			var def = $q.defer();
			var url = "http://localhost:3000/users/follow/" + twitterHandle;
			$http({
				method: 'GET',
				url: url
			}).then(function( result ) {
				if(result.data.success) {
					def.resolve( result.data );
				} else {
					def.reject( result.data.error );
				}

			}, function( error ) {
				def.reject( error );
			});
			return def.promise;
		},
		
		unfollow: function ( twitterHandle ) {
			var def = $q.defer();
			var url = "http://localhost:3000/users/unfollow/" + twitterHandle;
			$http({
				method: 'GET',
				url: url
			}).then(function( result ) {
				if(result.data.success) {
					def.resolve( result.data );
				} else {
					def.reject( result.data.error );
				}
			}, function( error ) {
				def.reject( error );
			});
			return def.promise;
		}
	};
	return UserService;
});

app.factory('feedservice', function ($q, $http) {
	var FeedService = {
		getFeed: function () {
			var def = $q.defer();
			$http({
				method: 'GET',
				url: 'http://localhost:3000/feed'
			}).then(function (data) {
				if (data.data.success) {
					def.resolve(data.data.result);
				} else {
					def.reject(data.data.error);
				}
			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		},

		postTweet: function (newTweet) {
			var def = $q.defer();
			$http({
				method: 'POST',
				url: 'http://localhost:3000/feed',
				data: {
					"twitterText": newTweet
				}
			}).then(function (result) {
				def.resolve(result.data);
			}, function (error) {
				def.reject(result);
			});
			return def.promise;
		}
	}

	return FeedService;
});

app.controller("FeedController", ["$window", "$http", "$scope", "$sce", "$rootScope", "feedservice",
	function ($window, $http, $scope, $sce, $rootScope, FeedService) {

		init = function () {
			var promise = FeedService.getFeed();
			promise.then(function (result) {
				var feed = result;
				$scope.feed = feed;
			}, function (error) {
				$scope.error = error;
			});
		}

		$scope.postTweet = function () {
			console.log('post tweet : ' + $scope.newTweet);
			if ($scope.newTweet.length === 0) {
				alert("Please let us know what to tweet!");
			} else {
				var promise = FeedService.postTweet($scope.newTweet);
				promise.then(function (result) {
					$scope.newTweet = '';
					init();
				}, function (error) {
					alert("Ohh snap! There was some error posting your tweet!");
				});
			}
		}

		$rootScope.trustHTML = function (text) {
			return $sce.trustAsHtml(text);
		}

		$rootScope.tagTermClick = function(e) {
			var tagText = e.target.innerText;
			$rootScope.$broadcast("hashSearch", tagText);
		};
		init();
	}]);


app.factory('searchservice', function ($q, $http, $rootScope) {
	var SearchService = {
		search: function (searchTerm) {
			searchTerm = searchTerm.replace('#','');
			var def = $q.defer();
			$http({
				method: 'GET',
				url: 'http://localhost:3000/search/' + searchTerm
			}).then(function (result) {
				$rootScope.$broadcast('searchDataReceived', result.data);
				def.resolve(result.data);
			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		}
	}
	return SearchService;
});

app.controller("SearchController", ["$http", "$scope", "$window","$rootScope", "searchservice",
	function ($http, $scope, $window, $rootScope,SearchService) {
		$scope.searchFeed = [];
		$scope.search = function (event) {
			if (event.keyCode === 13) {
				_search( $scope.searchTerm );
			}
		}

		$scope.$on("hashSearch", function (event, hashTag) {
			_search( hashTag );
		});

		_search = function ( text ) {
			var promise = SearchService.search( text );
			promise.then(function (result) {
				$scope.searchFeed = result.result;
				$rootScope.searchFeed = result.result;
				$window.location.href = "home#/search";
			}, function (error) {
				$scope.error = error;
			});
			return promise.promise;
		}
		
		$scope.logout = function () {
			$http({
				method: 'GET',
				url: 'http://localhost:3000/auth/logout'
			}).then(function( result ) {
				$window.location.href = '/';
			});
		}

		$scope.home = function () {
			$window.location.href = '#/feed';
		}
	}]);

app.controller("SearchDisplayController", ["$scope", "$window","$rootScope", "userservice",
	function ($scope, $window, $rootScope, UserService) {
	$scope.$on("searchDataReceived", function (event, searchData) {
		if(searchData.result === undefined) {
			$window.location.href = 'http://localhost:3000/auth/login';
		}
		if(searchData.type == 'tweets') {
			$scope.userSearched = null;
			$scope.feed = searchData.result;
		} else {
			$scope.feed = null;
			var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
			$scope.userSearched = searchData.result[0];
			var birthDate = new Date( searchData.result[0].birthDate );
			$scope.userSearched.birthDateDay = birthDate.getUTCDate();
			$scope.userSearched.birthDateMonth = months[birthDate.getUTCMonth()];
			$scope.userSearched.birthDateYear = birthDate.getUTCFullYear();
		}
	});

	init = function() {
		$scope.feed = $rootScope.searchFeed;
	}

	$scope.follow = function () {
		var promise = UserService.follow( $scope.userSearched.twitterHandle );
		promise.then(function( result ) {
			$scope.userSearched.isFollowed = true;
		}, function( error ) {
			alert( "Oops! some error occured!" );
			console.log("ERROR : " + error);
		});
	}

	$scope.unfollow = function() {
		var promise = UserService.unfollow( $scope.userSearched.twitterHandle );
		promise.then( function( result ) {
			$scope.userSearched.isFollowed = false;
		}, function ( error ) {
			alert("Oops! some error occured!");
			console.log("ERROR : " + error);
		});
	}

	init();
}]);

app.config(function ($routeProvider) {
	$routeProvider
		.when('/feed/',
			{
				templateUrl: '/partials/feed.html',
				controller: 'FeedController'
			})
		.when('/search',
			{
				templateUrl: '/partials/search.html',
				controller: 'SearchDisplayController'
			})
		.otherwise({redirectTo: '/'});
});

app.controller("MainControl", ["$scope", "$window", "userservice", function ($scope, $window, userservice) {
	$scope.postTweet = function () {
		if (!$scope.twitterHandle || $scope.twitterHandle === '' || !$scope.tweetText || $scope.tweetText === '') {
			return;
		}
		this.tweets.push({
			twitterHandle: $scope.twitterHandle,
			tweetText: $scope.tweetText,
			createOn: new Date()
		});
		$scope.twitterHandle = '';
		$scope.tweetText = '';
	}

	$scope.redirectLogin = function () {
		$window.location.href = "http://localhost:3000/auth/login"
	}
}]);

app.controller("UserController", ["$scope", "$window", "userservice", function ($scope, $window, userservice) {
	$scope.signUp = function () {
		console.log("Signing Up");

		var data = {
			"twitterHandle": $scope.user.twitterHandle,
			"firstName": $scope.user.firstName,
			"lastName": $scope.user.lastName,
			"emailID": $scope.user.email,
			"password": $scope.user.password,
			"phoneNumber": $scope.user.phoneNumber,
			"birthDate": $scope.user.birthDate,
			"location": $scope.user.location
		};

		userservice.signUp(data).then(function (result) {
			$window.location.href = 'http://localhost:3000/auth/login';
		}, function (error) {
			console.log("Unsuccessful");
		});
	}

	$scope.login = function () {
		$scope.invalidPassword = false;
		var data = {
			"twitterHandle": $scope.twitterHandle,
			"password": $scope.password
		}
		userservice.login(data).then(function () {
			$window.location.href = "http://localhost:3000/home#/feed";
		}, function (error) {
			$scope.invalidPassword = true;
			$scope.loginError = "Invalid Password";
			console.log("Error in login : " + error);
		})
	}

	$scope.redirectHome = function () {
		$window.location.href = "http://localhost:3000/";
	}

	$scope.getCurrentLoggedInUser = function () {
		if (!$scope.currentUser) {
			var promise = userservice.getCurrentLoggedInUser();
			promise.then(function (result) {
				$scope.currentUser = result;
			});
		}
	}
}]);


app.directive('emailid', function ($q, $http, userservice) {
	return {
		require: 'ngModel',
		link: function (scope, elm, attrs, ctrl) {
			ctrl.$asyncValidators.alreadyUsed = function (modelValue, viewValue) {
				return userservice.checkUniqueEmailID(viewValue);
			};
		}
	}
});

app.directive('twitterHandle1', function ($q, $http, userservice) {
	return {
		require: 'ngModel',
		link: function (scope, elm, attrs, ctrl) {
			ctrl.$asyncValidators.isAvailable = function (modelValue, viewValue) {
				return userservice.checkUniqueTwitterHandle(viewValue);
			};
		}
	}
});

