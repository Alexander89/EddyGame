let socket = null;
let isLoggedIn = false;
let skillXProz = 0;
let skillYProz = 0;

function hideView(name) {
  const elSt = e(name).style;
  elSt.left = "-100vw";
  elSt.visibility = "collapse";
}
function showView(name) {
  const elSt = e(name).style;
  elSt.left = "0px";
  elSt.visibility = "visible";  
}
function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min +1)) + min; 
}

window.addEventListener( "DOMContentLoaded", ev => {
  // Home Screen events
  e("login").addEventListener("click", ()=> { if(e("username").value.length>1 && e("password").value.length>3 ) login();} );
  e("logoff").addEventListener("click", logoff );
  e("start").addEventListener("click", ()=> {if(isLoggedIn) showRoomList(); else bitteAnmelden();} );
  e("mapEditor").addEventListener("click", ()=> {if(isLoggedIn) showMapEditor(); else bitteAnmelden();} );
  e("einstellungen").addEventListener("click", ()=> {if(isLoggedIn) showSettings(); else bitteAnmelden();} );
  e("mail").addEventListener("click", ()=> {if(isLoggedIn) feedback(); else bitteAnmelden();} );
  // Serverauswahl events
  e("freiesSpiel").addEventListener("click", freiesSpiel );
  e("refreshServers").addEventListener("click", refreshServers );
  e("zurueckZuMain").addEventListener("click", zuMain );
  // room events
  e("zurueckZurServerList").addEventListener("click", showRoomList );
  e("lvlChange").addEventListener("click", showMapSelect );
  e("lvlSelectAbbrechen").addEventListener("click", hideMapSelect );
  e("lvlShowData").addEventListener("click", showMapData );
  e("LvlVoteYes").addEventListener("click", voteMapUp );
  e("LvlVoteNo").addEventListener("click", voteMapDown );
  e("lvlInfoLink").addEventListener("click", () => e("lvlinfo").style.display="flex" );
  e("lvlinfo").addEventListener("click", (ev) => { e("lvlinfo").style.display="none"; ev.stopPropagation(); } );
  e("skillSellectField").addEventListener("mouseup", changeSkill );
  e("chatSend").addEventListener("click", sendChatMsg);
  e("chatMsg").addEventListener("keypress", chatInput);
  e("startAsSeeker").addEventListener("click", readySeeker );
  e("startGame").addEventListener("click", ready );
  //Result events
  e("resBackToRoom").addEventListener("click", resBackToRoom );
  e("resBacktoServerList").addEventListener("click", resBackToRoomList );
  e("resHauptmenue").addEventListener("click", resBackToMain );
  //Settings Events
  e("settingsZurueck").addEventListener("click", zuMain );
  e("aufloesung").addEventListener("input", updateAufloesung );
  e("schatten").addEventListener("input", updateSchatten );
  e("schattendetails").addEventListener("input", updateSchattenDetails );
  e("controller").addEventListener("input", updateController );
  //Feedback events
  e("feedbackSend").addEventListener("click", sendFeedback );
  e("feedbackZurueck").addEventListener("click", zuMain );
  //Ingame Menue 
  e("igm_ton").addEventListener("click", igmTon );
  e("igm_contr").addEventListener("click", igmControler );
  e("igm_graph").addEventListener("click", igmGraphic );
  e("igm_leave").addEventListener("click", igmLeave );
  e("igm_weiter").addEventListener("click", igmContinue );
  //Audio Menue
  e("igm_a_mute").addEventListener("change", igmAMute );
  e("igm_a_volume").addEventListener("change", igmAVolume );
  e("igm_a_zuruck").addEventListener("click", igmAZuruck );


  initGame(); 
});
function initGame() {
  gController = localStorage.getItem("controller");
  if( gController==null )
    gController = 1;
  else
    gController = gController*1;
  g_viewportScale = localStorage.getItem("viewport")*1;
  if (g_viewportScale === 0)
    g_viewportScale= 1.0;
  gShadowSize = localStorage.getItem("shadowSize")*1;
  if (gShadowSize === 0)
    gShadowSize= 2048;
  gShadowSmooth = localStorage.getItem("shadowSmooth")*1;
  if (gShadowSmooth === 0)
    gShadowSmooth= 1;

  e("username").value = localStorage.getItem("username");

  skillXProz = localStorage.getItem( "skillX" )*1;
  skillYProz = localStorage.getItem( "skillY" )*1;
  if ( skillXProz == 0 || skillYProz == 0) {
    skillXProz = 0.5;
    skillYProz = 0.5;
  }
  setSkillSellectorPos( skillXProz, skillYProz );
  window.addEventListener("resize", skillFieldResized, false);

  gAudio = new Audio();
  gAudio.mute = localStorage.getItem( "mute" )==="true";
  gAudio.setMainVolume( localStorage.getItem( "volume" )*1 );
  gAudio.preloadSounds(["sound/egg_ends.mp3","sound/egg_walk.mp3","sound/egg_walk1.mp3","sound/egg_walk2.mp3","sound/egg_collect.mp3","sound/egg_jump1.mp3","sound/egg_jump2.mp3","sound/egg_jump3.mp3"]);
  

  initSocket();
}
function initSocket() {
  console.log("initSocket");
  socket = new WebSocket( 'ws://62.75.151.236:17516', 'soap' );
  socket.onopen = function () {
    if ( localStorage.getItem("autologinMD5")==="true" )
      login( localStorage.getItem("password") );    
  };
  socket.onerror = function (error) {console.log('WebSocket Error ' + error);};
  // Log messages from the server 
  let roomUpdateTimer=0;
  let roomUpdateLastScroll=0;
  socket.onmessage = function (msg) {
    if ( roomUpdateTimer )
      window.clearTimeout(roomUpdateTimer);
    //console.log('Menue msg from Server:: ' + msg.data);
    if ( msg.data.startsWith("RoomList:") ) {
      const serverList = JSON.parse( msg.data.slice(9) );
      [...e("serverListe").children].forEach( e=> e.remove() );
      serverList.forEach( svr => addServer(svr) );
      e("serverListe").scrollTop = roomUpdateLastScroll;
      roomUpdateTimer = window.setTimeout( ()=>{ 
        roomUpdateLastScroll = e("serverListe").scrollTop;
        socket.send('getRoomList');
      }, 5000);
    }
    else if ( msg.data.startsWith("Room:") )
      updateRoomData(JSON.parse( msg.data.slice(5) )); 
    else if ( msg.data === "RoomFull") 
      InformAboutClosedRoom(); 
    else if ( msg.data === "Kicked")
      showRoomList();
    else if ( msg.data.startsWith("MapSelect:") )
      setMapSelectContent(JSON.parse( msg.data.slice(10) ));
    else if ( msg.data.startsWith("MapVote:") )
      voteMap(JSON.parse( msg.data.slice(8) ));     
    else if ( msg.data.startsWith("NewMap:") )
      setNewMap(JSON.parse( msg.data.slice(7) ));
    else if ( msg.data.startsWith("Login:") )
      updateLoginData( JSON.parse( msg.data.slice(6) ) );
    else if ( msg.data.startsWith("Players:") )
      updateRoomPlayerlist( JSON.parse( msg.data.slice(8) ) ); 
    else if ( msg.data.startsWith("Stats:") )
      updatePlayersStat( JSON.parse( msg.data.slice(6) ) );
    else if ( msg.data.startsWith("Chat:") )
      updateChatText( JSON.parse( msg.data.slice(5) ) );
    else if ( msg.data.startsWith("StartGame:") ) 
      prepareGame(msg.data);
    else if ( msg.data.startsWith("LOS:") ) {
      const data = JSON.parse( msg.data.slice(4) );
      gEndTime= g_frameTime + data.time;
      showCountDown(3);
      window.setTimeout( ()=>showCountDown(2), 1000 );
      window.setTimeout( ()=>showCountDown(1), 2000 );
      window.setTimeout( enableGamePlay, 3000) ;
      setSkillValues(data.skill);
    }
    else if ( msg.data.startsWith("1MinLeft") ) 
      showSlideUpMessage("Noch 1 Minute");
    else if ( msg.data.startsWith("10SecLeft") ) 
      showSlideUpMessage("Noch 10 Secunden");
    else if ( msg.data.startsWith("TimeOver") )
      showSlideUpMessage("Die Zeit ist Abgelaufen");
    else if ( msg.data.startsWith("P_upd:"))
      updateNetPlayers( JSON.parse( msg.data.slice(6) ) );
    else if ( msg.data.startsWith("GP_upd:"))
      setNetGameplay( JSON.parse( msg.data.slice(7) ) );
    else if ( msg.data.startsWith("GP_result:")){
      e("menueBG").style.display = "block";
      e("game").style.display = "none";
      showResultMenue();
      setNetResult( JSON.parse( msg.data.slice(10) ) );
      stopGame();
    }
    
  };
  socket.onclose = function (e) {
    console.log('Server closed: ' + e);
    window.setTimeout( initSocket, 1000 );
  };
}
function bitteAnmelden() {
  alert("Bitte zuerst mit einem beliebigen Benutzername und Passwort anmelden.");
}
function login( hash ) {
  const username = e("username").value;
  let password;
  if ( hash!== undefined )
    password = hash;
  else
    password = md5( e("password").value );

  localStorage.setItem("username",username);
  localStorage.setItem("password",password);
  localStorage.setItem("autologinMD5",true);
  socket.send(`login/name:${username}/pass:${password}`);  
}
function logoff() {
  localStorage.setItem("username","");
  localStorage.setItem("password","");
  localStorage.setItem("autologinMD5",false);
  socket.send("logoff/"); 
}
function updateLoginData(data) {
  if (data.login == 1) {
    isLoggedIn = true;
    if ( e("room").style.left === "0px" )
      showRoomList();
    if ( e("result").style.left === "0px" )
      zuMain();

    e("usernameFix").innerHTML = data.username;
    e("usernameFix").style.display = "inline-block";
    e("username").style.display = "none";
    e("passwordTitle").style.display = "none";
    e("password").style.display = "none";
    e("login").style.display = "none";
    e("logoff").style.display = "inline-block";
  }
  else {
    isLoggedIn = false;
    e("username").value = "";
    e("password").value = "";
    e("usernameFix").style.display = "none";
    e("username").style.display = "inline-block";
    e("passwordTitle").style.display = "inline-block";
    e("password").style.display = "inline-block";
    e("login").style.display = "inline-block";
    e("logoff").style.display = "none";
  }
}
function readySeeker() {
  socket.send("readySeeker"); 
}
function ready() {
  socket.send("ready"); // buggy wenn ich es nur einmal schicke....
  socket.send("ready");
}
function refreshServers() {
  socket.send('getRoomList');
}
function showCountDown(sec) {
  e("fullscreenMessage").style.display = "block";
  e("fullscreenMessage").innerHTML = "Start in: " + sec;

}
function addServer(svr){
  const serverUL = document.createElement("ul"); 
  serverUL.onclick = function() {accessServer(svr.id)};
  const name = document.createElement("li"); 
  const nameContent = document.createTextNode(svr.name); 
  name.appendChild(nameContent); 
  serverUL.appendChild(name); 
  const con = document.createElement("li"); 
  const conContent = document.createTextNode(svr.con+"/"+svr.room.maxPlayers); 
  con.appendChild(conContent); 
  serverUL.appendChild(con); 
  const lvl = document.createElement("li"); 
  const lvlContent = document.createTextNode(svr.room.name+"_"+svr.room.version); 
  lvl.appendChild(lvlContent); 
  serverUL.appendChild(lvl); 
  const stat = document.createElement("li"); 
  const statContent = document.createTextNode(svr.state); 
  stat.appendChild(statContent); 
  serverUL.appendChild(stat); 
  e("serverListe").appendChild(serverUL);
}
function InformAboutClosedRoom() {
  alert("Der Server ist bereits voll oder im Spiel");
  refreshServers();
}
let g_maxplayers = 0;
function updateRoomData(data) {
  [...e("chatText").children].forEach( e=>e.remove() );
  hideView("serverSelect");
  showView("room");

  e("currentRoom").innerHTML = "Server: "+data.name;
  setNewMap(data.map);
  updateRoomPlayerlist(data.players);
}

function updateRoomPlayerlist(players) {  
  [...e("spielerliste").children].forEach( e=>  e.remove() );
  players.forEach( p=>addPlayer(p) );
  const freeslots = g_maxplayers - players.length;
  for (var i = 0; i < freeslots; i++) 
    addFreeSlot();
}
function addPlayer(p){
  //<div class="spieler"><div>Name:</div><div id="stP0">Fertig</div><br /><div>Erfahrung:</div><div>Repotation</div></div>
  const player = document.createElement("div"); 
  player.className = "spieler";
  const name = document.createElement("div"); 
  const nameContent = document.createTextNode(p.name); 
  name.appendChild(nameContent); 
  player.appendChild(name); 

  const state = document.createElement("div"); 
  const nr = e("spielerliste").children.length;
  state.id = "ps"+nr; 
  let stat;
  if ( p.stat === "Open" )
    stat = "Offen";
  else if ( p.stat === "Ready" )
    stat = "Bereit";
  else if ( p.stat === "Seek" )
    stat = "Sucher";
  const stateContent = document.createTextNode(stat); 
  state.appendChild(stateContent); 
  player.appendChild(state); 

  const br = document.createElement("br"); 
  player.appendChild(br);

  const exp = document.createElement("div"); 
  const expContent = document.createTextNode("Erfahrung: " + p.exp); 
  exp.appendChild(expContent); 
  player.appendChild(exp); 

  const repu = document.createElement("div"); 
  const repuContent = document.createTextNode("Ruf: " + p.rep); 
  repu.appendChild(repuContent); 
  player.appendChild(repu); 

  e("spielerliste").appendChild(player);
}
function addFreeSlot(){
  const slot = document.createElement("div"); 
  slot.className = "spieler"; 
  const spacer = document.createElement("div"); 
  spacer.innerHTML="&nbsp;" 
  slot.appendChild(spacer);

  slot.appendChild(document.createElement("br"));

  const spacer2 = document.createElement("div");
  spacer2.innerHTML="&nbsp;" 
  slot.appendChild(spacer2);
  e("spielerliste").appendChild(slot);
}
function updatePlayersStat(stats) { 
  stats.forEach( s => {
    let stat;
    if ( s.stat === "Open" )
      stat = "Offen";
    else if ( s.stat === "Ready" )
      stat = "Bereit";
    else if ( s.stat === "Seek" )
      stat = "Sucher";
    e("ps"+s.nr).innerHTML = stat 
});
}
function showMapData() {
  e("lvlShowData").style.display = "none";
  e("lvlData").style.maxHeight="150px";
}
function showMapSelect( start = 0 ) {
  if ( typeof start === 'object' )
    start = 0;
  socket.send("getMaps/"+start);
}
function setMapSelectContent(maps) {
  e("LvlSelect").style.display="block";
  e("lvlSelectCount").innerHTML = maps.lenght;
  [...e("LvlSelectContainer").children].forEach( el=>el.remove() );
  maps.forEach( m=>addMapEntry(m, "LvlSelectContainer") );
}
function addMapEntry(map, container, selectField= true) {
  const mapC = document.createElement("div"); 
  mapC.className = "mapContainer";

  const img = document.createElement("img"); 
  img.setAttribute('src',"data:image/gif;base64,"+map.imgDataBase64);
  mapC.appendChild(img); 
  if ( selectField ){
    const select = document.createElement("div"); 
    select.appendChild(document.createTextNode("Wählen")); 
    select.className="button lvlSelectButton";
    select.onclick= ()=>voteForMap(map.id);
    mapC.appendChild(select);   
  }
  const name = document.createElement("div"); 
  name.appendChild(document.createTextNode(`${map.name} (version ${map.version})`)); 
  mapC.appendChild(name); 
  const maxP = document.createElement("div"); 
  maxP.appendChild(document.createTextNode("Max Spieler: " + map.maxPlayers)); 
  mapC.appendChild(maxP);  
  const author = document.createElement("div"); 
  author.appendChild(document.createTextNode("Erstellt von: " + map.creator + " am: " + map.createDate)); 
  mapC.appendChild(author);
  const clear = document.createElement("div"); 
  clear.className = "clear"; 
  mapC.appendChild(clear);

  e(container).appendChild(mapC);
}
function hideMapSelect() {
  e("LvlSelect").style.display="none";
}
voteMapTimeout = 0;
function voteMap(data) {
  e("LvlVote").style.display="block";
  e("lvlVoteOpener").innerHTML = data.name;
  if ( data.impNote !== undefined )
    e("lvlVoteImportantNote").innerHTML = data.impNote;
  else
    e("lvlVoteImportantNote").innerHTML = "";
  [...e("LvlVoteContainer").children].forEach( e=>e.remove() );
  addMapEntry(data.map, "LvlVoteContainer", false);
  voteMapTimeout = window.setTimeout( ()=>{ voteMapTimeout = 0; voteMapUp(); }, 15000 );
}
function setNewMap(map) {
  e("lvlImg").setAttribute('src',"data:image/gif;base64,"+map.imgDataBase64);
  e("lvlName").innerHTML = map.name;
  e("lvlVers").innerHTML = map.version;
  g_maxplayers = map.maxPlayers;
  e("lvlMaxP").innerHTML = g_maxplayers;
  e("lvlAutor").innerHTML = map.creator;
  e("lvlDate").innerHTML = map.createDate;
  e("lvlinfo").innerHTML = map.beschreibung+"<br/><br/>Schließen";
}
function voteMapUp() {
  if ( voteMapTimeout )
    window.clearTimeout(voteMapTimeout);
  voteMapTimeout = 0;
  e("LvlVote").style.display="none";
  socket.send("VoteMapUp");
}
function voteMapDown() {
  if ( voteMapTimeout )
    window.clearTimeout(voteMapTimeout);
  voteMapTimeout = 0;
  e("LvlVote").style.display="none";
  socket.send("VoteMapDown");
}
function voteForMap(id) {
  socket.send("MapSuggestion/"+id);
  hideMapSelect();
}
function changeSkill(ev) {
  ev = ev || window.event;

  let x = ev.offsetX;
  let y = ev.offsetY;
  if ( ev.srcElement == e("skillSellector") ){
    x += e("skillSellectField").style.paddingLeft.replace("px","")*1-10;
    y += e("skillSellectField").style.paddingTop.replace("px","")*1-10;
  }

  skillXProz = x / e("skillSellectField").clientWidth;
  skillYProz = y / e("skillSellectField").clientHeight;
  localStorage.setItem( "skillX", skillXProz );
  localStorage.setItem( "skillY", skillYProz );
  setSkillSellectorPos( skillXProz, skillYProz );

}
function skillFieldResized(el, rect) {
  setSkillSellectorPos( skillXProz, skillYProz );
}
function setSkillSellectorPos( prozX, prozY ) {
  const x = prozX * e("skillSellectField").clientWidth;
  const y = prozY * e("skillSellectField").clientHeight;
  e("skillSellectField").style.paddingLeft= x+"px";
  e("skillSellectField").style.paddingTop= y+"px";
}
function makeSkillValues(){
  const skills = [ 
    {field:"lightUnloading",  min:0.10, max:0.03, x:0.315, y:0.135},
    {field:"turnSpeed",       min:60,   max:120,  x:0.683, y:0.135},
    {field:"runSpeed",        min:3.0,  max:4.2,  x:0.860, y:0.5},
    {field:"healthMax",       min:60,   max:150,  x:0.683, y:0.865},
    {field:"toachMaxInt",     min:1.2,  max:4.5,  x:0.315, y:0.865},
    {field:"hideDuration",    min:3500, max:7500, x:0.135, y:0.5}
  ];
  return skills.map( e => {
    const dx = e.x - skillXProz;
    const dy = e.y - skillYProz;
    const value = 1-(Math.sqrt(dx*dx+ dy*dy)/0.75); // procent of this value
    return {prop:e.field, value:(e.max-e.min)*value + e.min};
  } );
}
function setSkillValues(data) {
  g_players.forEach( p => {
    p.setPos( gLvl.getStartPos(data[p.playerID].startPos) );
    data[p.playerID].data.forEach( data => p[data.prop] = data.value )
  });
}
function chatInput(ev) {
  ev = ev || window.event;
  if ( ev.key == "Enter" ) {
    sendChatMsg();
    event.preventDefault();
  }
}
function sendChatMsg() {
  const input = e("chatMsg");
  const msg = input.value;
  socket.send("chat/"+msg);
  input.value = "";
}
function updateChatText( {id, user, msg} ) {
  if ( e("game").style.display === "block" ) {
    addSysMessage( user, msg, id );
    return;
  }
  const container = e("chatText");
  const message = document.createElement("div");
  message.className = "msgText";
  const name = document.createElement("span");
  name.className = "msgTextUser"+id;
  const nameContent = document.createTextNode( user + ":" );
  name.appendChild(nameContent);
  message.appendChild(name);
  const m = document.createElement("span");
  const mContent = document.createTextNode(msg);
  m.appendChild(mContent);
  message.appendChild(m);
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
}

function showRoomList() {
  hideView("menue");
  showView("serverSelect");
  hideView("room");
  hideView("result");
  refreshServers();
}
function showMapEditor() {
  location.assign("editor.html");
}
function resBackToRoom() {
  socket.send("leftResult");
  e("body").className ="";
  hideView("result");
  showView("room");
}
function resBackToRoomList() {
  socket.send("leftResult");
  e("body").className ="";
  showRoomList();
}
function prepareGame(data) {
  e("menueBG").style.display = "none";
  e("game").style.display = "block";
  [...e("infoMessageBox").children].forEach( e=>e.remove() );
  setSocket( socket );
  disableGamePlay();
  startWebGl();  
  setupPlayers( JSON.parse( data.slice(10) ) );
  socket.send("skillValues/"+JSON.stringify(makeSkillValues()));
}
function enableGamePlay() {
  e("fullscreenMessage").style.display = "none";
  gEnableGame = true;
}
function disableGamePlay() {
  gEnableGame = false;
}
function resBackToMain() {
  socket.send("leftResult");
  e("body").className ="";
  zuMain();
}
function showResultMenue() {
  showView("result");
  hideView("room");
  e("body").className = "bodyResult";
}
function freiesSpiel() {  
  e("menueBG").style.display = "none";
  e("game").style.display = "block";
  startWebGl(); 
}
function accessServer(nr) {
  socket.send('getRoom/'+nr);
}

function showSettings() {
  hideView("menue");
  showView("settings");

  e("aufloesung").value = g_viewportScale;
  updateAufloesung();

  e("schatten").value = schattensizeToIdx(gShadowSize);
  updateSchatten();
  
  e("schattendetails").value = gShadowSmooth;
  updateSchattenDetails();

  e("controller").selectedIndex = gController;
}
function feedback() {
  hideView("menue");
  showView("feedback");
}
function sendFeedback() {
  socket.send("Feedback/"+e("feedbackText").value);
  e("feedbackText").value = "";
  hideView("feedback");
  showView("menue");
}
function zuMain() {
  showView("menue");
  hideView("serverSelect");
  hideView("settings");
  hideView("feedback");
  hideView("result");
}

function updateAufloesung() {
  g_viewportScale = e("aufloesung").value * 1;
  localStorage.setItem("viewport",g_viewportScale);
  const width = (window.innerWidth -2) * g_viewportScale;
  const height = (window.innerHeight -5) * g_viewportScale;
  e("width").innerHTML = width.toFixed(0);
  e("height").innerHTML = height.toFixed(0);
}
function schattensizeToIdx( value ) {
  switch ( parseInt(value) ) {
    case 512: return 0;
    case 1024: return 1;
    case 2048: return 2;
    case 4096: return 3;
  }
}
function idxToSchattensize( idx ) {
  switch (  parseInt(idx) ) {
    case 0: return 512;
    case 1: return 1024;
    case 2: return 2048;
    case 3: return 4096;
  }
}
function updateSchatten() {
  gShadowSize = idxToSchattensize( e("schatten").value ) ;
  localStorage.setItem("shadowSize", gShadowSize);
  switch ( gShadowSize ) {
    case 512: e("shadowValue").innerHTML = "Hart"; break;
    case 1024: e("shadowValue").innerHTML = "Normal"; break;
    case 2048: e("shadowValue").innerHTML = "Weich"; break;
    case 4096: e("shadowValue").innerHTML = "Sehr Fein"; break;
  }
}
function updateSchattenDetails() {
  gShadowSmooth = e("schattendetails").value * 1;
  localStorage.setItem("shadowSmooth", gShadowSmooth);
  switch ( gShadowSmooth ) {
    case 0: e("shadowDetailsValue").innerHTML = "Gering"; break;
    case 1: e("shadowDetailsValue").innerHTML = "Normal"; break;
    case 2: e("shadowDetailsValue").innerHTML = "Fein"; break;
  }
}
function updateController() {
  gController = e("controller").selectedIndex * 1;
  localStorage.setItem("controller", gController);
}
let menueCursor = 0;
let currentMenue = null;
inGameMenueVisible = false;
const inGameMenueMain=[
    {el:"igm_ton" },
    {el:"igm_contr" },
    {el:"igm_graph" },
    {el:"igm_leave" },
    {el:"igm_weiter" } 
  ];
const inGameMenueAudio=[
    {el:"igm_a_mute",   sel:()=>e("mute").checked = !e("mute").checked,   less:()=>e("mute").checked=true, more:()=>e("mute").checked=false },
    {el:"igm_a_volume", less:()=>{e("volume").value-=0.1; igmAVolume()}, more:()=>{e("volume").value-= -0.1; igmAVolume()} },
    {el:"igm_a_zuruck" } 
  ];
function heightlightMenue() {
  currentMenue.forEach( (el,idx)=>{
    if ( idx === menueCursor)
      e(el.el).classList.add("selected");
    else
      e(el.el).classList.remove("selected");
  } );
}
function menue() {
  if ( e("inGameMenue").style.display==="block" ){
    e("inGameMenue").style.display="none";
    inGameMenueVisible = false;
  }
  else if ( e("inGameMenueAudio").style.display==="block" )
    e("inGameMenueAudio").style.display="none";
  else {
    if ( gGamePad !== undefined) {
      menueCursor = 0;
      currentMenue = inGameMenueMain;
      inGameMenueVisible = true;
      heightlightMenue();
    }
    e("inGameMenue").style.display="block"; 
  }
}
function menueSelect() {
  if ( !inGameMenueVisible )
    return;
  if ( currentMenue[menueCursor].sel !== undefined )
    currentMenue[menueCursor].sel();
  else
    e(currentMenue[menueCursor].el).dispatchEvent(new Event('click'));
}
function menueReturn() {
  if ( !inGameMenueVisible )
    return;
  if ( e("inGameMenue").style.display==="block" )
    e("inGameMenue").style.display="none";
  else if ( e("inGameMenueAudio").style.display==="block" ){
    e("inGameMenueAudio").style.display="none";
    e("inGameMenue").style.display="block"; 
    menueCursor = 0;
    currentMenue = inGameMenueMain;
    heightlightMenue();
  }
}
function menueUp() {
  if ( !inGameMenueVisible )
    return;
  menueCursor--;
  if ( menueCursor < 0 )
    menueCursor = currentMenue.length -1;
  heightlightMenue();
}
function menueDown() {
  if ( !inGameMenueVisible )
    return;
  menueCursor++;
  if ( menueCursor == currentMenue.length )
    menueCursor = 0;
  heightlightMenue();
}
function menueLess() {
  if ( !inGameMenueVisible || currentMenue[menueCursor].less === undefined )
    return;
  currentMenue[menueCursor].less();
}
function menueMore() {
  if ( !inGameMenueVisible || currentMenue[menueCursor].more === undefined )
    return;
  currentMenue[menueCursor].more();
}


function igmTon() {
  e("inGameMenue").style.display = "none";
  e("inGameMenueAudio").style.display = "block";
  menueCursor = 0;
  currentMenue = inGameMenueAudio;
  heightlightMenue();
}
function igmControler() {
}
function igmGraphic() {
}
function igmLeave() {
  socket.send('getRoomList');
  stopGame();
  hideView("room");
  e("game").style.display = "none";
  e("menueBG").style.display = "block";
  showView("menue");
}
function igmContinue() {
  e("inGameMenue").style.display="none"; 
  inGameMenueVisible = false;
}

function igmAMute() {
  gAudio.mute = e("mute").checked;
  localStorage.setItem( "mute", e("mute").checked );
}
function igmAVolume() {
  gAudio.setMainVolume( e("volume").value*1 );
  localStorage.setItem( "volume", e("volume").value*1 );
}
function igmAZuruck() {
  e("inGameMenueAudio").style.display = "none";
  menue();
}