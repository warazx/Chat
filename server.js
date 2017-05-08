var express = require('express');
var mongo = require('mongodb').MongoClient;

var app = express();

var port = 3000;
var db;

mongo.connect('mongodb://shutapp:shutapp123@ds133981.mlab.com:33981/shutapp', function(err, database) {
    if (err) {
        console.log(err);
    }
    db = database;
});

app.use(express.static(__dirname + '/public'));

require('./app/routes')(app);

app.listen(port, function () {
    console.log("Server is running on port " + port);
});
