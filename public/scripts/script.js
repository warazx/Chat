var app = angular.module('app', ['ngRoute', 'ngSanitize', 'btford.socket-io', 'luegg.directives','mgcrea.ngStrap','angular-smilies']);

app.factory('mySocket', function(socketFactory) {
    return socketFactory();
});

app.config(function ($routeProvider) {
    $routeProvider.when('/', {
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
    }).when('/signup', {
        controller: 'SignupController',
        templateUrl: 'partials/signup.html'
    }).when('/messages', {
        controller: 'MessagesController',
        templateUrl: 'partials/messages.html'
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
app.directive("contenteditable", function($rootScope) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function(scope, element, attrs, ngModel) {
            var maxLength = 255;
            function read() {
                ngModel.$setViewValue(element.html());
            }
            ngModel.$render = function () {
                element.html(ngModel.$viewValue || "");
            };
            element.bind("blur keyup change", function() {
                scope.$apply(read);
            });
            function limitText() {
                if (element.html().length >= maxLength) {
                    var transformedInput = element.html().substring(0, maxLength);
                    ngModel.$setViewValue(transformedInput);
                    ngModel.$render();
                    $rootScope.placeCaretAtEnd();
                    return transformedInput;
                }
                return element.html();
            }
            ngModel.$parsers.push(limitText);
        }
    };
});

//Which room (chatroom or direct message room) that the user is currently in
app.value('currentRoom', {});

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
    console.log("Hej jag är Leftsidecontroller.");
	$http.get('chatrooms').then(function (response) {
		$scope.chatrooms = response.data;
	});
    /*
    //get list of users with which we have had a conversation
    $http({
        url: "/conversations",
        method: "GET",
        params: {"userId": $rootScope.user.id}
    }).then(function(response) {
        $rootScope.messages = response.data;
    });
    */
    $scope.changeChatroom = function(index) {
        $location.path('/messages');
        $rootScope.isPrivate = false;
        $rootScope.selected = index;
        console.log("$rootScope.selected: ", $rootScope.selected);
        //Leave chatroom if already in one. Not sure if this should just be on the server side?
        if($rootScope.selectedChatroom) {
            mySocket.emit('leave chatroom', $rootScope.selectedChatroom);
        }
        $rootScope.selectedChatroom = this.chatroom._id;
        $http({
            url: "/messages",
            method: "GET",
            params: {"chatroom": $rootScope.selectedChatroom},
        }).then(function(response) {
            $rootScope.messages = response.data;
        });
        mySocket.emit('join chatroom', $rootScope.selectedChatroom);
        document.getElementById('my-message').focus();
    };
});

app.controller('RightSideController', function ($http, $window, $location, $scope, $rootScope, mySocket, currentRoom) {
	$scope.goToSettings = function(){
		$location.path('/settings');
	};
    $rootScope.userLogout = function() {
        $http.get('/logout');
        mySocket.disconnect();
        $rootScope.user = null;
        $rootScope.showMenu = false;
        $location.path('/');
    };
    $scope.changeRecipient = function changeRecipient(index) {
        $rootScope.isPrivate = true;
        currentRoom = this;
        $rootScope.selected = index;
        $rootScope.privateRecipient = this.user;
        if (!$rootScope.user) {
            console.log("User not logged in! Redirecting to login.");
            $location.path('/');
        } else {
            $location.path('/messages');
            $http({
                url: '/messages',
                method: "GET",
                params: {user: $rootScope.user.id, otheruser: $rootScope.privateRecipient.id}
            }).then(function(response) {
                $rootScope.messages = response.data;
            });
            document.getElementById('my-message').focus();
        }
    };
});

app.controller('SignupController', function ($scope, $rootScope, $location, signupManager) {
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

app.controller('LoginController', function ($window, $scope, $rootScope, $location, loginManager) {
    $scope.errorMessage = "";
    $scope.userLogin = function() {
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.password === undefined) {
            console.log('Invalid logininformation.');
            $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
        } else {
            loginManager.loginRequest($scope.login.username, $scope.login.password).then(function(res) {
                console.log('Login successful.');
                $rootScope.isPrivate = false;
                //For test
                $rootScope.hasJustLoggedIn = true;
                $rootScope.user = {
                    id: res.data._id,
                    name: res.data.username
                };
                $location.path(res.data.redirect); //Redirects to /messages.
                $rootScope.showMenu = true;
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
    //Shows error message in empty chatrooms/conversations when $rootScope.messages is empty.
    $rootScope.$watch('messages', function () {
        if (!$rootScope.messages || $rootScope.messages.length <= 0) {
            $scope.noMessages = true;
        } else {
            $scope.noMessages = false;
        }
    }, true);

    //Checks if user object exist on rootScope and if not, redirects to loginpage.
    if (!$rootScope.user) {
        console.log("User not logged in! Redirecting to login.");
        $location.path('/');
    } else {
        if($rootScope.hasJustLoggedIn) {
            mySocket.connect();
            mySocket.on('chatroom message', function(msg) {
                console.log("I got a chatroom message!");
                $rootScope.messages.push(msg);
            });
            mySocket.on('private message', function(message) {
                if($rootScope.privateRecipient) {
                    if(message.senderId == $rootScope.privateRecipient.id || message.senderId == $rootScope.user.id) {
                        $rootScope.messages.push(message);
                    } else {
                        //TODO: mark sender in user list
                    }
                }
            });
            mySocket.on('connect message', function(msg) {
                $rootScope.statusMessage = msg;
            });
            mySocket.on('disconnect message', function(msg) {
                $rootScope.statusMessage = msg;
            });
            mySocket.on('active users', function(arr) {
                $rootScope.users = arr;
            });

            //send $rootScope.user to server.js, it receives it with socket.on('connected')
            mySocket.emit('connected', $rootScope.user);
            mySocket.emit('connect message', {date: new Date(), text: $rootScope.user.name + " har loggat in."});
            $rootScope.hasJustLoggedIn = false;
            $rootScope.selected = "591d5683f36d281c81b1e5ea";
            $rootScope.selectedChatroom = "591d5683f36d281c81b1e5ea";   //"General"
            mySocket.emit('join chatroom', $rootScope.selectedChatroom);
            $http({
                url: "/messages",
                method: "GET",
                params: {chatroom: "591d5683f36d281c81b1e5ea"} //This is the chatroom "General"
            }).then(function(response) {
                $rootScope.messages = response.data;
            });
        }

        document.getElementById('my-message').focus();
        document.getElementById('my-message').onkeypress=function(e){
            //keyCode 13 is the enter key
            if(e.keyCode==13 && !e.shiftKey){
                //prevents a new line from being written when only the enter key is pressed
                e.preventDefault();
                if($scope.textMessage !== "" && $scope.textMessage != "<br>") {
                    if($rootScope.isPrivate) {
                        console.log("I'm gonna post a private message!");
                        $scope.postPrivateMessage();
                    } else {
                        console.log("I'm gonna post a chatroom message!");
                        $scope.postMessage();
                    }
                    $scope.textMessage = "";
                    document.getElementById('my-message').focus();
                }
            }
        };

        $scope.postMessage = function() {
            var newMessage = {
                "senderId": $rootScope.user.id,
                "senderName": $rootScope.user.name,
                "timestamp": new Date(),
                "text": $scope.textMessage,
                "chatroom": $rootScope.selectedChatroom
            };
            //Send message to the current chatroom
            console.log("newMessage: ", newMessage);
            mySocket.emit('chatroom message', newMessage);
            $http.post('/messages', newMessage);
            return false;
        };

        $rootScope.placeCaretAtEnd = function() {
            var element = document.getElementById('my-message');
            element.focus();
            if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
                var range = document.createRange();
                range.selectNodeContents(element);
                range.collapse(false);
                var sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (typeof document.body.createTextRange != "undefined") {
                var textRange = document.body.createTextRange();
                textRange.moveToElementText(element);
                textRange.collapse(false);
                textRange.select();
            }
        };

        $scope.postPrivateMessage = function() {
            var newPrivateMessage = {
                "senderId": $rootScope.user.id,
                "senderName": $rootScope.user.name,
                "timestamp": new Date(),
                "text": $scope.textMessage,
                "recipientId": $rootScope.privateRecipient.id,
                "recipientName": $rootScope.privateRecipient.name
            };
            //Send a direct private message. socket.io needs the socketId to know where to send it.
            newPrivateMessage.socketId = $rootScope.privateRecipient.socketId;
            mySocket.emit('private message', newPrivateMessage);
            //Post the message to the database
            newPrivateMessage.socketId = undefined;
            $http.post('/private-messages', newPrivateMessage);
        };
    }
});
