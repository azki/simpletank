/**
 * Ai02
 * @author azki (azki@azki.org)
 */
/*global Math, simpleTank*/
"use strict";
simpleTank.Ai02 = function () {
	var methodList, methodName;
	methodList = simpleTank.Ai01.prototype;
	for (methodName in methodList) {
		if (this[methodName]) {
			this["super_" + methodName] = methodList[methodName];
		}
		else {
			this[methodName] = methodList[methodName];
		}
	}
	this.init.apply(this, arguments);
};
simpleTank.Ai02.prototype = {
	init: function (aiInterface, map, tanks, player, myNum, difficulty) {
		this.super_init(aiInterface, map, tanks, player, myNum);
		this.testShot = new this.nameSpace.Shot(null, {
			map: map,
			tanks: tanks
		});
		this.lastHp = 100;
		this.moveChance = 0.1;
		this.difficulty = difficulty || 5;//1~10
		this.timerDelay = Math.round(1000 / this.difficulty);
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
		}
		else {
			this.moveChance = 0.1;
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
			testPower = this.super_setPower(actionArr, tank, targetTank);
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
	}
};
