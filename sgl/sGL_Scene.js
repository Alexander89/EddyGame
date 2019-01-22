"use strict";

class Scene {
	constructor (loadDone) {
		this.enableSelection = true;		

		this.clearScene();
		window.addEventListener('allResLoaded', loadDone );
	}
	disableSelection(){
		this.enableSelection = false;
	}
	clearScene() {
		this.defaultShader = null;
		this.activCam = null;

		this.cameras = [];
		this.objects = [];
		this.instanceMap = new Map();
		this.lights = [];

		this.uiElements = [];
		
		this.collisionMgr = new CollisionMgr();

		var cam = new Camera( gl );
		cam.transform.position = [ 0, 7, 0 ];
		cam.transform.setRotate( -90, 0, 0 );
		cam.updateViewMatrix();
		this.addCamera(cam);

		this.selectionMark = null;
		this.selection = null;

		this.maxRenderPass = 0;

		g_activeCamera = null;
		g_allCameras = [];
		g_LightID = 0;
		g_shadowShader = null;
		g_shadowMapID = 0;
	}

	addCamera(cam){ 
		this.cameras.push(cam); 
		this.activCam = cam;
		return this;
	}
	camera() { return this.activCam; }
	cameraIdx() { return this.cameras.indexOf(this.activCam); }

	addObject(obj){ 
		this.objects.push(obj); 
		return this;
	}
	removeObject(obj){ 
		if ( this.objects.indexOf(obj) === -1 )
			return;
		this.objects.splice(this.objects.indexOf(obj), 1); 
		return this;
	}
	addLight(light){
		this.lights.push(light);
		return this;
	}
	removeLight(light){
		const start = this.lights.indexOf(light);
		if ( start === -1 )
			return;
		this.lights.splice( start, 1 );
		return this;
	}
	addUiElement(element){
		if ( this.uiElements.length == 0 )
			g_uiShader = new sGLUiShader();
		this.uiElements.push( element );			
		this.uiElements = this.uiElements.sort( (a,b)=> a.zIndex-b.zIndex );
		return this;
	}
	setMaxRenderPass(nr) {
		if ( nr > this.maxRenderPass )
			this.maxRenderPass = nr;
	}

	setDefaultShader(shader) {
		this.defaultShader = shader;
		return this;
	}

	collision() { return this.collisionMgr; }
	lightCount() { return this.lights.length; }

	activateScene(){
		g_backbone.logicCB = this.logic;
		g_backbone.renderCB = this.render;
		return this;
	}

	//////switch stuff
	aktivateCamera( idx ) {
		this.activCam = this.cameras[idx];
		this.activCam.activate();
	}

	//////Selection
	setSelection(obj) {
		this.selection = obj; 
		if ( !this.selectionMark ) {
			this.selectionMark = new Model("obj/Cube.obj").loadTexture("img/selection.png").setShader(g_backbone.objectShader).setSelectable(false).doBlending( true ).doNoCulling(true);
		} 
		else
			this.selectionMark.setVisible(true);
		return this; 
	}
	clearSelection() { 
		this.selection = null;	
		if ( this.selectionMark )
			this.selectionMark.setVisible(false);
		return this; 
	}
	currentSelection() { return this.selection; }
	renderSelection() {
		if ( this.enableSelection && this.selection && this.selectionMark.isRenderReady() ){
			var pos = vec3.add( vec3.create(), this.selection.center(), this.selection.pos() );
			var scale = vec3.mul( vec3.create(), this.selection.getBBSize(), this.selection.scale() );
			this.selectionMark.setPosition( pos );
			this.selectionMark.setScale( scale );
			this.selectionMark.setRotation( this.selection.rot() );
			this.selectionMark.render( gl );
		}
	}

	//////Rendering
	logic( deltaTime ) {
		if ( this.activCam )
			this.activCam.preRender( deltaTime ) 
		this.objects.forEach( o => o.updateLogic( deltaTime ) );
		return this;		
	}
	
	render( deltaTime ) {/// Render entire Scene
		gl.clearSceen();
		
		// 3d Stuff
		this.lights.forEach( l => l.makeShadowMap( gl, this.objects.filter( o => o.castShadow ) ) );		
		this.objects.filter( o=>o.renderPass===0).forEach( o => o.render( gl, this.defaultShader ) );		
		this.renderSelection();
		// additional renderpasses
		for (let i = 1; i <= this.maxRenderPass; i++) {
			gl.clearDepthBuffer();
			this.objects.filter( o=>o.renderPass===i).forEach( o => o.render( gl, this.defaultShader ) );		
		}

		// 2d Overlay stuff
		gl.clearDepthBuffer();
		this.uiElements.forEach( e => e.render(deltaTime) );

		return this;
	}
}
