/**
 * Ai04
 * @author azki (azki@azki.org)
 */
/*jslint regexp:false,nomen:false,white:false*/
/*global Math, clearTimeout, setTimeout, simpleTank*/
"use strict";
simpleTank.Ai04 = function () {
	this.init.apply(this, arguments);
};
simpleTank.Ai04.prototype = {
	nameSpace: simpleTank,
	init: function (aiInterface, map, tanks, player, myNum, difficulty) {
		this.ui = aiInterface.obj;
		this.api = aiInterface;
		this.map = map;
		this.tanks = tanks;
		this.player = player;
		this.myNum = myNum;

		this.lastX = -1;
		this.lastTargetX = -1;
		this.lastDirection = 1;
		this.lastAngle = -1;
		this.lastPower = 0;
		this.supplement = -1;
		this.move = false;
		this.doubleShot = false;
		this.timer = null;
		
		this.testShot = new this.nameSpace.Shot(null, {
			map: map,
			tanks: tanks
		});
		this.lastHp = 100;
		this.moveChance = 0.1;
		this.doubleShotChance = 0.2;
		this.difficulty = difficulty || 5;//1~10
		this.timerDelay = Math.round(1000 / this.difficulty);
	},
	go: function (tank) {
		var thisP, ui, api, actionArr, timerFn;
		thisP = this;
		ui = this.ui;
		api = this.api;
		actionArr = this.createAction(tank);
		timerFn = function () {
			var action, shotType;
			action = actionArr.shift();
			if (action) {
				action.fn.apply(thisP, action.args);
				api.redraw.apply(ui);
				thisP.timer = setTimeout(timerFn, thisP.timerDelay);
			} else {
				thisP.timer = null;
				shotType = "fire";
				if (thisP.move) {
					shotType = "move";
				} else if (thisP.doubleShot) {
					shotType = "doubleShot";
				}
				api.shoot.apply(ui, [{
					type: shotType,
					bomb: thisP.player.hasAliveUser(thisP.tanks) ? 0 : 1
				}, function (result) {
					thisP.setShootResult(result, thisP.lastPower);
				}]);
				thisP.move = false;
				thisP.doubleShot = false;
			}
		};
		this.timer = setTimeout(timerFn, 1000);
	},
	stop: function () {
		if (this.timer !== null) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	},
	setShootResult: function (result, lastPower) {
		var resultX, lastX, targetX, resultFar, goalFar;
		resultX = result.x;
		lastX = this.lastX;
		targetX = this.lastTargetX;
		if (resultX < 0) {
			this.supplement = lastPower * (0.3 + 0.7 * Math.random());//30%~100%
		}
		else {
			if (0 < targetX) {
				resultFar = Math.abs(lastX - resultX);
				goalFar = Math.abs(lastX - targetX);
				if (resultFar < goalFar) {
					this.supplement = lastPower * (2.0 - 1.0 * Math.random());//100%~200%
					if (lastPower < 0.1) {
						this.supplement += 0.1;
					}
				}
				else {
					this.supplement = lastPower * (0.5 + 0.5 * Math.random());//50%~100%
				}
			}
			else {
				this.supplement = -1;
			}
		}
	},
	setTankStat: function (tank, angle, power) {
		tank.angle = angle;
		tank.power = power;
	},
	createAction: function (tank) {
		var actionArr, angle, targetTank;
		actionArr = [];
		targetTank = this.getNearTarget(tank.x);
		if (targetTank) {
			if (this.lastX !== tank.x) {
				this.supplement = -1;
				this.lastX = tank.x;
			}
			if (Math.abs(this.lastTargetX - targetTank.x) > 20) {
				this.supplement = -1;
			}
			this.lastTargetX = targetTank.x;
			this.lastDirection = this.setDirection(actionArr, tank, targetTank);
			angle = this.createAngle(actionArr, tank, targetTank);
			if (Math.abs(this.lastAngle - angle) > 10) {
				this.supplement = -1;
			}
			this.lastAngle = angle;
			this.lastPower = this.setPower(actionArr, tank, targetTank);
			this.doubleShot = this.createDoubleShot(tank);
			this.move = this.createMove(actionArr, tank, targetTank);
		} else {
			this.lastDirection = 0;
			this.kamikaze(actionArr, tank);
		}
		return actionArr;
	},
	getNearTarget: function (x) {
		var player, tanks, myTeam, targetTank, len, i, tank, far, minFar;
		player = this.player;
		tanks = this.tanks;
		myTeam = player.getTeam(this.myNum);
		targetTank = null;
		len = player.count;
		for (i = 0; i < len; i += 1) {
			if (player.getTeam(i) !== myTeam) {
				tank = tanks.getTank(i);
				if (0 < tank.hp) {
					far = Math.abs(x - tank.x);
					if (targetTank === null || far < minFar) {
						targetTank = tank;
						minFar = far;
					}
				}
			}
		}
		return targetTank;
	},
	setDirection: function (actionArr, tank, targetTank) {
		if (tank.x < targetTank.x) {
			if (tank.angle < 0) {
				actionArr.push({
					fn: this.setTankStat,
					args: [tank, -tank.angle, tank.power]
				});
			}
			return 1;
		}
		else {
			if (0 < tank.angle) {
				actionArr.push({
					fn: this.setTankStat,
					args: [tank, -tank.angle, tank.power]
				});
			}
			return -1;
		}
	},
	createAngle: function (actionArr, tank, targetTank) {
		var map, myX, myY, targetX, direction, maxAngle, mapX, mapY, angle;
		map = this.map;
		myX = tank.x;
		myY = tank.y - (tank.tankDepth + tank.tankSize);
		targetX = targetTank.x;
		direction = this.lastDirection;
		maxAngle = direction;
		for (mapX = tank.x; mapX !== targetX; mapX += direction) {
			if (Math.abs(mapX - myX) < 5) {
				angle = direction;
			}
			else {
				mapY = map.getYByX(mapX);
				angle = -Math.round((Math.atan((mapY - myY) / (mapX - myX)) * 180 / Math.PI));
			}
			if (0 < direction) {
				if (angle <= 0) {//angle != 0
					angle = direction;
				}
			}
			else {
				if (0 <= angle) {
					angle = direction;
				}
			}
			if (Math.abs(maxAngle) < Math.abs(angle)) {
				maxAngle = angle;
			}
		}
		if (0 < direction) {
			angle = maxAngle + Math.ceil((90 - maxAngle) * 0.4);
			if (80 < angle) {
				angle = 80;
			}
		}
		else {
			angle = maxAngle - Math.ceil((90 + maxAngle) * 0.4);
			if (angle < -80) {
				angle = -80;
			}
		}
		if (this.lastAngle !== angle) {
			actionArr.push({
				fn: this.setTankStat,
				args: [tank, angle, tank.power]
			});
		}
		return angle;
	},
	setPower: function (actionArr, tank, targetTank) {
		var thisP, tanks, gunX, gunY, testAngle, testShot, len, targetX, i, testPower, far, minFar, goodPower, testFireCallback;
		thisP = this;
		tanks = this.tanks;
		gunX = tanks.getGunX();
		gunY = tanks.getGunY();
		testAngle = this.lastAngle;
		testShot = this.testShot;
		len = this.difficulty;
		targetX = this.lastTargetX;
		if (20 < this.lastHp - tank.hp && 200 < Math.abs(targetX - gunX)) {
			this.moveChance = 0.5;
			this.doubleShotChance = 0;
		} else {
			this.moveChance = 0.1;
			this.doubleShotChance = 0.2;
		}
		this.lastHp = tank.hp;
		minFar = -1;
		goodPower = testPower;
		testFireCallback = function (result) {
			var resultX = result.x;
			if (0 <= resultX) {
				far = Math.abs(resultX - targetX);
			}
			else {
				far = 100;
			}
			thisP.setShootResult(result, testPower);
		};
		for (i = 0; i < len; i += 1) {
			testPower = this.setPowerOrigin(actionArr, tank, targetTank);
			testShot.initShot({
				type: "test",
				x: gunX,
				y: gunY,
				angle: testAngle,
				power: testPower
			});
			testShot.shoot(testFireCallback);
			if (minFar < 0 || far < minFar) {
				minFar = far;
				goodPower = testPower;
			}
		}
		actionArr.push({
			fn: this.setTankStat,
			args: [tank, testAngle, goodPower]
		});
		return goodPower;
	},
	setPowerOrigin: function (actionArr, tank, targetTank) {
		var lastAngle, absAngle, farX, power;
		lastAngle = this.lastAngle;
		if (0 <= this.supplement) {
			power = this.supplement;
		}
		else {
			power = Math.random();//random: 0.00 ~ 0.99
		}
		if (power < 0) {
			power = 0;
		}
		else {
			if (0.99 < power) {
				power = 0.99;
			}
		}
		actionArr.push({
			fn: this.setTankStat,
			args: [tank, lastAngle, power]
		});
		return power;
	},
	createDoubleShot: function (tank) {
		if (tank.doubleShot <= 0) {
			return false;
		}
		var chance = this.doubleShotChance;
		return Math.random() < chance;
	},
	createMove: function (actionArr, tank, targetTank) {
		var lastAngle, lastPower, absAngle, chance, mapWidth, targetX, moveSupplement;
		lastAngle = this.lastAngle;
		lastPower = this.lastPower;
		absAngle = Math.abs(lastAngle);
		chance = this.moveChance;
		if (Math.random() < chance) {
			mapWidth = this.map.width;
			targetX = targetTank.x;
			if (lastAngle < 0) {
				moveSupplement = mapWidth * 0.3 <= targetX ? 1.2 : 0.8;
			} else {
				moveSupplement = targetX <= mapWidth * 0.7 ? 1.2 : 0.8;
			}
			actionArr.push({
				fn: this.setTankStat,
				args: [tank, lastAngle, lastPower * moveSupplement]
			});
			return true;
		}
		return false;
	},
	kamikaze: function (actionArr, tank) {
		this.lastTargetX = tank.x;
		this.lastAngle = 90;
		this.lastPower = Math.random() * 0.9;
		actionArr.push({
			fn: this.setTankStat,
			args: [tank, this.lastAngle, this.lastPower]
		});
	}
};
