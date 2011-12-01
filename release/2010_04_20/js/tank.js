/**
 * Tanks
 * @author azki (azki@azki.org)
 */
/*global Math, simpleTank*/
"use strict";
simpleTank.Tank = function () {
	this.init.apply(this, arguments);
};
simpleTank.Tank.prototype = {
	init: function (ctx, properties) {
		this.ctx = ctx;
		this.x = properties.x || 0;
		this.y = properties.y || 0;
		this.type = properties.type || 0;
		
		this.angle = properties.angle || 0;
		this.power = properties.power || 0;
		this.color = properties.color || "";
		this.name = properties.name || "";
		
		this.hp = 0;
		this.damageRage = 0;
		this.damageValue = 0;
		this.tankDepth = 0;
		this.tankSize = 0;
		this.gunLength = 0;
	},
	initTank: function () {
		this["initTankType" + this.type]();
	},
	initTankType1: function () {
		this.hp = 100;
		this.power = 0.5;
		this.tankDepth = 1;
		this.tankSize = 5;
		this.gunLength = 10;
		this.damageRage = 20;
		this.damageValue = 50;
	},
	redraw: function () {
		var ctx;
		ctx = this.ctx;
		ctx.save();
		
		ctx.translate(this.x, this.y);
		ctx.beginPath();
		this["redrawType" + this.type](ctx);
		
		ctx.restore();
	},
	redrawType1: function (ctx) {
		var gunX, gunY;
		ctx.save();
		
		ctx.lineWidth = "2";//tank border
		ctx.fillStyle = 0 < this.hp ? this.color : "#000";
		ctx.arc(0, -this.tankDepth, this.tankSize, 0, Math.PI, true);
		ctx.fill();
		if (0 < this.hp) {//tank gun
			ctx.moveTo(0, -(this.tankDepth + this.tankSize));
			gunX = this.getGunX();
			gunY = this.getGunY();
			ctx.lineTo(gunX, gunY);
			ctx.stroke();
		}
		
		ctx.restore();
	},
	getGunX: function () {
		var angle;
		angle = -this.angle;
		if (0 < angle) {
			angle += 180;
		}
		return Math.round(this.gunLength * Math.cos(angle * Math.PI / 180));
	},
	getGunY: function () {
		var angle;
		angle = -this.angle;
		if (0 < angle) {
			angle += 180;
		}
		return Math.round(this.gunLength * Math.sin(angle * Math.PI / 180)) - (this.tankDepth + this.tankSize);
	},
	getFar: function (x, y) {
		var xx, yy;
		xx = Math.pow(Math.abs(this.x - x), 2);
		yy = Math.pow(Math.abs(this.y - y), 2);
		return Math.round(Math.sqrt(xx + yy));
	}
};
