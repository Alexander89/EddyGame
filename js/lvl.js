class Level {
	constructor(id, imgElement=null, rasterSize = 3) {
		this.id = id;
		this.canvas = null;
		this.ctx = null;

		this.wall = null;
		this.grass = null;
		this.lava = null;
		this.mud = null;
		this.effect = null;

		this.ready = false;
		this.loadLvlNow = false;
		this.lvlCreated = false;
		this.dataArived = 0;

		this.rasterSize = rasterSize;//3;
		this.halfRasterSize = this.rasterSize*0.5;
		this.fieldData=[];
		this.effectItems=[];

		if ( imgElement ) {
			this.lvlLoaded(imgElement);
			this.setReady();
		}
		else {
			let img = new Image(); // Erstelle neues Image-Objekt
			img.addEventListener("load", () => {
				this.lvlLoaded(img); 
				this.dataArived++;
				if ( this.dataArived === 1) 
					this.setReady();
			}, false);
			img.src = `lvl/level${id}.bmp`; // Setze den Pfad zum Bild
		}
	}

	lvlLoaded(img) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = img.width;
		this.canvas.height = img.height;		
		this.ctx = this.canvas.getContext('2d');
		this.ctx.drawImage(img, 0, 0, img.width, img.height);

		this.mapSizeX = img.width;
		this.mapSizeY = img.height;
		this.rasterXShift = this.mapSizeX*0.5;
		this.rasterYShift = this.mapSizeY*0.5;
		this.uvScaleX = 1/this.mapSizeX;
		this.uvScaleY = 1/this.mapSizeY;

		this.fieldData=[];
		for ( let x = 0; x < img.width; x++ ) {
			this.fieldData[x]=[];
			for (let y = 0; y < img.height; y++ ) {
				this.fieldData[x][y] = this.getFieldData(x,y);
			}
		}
	}

	setReady() {
		this.ready = true;
		if ( this.loadLvlNow )
			this.createLVL();
		this.loadLvlNow = false;
		return this;
	}

	getFieldData(x,y){
		const pixelData = this.ctx.getImageData(x, y, 1, 1).data;
		// 0 = red 			0 = -10 / 255 = +10
		// 1 = green 		field Type 0 = normal
		return {h:((pixelData[0]/12.75)-10)/1.5, t:pixelData[1]} 
	}
	getStartPos(nr){
		for ( let x = 0 ; x < this.mapSizeX; ++x ){
			for ( let y = 0 ; y < this.mapSizeY; ++y ){
				const pixelData = this.ctx.getImageData(x, y, 1, 1).data;
				if ( pixelData[2] == 100 + nr )
					return this.getFieldCenterPos( x , y, pixelData[0]);
			}
		}
		return [0,10,0];
	}

	enterPosition(x, z, y) {
		x = this.translateXRev(x);
		y = this.translateYRev(y);

		const fieldData = this.getFieldData(x,y);

		if ( fieldData.h > (z + 0.25) )
			return { h: fieldData.h, access: false, t: fieldData.t  };

		return { h: fieldData.h, access: true, t: fieldData.t };
	}

	translateX(x) {
	 return (x - this.rasterXShift) * this.rasterSize; 
	}
	translateY(y) { return (y - this.rasterYShift) * this.rasterSize; }
	translateXRev(x) { return x / this.rasterSize + this.rasterXShift; }
	translateYRev(y) { return y / this.rasterSize + this.rasterYShift; }

	getFieldCenterPos( x, y, h ) {
		return [this.translateX(x) + this.halfRasterSize, ((h/12.75)-10)/1.5, this.translateY(y) + this.halfRasterSize];
	}
	getFieldCenterPosSimple( x, y, h ) {
		return [this.translateX(x) + this.halfRasterSize, h, this.translateY(y) + this.halfRasterSize];
	}
	// Create VertexPosition for VAO
	calcVertexPos(x, y, z) {
		return [this.translateX(x),				// Räumliche Breite
			z,															// Höhe
			this.translateY(y)];						// Räumliche Tife
	}	
	// Create UV's for Bottom/Effect field/Wall 
	calcBottomUV(x, y) {
		return [x*this.uvScaleX*5, y*this.uvScaleX*5]; // UV 
	}
	calcEffectUV(x, y) {
		return [x, y]; // UV 
	}
		// Create UV's for VAO
	calcWallUV(x, y) {
		return [x*this.uvScaleX*25, y*this.uvScaleX*10]; // UV 
	}

	// Create a Vertex for a Bottom Surface
	createBottomVertex(x,y,z) {
		return [...this.calcVertexPos(x,y,z),
			...this.calcBottomUV(x,y),
			0, 1, 0, // Normal
			1, 0, 0]; // Normal Tangent
	}
	createEffectVertex(x,y,z) {
		return [...this.calcVertexPos(x,y,z),
			...this.calcEffectUV(x,y),
			0, 1, 0, // Normal
			1, 0, 0]; // Normal Tangent
	}

	// create a Vertex for a directional Wall
	// dir: 0 Top, 1 Right, 2 Button, 3 Left
	createWallVertex(dir, x, y, z ) { 
		let data = this.calcVertexPos(x,y,z);
		switch (dir) {
			case 0:
				data.push( ...this.calcWallUV(this.mapSizeX-x,z) );
				data.push( 0, 0, -1, -1, 0, 0 );
			break;
			case 1:
				data.push( ...this.calcWallUV(this.mapSizeY-y,z) );
				data.push( 1, 0,  0,  0, 0, -1 );
			break;
			case 2:
				data.push( ...this.calcWallUV(x,z) );
				data.push( 0, 0,  1,  1, 0, 0 );
			break;
			case 3:
				data.push( ...this.calcWallUV(y,z) );
				data.push(-1, 0,  0,  0, 0, 1 );
			break;
		}
		return data;
	}
	createWall( dir, height, nextHeight, x, y ) {
		let data = [];
		if ( dir === 0) {			
			x += 1; // wird für alle benötigt
			if ( height > nextHeight ) { // gut				
				const v1 = this.createWallVertex( 1, x, y+1, height );
				const v2 = this.createWallVertex( 1, x, y,   height );
				const v3 = this.createWallVertex( 1, x, y+1, nextHeight );
				const v4 = this.createWallVertex( 1, x, y,   nextHeight );
				data.push( ...v2, ...v1, ...v3 );
				data.push( ...v2, ...v3, ...v4 );
			}
			else { // ganz falsch
				const v1 = this.createWallVertex( 3, x, y+1, height );
				const v2 = this.createWallVertex( 3, x, y,   height );
				const v3 = this.createWallVertex( 3, x, y+1, nextHeight );
				const v4 = this.createWallVertex( 3, x, y,   nextHeight );
				data.push( ...v1, ...v3, ...v2 );
				data.push( ...v2, ...v3, ...v4 );
			}
		} 
		else {			
			y += 1; // wird für alle benötigt
			if ( height > nextHeight ) { // gut
				const v1 = this.createWallVertex( 2, x, y,   height );
				const v2 = this.createWallVertex( 2, x+1, y, height );
				const v3 = this.createWallVertex( 2, x, y, nextHeight );
				const v4 = this.createWallVertex( 2, x+1, y, nextHeight );
				data.push( ...v2, ...v1, ...v4 );
				data.push( ...v1, ...v3, ...v4 );
			}
			else {// auch falsch
				const v1 = this.createWallVertex( 0, x, y,   height );
				const v2 = this.createWallVertex( 0, x+1, y, height );
				const v3 = this.createWallVertex( 0, x, y,   nextHeight );
				const v4 = this.createWallVertex( 0, x+1, y, nextHeight );
				data.push( ...v1, ...v4, ...v2 );
				data.push( ...v1, ...v3, ...v4 );
			}			
		}
		return data;
	}

	createLVL() {
		if ( !this.ready ) {
			this.loadLvlNow = true;
			return this;
		}
		if ( this.lvlCreated === true )
			return this;

		this.lvlCreated = true;

		const scene = smartGl.currentScene();

		let vert = [];
		let vertSchlamm = [];
		let vertLava = [];
		let vertWaende = [];
		let vertEffect = [];
		for ( let x = 0 ; x < this.mapSizeX; ++x ){
			for ( let y = 0 ; y < this.mapSizeY; ++y ){
				// feld auf richtiger Höhe erzeugen
				const fieldInfo = this.fieldData[x][y];
				const height = fieldInfo.h;
				if ( fieldInfo.t < 100 ) {
					let bodenVert = [];
					bodenVert.push( ...this.createBottomVertex(x, y, height) );
					bodenVert.push( ...this.createBottomVertex(x, y+1, height) );
					bodenVert.push( ...this.createBottomVertex(x+1, y, height) );

					bodenVert.push( ...this.createBottomVertex(x, y+1, height) );
					bodenVert.push( ...this.createBottomVertex(x+1, y+1, height) );
					bodenVert.push( ...this.createBottomVertex(x+1, y, height) );

					if (fieldInfo.t === 0)
						vert.push( ...bodenVert );
					else if (fieldInfo.t === 50)
						vertSchlamm.push( ...bodenVert );
					else if (fieldInfo.t === 80)
						vertLava.push( ...bodenVert );
				}
				else {
					let effectVert = [];
					effectVert.push( ...this.createEffectVertex(x, y, height) );
					effectVert.push( ...this.createEffectVertex(x, y+1, height) );
					effectVert.push( ...this.createEffectVertex(x+1, y, height) );

					effectVert.push( ...this.createEffectVertex(x, y+1, height) );
					effectVert.push( ...this.createEffectVertex(x+1, y+1, height) );
					effectVert.push( ...this.createEffectVertex(x+1, y, height) );
					
					vertEffect.push( ...effectVert );

					let type = LIFE;
					if (fieldInfo.t === 120)
						type = LIFE;
					if (fieldInfo.t === 130)
						type = SPEED;
					if (fieldInfo.t === 140)
						type = HIDE;
					if (fieldInfo.t === 150)
						type = LIGHT;

					this.effectItems.push( new EffectItem( this.getFieldCenterPosSimple(x,y,height), type) );
				}

				//prüfe ob die rechte Wand auf einer anderen Höhe ist,
				if ( x < this.mapSizeX - 1) {
					const nextHeight = this.fieldData[x+1][y].h;
					if ( height != nextHeight) 
						vertWaende.push( ...this.createWall( 0, height, nextHeight, x, y ) );
				}
				//prüfe ob die untere Wand auf einer anderen Höhe ist,
				if ( y < this.mapSizeY - 1) {
					const nextHeight = this.fieldData[x][y+1].h;
					if ( height != nextHeight) 
						vertWaende.push( ...this.createWall( 1, height, nextHeight, x, y ) );		
				}
			}
		}

		const meshGrass = new Mesh().setMeshData( vert );
		this.grass = new Model(meshGrass).loadTexture("img/grass.jpg");
		this.grass.setSelectable( false );
		scene.addObject(this.grass);
		if ( vertSchlamm.length > 0) {
			const meshMud = new Mesh().setMeshData( vertSchlamm );
			this.mud = new Model(meshMud).loadTexture("img/mud.jpg");
			this.mud.setSelectable( false );
			scene.addObject(this.mud);
		}
		if ( vertLava.length > 0) {
			const meshLava = new Mesh().setMeshData( vertLava );
			this.lava = new Model(meshLava).loadTexture("img/lava.jpg");
			this.lava.setSelectable( false );
			this.lava.updateLogic = dT=>{
				const shift = g_frameTime/20000.0 % 2.0;
				this.lava.texShift = [shift, shift/2];
			};
			this.lava.customPreRender = shader=>{
				if ( shader === g_backbone.objectShader )
					shader.pushTexShift2fv(this.lava.texShift);
			};
			this.lava.customPreCleanup = shader=>{
				if ( shader === g_backbone.objectShader )
					shader.pushTexShift(0,0);				
			};
			this.lava.setShader(g_backbone.objectShader);		/// lava is not acting with light and shadow!!!
			scene.addObject(this.lava);
		}
		if ( vertEffect.length > 0) {
			const meshEffect = new Mesh().setMeshData( vertEffect );
			this.effect = new Model(meshEffect).loadTexture("img/effectfield.png");
			this.effect.setSelectable( false );
			scene.addObject(this.effect);
		}

		const meshWall = new Mesh().setMeshData( vertWaende );
		this.wall = new Model(meshWall).loadTexture("img/stein.jpg");
		this.wall.setSelectable( false );
		scene.addObject(this.wall);
	}
}
