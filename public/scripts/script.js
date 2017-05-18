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
        /*auth: function(user) {
            return user;
        }*/
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

app.run(function($rootScope, $location, $interval, $http, mySocket) {
    /*$rootScope.$on('$routeChangeStart', function(ev, next, curr) {
        if (next.$$route) {
            var user = $rootScope.user;
            var auth = next.$$route.auth;
            if (auth && !auth(user)) {
                $location.path("/");
            }
        }
    });*/
    mySocket.on('disconnect message', function(msg) {
        $rootScope.statusMessage = msg;
    });
    mySocket.on('active users', function(arr) {
        $rootScope.users = arr;
    });
    /*$interval(function() {
        $http.post('/heartbeat', {name: $rootScope.user.name});
    }, 1000*60*5);*/
});

app.factory('loginManager', function($http) {
    return {
        loginRequest: function(username, password) {
            return $http.get('login/' + username + '/' + password);
        }
    };
});

/*app.factory('userManager', function($http, $q) {
    return {
        getActiveUsers: function() {
            return $q(function(resolve) {
                $http.get('./activeUsers').then(function(response) {
                    resolve(response.data);
                });
            });
        }
    };
});*/

app.controller('SideController', function ($interval, $window, $location, $scope, $rootScope, mySocket) {
    //Gets all current active users from the server.
    $rootScope.userLogout = function() {
        $location.path('/');
        mySocket.disconnect();
        $rootScope.user = null;
        $rootScope.showMenu = false;
    };
});

app.controller('LoginController', function ($window, $scope, $rootScope, $location, mySocket, loginManager) {
    $scope.errorMessage = "";
    $scope.userLogin = function() {
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.password === undefined) {
            console.log('Invalid logininformation.');
            $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
        } else {
            loginManager.loginRequest($scope.login.username, $scope.login.password).then(function(res) {

                console.log('Login succed.');
                $rootScope.user = {
                    id: res.data._id,
                    name: res.data.username
                };
                $location.path(res.data.redirect);
                $rootScope.showMenu = true;
                mySocket.emit('connected', $rootScope.user.name);
                mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat in."});

                /*if (response.redirect) {
                    console.log('i got here');
                    $scope.errorMessage = "";
                    $location.path(response.redirect);
                    $rootScope.showMenu = true;
                    $rootScope.user = {
                        name: $scope.login.username
                    };
                    mySocket.emit('connected', $rootScope.user.name);
                    mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat in."});
                } else {
                    $scope.errorMessage = response.errorMsg;
                    console.log($scope.errorMessage);
                }*/
            }, function(res) {
                $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
            });
        }
    };
});

app.controller('MessagesController', function ($scope,$rootScope, $http, $location, mySocket) {
    //Checks if user object exist on rootScope and if not, redirects to loginpage.
    if (!$rootScope.user) {
        console.log("User not logged in! Redirecting to login.");
        $location.path('/');
    } else {
        $http.get('/messages').then(function(response) {
            $rootScope.messages = response.data;
        });
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
            $http.post('/messages', {sender: $rootScope.user.name, text: $scope.textMessage});
            mySocket.emit('broadcast message', newMessage);
            $scope.textMessage = "";
            document.getElementById('my-message').focus();
            currentId++;

            return false;
        };
    }
});
