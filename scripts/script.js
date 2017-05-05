var app = angular.module('app', ['ngRoute']);

app.value('users', [
  { id : 1,
  name : "1337Leif",
  isUserOnline : true,
  messages : [] },
  { id : 2,
  name : "RegExRolf",
  isUserOnline : true,
  messages : [] },
  { id : 3,
  name : "BooleanBob",
  isUserOnline : true,
  messages : [] },
  { id : 4,
  name : "ErrorEmil",
  isUserOnline : true,
  messages : [] },
  { id : 5,
  name : "SyntaxScotty",
  isUserOnline : true,
  messages : [] },
  { id : 6,
  name : "ForLoopFred",
  isUserOnline : false,
  messages : [] },
  { id : 7,
  name : "OutOfBoundsBoerjesson",
  isUserOnline : false,
  messages : [] }
]);

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

app.controller('SideController', function ($scope, $rootScope, users) {
  $scope.users = users;
})

app.controller('LoginController', function ($scope, $rootScope, users) {
	$scope.users = users;
});

app.controller('MessagesController', function ($scope,$rootScope) {
    $scope.title = "Messages";
    $scope.messages = ["Bla bla bla bla bla", "Blö blö blö blö blö", "Blä blä blä blä blä blä"];
});
