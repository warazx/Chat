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
        res.redirect('/');
    })
})

app.use(express.static(__dirname + '/public'));

require('./app/routes')(app);

/*
app.listen(port, function () {
    console.log("Server is running on port " + port);
});
*/

// ------------
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = [];

io.on('connection', function(socket){
  //message
  socket.on('broadcast message', function(message){
    io.emit('broadcast message', message);
  });
   socket.on('private message', function(message){
    io.emit('private message', message);
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});

