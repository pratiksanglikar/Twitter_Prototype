/**
 * Created by pratiksanglikar on 08/03/16.
 */
var app = angular.module('Twitter', ["ngRoute"]);

/**
 * A directive to implement search a hashtag from tweet functionality.
 */
app.directive('hashtag', ['$timeout', '$compile',
	function ($timeout, $compile) {
		return {
			restrict: 'A',
			scope: {
				tClick: '&termClick'
			},
			link: function (scope, element, attrs) {
				$timeout(function () {
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

/**
 * Service for all operations regading a user.
 * operations supported -
 * Login, signup, follow, unfollow
 */
app.factory('userservice', function ($q, $http) {
	var UserService = {
		signUp: function (data) {
			var deferred = $q.defer();
			$http({
				method: 'POST',
				url: 'https://twitter-proto.herokuapp.com/users/',
				data: data
			}).then(function (data) {
				deferred.resolve();
			}, function (error) {
				deferred.reject();
			});
			return deferred.promise;
		},

		/**
		 * requests the user to check if the given twitterHandle is already in use.
		 * @param twitterHandle
		 * @returns {promise}
		 */
		checkUniqueTwitterHandle: function (twitterHandle) {
			twitterHandle = twitterHandle.trim().replace('@', '');
			var url = 'https://twitter-proto.herokuapp.com/users/checkhandle/' + twitterHandle;
			var def = $q.defer();

			$http({
				method: 'GET',
				url: url
			}).then(function successCallBack(data) {
				//console.log(data.data.success);
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

		/**
		 * requests the server to check if the given email id is already registered.
		 * @param emailID
		 * @returns {promise}
		 */
		checkUniqueEmailID: function (emailID) {
			var url = 'https://twitter-proto.herokuapp.com/users/checkemail/' + emailID;
			var def = $q.defer();

			$http({
				method: 'GET',
				url: url
			}).then(function successCallBack(data) {
				//console.log(data.data.success);
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

		/**
		 * requests the server to login a certain user.
		 * @param data    JSON data consisting of username and password.
		 * @returns {promise}
		 */
		login: function (data) {
			var url = "https://twitter-proto.herokuapp.com/auth/login";
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

		/**
		 * request the server for information about currently logged in user.
		 * @returns {promise}
		 */
		getCurrentLoggedInUser: function () {
			var def = $q.defer();
			$http({
				method: 'GET',
				url: 'https://twitter-proto.herokuapp.com/users/currentuser'
			}).then(function (result) {
				def.resolve(result.data);
			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		},

		/**
		 * requests the server to follow a certain user.
		 * @param twitterHandle twitterHandle to be followed.
		 * @returns {promise}
		 */
		follow: function (twitterHandle) {
			var def = $q.defer();
			var url = "https://twitter-proto.herokuapp.com/users/follow/" + twitterHandle;
			$http({
				method: 'GET',
				url: url
			}).then(function (result) {
				if (result.data.success) {
					def.resolve(result.data);
				} else {
					def.reject(result.data.error);
				}

			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		},

		/**
		 * requests the server for unfollowing certain user.
		 * @param twitterHandle twitterHandle to be unfollowed.
		 * @returns {promise}
		 */
		unfollow: function (twitterHandle) {
			var def = $q.defer();
			var url = "https://twitter-proto.herokuapp.com/users/unfollow/" + twitterHandle;
			$http({
				method: 'GET',
				url: url
			}).then(function (result) {
				if (result.data.success) {
					def.resolve(result.data);
				} else {
					def.reject(result.data.error);
				}
			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		}
	};
	return UserService;
});

/**
 * factory for functions regarding actions of feed.
 */
app.factory('feedservice', function ($q, $http) {
	var FeedService = {

		/**
		 * gets the feed for current user from the server.
		 * @returns {promise}
		 */
		getFeed: function () {
			var def = $q.defer();
			$http({
				method: 'GET',
				url: 'https://twitter-proto.herokuapp.com/feed'
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

		/**
		 * sends the http request to server for posting a new Tweet.
		 * @param newTweet
		 * @returns {promise}
		 */
		postTweet: function (newTweet) {
			var def = $q.defer();
			$http({
				method: 'POST',
				url: 'https://twitter-proto.herokuapp.com/feed',
				data: {
					"twitterText": newTweet
				}
			}).then(function (result) {
				def.resolve(result.data);
			}, function (error) {
				def.reject(result);
			});
			return def.promise;
		},

		/**
		 * request the server to retweet the given tweet.
		 * @param tweet_id
		 */
		retweet: function (tweet_id) {
			var def = $q.defer();
			$http({
				method: 'POST',
				url: 'https://twitter-proto.herokuapp.com/feed/retweet/' + tweet_id
			}).then(function (success) {
				def.resolve(success);
			}, function (error) {
				def.reject(error);
			});
			return def.promise;
		}
	}

	return FeedService;
});

/**
 * controller to monitor actions regarding feed in the application.
 */
app.controller("FeedController", ["$window", "$http", "$scope", "$sce", "$rootScope", "feedservice",
	function ($window, $http, $scope, $sce, $rootScope, FeedService) {

		/**
		 * initialize the controller.
		 * gets feed for the currently logged in user.
		 */
		init = function () {
			var promise = FeedService.getFeed();
			promise.then(function (result) {
				var feed = result;
				$scope.feed = feed;
			}, function (error) {
				$scope.error = error;
			});
		}

		/**
		 * posts the tweet for the currently logged in user.
		 */
		$scope.postTweet = function () {
			//console.log('post tweet : ' + $scope.newTweet);
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

		/**
		 * retweets the tweet by provided tweet_id.
		 * @param tweet_id
		 */
		$scope.retweet = function (tweet_id) {
			var promise = FeedService.retweet(tweet_id);
			promise.then(function () {
				init();
			}, function (error) {
				alert("Oops! something went wrong!");
			});
		}

		/**
		 * returns the html from SCE trustAsHTML
		 * @param text
		 * @returns {String} htmlString
		 */
		$rootScope.trustHTML = function (text) {
			return $sce.trustAsHtml(text);
		}

		/**
		 * callback function that is executed when user clicks on the hashtag in the tweet.
		 * @param e
		 */
		$rootScope.tagTermClick = function (e) {
			var tagText = e.target.innerText;
			$rootScope.userSearched = null;
			$rootScope.searchFeed = null;
			$rootScope.$broadcast("hashSearch", tagText);
		};
		init();
	}]);

/**
 * service for search functionality.
 * Searches the given term on server and returns the results.
 */
app.factory('searchservice', function ($q, $http, $rootScope) {
	var SearchService = {
		search: function (searchTerm) {
			searchTerm = searchTerm.replace('#', '');
			var def = $q.defer();
			$http({
				method: 'GET',
				url: 'https://twitter-proto.herokuapp.com/search/' + searchTerm
			}).then(function (result) {
				/*$rootScope.searchFeed = null;
				 $rootScope.userSearched = null;*/
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

/**
 * this controller operates the search functionality from the navbar.
 */
app.controller("SearchController", ["$http", "$scope", "$window", "$rootScope", "searchservice",
	function ($http, $scope, $window, $rootScope, SearchService) {
		$scope.searchFeed = [];

		/**
		 * listens the keyup event of the searchbar and
		 * if the 'ENTER' key is pressed, searches the given term in the database.
		 * @param event
		 */
		$scope.search = function (event) {
			if (event.keyCode === 13) {
				_search($scope.searchTerm);
			}
		}

		/**
		 * listens an event of when a hashtag in the tweet is clicked.
		 */
		$scope.$on("hashSearch", function (event, hashTag) {
			_search(hashTag);
		});

		/**
		 * searchs the gicen searchterm in the database.
		 * @param text searchTerm to be searched.
		 * @returns {promise}
		 * @private
		 */
		_search = function (text) {
			var promise = SearchService.search(text);
			promise.then(function (result) {
				$scope.searchFeed = result.result;
				if (result.success) {
					if (!result.result.birthDay) {
						$rootScope.userSearched = null;
						$rootScope.searchFeed = result.result;
					} else {
						var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
						$rootScope.searchFeed = null;
						$rootScope.userSearched = result.result;
						$rootScope.userSearched.birthDateDay = result.result.birthDay;
						$rootScope.userSearched.birthDateMonth = months[result.result.birthMonth];
						$rootScope.userSearched.birthDateYear = result.result.birthYear;
					}
					$window.location.href = "home#/search";
				} else {
					alert(result.error);
				}
			}, function (error) {
				$scope.error = error;
			});
			return promise.promise;
		}

		/**
		 * Logs out the currently signed in user.
		 */
		$scope.logout = function () {
			$http({
				method: 'GET',
				url: 'https://twitter-proto.herokuapp.com/auth/logout'
			}).then(function (result) {
				$window.location.href = '/';
			});
		}

		/**
		 * redirects the user to his home page.
		 * Action is initiated when user clicks the home button.
		 */
		$scope.home = function () {
			$window.location.href = '#/feed';
		}
	}]);

/**
 * SearchDisplayController displays the results of the search operation.
 */
app.controller("SearchDisplayController", ["$scope", "$window", "$rootScope", "userservice",
	function ($scope, $window, $rootScope, UserService) {

		/**
		 * listens an event whenever a search request in initiated.
		 * search request can either come from search box or from tweets hashtags.
		 */
		$scope.$on("searchDataReceived", function (event, searchData) {
			if (searchData.result === undefined) {
				$window.location.href = 'https://twitter-proto.herokuapp.com/auth/login';
			}
			if (searchData.type == 'tweets') {
				$scope.userSearched = null;
				$rootScope.userSearched = null;
				$scope.feed = searchData.result;
			} else {
				$scope.feed = null;
				$rootScope.searchFeed = null;
				var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
				$scope.userSearched = searchData.result;
				$scope.userSearched.birthDateDay = searchData.result.birthDay;
				$scope.userSearched.birthDateMonth = searchData.months[result.birthMonth];
				$scope.userSearched.birthDateYear = searchData.result.birthYear;
			}
		});

		/**
		 * initialization of the controller.
		 * used to pass data from SearchDisplayController.
		 */
		init = function () {
			$scope.feed = $rootScope.searchFeed;
			$scope.userSearched = $rootScope.userSearched;
		}

		/**
		 * A function that allows a user to follow another user.
		 */
		$scope.follow = function () {
			var promise = UserService.follow($scope.userSearched.twitterHandle);
			promise.then(function (result) {
				$scope.userSearched.isFollowed = true;
			}, function (error) {
				alert("Oops! some error occured!");
				//console.log("ERROR : " + error);
			});
		}

		/**
		 * Function that allows a user to unfollow some other user.
		 */
		$scope.unfollow = function () {
			var promise = UserService.unfollow($scope.userSearched.twitterHandle);
			promise.then(function (result) {
				$scope.userSearched.isFollowed = false;
			}, function (error) {
				alert("Oops! some error occured!");
				//console.log("ERROR : " + error);
			});
		}

		init();
	}]);

/**
 * app configuration to load different views each time in a single ng-view when a different url is hit.
 */
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

/**
 * Angular controller for home page of the user.
 */
app.controller("MainControl", ["$scope", "$window", function ($scope, $window) {
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

	/**
	 * A function that is used to redirect the user to login page if his session has expired.
	 */
	$scope.redirectLogin = function () {
		$window.location.href = "https://twitter-proto.herokuapp.com/auth/login"
	}
}]);

/**
 * Angular controller to show the user information in the left panel of the home page.
 */
app.controller("UserController", ["$scope", "$window", "userservice", function ($scope, $window, userservice) {

	/**
	 * sign-ups the user into the system
	 */
	$scope.signUp = function () {
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

		/**
		 * Function that sign-ups a user into the system.
		 */
		userservice.signUp(data).then(function (result) {
			$window.location.href = 'https://twitter-proto.herokuapp.com/auth/login';
		}, function (error) {
			alert("Some error occurred!");
			//console.log("ERROR : " + error);
		});
	}

	/**
	 * function that logins the user into the system.
	 */
	$scope.login = function () {
		$scope.invalidPassword = false;
		var data = {
			"twitterHandle": $scope.twitterHandle,
			"password": $scope.password
		}
		userservice.login(data).then(function () {
			$window.location.href = "https://twitter-proto.herokuapp.com/home#/feed";
		}, function (error) {
			$scope.invalidPassword = true;
			$scope.loginError = "Invalid Password";
			//console.log("Error in login : " + error);
		})
	}

	/**
	 * function that redirects the user to home page of the site.
	 * Used after user clicks logout.
	 */
	$scope.redirectHome = function () {
		$window.location.href = "https://twitter-proto.herokuapp.com/";
	}

	/**
	 * gets the user information about the currently logged in user from server and sets on current scope.
	 */
	$scope.getCurrentLoggedInUser = function () {
		if (!$scope.currentUser) {
			var promise = userservice.getCurrentLoggedInUser();
			promise.then(function (result) {
				$scope.currentUser = result;
			});
		}
	}
}]);


/**
 * angular directive for custom validation that the email ID is not already been taken.
 */
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

/**
 * angular directive for custom validation - if the twitterHandle has already been taken.
 */
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

