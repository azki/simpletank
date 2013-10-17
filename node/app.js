/*jslint regexp:false,nomen:false,white:false*/
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

var sockMap = {};
// {sockId:{sockId,socket},}
var roomArr = [];
// {sockId:{sockId,socket},}

['css', 'img', 'js'].forEach(function (dirName) {
	app.use('/' + dirName, express.static(OUT_DIR + '/' + dirName));
});
var sendMonitorHtml = function (req, res) {
	res.header('Content-Type', 'text/html;charset=UTF-8');
	fs.readFile(OUT_DIR + '/monitor.html', function(err, data) {
		if (err) {
			console.log('Error loading monitor.html', err);
			return res.send(500, 'Error loading monitor.html');
		}
		res.writeHead(200);
		res.end(data);
	});
};
var sendRemoteHtml = function (req, res) {
	res.header('Content-Type', 'text/html;charset=UTF-8');
	fs.readFile(OUT_DIR + '/remote.html', function(err, data) {
		if (err) {
			console.log('Error loading remote.html', err);
			return res.send(500, 'Error loading remote.html');
		}
		res.writeHead(200);
		res.end(data);
	});
};
app.get('/mon', sendMonitorHtml);
app.get('/monitor', sendMonitorHtml);
app.get('/:roomNum', function (req, res) {
	var roomNum = req.params.roomNum;
	if (roomNum && +roomNum >= 0) {
		sendRemoteHtml(req, res);
	} else {
		res.send(404, '/' + roomNum + ' is Not Found.');
	}
});
app.get('/', function (req, res) {
	res.header('Content-Type', 'text/html;charset=UTF-8');
	var resHtml = '<h1>현재 생성된 방들</h1>';
	roomArr.forEach(function (room, index) {
		if (room) {
			resHtml += '<p><a href="/' + index + '">' + index + '번 방</a> ';
			if (room.gaming) {
				resHtml += '<i style="color:red">게임중</i>';
			} else {
				resHtml += '<i style="color:green">대기중</i>';
			}
			resHtml += ' (' + room.users.length + '/' + room.userLimit + ')</p>';
		}
	});
	res.end(resHtml);
});
server.listen(89);


function getRoomNumByMonId(monId) {
	var roomNum = -1;
	roomArr.forEach(function (room, index) {
		if (room && room.monId === monId) {
			roomNum = index;
		}
	});
	return roomNum;
}

function sendToMon(room, name, value) {
	sockMap[room.monId].socket.emit(name, value);
}

function getRoomAndIndexByUserSockId(userSockId) {
	var i, len, myIndex, checkFn;
	len = roomArr.length;
	myIndex = -1;
	checkFn = function (user, index) {
		if (user.sockId === userSockId) {
			myIndex = index;
		}
	};
	for (i = 0; i < len; i += 1) {
		if (roomArr[i]) {
			roomArr[i].users.forEach(checkFn);
			if (myIndex > -1) {
				return {
					room: roomArr[i],
					index: myIndex
				};
			}
		}
	}
	return null;
}

function getRoomAndIndexByUserUniq(userUniq) {
	var i, len, myIndex, checkFn;
	len = roomArr.length;
	myIndex = -1;
	checkFn = function (user, index) {
		if (user.clientUniq === userUniq) {
			myIndex = index;
		}
	};
	for (i = 0; i < len; i += 1) {
		if (roomArr[i]) {
			roomArr[i].users.forEach(checkFn);
			if (myIndex > -1) {
				return {
					room: roomArr[i],
					index: myIndex
				};
			}
		}
	}
	return null;
}

io.of('/tank').on('connection', function(socket) {
	var sockId = socket.id;
	sockMap[sockId] = {
		sockId: sockId,
		socket: socket
	};
	socket.on('disconnect', function() {
		delete sockMap[sockId];
		
		var roomNum, roomAndIndex, room;
		// mon 일 경우.
		roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			roomArr[roomNum] = null;
			socket.broadcast.to('room' + roomNum).emit('error', '방이 닫혔습니다. (게임 종료)');
		}
		
		// user 일 경우.
		roomAndIndex = getRoomAndIndexByUserSockId(sockId);
		if (roomAndIndex) {
			room = roomAndIndex.room;
			if (room.gaming) { // TODO : gaming 이 true 이면 나뒀다가 game 종료시 삭제..
				// TODO game 중이면 mon에 표시해줘야하나? 턴 10초 자동 넘기기?
			} else { // gaming 이 아닐 경우 user 에서 삭제.
				room.users.splice(roomAndIndex.index, 1);
				sendToMon(room, 'updateRoom', room);
			}
		}
	});
	
	// mon - 방 만들기
	socket.on('createRoom', function(roomLimit) {
		var roomNum = roomArr.length;
		roomArr[roomNum] = {
			monId: sockId,
			gaming: false,
			users: [],
			userLimit: roomLimit
		};
		socket.join('room' + roomNum);
		socket.emit('newRoom', roomNum);
	});
	// mon - 누구의 차례인가
	socket.on('turn', function(tankIndex) {
		var roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			socket.broadcast.to('room' + roomNum).emit('turn', tankIndex);
		}
	});
	
	// TODO mon - 게임시작
	// TODO mon - 게임 끝
	
	
	// remote - join
	socket.on('join', function(userInfo) {
		var roomNum, room, tankIndex, roomAndIndex;
		roomNum = userInfo.roomNum;
		room = roomArr[roomNum];
		if (!room) {
			socket.emit('error', '방이 존재하지 않습니다.');
			return;
		}
		// 이 시점에서 게임중에 재접속한 유저를 판단해 살려주자 (clientUniq 값)
		roomAndIndex = getRoomAndIndexByUserUniq(userInfo.clientUniq);
		if (roomAndIndex && roomAndIndex.room === room) {
			tankIndex = roomAndIndex.index;
			room.users[tankIndex] = {
				sockId: sockId,
				clientUniq: userInfo.clientUniq,
				nickName: userInfo.nickName,
				roomNum: userInfo.roomNum
			};
		} else {
			if (room.gaming === true) {
				socket.emit('error', '현재 게임이 진행중입니다. 게임이 끝난 후 입장 가능합니다.');
				return;
			}
			if (room.users.length >= room.userLimit) {
				socket.emit('error', '현재 방이 꽉 찼습니다.');
				return;
			}
			tankIndex = room.users.length;
			room.users.push({
				sockId: sockId,
				clientUniq: userInfo.clientUniq,
				nickName: userInfo.nickName,
				roomNum: userInfo.roomNum
			});
		}
		socket.join('room' + roomNum);
		sendToMon(room, 'updateRoom', room);
		socket.emit('okRoom', {
			roomNum: roomNum
		});
	});
	// remote - tank (angle, power, fire)
	socket.on('tank', function(data) {
		var roomAndIndex = getRoomAndIndexByUserSockId(sockId);
		if (roomAndIndex) {
			sendToMon(roomAndIndex.room, 'set_' + data.name, {
				tankIndex: roomAndIndex.index, 
				value: data.value
			});
		}
	});
});





