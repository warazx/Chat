var express = require('express');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

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

app.use(session({
  secret: 'please shutapp',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({url: 'mongodb://shutapp:shutapp123@ds133981.mlab.com:33981/shutapp'})
}));

app.post('/messages', function(req, res) {
    db.collection('chatMessages').insert({ sender: req.body.sender, timestamp: new Date(), text: req.body.text }).then(function() {
        //201 is a "created" status code
        res.status(201).send({});
    });
});

app.get('/messages', function(req, res) {
    var allMessages = [];
    var cursor = db.collection('chatMessages').find().sort({ "timestamp": 1 });
    
    cursor.toArray(function(err, result) {
        res.status(200).send(result);
    });
});

//This is an endpoint at the server
app.get('/chatrooms', function(req, res) {
	//find all chatrooms and add these to a list
	db.collection('chatrooms').find().toArray(function (error, result){
		if(error) {
			res.status(500).send(error);
			return;
		}
		//result is an array with chatroom objects
		res.status(200).send(result);
    });
});

app.post('/private-messages', function(req, res) {
    var newPrivateMessage = {
        sender: req.body.sender,
        recipient: req.body.recipient,
        timestamp: new Date(),
        text: req.body.text
    }
    db.collection('privateMessages').insert(newPrivateMessage).then(function(err, result) {
        if(!err) {
            res.status(201).send({});
        }
    });
});

app.get('/private-messages', function(req, res) {
    var user = req.query.user;
    var otherUser = req.query.otheruser;
    var cursor = db.collection('privateMessages').find({$or: [ {sender: user, recipient: otherUser}, {sender: otherUser, recipient: user} ] }).sort({ "timestamp" : 1});
    cursor.toArray(function(err, result) {
        res.status(200).send(result);
    });
    
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

<<<<<<< HEAD
=======
app.get('/logout', function(req, res, next) {
    if(req.session) {
        req.session.destroy();
    }
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

>>>>>>> christian
//GET one or all users. Not finished!
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
        var userObject = {
            "id": result._id,
            "name": result.username
        }
        res.status(200).send(userObject);
    });
});

app.get('/login/:username/:password', function (req, res) {
    db.collection('users').findOne({username: req.params.username.toLowerCase()}, function(err, user) {
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
            //Sets a cookie with the user id.
            req.session.userId = user._id;
            res.status(200).send({
                _id: user._id,
                username: user.username,
                redirect: 'messages'
            });
        }
    });
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
    socket.on('connected', function(user) {
        socket.username = user.name;
        socket.id = user.id;
        console.log(socket.username + " has connected.");
        activeUsers.push({ name: socket.username, id: socket.id });
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
        socket.broadcast.emit('disconnect message', {timestamp: new Date(), text: socket.username + " har loggat ut."});
    });
});

http.listen(port, function(){
    console.log('Listening on: ' + port);
});