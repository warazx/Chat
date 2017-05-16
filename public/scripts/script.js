var app = angular.module('app', ['ngRoute', 'ngSanitize', 'btford.socket-io', 'luegg.directives']);

app.factory('mySocket', function(socketFactory) {
    return socketFactory();
});

app.config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    }).when('/signup', {
        controller: 'SignupController',
        templateUrl: 'partials/signup.html',
    }).when('/messages', {
        controller: 'MessagesController',
        templateUrl: 'partials/messages.html',
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

//Not tested with endpoint. Results in error message! Working?
app.factory('signupManager', function($http, $q) {
    return {
        signupRequest: function(signupCredentials) {
            return $q(function(resolve) {
                $http.post('./signup/', signupCredentials).then(function(response) {
                    resolve(response.data);
                });
            });
        }
    };
});

app.controller('LeftSideController', function ($interval, $window, $location, $scope, $rootScope, mySocket) {
    // Temporary array of chatrooms.
    $scope.chatrooms = [{name: "general"}, {name: "leif"}, {name: "offtopic"}, {name: "sports"}];
});

app.controller('RightSideController', function ($interval, $window, $location, $scope, $rootScope, mySocket) {
    $rootScope.userLogout = function() {
        $location.path('/');
        mySocket.disconnect();
        $rootScope.user = null;
        $rootScope.showMenu = false;
    };
});

app.controller('SignupController', function ($scope, $rootScope, $location, signupManager, mySocket) {
    $scope.errorMessage = "";
    $scope.userSignup = function() {
        if ($scope.signup === undefined || $scope.signup.email === undefined || $scope.signup.username === undefined || $scope.signup.password === undefined ||
            $scope.signup.username === "" || $scope.signup.email === "" || $scope.signup.password === "") {
            $scope.errorMessage = "Du måste välja ett användarnamn som innehåller minst tre tecken och max tjugo tecken." +
            "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
        } else {
            signupManager.signupRequest({
                username: $scope.signup.username,
                email: $scope.signup.email,
                password: $scope.signup.password
            }).then(function(response) {
                //TO-DO: Handle response. This code may change.
                /*
                if (res.redirect) {
                    $scope.errorMessage = "";
                    $location.path(response.redirect);
                    $rootScope.showMenu = true;
                    $rootScope.user = {
                        name: $scope.login.username
                    };
                    mySocket.emit('connected', $rootScope.user.name);
                    mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat in."});
                } else {
                    //$scope.errorMessage = err.errorMsg;
                }
                */
            });
        }
    };
});

app.controller('LoginController', function ($window, $scope, $rootScope, $location, mySocket, loginManager) {
    $scope.errorMessage = "";
    $scope.userLogin = function() {
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.username === "") {
            $scope.errorMessage = "Du måste välja ett användarnamn som innehåller minst tre tecken och max tjugo tecken." +
                "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
        } else {
            loginManager.loginRequest($scope.login.username).then(function(response) {
                if (response.redirect) {
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
                }
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
