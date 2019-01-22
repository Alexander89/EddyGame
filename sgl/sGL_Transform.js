"use strict";
class Transform {
	constructor() {
		this.reset();

		this.matView  = mat4.create();
		this.normal   = mat3.create();

		this.forward  = vec4.create();
		this.up       = vec4.create();
		this.right    = vec4.create();
		this.reset();
	}

	updateMatrix() {
		mat4.identity( this.matView );
		mat4.translate( this.matView, this.matView, this.position );
		mat4.rotateY( this.matView, this.matView,  this.rotation[1] * Transform.deg2Rad);
		mat4.rotateX( this.matView, this.matView,  this.rotation[0] * Transform.deg2Rad);
		mat4.rotateZ( this.matView, this.matView,  this.rotation[2] * Transform.deg2Rad);
		mat4.scale( this.matView, this.matView,  this.scale );

		mat3.normalFromMat4( this.normal, this.matView );

		this.updateDirections();

		return this.matView;
	}
	updateDirections() {
		var rot   = mat4.create();
		mat4.identity( rot );
		mat4.rotateY( rot, rot,  this.rotation[1] * Transform.deg2Rad);
		mat4.rotateX( rot, rot,  this.rotation[0] * Transform.deg2Rad);
		mat4.rotateZ( rot, rot,  this.rotation[2] * Transform.deg2Rad);

		vec3.transformMat4( this.forward, [0,0,-1,0], rot );
		vec3.transformMat4( this.up,      [0,1,0,0], rot );
		vec3.transformMat4( this.right,   [1,0,0,0], rot );
	}
	getViewMatrix() {
		return this.matView;
	}
	getNormalMatrix() {
		return this.normal;
	}
	reset() {
		this.position = vec3.fromValues(0,0,0);
		this.scale  = vec3.fromValues(1,1,1);
		this.rotation = vec3.fromValues(0,0,0);
	}

	setPosition(x,y,z)  { vec3.set(this.position,x,y,z); return this; }
	setScale(x,y,z)     { vec3.set(this.scale,x,y,z); return this; }
	setRotate(x,y,z)    { vec3.set(this.rotation,x,y,z); return this; }

	addPosition(x,y,z)  { vec3.add(this.position, this.position, vec3.fromValues(x, y, z) ); return this; }
	addScale(x,y,z)     { vec3.add(this.scale, this.scale, vec3.fromValues(x, y, z) ); return this; }
	addRotate(x,y,z)    { vec3.add(this.rotation, this.rotation, vec3.fromValues(x, y, z) ); return this; }
}
Transform.deg2Rad = Math.PI/180;
