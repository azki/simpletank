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
		this.callback = callback || null;
		this.thisMyTurnTimer = null;
		//this.initEvent();
		this.newGame(player);
	},
	newGame: function(player) {
		var map, tanks, shot;
		map = this.map;
		tanks = this.tanks;
		shot = this.shot;
		
		map.newMapData();
		map.redraw();
		map.rndWind();
		
		if (this.player) {
			this.player.stopAi();
		}
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
				this.tanks.redraw();
			},
			shoot: this.shoot
		}, this.map, tanks);
	},
	nextPlayer: function() {
		var player, tanks, turn, tank, playerType;
		player = this.player;
		tanks = this.tanks;
		turn = tanks.turn;
		
		if (turn >= 0 && this.getAliveCount() > 1) {
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
					type: "turnLost",
					isDraw: this.getAliveCount() === 0,
					turnIndex: turn
				});
			}
		}
		this.drawTankHp();
		this.drawThisTurnTank();
		this.drawPinWheel();
	},
	die: function(tankIndex) {
		var tank, thisTurn;
		tank = this.tanks.getTank(tankIndex);
		if (tank.hp > 0) {
			tank.hp = 0;
			this.tanks.redraw();
		}
		if (this.shootable) {
			thisTurn = this.getTurnIndex();
			if (thisTurn === tankIndex) {
				this.passTurn();
			}
		}
	},
	passTurn: function () {
		this.tanks.passTurn();
		this.nextPlayer();
	},
	getHpArr: function () {
		var len, i, result;
		len = this.tanks.count;
		result = [];
		for (i = 0; i < len; i += 1) {
			result[i] = this.tanks.getTank(i).hp;
		}
		return result;
	},
	getNickName: function (index) {
		return this.player.getName(index);
	},
	getAliveCount: function () {
		return this.tanks.getAliveCount();
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
			//TODO 자기 턴이 아닌 애들만 좌표 가져와 상단에 닉네임과 HP 표시.
			tank = tanks.getTank(i);
			hp = tank.hp;
		}
	},
	clearThisMyTurnTimer: function() {
		if (this.thisMyTurnTimer) {
			clearTimeout(thisMyTurnTimer);
			this.thisMyTurnTimer = null;
		}
	},
	drawThisTurnTank: function() {
		var thisP, tank;
		thisP = this;
		tank = this.tanks.getTurnTank();
		if (tank !== null) {
			this.clearThisMyTurnTimer();
			$("#thisIsMyTurn").css({
				display: "inline-block",
				top: tank.y - 64 - tank.tankSize * 3,
				left: tank.x - 32
			}).removeClass().addClass("animated bounceInDown");
			setTimeout(function () {
				thisP.clearThisMyTurnTimer();
				$("#thisIsMyTurn").hide();
			}, 4000);
		}
	},
	/**
	 * @deprecated
	 */
	deprecatedInitEvent: function() {
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
	},
	shoot: function(option, callback) {
		var thisP, tanks, shot;
		thisP = this;
		tanks = this.tanks;
		shot = this.shot;
		if (option.type === "doubleShot") {
			if (tanks.hasDoubleShot() === false) {
				option.type = "shot";
			}
		}
		shot.initShot(option);
		shot.shoot(function(result) {
			console.log('shoot result: ', result);
			// TODO 데미지 표시?
			tanks.passTurn();
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
		if (this.shootable) {
			this.shootable = false;
			this.shoot({
				type: shootType
			}, callback);
		}
	}
};
