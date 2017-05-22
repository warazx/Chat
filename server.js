var express = require('express');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var bodyParser = require('body-parser');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var bcrypt = require('bcrypt');
const saltRounds = 10;

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
    console.log(req.body.chatroom);
    db.collection('chatMessages').insert({ senderId: req.body.senderId, senderName: req.body.senderName, timestamp: req.body.timestamp, text: req.body.text, chatroom: req.body.chatroom}).then(function() {
        //201 is a "created" status code
        res.status(201).send({});
    });
});

app.get('/messages', function(req, res) {
    if(req.query.user) {
        var collection = 'privateMessages';
        var user = req.query.user;
        var otherUser = req.query.otheruser;
        var findObject = {$or: [ {senderId: user, recipient: otherUser}, {senderId: otherUser, recipient: user} ] };
    } else {
        var collection = 'chatMessages';
        var findObject = {"chatroom":req.query.chatroom};
    }

    db.collection(collection).find(findObject).sort({ "timestamp": 1 }).toArray(function(err, result) {
        //TODO: add error thing
        if(err) {
            res.status(500).send({});
        }
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
        senderId: req.body.senderId,
        senderName: req.body.senderName,
        recipient: req.body.recipient,
        timestamp: new Date(),
        text: req.body.text
    };
    db.collection('privateMessages').insert(newPrivateMessage).then(function(err, result) {
        if(!err) {
            res.status(201).send({});
        }
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
                            bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(hash);
                                    db.collection('users').insert({username: username, email: req.body.email, password: hash}).then(function() {
                                        res.status(201).send({redirect:'/'});
                                    });
                                }
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

app.get('/logout', function(req, res, next) {
    if(req.session) {
        req.session.destroy();
    }
});

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
        } else if(!bcrypt.compareSync(req.params.password, user.password)) {
            console.log('Loginrequest with invalid password.');
            res.status(401).send({});
        } else if(bcrypt.compareSync(req.params.password, user.password)) {
            console.log('Loginrequest for ' + user.username + ' successful.');
            //Adds the userID to the session for the server to track.
            req.session.userId = user._id;
            res.status(200).send({
                _id: user._id,
                username: user.username,
                redirect: 'messages'
            });
        } else {
            console.log("Some other error...");
        }
    });
});

io.on('connection', function(socket){
    socket.on('connected', function(user) {
        socket.username = user.name;
        console.log(socket.username + " has connected.");
        activeUsers.push({ name: socket.username, id: user.id, socketId: socket.id });
        io.emit('active users', activeUsers);
    });
    socket.on('private message', function(message){
        console.log("message socketId: " + message.socketId);
        console.log("my socketId: " + socket.id);
        //send to the other person
        socket.to(message.socketId).emit('private message', message);
        //send to myself
        socket.emit('private message', message);
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
    socket.on('join chatroom', function(chatroomId) {
        socket.join(chatroomId, function() {
            console.log(socket.rooms);
        });
    });
    socket.on('chatroom message', function(message) {
        io.in(message.chatroom).emit('chatroom message', message);
    });
    socket.on('leave chatroom', function(chatroomId) {
        socket.leave(chatroomId);
    });
});

http.listen(port, function(){
    console.log('Listening on: ' + port);
});