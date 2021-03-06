/**
 * Shot
 * @author azki (azki@azki.org)
 */
/*jslint regexp:false,nomen:false,white:false*/
/*global Date, Math, clearTimeout, setTimeout, simpleTank*/
/*global createExplosion*/
"use strict";
var BOMB_DELAY = 1000;
simpleTank.Shot = function() {
	this.init.apply(this, arguments);
};
simpleTank.Shot.prototype = {
	nameSpace: simpleTank,
	init: function(ctx, properties) {
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
		this.callback = null;
		this.shotOption = null;
		this.timer = null;
		this.timer2 = null;
		this.particles = [];
	},
	initShot: function(option) {
		var tanks, angle, power, mapWidth;
		if (option && option.type === "test") {
			this.x = option.x;
			this.y = option.y;
			angle = option.angle;
			power = option.power;
		} else {
			tanks = this.tanks;
			this.x = tanks.getGunX();
			this.y = tanks.getGunY();
			angle = tanks.getAngle();
			power = tanks.getPower();
			this.color = tanks.getColor();
			this.damageRage = tanks.getDamageRage();
			this.damageValue = tanks.getDamageValue();
		}
		
		//map 크기 보정.
		mapWidth = this.map.width
		power *= mapWidth / 1024;
		
		if (option && option.bomb === 1) {
			this.damageRage *= 2;
			this.damageValue *= 2;
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
	shoot: function(callback) {
		var timerFn, thisP, drawDelay, wind, gravity, isTest, forSkipNum, skipStep;
		if (callback) {
			this.callback = callback;
		}
		thisP = this;
		drawDelay = 20;
		skipStep = 20;
		wind = this.map.wind * 0.05;
		gravity = 0.001;
		this.shooting = true;
		this.explosion = false;
		isTest = this.shotOption.type === "test";
		forSkipNum = 0;
		timerFn = function() {
			thisP.x += thisP.speedX;
			thisP.x += wind;
			thisP.y += thisP.speedY;
			thisP.speedY += gravity;
			if (thisP.isHit()) {
				thisP.hit();
				thisP.timer = null;
			} else {
				if (isTest === false) {
					forSkipNum += 1;
					if (forSkipNum % skipStep !== 0) {
						timerFn();
					} else {
						thisP.redraw();
						thisP.timer = setTimeout(timerFn, drawDelay);
					}
				} else {
					timerFn();
				}
			}
		};
		if (isTest) {
			timerFn();
		} else {
			this.timer = setTimeout(timerFn, drawDelay);
		}
	},
	stop: function() {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
		if (this.timer2 !== null) {
			clearTimeout(this.timer2);
			this.timer2 = null;
		}
	},
	isHit: function() {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		return this.map.height <= y || this.map.getYByX(x) <= y || this.tanks.getFar(x, y) <= 5 || x < 0 || this.map.width <= x;
	},
	hit: function() {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		if (x < 0 || this.map.width <= x) {
			if (this.shotOption.type === "test") {
				this.shootTest(-1, -1);
			} else {
				this.processAfterShoot();
			}
		} else {
			if (this.shotOption.type === "test") {
				this.shootTest(Math.round(this.x), Math.round(this.y));
			} else {
				if (this.shotOption.type === "move") {
					this.shootMove(x);
				} else {
					this.shootExplosion();
				}
			}
		}
	},
	shootTest: function(x, y) {
		this.shooting = false;
		if (this.callback) {
			this.callback({
				x: x,
				y: y
			});
			this.callback = null;
		}
	},
	shootMove: function(x) {
		var tanks, tank;
		tanks = this.tanks;
		tank = tanks.getTurnTank();
		tank.x = x;
		tank.y = this.map.height;
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
	shootExplosion: function() {
		var thisP, mapWidth, bombStartTime, bombTimer;
		thisP = this;
		this.explosion = true;
		this.redraw();
		
		this.particles = [];
		mapWidth = this.map.width;
		createExplosion(this.particles, this.x, this.y, this.color, mapWidth / 640 * this.damageRage / 60);
		createExplosion(this.particles, this.x, this.y, "#525252", mapWidth / 640 * this.damageRage / 60);
		
		bombStartTime = new Date();
		bombTimer = setInterval(function() {
			if (new Date() - bombStartTime > BOMB_DELAY) {
				clearInterval(bombTimer);
				thisP.particles = [];
			}
			thisP.redraw(); // update and draw particles
		}, 20);
		this.timer2 = setTimeout(function() {
			thisP.redraw();
			thisP.damage();
			thisP.dig();
			thisP.timer2 = setTimeout(function() {
				thisP.timer2 = null;
				thisP.processAfterShoot();
			}, BOMB_DELAY - 200);
		}, 200);
	},
	processAfterShoot: function () {
		this.explosion = false;
		this.shooting = false;
		this.redraw();
		if (this.shotOption.type === "doubleShot" && this.tanks.isAlive()) {
			this.tanks.spentDoubleShot();
			this.shotOption.type = "shot";
			this.initShot(this.shotOption);
			this.shoot(this.callback);
		} else {
			this.map.rndWind();
			if (this.callback) {
				this.callback({
					x: Math.round(this.x),
					y: Math.round(this.y)
				});
				this.callback = null;
			}
		}
	},
	damage: function() {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		this.tanks.damage(x, y, this.damageRage, this.damageValue);
	},
	dig: function() {
		var x, y;
		x = Math.round(this.x);
		y = Math.round(this.y);
		this.map.dig(x, y, this.damageRage);
		this.tanks.land();
	},
	redraw: function() {
		var ctx, mapWidth, mapHeight, lingrad, explosionRange, i, particle;
		ctx = this.ctx;
		mapWidth = this.map.width;
		mapHeight = this.map.height;
		ctx.save();
		
		ctx.clearRect(0, 0, mapWidth, mapHeight);
		if (this.shooting) {
			if (this.explosion) {
				for (i = 0; i < this.particles.length; i += 1) {
					particle = this.particles[i];
					particle.update(20);
					particle.draw(ctx);
				}
			} else {
				ctx.beginPath();
				ctx.lineWidth = "2";//shot border
				ctx.fillStyle = this.color;
				ctx.arc(Math.round(this.x), Math.round(this.y), 3, 0, Math.PI * 2, false);
				ctx.stroke();
				ctx.fill();
			}
		}
		
		ctx.restore();
	}
};


function randomFloat(min, max) {
	return min + Math.random() * (max - min);
}

function Particle() {
	this.scale = 1.0;
	this.x = 0;
	this.y = 0;
	this.radius = 20;
	this.color = "#000";
	this.velocityX = 0;
	this.velocityY = 0;
	this.scaleSpeed = 0.5;
	
	this.update = function(ms) {
		// shrinking
		this.scale -= this.scaleSpeed * ms / 1000.0;
		
		if (this.scale <= 0) {
			this.scale = 0;
		}
		// moving away from explosion center
		this.x += this.velocityX * ms / 1000.0;
		this.y += this.velocityY * ms / 1000.0;
	};
	
	this.draw = function(context2D) {
		// translating the 2D context to the particle coordinates
		context2D.save();
		context2D.translate(this.x, this.y);
		context2D.scale(this.scale, this.scale);
		
		// drawing a filled circle in the particle's local space
		context2D.beginPath();
		context2D.arc(0, 0, this.radius, 0, Math.PI * 2, true);
		context2D.closePath();
		
		context2D.fillStyle = this.color;
		context2D.fill();
		
		context2D.restore();
	};
}

/*
 * Advanced Explosion effect
 * Each particle has a different size, move speed and scale speed.
 *
 * Parameters:
 * 	x, y - explosion center
 * 	color - particles' color
 */
function createExplosion(particles, x, y, color, sizeScale) {
	var minSize, maxSize, count, minSpeed, maxSpeed, minScaleSpeed, maxScaleSpeed, angle, particle, speed;
	minSize = Math.ceil(10 * sizeScale);
	maxSize = Math.ceil(30 * sizeScale);
	count = 10;
	minSpeed = 60.0;
	maxSpeed = 200.0;
	minScaleSpeed = 1.0;
	maxScaleSpeed = 4.0;
	
	for (angle = 0; angle < 360; angle += Math.round(360 / count)) {
		particle = new Particle();
		
		particle.x = x;
		particle.y = y;
		
		particle.radius = randomFloat(minSize, maxSize);
		
		particle.color = color;
		
		particle.scaleSpeed = randomFloat(minScaleSpeed, maxScaleSpeed);
		
		speed = randomFloat(minSpeed, maxSpeed);
		
		particle.velocityX = speed * Math.cos(angle * Math.PI / 180.0);
		particle.velocityY = speed * Math.sin(angle * Math.PI / 180.0);
		
		particles.push(particle);
	}
}

