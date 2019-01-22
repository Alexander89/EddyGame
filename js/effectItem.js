const LIFE = 0;
const SPEED = 1;
const HIDE = 2;
const LIGHT = 3;

class EffectItem {
  constructor( pos, type ) {
    this.objectSize = 0.0;
    this.visible = false;
    this.blowUp = false
    this.type = type;
    switch (type){
      case LIFE:  this.model = new Model( "obj/heart.obj" ).loadTexture( "obj/heart.png" ); break;
      case SPEED: this.model = new Model( "obj/speed.obj" ).loadTexture( "obj/speed.png" ); break;
      case HIDE:  this.model = new Model( "obj/eye.obj" ).loadTexture( "obj/eye.png" ); break;
      case LIGHT: this.model = new Model( "obj/battery.obj" ).loadTexture( "obj/battery.png" ); break;
    }
    this.model.updateLogic = dT=>this.update(dT);
    this.model.setPosition( pos );
    this.show();
  }
  applyEffect( eddy ) {
    if ( this.type === LIFE ) {
      eddy.health += 50;
      if (eddy.health > eddy.healthMax )
        eddy.health = eddy.healthMax;
    }
    if ( this.type === SPEED ) {
      eddy.runSpeed += 2.0;
      eddy.maxCameraDist += 1.5;
      eddy.reqCameraDist += 1.5;
      window.setTimeout( ()=>{
        eddy.runSpeed-=2.0;
        if ( eddy.frontF > eddy.runSpeed )
          eddy.frontF = eddy.runSpeed;
        if ( eddy.frontF < -eddy.runSpeed )
          eddy.frontF = -eddy.runSpeed;
        eddy.maxCameraDist -= 1.5;
        eddy.reqCameraDist -= 1.5;
      }, 8000 );
    }
    if ( this.type === HIDE ) {
      eddy.hidesAvailable++;
      if (eddy.hidesAvailable >= 5 )
        eddy.hidesAvailable = 5;
    }
    if ( this.type === LIGHT ) {
      eddy.toachPower += eddy.toachPowerMax / 6;
      if (eddy.toachPower > eddy.toachPowerMax )
        eddy.toachPower = eddy.toachPowerMax;
    }
  }
  respoarnTimeout() {
    switch (this.type){
      case LIFE:  return 5000;
      case SPEED: return 10000;
      case HIDE:  return 60000;
      case LIGHT: return 15000;
      default: return 10000;
    }
  }
  show() {
    if ( this.visible == true )
      return;
    const scene = smartGl.currentScene();
    scene.addObject( this.model );
    this.objectSize = 0.0;
    this.blowUp = false;
    this.visible = true;
  }
  hide() {
    if ( this.visible == false )
      return;
    this.blowUp = true;
  }
  disappear() {
    const scene = smartGl.currentScene();
    scene.removeObject( this.model );
    this.visible = false;
    this.objectSize = 1;
    this.blowUp = false;
  }
  update( deltatime ) {
    if ( this.visible === false )
      return;

    if ( !this.blowUp )
      if ( g_players.find( p=>this.pickupCheck(p, p.eddyPos) ) )
        return;
    if ( this.blowUp ) {
      this.objectSize += 5.0 * deltatime; // 1/5 sec
      if ( this.objectSize > 2.0 ){
        this.disappear();
        gAudio.play3DSound("sound/egg_collect.mp3", this.model.pos());
      }
    } 
    else {
      if ( this.objectSize < 1.0 )
        this.objectSize += 0.6 * deltatime;
      if ( this.objectSize > 1 )
        this.objectSize = 1;
    }

    this.model.setScale( this.objectSize, this.objectSize, this.objectSize );
    this.model.addRotation(0, 120*deltatime, 0);
  }

  pickupCheck( eddy, eddyPos ) {
    if ( vec3.distance(this.model.pos(), eddyPos) <= 1.0 ){
      this.hide();
      window.setTimeout( ()=>this.show(), this.respoarnTimeout());
      this.applyEffect(eddy);
      return true;
    }
    return false;
  }
}
