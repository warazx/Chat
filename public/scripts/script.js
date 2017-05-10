var app = angular.module('app', ['ngRoute', 'ngSanitize', 'btford.socket-io', 'luegg.directives']);

app.factory('mySocket', function(socketFactory) {
    return socketFactory();
});

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
    }).when('/settings', {
        controller: 'SettingsController',
        templateUrl: 'partials/settings.html',
    });
});

//snodd kod från http://fdietz.github.io/recipes-with-angular-js/common-user-interface-patterns/editing-text-in-place-using-html5-content-editable.html
app.directive("contenteditable", function() {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {

            function read() {
                ngModel.$setViewValue(element.html());
            }

            ngModel.$render = function() {
                element.html(ngModel.$viewValue || "");
            };

            element.bind("blur keyup change", function() {
                scope.$apply(read);
            });
        }
    };
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
});

app.controller('SideController', function ($window, $scope, $rootScope, users) {
    $scope.users = users;

    $scope.userLogout = function() {
        console.log("baaad");
        $window.location.href = "/";
        $rootScope.showMenu = false;
    };
});

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
                    $rootScope.showMenu = true;
                }
            }
        }
    }
});

app.controller('SettingsController', function ($scope, $rootScope, $location, users){
	
});

app.controller('MessagesController', function ($scope,$rootScope, users, mySocket) {
    $scope.users = users;
    $scope.title = "Messages";
    $scope.messages = [];
    document.getElementById('my-message').focus();

    mySocket.on('broadcast message', function(msg){
        console.log(msg);
        $scope.messages.push(msg);
    });

    document.getElementById('my-message').onkeypress=function(e){
        //keyCode 13 is the enter key
        if(e.keyCode==13 && !e.shiftKey){
            e.preventDefault();
            if($scope.textMessage != "" && $scope.textMessage != "<br>") {
                $scope.postMessage();
            }
        }
    }

    var currentId = 0; //Temp
    $scope.postMessage = function() {
        var newMessage = {
            "sender": $rootScope.user.name,
            "date": new Date(),
            "text": $scope.textMessage
        };
        mySocket.emit('broadcast message', newMessage);
        $scope.textMessage = "";
        document.getElementById('my-message').focus();
        currentId++;

        return false;
    };
});