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

//Code from http://fdietz.github.io/recipes-with-angular-js/common-user-interface-patterns/editing-text-in-place-using-html5-content-editable.html
//Makes a div with contenteditable usable with ng-model
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

app.factory('signupManager', function($http) {
    return {
        signupRequest: function(signupCredentials) {
            return $http.post('signup', signupCredentials);
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
        //Shorten?
        if ($scope.signup === undefined || $scope.signup.email === undefined || $scope.signup.username === undefined || $scope.signup.password === undefined) {
            var message = "";
            if($scope.signup.username === undefined) message += "Du måste välja ett användarnamn som innehåller minst tre tecken och max 20 tecken." +
            "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
            if($scope.signup.email === undefined) message += "\nFelaktig emailadress.";
            if($scope.signup.password === undefined) message += "\nDu måste välja ett lösenord som innehåller minst sex tecken och max 50 tecken.";
            $scope.errorMessage = message;
        } else {
            signupManager.signupRequest({
                username: $scope.signup.username,
                email: $scope.signup.email,
                password: $scope.signup.password
            }).then(function(res) { //Successful codes 100-399.
                console.log("Signup OK. Redirecting to login.");
                $location.path(res.data.redirect);
            }, function(res) { //Failed codes 400-599+?
                console.log("Signup failed.");
                switch(res.data.reason) {
                    case "username":
                        $scope.errorMessage = "Användarnamnet är upptaget.";
                        break;
                    case "email":
                        $scope.errorMessage = "Emailadressen är redan registrerad.";
                        break;
                    default:
                        $scope.errorMessage = "Det blev lite fel!";
                }
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
