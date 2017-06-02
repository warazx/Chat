// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'

var app = angular.module('starter', ['ionic', 'lib', 'ngSanitize', 'btford.socket-io', 'ngCordova']);

app.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
});

app.factory('socket', function(socketFactory) {
  var myIoSocket = io.connect('http://localhost:3000');
  mySocket = socketFactory({
    ioSocket: myIoSocket
  });
  return mySocket;
});

app.factory('toaster', function($cordovaToast) {
  return {
    toast: function(message, duration, location) {
      $cordovaToast.show(message, duration, location).then(function(success) {
        console.log("The toast was shown");
      }, function (error) {
        console.log("The toast was not shown due to " + error);
      });
    }
  }
});

app.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider
  .state('login', {
    url: '/login',
    templateUrl: 'partials/login.html',
    controller: 'LoginController'
  })
  .state('signup', {
    url: '/signup',
    templateUrl: 'partials/signup.html',
    controller: 'SignupController'
  })
  .state('messages', {
    url: '/messages',
    templateUrl: 'partials/messages-and-menu.html',
    controller: 'MessagesController'
  })
  .state('settings', {
    url: '/settings',
    templateUrl: 'partials/settings.html',
    controller: 'SettingsController'
  });
  $urlRouterProvider.otherwise('/login');
});

app.controller('LoginController', function ($rootScope, $scope, $location, userManager) {
    $rootScope.currentView = "Login";

    //Needed on scope before login credentials are entered by user.
    $scope.login = {};

    //Message to show in toast. Not implementet
    $scope.errorMessage = "";

    $scope.userLogin = function () {
        if ($scope.login.username === undefined || $scope.login.password === undefined) {
            console.log('Invalid logininformation.');
            $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
        } else {
            userManager.login($scope.login.username, $scope.login.password).then(function (res) {
                console.log('Login successful.');
                //Might use this....
                $rootScope.isPrivate = false;
                $rootScope.user = {
                    id: res.data._id,
                    name: res.data.username
                };
                $location.path(res.data.redirect); //Redirects to /messages.
            }, function (res) {
                console.log('Login failed on server.');
                $scope.errorMessage = "Felaktiga inloggningsuppgifter.";
            });
        }
        $rootScope.successMessage = "";
    };
});

app.controller('SignupController', function ($location, $scope, $rootScope, userManager, toaster) {
  $rootScope.successMessage = "";
  $scope.userSignup = function (signup) {
    if (signup === undefined || signup.email === undefined || signup.username === undefined || signup.password === undefined || signup.passwordagain === undefined) {
      var message = "";
      if (signup.username === undefined) message += "Du måste välja ett användarnamn som innehåller minst tre tecken och max 20 tecken." +
      "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
      if (signup.email === undefined) message += "\nFelaktig emailadress.";
      if (signup.password === undefined) message += "\nDu måste välja ett lösenord som innehåller minst sex tecken och max 50 tecken.";
      toaster.toast(message, 'long', 'bottom');
    } else if(signup.password !== signup.passwordagain) {
      toaster.toast('Du skrev in lösenordet olika i de två fälten.', 'long', 'bottom');
    } else {
      userManager.signupuser({
        username: signup.username,
        email: signup.email,
        password: signup.password
      }).then(function (res) { //Successful codes 100-399.
        console.log("Signup OK. Redirecting to login.");
        $rootScope.successMessage = "Användare registrerad.";
        $location.path(res.data.redirect);
      }, function (res) { //Failed codes 400-599+?
        console.log("Signup failed.");
        var message = "";
        switch (res.data.reason) {
          case "username":
            message = "Användarnamnet är upptaget.";
            break;
          case "email":
            message = "Emailadressen är redan registrerad.";
            break;
          default:
            message = "Det blev lite fel!";
        }
        toaster.toast(message, 'long', 'bottom');
      });
    }
  };
});

app.controller('MessagesController', function ($rootScope, $scope, $ionicScrollDelegate, $ionicSideMenuDelegate, messageManager) {
  messageManager.getMessages('591d5683f36d281c81b1e5ea').then(function(res) {
    $rootScope.messages = res.data;
    $ionicScrollDelegate.scrollBottom();
  });
  $rootScope.$watch('messages', function () {
    if (!$rootScope.messages || $rootScope.messages.length <= 0) {
      $scope.noMessages = true;
    } else {
      $scope.noMessages = false;
    }
  }, true);
  $scope.toggleLeft = function() {
        $ionicSideMenuDelegate.toggleLeft();
  };
});

app.controller('LeftSideController', function ($rootScope, $scope, messageManager, socket) {
    /*
    $scope.chatrooms = ["General", "Random", "FUN!!!"];
    */
	//TODO change to real logged in user
	$rootScope.user = { name: "Erika", id: "5927f744ac29ef07a783c7f5" };
    socket.emit('connected', $rootScope.user);
    messageManager.getChatrooms().then(function (response) {
        $scope.chatrooms = response.data;
    });
	messageManager.getConversations($rootScope.user.id).then(function (response) {
		$rootScope.conversations = response.data;
	});
    socket.on('active users', function (arr) {
        $rootScope.activeUsers = arr;
    });
    /*
    //get list of users with which we have had a conversation
    messageManager.getConversations($rootScope.user.id).then(function(res) {
        $rootScope.conversations = res.data;
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
        messageManager.getMessages($rootScope.selectedChatroom).then(function(res) {
            $rootScope.messages = res.data;
        });
        mySocket.emit('join chatroom', $rootScope.selectedChatroom);
    };

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
        $rootScope.privateRecipient = this.privateRoom;
        if ($rootScope.newMessages.includes(this.privateRoom.id)) {
            $rootScope.newMessages.splice($rootScope.newMessages.indexOf(this.privateRoom.id), 1);
        }
        if (!$rootScope.user) {
            console.log("User not logged in! Redirecting to login.");
            $location.path('/');
        } else {
            $location.path('/messages');
            messageManager.getPrivateMessages($rootScope.user.id, $rootScope.privateRecipient.id).then(function(res) {
                $rootScope.messages = res.data;
            });
            document.getElementById('my-message').focus();
        }
    };
    */
});
/*
.controller('ContentController', function($scope, $ionicSideMenuDelegate) {
  $scope.toggleLeft = function() {
    $ionicSideMenuDelegate.toggleLeft();
  };
})
*/

app.controller('SettingsController', function ($location, $scope, $rootScope, userManager, toaster) {
  $scope.changeUsername = function(newUsername) {
    if(newUsername) {
        userManager.updateUsername({
            "id": $rootScope.user.id,
            "username": newUsername
        }).then(function () {
            $rootScope.user.name = newUsername;
            toaster.toast('Användarnamnet har ändrats.', 'long', 'bottom');
        }, function () {
            toaster.toast('Användarnamnet gick inte att ändra.', 'long', 'bottom');
        });
        //TODO: Turn on again after sockets work
        //mySocket.emit('change username', {"id": $rootScope.user.id, "newUserName": newUsername});
    } else {
        var message = "Du måste välja ett användarnamn som innehåller minst tre tecken och max 20 tecken." +
            "\nDu kan inte använda speciella tecken, endast siffror och bokstäver(a-z).";
        toaster.toast(message, 'long', 'bottom');
    }
  };

  $scope.logout = function() {
    $rootScope.user = {};
    $location.path('/login');
  };
});
