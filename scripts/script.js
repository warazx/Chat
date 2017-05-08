var app = angular.module('app', ['ngRoute', 'ngSanitize']);

app.value('users', [
    {
        id : 1,
        name : "1337Leif",
        isUserOnline : true,
        messages : []
    },
    {
        id : 2,
        name : "RegExRolf",
        isUserOnline : true,
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
        isUserOnline : true,
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
        templateUrl: 'partials/messages.html'
    }).otherwise({
        controller: 'LoginController',
        templateUrl: 'partials/login.html'
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

app.controller('SideController', function ($scope, $rootScope, users) {
    $scope.users = users;
});

app.controller('LoginController', function ($scope,$rootScope, $window, users) {
	$scope.users = users;
    $scope.showMenu = false;
    $scope.userLogin = function userLogin() {
        $window.location.href="#!/messages";
        $scope.showMenu = true;
    };
    $scope.userLogout = function userLogout() {
        $window.location.href="#!/login";
        $scope.showMenu = false;
    };
});

app.controller('MessagesController', function ($scope,$rootScope, users) {
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
    $scope.messages = [];

    var currentId = 0; //Temp
    $scope.postMessage = function() {
      $scope.messages.push({
        id : currentId,
        text : $scope.textMessage,
        date : Date.now(),
        isPrivateMessage : false,
        sender : 0, //User-ID
        receiver : 0 //UserID / ChatRoomID
      });
      $scope.textMessage = "";
      document.getElementById('my-message').focus();
      currentId++;
      //scroll to the bottom
      setTimeout(function() {
                var div = document.getElementById("chat-messages");
                div.scrollTop = div.scrollHeight;
      }, 200);
      
    };
});