"use strict";
let g_maxRenderPass=0;
class Model extends AABB {
	constructor(meshData) {
		super();
		this.visible = true;
		this.shader = null;
		this.selectable = true;
		this.mainTexture = null;
		this.castShadow = true;
		this.meshs =[];
		this.renderPass = 0;

		this.fixedViewMat = null;

		this.ready = false;
		this.recevedMesh = false;
		this.texLoad = 0;
		this.update = null;

		if ( typeof meshData === 'string') {
			if ( meshData.length > 50 )
				receveMeshData( meshData );
			else
				g_backbone.res(meshData, data => this.receveMeshData(data) );
		}
		else {
			this.meshs[0] = meshData;
			this.name = meshData.name;
			this.ready = true;
			this.recevedMesh = true;
		}
		this.transform = new Transform();
	}

	receveMeshData( meshdata ) {
		meshdata = (new TextDecoder("iso-8859-2")).decode(meshdata);
		let objects = meshdata.split("\no ", 100);
		var objInfo = { v:0, vt:0, vn:0 };
		for (var i = 1; i < objects.length; i++) {	//skip header
			let mesh = new Mesh("o "+objects[i],objInfo);
			objInfo = mesh. objInfo;
			this.meshs.push( mesh );		
		}
		this.meshs.forEach( mesh => this.updateParentAABB(mesh.aabb) );
		this.recevedMesh = true;
		this.checkIsReady();
	}

	// Getter / setter
	setVisible( visible ) {  this.visible = visible; return this;}
	setSelectable( selectable ) {  this.selectable = selectable; return this;}
	setShader( shader ) {  this.shader = shader; return this;}
	doBlending( blending ) { this.meshs.forEach( mesh => mesh.doBlending = blending); return this; }
	doNoCulling( noCulling ) { this.meshs.forEach( mesh => mesh.noCulling = noCulling); return this; }
	loadDomTexture( domId, domIdsperc, normalMap, ambiantMap, bumpMap ) { 
		this.mainTexture = gl.loadTexture( domId, e(domId), true ); 
		if ( domIdsperc !== undefined)
			this.specTexture = gl.loadTexture( domIdsperc, e(domIdsperc), true );
		if ( normalMap !== undefined)
			this.normalTexture = gl.loadTexture( normalMap, e(normalMap), true );
		if ( ambiantMap !== undefined)
			this.ambiantTexture = gl.loadTexture( ambiantMap, e(ambiantMap), true );
		if ( bumpMap !== undefined)
			this.bumpTexture = gl.loadTexture( bumpMap, e(bumpMap), true );
		return this;
	}
	loadTexture(defuse, spec="img/stdSpec.png", normal="img/stdNormal.png", ambiant=null, bump=null) {
		this.texLoad++;	// dummy um die readymeldung zu unterdrücken, bevor alle texturen angefragt wurden
		if ( defuse ){
			this.texLoad++;
			g_backbone.res(defuse, data => this.setTexture("defuse", data, defuse) );
		}
		if ( spec ){
			this.texLoad++;
			g_backbone.res(spec, data => this.setTexture("spec", data, spec) );
		}
		if ( normal ){
			this.texLoad++;
			g_backbone.res(normal, data => this.setTexture("normal", data, normal) );
		}
		if ( ambiant ){
			this.texLoad++;
			g_backbone.res(ambiant, data => this.setTexture("ambiant", data, ambiant) );
		}
		if ( bump ){
			this.texLoad++;
			g_backbone.res(bump, data => this.setTexture("bump", data, bump) );
		}
		this.texLoad--;
		this.checkIsReady();
		return this;
	}
	setTexture( type, data, path ){
		if ( path.endsWith(".jpg") )
			var meta = {"type":"image/jpeg"};
		else if ( path.endsWith(".png") )
			var meta = {"type":"image/png"};
		else  {
			console.log("unknown format " +path);
			this.texLoad--;
			this.checkIsReady();
			return this;
		}

		var blob = new Blob([data], meta);
		var img = document.createElement("img");
		img.src = window.URL.createObjectURL(blob);
		var self = this;
		img.onload = function() {
			var tex = gl.loadTexture( path, img, true );
			switch (type) {
				case "defuse":  self.mainTexture = tex; break;
				case "spec":    self.specTexture = tex; break;
				case "normal":  self.normalTexture = tex; break;
				case "ambiant": self.ambiantTexture = tex; break;
				case "bump":    self.bumpTexture = tex; break;
			}
			self.texLoad--;
			self.checkIsReady();
		}

		return this;
	}
	checkIsReady() {
		this.ready = this.texLoad === 0 && this.recevedMesh===true;
		return this.ready;
	}
	loadSkyDomTexture( gl, name, imgAry ) { 
		this.cumbMap = gl.fLoadCubeMap( name, imgAry ); 
		if (  this.shader )
			this.shader.setTexture( this.cumbMap);
		return this;
	}
	setRenderPass( nr ) {
		g_backbone.currentScene().setMaxRenderPass(nr);
		this.renderPass = nr;
		return this;
	}
	
	pos() { return this.transform.position; }
	scale() { return this.transform.scale; }
	rot() { return this.transform.rotation; }
	forward() { return this.transform.forward; }
	right() { return this.transform.right; }
	up() { return this.transform.up; }

	setPosition(x,y,z) { 
		if (arguments.length == 1 )
			this.transform.position = x; 
		else 
			this.transform.setPosition(x,y,z); 
		return this;
	}
	setScale(x,y,z) {
		if (arguments.length == 1 )
			this.transform.scale = x; 
		else 
			this.transform.setScale(x,y,z); 
		return this; 
	}
	setRotation(x,y,z) { 
		if (arguments.length == 1 )
			this.transform.rotation = x; 
		else 
			this.transform.setRotate(x,y,z); 
		return this;
	}
	setViewMatrix ( mat ) {
		this.fixedViewMat = [...mat];
	}

	addPosition(x,y,z) { this.transform.addPosition(x,y,z); return this; }
	addScale(x,y,z) { this.transform.addScale(x,y,z); return this; }
	addRotation(x,y,z) { this.transform.addRotate(x,y,z); return this; }

	// setup the RenderEngine
	isRenderReady() {
		if ( this.shader && !this.shader.isReady() )
				return false;
		return this.ready;
	}
	preRender() {
		if ( !this.ready )
			return this;
		if ( this.fixedViewMat ) {
			let trans = this.transform;
			trans.matView = this.fixedViewMat;
			mat3.normalFromMat4( trans.normal, trans.matView );			
		}
		else
			this.transform.updateMatrix(); 
		return this;
	}
	updateLogic( deltaTime ) { return; }
	customPreRender( shader ) { return; }
	customPreCleanup( shader ) { return; }
	render(gl, fallbackShader = null, overwriteShader = null) {
		const sceen = g_backbone.currentScene();
		if ( sceen.instanceMap.has( this ) ) {
			const instList =  sceen.instanceMap.get(this);
			if ( instList.length )
				instList[0].render(gl, fallbackShader, overwriteShader);
			return this;
		}
		if ( !this.isRenderReady() )
			return this;

		let shader = this.shader;
		if ( !!overwriteShader )
			shader = overwriteShader;		
		if ( !shader )
			shader = fallbackShader;
		if ( !shader ){
			console.log("No Shader to render modal");
			return this;
		}
		
		shader.activate().preRender();
		this.preRender();
		this.customPreRender(shader);


		if ( !this.visible ) {
			return this;
		}

		shader.setModelMatrix( this.transform.getViewMatrix() );

		if ( this.mainTexture !== undefined && this.mainTexture != null ){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.mainTexture );
			gl.uniform1i( shader.uniformLoc.uMainTexture, 0 );
		}
		if ( this.specTexture !== undefined && this.specTexture != null ){
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.specTexture );
			gl.uniform1i( shader.uniformLoc.uSpecTex1, 1 );
		}
		if ( this.normalTexture !== undefined && this.normalTexture != null ){
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.normalTexture );
			gl.uniform1i( shader.uniformLoc.uNormalTex1, 2 );
		}
		if ( this.ambiantTexture !== undefined && this.ambiantTexture != null ){
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, this.ambiantTexture );
			gl.uniform1i( shader.uniformLoc.uAmbiantTex1, 3 );
		}
		if ( this.bumpTexture !== undefined && this.bumpTexture != null ){
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, this.bumpTexture );
			gl.uniform1i( shader.uniformLoc.uBumpTex1, 4 );
		}

		for (var i = 0; i < this.meshs.length; i++) {
			let mesh = this.meshs[i];
			gl.bindVertexArray(mesh.vao);

			if ( mesh.noCulling )
				gl.disable(gl.CULL_FACE);
			if ( mesh.doBlending )
				gl.enable(gl.BLEND);

			if ( mesh.indexCount )
				gl.drawElements( mesh.drawMode, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
			else
				gl.drawArrays( mesh.drawMode, 0, mesh.verticesCount);

			gl.bindVertexArray(null);
			if ( mesh.noCulling )
				gl.enable(gl.CULL_FACE);
			if ( mesh.doBlending )
				gl.disable(gl.BLEND);
		}
		
		this.customPreCleanup(shader);
		return this;
	}
}

var g_meshCache = new Map();
class Mesh extends AABB{
	constructor( objData, objOffset ) {
		super();
		this.drawMode = gl.TRIANGLES;
		this.visible = true;
		if ( objData !== undefined )
			this.loadMeshData(objData, objOffset);
	}
	getVertex( idx ) {
		if ( this.fromObj ) {
			let ptr = this.verticesDataSize * idx;
			return vec3.fromValues( this.meshData[ptr], this.meshData[ptr+1], this.meshData[ptr+2] );
		}
		x = this.vertex[ this.index[idx]*3]; // 3 numbers per Vertex 
		y = this.vertex[ this.index[idx]*3 + 1]; // 3 numbers per Vertex 
		z = this.vertex[ this.index[idx]*3 + 2]; // 3 numbers per Vertex 
		return vec3.fromValues( x, y, z );
	};
	getUv( idx ) {
		if ( this.fromObj ) {
			let ptr =  this.verticesDataSize * idx;
			return vec2.fromValues( this.meshData[ptr+3], this.meshData[ptr+4] );
		}
		x = this.uv[ this.index[idx]*2]; // 2 numbers per UV 
		y = this.uv[ this.index[idx]*2 + 1]; // 2 numbers per UV 
		return vec2.fromValues( x, y );
	};

	static createVAO( name, aryIndex, aryVert, aryNormal, aryUV, aryNormalTangent ) {
		var obj = new Mesh(); 
		if (g_meshCache.has(name))
			return g_meshCache.get(name);

		obj.name = name;
		obj.index = aryIndex;
		obj.vertex = aryVert;
		obj.uv = aryUV;
		
		//create VAO
		obj.vao = gl.createVertexArray();
		gl.bindVertexArray(obj. vao);

		//Vertex
		if ( aryVert !== undefined && aryVert != null ) {
			obj.bufVertics = gl.createBuffer();
			obj.vertexComponentLng = 3;
			obj.vertexCount = aryVert.length / obj. vertexComponentLng;

			gl.bindBuffer( gl.ARRAY_BUFFER, obj.bufVertics);
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(aryVert), gl.STATIC_DRAW );
			gl.enableVertexAttribArray( this.selectedMeshtype.ATTR_POSITION_LOC );
			gl.vertexAttribPointer( this.selectedMeshtype.ATTR_POSITION_LOC, 3, gl.FLOAT, false, 0, 0 );
		}
		//Normal
		if ( aryNormal !== undefined && aryNormal != null ) {
			obj.bufNormals = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, obj.bufNormals);
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(aryNormal), gl.STATIC_DRAW );
			gl.enableVertexAttribArray( this.selectedMeshtype.ATTR_NORMAL_LOC );
			gl.vertexAttribPointer( this.selectedMeshtype.ATTR_NORMAL_LOC, 3, gl.FLOAT, false, 0, 0 );


			if ( aryNormalTangent === undefined || aryNormalTangent == null ) {
				var aryNormalTangentMap = new Map();
				for (var i = 0 ; i < aryIndex.length ; i += 3) {
					var v0 = obj.getVertex(i);
					var v1 = obj.getVertex(i+1);
					var v2 = obj.getVertex(i+2);
					var u0 = obj.getUv(i);
					var u1 = obj.getUv(i+1);
					var u2 = obj.getUv(i+2);

					var edge1 = vec3.subtract( vec3.create(), v1, v0 );
					var edge2 = vec3.subtract( vec3.create(), v2, v0 );

					var delta1 = vec2.subtract( vec2.create(), u1, u0 );
					var delta2 = vec2.subtract( vec2.create(), u2, u0 );

					var f = 1.0 / (delta1[0] * delta2[1] - delta2[0] * delta1[1]);

					var tangent = vec3.create();
					tangent[0] = f * (delta2[1] * edge1[0] - delta1[0] * edge2[0] );
					tangent[1] = f * (delta2[1] * edge1[1] - delta1[0] * edge2[1] );
					tangent[2] = f * (delta2[1] * edge1[2] - delta1[0] * edge2[2] );
					vec3.normalize( tangent, tangent);
					aryNormalTangentMap.set(aryIndex[i+0], tangent);
					aryNormalTangentMap.set(aryIndex[i+1], tangent);
					aryNormalTangentMap.set(aryIndex[i+2], tangent);
				}
				aryNormalTangent = new Float32Array(aryNormal.length);
				for ( var i = 0; i < aryNormal.length; i+=3 ) {
					var tangent = aryNormalTangentMap.get(i/3);
					aryNormalTangent[i  ] = tangent[0];
					aryNormalTangent[i+1] = tangent[1];
					aryNormalTangent[i+2] = tangent[2];
				}
			}
			else {
				aryNormalTangent = new Float32Array(aryNormalTangent);
			}
			
			obj.bufNormalT = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, obj. bufNormalT );
			gl.bufferData( gl.ARRAY_BUFFER, aryNormalTangent, gl.STATIC_DRAW );
			gl.enableVertexAttribArray( this.selectedMeshtype.ATTR_NORMAL_T_LOC );
			gl.vertexAttribPointer( this.selectedMeshtype.ATTR_NORMAL_T_LOC, 3, gl.FLOAT, false, 0, 0 );
		}
		//UV
		if ( aryUV !== undefined && aryUV != null ) {
			obj.bufUV = gl.createBuffer();
			gl.bindBuffer( gl.ARRAY_BUFFER, obj. bufUV);
			gl.bufferData( gl.ARRAY_BUFFER, new Float32Array(aryUV), gl.STATIC_DRAW );
			gl.enableVertexAttribArray( this.selectedMeshtype.ATTR_UV_LOC );
			gl.vertexAttribPointer( this.selectedMeshtype.ATTR_UV_LOC, 2, gl.FLOAT, false, 0, 0 );
		}		
		//Index
		if ( aryIndex !== undefined && aryIndex != null ) {
			obj.bufIndex = gl.createBuffer();
			obj.indexCount = aryIndex.length;
			gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, obj. bufIndex);
			gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(aryIndex), gl.STATIC_DRAW );
		}


		gl.bindVertexArray(null);
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
		gl.bindBuffer( gl.ARRAY_BUFFER, null );

		g_meshCache.set(name, obj);
		return obj;
	}

	loadMeshData( string, objOffset ) {
		if (objOffset === undefined )
			objOffset = { v:0, vt:0, vn:0 };
		var lines = string.split("\n");
		this.hasNormal = false;
		this.hasUv = false;
		var positions = [];
		var normals = [];
		var uv = [];

		this.meshData = [];
		this.fromObj = true;
		var oThis = this;

		function createFace(faceData) {			
			let v0 = vec3.clone(faceData[0]);
			let u0 = vec2.clone(faceData[0].slice(3));
			let v1 = vec3.clone(faceData[1]);
			let u1 = vec2.clone(faceData[1].slice(3));
			let v2 = vec3.clone(faceData[2]);
			let u2 = vec2.clone(faceData[2].slice(3));

			let edge1 = vec3.subtract( vec3.create(), v1, v0 );
			let edge2 = vec3.subtract( vec3.create(), v2, v0 );

			let delta1 = vec2.subtract( vec2.create(), u1, u0 );
			let delta2 = vec2.subtract( vec2.create(), u2, u0 );

			let f = 1.0 / (delta1[0] * delta2[1] - delta2[0] * delta1[1]);

			let tangent = vec3.create();
			tangent[0] = f * (delta2[1] * edge1[0] - delta1[0] * edge2[0] );
			tangent[1] = f * (delta2[1] * edge1[1] - delta1[0] * edge2[1] );
			tangent[2] = f * (delta2[1] * edge1[2] - delta1[0] * edge2[2] );
			vec3.normalize( tangent, tangent);
			let tNormal = [tangent[0], tangent[1], tangent[2]]
			return [].concat( faceData[0], tNormal, faceData[1], tNormal, faceData[2], tNormal );
		}
		function addVertices( faceData ) {
			let v = faceData[0]-1 - objOffset.v;
			let t = faceData[1]-1 - objOffset.vt;
			let n = faceData[2]-1 - objOffset.vn;
			return positions[v].concat( uv[t] ).concat( normals[n] );
		}

		

		for ( var i = 0 ; i < lines.length ; i++ ) {
			var p = lines[i].trimRight().split(' ');
			if ( p.length > 0 ) {
				switch(p[0]) {
					case 'o':  
						this.name = lines[i].substr(2);
					break;
					case 'v':
						positions.push( this.updateAABB(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])) );
					break;
					case 'vt':
						this.hasUv = true;
						uv.push( [parseFloat(p[1]), parseFloat(p[2])] );
					break;
					case 'vn':
						this.hasNormal = true;
						normals.push( [parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])] );
					break;
					case 'f': 
						var face=[];
						for( let ii = 1 ; ii < p.length; ++ii) 
							face[ii-1] = addVertices( p[ii].split('/') );
						this.meshData = this.meshData.concat( createFace(face) );
					break;					
				}
			}
		}
		this.objInfo = { 
				v:positions.length+objOffset.v, 
				vt:uv.length+objOffset.vt, 
				vn:normals.length+objOffset.vn 
			};
		this.setMeshData(this.meshData, this.hasUv,this.hasNormal);
		this.createMeshVAO();
	}
	setMeshData(data, hasUv = true,hasNormal = true) {
		this.fromObj = true;
		this.verticesDataSize = 3 + (hasUv?2:0) + (hasNormal?6:0); // betangent
		this.verticesCount = data.length / this.verticesDataSize;
		this.meshData = new Float32Array(data),
		console.log("Loaded mesh with " + this.verticesCount + " vertices");
		this.drawMode = gl.TRIANGLES;
		this.createMeshVAO();
		return this;
	}

	createMeshVAO(){		
		//create VAO
		this.vao = gl.createVertexArray();
		gl.bindVertexArray( this.vao );

		this.bufVertics = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, this.bufVertics );
		gl.bufferData( gl.ARRAY_BUFFER, this.meshData, gl.STATIC_DRAW );
		gl.enableVertexAttribArray( 0 );
		gl.vertexAttribPointer( 0, 3, gl.FLOAT, false, this.verticesDataSize*4, 0 );
		gl.enableVertexAttribArray( 1 );
		gl.vertexAttribPointer( 1, 2, gl.FLOAT, false, this.verticesDataSize*4, 3*4 );
		gl.enableVertexAttribArray( 2 );
		gl.vertexAttribPointer( 2, 3, gl.FLOAT, false, this.verticesDataSize*4, 5*4 );
		gl.enableVertexAttribArray( 3 );
		gl.vertexAttribPointer( 3, 3, gl.FLOAT, false, this.verticesDataSize*4, 8*4 );

		gl.bindVertexArray( null );
		gl.bindBuffer( gl.ARRAY_BUFFER, null );
	}

	render( gl ) {

	}
}

var g_modelInstanceMap = new Map();
class ModelInstance {
	constructor( model ){
		this.model = model;		
		this.transform = new Transform();
		this.overwritePos = false;
		this.overwriteRot = false;
		this.overwriteScale = false;

		const sceen = g_backbone.currentScene();
		if ( sceen.instanceMap.has( this.model ) ){
			sceen.instanceMap.get(this.model).push(this);
		}
		else {
			sceen.instanceMap.set(this.model, [this]);
		}
	}
	removeInstance() {
		const sceen = g_backbone.currentScene();
		sceen.instanceMap.set(this.model, sceen.instanceMap.get(this.model).filter(el => el != this ) );
	}

	setPosition(x,y,z) { this.overwritePos=true; if (arguments.length == 1 ) this.transform.position = x;  else this.transform.setPosition(x,y,z);  return this; }
	setScale(x,y,z) { this.overwriteScale=true; if (arguments.length == 1 ) this.transform.scale = x; else this.transform.setScale(x,y,z); return this; }
	setRotation(x,y,z) { this.overwriteRot=true; if (arguments.length == 1 ) this.transform.rotation = x; else this.transform.setRotate(x,y,z); return this; }
	addPosition(x,y,z) { this.overwritePos=true; this.transform.addPosition(x,y,z); return this; }
	addScale(x,y,z) { this.overwriteScale=true; this.transform.addScale(x,y,z); return this; }
	addRotation(x,y,z) { this.overwriteRot=true; this.transform.addRotate(x,y,z); return this; }

	render(gl, fallbackShader = null, overwriteShader = null) {
		const model = this.model;
		if ( !model.isRenderReady() )
			return this;

		let shader = this.shader;
		if ( !!overwriteShader )
			shader = overwriteShader;		
		if ( !shader )
			shader = fallbackShader;
		if ( !shader )
			return this;

				
		shader.activate().preRender();
		model.preRender().customPreRender(shader);	

		if ( model.mainTexture !== undefined && model.mainTexture != null ){
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, model.mainTexture );
			gl.uniform1i( shader.uniformLoc.uMainTexture, 0 );
		}
		if ( model.specTexture !== undefined && model.specTexture != null ){
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, model.specTexture );
			gl.uniform1i( shader.uniformLoc.uSpecTex1, 1 );
		}
		if ( model.normalTexture !== undefined && model.normalTexture != null ){
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, model.normalTexture );
			gl.uniform1i( shader.uniformLoc.uNormalTex1, 2 );
		}
		if ( model.ambiantTexture !== undefined && model.ambiantTexture != null ){
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, model.ambiantTexture );
			gl.uniform1i( shader.uniformLoc.uAmbiantTex1, 3 );
		}
		if ( model.bumpTexture !== undefined && model.bumpTexture != null ){
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, model.bumpTexture );
			gl.uniform1i( shader.uniformLoc.uBumpTex1, 4 );
		}

		const sceen = g_backbone.currentScene();
		const instances = sceen.instanceMap.get(model);
		for (var i = 0; i < model.meshs.length; i++) {
			let mesh = model.meshs[i];
			gl.bindVertexArray(mesh.vao);

			if ( mesh.noCulling )
				gl.disable(gl.CULL_FACE);
			if ( mesh.doBlending )
				gl.enable(gl.BLEND);
			
			instances.forEach( inst => {
				if ( inst.overwritePos === false )
					inst.transform.position = model.transform.position;
				if ( inst.overwriteRot === false )
					inst.transform.rotation = model.transform.rotation;
				if ( inst.overwriteScale === false )
					inst.transform.scale = model.transform.scale;

				inst.transform.updateMatrix();

				shader.setModelMatrix( inst.transform.getViewMatrix() );
				if ( mesh.indexCount )
					gl.drawElements( mesh.drawMode, mesh.indexCount, gl.UNSIGNED_SHORT, 0);
				else
					gl.drawArrays( mesh.drawMode, 0, mesh.verticesCount);
			});

			gl.bindVertexArray(null);
			if ( mesh.noCulling )
				gl.enable(gl.CULL_FACE);
			if ( mesh.doBlending )
				gl.disable(gl.BLEND);
		}
		
		model.customPreCleanup(shader);
		return this;
	}
}