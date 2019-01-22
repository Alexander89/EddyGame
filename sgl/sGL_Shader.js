"use strict";

class Shader {
	constructor(gl, vsSrc, fsSrc) {
		this.program = null;
		this.frameUniformsUpdate = false;
		if ( gl !== undefined ) {	
			this.program = Shader.createShaderProg( gl, g_backbone.res(vsSrc), g_backbone.res(fsSrc) );
			this.name = "Default Shader";
			g_allShader.push(this);
			if (this.program != null) {
				gl.useProgram(this.program);
				this.attribLoc = Shader.getStandartAttribLocations(gl, this.program);
				this.uniformLoc = Shader.getStandartUniformLocations(gl, this.program);
			}
		}
	}

	activate() {
		if ( !this.isReady() )
			return null;
		if (gActiveShader == this) {
			if (  g_backbone.currentScene().camera() )
				this.updateActiveCamera();
			return this; 
		}
		gActiveShader = this; 
		gl.useProgram( this.program ); 
		
		this.updateFrameUniforms();
		return this; 
	}
	deactivate() { 
		gActiveShader = null; 
		gl.useProgram( null ); 
		return this; 
	}

	isReady() { return (this.program !== null); }
	updateFrameUniforms() {
		if ( g_activeCamera ){
			this.updateActiveCamera();
			this.updateActiveCameraPerspective();
		}
		this.frameUniformsUpdate = true;
		return this;
	}
	updateActiveCameraPerspective() { 
		const cam = g_backbone.currentScene().camera();
		if (gActiveShader == this)
			this.setPerspective(cam.projectionMatrix);
		else
			this.activate().setPerspective(cam.projectionMatrix).deactivate();
		return this;
	}
	updateActiveCamera() { this.setCameraMatrix(  g_backbone.currentScene().camera().viewMatrix ); }
	setPerspective(matData) { gl.uniformMatrix4fv( this.uniformLoc.uPerspective,  false, matData); return this; }
	setModelMatrix(matData) { gl.uniformMatrix4fv( this.uniformLoc.uModelMatrix,  false, matData); return this; }
	setCameraMatrix(matData){ gl.uniformMatrix4fv( this.uniformLoc.uCameraMatrix, false, matData); return this; }
	
	dispose() {
		if (gl.getParameter(gl.CURRENT_PROGRAM) === this.program)
			this.deactivate();

		gl.deleteProgramm(this.program);
	}

	preRender() {
		return this;
	}
	renderModel( modal ) {
		modal.render(gl, this);
		return this;
	}

	static createShaderProg(gl, src_vs, src_fs ) {
		// create Shader and Program
		if ( !src_vs || !src_fs)
			return null;

		var shader_vs = Shader.createShader( gl, gl.VERTEX_SHADER, src_vs);    
		if ( !shader_vs ) 
			return null;
		var shader_frag = Shader.createShader( gl, gl.FRAGMENT_SHADER, src_fs);
		if ( !shader_frag ) {
			gl.deleteShader(shader_vs);
			return null;
		}
		return Shader.createProgram( gl, shader_vs, shader_frag );
	}
	static createShader(gl, type, scr) {
		var shader = gl.createShader( type );

		gl.shaderSource( shader, scr );
		gl.compileShader( shader );

		if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS )) {
			alert( "Shader makeError: " + gl.getShaderInfoLog(shader) );
			return null;
		}
		return shader;
	}
	static createProgram(gl, shader_vs, shader_frag ) {
		var program = gl.createProgram();
		gl.attachShader(program, shader_vs);
		gl.attachShader(program, shader_frag);

		gl.bindAttribLocation( program, 1, "a_pos" );
		gl.bindAttribLocation( program, 2, "a_uv" );
		gl.bindAttribLocation( program, 3, "a_norm" );
		gl.bindAttribLocation( program, 4, "a_normT" );


		gl.linkProgram(program);
		if ( !gl.getProgramParameter(program, gl.LINK_STATUS) ) {

	    var lastError = gl.getProgramInfoLog(program);
	    console.warn("Error in program linking:" + lastError);
			return false;  
		}

		gl.detachShader(program, shader_vs);
		gl.deleteShader(shader_vs);

		gl.detachShader(program, shader_frag);
		gl.deleteShader(shader_frag);
		return program;
	}
	
	static getStandartAttribLocations( gl, program ){
		return {
			position : gl.getAttribLocation( program, "a_pos" ),
			uv : gl.getAttribLocation( program, "a_uv" ),
			normal : gl.getAttribLocation( program, "a_norm" ),
			normalT : gl.getAttribLocation( program, "a_normT" ),
		}
	}
	static getStandartUniformLocations( gl, program ){
		return {
			uPerspective : gl.getUniformLocation( program, "uPMatrix" ),
			uModelMatrix : gl.getUniformLocation( program, "uMVMatrix" ),
			uCameraMatrix: gl.getUniformLocation( program, "uCameraMatrix" ),
			uTexShift    : gl.getUniformLocation( program, "uTexShift" ),
			uMainTexture : gl.getUniformLocation( program, "uMainTex" ),
			uSpecTex1    : gl.getUniformLocation( program, "uSpecTex" ),
			uNormalTex1  : gl.getUniformLocation( program, "uNormalTex" ),
			uAmbiantTex1 : gl.getUniformLocation( program, "uAmbiantTex" ),
			uBumpTex1    : gl.getUniformLocation( program, "uBumpTex" ),

			uUsedShadowMaps: gl.getUniformLocation( program, "uUsedShadowLights" ),
			uShadowTex0 : gl.getUniformLocation( program, "uShadowTex0" ),
			uShadowTex1 : gl.getUniformLocation( program, "uShadowTex1" ),
			uShadowTex2 : gl.getUniformLocation( program, "uShadowTex2" ),
			uShadowTex3 : gl.getUniformLocation( program, "uShadowTex3" ),
			uShadowTex4 : gl.getUniformLocation( program, "uShadowTex4" ),

			uLightPMatrix0 : gl.getUniformLocation( program, "uLightPMatrix[0]" ),
			uLightPMatrix1 : gl.getUniformLocation( program, "uLightPMatrix[1]" ),
			uLightPMatrix2 : gl.getUniformLocation( program, "uLightPMatrix[2]" ),
			uLightPMatrix3 : gl.getUniformLocation( program, "uLightPMatrix[3]" ),
			uLightPMatrix4 : gl.getUniformLocation( program, "uLightPMatrix[4]" ),
			uLightCameraMatrix0 : gl.getUniformLocation( program, "uLightCameraMatrix[0]" ),
			uLightCameraMatrix1 : gl.getUniformLocation( program, "uLightCameraMatrix[1]" ),
			uLightCameraMatrix2 : gl.getUniformLocation( program, "uLightCameraMatrix[2]" ),
			uLightCameraMatrix3 : gl.getUniformLocation( program, "uLightCameraMatrix[3]" ),
			uLightCameraMatrix4 : gl.getUniformLocation( program, "uLightCameraMatrix[4]" ),
		}
	}
}

var g_allShader = [];
var gActiveShader = null;

class sGLObjectLightningShader extends Shader {
	constructor( ) {
		super();
		this.hasFs = false;
		this.hasVs = false;
		this.name = "Object Lightning Shader";

		g_backbone.res("shaders/objectLightning.fs", data => {
			this.fs = data;
			this.hasFs = true;
			if ( this.hasVs )
				this.initShader();
		});
		g_backbone.res("shaders/objectLightning.vs", data => {
			this.vs = data;
			this.hasVs = true;
			if ( this.hasFs )
				this.initShader();
		});		
	}

	initShader() {
		this.program = Shader.createShaderProg( gl, this.vs, this.fs );
		g_allShader.push(this);
		if ( !this.program ) 
			return;

		gl.useProgram(this.program);
		gActiveShader = null;
		this.attribLoc = Shader.getStandartAttribLocations(gl, this.program);
		this.uniformLoc = Shader.getStandartUniformLocations(gl, this.program);
		
		this.uniformLoc.uEyePos = gl.getUniformLocation( this.program, "uEyePos" );
		this.uniformLoc.uUsingLightCount = gl.getUniformLocation( this.program, "uUsingLightCount" );

		this.uniformBufferLoc = {};
		this.uniformBufferLoc.lights = 0;//gl.getUniformBlockIndex( this.program, "Lights" );
		gl.uniformBlockBinding(this.program, this.uniformBufferLoc.lights, 0);

		this.uboLight = gl.createBuffer();
		//#define maxLights 25
		this.lightArraySize = 112;
		this.maxLights = 25;

		gl.bindBuffer( gl.UNIFORM_BUFFER, this.uboLight );
		gl.bufferData( gl.UNIFORM_BUFFER, this.lightArraySize * this.maxLights, gl.DYNAMIC_DRAW );
		gl.bindBuffer( gl.UNIFORM_BUFFER, null);
	}

	preRender() {
		super.preRender();
		if ( !this.frameUniformsUpdate )
			return;

		this.frameUniformsUpdate = false;
		if ( !this.program )
			return this;
		gl.uniform3fv( this.uniformLoc.uEyePos, g_backbone.currentScene().camera().transform.position );
		gl.uniform1i( this.uniformLoc.uUsingLightCount, g_backbone.currentScene().lightCount() );
		gl.bindBufferRange( gl.UNIFORM_BUFFER, 0, this.uboLight, 0, this.lightArraySize * this.maxLights);

		this.deployLightData();

		return this;
	}

	deployLightData() {
		let buffer = new ArrayBuffer( this.lightArraySize * this.maxLights );
		let int32View = new Int32Array( buffer );
		let float32View = new Float32Array( buffer );

		let shadowCount = 0;
		let scene = g_backbone.currentScene();
		for (let i = 0; i < scene.lightCount(); i++) {
			let offset = (this.lightArraySize/4) * i;
			let light = scene.lights[i];

			float32View[offset +  0] = light.position[0];
			float32View[offset +  1] = light.position[1];
			float32View[offset +  2] = light.position[2];
			
			float32View[offset +  4] = light.color[0];
			float32View[offset +  5] = light.color[1];
			float32View[offset +  6] = light.color[2];
			
			float32View[offset +  8] = light.spectColor[0];
			float32View[offset +  9] = light.spectColor[1];
			float32View[offset + 10] = light.spectColor[2];
			
			float32View[offset + 12] = light.direction[0];
			float32View[offset + 13] = light.direction[1];
			float32View[offset + 14] = light.direction[2];
			int32View[  offset + 15] = light.type;

			float32View[offset + 16] = light.intens;
			float32View[offset + 17] = light.specIntens;
			float32View[offset + 18] = light.specularPow;
			float32View[offset + 19] = light.falloffLinear;

			float32View[offset + 20] = light.falloffQaud;
			float32View[offset + 21] = light.innerCone;
			float32View[offset + 22] = light.outerCone;
			float32View[offset + 23] = light.maxDist;

			int32View[offset + 24] = light.on ? 1 : 0;
			int32View[offset + 25] = light.shadowMapID;
			int32View[offset + 26] = light.shadowSize;
			int32View[offset + 27] = light.shadowSmooth;

			shadowCount += light.pushShadowMapDataToShader(this);
		}
		gl.uniform1i( this.uniformLoc.uUsedShadowMaps, shadowCount );

		gl.bindBuffer( gl.UNIFORM_BUFFER, this.uboLight );
		gl.bufferData( gl.UNIFORM_BUFFER, buffer, gl.DYNAMIC_DRAW);
		gl.bindBuffer( gl.UNIFORM_BUFFER, null);
	}
}


class sGLObjectShader extends Shader {
	constructor( ) {
		super();
		this.hasFs = false;
		this.hasVs = false;
		this.name = "SmartGL Object Shader";
		this.txShift = new Float32Array([0.0, 0.0]);

		g_backbone.res("shaders/sGl_Object.fs", data => {
			this.fs = data;
			this.hasFs = true;
			if ( this.hasVs )
				this.initShader();
		});
		g_backbone.res("shaders/sGl_Object.vs", data => {
			this.vs = data;
			this.hasVs = true;
			if ( this.hasFs )
				this.initShader();
		});		
	}
	pushTexShift(x,y) { 
		gl.uniform2fv( this.uniformLoc.uTexShift, new Float32Array([x, y])); 
	}
	pushTexShift2fv(a) { 
		gl.uniform2fv( this.uniformLoc.uTexShift, new Float32Array(a)); 
	}
	preRender() {
		return this;
	}
	initShader() {
		this.program = Shader.createShaderProg( gl, this.vs, this.fs );			
		if ( this.program !== null ) {
			gl.useProgram( this.program );
			gActiveShader = null;
			this.attribLoc = Shader.getStandartAttribLocations(gl, this.program);
			this.uniformLoc = Shader.getStandartUniformLocations(gl, this.program);
		}
		gl.useProgram( null );
		g_allShader.push(this);
	}
}


class sGLShadowShader extends Shader {
	constructor( ) {
		super();
		this.hasFs = false;
		this.hasVs = false;
		this.name = "SmartGL Shadow Shader";

		g_backbone.res("shaders/shadowLight.fs", data => {
			this.fs = data;
			this.hasFs = true;
			if ( this.hasVs )
				this.initShader();
		});
		g_backbone.res("shaders/shadowLight.vs", data => {
			this.vs = data;
			this.hasVs = true;
			if ( this.hasFs )
				this.initShader();
		});		
	}

	initShader() {
		this.program = Shader.createShaderProg( gl, this.vs, this.fs );			
		if ( this.program !== null ) {
			gl.useProgram( this.program );
			gActiveShader = null;
			this.attribLoc = Shader.getStandartAttribLocations(gl, this.program);
			this.uniformLoc = Shader.getStandartUniformLocations(gl, this.program);
		}
		gl.useProgram( null );
		g_allShader.push(this);
	}
}