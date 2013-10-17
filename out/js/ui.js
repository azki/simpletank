/**
 * Ui
 * @author azki (azki@azki.org)
 */
/*jslint regexp:false,nomen:false,white:false*/
/*global $, Math, document, isFinite, parseInt, setInterval, simpleTank*/
"use strict";
simpleTank.Ui = function() {
	this.init.apply(this, arguments);
};
simpleTank.Ui.prototype = {
	nameSpace: simpleTank,
	init: function(map, tanks, shot, player, callback) {
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
			redraw: function() {
				this.setTurnTank();
				this.tanks.redraw();
			},
			shoot: this.shoot
		}, map, tanks);
		
		this.initEvent();
		this.drawTankHp();
		this.setTurnTank();
	},
	newGame: function(player) {
		var tanks, shot;
		tanks = this.tanks;
		shot = this.shot;
		
		this.player.stopAi();
		this.player = player;
		
		tanks.initTanks(player);
		tanks.redraw();
		shot.stop();
		shot.initShot({
			type: "temp"
		});
		shot.redraw();
		player.initAi({
			obj: this,
			redraw: function() {
				this.setTurnTank();
				this.tanks.redraw();
			},
			shoot: this.shoot
		}, this.map, tanks);
		this.drawTankHp();
		this.setTurnTank();
	},
	nextPlayer: function() {
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
			if (this.onNewTurn) {
				this.onNewTurn(tanks.turn);
			}
		} else {
			this.shootable = false;
			if (this.callback) {
				this.callback({
					type: "turnLost"
				});
			}
		}
		this.drawPinWheel();
	},
	getTurnIndex: function () {
		return this.tanks.turn;
	},
	drawPinWheel: function () {
		var map = this.map;
		if ($("#pinWheel").data("wind") !== map.wind) {
			$("#pinWheel")
			.data("wind", map.wind)
			.css("margin-left", (map.wind * 40) + "px")
			.removeClass();
			setTimeout(function() { //크롬에서 타이머 안주면 애니메이션 속도가 안변해서 타이머줌.
				var windClass = Math.abs(map.wind) + 1;
				$("#pinWheel").removeClass().addClass("wind" + windClass);
			}, 1);
		}
	},
	drawTankHp: function() {
		var i, len, tanks, tank, hp;
		tanks = this.tanks;
		len = tanks.count;
		for (i = 0; i < len; i += 1) {
			tank = tanks.getTank(i);
			hp = tank.hp;
			if (hp <= 0) {
				hp = 0;
			}
			$("#player" + i + "hpBar").width(hp * 3).children(0).text(tank.name + " (hp: " + hp + ")");
		}
	},
	setTurnTank: function() {
		var tank, powerValue;
		tank = this.tank = this.tanks.getTurnTank();
		if (tank !== null) {
			powerValue = Math.round(tank.power * 100);
			$("#angleValue").val(tank.angle);
			$("#powerValue").val(powerValue);
		}
	},
	initEvent: function() {
		var thisP;
		thisP = this;
		$("#canvasPanel").click(function(e) {
			var tank, clickX, clickY, power, angle;
			tank = thisP.tank;
			if (thisP.shootable && tank !== null) {
				clickX = isFinite(e.layerX) ? e.layerX : e.offsetX;
				clickY = isFinite(e.layerX) ? e.layerY : e.offsetY;
				//power
				power = Math.round(tank.getFar(clickX, clickY) / 3);
				thisP.setPower(thisP.tanks.turn, power);
				//angle
				angle = -Math.round((Math.atan((clickY - tank.y) / (clickX - tank.x)) * 180 / Math.PI));
				thisP.setAngle(thisP.tanks.turn, angle);
			}
		});
		$(document).keydown(function(e) {
			var keyValue;
			if (thisP.shootable && e.shift !== true && e.ctrl !== true) {
				keyValue = e.keyCode;
				switch (keyValue) {
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
				case 66://b
					if (0 < thisP.tank.doubleShot) {
						thisP.shootFromEvent({
							type: "doubleShot"
						});
					}
					break;
				}
			}
		});
	},
	shootFromEvent: function(option) {
		this.shootable = false;
		this.shoot(option, null);
	},
	shoot: function(option, callback) {
		var thisP, tanks, shot;
		thisP = this;
		tanks = this.tanks;
		shot = this.shot;
		shot.initShot(option);
		shot.shoot(function(result) {
			tanks.passTurn();
			thisP.drawTankHp();
			thisP.setTurnTank();
			thisP.nextPlayer();
			if (callback) {
				callback(result);
			}
		});
	},
	/*
	 * setPower
	 * power : 0 ~ 99
	 */
	setPower: function(tankIndex, power) {
		if (power < 0) {
			power = 0;
		} else {
			if (99 < power) {
				power = 99;
			}
		}
		var tank = this.tanks.getTank(tankIndex);
		if (tank) {
			power /= 100;
			if (tank.power !== power) {
				tank.power = power;
				this.tanks.redraw();
			}
		}
	},
	/*
	 * setAngle
	 * angle : 1 ~ 179
	 */
	setAngle: function(tankIndex, angle) {
		angle %= 180;
		if (angle === 0) {
			angle = 1;
		} else {
			if (angle <= -90) {
				angle = 90;
			}
		}
		var tank = this.tanks.getTank(tankIndex);
		if (tank) {
			if (tank.angle !== angle) {
				tank.angle = angle;
				this.tanks.redraw();
			}
		}
	},
	fire: function(shootType, callback) {
		this.shoot({
			type: shootType
		}, callback);
	}
};
