var app = angular.module('app', ['ngRoute']);

app.config(function ($routeProvider) {
    $routeProvider.when('/login', {
        controller: 'FirstController',
        templateUrl: 'partials/login.html'
    }).when('/chat', {
        controller: 'SecondController',
        templateUrl: 'partials/chat.html'
    });
});

app.controller('FirstController', function ($scope,$rootScope) {
	$scope.name = "Apa";
	$scope.users = ["Erika","Anna"];
});

app.controller('SecondController', function ($scope,$rootScope) {
   
	
});