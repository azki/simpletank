/**
 * Shot
 * @author azki (azki@azki.org)
 */
/*global Date, Math, setTimeout, simpleTank*/
"use strict";
simpleTank.Shot = function () {
	this.init.apply(this, arguments);
};
simpleTank.Shot.prototype = {
	nameSpace: simpleTank,
	init: function (ctx, properties) {
		this.ctx = ctx;
		this.map = properties.map || null;
		this.tanks = properties.tanks || null;
		this.x = 0;
		this.y = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.color = "";
		this.damageRage = 0;
		this.damageValue = 0;
		this.shooting = false;
		this.explosion = false;
		this.explosionLevel = 0;
		this.callback = null;
	},
	initShot: function () {
		var tanks, angle, power;
		tanks = this.tanks;
		this.x = tanks.getGunX();
		this.y = tanks.getGunY();
		angle = tanks.getAngle();
		if (0 < angle) {
			angle += 180;
		}
		power = tanks.getPower();
		this.speedX = -power * Math.cos(angle * Math.PI / 180);
		this.speedY = power * Math.sin(angle * Math.PI / 180);
		this.color = tanks.getColor();
		this.damageRage = tanks.getDamageRage();
		this.damageValue = tanks.getDamageValue();
		this.shooting = false;
		this.explosion = false;
	},
	shoot: function (callback) {
		var timerFn, thisP, drawDelay, loop, loopPerFrame, beforeDate;
		if (callback) {
			this.callback = callback;
		}
		thisP = this;
		drawDelay = 13;
		loop = 0;
		loopPerFrame = 5;
		beforeDate = new Date();
		this.shooting = true;
		this.explosion = false;
		timerFn = function () {
			thisP.x += thisP.speedX;
//			thisP.x += +0.1;//wind.
			thisP.y += thisP.speedY;
			thisP.speedY += 0.001;
			if (thisP.isHit()) {
				thisP.hit();
			}
			else {
				loop += 1;
				if (loop % loopPerFrame === 0) {
					if (loopPerFrame < 100 && 2 < Math.round(((new Date()) - beforeDate) / loopPerFrame)) {
						loopPerFrame += 5;
					}
					beforeDate = new Date();
					thisP.redraw();
					setTimeout(timerFn, drawDelay);
				}
				else {
					timerFn();
				}
			}
		};
		setTimeout(timerFn, drawDelay);
	},
	isHit: function () {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		return this.map.height <= y || this.map.getDataValue(x) <= y || this.tanks.getFar(x, y) <= 5;
	},
	hit: function () {
		var x, y, timerFn, thisP;
		x = Math.round(this.x);
		y = Math.round(this.y);
		if (this.map.height <= y) {
			this.shooting = false;
			if (this.callback) {
				this.callback();
				this.callback = null;
			}
		}
		else {
			this.explosion = true;
			this.explosionLevel = 0;
			this.redraw();
			thisP = this;
			timerFn = setTimeout(function () {
				thisP.explosionLevel = 1;
				thisP.redraw();
				setTimeout(function () {
					thisP.explosionLevel = 0;
					thisP.explosion = false;
					thisP.shooting = false;
					thisP.redraw();
					thisP.damage();
					thisP.dig();
					if (thisP.callback) {
						thisP.callback();
						thisP.callback = null;
					}
				}, 400);
			}, 100);
		}
		this.redraw();
	},
	damage: function () {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		this.tanks.damage(x, y, this.damageRage, this.damageValue);
	},
	dig: function () {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		this.map.dig(x, y, this.damageRage);
		this.tanks.land();
	},
	redraw: function () {
		var ctx, mapWidth, mapHeight;
		ctx = this.ctx;
		mapWidth = this.map.width;
		mapHeight = this.map.height;
		ctx.save();
		
		ctx.clearRect(0, 0, mapWidth, mapHeight);
		if (this.shooting) {
			if (this.explosion) {
				if (this.explosionLevel === 1) {
					ctx.beginPath();
					ctx.lineWidth = "1";//shot border
					ctx.fillStyle = this.color;
					ctx.arc(Math.round(this.x), Math.round(this.y), this.damageRage, 0, Math.PI * 2, false);
					ctx.stroke();
					ctx.fill();
				}
			}
			else {
				ctx.beginPath();
				ctx.lineWidth = "2";//shot border
				ctx.fillStyle = this.color;
				ctx.arc(Math.round(this.x), Math.round(this.y), 3, 0, Math.PI * 2, false);
				ctx.stroke();
				ctx.fill();
			}
		}
		
		ctx.restore();
	},
	getDataValue: function (x) {
		return this.mapData[x];
	}
};
