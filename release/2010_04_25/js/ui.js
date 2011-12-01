/**
 * Ui
 * @author azki (azki@azki.org)
 */
/*global $, Math, document, isFinite, parseInt, setInterval, simpleTank*/
"use strict";
simpleTank.Ui = function () {
	this.init.apply(this, arguments);
};
simpleTank.Ui.prototype = {
	nameSpace: simpleTank,
	init: function (map, tanks, shot, player, callback) {
		this.map = map;
		this.tanks = tanks;
		this.shot = shot;
		this.player = player;
		this.tank = null;
		this.callback = callback || null;
		
		tanks.initTanks(player);
		tanks.redraw();
		player.initAi({
			obj: this,
			redraw: function () {
				this.setTurnTank();
				this.tanks.redraw();
			},
			shoot: this.shoot
		}, map, tanks);
		
		this.initEvent();
		this.drawTankHp();
		this.setTurnTank();
	},
	newGame: function (player) {
		var tanks, shot;
		tanks = this.tanks;
		shot = this.shot;
		this.player = player;
		tanks.initTanks(player);
		tanks.redraw();
		shot.stop();
		shot.initShot({
			type: "temp"
		});
		shot.redraw();
		player.stopAi();
		player.initAi({
			obj: this,
			redraw: function () {
				this.setTurnTank();
				this.tanks.redraw();
			},
			shoot: this.shoot
		}, this.map, tanks);
		this.drawTankHp();
		this.setTurnTank();
	},
	startPlayer: function () {
		var player, tanks, turn, tank, playerType;
		player = this.player;
		tanks = this.tanks;
		turn = tanks.turn;
		if (0 <= turn) {
			tank = tanks.getTurnTank();
			playerType = player.getType(turn);
			this.shootable = playerType === "user";
			if (playerType.substr(0, 2) === "Ai") {
				player.startAi(turn, tank);
			}
		}
		else {
			this.shootable = false;
			if (this.callback) {
				this.callback({
					type: "turnLost"
				});
			}
		}
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
			$("#player" + i + "hpBar").width(hp * 3).children(0).text(tank.name + " (hp: " + hp + ")");
		}
	},
	setTurnTank: function () {
		var tank, powerValue;
		tank = this.tank = this.tanks.getTurnTank();
		if (tank !== null) {
			powerValue = Math.round(tank.power * 100);
			$("#angleValue").val(tank.angle);
			$("#powerValue").val(powerValue);
		}
	},
	setTankValue: function () {
		var tank, $dom, value, needRedraw;
		tank = this.tank;
		if (tank !== null) {
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
					needRedraw = true;
				}
			}
			if (needRedraw) {
				this.tanks.redraw();
			}
			return true;
		}
		return false;
	},
	initEvent: function () {
		var thisP;
		thisP = this;
		$("#canvasPanel").click(function (e) {
			var tank, clickX, clickY, power, angle;
			tank = thisP.tank;
			if (thisP.shootable && tank !== null) {
				clickX = isFinite(e.layerX) ? e.layerX : e.offsetX;
				clickY = isFinite(e.layerX) ? e.layerY : e.offsetY;
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
			}
		}).mousewheel(function (event, delta) {
			if (thisP.shootable) {
				if (delta < 0) {
					thisP.powerDown();
				}
				else {
					thisP.powerUp();
				}
			}
		});
		$("#shoot").click(function () {
			if (thisP.shootable) {
				thisP.shootFromEvent({
					type: "fire"
				});
			}
		});
		$("#move").click(function () {
			if (thisP.shootable) {
				thisP.shootFromEvent({
					type: "move"
				});
			}
		});
		$(document).keydown(function (e) {
			var keyValue;
			if (thisP.shootable && e.shift !== true && e.ctrl !== true) {
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
					thisP.shootFromEvent({
						type: "fire"
					});
					break;
				case 86://v
					thisP.shootFromEvent({
						type: "move"
					});
					break;
				}
			}
		});
		setInterval(function () {
			if (thisP.shootable) {
				thisP.setTankValue();
			}
		}, 250);
	},
	angleDown: function () {
		var $dom;
		$dom = $("#angleValue :selected").prev();
		if (0 < $dom.size()) {
			$("#angleValue").val($dom.val());
			return true;
		}
		return false;
	},
	angleUp: function () {
		var $dom;
		$dom = $("#angleValue :selected").next();
		if (0 < $dom.size()) {
			$("#angleValue").val($dom.val());
			return true;
		}
		return false;
	},
	powerDown: function () {
		var $dom;
		$dom = $("#powerValue :selected").prev();
		if (0 < $dom.size()) {
			$("#powerValue").val($dom.val());
			return true;
		}
		return false;
	},
	powerUp: function () {
		var $dom;
		$dom = $("#powerValue :selected").next();
		if (0 < $dom.size()) {
			$("#powerValue").val($dom.val());
			return true;
		}
		return false;
	},
	shootFromEvent: function (option) {
		this.shootable = false;
		if (this.setTankValue()) {
			this.shoot(option, null);
		}
	},
	shoot: function (option, callback) {
		var shot, thisP;
		thisP = this;
		shot = this.shot;
		shot.initShot(option);
		shot.shoot(function (result) {
			thisP.tanks.passTurn();
			thisP.drawTankHp();
			thisP.setTurnTank();
			thisP.startPlayer();
			if (callback) {
				callback(result);
			}
		});
	}
};
