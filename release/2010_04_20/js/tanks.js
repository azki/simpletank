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
		this.count = properties.count || 0;
		this.tankArr = [];
		this.turn = 0;
		this.colorTable = ["#f00", "#00f", "#ff0", "#f0f", "#0ff"];
		this.nameTable = ["철수", "영희", "민정", "성준", "나영"];
	},
	newTanks: function () {
		this.initTanks();
		this.redraw();
	},
	initTanks: function () {
		//only client
		var i, j, len, tanks, tank, randX, randAngle, colorTable, nameTable, needNewX;
		tanks = this.tankArr;
		len = this.count;
		colorTable = this.colorTable;
		nameTable = this.nameTable;
		for (i = 0; i < len; i += 1) {
			needNewX = true;
			while (needNewX) {
				randX = Math.round(Math.random() * 639);
				needNewX = false;
				for (j = 0; j < i; j += 1) {
					if (Math.abs(tanks[j].x - randX) < 75) {
						needNewX = true;
						break;
					}
				}
			}
			randAngle = Math.round(Math.random() * 180) - 90;
			tank = tanks[i] = new this.nameSpace.Tank(this.ctx, {
				type: 1,
				x: randX,
				y: this.map.getDataValue(randX),
				angle: randAngle,
				color: colorTable[i],
				name: nameTable[i]
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
	setTanksStat: function () {
		//from server.
		//TODO.
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
		this.drawTurn(ctx, mapWidth - 90, 20, 10);
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
		tank = this.tankArr[this.turn];
		tankX = tank.x;
		tankY = tank.y;
		tank.x = x + (size + space) * 5;
		tank.y = y + 12;
		tank.redraw();
		tank.x = tankX;
		tank.y = tankY;
	},
	getTank: function (index) {
		return this.tankArr[index];
	},
	getTurnTank: function () {
		return this.tankArr[this.turn];
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
		tank = this.tankArr[this.turn];
		return tank.x + tank.getGunX();
	},
	getGunY: function () {
		//only client.
		var tank;
		tank = this.tankArr[this.turn];
		return tank.y + tank.getGunY();
	},
	getAngle: function () {
		//only client.
		var tank;
		tank = this.tankArr[this.turn];
		return tank.angle;
	},
	getPower: function () {
		//only client.
		var tank;
		tank = this.tankArr[this.turn];
		return tank.power;
	},
	getColor: function () {
		//only client.
		var tank;
		tank = this.tankArr[this.turn];
		return tank.color;
	},
	getDamageRage: function () {
		//only client.
		var tank;
		tank = this.tankArr[this.turn];
		return tank.damageRage;
	},
	getDamageValue: function () {
		//only client.
		var tank;
		tank = this.tankArr[this.turn];
		return tank.damageValue;
	},
	damage: function (x, y, range, value) {
		var i, len, tank, tanks, far, needRedraw;
		tanks = this.tankArr;
		len = this.count;
		needRedraw = false;
		for (i = 0; i < len; i += 1) {
			tank = tanks[i];
			far = tank.getFar(x, y);
			if (far <= range) {
				tank.hp -= Math.round(value * (range - far) / range);
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
