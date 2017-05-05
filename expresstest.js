var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());

app.get('/profile/:username', function(request, response) {
	response.send({
		name: request.params.username
	});
});

app.post('/username', function(request, response) {
	response.send(request.body.name);
});

app.listen(3000, function() {
	console.log('We\'re live!');
});
