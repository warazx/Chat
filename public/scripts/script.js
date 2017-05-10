var app = angular.module('app', ['ngRoute', 'ngSanitize', 'btford.socket-io', 'luegg.directives']);

app.factory('mySocket', function(socketFactory) {
    return socketFactory();
});

app.config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    }).when('/messages', {
        controller: 'MessagesController',
        templateUrl: 'partials/messages.html',
        auth: function(user) {
            return user;
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

//Code not working with new server login handler. Delete?
/*
app.run(function($rootScope, $location, mySocket) {
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
        $rootScope.messages.push(msg);
    });
});
});
*/


app.factory('loginManager', function($http, $q) {
    return {
        loginRequest: function(username) {
            return $q(function(resolve) {
                $http.get('./login/' + username).then(function(response) {
                    resolve(response.data);
                });
            });
        }
    };
});

app.factory('userManager', function($http, $q) {
    return {
        getActiveUsers: function() {
            return $q(function(resolve) {
                $http.get('./activeUsers').then(function(response) {
                    resolve(response.data);
                });
            });
        }
    };
});

app.controller('SideController', function ($interval, $window, $scope, $rootScope, userManager, mySocket ) {
    //Gets all current active users from the server.
    $interval(function () {
        userManager.getActiveUsers().then(function(response) {
            $scope.users = response;
            console.log('new req');
        });
    }, 1000);

    $rootScope.userLogout = function() {
        var disconnectMsg = {
            "sender": $rootScope.user.name,
            "date": new Date(),
            "text": $rootScope.user.name + " har loggat ut."
        };
        mySocket.emit('disconnect message' , disconnectMsg);
        $window.location.href = "/logout/" + $rootScope.user.name;
        $rootScope.showMenu = false;
    };
});

app.controller('LoginController', function ($window, $scope, $rootScope, $location, loginManager) {
    $scope.errorMessage = "";
    $scope.userLogin = function(login) {
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.username === "") {
            $scope.errorMessage = "Du måste välja ett användarnamn!";
        } else {

            loginManager.loginRequest($scope.login.username).then(function(response) {

                if (response.redirect) {
                    console.log('i got here');
                    $scope.errorMessage = "";
                    $location.path(response.redirect);
                    $rootScope.showMenu = true;
                    $rootScope.user = {
                        name: $scope.login.username
                    };
                } else {
                    $scope.errorMessage = response.errorMsg;
                    console.log($scope.errorMessage);
                }
            });
        }
    };
});


app.controller('MessagesController', function ($scope,$rootScope, mySocket) {
    //$scope.users = users;
    $scope.title = "Messages";
    $rootScope.messages = [];
    document.getElementById('my-message').focus();

    mySocket.on('broadcast message', function(msg){
        console.log(msg);
        $rootScope.messages.push(msg);
    });

    document.getElementById('my-message').onkeypress=function(e){
        //keyCode 13 is the enter key
        if(e.keyCode==13 && !e.shiftKey){
            e.preventDefault();
            if($scope.textMessage !== "" && $scope.textMessage != "<br>") {
                $scope.postMessage();
            }
        }
    };

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
