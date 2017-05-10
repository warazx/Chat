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

app.run(function($rootScope, $location, $http, mySocket) {
    $rootScope.$on('$routeChangeStart', function(ev, next, curr) {
        if (next.$$route) {
            var user = $rootScope.user;
            var auth = next.$$route.auth;
            if (auth && !auth(user)) {
                $location.path("/");
            }
        }
    });
    mySocket.on('disconnect message', function(msg) {
        $rootScope.statusMessage = msg;
    });
});

app.controller('SideController', function ($window, $scope, $rootScope, users, mySocket) {
    $scope.users = users;

    $rootScope.userLogout = function() {
        mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat ut."});
        $window.location.href = "/logout/" + $rootScope.user.name;
        $rootScope.showMenu = false;
    };
});

app.controller('LoginController', function ($scope, $rootScope, $location, users, mySocket) {
    $scope.users = users;
    $scope.errorMessage = "";
    $scope.userLogin = function(login) {
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.username === "") {
            $scope.errorMessage = "Du måste välja ett användarnamn!";
        } else {
            //Check that username is not already in use by another user.
            for (var i = 0; i < users.length; i++) {
                if ($scope.login.username.toUpperCase() == users[i].name.toUpperCase()) {
                    if (users[i].isUserOnline) {
                        $scope.errorMessage = "Användarnamnet är upptaget. \nVänligen välj ett annat användarnamn.";
                    } else {
                        users[i].isUserOnline = true;
                        $rootScope.user = users[i];
                        $location.path("/messages");
                        mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat in."});
                        $rootScope.showMenu = true;
                    }
                }
            }
        }
    }
});

app.controller('MessagesController', function ($scope, $rootScope, $http, users, mySocket) {
    $http.get('/messages').then(function(response) {
        $rootScope.messages = response.data;
    });
    $scope.users = users;
    $scope.title = "Messages";
    $rootScope.messages = [];
    document.getElementById('my-message').focus();

    mySocket.on('broadcast message', function(msg){
        $rootScope.messages.push(msg);
    });

    mySocket.on('connect message', function(msg) {
        $rootScope.statusMessage = msg;
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
        $http.post('/messages', {sender: $rootScope.user.name, text: $scope.textMessage});
        mySocket.emit('broadcast message', newMessage);
        $scope.textMessage = "";
        document.getElementById('my-message').focus();
        currentId++;

        return false;
    };
});