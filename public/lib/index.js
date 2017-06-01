var lib = angular.module('lib', []);

lib.factory('userManager', function ($http) {
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

lib.factory('messageManager', function ($http) {
    var messageManager = {};
    messageManager.getChatrooms = function () {
        return $http.get('chatrooms');
    };
    messageManager.getMessages = function (chatroomId) {
        return $http.get('http://localhost:3000/messages?chatroom=' + chatroomId);
    };
    messageManager.getPrivateMessages = function (user, otheruser) {
        return $http.get('/messages?user=' + user + '&otheruser=' + otheruser);
    };
    messageManager.getConversations = function (userId) {
        return $http.get('/conversations?userid=' + userId);
    };
    messageManager.postMessages = function (newMessage) {
        return $http.post('/messages', newMessage);
    };
    messageManager.postPrivateMessage = function (newPrivateMessage) {
        return $http.post('/private-messages', newPrivateMessage);
    };
    return messageManager;
});
