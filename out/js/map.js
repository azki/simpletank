/**
 * Map
 * @author azki (azki@azki.org)
 */
/*jslint regexp:false,nomen:false,white:false*/
/*global Math, simpleTank*/
"use strict";
simpleTank.Map = function() {
	this.init.apply(this, arguments);
};
simpleTank.Map.prototype = {
	nameSpace: simpleTank,
	init: function(ctx, properties) {
		this.ctx = ctx;
		this.width = properties.width;
		this.height = properties.height;
		this.startDataValue = Math.round(this.height * 0.6);
		this.mapData = null;
		this.wind = 0;
		
		//for wind gage bar.
		// If thie canvasContext class doesn't have  a fillRoundedRect, extend it now
		if (!ctx.constructor.prototype.fillRoundedRect) {
			// Extend the canvaseContext class with a fillRoundedRect method
			ctx.constructor.prototype.fillRoundedRect = function(xx, yy, ww, hh, rad, fill, stroke) {
				if (typeof(rad) === "undefined") {
					rad = 5;
				}
				this.beginPath();
				this.moveTo(xx + rad, yy);
				this.arcTo(xx + ww, yy, xx + ww, yy + hh, rad);
				this.arcTo(xx + ww, yy + hh, xx, yy + hh, rad);
				this.arcTo(xx, yy + hh, xx, yy, rad);
				this.arcTo(xx, yy, xx + ww, yy, rad);
				if (stroke) {
					this.stroke(); // Default to no stroke
				}
				if (fill || typeof(fill) === "undefined") {
					this.fill(); // Default to fill
				}
			}; // end of fillRoundedRect method
		}
	},
	rndWind: function() {
		if (Math.random() < 0.1) {
			this.wind = Math.floor(Math.random() * 5) - 2;
			this.redraw();
		}
	},
	redraw: function() {
		var ctx, i, lingrad, gradientStartY, moonX, moonY;
		ctx = this.ctx;
		ctx.save();
		
		ctx.clearRect(0, 0, this.width, this.height);
		//sky
		lingrad = ctx.createLinearGradient(0, 0, 0, this.height - 1);
		lingrad.addColorStop(0, "#04BFBF");
		lingrad.addColorStop(0.5, "#CAFCD8");
		lingrad.addColorStop(1, "#FFFFFF");
		ctx.fillStyle = lingrad;
		ctx.fillRect(0, 0, this.width, this.height);
		//wind
		lingrad = ctx.createLinearGradient(20, 0, 220, 0);
		lingrad.addColorStop(0, "#F7E967");
		lingrad.addColorStop((this.wind + 2) / 4, "#00f");
		lingrad.addColorStop(1, "#F7E967");
		ctx.fillStyle = lingrad;
		ctx.fillRoundedRect(20, 20, 200, 30);
		//ground
		gradientStartY = Math.round(this.height * 0.3);
		lingrad = ctx.createLinearGradient(0, gradientStartY, 0, this.height - 1);
		lingrad.addColorStop(0, "#FFFFFF");
		lingrad.addColorStop(0.5, "#588F27");
		lingrad.addColorStop(1, "#00261C");
		ctx.fillStyle = lingrad;
		ctx.beginPath();
		ctx.moveTo(this.width - 1, this.height - 1);
		ctx.lineTo(0, this.height - 1);
		for (i = 0; i < this.width; i += 1) {
			ctx.lineTo(i, this.getYByX(i));
		}
		ctx.closePath();
		ctx.fill();
		//border
		ctx.strokeRect(0, 0, this.width, this.height);
		
		ctx.restore();
	},
	newMapData: function() {
		//only client
		var i, map, width, changeWidth, dataValue;
		map = [];
		width = this.width;
		changeWidth = 3;
		dataValue = this.startDataValue;
		for (i = 0; i < width; i += 1) {
			map[i] = dataValue += Math.round(Math.random() * (changeWidth * 2)) - changeWidth;
		}
		this.mapData = 0.5 < Math.random() ? map : map.reverse();
	},
	getYByX: function(x) {
		return this.mapData[x];
	},
	dig: function(x, y, range) {
		var i, mapData, mapDataValue, width, height, startX, endX, sideX, sideHeight, startY, endY;
		mapData = this.mapData;
		width = this.width;
		height = this.height;
		startX = x - range;
		if (startX < 0) {
			startX = 0;
		}
		endX = x + range;
		if (width <= endX) {
			endX = width - 1;
		}
		for (i = startX; i <= endX; i += 1) {
			mapDataValue = mapData[i];
			if (mapDataValue < height) {
				sideX = Math.abs(x - i);
				sideHeight = Math.floor(Math.sqrt(Math.pow(range, 2) - Math.pow(sideX, 2)));
				startY = y - sideHeight;
				endY = y + sideHeight;
				if (mapDataValue <= startY) {
					mapData[i] += sideHeight * 2;
				} else {
					if (mapDataValue <= endY) {
						mapData[i] += endY - mapDataValue;
					}
				}
				if (height <= mapData[i]) {
					mapData[i] = height;
				}
			}
		}
		this.redraw();
	}
};
