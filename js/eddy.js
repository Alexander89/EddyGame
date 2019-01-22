class Eddy
{
	constructor( id, controllerID ) {
		this.playerID = id;
		this.controllerID = controllerID;
		
		const startpos = gLvl.getStartPos(id);
		this.eddy = new Model("obj/Eddy.obj").loadTexture("obj/Eddy.png" ).setPosition(startpos);
		this.eddy.updateLogic = dT=>this.update(dT);
		this.eddyPos = vec3.clone( this.eddy.pos() );
		this.eddyHandL = new Model("obj/Eddy_HandLeft.obj").loadTexture("obj/Eddy.png" ).setPosition(this.eddyPos);
		this.eddyHandR = new Model("obj/Eddy_HandRight.obj").loadTexture("obj/Eddy.png" ).setPosition(this.eddyPos);
		this.eddyToach = new Model("obj/Eddy_Light.obj").loadTexture("obj/EddyLight.png" ).setPosition(this.eddyPos);
		this.toachLight = null;
		this.localLightup = null;

		this.visible = false;
		this.hidesAvailable = 0;
		this.catched = false;
		this.eddyOverwriteObject = null;

		// set from outside to customize game
		this.healthMax = 100;
		this.health = this.healthMax;
		this.lightUnloading = 0.05;
		this.runSpeed = 3.5;
		this.sideSpeed = 3.0;
		this.turnSpeed = 90.0; // deg ?
		this.hideDuration = 5000; // ms
		this.toachMaxInt = 2.5;
		this.camperProtectionOn = true; // 

		this.toachPowerMax = 1.0;
		this.toachPower = this.toachPowerMax/4;
		this.lightOn = false;
		this.lightTurn = 0.0;
		this.lightTurnDownSpeed = 720;
		this.lightTurnUpSpeed = 180;
		this.maxCameraDist = 3.5;
		this.reqCameraDist = this.maxCameraDist;
		this.cameraDist = this.reqCameraDist;
		this.nigSpeed = 1.0;

		this.frontF = 0;
		this.rightF = 0;
		this.turnF = 0;
		this.nigF = 0;
		this.gravetyF = -1;
		this.gravetyConst = 10;
		this.onGround = false;
		this.animationPhase = 0;
		
		this.hide = false;
		this.hideStart = 0;

		this.camperProtTimer = 0;
		this.camperPos = [0,0];	//only 2D to ignore Jumping 
		this.camperNonMovementCounter = 0;
		this.camperLightUp = false;
		this.camperLightUpCooldownStart = 0;

		this.soundWalkDownPlayed = false;

		this.boundGroundtype = 0; // start with grass.

		if ( this.controllerID < 4 ) {	// controlled Localy
			this.localLightup = new Light(Light.Point).setParam({color:[1,1,1],intens:0.7, specColor:[0,0,0],specIntens:0.0, falloffLinear:15, falloffQaud:2, maxDist:2.5 });

			if ( gGamePad ) {
				gGamePad.bindButton(9, (id,ev)=>{if(ev===1) menue();} ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindButton(0, (id,ev)=>{if(ev===1) menueSelect();} ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindButton(2, (id,ev)=>{if(ev===1) menueReturn();} ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindButton(12, (id,ev)=>{if(ev===1) menueUp();} ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindButton(13, (id,ev)=>{if(ev===1) menueDown();} ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindButton(14, (id,ev)=>{if(ev===1) menueLess();} ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindButton(15, (id,ev)=>{if(ev===1) menueMore();} ); // test mit http://luser.github.io/gamepadtest/
				
				gGamePad.bindButton(4, action ); // 11 rechter stick
				gGamePad.bindButton(5, jump ); // test mit http://luser.github.io/gamepadtest/
				gGamePad.bindAxis(0, sideStep ); // left right
				gGamePad.bindAxis(1, run ); // up down
				gGamePad.bindAxis(2, turn ); // drehen
				gGamePad.bindAxis(3, camNig ); // cam rauf-runter
			}
			else if ( gGameKeybord ) {
				gGameKeybord.bindButton(' ', jump ); // test mit
				gGameKeybord.bindButton( "Escape", menue ); // 11 rechter stick
				gGameKeybord.bindKeyAxis('a', 'd', sideStep ); // left right
				gGameKeybord.bindKeyAxis('A', 'D', sideStep ); // left right
				gGameKeybord.bindKeyAxis('w', 's', run ); // up down
				gGameKeybord.bindKeyAxis('W', 'S', run ); // up down
				gGameKeybord.bindMouseAxis('x', turn ); // drehen
				gGameKeybord.bindMouseAxis('y', camNig ); // cam rauf-runter
				gGameKeybord.bindButton( "Shift", action );
			}
		}	
	}
	resetValues() {
		this.hidesAvailable = 0;
		this.catched = false;
		this.eddyOverwriteObject = null;

		this.toachPowerMax = 1.0;
		this.toachPower = this.toachPowerMax/4;
		this.lightOn = false;
		this.lightTurn = 0.0;
		this.lightTurnDownSpeed = 720;
		this.lightTurnUpSpeed = 180;
		this.maxCameraDist = 3.5;
		this.reqCameraDist = this.maxCameraDist;
		this.cameraDist = this.reqCameraDist;

		this.sideSpeed = 3.0;
		this.nigSpeed = 1.0;

		this.frontF = 0;
		this.rightF = 0;
		this.turnF = 0;
		this.nigF = 0;
		this.gravetyF = -1;
		this.gravetyConst = 10;
		this.onGround = false;
		
		this.hide = false;
		this.hideStart = 0;
	}
	sendPlayerData() {
		if ( this === gEddy )
			gSocket.send(`PlayerData/{"pos":[${this.eddy.pos()}],"rot":[${this.eddy.rot()}],"l":${this.lightOn},"v":${this.frontF},"s":${this.rightF},"r":${this.turnF},"g":${this.gravetyF},"h":${this.hide},"hs":${this.hideStart},"p":${this.toachPower},"he":${this.health}}`);
	}

	show() {
		if ( !this.visible ) {
			this.visible = true;
			const scene = smartGl.currentScene();
			scene.addObject( this.eddy );
			scene.addObject( this.eddyHandL );
			scene.addObject( this.eddyHandR );

			if ( this.seeker ) {
				scene.addObject( this.eddyToach );
				scene.addLight( this.toachLight );
			}
			if ( this.localLightup ) {
				scene.addLight( this.localLightup );
			}
			if ( this.camperProtectionOn && this.camperProtTimer === 0 )
				this.camperProtTimer = window.setInterval( ()=>this.camperProtection(), 1000 );
		}
		return this;
	}
	hidePlayer() {
		if ( this.visible ) {
			this.visible = false;
			const scene = smartGl.currentScene();
			scene.removeObject( this.eddy );
			scene.removeObject( this.eddyHandL );
			scene.removeObject( this.eddyHandR );

			if ( this.seeker ) {
				scene.removeObject( this.eddyToach );
				scene.removeLight( this.toachLight );
			}
			if ( this.localLightup ) {
				scene.removeLight( this.localLightup );
			}

			if ( this.camperProtTimer !== 0 )
				window.clearTimeout( this.camperProtTimer );
			this.camperProtTimer = 0;
		}
		return this;
	}
	setSeeker( seeker ){
		this.seeker = seeker;
		if ( seeker ){
			this.toachLight = new Light(Light.Spot).setParam({on:false, intens:2.5, specColor:[1,1,0.7], color:[1,1,0.8], specIntens:1.7, falloffLinear: 0.1, falloffQaud: 0.1, innerCone: 0.994, outerCone: 0.96 });
			this.toachLight.shadowSize = gShadowSize/2;
			this.toachLight.shadowSmooth = Math.max((gShadowSmooth-1),0);
			this.toachLight.setShadow(true);
			//this.toachLight.showObj(true);
		}
		return this;		
	}
	setPos( pos ) {
		this.eddyPos = pos;
		this.eddy.setPosition(pos);
		this.eddyHandL.setPosition(pos);
		this.eddyHandR.setPosition(pos);
	}

	aktivateToach() {// set light as on	
		if ( this.toachLight )	 {
			this.lightOn = true;
			this.toachLight.on = true;
		}
		return this;
	}
	switchOffToach() {// selt light to off
		if ( this.toachLight )	 {
			this.lightOn = false;
			this.toachLight.on = false;
		}
		return this;
	}

	update( deltatime ) {
		const armUpDown = Math.sin(g_frameTime);
		const charecterUpDown = 0;

		const edMod = this.eddy; 

		let eddyPos = this.eddyPos;
		let eddyDir = edMod.forward();
		let eddyRight = edMod.right();
		let eddyRot = edMod.rot();
		let moveForwards = this.frontF;
		let moveSidewards = this.rightF;

		// eddyOverwriteObject logic part
		if ( this.eddyOverwriteObject ) {
			const d = this.eddyOverwriteObject;
			this.lightOn = d.l;
			this.hide = d.h;
			this.hideStart = d.hs;
			this.toachPower = d.p;
			this.health = d.he;
		}

		// healthing stuff 
		if ( this.health < 0 )
			return this;

		this.health += this.healthMax*0.004 * deltatime;
		if ( this.health > this.healthMax )
			this.health = this.healthMax;

		// check field Type
		let envData = gLvl.enterPosition(...eddyPos);
		if ( this.onGround ) 
			this.boundGroundtype = envData.t;
		
		if ( this.boundGroundtype == 50 ) {	// mud
			this.health -= 10 * deltatime;
			moveForwards *= 0.3 ;
			moveSidewards *= 0.3 ;			
		}
		else if ( this.boundGroundtype == 80 ) { // lava
			this.health -= 60 * deltatime;
			moveForwards *= 0.6 ;
			moveSidewards *= 0.6 ;	
		}
		else if ( this.boundGroundtype == 100 ) { // undef...
		}
		if ( this.health < 0 )
			this.sendPlayerData();
		// seeker logic like light
		if ( this.seeker ) {
			if ( this.lightOn ) {
				this.toachPower -= this.lightUnloading * deltatime;
				this.toachLight.maxDist = 55.0;
				const prec = this.toachPower / this.toachPowerMax;
				if ( prec < 0.125 )
					this.toachLight.intens = this.toachMaxInt*(prec*8);
				else 
					this.toachLight.intens = this.toachMaxInt;

				if (this.toachPower <= 0.0)
					this.switchOffToach();
			}
			else if ( gEnableGame ) {
				this.toachLight.maxDist = 0;
				this.toachPower += (this.lightUnloading/10) * deltatime;
				if (this.toachPower >= this.toachPowerMax)
					this.toachPower = this.toachPowerMax;
			}
		}

		// move bewegung
		if ( !this.catched ){
			// move eddy forward
			const forwardVec = vec3.scale( vec3.create(), eddyDir, moveForwards );
			const sidewardVec = vec3.scale( vec3.create(), eddyRight, moveSidewards );
			let move = vec3.add( vec3.create(), forwardVec, sidewardVec);  // calc compleat movement
			vec3.scale( move, move, deltatime);		// frametime regulation

			const moveXPos = vec3.add(vec3.create(), eddyPos, [ move[0], 0, 0 ]);
			if ( !this.checkAccessable(moveXPos) ) 
				move[0] = 0;
			const moveYPos = vec3.add(vec3.create(), eddyPos, [ 0, 0, move[2] ] );
			if ( !this.checkAccessable(moveYPos) ) 
				move[2] = 0;

			vec3.add( eddyPos, eddyPos, move);
			envData = gLvl.enterPosition( ...eddyPos );

			this.eddyPos = eddyPos;
		}

		// gravety	
		const g =  this.gravetyF * deltatime;
		let absG = Math.abs(this.gravetyF);
		if ( absG > 0.6  ) {
			absG = Math.pow(1.2 , (Math.pow(1.4 , (absG-0.6))-1)/10);
			this.eddy.setScale( 1, absG, 1);
		}
		else 
			this.eddy.setScale( 1, 1, 1 );
		
			
		this.gravetyF -= this.gravetyConst*deltatime;		

		eddyPos[1] += g;
		if ( eddyPos[1] <= envData.h + 0.01 ) {
			this.gravetyF = 0.0;
			eddyPos[1] = envData.h;
		}		
		this.onGround = eddyPos[1] < (envData.h+0.1);

		// turn eddy

		eddyRot[1] += this.turnF * deltatime
		// overwrite by networkdata  position part (can be similar)
		if ( this.eddyOverwriteObject ) {
			const d = this.eddyOverwriteObject;
			eddyPos = this.eddyPos = d.pos
			this.eddy.setRotation(eddyRot = d.rot);

			this.lightOn = d.l;
			this.frontF = d.v;
			this.rightF = d.s;
			this.turnF = d.r;
			this.gravetyF = d.g;

			this.eddyOverwriteObject = null;
		}
		
		// Hide player
		if ( !this.seeker ) {
			if (this.hide === true && this.hideStart + this.hideDuration <= g_frameTime && this.hideStart != 0) 
				this.hide = false;
			
			this.eddy.visible = !this.hide;
			this.eddyHandL.visible = !this.hide;
			this.eddyHandR.visible = !this.hide;
		}

		// positioning stuff for objects
		// walking animation
		let animatedEddyPos = [...eddyPos];
		if ( !this.hide ) {
		const procF = this.frontF / this.runSpeed;
		const procS = this.rightF / this.sideSpeed;
			if ( (this.frontF || this.rightF) && this.onGround ) {
				this.animationPhase += Math.max(Math.abs(procF),Math.abs(procS) ) * 15 * deltatime;
				const animation = Math.sin(this.animationPhase);
				if ( animation < -0.8 && this.soundWalkDownPlayed === true ) {
					gAudio.play3DSound("sound/egg_walk1.mp3", eddyPos);
					this.soundWalkDownPlayed = false;
				}
				else if ( animation > 0.8 && this.soundWalkDownPlayed === false) {
					//console.log("animation up", animation);
					//gAudio.play3DSound("sound/egg_walk2.mp3", eddyPos);
					this.soundWalkDownPlayed = true;
				}
				animatedEddyPos[1] += animation/25;
			}
		}
		edMod.setPosition(animatedEddyPos);	
		
		
		let handPos = vec3.clone(eddyPos);
		let handRot = vec3.clone(eddyRot);

		handPos[1] += 0.55; // LiftUp the Hand and light
		if ( (this.frontF || this.rightF) && this.onGround )
			handPos[1] += Math.sin(this.animationPhase*0.8)/45;
		this.eddyHandL.setPosition(handPos);
		this.eddyHandL.setRotation(eddyRot);


		if ( (this.frontF || this.rightF) && this.onGround )
			handPos[1] += Math.sin((g_frameTime/45))/43;
		this.updateSeekerHandLightStuff( deltatime, eddyPos, eddyRot, handPos, handRot)
		this.eddyHandR.setPosition(handPos);	// nach seekerStuff, da die Hand gedreht sein könnte
		this.eddyHandR.setRotation(handRot); 

		this.updateCamera( deltatime, eddyPos, eddyRot, eddyDir ); // move Camera only for local Eddy
		
		// erleuchtung für lokalen eddy hinzufügen
		if ( this === gEddy && this.localLightup )
			this.localLightup.setPosition( eddyPos[0], eddyPos[1]+1.0, eddyPos[2]);
		
		// CamperProtection
		if ( this.camperLightUp && this.camperLightUpCooldownStart > 0) {
			if (this.camperLightUpCooldownStart + 3000 < g_frameTime) {
				this.camperLightUp = false;
				this.eddy.setRenderPass(0).setShader(null);
				this.eddyHandL.setRenderPass(0).setShader(null);
				this.eddyHandR.setRenderPass(0).setShader(null);
			}

		}
		return this;			
	}
	checkAccessable( eddyPos ) {
		const frontPoint = [eddyPos[0], eddyPos[1], eddyPos[2]+0.4];
		if ( gLvl.enterPosition( ...frontPoint ).access === false ) 
			return false;
		
		const rearPoint = [eddyPos[0], eddyPos[1], eddyPos[2]-0.4];
		if ( gLvl.enterPosition( ...rearPoint ).access === false ) 
			return false;
		
		const rightPoint = [eddyPos[0]+0.4, eddyPos[1], eddyPos[2]];
		if ( gLvl.enterPosition( ...rightPoint ).access === false ) 
			return false;
		
		const leftPoint = [eddyPos[0]-0.4, eddyPos[1], eddyPos[2]+0.4];
		if ( gLvl.enterPosition( ...leftPoint ).access === false ) 
			return false;
		
		return true;
	}
	updateSeekerHandLightStuff( deltatime, eddyPos, eddyRot, handPos, handRot ) {
		if ( !this.seeker ) 
			return;

		if ( this.lightOn ) {
			if ( this.lightTurn < 89 )
				this.lightTurn += this.lightTurnDownSpeed * deltatime;

			if ( this.lightTurn > 89 )
				this.lightTurn = 89;
		}
		else {
			if ( this.lightTurn > 0 )
				this.lightTurn -= this.lightTurnUpSpeed * deltatime;
			if ( this.lightTurn < 0 )
				this.lightTurn = 0;
		}
		handRot[0] += this.lightTurn;	// turn Hand and Light
	
		this.eddyToach.setPosition(handPos);
		this.eddyToach.setRotation(handRot);

		//const toachPos = vec3.add( vec3.create(), [-0.53, 0.65, 0.3], eddyPos);

		// calc Toach Position in Eddys hand
		let lightPosMat = mat4.identity( mat4.create() );							// von unten lesen!!
		mat4.translate( lightPosMat, lightPosMat, eddyPos );						// dann verschieben
		mat4.rotateY( lightPosMat, lightPosMat, eddyRot[1] * Transform.deg2Rad);	// dann mit eddy mitdrehen
		mat4.rotateX( lightPosMat, lightPosMat, eddyRot[0] * Transform.deg2Rad);	// dann mit eddy mitdrehen
		mat4.rotateZ( lightPosMat, lightPosMat, eddyRot[2] * Transform.deg2Rad);	// dann mit eddy mitdrehen
		mat4.translate( lightPosMat, lightPosMat, [-0.53, 0.60, 0.25] );				// dann verschieben
		

		let lightPos = vec3.transformMat4( vec3.create(), [0,0,0,0], lightPosMat );		
		this.toachLight.setPosition(lightPos);


		// calc ToachDirection
		let lightDir = vec3.clone(this.eddy.forward());
		let lightUp = vec3.clone(vec3.scale(vec3.create(), this.eddy.up(), -1 ));
		let lightDirMat = mat4.identity( mat4.create() );
		mat4.rotate( lightDirMat, lightDirMat, (this.lightTurn+90) * Transform.deg2Rad, this.eddy.right());	// lampe erst drehen

		vec3.transformMat4( lightDir, lightDir, lightDirMat );	
		vec3.transformMat4( lightUp, lightUp, lightDirMat );	

		this.toachLight.setDirection( lightDir );
		this.toachLight.setUp( lightUp );
	}
	updateCamera( deltatime, eddyPos, eddyRot, eddyDir ) {
		if ( this !== gEddy )
			return;

		if ( this.reqCameraDist > this.maxCameraDist )
			this.reqCameraDist = this.maxCameraDist;
		// camera mit PI-Regelung implementier
		// P = +-0.005
		// I = deltaDis * 3 * deltaTime
		if ( this.cameraDist != this.reqCameraDist ){
			let approach = (this.reqCameraDist - this.cameraDist)*3; 
			if ( approach < 0 ) { // cam should come closer
				approach -= 0.005;	// sonst nur eine eponenziale annäherung
				approach *= deltatime;
				this.cameraDist += approach;
				if ( this.cameraDist < this.reqCameraDist)
					this.cameraDist = this.reqCameraDist;
			}
			else {  // cam should go away
				approach += 0.005;	// sonst nur eine eponenziale annäherung
				approach *= deltatime;
				this.cameraDist += approach;	
				if ( this.cameraDist > this.reqCameraDist)
					this.cameraDist = this.reqCameraDist;
			}
		}
		let camNig = eddyRot[0] - ( this.nigF * 30 );
		let moveCam = vec3.scale(vec3.create(), eddyDir, Math.cos( -camNig*Transform.deg2Rad ) * this.cameraDist);
		moveCam[1] += Math.sin( -camNig*Transform.deg2Rad ) * this.cameraDist + 1.8;
		let camPos = vec3.add( vec3.create(), eddyPos, moveCam );
		

		const eddyHead = [...eddyPos];
		eddyHead[1] += 1; //zum kopf verschieben
		const colEddyWall = smartGl.collision().collisionRayModal( new Ray( eddyHead, moveCam ), gLvl.waende, true );
		if ( colEddyWall.collidate ) {
			const eddyWall = colEddyWall.closestPoint- 0.05;
			const eddyCam = vec3.distance(moveCam, eddyHead);
			if ( eddyWall < eddyCam );
				this.reqCameraDist = eddyWall
		}
		else 
			this.reqCameraDist = this.maxCameraDist;
		const scene = smartGl.currentScene();		
		scene.cameras[0].setPosition( camPos[0], camPos[1], camPos[2] ).setRotate( camNig, eddyRot[1]-(this.turnF * deltatime)-180, eddyRot[0] ).updateViewMatrix();
		const audioOrientation = [-moveCam[0],-moveCam[1],-moveCam[2]];
		gAudio.setListener(camPos, audioOrientation );
	}
	camperProtection() {
		if ( !gEnableGame || this.catched === true )
			return;

		let x,z,y;
		[x,z,y] = this.eddyPos;
		const actPos = [x,y];
		const dist = vec2.distance( actPos, this.camperPos );
		if ( dist < 2.0 )
			this.camperNonMovementCounter++;
		else {
			this.camperPos = actPos;
			this.camperNonMovementCounter = 0;
		}
		if( this.camperNonMovementCounter === 0 && this.camperLightUpCooldownStart === 0)
			this.camperLightUpCooldownStart = g_frameTime;
		else if( this.camperNonMovementCounter === 15 ){  // seconds
			if ( this === gEddy )
				showSlideUpMessage("Beweg dich, nicht dass du einschläfst");
		}
		else if( this.camperNonMovementCounter === 22 ){  // seconds
			addSysMessage("","Alarm: Da Schläft einer!");
			if ( this === gEddy )
				showSlideUpMessage("Lauf los, jeder kann dich sehen!");
			this.camperLightUp = true;
			this.camperLightUpCooldownStart = 0;
			this.eddy.setRenderPass(1).setShader(camperProtectionShader);
			this.eddyHandL.setRenderPass(1).setShader(camperProtectionShader);
			this.eddyHandR.setRenderPass(1).setShader(camperProtectionShader);

		}
	}

	doRun(value) {
		if ( value < 0.20 && value > -0.20 )
			value = 0;
		value = value * (1.0/0.80);
		if ( value < 0 )
			value = -value*value;
		else
			value = value*value;
		this.frontF = this.runSpeed * value;
		this.sendPlayerData();
	}
	doRight(value) {
		if ( value < 0.20 && value > -0.20 )
			value = 0;
		value = value * (1.0/0.80);
		if ( value < 0 )
			value = -value*value;
		else
			value = value*value;
			
		this.rightF = this.sideSpeed * -value;
		this.sendPlayerData();
	}
	doTurn(value) {
		if ( value < 0.25 && value > -0.25 )
			value = 0;
		value = value * (1.0/0.80);
		this.turnF = this.turnSpeed * -value;
		this.sendPlayerData();
	}
	doCamNig(value) {
		if (gGamePad) {
			if ( value < 0.05 && value > -0.05 )
				value = 0;
			value = value * (1.0/0.80);
			if ( value < 0 )
				value = -value*value;
			else
				value = value*value;
			this.nigF = this.nigSpeed * value;
		}
		else if ( gGameKeybord ) {
			this.nigF += this.nigSpeed * value/10;
			if ( this.nigF > 1 )
				this.nigF=1;
			else if ( this.nigF < -1 )
				this.nigF=-1;
		}
	}
	doJump() {
		if ( this.onGround === true ) {
			this.gravetyF = 6;
			if ( !this.hide ){
				gAudio.play3DSound("sound/egg_jump"+getRandomIntInclusive(1,3)+".mp3", this.eddyPos);
			}
			this.sendPlayerData();
		}
	}
	doHide() {
		if ( !this.hide && this.hidesAvailable > 0) {
			this.hidesAvailable--;
			this.hideStart = g_frameTime;
			this.hide = true;
			this.sendPlayerData();
		}
	}
}

function jump(controllerID, value) {
	const player = g_players.find( p => p.controllerID == controllerID);
	if ( !player )
		return;
	if ( value )
		player.doJump();
}
function action(controllerID, value) {
	if ( !gEnableGame )
		return;
	const player = g_players.find( p => p.controllerID == controllerID);
	if ( !player )
		return;
 	
	if ( player.seeker ) {
		if ( value )
			player.aktivateToach();
		else
			player.switchOffToach();
	}
	else
		player.doHide();

	player.sendPlayerData();
 }

function sideStep(controllerID, value) {
	if ( !gEnableGame )
		return;
	const player = g_players.find( p => p.controllerID == controllerID);
	if ( !player )
		return;
	player.doRight(value);
}
function run(controllerID, value) {
	if ( !gEnableGame )
		return;
	const player = g_players.find( p => p.controllerID == controllerID);
	if ( !player )
		return;

	player.doRun(value);
}
function turn(controllerID, value) {
	const player = g_players.find( p => p.controllerID == controllerID);
	if ( !player )
		return;
	player.doTurn(value);
}
function camNig(controllerID, value) {
	const player = g_players.find( p => p.controllerID == controllerID);
	if ( !player )
		return;
	player.doCamNig(value);
}