/**
 * Shot
 * @author azki (azki@azki.org)
 */
/*global Date, Math, clearTimeout, setTimeout, simpleTank*/
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
		this.shotOption = null;
		this.timer = null;
	},
	initShot: function (option) {
		var tanks, angle, power;
		if (option && option.type === "test") {
			this.x = option.x;
			this.y = option.y;
			angle = option.angle;
			power = option.power;
		}
		else {
			tanks = this.tanks;
			this.x = tanks.getGunX();
			this.y = tanks.getGunY();
			angle = tanks.getAngle();
			power = tanks.getPower();
			this.color = tanks.getColor();
			this.damageRage = tanks.getDamageRage();
			this.damageValue = tanks.getDamageValue();
		}
		if (option && option.bomb === 1) {
			this.damageRage *= 3;
			this.damageValue *= 3;
		}
		if (0 < angle) {
			angle += 180;
		}
		this.speedX = -power * Math.cos(angle * Math.PI / 180);
		this.speedY = power * Math.sin(angle * Math.PI / 180);
		this.shooting = false;
		this.explosion = false;
		this.shotOption = option ? option : {};
	},
	shoot: function (callback) {
		var timerFn, thisP, drawDelay, loop, loopPerFrame, wind, gravity, beforeDate, isTest;
		if (callback) {
			this.callback = callback;
		}
		thisP = this;
		drawDelay = 13;
		loop = 0;
		loopPerFrame = 5;
		wind = this.map.wind * 0.05;
		gravity = 0.001;
		beforeDate = new Date();
		this.shooting = true;
		this.explosion = false;
		isTest = this.shotOption.type === "test";
		timerFn = function () {
			thisP.x += thisP.speedX;
			thisP.x += wind;
			thisP.y += thisP.speedY;
			thisP.speedY += gravity;
			if (thisP.isHit()) {
				thisP.hit();
				thisP.timer = null;
			}
			else {
				loop += 1;
				if (isTest === false && loop % loopPerFrame === 0) {
					if (loopPerFrame < 100 && 2 < Math.round(((new Date()) - beforeDate) / loopPerFrame)) {
						loopPerFrame += 5;
					}
					beforeDate = new Date();
					thisP.redraw();
					thisP.timer = setTimeout(timerFn, drawDelay);
				}
				else {
					timerFn();
				}
			}
		};
		if (isTest) {
			timerFn();
		}
		else {
			this.timer = setTimeout(timerFn, drawDelay);
			//for crx
			try {
				$("#bomb1")[0].pause();
				$("#bomb1")[0].currentTime = 0;
				$("#bomb1")[0].play();
			} catch (ignore) {}
		}
	},
	stop: function () {
		if (this.timer !== null) {
			clearTimeout(this.timer);
		}
		try {
			$("#bomb1")[0].pause();
			$("#bomb2")[0].pause();
		} catch (ignore) {}
	},
	isHit: function () {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		return this.map.height <= y || this.map.getDataValue(x) <= y || this.tanks.getFar(x, y) <= 5;
	},
	hit: function () {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		if (x < 0 || this.map.width <= x) {
			this.shooting = false;
			if (this.callback) {
				this.callback({
					x: -1,
					y: -1
				});
				this.callback = null;
			}
			if (this.shotOption.type !== "test") {
				this.redraw();
			}
		}
		else {
			if (this.shotOption.type === "test") {
				this.shootTest();
			}
			else {
				if (this.shotOption.type === "move") {
					this.shootMove(x);
				}
				else {
					this.shootExplosion();
				}
			}
		}
	},
	shootTest: function () {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		this.shooting = false;
		if (this.callback) {
			this.callback({
				x: x,
				y: y
			});
			this.callback = null;
		}
	},
	shootMove: function (x) {
		var tanks, tank;
		tanks = this.tanks;
		tank = tanks.getTurnTank();
		tank.x = x;
		tanks.land();
		this.shooting = false;
		this.redraw();
		if (this.callback) {
			this.callback({
				x: x,
				y: tank.y
			});
			this.callback = null;
		}
	},
	shootExplosion: function () {
		var thisP, explosionFn;
		this.explosion = true;
		this.explosionLevel = 0;
		this.redraw();
		thisP = this;
		explosionFn = function () {
			thisP.explosionLevel += 1;
			thisP.redraw();
			if (thisP.explosionLevel < 6) {
				thisP.timer = setTimeout(explosionFn, 300);
			}
			else {
				thisP.timer = setTimeout(function(){
					var x, y;
					if (thisP.explosion) {
						thisP.timer = null;
						thisP.explosionLevel = 0;
						thisP.explosion = false;
						thisP.shooting = false;
						thisP.redraw();
						thisP.damage();
						thisP.dig();
						thisP.map.rndWind();
						if (thisP.callback) {
							x = Math.round(thisP.x);
							y = Math.round(thisP.y);
							thisP.callback({
								x: x,
								y: y
							});
							thisP.callback = null;
						}
					}
				}, 300);
			}
		};
		this.timer = setTimeout(explosionFn, 100);
		//for crx
		try {
			$("#bomb2")[0].pause();
			$("#bomb2")[0].currentTime = 0;
			$("#bomb2")[0].play();
		} catch (ignore) {}
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
		var ctx, mapWidth, mapHeight, lingrad, explosionRange;
		ctx = this.ctx;
		mapWidth = this.map.width;
		mapHeight = this.map.height;
		ctx.save();
		
		ctx.clearRect(0, 0, mapWidth, mapHeight);
		if (this.shooting) {
			if (this.explosion) {
				if (this.explosionLevel === 1 || this.explosionLevel === 3) {
					explosionRange = Math.round(this.damageRage * 1.5);
					ctx.beginPath();
					lingrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, explosionRange);
					lingrad.addColorStop(0, this.color);
					lingrad.addColorStop(1, "rgba(0, 0, 0, 0)");
					ctx.fillStyle = lingrad;
					ctx.arc(Math.round(this.x), Math.round(this.y), explosionRange, 0, Math.PI * 2, false);
					ctx.fill();
				}
				if (this.explosionLevel === 2) {
					explosionRange = Math.round(this.damageRage * 1.5);
					ctx.beginPath();
					lingrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, explosionRange);
					lingrad.addColorStop(0, "rgba(0, 0, 0, 0)");
					lingrad.addColorStop(1, this.color);
					ctx.fillStyle = lingrad;
					ctx.arc(Math.round(this.x), Math.round(this.y), explosionRange, 0, Math.PI * 2, false);
					ctx.fill();
				}
				if (this.explosionLevel === 4) {
					explosionRange = Math.round(this.damageRage * 1);
					ctx.beginPath();
					lingrad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, explosionRange);
					lingrad.addColorStop(0, "rgba(0, 0, 0, 0)");
					lingrad.addColorStop(1, this.color);
					ctx.fillStyle = lingrad;
					ctx.arc(Math.round(this.x), Math.round(this.y), explosionRange, 0, Math.PI * 2, false);
					ctx.fill();
				}
				if (this.explosionLevel === 5) {
					explosionRange = Math.round(this.damageRage * 1);
					ctx.beginPath();
					ctx.fillStyle = "#000";
					ctx.arc(Math.round(this.x), Math.round(this.y), explosionRange, 0, Math.PI * 2, false);
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
