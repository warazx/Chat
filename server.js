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

/*app.post('/messages', function(req, res) {
    db.collection('users').save(req.body, function(err, result) {
        if (err) {
            console.log(err);
        }
        console.log("Saved to database.");
        res.redirect('/');
    })
})*/

app.use(express.static(__dirname + '/public'));

require('./app/routes')(app);

app.listen(port, function () {
    console.log("Server is running on port " + port);
});
