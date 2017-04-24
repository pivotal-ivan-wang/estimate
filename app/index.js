var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

var Broker = require('./broker');
var broker = new Broker(io);
broker.init();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//routing

app.use(express.static(__dirname + '/public'));

app.post('/create', function(req, res) {
  broker.createRoom(req.body.room);
  console.log(broker.getSession());
  res.send("POST success");
});

//