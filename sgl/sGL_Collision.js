class CollisionMgr {
	constructor (){
	}

	selectRay( ray ){
		var selectedModals = [];
		var objects = g_backbone.currentScene().objects;
		for ( var i = 0; i < objects.length; i += 1) {
			var obj = objects[i];
			if ( obj.visible == true && obj.selectable == true) {
				var res = this.collisionRayModal( ray, obj );
				if ( res.collidate == true )
					selectedModals.push( { res, obj });
			}
		}
		selectedModals.objectFound = selectedModals.length > 0;
		return selectedModals;
	}

	registerModal( modal ) {
		return this;
	}
	getClosestObject ( selection ) {
		var closest = { selection: null, distance: 1000000};
		for ( var i = 0; i < selection.length; i += 1) {
			if (selection[i].res.closestPoint < closest.distance ) {
				closest.distance = selection[i].res.closestPoint;
				closest.selection = selection[i];
			}
		}
		return closest;
	}

	collisionRayModal( ray, modal, inObjectSpace = false ) {
		var ret = {
			collidate: false,
			closestPoint: 1000000,
			collisions:[]
		};

		var x, y, z;
		for (var mIdx = 0; mIdx < modal.meshs.length; mIdx++) {
			let mesh = modal.meshs[mIdx];
			if ( inObjectSpace )
				var newRay = ray;
			else	
				var newRay = ray.toObjectSpace(modal.transform);
			
			for (var i = 0; i < mesh.verticesCount; i += 3) {
				var vertex1 = mesh.getVertex( i );
				var vertex2 = mesh.getVertex( i+1 );
				var vertex3 = mesh.getVertex( i+2 );  

				var res = CollisionMgr.RayIntersectsTriangle ( newRay, vertex1, vertex2, vertex3);
				if ( res.collision === true ) {
					ret.collidate = true;
					if ( ret.closestPoint > res.distance ) {
						ret.closestPoint = res.distance;
						ret.collisions.splice(0,0, res);
					}
					else
						ret.collisions.push(res);
				}
			}
		}
		return ret;
	}

	static RayIntersectsTriangle( ray, vertex1, vertex2, vertex3) {
		// Compute vectors along two edges of the triangle.
		var edge1 = vec3.create();
		var edge2 = vec3.create();

		vec3.subtract(edge1, vertex2, vertex1 );
		vec3.subtract(edge2, vertex3, vertex1);

		// Compute the determinant.
		var directionCrossEdge2 = vec3.create();
		vec3.cross(directionCrossEdge2, ray.direction, edge2 );


		var determinant = vec3.dot(directionCrossEdge2, edge1);
		// If the ray and triangle are parallel, there is no collision.
		if (determinant > -.0000001 && determinant < .0000001)
				return { collision: false };
		

		var inverseDeterminant = 1.0 / determinant;

		// Calculate the U parameter of the intersection point.
		var distanceVector = vec3.create();
		vec3.subtract(distanceVector, ray.origin, vertex1);


		var triangleU = vec3.dot(directionCrossEdge2, distanceVector);
		triangleU *= inverseDeterminant;

		// Make sure the U is inside the triangle.
		if (triangleU < 0 || triangleU > 1) 
				return { collision: false };

		// Calculate the V parameter of the intersection point.
		var distanceCrossEdge1 = vec3.create();
		vec3.cross(distanceCrossEdge1, distanceVector, edge1);


		var triangleV = vec3.dot(ray.direction, distanceCrossEdge1);
		triangleV *= inverseDeterminant;

		// Make sure the V is inside the triangle.
		if (triangleV < 0 || triangleU + triangleV > 1)
				return { collision: false };

		// Get the distance to the face from our ray origin
		var rayDistance = vec3.dot(distanceCrossEdge1, edge2);
		rayDistance *= inverseDeterminant;


		// Is the triangle behind us?
		if (rayDistance < 0) 
			return { collision: false };
		
		return { 
			collision: true,
			distance: rayDistance
		 } ;
	}
}




class AABB {
	constructor () {		
		this.aabb = [999,999,999, -999,-999,-999];
	}
	center() {
		return [ 
			(this.aabb[3]-this.aabb[0])*0.5+this.aabb[0],
			(this.aabb[4]-this.aabb[1])*0.5+this.aabb[1],
			(this.aabb[5]-this.aabb[2])*0.5+this.aabb[2]
		];
	}
	getBBSize() {
		return [ 
			this.aabb[3]-this.aabb[0],
			this.aabb[4]-this.aabb[1],
			this.aabb[5]-this.aabb[2]
		];
	}
	updateAABB( x,y,z ) {
		if ( x < this.aabb[0] )
			this.aabb[0] = x;
		else if ( x > this.aabb[3] )
			this.aabb[3] = x;

		if ( y < this.aabb[1] )
			this.aabb[1] = y;
		else if ( y > this.aabb[4] )
			this.aabb[4] = y;

		if ( z < this.aabb[2] )
			this.aabb[2] = z;
		else if ( z > this.aabb[5] )
			this.aabb[5] = z;

		return [x,y,z];
	}
	updateParentAABB( aabb ) {
		if ( aabb[0] < this.aabb[0] )
			this.aabb[0] = aabb[0];
		if ( aabb[3] > this.aabb[3] )
			this.aabb[3] = aabb[3];

		if ( aabb[1] < this.aabb[1] )
			this.aabb[1] = aabb[1];
		if ( aabb[4] > this.aabb[4] )
			this.aabb[4] = aabb[4];

		if ( aabb[2] < this.aabb[2] )
			this.aabb[2] = aabb[2];
		if ( aabb[5] > this.aabb[5] )
			this.aabb[5] = aabb[5];
	}
}