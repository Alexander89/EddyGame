let g_LightID = 0;
let g_shadowShader = null;
let g_shadowMapID = 0;

class Light
{
	constructor(type = Light.Directional) {
		this.on = true;
		this.direction = vec3.fromValues(1.0,-0.4,0.5);     // Shine down
		this.up = vec3.fromValues(0.0, 1.0, 0.0);			// Upwards (for Shadow Camera)
		this.position = vec3.fromValues(0.0, 5.0, 0.0);     // Position is 5 above the center
		this.color = vec3.fromValues(0.8, 0.8, 0.8);        // white but not to much
		this.spectColor = vec3.fromValues(0.8, 0.8, 0.8);   // white but not to much
		this.intens = 0.8;
		this.specIntens = 0.5;
		this.specularPow = 128;
		this.falloffLinear = 0.0;
		this.falloffQaud = 0.01;
		this.innerCone = 0.9;
		this.outerCone = 0.7;
		this.maxDist = 10;
		this.shadowSize = 1024;
		this.shadowSmooth = 1;
		this.shadowCam = null;
		this.shadowMapID = -1;
		
		this.shadow = false;	// default no shadow
		if ( !g_shadowShader )
			g_shadowShader = new sGLShadowShader();
		this.setType(type);
		this.obj = null;

		this.lightID = g_LightID;
		g_LightID++;
	}
	setType( type ){
		this.type = type;
		return this;
	}
	setDirection( ) {
		if ( arguments.length == 1 )
			this.direction = arguments[0];
		else
			this.direction = vec3.fromValues(arguments[0], arguments[1], arguments[2]);
		this.rotateObject();
		return this;
	}
	setUp( ) {
		if ( arguments.length == 1 )
			this.up = arguments[0];
		else
			this.up = vec3.fromValues(arguments[0], arguments[1], arguments[2]);
		return this;
	}
	setPosition( ) {
		if ( arguments.length == 1 )
			this.position = arguments[0];
		else
			this.position = vec3.fromValues(arguments[0], arguments[1], arguments[2]);
		this.moveObject();
		return this;
	}
	setColor() {
		if ( arguments.length == 1 )
			this.color = arguments[0];
		else
			this.color = vec3.fromValues(arguments[0], arguments[1], arguments[2]);
		return this;
	}
	setSpectColor() {
		if ( arguments.length == 1 )
			this.spectColor = arguments[0];
		else
			this.spectColor = vec3.fromValues(arguments[0], arguments[1], arguments[2]);
		return this;
	}
	setSpotParams( outer, inner, expo ) {
		this.outerCone = outer;
		this.innerCone = inner;
		this.specularPow = expo;
		return this;
	}
	setParam(obj) {
		this.intens = obj.intens || this.intens;
		this.specIntens = obj.specIntens || this.specIntens;	

		if ( obj.direction !== undefined )
			this.setDirection( obj.direction );		
		if ( obj.pos !== undefined )
			this.setPosition( obj.pos );	
		if ( obj.color !== undefined )
			this.setColor( obj.color );	
		if ( obj.specColor !== undefined )
			this.setSpectColor( obj.specColor );	

		this.on = obj.on || this.on;
		this.outerCone = obj.outerCone || this.outerCone;
		this.innerCone = obj.innerCone || this.innerCone;
		this.specularPow = obj.specularPow || this.specularPow;
		this.maxDist = obj.maxDist || this.maxDist;
		this.falloffLinear = obj.falloffLinear || this.falloffLinear;
		this.falloffQaud = obj.falloffQaud || this.falloffQaud;		
		return this;			
	}
	setShadow(on){
		this.shadow = !!on;
		if ( this.shadow && this.shadowMapID === -1 ) {
			// Set ShadowID
			this.shadowMapID = g_shadowMapID;
			g_shadowMapID++;

			// Camera Setup
			const scene = g_backbone.currentScene();
			const camNR = scene.cameraIdx();			
			this.shadowCam = new Camera(gl, this.outerCone * 45);
			this.shadowCam.setMouseMode( Camera.MODE_LIGHT );//.showObj(true);
			if ( this.type == Light.Directional )
				this.shadowCam.updateProjectionMatOrto();
			else
				this.shadowCam.updateProjectionMat();
			scene.aktivateCamera(camNR);

			// create FrameBuffer
			this.framebuffer = gl.createFramebuffer();

			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);
			this.shadowTex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, this.shadowTex );
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.shadowSize, this.shadowSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST ); 
			gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowTex, null);
			
			gl.drawBuffers( [gl.COLOR_ATTACHMENT0] );

			this.shadowDepth = gl.createRenderbuffer(1);
			gl.bindRenderbuffer(gl.RENDERBUFFER, this.shadowDepth);
			gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.shadowSize, this.shadowSize);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.shadowDepth);
			
			// finally check if framebuffer is complete
			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE) 
				console.log( "Framebuffer for Shadowmap faild to complete!" + gl.checkFramebufferStatus(gl.FRAMEBUFFER) );   

			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
			gl.bindTexture(gl.TEXTURE_2D, null );
		}
		return this;
	}

	showObj( show )  {
		if ( !this.obj ){
			switch (this.type) {
				case Light.Ambient:
					var mod = "obj/AmbientLight.obj";					
					break;
				case Light.Directional:
					var mod = "obj/DirectionalLight.obj";					
					break;
				case Light.Spot:
					var mod = "obj/SpotLight.obj";
					break;
				case Light.Point:
				default:
					var mod = "obj/PointLight.obj";
					break;
			}
			g_backbone.currentScene().addObject(  this.obj = new Model(mod).loadTexture("obj/LightTexture.png" ).setScale(0.2,0.2,0.2).setShader(g_backbone.objectShader) );
			this.obj.castShadow = false;
			this.rotateObject();
			this.moveObject();
		}
		this.obj.setVisible(show);
		return this;
	}
	calcRotationsValues() {
		const normaldirection =vec3.normalize(vec3.create(), this.direction);
		const angle1 = Math.atan2( normaldirection[2], normaldirection[1] );
		const angle2 = -Math.asin( normaldirection[0] );
		return [angle1*57.2958279, 0, angle2*57.2958279];
	}
	rotateObject() {
		if ( !!this.obj )
			if ( this.type === Light.Directional || this.type === Light.Spot )
				this.obj.setRotation( ...this.calcRotationsValues() );			
	}
	moveObject() {
		if ( !!this.obj ) 
			this.obj.setPosition(this.position);
	}

	preRender() {
		return this;
	}

	makeShadowMap(gl, objects) {
		if (  !this.on || !this.shadowCam )
			return;
		if ( this.type === Light.Ambient ) // has no shadow
			return;
		const camIdx = g_backbone.currentScene().cameraIdx(); 

		this.shadowCam.activate();
		this.shadowCam.setPosition( ...this.position );
 		this.shadowCam.setDirection(this.direction);
 		this.shadowCam.setUp(this.up);
		this.shadowCam.updateViewMatrix();
		
		g_shadowShader.activate();
		
		if ( this.type === Light.Directional  ||  this.type === Light.Spot ){
			gl.viewport(0,0,this.shadowSize,this.shadowSize);
			gl.clearColor(0, 0, 0, 1);

			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.framebuffer);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
			
			gl.disable(gl.CULL_FACE);
			g_shadowShader.updateFrameUniforms();
			objects.forEach (o => {
				const s = o.shader;
				o.shader = null;	// besser nicht setzten, sonst bleibt der da mal wegen: naja... besser nicht.
				o.render(gl, g_shadowShader);	
				o.shader = s;
			});
			gl.enable(gl.CULL_FACE);
			
			gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
			gl.viewport(0,0,gl.canvas.width,gl.canvas.height);
			gl.clearColor(0.65, 0.84, 0.95, 1);
		}
		else {
			// qube-shadowmap @todo
		}

		g_backbone.currentScene().aktivateCamera( camIdx );
		return this;
	}
	pushShadowMapDataToShader( shader ) {
		if (  !this.on || !this.shadowCam )
			return 0;
		if ( this.shadowMapID !== -1 ) {			
			let a = shader.uniformLoc[ "uLightPMatrix" + this.shadowMapID ];
			gl.uniformMatrix4fv( a, false, this.shadowCam.projectionMatrix);			
			let b = shader.uniformLoc[ "uLightCameraMatrix" + this.shadowMapID ];
			gl.uniformMatrix4fv( b, false, this.shadowCam.viewMatrix);

			switch ( this.shadowMapID ) {
				case 0: gl.activeTexture(gl.TEXTURE5); break;
				case 1: gl.activeTexture(gl.TEXTURE6); break;
				case 2: gl.activeTexture(gl.TEXTURE7); break;
				case 3: gl.activeTexture(gl.TEXTURE8); break;
				case 4: gl.activeTexture(gl.TEXTURE9); break;
			}
			gl.bindTexture(gl.TEXTURE_2D, this.shadowTex );
			let c = shader.uniformLoc[ "uShadowTex" + this.shadowMapID ];
			gl.uniform1i( c, this.shadowMapID + 5 );
			return 1;
		}
		return 0;
	}
}
Light.Ambient     = 0;
Light.Directional = 1;
Light.Point       = 2;
Light.Spot        = 3;
