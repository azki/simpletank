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
var roomCount = 0;
var roomArr = [];

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
	
	//mon - 방 만들기
	socket.on('createRoom', function() {
		roomArr[roomCount] = {
			mon: sockId
		};
		socket.emit('newRoom', roomCount);
		roomCount += 1;
	});
	//mon - 방 들어오기
	socket.on('join', function(roomNum) {
		if (!roomArr[roomNum]) {
			//TODO return error
			return;
		}
		var monSockId = roomArr[roomNum].mon;
		if (monSockId in sockMap == false) {
			//TODO return error
			return;
		}
		socket.emit('okRoom', roomNum);
	});
	
	
	//mon - 게임시작
	
	//mon - 누구의 차례인가 (유저 / 논유저)
	
	//mon - 게임 끝
	
	
	
	
});





