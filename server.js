var express = require('express');
var mongo = require('mongodb').MongoClient;
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
    //If it is a private message, it has a recipient
    if(req.body.recipient) {
        db.collection('privateMessages').insert({ sender: req.body.sender, recipient: req.body.recipient, timestamp: new Date(), text: req.body.text });
    } else {
        db.collection('messages').insert({ sender: req.body.sender, date: new Date(), text: req.body.text }).then(function() {
            //201 is a "created" status code
            res.status(201).send({});
        });
    }
});

app.post('/signup', function(req, res) {
    //all usernames are stored as lowercase for simplicity
    var username = req.body.username.toLowerCase();
    var email = req.body.email.toLowerCase();
    var password = req.body.password;
    if(!email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)
        || !username.match(/[0-9a-zA-Z]{3,20}/)
        || !password.match(/^.{6,50}$/) ) {
        //400 is "bad request"
        res.status(400).send({});
        return;
    }

    db.collection('users').findOne( { "username": username }, function(err, user) {
        if(err) {
            //Server error
            res.status(500).send(err);
        } else {
            console.log(user);
            //if the user does not already exist in the database, create a new user
            if(user === null) {
                db.collection('users').findOne( { "email": email }, function(err, user) {
                    if(err) {
                        res.status(500).send(err);
                    } else {
                        if(user === null) {
                            //Add user to the database
                            db.collection('users').insert({username: username, email: req.body.email, password: req.body.password}).then(function() {
                                res.status(201).send({redirect:'/'});
                            });
                        } else {
                            res.status(409).send({"reason":"email"});
                        }
                    }
                });
            } else {
                //409 means "conflict".
                res.status(409).send({"reason":"username"});
            }
        }
    });
});

app.get('/messages', function(req, res) {
    if(req.query.user && req.query.otheruser) {
        var user = req.query.user;
        var otherUser = req.query.otheruser;
        db.collection('privateMessages').find({$or: [ {sender: user, recipient: otherUser}, {sender: otherUser, recipient: user} ] }).sort({ "date" : 1}).toArray(function(error, result) {
            if(error) {
                res.status(500).send(error);
                return;
            } else {
                //200 is an "okay" status code
                res.status(200).send(result);
            }
        });
    } else {
        db.collection('messages').find().sort({ "date": 1 }).toArray(function(error, result) {
            if (error) {
                res.status(500).send(error);
                return;
            }
            res.status(200).send(result);
        });
    }
});

//Mock data with users.
var users = require('./mock/users.json');

app.get('/login/:name', function (req, res) {
    var name = req.params.name;
    var isActive = false;
    for(var i = 0; i < activeUsers.length; i++) {
        if (activeUsers[i].name.toUpperCase() == name.toUpperCase()) isActive = true;
    }
    if(!isActive) {
        console.log('I should redirect');
        res.send({redirect: '/messages'});
    } else {
        res.send({errorMsg: "Användarnamnet är upptaget. \nVänligen välj ett annat användarnamn."});
    }
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
