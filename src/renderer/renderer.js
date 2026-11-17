import { DAY, CAMERA_FOV, TAU, clamp, lerp, vnorm, vsub, matMul, model, hex, projected } from './math.js';
import { renderRadius, planetBodyRadius, planetOrbitRadius, orbitalRadius, sceneRadius, keplerPosition } from '../data/orbital-math.js';
import { J2000 } from '../data/bodies.js';
import { largestMoonIds, layerEnabled } from '../data/layers.js';
import { program, BODY_VS, BODY_FS, LINE_VS, LINE_FS, STARS_VS, STARS_FS, RING_VS, RING_FS, STYLES } from './shaders.js';
import { sphereGeometry, ringGeometry, starGeometry } from './geometry.js';
import { panCameraByPixels, cameraView, followMotionTooFast } from './camera.js';
import { attachCameraControls, moveCameraWithKeyboard } from './controls.js';
import { drawOrbitLine } from './orbits.js';
import { drawSceneLabels } from './labels.js';
import { computePositions } from './scene.js';
import { drawPlanetSystemScene, planetChildrenFor, planetFrameDistance } from './planet-view.js';
import { drawSolarSystemScene } from './solar-view.js';
import { TextureManager,preferredMobileQuality } from './textures.js';

export class SolarRenderer {
 constructor(canvas, labelCanvas, glow, callbacks={}) {
  this.canvas=canvas;this.labels=labelCanvas;this.glow=glow;this.callbacks=callbacks;
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false})||canvas.getContext('webgl',{antialias:true,alpha:false});
  if(!gl)throw Error('WebGL nicht verfügbar');this.gl=gl;
  this.bodyProgram=program(gl,BODY_VS,BODY_FS);this.lineProgram=program(gl,LINE_VS,LINE_FS);
  this.starsProgram=program(gl,STARS_VS,STARS_FS);this.ringProgram=program(gl,RING_VS,RING_FS);
  const geom=sphereGeometry();this.sphereVB=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.sphereVB);gl.bufferData(gl.ARRAY_BUFFER,geom.vertices,gl.STATIC_DRAW);
  this.sphereIB=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphereIB);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geom.indices,gl.STATIC_DRAW);this.sphereCount=geom.indices.length;
  this.textures=new TextureManager(gl);
  this.ringVB=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.ringVB);gl.bufferData(gl.ARRAY_BUFFER,ringGeometry(),gl.STATIC_DRAW);
  this.lineVB=gl.createBuffer();this.starVB=gl.createBuffer();this.starCount=2200;gl.bindBuffer(gl.ARRAY_BUFFER,this.starVB);gl.bufferData(gl.ARRAY_BUFFER,starGeometry(this.starCount),gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.013,.025,.058,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  this.camera={theta:.63,phi:.99,dist:47,target:[0,0,0],desiredTarget:[0,0,0],desiredDist:47};
  this.cameraPresetIndex=0;this.cameraManuallyMoved=false;
  this.focusedBodyId=null;this.focusOffsetY=0;
  this.followEnabled=false;this.followedBodyId=null;this.followLastPosition=null;this.followLastAtMs=null;
  this.bodies=[];this.byId=new Map();this.positions=new Map();this.rendered=[];this.selectedId='earth';this.settings={orbits:true,labels:true};this.overrides=new Map();this.simTime=Date.now();this.planetId=null;
  this.dpr=1;this.width=0;this.height=0;this.viewportWidth=0;this.viewportHeight=0;this._labelState=null;
  this.drag=null;this.pointers=new Map();this.gesture=null;this.gestureOrigin=null;this.heldArrows=new Set();this.lastKeyboardFrameMs=null;
  this.attachEvents();this.resize();
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
 }
 attachEvents(){attachCameraControls(this);}
 panByPixels(dx,dy){if(dx || dy){this.markCameraMoved({positionChanged:true});panCameraByPixels(this.camera,dx,dy,this.height);}}
 /** Rotation and zoom change the view but must not disable the global follow toggle. */
 markCameraMoved({positionChanged=false}={}){
  this.cameraManuallyMoved=true;
  if(positionChanged){this.focusedBodyId=null;this.stopFollowing();}
  else if(!this.followEnabled)this.focusedBodyId=null;
 }
 /** Clear a target without turning off the global toggle (e.g. no selection/probe). */
 clearFollowTarget(){
  this.followedBodyId=null;this.followLastPosition=null;this.followLastAtMs=null;
 }
 /** Leave the camera where it is when tracking ends; do not change the selection. */
 stopFollowing(){
  const active=this.followEnabled===true;
  this.followEnabled=false;this.clearFollowTarget();
  if(active)this.callbacks?.onFollowChange?.(false);
  return active;
 }
 /** The single toggle persists across selections and view changes. */
 follow(id=this.selectedId,now=performance.now()){
  if(this.followEnabled){this.stopFollowing();return false;}
  const body=this.byId.get(id);
  if(!body || body.type==='probe' || id!==this.selectedId)return false;
  this.followEnabled=true;
  if(!this.followSelectedBody(now)){
    this.followEnabled=false;return false;
  }
  this.callbacks?.onFollowChange?.(true);
  return true;
 }
 /** Track the current selection; reset the speed sample when the object/scene changes. */
 followSelectedBody(now=performance.now()){
  if(!this.followEnabled)return false;
  const id=this.selectedId,body=this.byId.get(id);
  if(!body || body.type==='probe'){
    this.clearFollowTarget();this.focusedBodyId=null;return false;
  }
  this.calcPositions(this.simTime);
  const position=this.positions.get(id);
  if(!position || position.some(value=>!Number.isFinite(value))){
    this.clearFollowTarget();this.focusedBodyId=null;return false;
  }
  this.followedBodyId=id;
  this.focus(id);
  this.camera.desiredTarget=position.slice();
  this.followLastPosition=position.slice();this.followLastAtMs=now;
  return true;
 }
 /** Follow each slow scene update, without interpreting a selection change as motion. */
 updateFollowTarget(now=performance.now()){
  if(!this.followEnabled)return;
  const id=this.selectedId;
  if(this.followedBodyId!==id){this.followSelectedBody(now);return;}
  const position=this.positions.get(id);
  if(!position || position.some(value=>!Number.isFinite(value))){
    this.clearFollowTarget();this.focusedBodyId=null;return;
  }
  if(followMotionTooFast(this.followLastPosition,position,this.camera.desiredDist,
      this.height,now-this.followLastAtMs)){
    this.stopFollowing();return;
  }
  this.camera.desiredTarget=position.slice();
  this.followLastPosition=position.slice();this.followLastAtMs=now;
 }
 /** Next preset only while the active one has not been changed by the user. */
 cycleCameraPerspective(){
  if(this.planetId){this.reset();return;}
  const index=this.cameraManuallyMoved?0:((this.cameraPresetIndex??0)+1)%3;
  this.applyCameraPreset(index);
 }
 applyCameraPreset(index){
  this.cameraPresetIndex=index;this.cameraManuallyMoved=false;
  const tracked=this.followEnabled && this.followedBodyId===this.selectedId;
  this.focusedBodyId=tracked?this.selectedId:null;
  this.camera.desiredTarget=tracked?(this.positions.get(this.selectedId)?.slice()||[0,0,0]):[0,0,0];
  this.camera.desiredDist=47;
  this.camera.theta=.63;this.camera.phi=[.99,1.54,.16][index];
 }
 updateKeyboard(now=performance.now()){moveCameraWithKeyboard(this,now);}
  resize(){const r=this.canvas.parentElement.getBoundingClientRect();const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));this.dpr=Math.min(window.devicePixelRatio||1,1.8);
  this.width=w;this.height=h;this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);
  this.labels.width=this.canvas.width;this.labels.height=this.canvas.height;
  this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.labels.style.width=w+'px';this.labels.style.height=h+'px';
  this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
  this.textures?.setMobile(preferredMobileQuality());
 }
 setBodies(list){this.bodies=list;this.byId=new Map(list.map(o=>[o.id,o]));
  this.fourMoonIds=largestMoonIds(list);
  if(this.planetId && !['planet','dwarf'].includes(this.byId.get(this.planetId)?.type))this.reset();
 }
 /** The planet and its direct natural/artificial orbiters form an isolated scene. */
 planetChildren(id=this.planetId){return planetChildrenFor(this.bodies,id);}
 planetFrameDistance(id=this.planetId){return planetFrameDistance(this.width,this.height,this.byId.get(id),this.planetChildren(id));}
  showPlanetSystem(id){if(!['planet','dwarf'].includes(this.byId.get(id)?.type))return false;
  this.planetId=id;this.markCameraMoved();
  this.camera.theta=.63;this.camera.phi=.84;
  this.camera.target=[0,0,0];this.camera.desiredTarget=[0,0,0];
  this.camera.dist=this.camera.desiredDist=this.planetFrameDistance(id);
  this.calcPositions(this.simTime);
  if(this.followEnabled)this.followSelectedBody();
  return true;
 }
 setSelected(id,{focus=false}={}){
  const changed=id!==this.selectedId;
  this.selectedId=id;
  if(this.followEnabled && changed){this.followSelectedBody();return;}
  if(focus && id!==this.followedBodyId)this.focus(id);
  else if(id!==this.focusedBodyId && !this.followEnabled)this.focusedBodyId=null;
 }
 focus(id){const b=this.byId.get(id);if(!b)return;this.markCameraMoved();this.focusedBodyId=id;
  if(this.planetId){
   if(id===this.planetId){this.camera.desiredTarget=[0,0,0];this.camera.desiredDist=this.planetFrameDistance();}
   else if(b.parentId===this.planetId){
    const pos=this.positions.get(id);if(pos)this.camera.desiredTarget=pos.slice();
    this.camera.desiredDist=b.type==='satellite'?5.5:6.5;
   }
   return;
  }
  const pos=this.positions.get(id);if(pos)this.camera.desiredTarget=pos.slice();
  const dist=b.type==='star'?24:b.type==='planet'?10.5:b.type==='moon'?3.8:b.type==='satellite'?3.6:b.type==='dwarf'?8.7:7.5;
  this.camera.desiredDist=dist;
 }
 /** Overview always exits the isolated planet view and returns to the solar system. */
 reset(){const wasPlanet=Boolean(this.planetId);this.planetId=null;
  this.applyCameraPreset(0);
  if(wasPlanet){
    this.camera.target=[0,0,0];this.camera.dist=47;this.calcPositions(this.simTime);
    if(this.followEnabled)this.followSelectedBody();
  }
 }
 setOverride(id,date,vector){this.overrides.set(id,{date,vector});}
 calcPositions(timeMs){computePositions(this,timeMs);}
  shouldDraw(b){
  if(!layerEnabled(this.settings?.layers,b.type))return false;
  // Categories are actual scene layers, not only catalog filters.
  // The four-moons cap affects actual spheres, labels, picking and orbit strokes.
  if(b.type==='moon' && this.settings?.fourMoons===true && !this.fourMoonIds?.has(b.id))return false;
  return b.type!=='probe'; // Missions without ephemerides remain catalog-only.
 }
 start(time,selected,settings){this.simTime=time;this.selectedId=selected;this.settings=settings;this.calcPositions(time);}
  makeVP(visibleFocusOffset=this.visibleFocusOffset??0){this.updateKeyboard();
    // Only automatic object focus is reframed. Manual rotation/pan/zoom restores
    // the ordinary centered camera; desktop and closed sheet supply offset 0.
    const offset=this.focusedBodyId!=null && this.focusedBodyId===this.selectedId?clamp(visibleFocusOffset,0,1):0;
    this.focusOffsetY=lerp(this.focusOffsetY||0,offset,.14);
    return cameraView(this.camera,this.width,this.height,this.focusOffsetY);
  }
  useLineProgram(vp){const gl=this.gl,p=this.lineProgram;gl.useProgram(p);
  gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,vp);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.lineVB);
  const a=gl.getAttribLocation(p,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  return p;
 }
 orbitLine(b,center,vp,alpha,selected){drawOrbitLine(this,b,center,vp,alpha,selected);}
  drawStars(vp){const gl=this.gl,p=this.starsProgram;gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,vp);
  gl.uniform1f(gl.getUniformLocation(p,'uPixelRatio'),this.dpr);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.starVB);
  const pos=gl.getAttribLocation(p,'aPosition'),size=gl.getAttribLocation(p,'aSize');gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(size);
  gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);gl.vertexAttribPointer(size,1,gl.FLOAT,false,16,12);
  gl.depthMask(false);gl.drawArrays(gl.POINTS,0,this.starCount);gl.depthMask(true);
 }
 drawSphere(body,p,vp){const gl=this.gl,program=this.bodyProgram;gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.sphereVB);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphereIB);
  const a=gl.getAttribLocation(program,'aPosition'),n=gl.getAttribLocation(program,'aNormal'),uv=gl.getAttribLocation(program,'aUV');
  gl.enableVertexAttribArray(a);gl.enableVertexAttribArray(n);gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(a,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(n,3,gl.FLOAT,false,32,12);
  gl.vertexAttribPointer(uv,2,gl.FLOAT,false,32,24);
  const r=(this.planetId?planetBodyRadius(body):renderRadius(body))*(this.selectedId===body.id?1.045:1);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,matMul(vp,model(p,r)));
  const color=hex(body.color);gl.uniform3f(gl.getUniformLocation(program,'uBase'),...color);
  const light=this.planetId?vnorm([.8,.65,1]):vnorm(vsub([0,0,0],p));gl.uniform3f(gl.getUniformLocation(program,'uLight'),...light);
  gl.uniform1f(gl.getUniformLocation(program,'uStyle'),STYLES[body.style]??1);
  gl.uniform1f(gl.getUniformLocation(program,'uOptimizedLighting'),this.settings?.lighting==='realistic'?0:1);
  let seed=0;for(let i=0;i<body.id.length;i++)seed+=body.id.charCodeAt(i)*.11;
  gl.uniform1f(gl.getUniformLocation(program,'uSeed'),seed);
  gl.uniform1f(gl.getUniformLocation(program,'uTime'),this.simTime/DAY);
  const texture=this.textures?.get(body,this.planetId,this.selectedId);
  gl.uniform1f(gl.getUniformLocation(program,'uHasTexture'),texture?1:0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,texture||null);
  gl.uniform1i(gl.getUniformLocation(program,'uDiffuse'),0);
  gl.drawElements(gl.TRIANGLES,this.sphereCount,gl.UNSIGNED_SHORT,0);
 }
 drawRings(p,vp){const gl=this.gl,program=this.ringProgram;gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.ringVB);const a=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,matMul(vp,model(p,this.planetId?2.05:1,.41)));
  gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,200*6);gl.depthMask(true);
 }
 drawLabels(vp){drawSceneLabels(this,vp);}
  draw(timeMs,selectedId,settings){const gl=this.gl;if(this.width<2||this.height<2)return;
  this.start(timeMs,selectedId,settings);
  this.updateFollowTarget();
  const {vp}=this.makeVP();this.vp=vp;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  this.drawStars(vp);
  if(this.planetId)drawPlanetSystemScene(this,selectedId,settings,vp);
  else drawSolarSystemScene(this,selectedId,settings,vp);
 }
  pick(x,y){if(!this.vp)return;let best=null,dist=Infinity;
  for(const b of this.rendered){const pos=this.positions.get(b.id);if(!pos)continue;
   const p=projected(pos,this.vp,this.width,this.height);if(!p?.visible)continue;
   const radius=(this.planetId?planetBodyRadius(b):renderRadius(b))*this.height/(this.camera.dist*.6);
   const d=Math.hypot(x-p.x,y-p.y);const threshold=Math.max(12,Math.min(radius+5,40));
   if(d<threshold&&d<dist){best=b;dist=d;}
  }
  if(best){this.callbacks.onSelect?.(best.id);}
  else{this.callbacks.onClearSelect?.();}
  return best?.id ?? null;
 }
}
