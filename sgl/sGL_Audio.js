"use strict";

class Audio {
  constructor( ) {
    // Fix up for prefixing
    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    this.audioContext = new AudioContext();

    this.mute = false;

    this.listenerPos = vec3.create();

    this.mainVolume = this.audioContext.createGain();
    this.mainVolume.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.015);
    this.mainVolume.connect(this.audioContext.destination);

    this.backgroundVolume = this.audioContext.createGain();
    this.backgroundVolume.gain.setTargetAtTime(0.5, this.audioContext.currentTime, 0.015);
    this.backgroundVolume.connect(this.mainVolume);

    this.buffers = new Map();    
  }
  setMainVolume(volume) {
    if ( volume < 0 )
      volume = 0;
    if ( volume > 1 )
      volume = 1;
    this.mainVolume.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.015);
    return this;
  }
  setBackgroundVolume(volume) {
    if ( volume < 0 )
      volume = 0;
    if ( volume > 1 )
      volume = 1;
    this.backgroundVolume.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.015);
    return this;
  }
  preloadSounds( filenameArray ) {
    if ( typeof filenameArray !== 'object')
      return;
    filenameArray.forEach( n=>this.loadSound(n) );
  }
  loadSound(filename, callback ) {
    const buffer = this.buffers.get(filename);
    if ( buffer === undefined ) {
      fetch( filename ).then( 
        resp => resp.arrayBuffer().then( 
          data=>this.audioContext.decodeAudioData(
            data, 
            buffer => {
              this.buffers.set(filename, buffer);
              if ( callback !== undefined )
                callback(filename);
            }, 
            error => console.log("loadSound error", error) 
      ) ) ).catch(
        error => console.log("loadSound error", error)
      );
    }
    return buffer;
  }

  playBackgrund( filename ) {
    if ( this.mute )
      return;
    const buffer = this.loadSound( filename, name => playBackgrund(name) );
    if ( buffer === undefined )
      return;
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;    
    source.connect( this.backgroundVolume );
    source.start(0);
  }
  playSound( filename ) {
    if ( this.mute )
      return;
    const buffer = this.buffers.get(filename);
    if ( buffer === undefined )
      return this.loadSound(filename, name => this.playSound(name) );

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect( this.mainVolume );
    source.start(0);
  }
  play3DSound( filename, pos ) {
    if ( this.mute )
      return;
    const buffer = this.buffers.get(filename);
    if ( buffer === undefined )
      return this.loadSound(filename, name => this.playSound(name) );

    const sound = {pos};
    sound.source = this.audioContext.createBufferSource();
    sound.panner = this.audioContext.createPanner();

    sound.source.buffer = buffer;
    sound.source.connect( sound.panner );
    sound.panner.setPosition( sound.pos[0], sound.pos[2], sound.pos[1] );
    sound.panner.maxDistance = 25;
    sound.panner.panningModel = "HRTF"
    sound.panner.connect( this.mainVolume );
    sound.source.start(0);
    return sound;
  }
  setListener( position, orientation ) { //pos, viewDir
    this.audioContext.listener.setOrientation( orientation[0], orientation[2], orientation[1] , 0, -1, 0);
    this.audioContext.listener.setPosition( position[0], position[2], position[1]  );
    this.updateSceneSound();
  }
  updateSceneSound() {
    if ( this.mute )
      return;
  }
  startSound(buffer, time) {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect( this.mainVolume );
    source.start(time);
  }
}

