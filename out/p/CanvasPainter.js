/****************************************************************************************************
	Copyright (c) 2005, 2006 Rafael Robayna

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	Additional Contributions by: Morris Johns
****************************************************************************************************/

var CanvasPainter = CanvasWidget.extend({
	canvasInterface: "",
	contextI: "",

	canvasWidth: 0,
	canvasHeight: 0,

	startPos: {x:-1,y:-1},
	curPos: {x:-1,y:-1},

	drawColor: "rgb(0,0,0)",  //need to change to drawColor...

	drawActions: null,
	curDrawAction: 0,

	cpMouseDownState: false,

	/***
		init(String canvasName, String canvasInterfaceName, Array position) 
				initializes the canvas elements, adds event handlers and 
				pulls height and width information from the canvas element

		Parameters:
			canvasName - the name of the bottom canvas element
			canvasInterfaceName - the name of the top canvas element
			canvasPos - the absolution position of both canvas elements, used for mouse tracking. 
				ex. {x: 10, y: 10}
	***/

	constructor: function(canvasName, canvasInterfaceName, position) {
		this.canvasInterface = document.getElementById(canvasInterfaceName);
		this.contextI = this.canvasInterface.getContext("2d");
		this.inherit(canvasName, position);
		this.canvasHeight = this.canvas.getAttribute('height');
		this.canvasWidth = this.canvas.getAttribute('width');
		this.drawActions = [this.drawBrush, this.drawPencil, this.drawLine, this.drawRectangle, this.drawCircle, this.clearCanvas];
	},

	initMouseListeners: function() {
		this.mouseMoveTrigger = new Function();
		if(document.all) {
			this.canvasInterface.attachEvent("onmousedown", this.mouseDownActionPerformed.bindAsEventListener(this));
			this.canvasInterface.attachEvent("onmousemove", this.mouseMoveActionPerformed.bindAsEventListener(this));
			this.canvasInterface.attachEvent("onmouseup", this.mouseUpActionPerformed.bindAsEventListener(this));
			attachEvent("mouseup", this.mouseUpActionPerformed.bindAsEventListener(this));
		} else {
			this.canvasInterface.addEventListener("mousedown", this.mouseDownActionPerformed.bindAsEventListener(this), false);
			this.canvasInterface.addEventListener("mousemove", this.mouseMoveActionPerformed.bindAsEventListener(this), false);
			this.canvasInterface.addEventListener("mouseup", this.mouseUpActionPerformed.bindAsEventListener(this), false);
			addEventListener("mouseup", this.mouseUpActionPerformed.bindAsEventListener(this), false);
		}
	},


	mouseDownActionPerformed: function(e) {
		this.startPos = this.getCanvasMousePos(e, this.position);
		this.context.lineJoin = "round";
		//Link mousemove event to the cpMouseMove Function through the wrapper
		this.mouseMoveTrigger = function(e) {
			this.cpMouseMove(e);
		};
    },
	
	cpMouseMove: function(e) {
		this.setColor(this.drawColor);
		this.curPos = this.getCanvasMousePos(e, this.position);

		if(this.curDrawAction == 0) {
			this.drawBrush(this.startPos, this.curPos, this.context);
			this.callWidgetListeners();
			this.startPos = this.curPos;
		} else if(this.curDrawAction == 1) {
			this.drawPencil(this.startPos, this.curPos, this.context);
			this.callWidgetListeners();
			this.startPos = this.curPos;
		} else if(this.curDrawAction == 2) {
			this.contextI.lineWidth = this.context.lineWidth;
			this.contextI.clearRect(0,0,400,400);
			this.drawLine(this.startPos, this.curPos, this.contextI);
		} else if(this.curDrawAction == 3) {
			this.contextI.clearRect(0,0,400,400);
			this.drawRectangle(this.startPos, this.curPos, this.contextI);
		} else if(this.curDrawAction == 4) {
			this.contextI.clearRect(0,0,400,400);
			this.drawCircle(this.startPos, this.curPos, this.contextI);
		}
		this.cpMouseDownState = true;
	},

	mouseUpActionPerformed: function(e) {
		if(!this.cpMouseDownState) return;
		this.curPos = this.getCanvasMousePos(e, this.position);
		if(this.curDrawAction > 1) {
			this.setColor(this.drawColor);
			this.drawActions[this.curDrawAction](this.startPos, this.curPos, this.context, false);
			this.clearInterface();
			this.callWidgetListeners();
		}
		this.mouseMoveTrigger = new Function();
		this.cpMouseDownState = false;
	},

	//Draw Functions
	drawRectangle: function(pntFrom, pntTo, context) {
		context.beginPath();
		context.fillRect(pntFrom.x, pntFrom.y, pntTo.x - pntFrom.x, pntTo.y - pntFrom.y);
		context.closePath();
	},
	drawCircle: function (pntFrom, pntTo, context) {
		var centerX = Math.max(pntFrom.x,pntTo.x) - Math.abs(pntFrom.x - pntTo.x)/2;
		var centerY = Math.max(pntFrom.y,pntTo.y) - Math.abs(pntFrom.y - pntTo.y)/2;
		context.beginPath();
		var distance = Math.sqrt(Math.pow(pntFrom.x - pntTo.x,2) + Math.pow(pntFrom.y - pntTo.y,2));
		context.arc(centerX, centerY, distance/2,0,Math.PI*2 ,true);
		context.fill();
		context.closePath();
	},
	drawLine: function(pntFrom, pntTo, context) {
		context.beginPath();
		context.moveTo(pntFrom.x,pntFrom.y);
		context.lineTo(pntTo.x,pntTo.y);
		context.stroke();
		context.closePath();
	},
	drawPencil: function(pntFrom, pntTo, context) {
		context.save();
		context.beginPath();
		context.lineCap = "round";
		context.moveTo(pntFrom.x,pntFrom.y);
		context.lineTo(pntTo.x,pntTo.y);
		context.stroke();
		context.closePath();
		context.restore();
	},
	drawBrush: function(pntFrom, pntTo, context) {
		context.beginPath();
		context.moveTo(pntFrom.x, pntFrom.y);
		context.lineTo(pntTo.x, pntTo.y);
		context.stroke();
		context.closePath();
	},
	clearCanvas: function(context) {
		canvasPainter.context.beginPath();
		canvasPainter.context.clearRect(0,0,canvasPainter.canvasWidth,canvasPainter.canvasHeight);
		canvasPainter.context.closePath();
	},
	clearInterface: function() {
		this.contextI.beginPath();
		this.contextI.clearRect(0,0,this.canvasWidth,this.canvasHeight);
		this.contextI.closePath();
	},
	
	//Setter Methods
	setColor: function(color) {
		this.context.fillStyle = color;
		this.context.strokeStyle = color;
		this.contextI.fillStyle = color;
		this.contextI.strokeStyle = color;
		this.drawColor = color;
	},

	setLineWidth: function(lineWidth) {
		this.context.lineWidth = lineWidth;
		this.contextI.lineWidth = lineWidth;
	},
	
	//TODO: look into the event responce/calling for this function
	setDrawAction: function(action) {
		if(action == 5) {
			var lastAction = this.curDrawAction;
			this.curDrawAction = action;
			this.callWidgetListeners();
			this.curDrawAction = lastAction;
			this.clearCanvas(this.context);
		} else {
			this.curDrawAction = action;
			this.context.fillStyle = this.drawColor;
			this.context.strokeStyle = this.drawColor;
		}
	},
	
	getDistance: function(pntFrom, pntTo) {
		return Math.sqrt(Math.pow(pntFrom.x - pntTo.x,2) + Math.pow(pntFrom.y - pntTo.y,2));
	}
});