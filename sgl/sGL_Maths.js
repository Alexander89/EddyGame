///////////////////////////////////// |            Ray                   | ///////////////////////////////////////////////
///////////////////////////////////// |__________________________________| ///////////////////////////////////////////////
class Ray {
	constructor( origin, direction ) {
		this.origin = origin;
		this.direction = direction;
	}

	getModelViewRay( mvMat ) {
		var invMvMat = mat4.create();
		mat4.invert( invMvMat, mvMat );

		vec4.transformMat4()
	}

	toObjectSpace(transform) {
		var rayOrig = vec3.clone(this.origin);
		var rayDest = vec3.add(vec3.create(), rayOrig, this.direction);

		var rayTrans = mat4.invert( mat4.create(), transform.matView);

		vec3.transformMat4(rayOrig, rayOrig, rayTrans);
		vec3.transformMat4(rayDest, rayDest, rayTrans);

		vec3.subtract(rayDest, rayDest, rayOrig);
		return new Ray( rayOrig, rayDest );
	}


	static createPickRay( pos, canvas, camera ) {
		//get the mouse position in screenSpace coords
		var viewRatio = Math.tan(( Math.PI / (180/camera.fov) / 2));
		var screenSpaceX = ( pos[0] / (canvas.width / 2) - 1) * camera.aspect*viewRatio;
		var screenSpaceY = (1.0 -  pos[1] / (canvas.height / 2))*viewRatio;

		//Find the far and near camera spaces
		var cameraSpaceNear = vec4.fromValues( screenSpaceX * camera.near,  screenSpaceY * camera.near,  -camera.near, 1);
		var cameraSpaceFar = vec4.fromValues( screenSpaceX * camera.far,  screenSpaceY * camera.far,  -camera.far, 1);

		//Unproject the 2D window into 3D to see where in 3D we're actually clicking
		var view = mat4.clone( camera.viewMatrix );
		var viewInv = mat4.create();
		mat4.invert(viewInv, view);
		
		var worldSpaceNear = vec4.create();

		vec3.transformMat4(worldSpaceNear, cameraSpaceNear, viewInv);

		var worldSpaceFar = vec4.create();
		vec3.transformMat4(worldSpaceFar, cameraSpaceFar, viewInv);

		//calculate the ray position and direction
		var rayPosition = vec4.fromValues(worldSpaceNear[0], worldSpaceNear[1], worldSpaceNear[2], 1);
		var rayDirection = vec4.fromValues(worldSpaceFar[0] - worldSpaceNear[0], worldSpaceFar[1] - worldSpaceNear[1], worldSpaceFar[2] - worldSpaceNear[2], 1);

		vec3.normalize(rayDirection,rayDirection);

		return new Ray(rayPosition, rayDirection);
	}
}