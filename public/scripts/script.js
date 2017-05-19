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
        auth: function(user) {
            return user;
        }
    }).when('/settings', {
        controller: 'SettingsController',
        templateUrl: 'partials/settings.html'
    }).when('/private-messages', {
        controller: 'PrivateMessagesController',
        templateUrl: 'partials/messages.html'
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

//Which room (chatroom or direct message room) that the user is currently in
app.value('currentRoom', {});

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

app.factory('loginManager', function($http) {
    return {
        loginRequest: function(username, password) {
            return $http.get('login/' + username + '/' + password);
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

app.controller('LeftSideController', function ($interval, $window, $location, $scope, $rootScope, mySocket, $http) {
	$http.get('chatrooms').then(function (response) {
		$scope.chatrooms = response.data;
	});
});


app.controller('RightSideController', function ($http, $window, $location, $scope, $rootScope, mySocket, currentRoom) {
    $rootScope.userLogout = function() {
        $http.get('/logout');
        mySocket.disconnect();
        $rootScope.user = null;
        $rootScope.showMenu = false;
        $location.path('/');
    };
    $scope.changeRecipient = function changeRecipient(index) {
        currentRoom = this;
        console.log(this);
        $rootScope.selected = index;
        $location.path('/private-messages');
        $rootScope.privateRecipient = this.user;
        if (!$rootScope.user) {
            console.log("User not logged in! Redirecting to login.");
            $location.path('/');
        } else {
            $http({
                url: '/private-messages',
                method: "GET",
                params: {user: $rootScope.user.id, otheruser: $rootScope.privateRecipient.id}
            }).then(function(response) {
                $rootScope.messages = response.data;
            });
        }
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
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.password === undefined) {
            console.log('Invalid logininformation.');
            $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
        } else {
            loginManager.loginRequest($scope.login.username, $scope.login.password).then(function(res) {
                console.log('Login successful.');
                $rootScope.user = {
                    id: res.data._id,
                    name: res.data.username
                };
                $location.path(res.data.redirect); //Redirects to /messages.
                $rootScope.showMenu = true;
                //send $rootScope.user to server.js, it receives it with socket.on('connected')
                mySocket.emit('connected', $rootScope.user);
                mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat in."});
            }, function(res) {
                console.log('Login failed on server.');
                $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
            });
        }
    };
});

app.controller('SettingsController', function ($scope, $rootScope, $location, users){

});

app.controller('MessagesController', function ($scope, $rootScope, $http, $location, mySocket) {
    //Checks if user object exist on rootScope and if not, redirects to loginpage.
    if (!$rootScope.user) {
        console.log("User not logged in! Redirecting to login.");
        $location.path('/');
    } else {
        $rootScope.messages = [];
        $http.get('/messages').then(function(response) {
            $rootScope.messages = response.data;
        });
        document.getElementById('my-message').focus();
        mySocket.on('broadcast message', function(msg){
            $rootScope.messages.push(msg);
        });
        mySocket.on('connect message', function(msg) {
            $rootScope.statusMessage = msg;
        });

        document.getElementById('my-message').focus();
        document.getElementById('my-message').onkeypress=function(e){
            //keyCode 13 is the enter key
            if(e.keyCode==13 && !e.shiftKey){
                e.preventDefault();
                if($scope.textMessage !== "" && $scope.textMessage != "<br>") {
                    $scope.postMessage();
                }
            }
        };

        $scope.postMessage = function() {
            var newMessage = {
                "sender": $rootScope.user.id,
                "timestamp": new Date(),
                "text": $scope.textMessage
            };
            $http.post('/messages', {sender: $rootScope.user.id, text: $scope.textMessage});
            mySocket.emit('broadcast message', newMessage);
            $scope.textMessage = "";
            document.getElementById('my-message').focus();
            return false;
        };
    }
});

app.controller('PrivateMessagesController', function($rootScope, $scope, $http, $location) {
    if (!$rootScope.user) {
        console.log("User not logged in! Redirecting to login.");
        $location.path('/');
    } else {
        //this code is duplicated in MessagesController. Refactor?
        document.getElementById('my-message').focus();
        document.getElementById('my-message').onkeypress=function(e){
            //keyCode 13 is the enter key
            if(e.keyCode==13 && !e.shiftKey){
                //prevents a new line from being written when only the enter key is pressed
                e.preventDefault();
                if($scope.textMessage !== "" && $scope.textMessage != "<br>") {
                    $scope.postPrivateMessage();
                }
            }
        };
        $scope.postPrivateMessage = function() {
            var newPrivateMessage = {
                "sender": $rootScope.user.id,
                "recipient": $rootScope.privateRecipient.id,
                "timestamp": new Date(),
                "text": $scope.textMessage
            };
            $http.post('/private-messages', newPrivateMessage);
            $scope.textMessage = "";
            document.getElementById('my-message').focus();
        };
    }
});
