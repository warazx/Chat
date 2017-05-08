var app = angular.module('app', ['ngRoute']);

app.value('users', [
    {
        id : 1,
        name : "1337Leif",
        isUserOnline : false,
        messages : []
    },
    {
        id : 2,
        name : "RegExRolf",
        isUserOnline : false,
        messages : [] },
    {
        id : 3,
        name : "BooleanBob",
        isUserOnline : true,
        messages : []
    },
    {
        id : 4,
        name : "ErrorEmil",
        isUserOnline : true,
        messages : []
    },
    {
        id : 5,
        name : "SyntaxScotty",
        isUserOnline : false,
        messages : []
    },
    {
        id : 6,
        name : "ForLoopFred",
        isUserOnline : false,
        messages : []
    },
    {
        id : 7,
        name : "OutOfBoundsBoerjesson",
        isUserOnline : false,
        messages : []
    }
]);

app.config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    }).when('/messages', {
        controller: 'MessagesController',
        templateUrl: 'partials/messages.html',
        auth: function(user) {
            return user
        }
    }).otherwise({
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    });
});

app.run(function($rootScope, $location) {
    $rootScope.$on('$routeChangeStart', function(ev, next, curr) {
        if (next.$$route) {
            var user = $rootScope.user;
            var auth = next.$$route.auth;
            if (auth && !auth(user)) {
                $location.path("/");
            }
        }
    })
    $rootScope.isSideHidden = function(viewLocation) {
        var hidden = (viewLocation === $location.path());
        return hidden;
    }
});

app.controller('SideController', function ($scope, $rootScope, users) {
    $scope.users = users;
})

app.controller('LoginController', function ($scope, $rootScope, $location, users) {
	$scope.users = users;
    $scope.userLogin = function(login) {
        //Check that username is not already in use by another user.
        for (var i = 0; i < users.length; i++) {
            if ($scope.login.username == users[i].name) {
                if (users[i].isUserOnline) {
                    alert('User is already logged in. Log in using a different username.');
                } else {
                    users[i].isUserOnline = true;
                    $rootScope.user = users[i];
                    $location.path("/messages");
                }
            }
        }
    }
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