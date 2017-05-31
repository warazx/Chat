// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic', 'lib'])

.run(function($ionicPlatform, $rootScope) {
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
})

.config(function($stateProvider, $urlRouterProvider) {
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
        templateUrl: 'partials/messages.html',
        controller: 'MessagesController'
    })
    .state('settings', {
        url: '/settings',
        templateUrl: 'partials/settings.html',
        controller: 'SettingsController'
    });
    $urlRouterProvider.otherwise('/login');
})

.controller('LoginController', function ($rootScope, messageManager) {
    $rootScope.jepp = "Login";
})

.controller('SignupController', function ($rootScope, messageManager) {
    $rootScope.jepp = "Signup";
})

.controller('MessagesController', function ($rootScope, messageManager) {
    $rootScope.jepp = "Messages";
})

.controller('SettingsController', function ($rootScope, messageManager) {
    $rootScope.jepp = "Settings";
})
