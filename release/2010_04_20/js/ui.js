/**
 * Ui
 * @author azki (azki@azki.org)
 */
/*global $, Math, document, parseInt, setInterval, simpleTank*/
"use strict";
simpleTank.Ui = function () {
	this.init.apply(this, arguments);
};
simpleTank.Ui.prototype = {
	nameSpace: simpleTank,
	init: function (map, tanks, shot) {
		this.map = map;
		this.tanks = tanks;
		this.shot = shot;
		this.tank = null;
		
		map.newMapData();
		map.redraw();
		tanks.initTanks();
		tanks.redraw();
		
		this.initEvent();
		this.drawTankHp();
		this.setTurnTank();
	},
	drawTankHp: function () {
		var i, len, tanks, tank, hp;
		tanks = this.tanks;
		len = tanks.count;
		for (i = 0; i < len; i += 1) {
			tank = tanks.getTank(i);
			hp = tank.hp;
			if (hp < 0) {
				hp = 0;
			}
			$("#player" + i + "hpBar").width(hp * 3).text(tank.name + " (hp: " + hp + ")");
		}
	},
	setTurnTank: function () {
		var tank, powerValue;
		tank = this.tank = this.tanks.getTurnTank();
		powerValue = Math.round(tank.power * 100);
		$("#angleValue").val(tank.angle);
		$("#powerValue").val(powerValue);
	},
	setTankValue: function () {
		var tank, $dom, value, needRedraw;
		tank = this.tank;
		needRedraw = false;
		$dom = $("#angleValue");
		value = parseInt($dom.val(), 10);
		if (-90 <= value && value <= 90) {
			if (tank.angle !== value) {
				tank.angle = value;
				needRedraw = true;
			}
		}
		$dom = $("#powerValue");
		value = parseInt($dom.val(), 10);
		if (0 <= value && value <= 99) {
			value = value / 100;
			if (tank.power !== value) {
				tank.power = value;
			}
		}
		if (needRedraw) {
			this.tanks.redraw();
		}
	},
	initEvent: function () {
		var thisP;
		thisP = this;
		$("#canvasPanel").click(function (e) {
			var tank, clickX, clickY, power, angle;
			tank = thisP.tank;
			clickX = e.clientX;
			clickY = e.clientY;
			//power
			power = Math.round(tank.getFar(clickX, clickY) / 3);
			if (power < 0) {
				power = 0;
			}
			else {
				if (99 < power) {
					power = 99;
				}
			}
			$("#powerValue").val(power);
			//angle
			//clickX = Math.round(this.gunLength * Math.sin(this.angle * Math.PI / 180));
			angle = -Math.round((Math.atan((clickY - tank.y) / (clickX - tank.x)) * 180 / Math.PI));
			if (angle === 0) {
				angle = 1;
			}
			else {
				if (angle <= -90) {
					angle = 90;
				}
			}
			$("#angleValue").val(angle);
		});
		$("#shoot").click(function () {
			thisP.shoot();
		});
		$(document).keydown(function (e) {
			var keyValue;
			if (e.shift !== true && e.ctrl !== true) {
				keyValue = e.keyCode;
				switch (keyValue) {
				case 65://a
					thisP.angleDown();
					break;
				case 37://←.
					thisP.angleDown();
					break;
				case 68://d
					thisP.angleUp();
					break;
				case 39://→.
					thisP.angleUp();
					break;
				case 83://s
					thisP.powerDown();
					break;
				case 40://↓.
					thisP.powerDown();
					break;
				case 87://w
					thisP.powerUp();
					break;
				case 38://↑.
					thisP.powerUp();
					break;
				case 70://f
					thisP.shoot();
					break;
				}
			}
		});
		setInterval(function () {
			thisP.setTankValue();
		}, 250);
	},
	angleDown: function () {
		var $dom;
		$dom = $("#angleValue :selected").prev();
		if (0 < $dom.size()) {
			$("#angleValue").val($dom.val());
		}
	},
	angleUp: function () {
		var $dom;
		$dom = $("#angleValue :selected").next();
		if (0 < $dom.size()) {
			$("#angleValue").val($dom.val());
		}
	},
	powerDown: function () {
		var $dom;
		$dom = $("#powerValue :selected").prev();
		if (0 < $dom.size()) {
			$("#powerValue").val($dom.val());
		}
	},
	powerUp: function () {
		var $dom;
		$dom = $("#powerValue :selected").next();
		if (0 < $dom.size()) {
			$("#powerValue").val($dom.val());
		}
	},
	shoot: function () {
		var shot, thisP;
		thisP = this;
		shot = this.shot;
		if (shot.shooting !== true) {
			this.setTankValue();//angle,power update.
			shot.initShot();
			shot.shoot(function () {
				thisP.tanks.passTurn();
				thisP.drawTankHp();
				thisP.setTurnTank();
			});
		}
	}
};
