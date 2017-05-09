var express = require('express');
var mongo = require('mongodb').MongoClient;
var bodyParser = require('body-parser');

var app = express();

var port = 3000;
var db;

app.use(bodyParser.urlencoded({extended: true}));

mongo.connect('mongodb://shutapp:shutapp123@ds133981.mlab.com:33981/shutapp', function(err, database) {
    if (err) {
        console.log(err);
    }
    db = database;
});

app.post('/messages', function(req, res) {
    db.collection('users').save(req.body, function(err, result) {
        if (err) {
            console.log(err);
        }
        console.log("Saved to database.");
        res.redirect('/messages');
    })
});

app.use(express.static(__dirname + '/public'));

//Mock data with users.
var users = require('./mock/users.json');
//GET handler for users.
app.get('/users', function (req, res) {
    res.send(users);
});
var activeUsers = [];
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
});

http.listen(port, function(){
  console.log('Listening on: ' + port);
});
