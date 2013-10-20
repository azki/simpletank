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
	log: false
});

var sockMap = {};
// {sockId:socket}
var roomArr = [];


var sendMonitorHtml = function(req, res) {
	res.header('Cache-Control', 'no-cache,must-revalidate');
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
var sendRemoteHtml = function(req, res) {
	res.header('Cache-Control', 'no-cache,must-revalidate');
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
var sendLobby = function (req, res) {
	res.header('Cache-Control', 'no-cache,must-revalidate');
	res.header('Content-Type', 'text/html;charset=UTF-8');
	var resHtml = '<!doctype html><html><head><meta charset=utf-8/></head><body style="font-size:x-large;"><h1>현재 생성된 방들</h1>';
	roomArr.forEach(function(room, index) {
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
	resHtml += '<p><a href="javascript:location.reload();">새로고침</a></p>';
	resHtml += '<p style="text-align:right;"><a href="/mon">방 만들기</a></p></body></html>';
	res.end(resHtml);
};
['css', 'img', 'js'].forEach(function(dirName) {
	app.use('/' + dirName, express.static(OUT_DIR + '/' + dirName));
});
app.get('/mon', sendMonitorHtml);
app.get('/monitor', sendMonitorHtml);
app.get('/:roomNum', function(req, res) {
	var roomNum = req.params.roomNum;
	if (roomNum && +roomNum >= 0) {
		sendRemoteHtml(req, res);
	} else {
		res.send(404, '/' + roomNum + ' is Not Found.');
	}
});
app.get('/', sendLobby);
server.listen(89);
console.log('start server - ' + new Date());

function getRoomNumByMonId(monId) {
	var roomNum = -1;
	roomArr.forEach(function(room, index) {
		if (room && room.monId === monId) {
			roomNum = index;
		}
	});
	return roomNum;
}

function sendToMon(room, name, value) {
	sockMap[room.monId].emit(name, value);
}

function getRoomAndIndexByUserSockId(userSockId) {
	var i, len, myIndex, checkFn;
	len = roomArr.length;
	myIndex = -1;
	checkFn = function(user, index) {
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
function broadcastRoom(room, name, value) {
	room.users.forEach(function (user) {
		if (user.connected) {
			sockMap[user.sockId].emit(name, value);
		}
	});
}

io.of('/tank').on('connection', function(socket) {
	var sockId = socket.id;
	sockMap[sockId] = socket;
	console.log(' - connection\n\t', sockId);
	
	socket.on('disconnect', function() {
		console.log('- disconnect\n\t', sockId);
		delete sockMap[sockId];
		
		var roomNum, roomAndIndex, room;
		
		// mon 일 경우.
		roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			broadcastRoom(roomArr[roomNum], 'tank_error', '방이 닫혔습니다. (게임 종료)');
			roomArr[roomNum] = null;
			return;
		}
		
		// user 일 경우.
		roomAndIndex = getRoomAndIndexByUserSockId(sockId);
		if (roomAndIndex) {
			room = roomAndIndex.room;
			if (room.gaming) { // 게임중일 때는 user 에 connected=false 만 체크.
				room.users[roomAndIndex.index].connected = false;
				console.log('exit from game room\n\t', room.users);
			} else { // 게임중이 아닐 경우 user 에서 삭제.
				room.users.splice(roomAndIndex.index, 1);
				broadcastRoom(room, 'clear_ready');
				console.log('exit from ready room\n\t', room.users);
			}
			sendToMon(room, 'updateRoom', room);
		}
	});
	
	// mon - 방 만들기
	socket.on('createRoom', function(roomLimit) {
		console.log(sockId, '\n\tcreateRoom');
		var roomNum = roomArr.length;
		roomArr[roomNum] = {
			monId: sockId,
			gaming: false,
			users: [],
			userLimit: roomLimit
		};
		socket.emit('newRoom', roomNum);
	});
	// mon - HP
	socket.on('hp', function(hpArr) {
		console.log(sockId, '\n\thp', hpArr);
		var roomNum, users, len, i, user;
		roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			users = roomArr[roomNum].users;
			len = users.length;
			for (i = 0; i < len; i += 1) {
				user = users[i];
				if (user.connected) {
					sockMap[user.sockId].emit('hp', hpArr[i]);
				}
			}
		}
	});
	// mon - 누구의 차례인가
	socket.on('turn', function(info) {
		console.log(sockId, '\n\tturn', info);
		var turnIndex, hpArr, roomNum, users, len, i, user, waitTurn, tempTurnIndex;
		turnIndex = info.turnIndex;
		hpArr = info.hpArr;
		roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			users = roomArr[roomNum].users;
			len = users.length;
			for (i = 0; i < len; i += 1) {
				user = users[i];
				if (user.connected) {
					waitTurn = 0;
					tempTurnIndex = turnIndex;
					while (i !== tempTurnIndex) {
						tempTurnIndex += 1;
						if (tempTurnIndex >= hpArr.length) {
							tempTurnIndex = 0;
						}
						if (hpArr[tempTurnIndex] > 0) {
							waitTurn += 1;
						}
					}
					sockMap[user.sockId].emit('waitTurnToMyTurn', waitTurn);
				}
			}
		}
	});
	// mon - 게임시작
	socket.on('startGame', function() {
		console.log(sockId, '\n\tstartGame');
		var roomNum, room;
		roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			room = roomArr[roomNum];
			room.gaming = true;
			room.users.forEach(function (user, index) {
				if (user.connected) {
					sockMap[user.sockId].emit('startGame', index);
				}
			});
		}
	});
	// TODO mon - 게임 끝
	socket.on('endGame', function() {
		console.log(sockId, '\n\tendGame');
		var roomNum, room, users, len, i;
		roomNum = getRoomNumByMonId(sockId);
		if (roomNum > -1) {
			room = roomArr[roomNum];
			room.gaming = false;
			users = room.users;
			len = users.length;
			for (i = len - 1; i >= 0; i -= 1) {
				if (users[i].connected === false) {
					users.splice(i, 1);
				}
			}
			sendToMon(room, 'updateRoom', room);
			broadcastRoom(room, 'endGame');
			broadcastRoom(room, 'clear_ready');
		}
	});
	
	// remote - join
	socket.on('join', function(userInfo) {
		console.log(sockId, '\n\tjoin', userInfo);
		var roomNum, room, tankIndex, roomAndIndex;
		roomNum = userInfo.roomNum;
		room = roomArr[roomNum];
		if (!room) {
			socket.emit('tank_error', '방이 존재하지 않습니다.');
			console.log(sockId, '\n\tFail Join because No Room.');
			return;
		}
		if (room.gaming === true) {
			socket.emit('tank_error', '현재 게임이 진행중입니다. 게임이 끝난 후 입장 가능합니다.');
			console.log(sockId, '\n\tFail Join because Already Game.');
			return;
		}
		if (room.users.length >= room.userLimit) {
			socket.emit('tank_error', '현재 방이 꽉 찼습니다.');
			console.log(sockId, '\n\tFail Join because Full Room.');
			return;
		}
		
		tankIndex = room.users.length;
		room.users.push({
			sockId: sockId,
			nickName: userInfo.nickName,
			roomNum: userInfo.roomNum,
			connected: true
		});
		sendToMon(room, 'updateRoom', room);
		broadcastRoom(room, 'clear_ready');
		socket.emit('successJoin');
		console.log(sockId, '\n\tSuccess Join.');
	});
	// remote - tank (angle, power, fire, ready)
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


