var app = angular.module('app', ['lib', 'controllers', 'ngRoute', 'ngSanitize', 'btford.socket-io', 'luegg.directives', 'mgcrea.ngStrap', 'angular-smilies', 'lr.upload']);

app.value('whistleAudio', new Audio('sounds/whistle.mp3'));

app.factory('mySocket', function (socketFactory) {
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
