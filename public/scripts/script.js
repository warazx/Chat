var app = angular.module('app', ['ngRoute', 'ngSanitize']);

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

app.controller('SideController', function ($scope, $rootScope, users) {
    $scope.users = users;
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



app.controller('MessagesController', function ($scope,$rootScope, $window, users) {
	$scope.messages = [];
    var socket = io();
   
   socket.on('chat message', function(msg){
	   /*
	   var node = document.createElement("LI");
	   var textNode = document.createTextNode(msg);
	   node.appendChild(textNode);
       document.getElementById('messages').appendChild(node);
	   */
	   messages.push(msg);
   });
   
    $scope.users = users;
    $scope.title = "Messages";

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
		socket.emit('chat message', $scope.textMessage);
		$scope.textMessage = "";
        return false;
		/*
        $scope.messages.push({
            id : currentId,
            text : $scope.textMessage,
            date : Date.now(),
            isPrivateMessage : false,
            sender : 0, //User-ID
            receiver : 0 //UserID / ChatRoomID
        });*/
        document.getElementById('my-message').focus();
        currentId++;
        //scroll to the bottom
        setTimeout(function() {
            var div = document.getElementById("chat-messages");
            div.scrollTop = div.scrollHeight;
        }, 200);

    };

    $scope.userLogout = function userLogout() {
        $window.location.href="#!/";
        $rootScope.showMenu = false;
    };
});