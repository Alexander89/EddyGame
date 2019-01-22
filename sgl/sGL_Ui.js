g_uiShader = null;

class UI_Panel {
	constructor( parent = null ) {
		this.childs = [];
		this.setParent(parent);
		this.backgroundColor = [ 0.0, 0.0, 0.0, 1.0 ];
		this.zIndex = 1;
		this.rect = [];
		this.rect[0] = 0;	//links
		this.rect[1] = 0;	//unten
		this.rect[2] = 0.25;	//10 Prozent breit
		this.rect[3] = 0.25;	//10 Prozent hoch

		this.vao = null;
		this.bufVertics = null;
		this.createVAO();
	}
	createVAO() {
		let x,y,w,h;
		[x,y,w,h] = this.rect;
		x = x * 2 - 1;
		y = y * 2 - 1;
		w *= 2;
		h *= 2;

		const v1 = [x,y,       0, 0 ];
		const v2 = [x+w, y,    1, 0 ];
		const v3 = [x, y+h,    0, 1 ];
		const v4 = [x+w, y+h,  1, 1 ];
		const vertexData = new Float32Array([ ...v1, ...v2, ...v3, ...v3, ...v2, ...v4 ]);
		
		//create VAO
		if ( !this.vao )
			this.vao = gl.createVertexArray();
		gl.bindVertexArray( this.vao );

		if ( !this.bufVertics )
			this.bufVertics = gl.createBuffer();
		gl.bindBuffer( gl.ARRAY_BUFFER, this.bufVertics );
		gl.bufferData( gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW );
		gl.enableVertexAttribArray( 0 );
		gl.vertexAttribPointer( 0, 2, gl.FLOAT, false, 16, 0 );
		gl.enableVertexAttribArray( 1 );
		gl.vertexAttribPointer( 1, 2, gl.FLOAT, false, 16, 8 );

		gl.bindVertexArray( null );

		this.mode = gl.TRIANGLES;
		this.verticesCount = 6;
		gl.bindBuffer( gl.ARRAY_BUFFER, null );
	}

	setParent( parent ) {
		if ( parent ) {
			this.parent = parent;
			parent.addChild(this);
		}
		this.parent = null;
	}
	addChild( child ){
		this.childs.push(child);
	}
	renderChilds(delteTime) {
		this.childs.forEach( e => e.render(delteTime) );		
	}

	setPos( x, y ) {
		this.rect[0] = x;
		this.rect[1] = y;
		this.createVAO();
		return this;
	}
	setSize( x, y ) {
		this.rect[2] = x;
		this.rect[3] = y;
		this.createVAO();
		return this;
	}
	setZindex( z ) {
		this.zIndex = z;
		return this;
	}

	setBackgroundf( r,g,b,a = 1.0) {
		this.backgrounColor = [r,g,b,a];
		return this;
	}
	setBackgroundi( r,g,b,a = 255) {
		this.backgroundColor = [ r/255.0, g/255.0, b/255.0, a/255.0 ];
		return this;
	}
	preRender(delteTime){
		gl.uniform1i( g_uiShader.uType, 0 );	// panel = 0
		
		gl.uniform4fv( g_uiShader.uBgColor, this.backgroundColor );	// BG color
	}

	render(delteTime) {
		if ( !this.vao )
			return;

		if ( !g_uiShader.activate() ){
			console.log("ui shader not ready");
			return;
		}

		this.preRender(delteTime);

		gl.bindVertexArray( this.vao );
		gl.drawArrays( this.mode, 0, this.verticesCount);
		gl.bindVertexArray( null );

		this.renderChilds(delteTime);
	}
}

class UI_Image extends UI_Panel {
	constructor( parent ) {
		super(parent);
	}

	setTexture( texture ) {
		this.texture = texture;
		return this;
	}

	preRender( delteTime ) {
		gl.uniform1i( g_uiShader.uType, 1 );	// Image = 1

		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, this.texture );
		gl.uniform1i( g_uiShader.uImage, false, 0 );	// uImage = erte texture -> 0
	}
}

class sGLUiShader extends Shader {
	constructor( ) {
		super();
		this.hasFs = false;
		this.hasVs = false;
		this.name = "SmartGL User interface Shader";

		g_backbone.res("shaders/uiShader.fs", data => {
			this.fs = data;
			this.hasFs = true;
			if ( this.hasVs )
				this.initShader();
		});
		g_backbone.res("shaders/uiShader.vs", data => {
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
		this.uType = gl.getUniformLocation( this.program, "uType" ),
		this.uBgColor = gl.getUniformLocation( this.program, "uBgColor" ),
		this.uImage = gl.getUniformLocation( this.program, "uImage" ),

		gl.useProgram( null );
		g_allShader.push(this);
	}
}