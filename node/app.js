/*jslint regexp:false,nomen:false*/
/*global exports,require,__dirname*/

var OUT_DIR = __dirname + '/../out';

var request = require("request");
var fs = require('fs');
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server, {
	log: true
});
app.use(express.static(OUT_DIR));
// '/' 는 모바일 접속 용.
// '/monitor' 는 방 만들기 용.
var redirectMonitor = function (req, res) {
	res.redirect('/monitor.html');
};
app.get('/mon', redirectMonitor);
app.get('/monitor', redirectMonitor);
server.listen(89);

//monitor
//remotor

var sockMap = {};

io.of('/tank').on('connection', function(socket) {
	var sockId = socket.id;
	sockMap[sockId] = {
		sockId: sockId
	};
	socket.on('disconnect', function() {
		delete sockMap[sockId];
		socket.broadcast.to('temp_room').emit('temp_event', {
			hi: 1,
			hello: 2
		});
	});
	
	
});





