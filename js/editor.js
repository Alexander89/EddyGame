'use strict'


const gAssetWidth = 149;
const gTextlSize = 12;
const IM_KOMPLETT = 0;
const IM_HEIGHT = 1;
const IM_TYPE = 2;
const IM_SPEZIAL = 3;
let gImgMode = IM_KOMPLETT;
const gUsername = localStorage.getItem("username");
const gPassword = localStorage.getItem("password");
let gIsLoggedIn = false;
let gSocket = null;

let gSelectedAsset = 0;
let gAssets = [ // später über socket oder fetch beziehen
  {name: "Battery", thumpnail:"/img/newMap.png", d3Obj: "/obj/battery.obj", tex: "/obj/batery.png", update:{rot:[0,0,0]}, contakt:{health:-10}, light:[] },
  {name: "Auge", thumpnail:"/img/lava.jpg", d3Obj: "/obj/eye.obj", tex: "/obj/eye.png", update:{rot:[0,180,0]}, contakt:{health:-10}, light:[] },
  {name: "Speed", thumpnail:"/img/mud.jpg", d3Obj: "/obj/speed.obj", tex: "/obj/speed.png", update:{rot:[360,0,0]}, contakt:{health:-10}, light:[{type: "Point", pos:[0,2.5,0], color:[0.4,0.8,0.8], instens: 2.0}] }
];
window.setTimeout(createAssetList, 2000); 
window.addEventListener( "DOMContentLoaded", ev => {
  g_viewportScale = localStorage.getItem("viewport")*1;
  if (g_viewportScale === 0)
    g_viewportScale= 1.0;
  gShadowSize = localStorage.getItem("shadowSize")*1;
  if (gShadowSize === 0)
    gShadowSize= 2048;
  gShadowSmooth = localStorage.getItem("shadowSmooth")*1;
  if (gShadowSmooth === 0)
    gShadowSmooth= 1;

  if (localStorage.getItem("autologinMD5")!=="true"){
    location.assign("index.html");
    return;
  }
  e("makeMapButton").addEventListener("click", createNewMap);
  e("loadMapButton").addEventListener("click", ()=>gSocket.send("getMaps/0"));

  e("pixMap").addEventListener("mousedown", pixMapMouseDown );
  e("pixMap").addEventListener("mousemove", pixMapMouseMove );
  e("pixMap").addEventListener("mouseup", pixMapMouseUp );
  e("pixMap").addEventListener("dblclick", pixMapMouseDplClick );

  e("c3DView").addEventListener("mousedown", c3DMouseDown );
  e("c3DView").addEventListener("mouseup", c3DMouseUp );
  e("c3DView").addEventListener("dblclick", c3DMouseDplClick );

  e("widhtRange").addEventListener("input", widthChanged );
  e("lengthRange").addEventListener("input", lengthChanged );
  e("fieldsizeRange").addEventListener("input", fieldsizeChanged );
  e("sunangle").addEventListener("input", sunangleChanged );
  e("sundirection").addEventListener("input", sundirectionChanged );

  e("heightRange").addEventListener("input", heightChanged );
  e("fieldType").addEventListener("input", fieldTypeChanged );
  e("spezialField").addEventListener("input", spezialFieldChanged );

  hideBlock("fieldSettings");
  hideBlock("mapSettings");

  initSocket();
});

function login( ) {
  gSocket.send(`login/name:${gUsername}/pass:${gPassword}`);  
}

function initSocket() {
  console.log("initSocket");
  gSocket = new WebSocket( 'ws://62.75.151.236:17516', 'soap' );
  gSocket.onopen = function () {
    if ( localStorage.getItem("autologinMD5")==="true" )
      login( localStorage.getItem("password") );    
  };
  gSocket.onmessage = function (msg) {
    console.log('editor msg from Server: ' + msg.data);
    if ( msg.data.startsWith("Login:") ){
      setLoginData( JSON.parse( msg.data.slice(6) ) );
      gSocket.send("getMaps/0");
    }
    else if ( msg.data.startsWith("MapSelect:") )
      setMapLoadContent(JSON.parse( msg.data.slice(10) ));
  };
  gSocket.onclose = function (e) {
    console.log('Server closed: ' + e);
    window.setTimeout( initSocket, 1000 );
  };
}

function setLoginData(data) {
  if (data.login == 1) {
    gIsLoggedIn = true;
  }
  else {
    gIsLoggedIn = false;
    location.assign("index.html");
  }
}

function openPopup(popupName) {
  e('overlay').style.height = document.body.scrollHeight + 'px';
  e('overlay').classList.add('visible');
  switch (popupName) {
    case 'load': showBlock('loadingOverlayContent'); break;
    case 'save': showBlock('savingOverlayContent'); break;
    default: break;
  }
}
function closePopup() {
  e('overlay').classList.remove('visible');
  [...document.getElementsByClassName('overlayContent')].forEach( ovC=>{
    ovC.style.display = "none";
    [...ovC.getElementsByTagName('input')].forEach( el=>el.value="" );
  });        
}

function createAssetList(data) {
  if ( data !== undefined )
    gAssets = data;
  
  gAssets.forEach( (asset,idx) => {

  });
}
function scrollAssetLeft() {
  const assetScrollPanel = document.getElementsByClassName('assetScrollPanel')[0];
  const maxScroll = document.getElementsByClassName('assetItemWrapper').length * gAssetWidth;
  const assetScrollPanelLeftInt = assetScrollPanel.style.left.substring(0, assetScrollPanel.style.left.length - 2);
  const newLeftValue = (assetScrollPanelLeftInt - gAssetWidth);
  if (newLeftValue > maxScroll * -1) 
    assetScrollPanel.style.left = newLeftValue + "px";      
}
function scrollAssetsRight() {
  const assetScrollPanel = document.getElementsByClassName('assetScrollPanel')[0];
  const assetScrollPanelLeftInt = parseInt(assetScrollPanel.style.left.substring(0, assetScrollPanel.style.left.length - 2));
  if (assetScrollPanelLeftInt != 0) 
    assetScrollPanel.style.left = (assetScrollPanelLeftInt + gAssetWidth) + "px";      
}
function toogleAsset(nr) {

}

function showRangeValue(element) {
  if(element.getAttribute("id") == "sunangle") {
    const selection = element.value;
    const selectedMinutes = (6*60+selection*15);
    let hours   = Math.floor(selectedMinutes / 60);
    let minutes = Math.floor((selectedMinutes - (hours * 60)));
    if (hours < 10) 
      hours = "0"+hours;        
    if (minutes < 10) 
      minutes = "0"+minutes;        
    element.parentElement.getElementsByTagName('span')[0].innerHTML = hours +":"+ minutes;
  } 
  else 
    element.parentElement.getElementsByTagName('span')[0].innerHTML = element.value;
}

function setMapLoadContent(maps) {
  openPopup('load');
  let skip = true;
  [...e("mapLoadContrainer").children].forEach( el=>{if (!skip) el.remove(); skip = false;} );
  maps.forEach( m=>addMapEntry(m, "mapLoadContrainer") );
}
function addMapEntry(map, container) {
  const mapC = document.createElement("div"); 
  mapC.className = "mapItem";
  mapC.onclick=()=>selectMapToLoad( mapC, map.id );

  const img = document.createElement("img"); 
  img.className = "mapImage";
  img.setAttribute('id', "loadImage" + map.id);
  img.setAttribute('src',"data:image/gif;base64,"+map.imgDataBase64);
  mapC.appendChild(img); 
  const mapInfo = document.createElement("div"); 
  mapInfo.className = "mapInfo";
  {
    const mapname = document.createElement("h2");
    mapname.appendChild(document.createTextNode(map.name));  
    mapInfo.appendChild(mapname); 
    const mapDate = document.createElement("span");
    mapDate.appendChild(document.createTextNode("Datum: "+map.createDate));  
    mapInfo.appendChild(mapDate);  
    const mapVersion = document.createElement("span");
    mapVersion.appendChild(document.createTextNode("Version: "+map.version));  
    mapInfo.appendChild(mapVersion); 
  }
  mapC.appendChild(mapInfo); 
  

  e(container).appendChild(mapC);
}

let selectedMapID = -1;
function selectNewMap(element) {
  selectMapToLoad(element,-1);
  e("loadButton").innerHTML = "Erstellen";
}
function selectMapToLoad(element, mapID) {
  e("loadButton").innerHTML = "Laden";
  [...document.getElementsByClassName('selectedMap')].forEach( el=>el.classList.remove('selectedMap') );
  element.classList.add('selectedMap');
  selectedMapID = mapID;
}
function loadMap() {
  if ( selectedMapID === -1 )
    createNewMap();
  else {
    loadImgToCanvas("loadImage" + selectedMapID);
    komplett();
    // load map to bg canvas
  }
  closePopup();
  c2DDraw();
  // render canvis
  // start preview
}
function createNewMap() {
  // create empty map
  createEmptyMap();
  allgemein();
  c2DDraw();
}

function showBlock(blockName) {
  // set Block to flex
  e(blockName).style.display = "flex";
}
function showItemBlock(blockName) {
  // set Block to flex
  e(blockName).style.display = "block";
}
function hideBlock(blockName) {
  // set Block to flex
  e(blockName).style.display = "none";
}

function komplett() {
  gImgMode = IM_KOMPLETT;
  hideBlock("mapSettings");
  showBlock("fieldSettings");
  showBlock("settingHeight");
  showBlock("settingType");
  showBlock("settingSpezial"); 
}
function height() {
  gImgMode = IM_HEIGHT;
  hideBlock("mapSettings");
  showBlock("fieldSettings");
  showBlock("settingHeight");
  hideBlock("settingType");
  hideBlock("settingSpezial");  
}
function type() {
  gImgMode = IM_TYPE;
  hideBlock("mapSettings");
  showBlock("fieldSettings");
  hideBlock("settingHeight");
  showBlock("settingType");
  hideBlock("settingSpezial");
}
function spezial() {
  gImgMode = IM_SPEZIAL;
  hideBlock("mapSettings");
  showBlock("fieldSettings");
  hideBlock("settingHeight");
  hideBlock("settingType");
  showBlock("settingSpezial");
}
function allgemein() {
  gImgMode = IM_KOMPLETT;
  hideBlock("fieldSettings");
  showBlock("mapSettings");
}

function widthChanged(ev) {
  const resize = e("widhtRange").value - e("rawDataMap").width;
  resizeCanvas(resize, 0);
}
function lengthChanged(ev) {
  const resize = e("lengthRange").value - e("rawDataMap").height;
  resizeCanvas(0, resize);
}
function fieldsizeChanged(ev) {
  glvlFieldSize = e("fieldsizeRange").value*1;
  updateLVL();
}
function sunangleChanged(ev) {

}
function sundirectionChanged(ev) {

}
function heightChanged(ev) {
  setPixelHeight( parseInt(e("heightRange").value)+80 );

  updateLVL();
}
function fieldTypeChanged(ev) {
  switch( e("fieldType").value ) {
    case "Gras": setPixelType(0); break;
    case "Schlamm": setPixelType(50); break;
    case "Lava": setPixelType(80); break;
    case "Leben": setPixelType(120); break;
    case "Booster": setPixelType(130); break;
    case "Unsichtbar": setPixelType(140); break;
    case "Battery": setPixelType(150); break;
  }
  updateLVL();
}
function spezialFieldChanged(ev) {
  if ( e("spezialField").value.startsWith("Start Spieler") ){
    setPixelSpezial( 100 );
  }
  updateLVL();
}


function applySettingsFrom(x,y) {  
  const ctx = e("rawDataMap").getContext('2d');
  const pixData = ctx.getImageData(x, y, 1, 1).data;
  e("heightRange").value = pixData[0]-80;
  showRangeValue(e("heightRange"));

  switch( pixData[1] ) {
    case 0: e("fieldType").value = "Gras"; break;
    case 50: e("fieldType").value = "Schlamm"; break;
    case 80: e("fieldType").value = "Lava"; break;
    case 120: e("fieldType").value = "Leben"; break;
    case 130: e("fieldType").value = "Booster"; break;
    case 140: e("fieldType").value = "Unsichtbar"; break;
    case 150: e("fieldType").value = "Battery"; break;
  }

  if ( pixData[2] >= 100 ) {
    e("spezialField").value = "Start Spieler " + pixData[2] - 99;
  }
}


//// input
let gSelectedFields = [];
let gMouseDown2D = false;
let gRectMode = false;
let gRectModeStart = {x:0,y:0};
let gRectModeEnd = {x:0,y:0};
let gRemoveMode = false;
/////// pix Map
function texelValid(x,y) {
  const canvas = e("rawDataMap");
  return ( x !== 0 && x < canvas.width-1 && y !== 0 && y < canvas.height-1 );
}
function pixMapMouseDown(ev) {
  ev = ev || window.event;

  if( e("mapSettings").style.display !== "none" )
    komplett();
  // rechts klick stoppt die Rectauswahl
  if ( gMouseDown2D && gRectMode && ev.which === 3) {
    gRectMode = false;
    gRectModeStart = {x:0,y:0};
    gRectModeEnd = {x:0,y:0};
    gMouseDown2D = false;
    return;
  }

  // is Ctrl down, no clear (continue)
  if ( !ev.ctrlKey && !ev.shiftKey)
    gSelectedFields = [];

  // is shift down, remove mode (wipe mode)
  gRemoveMode = ev.shiftKey;

  // is Alt down, start RectMode
  gRectMode = ev.altKey;
  const x = parseInt(ev.offsetX/gTextlSize);
  const y = parseInt(ev.offsetY/gTextlSize);

  if (texelValid( x, y )){
    if ( gRectMode ){
      gRectModeStart = {x,y};
      gRectModeEnd = {x,y};
    }
    else
      modifyPixelWithMouse(x,y)

    gMouseDown2D = true;
    applySettingsFrom(x,y);
  }
}
function pixMapMouseMove(ev) {
  if ( !gMouseDown2D )
    return;
  ev = ev || window.event;
  const x = parseInt(ev.offsetX/gTextlSize);
  const y = parseInt(ev.offsetY/gTextlSize);
  if ( !texelValid( x, y ) )
    return;

  if ( gRectMode ) 
    gRectModeEnd={x,y};  
  else 
    modifyPixelWithMouse(x,y);
}
function pixMapMouseUp(ev) { 
  if ( gRectMode ) {
    const startX = Math.min(gRectModeStart.x, gRectModeEnd.x);
    const endX   = Math.max(gRectModeStart.x, gRectModeEnd.x);
    const startY = Math.min(gRectModeStart.y, gRectModeEnd.y);
    const endY   = Math.max(gRectModeStart.y, gRectModeEnd.y);
    for (var x = startX; x <= endX; x++)
      for (var y = startY; y <= endY; y++)
        modifyPixelWithMouse(x,y);
    gRectMode = false;
    gRectModeStart = {x:0,y:0}; 
    gRectModeEnd = {x:0,y:0};

  }
  gMouseDown2D = false;
  createSelectIcons();
}
function pixMapMouseDplClick(ev) {
  gMouseDown2D = false;
  ev = ev || window.event;
  const x = parseInt(ev.offsetX/gTextlSize);
  const y = parseInt(ev.offsetY/gTextlSize);
  if ( !texelValid( x, y ) )
    return;

  // is Ctrl down, no clear (continue)
  if ( !ev.ctrlKey && !ev.shiftKey)
    gSelectedFields = [];

  // is shift down, remove mode (wipe mode)
  gRemoveMode = ev.shiftKey;

  const canvas = createPathSelectCanvas();

  if ( ev.ctrlKey )  
    pathSelect( canvas, x, y );  
  else {
    const ctx = canvas.getContext('2d');
    const sel = ctx.getImageData(x,y,1,1).data;
    for (let y = 0; y < canvas.height; y++) {
      const lData = ctx.getImageData(1,y,canvas.width -2 ,1).data;
      for (let x = 0; x < lData.length; x+=4) 
        if( lData[x] === sel[0] && lData[x+1] === sel[1] && lData[x+2] === sel[2] )
          modifyPixelWithMouse((x/4+1), y);
    }
  }
  createSelectIcons();
}
function pathSelect( canvas, x, y ) {
  const ctx = e("rawDataMap").getContext('2d');
  const sel = ctx.getImageData(x,y,1,1).data;
  checkNeighbour( sel, ctx, x+1, y);
  checkNeighbour( sel, ctx, x-1, y);
  checkNeighbour( sel, ctx, x, y+1);
  checkNeighbour( sel, ctx, x, y-1);
}
function checkNeighbour(sel, ctx, x,y) {
  //if ( !texelValid( x, y ) ) return; Nicht nötig, da solche werte nicht gesetzt werden können
  const pixel = ctx.getImageData(x,y,1,1).data;
  if( pixel[0] === sel[0] && pixel[1] === sel[1] && pixel[2] === sel[2] ) {
    if ( !advancedModifyPixelWithMouse(x,y) )
      return;
    checkNeighbour( sel, ctx, x+1, y);
    checkNeighbour( sel, ctx, x-1, y);
    checkNeighbour( sel, ctx, x, y+1);
    checkNeighbour( sel, ctx, x, y-1);
  }
}
function createPathSelectCanvas() {
  const rawCanvas = e("rawDataMap");
  const canvas = document.createElement('canvas');
  canvas.width = rawCanvas.width;
  canvas.height = rawCanvas.height;    
  const ctx = canvas.getContext('2d');
  ctx.drawImage( rawCanvas, 0, 0, canvas.width, canvas.height);
  convertCanvis(canvas);
  return canvas;
}

function modifyPixelWithMouse(x,y) {
  if ( gRemoveMode )
    gSelectedFields = gSelectedFields.filter( el=>(el.x !== x || el.y !== y) );
  else if ( !gSelectedFields.some( el=> el.x === x && el.y === y) )
    gSelectedFields.push({x,y});
}
function advancedModifyPixelWithMouse(x,y) {
  if ( gRemoveMode ) {
     if ( gSelectedFields.some( el=> el.x === x && el.y === y) )
       gSelectedFields = gSelectedFields.filter( el=>(el.x !== x || el.y !== y) );
    else
      return false;
  }
  else{
    if ( !gSelectedFields.some( el=> el.x === x && el.y === y) )
      gSelectedFields.push({x,y});
    else
      return false;
  }
  return true;
}

//// RawCanvis Zeugs
let glvlFieldSize = 3;
function loadImgToCanvas(imgID) {
  const img = e(imgID);
  const canvas = e("rawDataMap");
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage( img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height );
  
  c3Drecreate();
}
function resizeCanvas( x,y ) {
  gSelectedFields = [];
  const canvas = e("rawDataMap");
  const ctx = canvas.getContext('2d');

  let cutX = canvas.width;
  let cutY = canvas.height;
  if ( x < 0 ) 
    cutX = canvas.width + (Math.min(x,-1)-1);
  else if ( x > 0 ) 
    cutX = canvas.width - 1;
  if ( y < 0 ) 
    cutY = canvas.height + (Math.min(y,-1)-1);
  else if ( y > 0 ) 
    cutY = canvas.height - 1;
  const imgData = [];
  for (let i = 0; i < cutY; i++) 
    imgData.push( ctx.getImageData(0, i, cutX, 1) );
  canvas.width += x;
  canvas.height += y;
  ctx.fillStyle = "#500000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  createBorder();

  for (let i = 0; i < cutY; i++) 
    ctx.putImageData(imgData[i], 0, i);

  c3Drecreate();
}

function createEmptyMap() {
  const canvas = e("rawDataMap");
  canvas.width = e("widhtRange").value;
  canvas.height = e("lengthRange").value;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; 
  ctx.mozImageSmoothingEnabled = false; 
  ctx.webkitImageSmoothingEnabled = false;
  ctx.fillStyle = "#500000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  createBorder();
  c3Drecreate();
}
function createBorder() {
  const canvas = e("rawDataMap");

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(1,1);
  ctx.imageSmoothingEnabled = false; 
  ctx.mozImageSmoothingEnabled = false; 
  ctx.webkitImageSmoothingEnabled = false;

  imageData.data[0] = 255;
  imageData.data[1] = 0;
  imageData.data[2] = 0;
  imageData.data[3] = 255;
  for (let i = 0; i < canvas.width; i++){
    ctx.putImageData(imageData, i, 0);
    ctx.putImageData(imageData, i, canvas.height-1);
  }
  for (let i = 1; i < canvas.height-1; i++){
    ctx.putImageData(imageData, 0, i);
    ctx.putImageData(imageData, canvas.width-1, i);
  }
}
function setPixelHeight(newHeight) {
  const canvas = e("rawDataMap");
  const ctx = canvas.getContext('2d');

  gSelectedFields.forEach( ({x,y})=> {
    const imageData = ctx.getImageData(x, y, 1, 1);
    imageData.data[0] = newHeight; // rot kanal für höhe editieren, den rest so belassen
    ctx.putImageData(imageData, x, y);
  });
}
function setPixelType(newType) {
  const canvas = e("rawDataMap");
  const ctx = canvas.getContext('2d');

  gSelectedFields.forEach( ({x,y})=> {
    const imageData = ctx.getImageData(x, y, 1, 1);
    imageData.data[1] = newType; // rot kanal für höhe editieren, den rest so belassen
    ctx.putImageData(imageData, x, y);
  });
}
//// 2D Zeugs
function c2DDraw( time ) {   
  c2Dpaint();
  c2DSelection();
  window.setTimeout( ()=>window.requestAnimationFrame(c2DDraw), 80);
}

function c2Dpaint() {
  const rawCanvas = e("rawDataMap");
  const editCanvas = e("pixMap");
  editCanvas.width  = rawCanvas.width * gTextlSize;
  editCanvas.height = rawCanvas.height* gTextlSize;
  const editCtx = editCanvas.getContext("2d");
  editCtx.imageSmoothingEnabled = false;
  editCtx.drawImage( rawCanvas, 0, 0, rawCanvas.width, rawCanvas.height, 0, 0, editCanvas.width, editCanvas.height);
  convertCanvis(editCanvas);  
}
function convertCanvis(canvas) {
  const ctx = canvas.getContext("2d");
  let imageData = null;
  switch( gImgMode ) {
    case IM_HEIGHT:
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < imageData.data.length; i+=4) {
        imageData.data[i+1] = imageData.data[i];
        imageData.data[i+2] = imageData.data[i];
      }
      ctx.putImageData(imageData, 0,0);
    break;
    case IM_TYPE:
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < imageData.data.length; i+=4) {
        imageData.data[i]   = imageData.data[i+1];
        imageData.data[i+2] = imageData.data[i+1];
      }
      ctx.putImageData(imageData, 0,0);
    break;
    case IM_SPEZIAL:
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < imageData.data.length; i+=4) {
        imageData.data[i]   = imageData.data[i+2];
        imageData.data[i+1] = imageData.data[i+2];
      }
      ctx.putImageData(imageData, 0,0);
    break;
    default:
    break;
  }  
}
function c2DSelection() {
  const editCtx = e("pixMap").getContext("2d");
  editCtx.strokeStyle="#005555";
  editCtx.beginPath();

  gSelectedFields.forEach( ({x,y})=>{
    const lX = gTextlSize*x;
    const rX = gTextlSize*x + gTextlSize;
    const tY = gTextlSize*y;
    const bY = gTextlSize*y + gTextlSize;
    editCtx.moveTo(lX, tY);
    editCtx.lineTo(rX, tY);
    editCtx.lineTo(rX, bY);
    editCtx.lineTo(lX, bY);
    editCtx.lineTo(lX, tY);
  } );
  editCtx.stroke();
  c2DDrawRectMode();
}
function c2DDrawRectMode() {
  if ( !gRectMode )
    return;
  if ( gRectModeStart === {x:0, y:0} || gRectModeEnd === {x:0, y:0} )
    return;
  const lX = gTextlSize*Math.min(gRectModeStart.x, gRectModeEnd.x);
  const tY = gTextlSize*Math.min(gRectModeStart.y, gRectModeEnd.y);
  const rX = gTextlSize*Math.max(gRectModeStart.x, gRectModeEnd.x) + gTextlSize;
  const bY = gTextlSize*Math.max(gRectModeStart.y, gRectModeEnd.y) + gTextlSize;

  const editCtx = e("pixMap").getContext("2d");
  editCtx.strokeStyle="#AAAAAA";
  editCtx.beginPath();
  editCtx.moveTo(lX, tY);
  editCtx.lineTo(rX, tY);
  editCtx.lineTo(rX, bY);
  editCtx.lineTo(lX, bY);
  editCtx.lineTo(lX, tY);
  editCtx.stroke();
}
//// 3D Zeugs
let smartGl = null;
let gLvl = null;
let g3DCanvis = null;
let gCamCtrl = null;
let gInputCtrl = null;
let gLightShader = null;
let gObjectShader = null;
let gSunLight = null;
let gShadowSize = 1024; 
let gShadowSmooth = 1;
let g_players = []; // neccessary for lvl class / effectitem
let gUpdateLvlTimer = 0;
let gCreatedSelectors = [];
let gSelectorObjects = [];
let gSelectModel = null;

function c3Drecreate() {
  g3DCanvis = e("c3DView");
  g3DCanvis.width = g3DCanvis.clientWidth * g_viewportScale;
  g3DCanvis.height = g3DCanvis.clientHeight * g_viewportScale;
  smartGl = new SmartGL(c3DLoadDone, false, "c3DView");

  const scene = smartGl.currentScene();

  gLightShader = new sGLObjectLightningShader()
  gObjectShader = new sGLObjectShader()

  gLvl = new Level(0, e("rawDataMap"), glvlFieldSize );
  gCamCtrl = new CameraController( gl );
  gInputCtrl = new InputController( gl );

  gSunLight = new Light(Light.Directional).setParam({intens:1.7, specIntens:0.5, pos:[-30,40,-80], direction:[.2,-0.45,0.6]}); 
  gSunLight.shadowSize = gShadowSize;
  gSunLight.shadowSmooth = gShadowSmooth;
  gSunLight.setShadow(true);
  scene.addLight( gSunLight );

  gSelectModel = new Model( "obj/select.obj" ).loadTexture( "obj/select.png" ).setVisible(false);
  gSelectModel.updateLogic = rotateSelectitem;
  scene.addObject( gSelectModel );
}
let g_c3DMouseDown = 0;
function c3DMouseDown(ev) {
  ev = ev || window.event;

  g_c3DMouseDown = g_frameTime;
}
function c3DMouseUp(ev) {
  ev = ev || window.event;

  const delteT = g_frameTime - g_c3DMouseDown;
  if (delteT > 250)
    return;

  if( e("mapSettings").style.display !== "none" )
    komplett();

  // is Ctrl down, no clear (continue)
  if ( !ev.ctrlKey && !ev.shiftKey)
    gSelectedFields = [];

  const c2DPos = c3Dget2DPos(ev.offsetX, ev.offsetY);
  if ( c2DPos === false )
    return;

  // is shift down, remove mode (wipe mode)
  gRemoveMode = ev.shiftKey;

  const x = parseInt((c2DPos[0] / gLvl.rasterSize + gLvl.mapSizeX/2));
  const y = parseInt((c2DPos[1] / gLvl.rasterSize + gLvl.mapSizeY/2));

  if (texelValid( x, y )){
    modifyPixelWithMouse(x,y)
    applySettingsFrom(x,y);
  }
  createSelectIcons();
}
function c3DMouseDplClick(ev) {
  ev = ev || window.event;

  const c2DPos = c3Dget2DPos(ev.offsetX, ev.offsetY);
  if ( c2DPos === false )
    return;

  const fakeEv = {
    ctrlKey: ev.ctrlKey,
    shiftKey: ev.shiftKey,
    offsetX: parseInt((c2DPos[0] / gLvl.rasterSize + gLvl.mapSizeX/2)*gTextlSize),
    offsetY: parseInt((c2DPos[1] / gLvl.rasterSize + gLvl.mapSizeY/2)*gTextlSize)
  };
  pixMapMouseDplClick( fakeEv );
}
function c3Dget2DPos(x,y) {

  const ray = Ray.createPickRay( [x*g_viewportScale,y*g_viewportScale], e("c3DView"), g_backbone.currentScene().camera() );
  const col = g_backbone.collision();

  const selectedObjects = [];
  const objects = [gLvl.grass, gLvl.mud, gLvl.lava, gLvl.effect];
  objects.forEach( obj => {
    if ( obj === null )
      return;
    const res = col.collisionRayModal( ray, obj );
    if ( res.collidate == true )
      selectedObjects.push( { res, obj });
  });
  if ( selectedObjects.lenght == 0 )
    return false;

  const closest = col.getClosestObject(selectedObjects);

  const rayDistanceVector = vec3.scale(vec3.create(), ray.direction, closest.distance);
  const selectPos = vec3.add(vec3.create(), ray.origin, rayDistanceVector);  

  return [ selectPos[0], selectPos[2] ];
}

function rotateSelectitem( deltatime ) {
  this.addRotation(0, 120*deltatime, 0);
}
function c3DDraw( time ) {
  window.requestAnimationFrame(c3DDraw);
}
function c3DLoadDone() {
  smartGl.start();  
  gLvl.createLVL();  

  const scene = smartGl.currentScene(); 
  scene.setDefaultShader(gObjectShader);
}
function updateLVL() {
  if ( gUpdateLvlTimer === 0 )
    gUpdateLvlTimer = window.setTimeout( recreateLVL, 50 );
}
function recreateLVL() {
  gUpdateLvlTimer = 0;
  smartGl.stop();
  smartGl.currentScene().objects = [];
  smartGl.currentScene().instanceMap = new Map();

  gLvl = new Level(0, e("rawDataMap"), glvlFieldSize );
  gLvl.createLVL();
  
  gCreatedSelectors = [];
  smartGl.currentScene().addObject( gSelectModel );
  createSelectIcons();

  startWhenLvlReady();
}
function startWhenLvlReady() {
  if ( gLvl.wall.checkIsReady() )
    smartGl.start();
  else
    window.setTimeout( startWhenLvlReady, 20 );
}

function createSelectIcons() {
  const sceen = smartGl.currentScene();
  if ( gSelectedFields.length == 0 ){
    gSelectorObjects.forEach( sel => sceen.removeObject(sel) );
    gSelectorObjects = [];
    gCreatedSelectors = [];
    return;
  }

  const newSelections = gSelectedFields.filter( sel => !gCreatedSelectors.some( exSel => exSel.x === sel.x && exSel.y === sel.y) );
  gCreatedSelectors = gCreatedSelectors.filter( exSel => {
    if ( gSelectedFields.some( sel => exSel.x === sel.x && exSel.y === sel.y) )
      return true;
    else {
      exSel.object.removeInstance();
      return false;
    }
  });
  newSelections.forEach( sel => {    
    const height = gLvl.getFieldData( sel.x, sel.y ).h + 0.5;
    const pos = gLvl.getFieldCenterPosSimple( sel.x, sel.y, height );
    const object = new ModelInstance(gSelectModel);
    object.setPosition(pos);
    gCreatedSelectors.push( {x:sel.x, y:sel.y, object} );
  } );
}