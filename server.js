var express = require('express');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var bodyParser = require('body-parser');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var activeUsers = [];

var port = 3000;
var db;

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

mongo.connect('mongodb://shutapp:shutapp123@ds133981.mlab.com:33981/shutapp', function(err, database) {
    if (err) {
        console.log(err);
    }
    db = database;
});

app.post('/messages', function(req, res) {
    db.collection('messages').insert({ sender: req.body.sender, date: new Date(), text: req.body.text }).then(function() {
        //201 is an "okay" status code
        res.status(201).send({});
    });
});

app.get('/messages', function(req, res) {
    db.collection('messages').find().sort({ "date": 1 }).toArray(function(error, result) {
        if (error) {
            res.status(500).send(error);
            return;
        }
        //200 is an "okay" status code
        res.status(200).send(result);
    });
});

//Mock data with users.
var users = require('./mock/users.json');

/*app.get('/logout/:name', function (req, res) {
    var name = req.params.name;
    activeUsers.splice(activeUsers.findIndex(function(obj) {
        return obj.name === name;
    }), 1);
    res.redirect("/");
});*/

app.get('/users/:id?', function (req, res) {
    var searchObject = {};
    if(req.params.id) {
        searchObject = {
            "_id": ObjectID(req.params.id)
        }
    }
    console.log(searchObject);
    db.collection('users').find(searchObject).toArray(function(err, result) {
        if (err) {
            return res.status(500).send(error);
        }
        res.status(200).send(result);
    });
});

app.get('/login/:username/:password', function (req, res) {
    db.collection('users').findOne({username: req.params.username}, function(err, user) {
        if(err) {
            console.log('Loginrequest caused database error.');
            res.status(500).send(err);
        } else if(user === null) {
            console.log('Loginrequest with invalid username.');
            res.status(401).send({});
        } else if(user.password !== req.params.password) {
            console.log('Loginrequest with invalid password.');
            res.status(401).send({});
        } else {
            console.log('Loginrequest for ' + user.username + ' successful.');
            res.status(200).send({
                _id: user._id,
                username: user.username,
                redirect: 'messages'
            });
        }
    });



    /*
    for(var i = 0; i < activeUsers.length; i++) {
        if (activeUsers[i].name.toUpperCase() == name.toUpperCase()) isActive = true;
    }
    if(!isActive) {
        console.log('I should redirect');
        res.send({redirect: '/messages'});
    } else {
        res.send({errorMsg: "Användarnamnet är upptaget. \nVänligen välj ett annat användarnamn."});
    }*/
});
/*
var heartbeatUsers = [];
app.post('/heartbeat', function(req, res) {
    var name = req.body.name;
    var exists = false;
    for (var i = 0; i < heartbeatUsers.length; i++) {
        if (heartbeatUsers[i].name == name) {
            heartbeatUsers[i].time = new Date();
            exists = true;
        }
    }
    if(!exists) {
        heartbeatUsers.push({name: name, time: new Date()});
    }
    console.log(heartbeatUsers);
});

setInterval(function() {
    var now = new Date();
    for (var i = heartbeatUsers.length - 1; i >= 0; i--) {
        var difference = now - heartbeatUsers[i].time; // Difference between the time right now and last heartbeat.
        var diffMins = Math.round(((difference % 86400000) % 3600000) / 60000);
        if (diffMins > 5) {
            heartbeatUsers.splice(i, 1);
        }
    }
}, 1000*60*5);
*/
io.on('connection', function(socket){
    socket.on('connected', function(username) {
        socket.username = username;
        console.log(socket.username + " has connected.");
        activeUsers.push({ name: socket.username });
        io.emit('active users', activeUsers);
    });
    //message
    socket.on('broadcast message', function(message){
        io.emit('broadcast message', message);
    });
    socket.on('private message', function(message){
        io.emit('private message', message);
    });
    socket.on('connect message', function(message) {
        socket.broadcast.emit('connect message', message);
    });
    socket.on('disconnect message', function(message) {
        io.emit('disconnect message', message);
    });
    socket.on('disconnect', function() {
        activeUsers.splice(activeUsers.findIndex(function(obj) {
            return obj.name === socket.username;
        }), 1);
        console.log(socket.username + " has disconnected.");
        socket.broadcast.emit('active users', activeUsers);
        socket.broadcast.emit('disconnect message', {date: new Date(), text: socket.username + " har loggat ut."});
    });
});

http.listen(port, function(){
    console.log('Listening on: ' + port);
});
