/**
 * Tanks
 * @author azki (azki@azki.org)
 */
/*jslint regexp:false,nomen:false,white:false*/
/*global Math, simpleTank*/
"use strict";
simpleTank.Tanks = function() {
	this.init.apply(this, arguments);
};
simpleTank.Tanks.prototype = {
	nameSpace: simpleTank,
	init: function(ctx, properties) {
		this.ctx = ctx;
		this.map = properties.map || null;
		this.count = 0;
		this.tankArr = [];
		this.turn = 0;
	},
	newTanks: function() {
		this.initTanks();
		this.redraw();
	},
	initTanks: function(player) {
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
				type: 1, //동그란 모양만.
				x: randX,
				y: this.map.getYByX(randX),
				angle: tankAngle,
				power: 0.5,
				color: player.getColor(i),
				name: player.getName(i)
			});
			tank.initTank(mapWidth);
		}
	},
	land: function() {
		var thisP, len, tanks, map, landFn;
		thisP = this;
		len = this.count;
		tanks = this.tankArr;
		map = this.map;
		landFn = function () {
			var needRedraw, tank, mapY, i;
			needRedraw = false;
			for (i = 0; i < len; i += 1) {
				tank = tanks[i];
				mapY = map.getYByX(tank.x);
				if (tank.y < mapY) {
					tank.y += 1;
					needRedraw = true;
				} else if (tank.y > mapY) {
					tank.y = mapY;
					needRedraw = true;
				}
			}
			if (needRedraw) {
				thisP.redraw();
				setTimeout(landFn, 20);
			}
		};
		landFn();
	},
	passTurn: function() {
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
	redraw: function() {
		var ctx, i, len, tanks, mapWidth, mapHeight;
		ctx = this.ctx;
		mapWidth = this.map.width;
		mapHeight = this.map.height;
		tanks = this.tankArr;
		len = this.count;
		
		ctx.save();
		
		ctx.clearRect(0, 0, mapWidth, mapHeight);
		//this.drawTurn(ctx, mapWidth - (160 + len * 40), 20, 10);
		this.drawAssist(ctx);
		this.drawHp(ctx, mapWidth - (80 + len * 40), 20, 15, 15);
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
	drawTurn: function(ctx, x, y, size) {
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
			tank.x = x + (size + space) * 6;
			tank.y = y + 12;
			tank.redraw();
			tank.x = tankX;
			tank.y = tankY;
		}
	},
	drawAssist: function(ctx) {
		var tank, tankGunX, tankGunY, tankAngle, assistX, assistY, assistArcArr, i, assistX2, assistY2, assistX3, assistY3, gradient, powerEffect;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			tankGunX = tank.x + tank.getGunX();
			tankGunY = tank.y + tank.getGunY();
			tankAngle = tank.angle;
			
			if (0 < tankAngle) {
				tankAngle += 180;
			}
			assistX = -Math.round(200 * Math.cos(tankAngle * Math.PI / 180)) + tankGunX;
			assistY = Math.round(200 * Math.sin(tankAngle * Math.PI / 180)) + tankGunY;
			
			ctx.save();
			ctx.lineWidth = "1";
			gradient = ctx.createLinearGradient(tankGunX, tankGunY, assistX, assistY);
			gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
			gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
			ctx.strokeStyle = gradient;
			ctx.beginPath();
			powerEffect = Math.ceil(tank.power * 25) % 10;
			for (i = 0; i < 20; i += 2) {
				assistX2 = -Math.round((i * 10 + powerEffect) * Math.cos(tankAngle * Math.PI / 180)) + tankGunX;
				assistY2 = Math.round((i * 10 + powerEffect) * Math.sin(tankAngle * Math.PI / 180)) + tankGunY;
				assistX3 = -Math.round(((i + 1) * 10 + powerEffect) * Math.cos(tankAngle * Math.PI / 180)) + tankGunX;
				assistY3 = Math.round(((i + 1) * 10 + powerEffect) * Math.sin(tankAngle * Math.PI / 180)) + tankGunY;
				ctx.moveTo(assistX2, assistY2);
				ctx.lineTo(assistX3, assistY3);
			}
			ctx.stroke();
			
			ctx.restore();
		}
	},
	drawHp: function(ctx, x, y, size, circleSize) {
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
		x2 = x + (size + space + 2);
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
		x2 = x + (size + space + 2) * 2;
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
				ctx.arc(x2, y2, circleSize - 1, -Math.PI * 0.5, endAngle, false);
				ctx.lineTo(x2, y2);
				ctx.fill();
			}
			x2 += size + circleSize * 2;
		}
		
		ctx.restore();
	},
	getTank: function(index) {
		return this.tankArr[index] || null;
	},
	getTurnTank: function() {
		return 0 <= this.turn ? this.tankArr[this.turn] : null;
	},
	getFar: function(x, y) {
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
	getGunX: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.x + tank.getGunX();
		}
		throw "getGunX";
	},
	getGunY: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.y + tank.getGunY();
		}
		throw "getGunY";
	},
	getAngle: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.angle;
		}
		throw "getAngle";
	},
	getPower: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.power;
		}
		throw "getPower";
	},
	getColor: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.color;
		}
		throw "getColor";
	},
	getDamageRage: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.damageRage;
		}
		throw "getDamageRage";
	},
	getDamageValue: function() {
		//only client.
		var tank;
		if (0 <= this.turn) {
			tank = this.tankArr[this.turn];
			return tank.damageValue;
		}
		throw "getDamageValue";
	},
	damage: function(x, y, range, value) {
		var i, len, tank, tanks, far, damageRange, needRedraw;
		tanks = this.tankArr;
		len = this.count;
		damageRange = range * 1.2;
		needRedraw = false;
		for (i = 0; i < len; i += 1) {
			tank = tanks[i];
			far = tank.getFar(x, y);
			if (far <= damageRange) {
				tank.hp -= Math.ceil(value * ((damageRange - far) * (damageRange - far)) / (damageRange * damageRange));
				if (tank.hp < 0) {
					needRedraw = true;
				}
			}
		}
		if (needRedraw) {
			this.redraw();
		}
	},
	spentDoubleShot: function() {
		//only client.
		if (this.turn < 0) {
			throw "getDamageRage";
		}
		var tank = this.tankArr[this.turn];
		tank.doubleShot -= 1;
	}
};
