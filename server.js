var express = require('express');
var mongo = require('mongodb').MongoClient;
var bodyParser = require('body-parser');

var app = express();

var port = 3000;
var db;

app.use(bodyParser.json());

mongo.connect('mongodb://shutapp:shutapp123@ds133981.mlab.com:33981/shutapp', function(err, database) {
    if (err) {
        console.log(err);
    }
    db = database;
});

app.post('/messages', function(req, res) {
    db.collection('messages').insert({ sender: req.body.sender, date: new Date(), text: req.body.text }).then(function() {
        res.status(201).send({});
    });
});

app.get('/messages', function(req, res) {
    db.collection('messages').find().sort({ "date": 1 }).toArray(function(error, result) {
        if (error) {
            response.status(500).send(error);
            return;
        }
        res.status(200).send(result);
    });
});

app.use(express.static(__dirname + '/public'));

//Mock data with users.
var users = require('./mock/users.json');
//GET handler for users.
app.get('/users', function (req, res) {
    res.send(users);
});
var activeUsers = [];

app.get('/logout/:name', function (req, res) {
    var name = req.params.name;
    activeUsers.splice(activeUsers.indexOf(name), 1);
    res.redirect("/");
});

app.get('/login/:name', function (req, res) {
    var name = req.params.name;
    var isActive = false;
    for(var i = 0; i < activeUsers.length; i++) {
        if (activeUsers[i].name === name) isActive = true;
    }
    if(!isActive) activeUsers.push({name: name});
    res.send(isActive);
});

// ------------
var http = require('http').Server(app);
var io = require('socket.io')(http);
io.on('connection', function(socket){
    //message
    socket.on('broadcast message', function(message){
        io.emit('broadcast message', message);
    });
    socket.on('private message', function(message){
        io.emit('private message', message);
    });
    socket.on('connect message', function(message) {
        io.emit('connect message', message);
    });
    socket.on('disconnect message', function(message) {
        io.emit('disconnect message', message);
    });
});

http.listen(port, function(){
  console.log('Listening on: ' + port);
});
