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
app.use(express.static(OUT_DIR));
// '/' 는 모바일 접속 용.
// '/monitor' 는 방 만들기 용.
var redirectMonitor = function (req, res) {
	var param = req.query.limit ? '?limit=' + req.query.limit : '';
	res.redirect('/monitor.html' + param);
};
app.get('/mon', redirectMonitor);
app.get('/monitor', redirectMonitor);
server.listen(89);

//monitor
//remotor

var sockMap = {};
var roomArr = [];

function getRoomNumByMonId(monId) {
	var roomNum = -1;
	roomArr.forEach(function (room, index) {
		if (room.monId === monId) {
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
		roomArr[i].users.forEach(checkFn);
		if (myIndex > -1) {
			return {
				room: roomArr[i],
				index: myIndex
			};
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
		roomArr[i].users.forEach(checkFn);
		if (myIndex > -1) {
			return {
				room: roomArr[i],
				index: myIndex
			};
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
		// mon 일 경우.
		var roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			roomArr.splice(roomNum, 1);
			socket.leave('room' + roomNum);
			socket.broadcast.to('room' + roomNum).emit('error', '방이 닫혔습니다. (게임 종료)');
		}
		// user 일 경우.
		// TODO game 중이면 mon에 표시해줘야하나? 턴 10초 자동 넘기기?
	});
	
	//mon - 방 만들기
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
	//mon - 누구의 차례인가
	socket.on('turn', function(tankIndex) {
		var roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			socket.broadcast.to('room' + roomNum).emit('turn', tankIndex);
		}
	});
	
	//mon - 게임시작
	//mon - 게임 끝
	
	
	//remote - join
	socket.on('join', function(userInfo) {
		var roomNum, room, tankIndex, roomAndIndex;
		roomNum = userInfo.roomNum;
		room = roomArr[roomNum];
		if (!room) {
			socket.emit('error', '존재하지 않는 방입니다.');
			return;
		}
		//TODO 이 시점에서 재접속한 유저를 판단해보자 (clientUniq 값)
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
			roomNum: roomNum,
			tankIndex: tankIndex
		});
	});
	//remote - tank (angle, power, fire)
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





