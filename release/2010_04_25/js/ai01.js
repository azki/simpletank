/**
 * Ai01
 * @author azki (azki@azki.org)
 */
/*global Math, clearTimeout, setTimeout, simpleTank*/
"use strict";
simpleTank.Ai01 = function () {
	this.init.apply(this, arguments);
};
simpleTank.Ai01.prototype = {
	nameSpace: simpleTank,
	init: function (aiInterface, map, tanks, player, myNum) {
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
		this.timerDelay = 1000;
		this.moveChance = 0.2;
		this.timer = null;
	},
	go: function (tank) {
		var thisP, ui, api, actionArr, timerFn;
		thisP = this;
		ui = this.ui;
		api = this.api;
		actionArr = this.createAction(tank);
		timerFn = function () {
			var action;
			action = actionArr.shift();
			if (action) {
				action.fn.apply(thisP, action.args);
				api.redraw.apply(ui);
				thisP.timer = setTimeout(timerFn, thisP.timerDelay);
			}
			else {
				thisP.timer = null;
				api.shoot.apply(ui, [{
					type: thisP.move ? "move" : "fire",
					bomb: thisP.lastDirection === 0 ? 1 : 0
				}, function (result) {
					thisP.setShootResult(result, thisP.lastPower);
				}]);
				thisP.move = false;
			}
		};
		this.timer = setTimeout(timerFn, 1000);
	},
	stop: function () {
		if (this.timer !== null) {
			clearTimeout(this.timer);
		}
	},
	setShootResult: function (result, lastPower) {
		var resultX, lastX, targetX, resultFar, goalFar;
		resultX = result.x;
		lastX = this.lastX;
		targetX = this.lastTargetX;
		if (resultX < 0) {
			this.supplement = lastPower * (0.7 + 0.3 * Math.random());
		}
		else {
			if (0 < targetX) {
				resultFar = Math.abs(lastX - resultX);
				goalFar = Math.abs(lastX - targetX);
				if (Math.abs(resultFar - goalFar) < 20) {
					this.supplement = lastPower * (0.97 + 0.3 * Math.random());
				}
				else {
					if (Math.abs(resultFar - goalFar) < 100) {
						if (resultFar < goalFar) {
							this.supplement = lastPower * (1.2 - 0.2 * Math.random());
						}
						else {
							this.supplement = lastPower * (0.8 + 0.2 * Math.random());
						}
					}
					else {
						if (resultFar < goalFar) {
							this.supplement = lastPower * (1.3 - 0.3 * Math.random());
						}
						else {
							this.supplement = lastPower * (0.7 + 0.3 * Math.random());
						}
					}
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
			this.move = this.createMove(actionArr, tank, targetTank);
		}
		else {
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
				mapY = map.getDataValue(mapX);
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
		var lastAngle, absAngle, farX, power;
		lastAngle = this.lastAngle;
		if (0 <= this.supplement) {
			power = this.supplement;
		}
		else {
			absAngle = Math.abs(lastAngle);
			farX = Math.abs(tank.x - targetTank.x);
			if (absAngle < 60) {
				if (farX < 200) {
					power = farX * 0.003;
				}
				else {
					if (farX < 400) {
						power = farX * 0.002;
					}
					else {
						power = farX * 0.0015;
					}
				}
			}
			else {
				if (absAngle < 70) {
					if (farX < 300) {
						power = farX * 0.0025;
					}
					else {
						power = farX * 0.0015;
					}
				}
				else {
					power = farX * 0.005;
				}
			}
			power *= 0.95 + Math.random() * 0.1;//random:5%.
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
	createMove: function (actionArr, tank, targetTank) {
		var lastAngle, lastPower, absAngle, chance, mapWidth, targetX, moveSupplement;
		lastAngle = this.lastAngle;
		lastPower = this.lastPower;
		absAngle = Math.abs(lastAngle);
		chance = this.moveChance;
		if (Math.random() < lastPower * chance) {
			mapWidth = this.map.width;
			targetX = targetTank.x;
			if (lastAngle < 0) {
				moveSupplement = mapWidth * 0.3 <= targetX ? 1.2 : 0.8;
			}
			else {
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
