//"use strict";
let gl = null;
let g_backbone = null;
let g_frameTime = 0;
let g_viewportScale = 0.7;
const viewport={ width:0, height:0 };

// global helper
function e(id) {
  return document.getElementById(id);
}
function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}
function containerToString(arr) {
  var out = "";
  for (var i = 0; i < arr.length; i++) {
    out += arr[i];
  }
  return out;
}
function radToDeg(r) {
  return r * 180 / Math.PI;
}
function degToRad(d) {
  return d * Math.PI / 180;
}
function getOS() {
  if ( navigator.platform.startswith('Win') )
    return 'Windows';
  if ( navigator.platform.startswith('Linux') )
    return 'Linux';
  if ( navigator.platform.startswith('Mac') )
    return 'Mac'
}
function isMobile() {
  return navigator.userAgent.contains('Android') || navigator.userAgent.contains('iPhone');
}


// WebGL2.0 init stuff
function initGL(canvasId) {
  var canvas = e(canvasId);
  if (!!window.WebGLRenderingContext == false)
    throw "WebGl2 is not enabled";

  var gl = canvas.getContext("webgl2");

  if ( !gl ) 
    throw "Browser is not supporting WebGL2";


  gl.mTextureCache = new Map();

  ////////////////////////////////////////////////////////////////
  // setup WebGl2
  gl.cullFace(gl.BACK);
  gl.frontFace(gl.CCW);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor( .9, .9, .8, 1.);
  gl.clearDepth(1.0);

  ///////////////////////////////////////////////////////////////
  // Gl extensions

  gl.clearSceen = function() {
    this.clear(this.COLOR_BUFFER_BIT | this.DEPTH_BUFFER_BIT); 
    return this;
  };  
  gl.clearDepthBuffer = function() {
    this.clear(this.DEPTH_BUFFER_BIT); 
    return this;
  };
  gl.loadTexture = function( name, img, doYFlip ) {
    if ( this.mTextureCache.has(name) )
      return this.mTextureCache.get(name);
    var tex = this.createTexture();
    if( doYFlip == true )
      this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, true);

    this.bindTexture( this.TEXTURE_2D, tex );
    this.texImage2D( this.TEXTURE_2D, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, img);

    this.texParameteri( this.TEXTURE_2D, this.TEXTURE_MAG_FILTER, this.LINEAR );
    this.texParameteri( this.TEXTURE_2D, this.TEXTURE_MIN_FILTER, this.LINEAR_MIPMAP_NEAREST );
    this.generateMipmap( this.TEXTURE_2D );

    this.bindTexture ( this.TEXTURE_2D, null );
    
    this.mTextureCache.set(name, tex );
    if( doYFlip == true )
      this.pixelStorei(this.UNPACK_FLIP_Y_WEBGL, false);
    return tex;
  };
  gl.loadCubeMap = function(name, imgAry) {
    if ( this.mTextureCache.has(name) )
      return this.mTextureCache.get(name);

    if(imgAry.length != 6) 
      return null;

    var tex = this.createTexture();
    this.bindTexture(this.TEXTURE_CUBE_MAP, tex);

    for (var i = 0; i < imgAry.length; i++) 
      this.texImage2D(this.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.RGBA, this.RGBA, this.UNSIGNED_BYTE, imgAry[i] );

    this.texParameteri( this.TEXTURE_CUBE_MAP, this.TEXTURE_MAG_FILTER, this.LINEAR );
    this.texParameteri( this.TEXTURE_CUBE_MAP, this.TEXTURE_MIN_FILTER, this.LINEAR );
    this.texParameteri( this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_S, this.CLAMP_TO_EDGE );
    this.texParameteri( this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_T, this.CLAMP_TO_EDGE );
    this.texParameteri( this.TEXTURE_CUBE_MAP, this.TEXTURE_WRAP_R, this.CLAMP_TO_EDGE );
    
    this.bindTexture(this.TEXTURE_CUBE_MAP, null);

    this.mTextureCache.set(name, tex );
    return tex;   
  }
  gl.setSize = function(w,h){ 
    this.canvas.style.width = w +"px";
    this.canvas.style.height = h +"px";
    this.canvas.width = w*g_viewportScale;
    this.canvas.height = h*g_viewportScale;
    this.viewport(0,0,this.canvas.width,this.canvas.height);
    return this;
  };
  gl.fitScreen = function(wp,hp) {
    this.fitToScreen = true;
    return this.setSize( window.innerWidth * (wp||1)-2,window.innerHeight * (hp||1)-5); 
  };

  ////////////////////////////////////////////////////////////////
  //EventHandlers
  window.addEventListener("resize", () => { 
    if ( gl.fitToScreen ) {
      gl.fitScreen();
    }
  });
  return gl;
} 

class SmartGL {
  constructor( loadDone, fullscreen = true, canvasName = "WebGL" ) {
    g_backbone = this;
    gl = initGL(canvasName)
    if ( fullscreen ) 
      gl.fitScreen()
    gl.clearSceen();
    this.lastFrame = null;
    this.logicCB = function(timeDelta){};
    this.renderCB = function(timeDelta){};
    this.isActive = false;
    this.openRenderRequest = 0;

    this.fps = 0;
    this.activeScene = new Scene(loadDone);
    this.allScene = [ this.activeScene];

    //new CameraController( gl );
    //new InputController( gl );

    this.glSources = new Map();
    this.resRequests = new Map();
    this.openRequests = 0;

    
    this.objectShader = new sGLObjectShader();
  }
  lockInit() {
    this.openRequests += 1;
  }
  initDone() {
    this.openRequests -= 1;
    if ( this.openRequests === 0 )
      window.dispatchEvent( new Event('allResLoaded') );
  }

  animationFrame( time ) {  // trick to get the this ptr
    g_backbone.prepareRender(time);   
  }
  prepareRender( time ) {   
    if ( this.isActive ) {
      this.drawScean( time );   
      window.requestAnimationFrame(this.animationFrame);
    }
  }
  drawScean ( time ) {
    var deltatime = (time -  this.lastFrame) / 1000;  // in s
    g_frameTime = time;
    this.lastFrame = time;
    if ( deltatime > 0.0 )
      this.fps = Math.floor(10/deltatime)/10;
    this.logicCB(deltatime);
    this.currentScene().logic( deltatime );
    this.renderCB(deltatime); 
    this.currentScene().render( deltatime );
  }

  res(path, callback){
    if ( this.glSources[path] !== undefined ) {
      if ( callback !== undefined )
        callback( this.glSources[path]);
      return this.glSources[path];
    }
    var self = this;
    if ( this.resRequests[path] !== undefined ) {
      this.resRequests[path].push(callback);
      return;
    }
    this.openRequests++;
    if ( callback !== undefined)
      this.resRequests[path] = [callback];
    var requesters = {}; // hier weitere requesters hinzufügen !!!!
    this.ajaxRequest(path, ajax => {
      this.openRequests--;
      this.glSources[path] = ajax.response;
      if ( this.resRequests[path] !== undefined && this.resRequests[path].length )
        this.resRequests[path].forEach( c => {
          c(ajax.response) 
        });
      this.resRequests[path] = undefined;
      if ( this.openRequests === 0 )
        window.dispatchEvent( new Event('allResLoaded') );
    });
  }
  addRes(name, data){
    this.glSources[name] = data;
  }
  ajaxRequest(url, callback) {
    var ajax = new XMLHttpRequest(); // wer WebGl kann kann auch AJAX :-)
    ajax.onload = function () { callback(ajax); }
    ajax.open('POST', url, true);
    ajax.responseType = "arraybuffer";
    if ( url.indexOf(".png") != -1 )
      ajax.setRequestHeader('Content-Type', 'image/png');   
    else if ( url.indexOf(".jpg") != -1 ) 
      ajax.setRequestHeader('Content-Type', 'image/jpeg');  
    else if ( url.indexOf(".vs") != -1 || url.indexOf(".fs") != -1 ) {
      ajax.setRequestHeader('Content-Type', 'plane/text');    
      ajax.responseType = "text";
    }
    else
      ajax.setRequestHeader('Content-Type', 'application/octet-stream');
    
    ajax.send();
  }

  start() {
    if ( this.isActive == true )
      return;
    this.isActive = true;
    this.prepareRender( performance.now() );
    return this;
  }
  stop() {
    this.isActive = false;
    return this;
  }

  collision() { return this.currentScene().collision(); }

  // Scene Management
  currentScene() { return this.activeScene; }
  createNewScene() { 
    this.activeScene = new Sceen(gl);
    this.allScene = [ this.activeScene ];
    return this.currentScene();
  }
  changeScene( idx ) {
    if ( idx < this.allScene.length )
      this.activeScene = this.allScene[0];    
    else 
      this.activeScene = this.allScene[0];

    return this.currentScene().activateScene();
  }
}

