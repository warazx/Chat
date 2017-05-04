var app = angular.module('chatup', []);

app.controller('loginController', function($scope) {
    $scope.onSubmit = function(){
        //Check that username is not already in use ny an other user.
        var users = ["erika","åsa","tobbe"];
        if(users.indexOf($scope.user.name) !== -1) {
            alert('user already exists!');
        }
    }
});