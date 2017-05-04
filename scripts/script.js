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
})

app.controller('LoginController', function ($scope,$rootScope) {
	$scope.title = "Login";
	$scope.users = ["Erika","Anna"];
});

app.controller('MessagesController', function ($scope,$rootScope) {
    $scope.title = "Messages";
    $scope.messages = ["Bla bla bla bla bla", "Blö blö blö blö blö", "Blä blä blä blä blä blä"];
});