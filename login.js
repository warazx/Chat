var app = angular.module('app', []);

app.controller('loginController', function($scope) {
    $scope.userLogin = function(login){
        //Check that username is not already in use ny an other user.
        var users = ["erika","åsa","tobbe"];
        if(users.indexOf($scope.login.username) !== -1) {
            alert('user already exists!');
        }
    }
});