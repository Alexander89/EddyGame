let gShader = null;
let gModels = [];
let gInput = null;
let gCamera = null;
let gGamePad = null;
let gGameKeybord = null;
let gEnableGame = false;
let gEndTime = 0;
let g_players = [];

let smartGl = null;
let gAudio = null;
let lightShader = null;
let camperProtectionShader = null;
let gLvl = null;
let gImgOut = null;

let fpsElement = null;
let timerElement = null;
let batteryElement = null;
let healthElement = null;
let hideElement = null;
let dirLight = null;

let gShadowSize = 1024; 
let gShadowSmooth = 1;

let gEddy = null; 	// gEddy is local played eddy
let gController = 0; 	// 0 == GamePad 
											// 1 == Tastatur
let gSocket = 0;
let gSocketUpdateInterval = 0;


function startWebGl( )
{
	if ( smartGl !== null )
		cleanUpGame();

	smartGl = new SmartGL( loadDone );

	smartGl.lockInit();
	fpsElement =e('fps');
	timerElement =e('timeout');
	batteryElement =e('battery');
	healthElement =e('health');
	hideElement =e('hide');
	
	const scene = smartGl.currentScene();
	scene.disableSelection();
	switch ( gController ) {
	case 0: gGamePad = new GamepadController(); break;
	case 1: gGameKeybord = new KeybordController(); break;
	default: gGamePad = new GamepadController(); break;
	}
	gLvl = new Level(0, e("lvlImg") );


	smartGl.logicCB = logic;
	lightShader = new sGLObjectLightningShader()
	camperProtectionShader = new sGLObjectShader()

	//scene.addLight( new Light(Light.Ambient).setParam({intens:0.1, pos:[-2,5,12]}) );
	dirLight = new Light(Light.Directional).setParam({intens:1.7, specIntens:0.5, pos:[-30,40,-80], direction:[.2,-0.45,0.6]}); 
	dirLight.shadowSize = gShadowSize;
	dirLight.shadowSmooth = gShadowSmooth;
	dirLight.setShadow(true);
	scene.addLight( dirLight );

	
	/*gImgOut = new UI_Image().setPos(0.0,0.8).setSize(0.2,0.2);
	gImgOut2 = new UI_Image().setPos(0.2,0.8).setSize(0.2,0.2);
	gImgOut.setTexture(dirLight.shadowTex);
	scene.addUiElement( gImgOut );
	scene.addUiElement( gImgOut2 );*/
}
function stopGame() {
	smartGl.stop();
	document.exitPointerLock();
	cleanUpGame();
}
function cleanUpGame() {
	smartGl.currentScene().clearScene();
	gShader = null;
	gModels = [];
	gInput = null;
	e("fullscreenMessage").style.display ="none";
	if ( gSocketUpdateInterval )
		clearTimeout(gSocketUpdateInterval);
	gSocketUpdateInterval = 0;
	if ( gGamePad ) 
		gGamePad.disableGamepad();
	gGamePad = undefined;
	if ( gGameKeybord ) 
		gGameKeybord.disableKeybordControll();
	gGameKeybord = undefined;
	gEddy = null;
	gCamera = null;
	gLvl = null;
	gImgOut = null;
	g_players.forEach( p=>{p.hidePlayer(); delete p;} );
	g_players = [];
}
function setupPlayers( players ) {
	players.forEach( p =>{
		const player = new Eddy(p.nr, p.local===1 ? 0:5).setSeeker(p.seek===1).show();
		/*if ( p.seek ) 
			gImgOut2.setTexture(player.toachLight.shadowTex);*/ 
		if ( p.local === 1 ) 
			gEddy = player;	// gEddy is local eddy
		g_players.push( player ) 
	});
	if ( gEddy.seeker ) {
		if ( hideElement )
			hideElement.style.display = "none";
		if ( batteryElement )
			batteryElement.style.display = "inline-block";		
	} 
	else {		
		if ( hideElement )
			hideElement.style.display = "inline-block";
		if ( batteryElement )
			batteryElement.style.display = "none";	
	}
	smartGl.initDone();
}
function updateNetPlayers( playerData ) {
	g_players[playerData.id-1].eddyOverwriteObject = playerData.data;
}
function setNetGameplay( gpData ) {
	if ( gpData.type == "Catched" ) {
		g_players[gpData.nr].catched = true;
		addSysMessage(gpData.name, "ist gefangen worden", gpData.nr);
		if ( g_players[gpData.nr] == gEddy ) {
			gAudio.playSound("sound/egg_ends.mp3");
			e("fullscreenMessage").style.display = "block";
			e("fullscreenMessage").innerHTML = "Du wurdest gefangen.<br/> (warte auf Ergebnis)";
		}
	}	
	else if ( gpData.type == "Died" ) {
		g_players[gpData.nr].died = true;
		addSysMessage(gpData.name, "ist verstorben", gpData.nr);
		if ( g_players[gpData.nr] == gEddy ) {
			gAudio.playSound("sound/egg_ends.mp3");
			e("fullscreenMessage").style.display = "block";
			e("fullscreenMessage").innerHTML = "Du bist gestorben.<br/> (warte auf Ergebnis)";
		}
	}
	else if ( gpData.type == "Left" ) {
		// hier muss noch was mit dem kerl passieren, der einfach davon läuft!!!! rot blau grün zerhackt, was auch immer
		addSysMessage(gpData.name, "hat die Runde verlassen", gpData.nr);
	}	
	else if ( gpData.type == "SeekerWins" ) {
		e("fullscreenMessage").style.display = "block";
		e("fullscreenMessage").innerHTML = "Der Sucher hat gewonnen!<br/> (warte auf Ergebnis)";
	}
	else if ( gpData.type == "PlayerWins" ) {
		e("fullscreenMessage").style.display = "block";
		e("fullscreenMessage").innerHTML = "Der Sucher hat verloren. <br/> (warte auf Ergebnis)";
	}
}
function addSysMessage(name, msg, nr = 0) {
	const msgBox = e("infoMessageBox");
	const entry = document.createElement("div");

	const nameC = document.createElement("span");
	nameC.className = "name msgTextUser"+(nr+1);
	nameC.appendChild( document.createTextNode(name) ); 

	const msgC = document.createElement("span");
	msgC.appendChild( document.createTextNode(msg) ); 

	entry.appendChild(nameC); 
	entry.appendChild(msgC); 
	msgBox.appendChild(entry);
	msgBox.scrollTop = 999999;
}
function showSlideUpMessage(msg) {
	const msgBox = e("ImportantMessage");
	msgBox.className = "";
	msgBox.innerHTML = msg;
	msgBox.style.display = "block";
	window.setTimeout( ()=> msgBox.className = "ImportantMessageSlideUp", 4000 );
}
function setNetResult( resultData ) {
	console.log(resultData)
	e("result").style.display = "block";
	if ( resultData.winner === "Seeker" ) {
		e("theWinner").innerHTML = "Sucher";
		if ( resultData.reason === "Catched" )
			e("resultReason").innerHTML = "Alle gefangen.";
		else if ( resultData.reason === "Died" )
			e("resultReason").innerHTML = "Alle gestorben.";
		else if ( resultData.reason === "Left" )
			e("resultReason").innerHTML = "Die Gesuchten haben das Spiel verlassen.";
	}
	else {		
		e("theWinner").innerHTML = "Die Gesuchten";
		if ( resultData.reason === "Died" )
			e("resultReason").innerHTML = "Der Sucher ist gestorben.";
		else if ( resultData.reason === "Left" )
			e("resultReason").innerHTML = "Der Sucher hat das Spiel verlassen.";
		else if ( resultData.reason === "TimeOver" )
			e("resultReason").innerHTML = "Die Zeit ist abgelaufen.";
	}
	

	e("seekerName").innerHTML = resultData.seeker.name;
	e("seekerHealth").innerHTML = resultData.seeker.health;

	[...(e("resultPlayerContainer").children)].forEach( e=> e.remove() );
	resultData.player.forEach( p=>addPlayerToResult(p) );
}
function addPlayerToResult(player) {
	const playerC = document.createElement("div"); 
	playerC.className = "resultPlayer";

	const nameC = document.createElement("div"); 
	const name1 = document.createElement("span"); 
	name1.appendChild( document.createTextNode("Name:") ); 
	nameC.appendChild(name1); 
	const name2 = document.createElement("span"); 
	let name = player.name;
	if ( player.left )
		name += "(abgehauen)"
	name2.appendChild( document.createTextNode(name) ); 
	nameC.appendChild(name2); 
	playerC.appendChild(nameC);

	if ( player.catched === 1 ){
		const reasonC = document.createElement("div"); 
		const reason1 = document.createElement("span"); 
		reason1.appendChild( document.createTextNode("Gefangen") ); 
		reasonC.appendChild(reason1); 
		playerC.appendChild(reasonC); 

		const catchedAfterC = document.createElement("div"); 
		const catchedAfter1 = document.createElement("span"); 
		catchedAfter1.appendChild( document.createTextNode("nach:") ); 
		catchedAfterC.appendChild(catchedAfter1); 
		const catchedAfter2 = document.createElement("span"); 
		catchedAfter2.appendChild( document.createTextNode( player.catchTime + " Sek") ); 
		catchedAfterC.appendChild(catchedAfter2); 
		playerC.appendChild(catchedAfterC); 

		const healthC = document.createElement("div"); 
		const health1 = document.createElement("span"); 
		health1.appendChild( document.createTextNode("Leben:") ); 
		healthC.appendChild(health1); 
		const health2 = document.createElement("span"); 
		health2.appendChild( document.createTextNode(player.health) ); 
		healthC.appendChild(health2); 
		playerC.appendChild(healthC);  

	}
	else if ( player.died === 1 ){		
		const reasonC = document.createElement("div"); 
		const reason1 = document.createElement("span"); 
		reason1.appendChild( document.createTextNode("Gestorben") ); 
		reasonC.appendChild(reason1); 
		playerC.appendChild(reasonC); 

		const diedAfterC = document.createElement("div"); 
		const diedAfter1 = document.createElement("span"); 
		diedAfter1.appendChild( document.createTextNode("nach:") ); 
		diedAfterC.appendChild(diedAfter1); 
		const diedAfter2 = document.createElement("span"); 
		diedAfter2.appendChild( document.createTextNode( player.diedTime + " Sek") ); 
		diedAfterC.appendChild(diedAfter2); 
		playerC.appendChild(diedAfterC); 
	}
	else {
		const reasonC = document.createElement("div"); 
		const reason1 = document.createElement("span"); 
		reason1.appendChild( document.createTextNode("Nicht erwischt") ); 
		reasonC.appendChild(reason1); 
		playerC.appendChild(reasonC); 
	}
	e("resultPlayerContainer").appendChild(playerC);
}
function setSocket( socket ) {
	gSocket = socket;
	gSocketUpdateInterval = setInterval( ()=>{ gEddy.sendPlayerData(); }, 1000);
}

function loadDone() {
	const scene = smartGl.currentScene();
	scene.setDefaultShader(lightShader);
	gLvl.createLVL();
	checkGameLoadDone();
	smartGl.start();
}
function checkGameLoadDone() {
	const scene = smartGl.currentScene();
	const missingObjects = scene.objects.filter( o => o.isRenderReady() );
	if ( missingObjects == 0 ) {
		g_players.forEach( eddy => eddy.resetValues() );
		gSocket.send("loadGameDone");
	}
	else 
		window.setTimeout( checkGameLoadDone, 500 );
}

function logic( deltaT ) {
	if ( gEddy ) {
		if ( gEddy.seeker ) {
			if ( batteryElement ) 
				batteryElement.style.width = (gEddy.toachPower / gEddy.toachPowerMax * 100)+"%";
		}
		else {
			if ( hideElement ) 
				hideElement.style.width = (gEddy.hidesAvailable / 5 * 100)+"%";
		}

		if ( healthElement )
			healthElement.style.width = (gEddy.health*100/gEddy.healthMax) +"%";
	}
	if ( fpsElement ){
		let fps = fpsElement.innerHTML*1;
		fpsElement.innerHTML = (((fps*7)+ smartGl.fps)/8).toFixed(0);
	}
	if ( timerElement ){
			const left = gEndTime - g_frameTime;
		if ( left < 0 ) 
			timerElement.innerHTML = '0,0';
		else {
			const min = pad(parseInt((left/1000/60)%60),2);
			const sec = pad(parseInt((left/1000)%60),2);
			const ms = pad(parseInt((left)%1000),3);
			if ( min > 0 )
				timerElement.innerHTML = `${min}:${sec},${ms}`;
			else
				timerElement.innerHTML = `${sec},${ms}`;
		}
	}

	gAudio.updateSceneSound();
	
	return smartGl;
}