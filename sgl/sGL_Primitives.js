"use strict";
///////////////////////////////////// |           Primitives             | ///////////////////////////////////////////////
///////////////////////////////////// |__________________________________| ///////////////////////////////////////////////
var Primitives = {};
//______________________________________ |           Grid             | ______________________________________
Primitives.Grid = class{
	static createMesh(gl, size, count) {
		if ( Mesh. meshCache.has('grid' ) )
			return Mesh. meshCache['grid'];

		var vert = [];
		var step = size / count;
		var half = size / 2;

		var pH = -half;
		for (var i = 0; i < count+1; i++) {
			vert.push(-half, 0, pH);
			vert.push(half, 0, pH);

			vert.push(pH, 0, -half);
			vert.push(pH, 0, half);
			pH += step;
		}

		vert.push(0, 0, 0);
		vert.push(1, 0 ,0);
		vert.push(0.95, 0.05, 0);
		vert.push(1, 0, 0);
		vert.push(0.95, -0.05, 0);
		vert.push(1, 0, 0);


		vert.push(0, 0, 0);
		vert.push(0, 1, 0);
		vert.push(0.05, 0.95, 0);
		vert.push(0, 1, 0);
		vert.push(-0.05, 0.95, 0);
		vert.push(0, 1, 0);


		vert.push(0, 0, 0);
		vert.push(0, 0, 1);
		vert.push(-0.05, 0, 0.95);
		vert.push(0, 0, 1);
		vert.push( 0.05, 0, 0.95);
		vert.push(0, 0, 1);

		//create VAO
		var obj = {vao: gl.createVertexArray(), drawMode: gl.LINES };
		

		gl.bindVertexArray(obj.vao);

		//Vertex
		var spridelng = Float32Array.BYTES_PER_ELEMENT * 3;
		obj.vertexCount = vert.length / 3;

		obj.bufVertics = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, obj.bufVertics);
		gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(vert), gl.STATIC_DRAW );
		gl.enableVertexAttribArray( 0 );
		gl.vertexAttribPointer( 0, 3, gl.FLOAT, false, spridelng, 0 );

		gl.bindVertexArray(null);
		
		obj.name = 'grid'

		Mesh. meshCache.set('grid', obj);
		return obj;
	}

	static createModel(gl, size, count) {
		var modal = new Model( this.createMesh(gl, size, count) );
		modal.name = "Grid";
		modal.setShader(new Hal_GridShader(gl))
		return modal;
	}
}
//______________________________________ |           Quad             | ______________________________________
Primitives.Quad = class{
	static createMesh(gl, size) {
		if ( size === undefined )
			size = 0.5;
		var vert = [ -size,size,0,  -size,-size,0,  size,-size,0,  size,size,0];
		var uv = [ 0,1, 0,0, 1,0, 1,1 ];
		var norm = [ 0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1 ];
		var index = [ 0,1,2, 2,3,0 ];

		//create VAO
		var obj = gl.fCreateMashVAO("Quad"+size, index, vert, norm, uv);
		obj.noCulling = true;
		obj.doBlending = false;
		return obj;
	}

	static createModel( gl, size ) {
		var modal = new Model( this.createMesh( gl, size ) );

		return modal;
	}
}
//______________________________________ |       DeferredQuad         | ______________________________________
Primitives.DeferredQuad = class{
	static createModel( gl ) {
		var modal = Primitives.Quad.createModel( gl, 1.0 );
		modal.noCulling = false;
		modal.doBlending = false;
		modal.render = function( gl, shader ) {     
			shader.preRender();
			gl.bindVertexArray(this.mesh.vao);
			gl.drawElements( this.mesh.drawMode, this.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
			gl.bindVertexArray(null);
			return this;
		}
		return modal;
	}
}
//______________________________________ |           Cube             | ______________________________________
Primitives.Cube = class{
	static createMesh( gl, name, width, height, depth ) {
		var w0 = -width * 0.5;
		var w1 = width * 0.5;
		var h0 = -height * 0.5;
		var h1 = height * 0.5;
		var d0 = -depth *0.5;
		var d1 = depth *0.5;

		var vert = [ 
			w0, h1, d1,   w0, h0, d1,   w1, h0, d1,   w1, h1, d1,
			w1, h1, d0,   w1, h0, d0,   w0, h0, d0,   w0, h1, d0,
			w0, h1, d0,   w0, h0, d0,   w0, h0, d1,   w0, h1, d1, 
			w0, h0, d1,   w0, h0, d0,   w1, h0, d0,   w1, h0, d1,
			w1, h1, d1,   w1, h0, d1,   w1, h0, d0,   w1, h1, d0, 
			w0, h1, d0,   w0, h1, d1,   w1, h1, d1,   w1, h1, d0
		];
		var index = [];
		for (var i = 0; i < vert.length /3; i+=2) 
			index.push(i, i+1, (Math.floor(i/4)*4)+((i+2)%4));  
		
		var uv = [];
		for (var i = 0; i < 6; i++) 
			uv.push(0,1, 0,0, 1,0, 1,1);

		var norm = [
			0, 0, 1,   0, 0, 1,   0, 0, 1,   0, 0, 1,
			0, 0,-1,   0, 0,-1,   0, 0,-1,   0, 0,-1,
			-1, 0, 0,  -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
			0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,
			1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
			0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0
			 ];
		var normT = [
			1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
			-1, 0, 0, -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
			0,-1, 0,   0,-1, 0,   0,-1, 0,   0,-1, 0,
			1, 0, 0,   1, 0, 0,   1, 0, 0,   1, 0, 0,
			0, 1, 0,   0, 1, 0,   0, 1, 0,   0, 1, 0,
			-1, 0, 0, -1, 0, 0,  -1, 0, 0,  -1, 0, 0,
			 ]

		//create VAO
		var obj = gl.fCreateMashVAO(name+width+height+depth, index, vert, norm, uv);
		return obj;
	}

	static createModel( gl, width, height, depth, x, y, z ) {
		var modal = new Model( this.createMesh( gl, "Cube", width, height, depth ) );
		modal.transform.setPosition(x, y, z); 
		modal.mesh.noCulling = true;
		modal.mesh.doBlending = true;
		return modal;
	}
}
//______________________________________ |           Spear            | ______________________________________
Primitives.Spear = class{
	static createMesh( gl, name, radius, steps ) {
		var uvStep = 1/(steps+2);			// fix wegen vorangehenden fehler
		var ringStep = (2*Math.PI) / steps;
		var vertStep = Math.PI / steps

		var vert = [];
		var norm = [];
		var uv = [];

		vert.push(0, radius, 0);
		uv.push(0.5, 1);
		norm.push(0, 1, 0);

		for ( var yi = 0; yi < steps; yi++ ) {
			var yGrad = Math.PI * yi / steps;
			var y = Math.cos(yGrad);
			var uvY = 1 - (uvStep*(yi+1));
			for (var xi = 0; xi < steps; xi++ ) {
				var grad = (2*Math.PI * xi) / steps;
				var x = Math.sin(grad) * Math.sin(yGrad);
				var z = Math.cos(grad) * Math.sin(yGrad);
				var uvX = (uvStep*(xi+1));
				vert.push( x*radius, y*radius, z*radius );
				uv.push( uvX, uvY );
				norm.push( x, y, z );
			}
		}
		vert.push(0, -radius, 0);
		uv.push(0.5, 0);
		norm.push(0, -1, 0);

		var index = [];

		for (var i = 1; i < steps; i++)
			index.push(0, i, i+1);
		index.push(0, steps, 1);


		for (var y = 0; y < steps -1; y++) {
			var row = y * steps + 1;
			var nxRow = y * steps + steps;
			for (var x = 0; x < steps; x++) {
				index.push( row + x, nxRow + x, nxRow + x + 1);
				index.push( row + x, nxRow + x + 1, row + x + 1);
			}

			index.push( row + steps-1, nxRow + steps-1, nxRow + x);
			index.push( row + steps-1, nxRow + x, row + x);
		}

		var vertexCount = vert.length / 3 - 1;
		for (var i = vertexCount - steps ; i < vertexCount-1; i++)
			index.push( i, vertexCount, i+1 );
		index.push( vertexCount-1, vertexCount, vertexCount-steps );

		/*    var uv = [];
		for (var i = 0; i < 6; i++) 
			uv.push(0,0, 0,1, 1,1, 1,0);*/

		//create VAO
		var obj = gl.fCreateMashVAO(name+radius+steps, index, vert, norm, uv);
		return obj;
	}

	static createModel( gl, radius, steps, x, y, z ) {
		var modal = new Model( this.createMesh( gl, "Spear", radius, steps ) );
		modal.transform.setPosition(x || 0, y || 0, z || 0);  
		modal.setShader( new Hal_SpearShader(gl) );
		modal.mesh.noCulling = false;
		modal.mesh.doBlending = true;
		return modal;
	}
}
//______________________________________ |           Sky              | ______________________________________
Primitives.Sky = class{
	static createModel( gl ) {
		var modal = new Model( Primitives.Cube.createMesh( gl, "sky", 25, 25, 25 ) );
		modal.transform.setPosition(0, 0, 0); 
		modal.setShader( new Hal_SkyShader(gl) );
		modal.mesh.noCulling = true;
		modal.mesh.doBlending = true;
		modal.noDeferred = false;
		return modal;
	}
}


//______________________________________ |       Hal_GridShader       | ______________________________________
class Hal_GridShader extends Shader {
	constructor(gl) {
		var vertShader = `#version 300 es
			precision mediump float; 

			in vec3 a_pos;           
			layout(location=4) in float a_color;
			uniform mat4 uPMatrix;
			uniform mat4 uMVMatrix;
			uniform mat4 uCameraMatrix;
			uniform vec3 uColor[4];

			out lowp vec4 color;
			void main() {
				if ( gl_VertexID > 2 )
					color = vec4( uColor[ 1 ], 1.0);
				else
					color = vec4( uColor[0], 1.0);
				gl_Position = uPMatrix * uCameraMatrix * uMVMatrix * vec4(a_pos, 1.0);
			}`;
		
		var fragShader = `#version 300 es
			precision lowp float; 

			in vec4 color;
			out vec4 finalColor; 
			void main() {
				finalColor = color;
			}`;

		g_backbone.addRes("gridVertexShader", vertShader);
		g_backbone.addRes("gridFragmentShader", fragShader);
		super(gl, "gridVertexShader", "gridFragmentShader");

		this.name = "Hal_GridShader";
		this.uniformLoc.uColorLoc     = gl.getUniformLocation(this.program, "uColor");
		gl.uniform3fv(this.uniformLoc.uColorLoc,  [0.6,0.6,0.6, 1,0,0, 0,1,0, 0,0,1] );
		gl.useProgram(null);
	}
};