/**
 * Player
 * @author azki (azki@azki.org)
 */
/*jslint regexp:false,nomen:false,white:false*/
/*global simpleTank*/
"use strict";
simpleTank.Player = function() {
	this.init.apply(this, arguments);
};
simpleTank.Player.prototype = {
	nameSpace: simpleTank,
	init: function(userArray) {
		this.data = userArray;
		this.count = userArray.length;
		this.aiArray = [];
		this.aiInterface = null;
	},
	initAi: function(aiInterface, map, tanks) {
		var data, i, len, playerType;
		data = this.data;
		len = this.count;
		this.aiInterface = aiInterface;
		for (i = 0; i < len; i += 1) {
			if (this.isAi(i)) {
				playerType = data[i].type;
				this.aiArray[i] = new this.nameSpace[playerType](aiInterface, map, tanks, this, i, data[i].difficulty);
			} else {
				this.aiArray[i] = null;
			}
		}
	},
	stopAi: function() {
		var len, i, ai;
		len = this.count;
		for (i = 0; i < len; i += 1) {
			ai = this.aiArray[i];
			if (ai) {
				ai.stop();
			}
		}
	},
	startAi: function(turn, tank) {
		this.aiArray[turn].go(tank);
	},
	getType: function(index) {
		return this.data[index].type;
	},
	getColor: function(index) {
		return this.data[index].color;
	},
	getName: function(index) {
		return this.data[index].name;
	},
	getTeam: function(index) {
		return this.data[index].team;
	},
	isAi: function(index) {
		return this.data[index].type.substr(0, 2) === "Ai";
	}
};
