var app = angular.module('app', ['ngRoute']);

app.config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    }).when('/messages', {
        controller: 'MessagesController',
        templateUrl: 'partials/messages.html'
    }).otherwise({
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    });
});

app.controller('MainController', function ($scope, $rootScope) {
    $scope.users = ["Leif", "Oleg", "Vaaa"];
});

app.controller('LoginController', function ($scope,$rootScope) {
	$scope.title = "Login";
	$scope.users = ["Erika","Anna"];
});

app.controller('MessagesController', function ($scope,$rootScope) {
    $scope.title = "Messages";
    $scope.messages = [];

    var currentId = 0; //Temp
    $scope.postMessage = function() {
      $scope.messages.push({
        id : currentId,
        text : $scope.textMessage,
        date : Date.now(),
        isPrivateMessage : false,
        sender : 0, //User-ID
        receiver : 0 //UserID / ChatRoomID
      });
      currentId++;
    };
});
