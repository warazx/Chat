var app = angular.module('app', ['ngRoute', 'ngSanitize', 'btford.socket-io', 'luegg.directives', 'mgcrea.ngStrap', 'angular-smilies', 'lr.upload']);

app.value('whistleAudio', new Audio('sounds/whistle.mp3'));

app.factory('mySocket', function (socketFactory) {
    return socketFactory();
});

app.factory('userManager', function ($http) {
    var userManager = {};

    userManager.login = function (username, password) {
        return $http.get('login/' + username + '/' + password);
    };

    userManager.logout = function () {
        return $http.get('/logout');
    };

    userManager.signupuser = function (signupCredentials) {
        return $http.post('signup', signupCredentials);
    };

    userManager.updateUsername = function (newUsername) {
        return $http.post('/users/update', newUsername);
    };
    return userManager;
});

app.factory('messageManager', function ($http) {
    var messageManger = {};

    messageManger.getChatrooms = function () {
        return $http.get('chatrooms');
    };
    messageManger.postMessages = function (newMessage) {
        return $http.post('/messages', newMessage);
    };

    messageManger.postPrivateMessages = function (newPrivateMessage) {
        return $http.post('/private-messages', newPrivateMessage);
    };
    return messageManger;
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
    });
});

//Code from http://fdietz.github.io/recipes-with-angular-js/common-user-interface-patterns/editing-text-in-place-using-html5-content-editable.html
//Makes a div with contenteditable usable with ng-model
app.directive("contenteditable", function ($rootScope) {
    return {
        restrict: "A",
        require: "ngModel",
        link: function (scope, element, attrs, ngModel) {
            var maxLength = 255;
            function read() {
                ngModel.$setViewValue(element.html());
            }
            ngModel.$render = function () {
                element.html(ngModel.$viewValue || "");
            };
            element.bind("blur keyup change", function () {
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


app.controller('LeftSideController', function ($location, $scope, $rootScope, mySocket, $http, messageManager) {
    messageManager.getChatrooms().then(function (response) {
        $scope.chatrooms = response.data;
    });
    //get list of users with which we have had a conversation
    $http({
        url: "/conversations",
        method: "GET",
        params: { "userid": $rootScope.user.id }
    }).then(function (response) {
        $rootScope.conversations = response.data;
    });
    $scope.changeChatroom = function (index) {
        $location.path('/messages');
        $rootScope.isPrivate = false;
        $rootScope.selected = index;
        $rootScope.privateRecipient = undefined;
        //Leave chatroom if already in one.
        if ($rootScope.selectedChatroom) {
            mySocket.emit('leave chatroom', $rootScope.selectedChatroom);
        }
        $rootScope.selectedChatroom = this.chatroom._id;
        $http({
            url: "/messages",
            method: "GET",
            params: { "chatroom": $rootScope.selectedChatroom },
        }).then(function (response) {
            $rootScope.messages = response.data;
        });
        mySocket.emit('join chatroom', $rootScope.selectedChatroom);
    };
});

app.controller('RightSideController', function ($http, $location, $scope, $rootScope, mySocket, userManager) {
    $scope.goToSettings = function () {
        $location.path('/settings');
        if ($rootScope.selectedChatroom) {
            mySocket.emit('leave chatroom', $rootScope.selectedChatroom);
            $rootScope.selectedChatroom = null;
            $rootScope.selected = null;
        }
    };
    $rootScope.userLogout = function () {
        userManager.logout();
        mySocket.disconnect();
        mySocket.removeAllListeners();
        $rootScope.user = null;
        $rootScope.showMenu = false;
        $location.path('/');
    };
    $rootScope.changeRecipient = function changeRecipient(index) {
        $rootScope.isPrivate = true;
        $rootScope.selected = index;
        $rootScope.privateRecipient = this.user;
        if ($rootScope.newMessages.includes(this.user.id)) {
            $rootScope.newMessages.splice($rootScope.newMessages.indexOf(this.user.id), 1);
        }
        if (!$rootScope.user) {
            console.log("User not logged in! Redirecting to login.");
            $location.path('/');
        } else {
            $location.path('/messages');
            $http({
                url: '/messages',
                method: "GET",
                params: { user: $rootScope.user.id, otheruser: $rootScope.privateRecipient.id }
            }).then(function (response) {
                $rootScope.messages = response.data;
            });
            document.getElementById('my-message').focus();
        }
    };
});

app.controller('SignupController', function ($scope, $rootScope, $location, userManager) {
    $scope.errorMessage = "";
    $scope.userSignup = function () {
        if ($scope.signup === undefined || $scope.signup.email === undefined || $scope.signup.username === undefined || $scope.signup.password === undefined || $scope.signup.passwordagain === undefined) {
            var message = "";
            if ($scope.signup.username === undefined) message += "Du måste välja ett användarnamn som innehåller minst tre tecken och max 20 tecken." +
                "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
            if ($scope.signup.email === undefined) message += "\nFelaktig emailadress.";
            if ($scope.signup.password === undefined) message += "\nDu måste välja ett lösenord som innehåller minst sex tecken och max 50 tecken.";
            $scope.errorMessage = message;
        } else if($scope.signup.password !== $scope.signup.passwordagain) {
            $scope.errorMessage = "Du skrev in lösenordet olika i de två fälten.";
        } else {
            userManager.signupuser({
                username: $scope.signup.username,
                email: $scope.signup.email,
                password: $scope.signup.password
            }).then(function (res) { //Successful codes 100-399.
                console.log("Signup OK. Redirecting to login.");
                $location.path(res.data.redirect);
            }, function (res) { //Failed codes 400-599+?
                console.log("Signup failed.");
                switch (res.data.reason) {
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

app.controller('LoginController', function ($scope, $rootScope, $location, userManager) {
    $scope.errorMessage = "";
    $scope.userLogin = function () {
        if ($scope.login === undefined || $scope.login.username === undefined || $scope.login.password === undefined) {
            console.log('Invalid logininformation.');
            $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
        } else {
            userManager.login($scope.login.username, $scope.login.password).then(function (res) {
                console.log('Login successful.');
                $rootScope.isPrivate = false;
                $rootScope.user = {
                    id: res.data._id,
                    name: res.data.username
                };
                $location.path(res.data.redirect); //Redirects to /messages.
                $rootScope.showMenu = true;
            }, function (res) {
                console.log('Login failed on server.');
                $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
            });
        }
    };
});

app.controller('MessagesController', function ($scope, $rootScope, $http, $location, mySocket, messageManager, whistleAudio) {
    //Shows error message in empty chatrooms/conversations when $rootScope.messages is empty.
    mySocket.removeAllListeners();
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
        //newMessages keeps track of which other users have sent us private messages
        $rootScope.newMessages = [];
        mySocket.connect();
        mySocket.on('chatroom message', function (msg) {
            $rootScope.messages.push(msg);
        });
        mySocket.on('private message', function (message) {
            //Trying to add user to user conversations list
            if (message.senderId == $rootScope.user.id) {
                if (!$rootScope.conversations.map(function (obj) { return obj.id; }).includes(message.recipientId)) {
                    $rootScope.conversations.push({ name: message.recipientName, id: message.recipientId });
                }
            } else {
                if (!$rootScope.conversations.map(function (obj) { return obj.id; }).includes(message.senderId)) {
                    $rootScope.conversations.push({ name: message.senderName, id: message.senderId });
                }
            }

            if ($rootScope.privateRecipient && (message.senderId == $rootScope.privateRecipient.id || message.senderId == $rootScope.user.id)) {
                $rootScope.messages.push(message);
            } else {
                $rootScope.newMessages.push(message.senderId);
                whistleAudio.play();
            }
        });
        mySocket.on('connect message', function (msg) {
            $rootScope.statusMessage = msg;
        });
        mySocket.on('disconnect message', function (msg) {
            $rootScope.statusMessage = msg;
        });
        mySocket.on('active users', function (arr) {
            $rootScope.users = arr;
        });
        mySocket.on('join chatroom', function () {
            document.getElementById('my-message').focus();
        });
        mySocket.on('change username', function(obj) {
            for(var i=0; i<$rootScope.conversations.length; i++) {
                if($rootScope.conversations[i].id == obj.id) {
                    $rootScope.conversations[i].name = obj.newUserName;
                }
            }
        });

        //send $rootScope.user to server.js, it receives it with socket.on('connected')
        mySocket.emit('connected', $rootScope.user);
        mySocket.emit('connect message', { date: new Date(), text: $rootScope.user.name + " har loggat in." });
        $rootScope.selected = "591d5683f36d281c81b1e5ea";
        $rootScope.selectedChatroom = $rootScope.selected;   //"General"
        mySocket.emit('join chatroom', $rootScope.selectedChatroom);
        $http({
            url: "/messages",
            method: "GET",
            params: { chatroom: "591d5683f36d281c81b1e5ea" } //This is the chatroom "General"
        }).then(function (response) {
            $rootScope.messages = response.data;
        });

        document.getElementById('my-message').focus();
        document.getElementById('my-message').onkeypress = function (e) {
            //keyCode 13 is the enter key
            if (e.keyCode == 13 && !e.shiftKey) {
                //prevents a new line from being written when only the enter key is pressed
                e.preventDefault();
                if ($scope.blankTrim($scope.textMessage) !== "") {
                    if ($rootScope.isPrivate) {
                        $scope.postPrivateMessage();
                    } else {
                        $scope.postMessage();
                    }
                    $scope.textMessage = "";
                    document.getElementById('my-message').focus();
                }
            }
        };

        $scope.postMessage = function () {
            var newMessage = {
                "senderId": $rootScope.user.id,
                "senderName": $rootScope.user.name,
                "timestamp": new Date(),
                "text": $scope.textMessage,
                "chatroom": $rootScope.selectedChatroom
            };
            //Send message to the current chatroom
            mySocket.emit('chatroom message', newMessage);
            messageManager.postMessages(newMessage);
            return false;
        };

        $scope.postPrivateMessage = function () {
            var newPrivateMessage = {
                "senderId": $rootScope.user.id,
                "senderName": $rootScope.user.name,
                "timestamp": new Date(),
                "text": $scope.textMessage,
                "recipientId": $rootScope.privateRecipient.id,
                "recipientName": $rootScope.privateRecipient.name
            };
            //Send a direct private message.
            mySocket.emit('private message', newPrivateMessage);
            //Post the message to the database
            $http.post('/private-messages', newPrivateMessage);
        };

        $rootScope.placeCaretAtEnd = function () {
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

        $scope.postPrivateMessage = function () {
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
            messageManager.postPrivateMessages(newPrivateMessage);
        };

        $scope.blankTrim = function blankTrim(str) {
            var newStr = str;
            while (newStr.indexOf("&nbsp;") >= 0) {
                newStr = newStr.replace("&nbsp;", "");
            }
            while (newStr.indexOf("<br>") >= 0) {
                newStr = newStr.replace("<br>", "");
            }
            return newStr.trim();
        };
    }
});

app.controller('SettingsController', function ($scope, $rootScope, mySocket, whistleAudio, userManager) {
    // Get the user id for the profile picture
    $scope.user = {
        userid: $rootScope.user.id
    };

    $scope.errorMessage = "";
    // Callsback if profile picture upload success
    $scope.onSuccess = function (response) {
        $scope.errorMessage = "Bilden är uppladdad";
        document.getElementById("error-message").style.color = "green";
    };
    // Callsback if profile picture upload fail
    $scope.onError = function (response) {
        $scope.errorMessage = "Bilden kunde inte laddas upp";
        document.getElementById("error-message").style.color = "red";
    };

    $scope.settings = {
        username: $rootScope.user.name
    };
    $scope.changeUsername = function () {
        if ($scope.settings.username) {
            userManager.updateUsername({
                "id": $rootScope.user.id,
                "username": $scope.settings.username
            }).then(function () {
                $rootScope.user.name = $scope.settings.username;
                $scope.errorMessage = "Användarnamnet har ändrats.";
                document.getElementById("error-message").style.color = "green";
            }, function () {
                $scope.errorMessage = "Användarnamnet gick inte att ändra.";
                document.getElementById("error-message").style.color = "red";
            });
            mySocket.emit('change username', {"id": $rootScope.user.id, "newUserName": $scope.settings.username});
        } else {
            $scope.errorMessage = "Du måste välja ett användarnamn som innehåller minst tre tecken och max 20 tecken." +
                "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
            document.getElementById("error-message").style.color = "red";
        }
    };
});
