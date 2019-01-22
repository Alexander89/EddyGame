"use strict";
var g_activeCamera = null;
var g_allCameras = [];
class Camera {
	constructor( gl, fov, near, far) {
		this.changed = true;
		g_activeCamera = this;
		g_allCameras.push(this);
		this.fov = fov || 42.0;
		this.aspect = gl.canvas.width / gl.canvas.height;
		this.near = near || 0.01;
		this.far = far || 200.0;
		this.gl = gl;
		this.obj = null;


		this.rotateRate = -300;
		this.panRate    = 5;
		this.zoomRate   = -200;

		this.forward = this.backward = this.up = this.down = this.left = this.right = 0;

		this.direction = vec3.create();
		this.upVec = vec3.create();


		this.projectionMatrix = mat4.create();
		this.updateProjectionMat();

		this.transform = new Transform();
		this.transform.setPosition(0,0,1);
		this.viewMatrix = mat4.create();

		gl.canvas.requestPointerLock = gl.canvas.requestPointerLock || canvas.mozRequestPointerLock;
		document.exitPointerLock = document.exitPointerLock ||  document.mozExitPointerLock;
		this.setMouseMode( Camera.MODE_FREE );
		//this.mode = Camera.MODE_ORBIT;
	}

	setMouseMode( CamMode ) { this.mode = CamMode; return this;	}
	showObj( show )  {
		if ( !this.obj ){
			g_backbone.currentScene().addObject(  this.obj = new Model("obj/camera.obj").loadTexture("obj/CameraTexture.png" ).setShader(g_backbone.objectShader) );
		}
		this.obj.setVisible(show);
		return this;
	}

	activate() { g_activeCamera = this; }
	getTranslatelessViewMatrix() {
		var mat = mat4.clone(this.viewMatrix);
		mat[12]=mat[13]=mat[14] = 0.0;
		return mat;
	}
	updateProjectionMat() {
		mat4.perspective( this.projectionMatrix, this.fov*Transform.deg2Rad, this.aspect, this.near, this.far );
	}
	updateProjectionMatOrto() {
		mat4.ortho( this.projectionMatrix, -60, 60, -10, 55, 20.0, 300.0 );
	}

	// Getter / setter
	moveForward() {  this.forward = this.panRate;   return this;  }
	moveStopForward() { this.forward = 0;  return this; }
	moveBackward() { this.backward = this.panRate;  return this;  }
	moveStopBackward() { this.backward = 0;  return this; }
	
	moveLeft() {     this.left = this.panRate;    return this;  }
	moveStopLeft() { this.left = 0;  return this; }
	moveRight() {    this.right = this.panRate;     return this;  }
	moveStopRight(){ this.right = 0;  return this;  }

	moveUp() {   this.up = this.panRate;   return this; }
	moveStopUp() { this.up = 0;  return this; }
	moveDown() { this.down = this.panRate;  return this;  }
	moveStopDown() { this.down = 0;  return this; }

	pos() { return this.transform.position; }

	addPosition( x, y, z ) {
		this.changed = true;
		this.transform.addPosition(x,y,z);
		return this;
	}
	addRotate( x, y, z ) {
		this.changed = true;
		this.transform.addRotate(x,y,z);
		this.updateViewMatrix();
		return this;
	}
	setPosition( x, y, z ) {
		this.changed = true;
		this.transform.setPosition(x,y,z);
		return this;
	}
	setRotate( x, y, z ) {
		this.changed = true;
		this.transform.setRotate(x,y,z);
		return this;
	}
	setDirection( dir ) {
		this.direction = dir;
		return this;
	}
	setUp( up ) {
		this.upVec = up;
		return this;
	}

	panX(v) {
		this.updateViewMatrix();
		if ( this.mode == Camera.MODE_ORBIT ) 
			return this;
		
		this.addPosition ( 
				this.transform.right[0] * v,
				this.transform.right[1] * v,
				this.transform.right[2] * v
			);
		return this;
	}
	panY(v) {
		this.updateViewMatrix();
		if ( this.mode == Camera.MODE_ORBIT ) 
			this.addPosition ( 0, this.transform.up[1] * v, 0 );    
		else {
			this.addPosition ( 
				this.transform.up[0] * v,
				this.transform.up[1] * v,
				this.transform.up[2] * v
			);
		}
		return this;
	}
	panZ(v) {
		this.updateViewMatrix();
		if ( this.mode == Camera.MODE_ORBIT ) {
			this.addPosition ( 0, 0, this.transform.forward[2] * v );
		}
		else {
			this.addPosition ( 
				this.transform.forward[0] * v,
				this.transform.forward[1] * v,
				this.transform.forward[2] * v
			);
		}
		return this;
	}

	preRender( deltatime ) {
		if ( this.mode == Camera.MODE_ORBIT ) {
			return this;
		}
		if ( this.forward != 0 ) {
			var v = this.forward * deltatime;
			this.addPosition ( 
				this.transform.forward[0] * v,
				this.transform.forward[1] * v,
				this.transform.forward[2] * v
			);
		}
		if ( this.backward != 0 ) {
			var v = -this.backward * deltatime;
			this.addPosition ( 
				this.transform.forward[0] * v,
				this.transform.forward[1] * v,
				this.transform.forward[2] * v
			);
		}
		if ( this.left != 0 ) {
			var v = -this.left * deltatime;
			this.addPosition ( 
				this.transform.right[0] * v,
				this.transform.right[1] * v,
				this.transform.right[2] * v
			);
		}
		if ( this.right != 0 ) {
			var v = this.right * deltatime;
			this.addPosition ( 
				this.transform.right[0] * v,
				this.transform.right[1] * v,
				this.transform.right[2] * v
			);
		}
		if ( this.up != 0 ) {
			var v = -this.up * deltatime;
			this.addPosition ( 
				this.transform.up[0] * v,
				this.transform.up[1] * v,
				this.transform.up[2] * v
			);
		}
		if ( this.down != 0 ) {
			var v = this.down * deltatime;
			this.addPosition ( 
				this.transform.up[0] * v,
				this.transform.up[1] * v,
				this.transform.up[2] * v
			);
		}

		this.updateViewMatrix();
		return this;
	}
	updateViewMatrix() {
		if ( this.changed == false )
			return this.viewMatrix;

		if ( this.mode == Camera.MODE_FREE ) {
			mat4.identity( this.transform.matView );
			mat4.translate( this.transform.matView, this.transform.matView, this.transform.position );

			var rot = mat4.create();
			mat4.identity( rot );
			mat4.rotateY( rot, rot,  this.transform.rotation[1] * Transform.deg2Rad);
			mat4.rotateX( rot, rot,  this.transform.rotation[0] * Transform.deg2Rad);

			vec3.transformMat4( this.transform.forward, [0,0,-1,0], rot );
			vec3.transformMat4( this.transform.up,      [0,1,0,0], rot );
			vec3.transformMat4( this.transform.right,   [1,0,0,0], rot );

			mat4.multiply( this.transform.matView, this.transform.matView, rot );
			mat4.invert(this.viewMatrix, this.transform.matView);
			if ( this.obj ) 
				this.obj.setViewMatrix( this.transform.matView);
		} 
		else if ( this.mode == Camera.MODE_ORBIT ) {
			mat4.identity( this.transform.matView );
			mat4.rotateY( this.transform.matView, this.transform.matView,  this.transform.rotation[1] * Transform.deg2Rad);
			mat4.rotateX( this.transform.matView, this.transform.matView,  this.transform.rotation[0] * Transform.deg2Rad);
			mat4.translate( this.transform.matView, this.transform.matView, this.transform.position );
			
			this.transform.updateDirections();

			mat4.invert(this.viewMatrix, this.transform.matView);			
			if ( this.obj ) 
				this.obj.setViewMatrix( this.transform.matView );
		}
		else if ( this.mode == Camera.MODE_LIGHT ) {
			const lookAtVec = vec3.add( vec3.create(), this.transform.position, this.direction );
			mat4.lookAt( this.transform.matView, this.transform.position, lookAtVec, this.upVec );
			this.viewMatrix = this.transform.matView;
			if ( this.obj ) 
				this.obj.setViewMatrix( mat4.invert(mat4.create(), this.transform.matView) );
		}

		this.changed = false;
		return this.viewMatrix;
	}
}
Camera.MODE_FREE = 0;
Camera.MODE_ORBIT = 1;
Camera.MODE_LIGHT = 2;


