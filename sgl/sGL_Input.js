"use strict";
var g_CameraController = null;
var g_InputController = null;

class CameraController {
	constructor( gl ) {
		var box = gl.canvas.getBoundingClientRect();
		this.canvas = gl.canvas;
		if ( g_CameraController )
			return;
		g_CameraController = this;

		this.offsetX = box.left;
		this.offsetY = box.top;

		this.initX = 0;
		this.initY = 0;
		this.prevX = 0;
		this.prevY = 0;

		var self = this;
		this.onUpHandler = e => this.onMouseUp(e);
		this.onMoveHandler = e => this.onMouseMove(e); 

		this.canvas.addEventListener("mousedown", function(e){ self.onMouseDown(e); });
		this.canvas.addEventListener("wheel", function(e){ self.onMouseWheel(e); });
	}

	getMouseVec2(e) { return [e.pageX - this.offsetX, e.pageY - this.offsetY]; }

	onMouseDown(e) {
		if ( g_backbone.currentScene().camera().mode === Camera.MODE_FREE ) {
			this.canvas.requestPointerLock();   

			this.canvas.addEventListener("mouseup", this.onUpHandler);
			document.addEventListener("mousemove", this.onMoveHandler);
		}
		else {  
			var mousePos = this.getMouseVec2(e);
			this.initX = this.prevX = mousePos[0];
			this.initY = this.prevY = mousePos[1];
			this.canvas.addEventListener("mouseup", this.onUpHandler);
			this.canvas.addEventListener("mousemove", this.onMoveHandler);
		}
	}
	onMouseUp(e) {
		if ( g_backbone.currentScene().camera().mode === Camera.MODE_FREE ) {
			document.removeEventListener("mousemove", this.onMoveHandler);
			document.exitPointerLock();
		}
		else
			this.canvas.removeEventListener("mousemove", this.onMoveHandler);

		this.canvas.removeEventListener("mouseup", this.onUpHandler);
	}
	onMouseWheel(e) {
		var wheel = e.wheelDelta||-e.deltaY;
		var delta = Math.min( 1, Math.max(-1, wheel));
		var cam = g_backbone.currentScene().camera();
		cam.panZ(delta * (cam.zoomRate / this.canvas.height));
	}
	onMouseMove(e) {
		var dx, dy, pos, cam = g_backbone.currentScene().camera();
		if ( cam.mode === Camera.MODE_FREE ) {
			dx = e.movementX;
			dy = e.movementY;
		}
		else {
			var pos = this.getMouseVec2(e);
			dx = pos[0] - this.prevX;
			dy = pos[1] - this.prevY;
		}

		if (!e.shiftKey) {
			cam.addRotate(
				dy * (cam.rotateRate / this.canvas.height),
				dx * (cam.rotateRate / this.canvas.width),
				0
			);
		}
		else {      
			cam.panX(  -dx * (cam.panRate / this.canvas.width));
			cam.panY(  dy * (cam.panRate / this.canvas.height));
		}

		if ( cam.mode !== Camera.MODE_FREE ) {
			this.prevX = pos[0];
			this.prevY = pos[1];
		}
	}
}

class InputController {
	constructor( gl ) {
		this.gl = gl;
		var box = gl.canvas.getBoundingClientRect();
		this.canvas = gl.canvas;
		this.canvas.tabIndex='0';
		if ( g_InputController )
			return;
		var self = this;
		g_InputController = this;

		this.objectSelected = false;

		this.rotateRate = -300;
		this.panRate    = 5;
		this.zoomRate   = 200;

		this.offsetX = box.left;
		this.offsetY = box.top;

		this.initX = this.initY = this.prevX = this.prevY = 0;
		
		this.mouseDown = false;
		this.canvas.addEventListener("mousedown", e=>this.onMouseDown(e) );
		this.canvas.addEventListener("mousemove", e=>this.onMouseMove(e) );
		this.canvas.addEventListener("mouseup",   e=>this.onMouseUp(e)   );
		
		this.canvas.addEventListener("wheel",     e=>this.onMouseWheel(e));

		this.canvas.addEventListener("keydown",   e=>this.onKeyDown(e)   );
		this.canvas.addEventListener("keyup",     e=>this.onKeyUp(e)   );
	}

	getMouseVec2(e) { return [e.pageX - this.offsetX, e.pageY - this.offsetY]; }

	onMouseDown(e) {
		this.mouseMovment = 0;
		this.mouseMoved = false;
		this.mouseDown = true;
	}

	onMouseMove(e) {
		if ( !this.mouseDown )
			return;
		var selection = g_backbone.currentScene().currentSelection();
		if ( selection ) {
			
		}
		else {
			
		}
		
		if ( !this.mouseMoved ) {
			this.mouseMovment += Math.abs(e.movementX) + Math.abs(e.movementY);

			if (this.mouseMovment  > 10) 
				this.mouseMoved = true;
		}
	}

	onMouseUp(e) {
		this.mouseDown = false;
		if ( this.mouseMoved == false ) {
			var ray = Ray.createPickRay( this.getMouseVec2(e), gl.canvas, g_backbone.currentScene().camera() );
			var col = g_backbone.collision();
			var selection = col.selectRay(ray);

			if ( selection.objectFound ) {
				var selectedObject = col.getClosestObject(selection);

				var rayDistancVector = vec3.scale(vec3.create(), ray.direction, selectedObject.distance);
				var selectPos = vec3.add(vec3.create(), ray.origin, rayDistancVector);

				g_backbone.currentScene().setSelection( selectedObject.selection.obj );
				// Draw Mouse to Pos
				// g_backbone.currentScene().addObject( new Model("obj/Mouse.obj").loadDomTexture("mouse", "spec", "normal" ).setPosition( selectPos[0], selectPos[1], selectPos[2] ));
			}
			else 
				g_backbone.currentScene().clearSelection();
		} 
		this.mouseMoved = false;
		this.mouseMovment = 0;
	}

	onMouseWheel(e) {
	}

	onKeyDown(e) {
		var cam = g_backbone.currentScene().camera()
		if ( e.key == 'w' )
			cam.moveForward();
		if ( e.key == 's' )
			cam.moveBackward();
		if ( e.key == 'a' )
			cam.moveLeft();
		if ( e.key == 'd' )
			cam.moveRight();
		if ( e.key == 'q' )
			cam.moveUp();
		if ( e.key == 'e' )
			cam.moveDown();

		if ( e.key == 'z' )
			cam.setPosition(0,0,5);
		

		if (e.key == '1') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_OUTPUT;
		if (e.key == '2') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_POS;
		if (e.key == '3') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_NORMAL;
		if (e.key == '4') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_DIFFUSE;
		if (e.key == '5') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_ASPECT;
		if (e.key == '6') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_DEPTH;
		if (e.key == '7') 
			gDeferredRenderer.mode = DeferredRenderer.MODE_AMBIENT;
		if (e.key == '8') 
			gDeferredRenderer.mode = 8;
		if (e.key == '9') 
			gDeferredRenderer.mode = 9;
		if (e.key == '0') 
			gDeferredRenderer.mode = 0;
	}
	onKeyUp(e) {
		var cam = g_backbone.currentScene().camera()
		if ( e.key == 'w' ) 
			cam.moveStopForward();		
		if ( e.key == 's' ) 
			cam.moveStopBackward();		
		if ( e.key == 'a' ) 
			cam.moveStopLeft();		
		if ( e.key == 'd' ) 
			cam.moveStopRight();		
		if ( e.key == 'q' ) 
			cam.moveStopUp();		
		if ( e.key == 'e' ) 
			cam.moveStopDown();
	}
}

class GamepadController {
	constructor() {
		this.gamepads=[];
		this.buttonBindings=[];
		this.axisBindings=[];
		this.enableGamepad();
	}

	enableGamepad() {
		window.addEventListener("gamepadconnected", e => {
				this.addGamePad(e.gamepad);
			});
		window.addEventListener("gamepaddisconnected", e => {
				clearInterval(this.gamepads[e.gamepad.index].pollerID);
				delete this.gamepads[e.gamepad.index];
			});
		// init scan
		this.scanGamePads();
	}
	disableGamepad() {
		this.gamepads.forEach( g=>clearInterval(g.pollerID) );
	}	

	scanGamePads() {
		const gamepad = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
		for ( let i = 0; i < gamepad.length; i++ ) 
			if (gamepad[i]) 
				this.addGamePad( gamepad[i] );
	}
	addGamePad(gamepad) {
		this.gamepads[gamepad.index] = gamepad;
		if ( !this.gamepads[gamepad.index].pollerID )
			this.gamepads[gamepad.index].pollerID = setInterval( ()=> this.pollGamepad(gamepad), 50);
	}
	pollGamepad(gamepad) {
		this.scanGamePads();
		const contButtonBeindings = this.buttonBindings[gamepad.index];
		const contAxisBeindings = this.axisBindings[gamepad.index];

		for ( let i = 0; i < gamepad.buttons.length; i++ ) {
			if (contButtonBeindings === undefined || contButtonBeindings[i] === undefined)
				continue;

			const binding = contButtonBeindings[i];

			let val = gamepad.buttons[i];
			let pressed = val === 1.0;
			if ( typeof(val) === "object" ) {	// for sesetive buttons
				pressed = val.pressed;
				val = val.value;
			}
			if ( val !== binding.lastState ) {
				binding.callback( gamepad.index, val );
				binding.lastState = val;
			}
		}

		for ( let i = 0; i < gamepad.axes.length; i++ ) {
			if (contAxisBeindings === undefined || contAxisBeindings[i] === undefined)
				continue;

			const binding = contAxisBeindings[i];
			const val = gamepad.axes[i];

			if ( val !== binding.lastState ) {
				binding.callback( gamepad.index, val );
				binding.lastState = val;
			}
		}
	}

	bindButton( buttonID, callback, controllerID=0 ) {
		while ( controllerID >= this.buttonBindings.length )
			this.buttonBindings[controllerID] = [];

		const contSettings = this.buttonBindings[controllerID];

		contSettings[buttonID] = { buttonID, callback, lastState: 0.0 };
	}
	bindAxis( axeId, callback, controllerID=0 ) {
		while ( controllerID >= this.axisBindings.length )
			this.axisBindings[controllerID] = [];

		const contSettings = this.axisBindings[controllerID];

		contSettings[axeId] = { axeId, callback, lastState: 0.0 };
	}
}

class KeybordController {
	constructor() {
		this.keyBindings=[];
		this.keyAxesBindings=[];
		this.mouseKeyBindings=[];
		this.mouseAxesBindings={ x:[], y:[] };

		this.canvas = gl.canvas;
		this.mouseCatched=false;
		this.enableKeybordControll();
	}
	handleEvent(event) {
		switch(event.type) {
			case 'keydown': this.keydownEvent(event); break;
			case 'keyup': this.keyupEvent(event); break;
			case 'click': this.catchMouse(event); break;
			case 'mousemove': this.mouseMove(event); break;
			case 'mousedown': this.mouseDown(event); break;
		}
	};
	enableKeybordControll() {
		const box = this.canvas.getBoundingClientRect();
		this.offsetX = box.left;
		this.offsetY = box.top;

		window.addEventListener("keydown", this );
		window.addEventListener("keyup", this );

		window.addEventListener("click", this );
		window.addEventListener("mousemove", this );
		window.addEventListener("mousedown", this );
	}
	disableKeybordControll() {
		window.removeEventListener("keydown", this );
		window.removeEventListener("keyup", this );

		window.removeEventListener("click", this );
		window.removeEventListener("mousemove", this );
		window.removeEventListener("mousedown", this );
	}
	keydownEvent( ev ) {
		ev = ev || window.event;
		this.keyBindings.forEach( b=>{
			if (b.char === ev.key)
				b.callback(0, 1);
		});
		this.keyAxesBindings.forEach( b=>{
			if (b.min === ev.key)
				b.callback(0, 1);
			if (b.max === ev.key)
				b.callback(0, -1);
		});
	}
	keyupEvent( ev ) {
		ev = ev || window.event;
		this.keyBindings.forEach( b=>{
			if (b.char === ev.key)
				b.callback(0, 0);
		});
		this.keyAxesBindings.forEach( b=>{
			if (b.min === ev.key || b.max === ev.key)
				b.callback(0, 0);
		});
	}
	catchMouse() {
		this.canvas.requestPointerLock();
	}
	mouseMove( ev ) {
		if ( document.pointerLockElement !== this.canvas  )
			return;
		ev = ev || window.event;

		let dx = ev.movementX/20.0;
		if ( dx > 1.0 )
			dx = 1.0;
		if ( dx < -1.0 )
			dx = -1.0;

		let dy = ev.movementY/20.0;
		if ( dy > 1.0 )
			dy = 1.0;
		if ( dy < -1.0 )
			dy = -1.0;

		if ( dx !== 0 )
			for (var i = 0; i < this.mouseAxesBindings.x.length; i++) {
				const ref = this.mouseAxesBindings.x[i];
				window.clearTimeout( ref.timeout );
				ref.callback( 0, dx );
				setTimeout( ()=>ref.callback(0,0), 20);
			}
		if ( dy !== 0 )
			for (var i = 0; i < this.mouseAxesBindings.y.length; i++) {
				const ref = this.mouseAxesBindings.y[i];
				ref.callback( 0, dy );
			}
	}
	mouseDown( ev ) {
		if ( !this.mouseCatched )
			return;
		ev = ev || window.event;
	}
	bindButton( char, callback ) {
		this.keyBindings.push({char,callback});
	}
	bindKeyAxis( max, min, callback) {
		this.keyAxesBindings.push({min, max, callback});
	}
	bindMouseAxis( axe, callback ) {
		if ( axe == 'x')
			this.mouseAxesBindings.x.push({callback});
		else 
			this.mouseAxesBindings.y.push({callback});
	}
	bindMouseButton( button, callback ) {
	}
}