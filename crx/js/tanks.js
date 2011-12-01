/**
 * Tanks
 * @author azki (azki@azki.org)
 */
/*global Math, simpleTank*/
"use strict";
simpleTank.Tanks = function () {
	this.init.apply(this, arguments);
};
simpleTank.Tanks.prototype = {
	nameSpace: simpleTank,
	init: function (ctx, properties) {
		this.ctx = ctx;
		this.map = properties.map || null;
		this.count = 0;
		this.tankArr = [];
		this.turn = 0;
	},
	newTanks: function () {
		this.initTanks();
		this.redraw();
	},
	initTanks: function (player) {
		//only client
		var i, j, len, tanks, tank, mapWidth, randX, tankAngle, needNewX;
		this.turn = 0;
		tanks = this.tankArr;
		len = this.count = player.count;
		mapWidth = this.map.width;
		for (i = 0; i < len; i += 1) {
			needNewX = true;
			while (needNewX) {
				randX = Math.round(Math.random() * (mapWidth - 1));
				needNewX = false;
				for (j = 0; j < i; j += 1) {
					if (Math.abs(tanks[j].x - randX) < Math.floor(mapWidth / 2 / len)) {
						needNewX = true;
						break;
					}
				}
			}
			tankAngle = randX * 2 < mapWidth ? 45 : -45;
			tank = tanks[i] = new this.nameSpace.Tank(this.ctx, {
				type: player.getTeam(i) == 1 ? 1 : 2,
				x: randX,
				y: this.map.getDataValue(randX),
				angle: tankAngle,
				color: player.getColor(i),
				name: player.getName(i)
			});
			tank.initTank();
		}
	},
	land: function () {
		var i, len, tanks, tank, mapY, needRedraw;
		tanks = this.tankArr;
		len = this.count;
		needRedraw = false;
		for (i = 0; i < len; i += 1) {
			tank = tanks[i];
			mapY = this.map.getDataValue(tank.x);
			if (tank.y !== mapY) {
				tank.y = mapY;
				if (mapY <= 0) {
					tank.hp = 0;
				}
				needRedraw = true;
			}
		}
		if (needRedraw) {
			this.redraw();
		}
	},
	passTurn: function () {
		var tanks, oriTurn, turn;
		tanks = this.tankArr;
		oriTurn = this.turn;
		turn = oriTurn;
		while (true) {
			turn += 1;
			if (this.count <= turn) {
				turn = 0;
			}
			if (0 < tanks[turn].hp) {
				break;
			}
			if (oriTurn === turn) {
				if (tanks[turn].hp < 0) {
					this.turn = -1;
				}
				return;
			}
		}
		this.turn = turn;
		this.redraw();
	},
	redraw: function () {
		var ctx, i, len, tanks, mapWidth, mapHeight;
		ctx = this.ctx;
		mapWidth = this.map.width;
		mapHeight = this.map.height;
		tanks = this.tankArr;
		len = this.count;
		
		ctx.save();
		
		ctx.clearRect(0, 0, mapWidth, mapHeight);
		this.drawTurn(ctx, mapWidth - (140 + len * 40), 20, 10);
		this.drawAssist(ctx);
		this.drawHp(ctx, mapWidth - (50 + len * 40), 20, 10, 15);
		for (i = 0; i < len; i += 1) {
			tanks[i].redraw();
		}
		
		ctx.restore();
	},
	/**
	 * drawTurn : 슈퍼 노가다 코드 -_-
	 * @param {object} ctx
	 * @param {number} x
	 * @param {number} y
	 * @param {number} size
	 */
	drawTurn: function (ctx, x, y, size) {
		var x2, y2, space, tank, tankX, tankY;
		space = 3;
		
		ctx.save();
		
		ctx.lineWidth = "2";
		ctx.lineJoin = "bevel";
		ctx.strokeStyle = "#000";
		ctx.beginPath();
		//T
		ctx.moveTo(x, y);
		x2 = x + size;
		ctx.lineTo(x2, y);
		x2 = x + Math.round(size / 2);
		ctx.moveTo(x2, y);
		y2 = y + size;
		ctx.lineTo(x2, y2);
		//U
		x2 = x + size + space;
		ctx.moveTo(x2, y);
		y2 = y + size;
		ctx.lineTo(x2, y2);
		x2 += size;
		ctx.lineTo(x2, y2);
		ctx.lineTo(x2, y);
		//R
		x2 = x + (size + space) * 2;
		ctx.moveTo(x2, y);
		y2 = y + size;
		ctx.lineTo(x2, y2);
		ctx.moveTo(x2, y);
		x2 += size;
		ctx.lineTo(x2, y);
		y2 = y + Math.round(size / 2);
		ctx.lineTo(x2, y2);
		x2 -= size;
		ctx.lineTo(x2, y2);
		x2 += size;
		y2 = y + size;
		ctx.lineTo(x2, y2);
		//N
		x2 = x + (size + space) * 3;
		ctx.moveTo(x2, y);
		y2 = y + size;
		ctx.lineTo(x2, y2);
		ctx.moveTo(x2, y);
		x2 += size;
		ctx.lineTo(x2, y2);
		y2 -= size;
		ctx.lineTo(x2, y2);
		//:
		x2 = x + (size + space) * 4;
		y2 = y + Math.round(size / 5);
		ctx.moveTo(x2, y2);
		y2 += Math.round(size / 5);
		ctx.lineTo(x2, y2);
		y2 += Math.round(size / 5);
		ctx.moveTo(x2, y2);
		y2 += Math.round(size / 5);
		ctx.lineTo(x2, y2);
		
		ctx.stroke();
		ctx.restore();
		
		//turn tank
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			tankX = tank.x;
			tankY = tank.y;
			tank.x = x + (size + space) * 5;
			tank.y = y + 12;
			tank.redraw();
			tank.x = tankX;
			tank.y = tankY;
		}
	},
	drawAssist: function (ctx) {
		var tank, tankX, tankY, tankPower, tankAngle, assistX, assistY, assistArcArr, i;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			tankX = tank.x;
			tankY = tank.y;
			tankPower = tank.power;
			tankAngle = tank.angle;
			
			ctx.save();
			
			ctx.lineWidth = "3";
			ctx.strokeStyle = tank.color;
			if (0 < tankAngle) {
				tankAngle += 180;
			}
			assistX = -Math.round(tankPower * 300 * Math.cos(tankAngle * Math.PI / 180)) + tankX;
			assistY = Math.round(tankPower * 300 * Math.sin(tankAngle * Math.PI / 180)) + tankY;
			assistArcArr = [0.1, 0.4, 0.6, 0.9, 1.1, 1.4, 1.6, 1.9];
			for (i = 0; i < 8; i += 2) {
				ctx.beginPath();
				ctx.arc(assistX, assistY, 10, Math.PI * assistArcArr[i], Math.PI * assistArcArr[i + 1], false);
				ctx.stroke();
			}
			
			ctx.restore();
		}
	},
	drawHp: function (ctx, x, y, size, circleSize) {
		var x2, y2, space, tanks, len, i, tank, endAngle;
		space = 3;
		
		ctx.save();
		
		ctx.lineWidth = "2";
		ctx.lineJoin = "bevel";
		ctx.strokeStyle = "#000";
		ctx.beginPath();
		//H
		ctx.moveTo(x, y);
		y2 = y + size;
		ctx.lineTo(x, y2);
		y2 = y + Math.round(size / 2);
		ctx.moveTo(x, y2);
		x2 = x + size;
		ctx.lineTo(x2, y2);
		ctx.moveTo(x2, y);
		y2 = y + size;
		ctx.lineTo(x2, y2);
		//P
		x2 = x + (size + space);
		ctx.moveTo(x2, y);
		y2 = y + size;
		ctx.lineTo(x2, y2);
		ctx.moveTo(x2, y);
		x2 += size;
		ctx.lineTo(x2, y);
		y2 = y + Math.round(size / 2);
		ctx.lineTo(x2, y2);
		x2 -= size;
		ctx.lineTo(x2, y2);
		//:
		x2 = x + (size + space) * 2;
		y2 = y + Math.round(size / 5);
		ctx.moveTo(x2, y2);
		y2 += Math.round(size / 5);
		ctx.lineTo(x2, y2);
		y2 += Math.round(size / 5);
		ctx.moveTo(x2, y2);
		y2 += Math.round(size / 5);
		ctx.lineTo(x2, y2);
		
		ctx.stroke();
		
		tanks = this.tankArr;
		len = this.count;
		ctx.lineWidth = "2";
		ctx.lineJoin = "miter";
		ctx.strokeStyle = "#000";
		x2 = x + (size + space) * 3 + circleSize;
		y2 = y + circleSize;
		for (i = 0; i < len; i += 1) {
			//border
			ctx.beginPath();
			ctx.arc(x2, y2, circleSize, 0, Math.PI * 2, false);
			ctx.stroke();
			//hp
			tank = tanks[i];
			if (tank.hp > 0) {
				ctx.fillStyle = tank.color;
				ctx.beginPath();
				endAngle = Math.PI * 2 * tank.hp / 100 - Math.PI * 0.5;
				ctx.arc(x2, y2, circleSize - 1, - Math.PI * 0.5, endAngle, false);
				ctx.lineTo(x2, y2);
				ctx.fill();
			}
			x2 += size + circleSize * 2;
		}
		
		ctx.restore();
	},
	getTank: function (index) {
		return this.tankArr[index];
	},
	getTurnTank: function () {
		return 0 <= this.turn ? this.tankArr[this.turn] : null;
	},
	getFar: function (x, y) {
		var i, len, tanks, min, far;
		tanks = this.tankArr;
		len = this.count;
		for (i = 0; i < len; i += 1) {
			far = tanks[i].getFar(x, y);
			if (i === 0 || far < min) {
				min = far;
			}
		}
		return min;
	},
	getGunX: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.x + tank.getGunX();
		}
		throw "getGunX";
	},
	getGunY: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.y + tank.getGunY();
		}
		throw "getGunY";
	},
	getAngle: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.angle;
		}
		throw "getAngle";
	},
	getPower: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.power;
		}
		throw "getPower";
	},
	getColor: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.color;
		}
		throw "getColor";
	},
	getDamageRage: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.damageRage;
		}
		throw "getDamageRage";
	},
	getDamageValue: function () {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.damageValue;
		}
		throw "getDamageValue";
	},
	damage: function (x, y, range, value) {
		var i, len, tank, tanks, far, damageRange, needRedraw;
		tanks = this.tankArr;
		len = this.count;
		damageRange = range * 1.2;
		needRedraw = false;
		for (i = 0; i < len; i += 1) {
			tank = tanks[i];
			far = tank.getFar(x, y);
			if (far <= damageRange) {
				tank.hp -= Math.ceil(value * (damageRange - far) / damageRange);
				if (tank.hp < 0) {
					needRedraw = true;
				}
			}
		}
		if (needRedraw) {
			this.redraw();
		}
	}
};
