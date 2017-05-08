var express = require('express');

var app = express();

var port = 3000;

app.use(express.static(__dirname + '/public'));

require('./app/routes')(app);

app.listen(port, function () {
    console.log("Server is running on port " + port);
});
