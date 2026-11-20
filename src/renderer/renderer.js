import { DAY, CAMERA_FOV, TAU, clamp, lerp, vnorm, vsub, matMul, hex, projected } from './math.js';
import { displayBodyRadius, displayOrbitRadius, optimizedSolarMode, OPTIMIZED_ORBIT_FACTOR } from '../data/orbital-math.js';
import { J2000 } from '../data/bodies.js';
import { largestMoonIds, layerEnabled } from '../data/layers.js';
import { program, BODY_VS, BODY_FS, LINE_VS, LINE_FS, STARS_VS, STARS_FS, RING_VS, RING_FS, STYLES } from './shaders.js';
import { sphereGeometry, ringGeometry, starGeometry } from './geometry.js';
import { panCameraByPixels, cameraView, restoreOrbitFromLook, followMotionTooFast, CAMERA_PERSPECTIVES, nextCameraPerspectiveIndex, CAMERA_FLIGHT_MS, cameraFlightPose, cameraFlightLook, orbitCameraLook } from './camera.js';
import { attachCameraControls, moveCameraWithKeyboard } from './controls.js';
import { drawOrbitLine } from './orbits.js';

import { drawSceneLabels } from './labels.js';
import { computePositions } from './scene.js';
import { drawPlanetSystemScene, planetChildrenFor, planetFrameDistance } from './planet-view.js';
import { drawSolarSystemScene, solarOrbitBodies } from './solar-view.js';
import {planetOrbitIds} from './scene-objects.js';
import {bodyModel,ringModel,localLightDirection} from './object-orientation.js';
import {VisualAngularClocks,DAY_MS} from './visual-angular-limit.js';
import { TextureManager,preferredMobileQuality } from './textures.js';
import { rowLayout, rowFrameDistance, rowCameraFrame, rubberEase, gentleEase, planetOrbitWaveDelays, planetOrbitWaveEase, blendPosition, LAYOUT_TRANSITION_MS } from './transitions.js';
import { cinemaEligible, cinemaTrack, cinemaPoseAt, cinemaSceneAt, cinemaEntryOpacity, cinemaObjectAt, cinemaRestingObject, CINEMA_ENTRY_MS, CINEMA_END_HOLD_MS } from './cinema.js';
import { rowHoveredBody, rowInspectionRadius, ROW_INSPECTION_ANIMATION_MS } from './row-inspection.js';

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
  this.followEnabled=true;this.followedBodyId=null;this.followLastPosition=null;this.followLastAtMs=null;
  this.visualAngularClocks=new VisualAngularClocks();
  this.bodies=[];this.byId=new Map();this.positions=new Map();this.rendered=[];this.selectedId='earth';this.settings={orbits:true,labels:true,row:false,rowOrder:'size'};this.overrides=new Map();this.simTime=Date.now();this.planetId=null;
  this.transitionsEnabled=true;this.transition=null;this.cameraFlight=null;this._rowPreviousAngles=null;
  this.cinema=null;this._cinemaRestoreFocus=null;
  this.dpr=1;this.width=0;this.height=0;this.viewportWidth=0;this.viewportHeight=0;this._labelState=null;
  this.drag=null;this.pointers=new Map();this.gesture=null;this.gestureOrigin=null;this.heldArrows=new Set();this.lastKeyboardFrameMs=null;
  this.rowPointer=null;this.rowHoveredId=null;this.rowHoverStartedAt=0;this.rowHoverLevels=new Map();this.rowHoverFrameAt=null;
  this.attachEvents();this.resize();
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
 }
 attachEvents(){attachCameraControls(this);}
 /** Track hover without interfering with drag/pinch, selection or camera controls. */
 setRowPointer(point){this.rowPointer=point;}
 /** Animate the inspected sphere instead of altering the sorted layout's positions. */
 advanceRowInspection(vp,now=performance.now()){
  this.vp=vp;
  const reducedMotion=typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const permitted=this.settings?.row && !this.camera?.arView && !this.transition;
  const target=permitted && !this.cinema?.active ? rowHoveredBody(this,this.rowPointer):null;
  const id=permitted ? (this.cinema?.active
    ?cinemaRestingObject(this.cinema,this.camera,this.transition):target?.id??null) : null;
  if(id!==this.rowHoveredId){this.rowHoveredId=id;this.rowHoverStartedAt=now;}
  const delta=this.rowHoverFrameAt===null||this.rowHoverFrameAt===undefined?16:clamp(now-this.rowHoverFrameAt,0,100);
  this.rowHoverFrameAt=now;
  const speeds=reducedMotion?1:1-Math.exp(-delta/(ROW_INSPECTION_ANIMATION_MS*.35));
  const levels=this.rowHoverLevels??=new Map();
  if(id&&!levels.has(id))levels.set(id,0);
  for(const [bodyId,level] of levels){
   const value=level+((bodyId===id?1:0)-level)*speeds;
   if(bodyId!==id && value<.003)levels.delete(bodyId);
   else levels.set(bodyId,value);
  }
 }
 rowInspectedRadius(body,radius){
  const level=this.settings?.row?this.rowHoverLevels?.get(body?.id)||0:0;
  if(level<=0 || !this.vp)return radius;
  const position=this.positions.get(body.id);
  const proj=position&&projected(position,this.vp,this.width,this.height);
  return proj?rowInspectionRadius(radius,proj.depth,this.height,level):radius;
 }
 rowRenderedRadiusPx(body,screen){
  const original=this.bodyRadius(body),current=this.rowInspectedRadius(body,original);
  return current*this.height/(2*Math.tan(CAMERA_FOV/2)*screen.depth);
 }
 panByPixels(dx,dy){if(dx || dy){this.markCameraMoved({positionChanged:true});panCameraByPixels(this.camera,dx,dy,this.height);}}
 /** Rotation and zoom change the view but must not disable the global follow toggle. */
 markCameraMoved({positionChanged=false}={}){
  if(this.cinema?.active)this.stopCinema(); // Manual input always wins over the flythrough.
  this.cancelCameraFlight();
  this.cameraManuallyMoved=true;
  if(this.transition)this.transition.cameraTo=null; // Manual rotation wins over an animated camera angle.
  if(positionChanged){this.focusedBodyId=null;this.stopFollowing();}
  else if(!this.followEnabled)this.focusedBodyId=null;
  this.callbacks?.onCameraChange?.(); // Immediately switch the next-view icon on pan/zoom/rotation.
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
  if(!this.transition && followMotionTooFast(this.followLastPosition,position,this.camera.desiredDist,
      this.height,now-this.followLastAtMs)){
    this.stopFollowing();return;
  }
  this.camera.desiredTarget=position.slice();
  this.followLastPosition=position.slice();this.followLastAtMs=now;
 }
 /** Return the next action without changing the camera (used by the button icon). */
 nextCameraPerspectiveIndex(){
  return nextCameraPerspectiveIndex(this.cameraPresetIndex,this.cameraManuallyMoved);
 }
 /** Manual displacement returns to oblique; every button-driven preset flies there. */
 cycleCameraPerspective({keepPlanetScene=false,now=performance.now()}={}){
  // A second click mid-flight must depart from the currently visible pose.
  if(this.cameraFlight)this.advanceCameraFlight(now);
  const animate=this.canAnimateLayout();
  const arActive=Boolean(this.camera.arView || this.cameraFlight?.restoreAR);
  let from=null,fromLook=null;
  if(animate){
   const look=this.camera.arView||this.camera.freeLook||this.camera.flightLook;
   fromLook=look?.forward?{forward:look.forward.slice(),up:look.up.slice()}
     :orbitCameraLook(this.camera.theta,this.camera.phi);
   // Translate a look-around pose into orbit coordinates WITHOUT moving its eye.
   // Retain the original gaze separately so even sensor roll does not jump.
   if(this.camera.arView)restoreOrbitFromLook(this.camera,'arView');
   if(this.camera.freeLook)restoreOrbitFromLook(this.camera);
   if(this.camera.flightLook)restoreOrbitFromLook(this.camera,'flightLook');
   from={theta:this.camera.theta,phi:this.camera.phi,dist:this.camera.dist,target:this.camera.target.slice()};
  }
  const next=this.nextCameraPerspectiveIndex();
  if(this.planetId&&!keepPlanetScene)this.reset();
  else this.applyCameraPreset(next);
  if(!animate)return;
  const angles=this.transition?.cameraTo||[this.camera.theta,this.camera.phi];
  const to={theta:angles[0],phi:angles[1],dist:this.camera.desiredDist,target:this.camera.desiredTarget.slice()};
  // Scene morphs may continue, but their angle tween must not race the flight.
  if(this.transition)this.transition.cameraTo=null;
  this.cameraFlight={at:now,duration:CAMERA_FLIGHT_MS,from,to,fromLook,
    toLook:orbitCameraLook(to.theta,to.phi),restoreAR:arActive};
  this.camera.theta=from.theta;this.camera.phi=from.phi;
  this.camera.dist=from.dist;this.camera.target=from.target.slice();
  this.camera.flightLook=fromLook;
  this.camera.flightActive=true;
 }
 /** Stop a camera ride at its visible pose, preserving its current gaze. */
 cancelCameraFlight(){
  if(!this.cameraFlight)return false;
  if(this.camera.flightLook)restoreOrbitFromLook(this.camera,'flightLook');
  this.camera.flightActive=false;
  this.cameraFlight=null;
  return true;
 }
 /** Frame-rate-independent flight of gaze, position and zoom. */
 advanceCameraFlight(now=performance.now()){
  const flight=this.cameraFlight;
  if(!flight)return;
  const progress=this.canAnimateLayout()
   ?clamp((now-flight.at)/flight.duration,0,1):1;
  const pose=cameraFlightPose(flight.from,flight.to,progress);
  this.camera.theta=pose.theta;this.camera.phi=pose.phi;
  this.camera.target=pose.target;this.camera.dist=pose.dist;
  this.camera.flightLook=cameraFlightLook(flight.fromLook,flight.toLook,progress);
  if(progress>=1){
   // At the endpoint the ordinary orbit and sensor-relative pose coincide.
   this.camera.theta=flight.to.theta;this.camera.phi=flight.to.phi;
   this.camera.target=flight.to.target.slice();this.camera.dist=flight.to.dist;
   this.camera.flightLook=null;this.camera.flightActive=false;
   if(flight.restoreAR)this.camera.arView=orbitCameraLook(flight.to.theta,flight.to.phi);
   this.cameraFlight=null;
  }
 }
  /** The camera frames the smaller bodies up close and crops most of the largest at the left. */
 rowGeometry(){
  const candidates=this.planetId
    ? [this.byId?.get(this.planetId),...this.planetChildren()].filter(Boolean)
    : this.bodies.filter(b=>b.type!=='probe');
  return rowLayout(candidates.filter(b=>this.shouldDraw(b) && Number.isFinite(b.radiusKm) && b.radiusKm>0),
   b=>this.targetBodyRadius(b),
   (body,radius)=>body.id==='saturn'?Math.max(radius,1.20*this.targetRingScale()):radius,
   this.cinema?.active && this.cinema.reorder ? 'asc' : this.settings?.rowOrder==='distance'?'distance':'desc',
   this.planetId||'sun');
 }
 /** Notify the UI without using global DOM state inside WebGL. */
 cinemaNotice(active=this.cinema?.active===true){
  const c=this.cinema;
  this.callbacks?.onCinemaChange?.({active,paused:c?.paused===true,speed:c?.speed??1,progress:c?.progress??0,
    durationMs:c?.track?.durationMs??0,objectId:c?cinemaObjectAt(c.track,c.progress):null});
 }
 /** Save the exact current camera pose, then rearrange the same visible bodies. */
 startCinema(now=performance.now()){
  if(this.cinema?.active || !cinemaEligible(this.settings))return false;
  const oldLayout=this.rowGeometry();
  if(!oldLayout.ids.length)return false;
  const saved={target:this.camera.target.slice(),dist:this.camera.dist,
    theta:this.camera.theta,phi:this.camera.phi,
    cameraManuallyMoved:this.cameraManuallyMoved,focusedBodyId:this.focusedBodyId};
  this.stopFollowing();
  const reorder=this.settings?.rowOrder!=='distance';
  this.beginTransition('cinema',now); // Capture camera and positions, even when no reorder occurs.
  this.cinema={active:true,reorder,paused:false,speed:1,progress:0,elapsedMs:0,lastAt:now,
    lastNoticeAt:now,seeking:false,endedMs:0,saved,track:null,entrySnapped:false,fadeOpacity:0};
  this._cinemaRestoreFocus=null;
  this.heldArrows?.clear();this.focusedBodyId=null;
  const track=cinemaTrack(this.rowGeometry(),this.width,this.height,this.byId);
  this.cinema.track=track;
  this.setCameraAngles(0,1.48);
  const firstPose=cinemaPoseAt(track,0);
  this.camera.desiredTarget=firstPose.target;
  this.camera.desiredDist=firstPose.distance;
  this.cameraManuallyMoved=false;
  this.calcPositions(this.simTime);
  this.cinemaNotice(true);
  return true;
 }
 /** Revert the order and fly back to the exact pre-Cinema camera pose. */
 stopCinema(now=performance.now()){
  const c=this.cinema;
  if(!c?.active)return false;
  // v98-style camera flight on exit; only the initial large-to-small
  // reorder is hidden by a fade.
  this.beginTransition('cinema',now);
  this.cinema=null;
  this._cinemaRestoreFocus=c.saved.focusedBodyId;
  this.setCameraAngles(c.saved.theta,c.saved.phi);
  this.camera.desiredTarget=c.saved.target.slice();
  this.camera.desiredDist=c.saved.dist;
  this.cameraManuallyMoved=c.saved.cameraManuallyMoved;
  this.calcPositions(this.simTime);
  this.cinemaNotice(false);
  return true;
 }
 /** Native range controls provide touch drag, mouse drag and keyboard seeking. */
 seekCinema(progress,now=performance.now()){
  const c=this.cinema;
  if(!c?.active)return false;
  c.progress=clamp(Number(progress)||0,0,1);
  c.elapsedMs=CINEMA_ENTRY_MS+c.progress*c.track.durationMs;
  c.endedMs=0;c.lastAt=now;
  // Scrubbing previews the exact continuous timeline pose, even mid-flight.
  this.finishCinemaEntry();
  const pose=cinemaSceneAt(c.track,c.progress);
  this.snapCinemaPose(pose);c.fadeOpacity=pose.opacity;
  this.cinemaNotice(true);
  return true;
 }
 setCinemaScrubbing(active,now=performance.now()){
  if(!this.cinema?.active)return;
  this.cinema.seeking=Boolean(active);
  this.cinema.lastAt=now;
 }
 /** Pause the tour without pausing the independent solar-system simulation. */
 toggleCinemaPause(now=performance.now()){
  const c=this.cinema;
  if(!c?.active)return false;
  c.paused=!c.paused;
  c.lastAt=now;
  if(!c.paused)c.endedMs=0;
  this.cinemaNotice(true);
  return c.paused;
 }
 /** Toggle between normal and double-speed Cinema playback (simulation time unaffected). */
 toggleCinemaSpeed(now=performance.now()){
  const c=this.cinema;
  if(!c?.active)return false;
  c.speed=c.speed===2?1:2;
  c.lastAt=now; // prevent an extra clock jump on the button frame
  this.cinemaNotice(true);
  return c.speed;
 }
 /** Set instantaneous and requested camera pose to the same timeline sample. */
 snapCinemaPose(pose){
  this.camera.target=pose.target.slice();this.camera.desiredTarget=pose.target.slice();
  this.camera.dist=pose.distance;this.camera.desiredDist=pose.distance;
 }
 /** Finish the entry once the reorder is dark or the distance-row flight ends. */
 finishCinemaEntry(){
  const c=this.cinema;
  if(!c?.active || c.entrySnapped)return;
  c.entrySnapped=true;
  this.transition=null;
  this.camera.theta=0;this.camera.phi=1.48;
  if(this.positions && this.bodies && this.byId)this.calcPositions(this.simTime);
 }
 advanceCinema(now=performance.now()){
  const c=this.cinema;
  if(!c?.active)return;
  if(!cinemaEligible(this.settings)){this.stopCinema(now);return;}
  // Avoid jumping a large portion of the movie after background tab suspension.
  const delta=clamp(now-c.lastAt,0,120);c.lastAt=now;
  if(!c.seeking && !c.paused){
   const playbackDelta=delta*(c.speed===2?2:1);
   c.elapsedMs=Math.min(CINEMA_ENTRY_MS+c.track.durationMs,c.elapsedMs+playbackDelta);
   c.progress=clamp((c.elapsedMs-CINEMA_ENTRY_MS)/c.track.durationMs,0,1);
   if(c.progress>=1)c.endedMs+=playbackDelta;
   if(c.endedMs>=CINEMA_END_HOLD_MS){this.stopCinema(now);return;}
  }
  if(c.elapsedMs<CINEMA_ENTRY_MS){
   if(c.reorder){
    c.fadeOpacity=cinemaEntryOpacity(c.elapsedMs);
    if(c.elapsedMs<CINEMA_ENTRY_MS*.5 && !c.entrySnapped){
     // Keep the largest-first layout/camera stationary until blackout.
     this.camera.theta=c.saved.theta;this.camera.phi=c.saved.phi;
     this.snapCinemaPose({target:c.saved.target,distance:c.saved.dist});
    }else{
     this.finishCinemaEntry();
     this.snapCinemaPose(cinemaSceneAt(c.track,0));
    }
   }else{
    // Distance order does not rearrange objects; its entry is a camera ride.
    const t=gentleEase(c.elapsedMs/CINEMA_ENTRY_MS);
    const first=cinemaSceneAt(c.track,0);
    this.camera.theta=lerp(c.saved.theta,0,t);
    this.camera.phi=lerp(c.saved.phi,1.48,t);
    this.snapCinemaPose({target:blendPosition(c.saved.target,first.target,t),
      distance:Math.exp(lerp(Math.log(Math.max(.00001,c.saved.dist)),Math.log(first.distance),t))});
    c.fadeOpacity=0;
   }
  }else{
   this.finishCinemaEntry();
   const pose=cinemaSceneAt(c.track,c.progress);
   c.fadeOpacity=pose.opacity;
   this.snapCinemaPose(pose);
  }
  if(now-c.lastNoticeAt>=90){c.lastNoticeAt=now;this.cinemaNotice(true);}
 }
 rowFrame(){return rowCameraFrame(this.rowGeometry(),this.width,this.height);}
 rowDistance(){return this.rowFrame().distance;}
 solarOverviewDistance(){return this.settings?.row ? this.rowDistance()
   : this.settings?.scaleOrbits ? 160 : optimizedSolarMode(this.settings) ? 47*OPTIMIZED_ORBIT_FACTOR : 47;}
  /** Objects actually visible in this scene, before the user changes the view. */
 visibleSceneBodies(){
  const candidates=this.planetId
    ? [this.byId.get(this.planetId),...this.planetChildren()]
    : this.bodies;
  return candidates.filter(b=>b && this.shouldDraw(b) && this.positions.has(b.id));
 }
 /** Only capture orbit strokes that the current view was drawing. */
 visibleSceneOrbits(){
  if(this.settings?.orbits===false)return [];
  if(!this.planetId)return solarOrbitBodies(this.bodies,this.settings?.layers).filter(b=>this.shouldDraw(b));
  const children=this.planetChildren().filter(b=>this.shouldDraw(b));
  const ids=planetOrbitIds(children,this.byId.get(this.selectedId));
  return children.filter(b=>ids.has(b.id) && b.a && b.periodDays);
 }
 /** Incoming bodies begin at their previous visible alpha; reversing stays seamless. */
 sceneBodyOpacity(body){
  const t=this.transition;
  if(!body || !t || t.kind!=='view')return 1;
  const from=t.fromVisualBodies.get(body.id)?.opacity ?? 0;
  return clamp(from+(1-from)*clamp(t.amount,0,1),0,1);
 }
 /** Orbit strokes have their own per-body opacity to avoid a view-switch flash. */
 sceneOrbitOpacity(body){
  const base=this.orbitOpacity();
  const t=this.transition;
  if(!body || !t || t.kind!=='view')return base;
  const from=t.fromVisualOrbits.get(body?.id)?.opacity ?? 0;
  return clamp(from+(base-from)*clamp(t.amount,0,1),0,1);
 }
 departingBodyState(snapshot,t=this.transition){
  if(!t)return snapshot;
  const alpha=clamp(t.amount,0,1);
  const destination=this.positions.get(snapshot.body.id)
    ?? this.positions.get(snapshot.body.parentId)
    ?? this.positions.get(this.planetId || t.fromPlanetId)
    ?? [0,0,0];
  return {
   ...snapshot,
   position:blendPosition(snapshot.position,destination,t.amount),
   radius:Math.max(0,lerp(snapshot.radius,this.targetBodyRadius(snapshot.body),t.amount)),
   opacity:snapshot.opacity*(1-alpha)
  };
 }
 departingOrbitState(snapshot,t=this.transition){
  if(!t)return snapshot;
  const alpha=clamp(t.amount,0,1);
  const destination=this.positions.get(this.planetId || t.fromPlanetId) ?? snapshot.center;
  return {...snapshot,center:blendPosition(snapshot.center,destination,t.amount),
    radius:Math.max(0,snapshot.radius*(1-.18*alpha)),opacity:snapshot.opacity*(1-alpha)};
 }
 /** Render disappearing bodies and their former paths while the new view fades in. */
 drawDepartingScene(vp){
  const t=this.transition;
  if(!t || t.kind!=='view')return;
  const visible=new Set(this.visibleSceneBodies().map(body=>body.id));
  const orbits=new Set(this.visibleSceneOrbits().map(body=>body.id));
  const gl=this.gl;
  gl.depthMask(false);
  for(const source of t.fromVisualOrbits.values()){
   if(orbits.has(source.body.id))continue;
   const ghost=this.departingOrbitState(source,t);
   if(ghost.opacity<=.001)continue;
   this.orbitLine(ghost.body,ghost.center,vp,ghost.alpha,ghost.selected,
     {radius:ghost.radius,opacity:ghost.opacity,settings:ghost.settings});
  }
  gl.depthMask(true);
  for(const source of t.fromVisualBodies.values()){
   if(visible.has(source.body.id))continue;
   const ghost=this.departingBodyState(source,t);
   if(ghost.opacity<=.001)continue;
   if(ghost.body.id==='saturn')this.drawRings(ghost.position,vp,
     {opacity:ghost.opacity,scale:source.ringScale});
   this.drawSphere(ghost.body,ghost.position,vp,{opacity:ghost.opacity,radius:ghost.radius});
  }
 }
 /** Respect reduced-motion preferences while retaining testable pure transition math. */
 canAnimateLayout(){
  return this.transitionsEnabled===true &&
    !(typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
 }
 /** Cache the *displayed* state before a mode change, including rapid re-toggles. */
 beginTransition(kind='scale',now=performance.now()){
  this.cancelCameraFlight();
  if(!this.canAnimateLayout()){this.transition=null;return;}
  // Snapshot what was *actually displayed* (including a partially faded
  // previous view) before replacing the active transition.
  const prior=this.transition;
  const fromOrbitOpacity=this.orbitOpacity();
  const fromPositions=new Map([...this.positions].map(([id,p])=>[id,p.slice()]));
  const fromRadii=new Map(),fromOrbits=new Map();
  for(const body of this.bodies){
    fromRadii.set(body.id,this.bodyRadius(body));
    if(body.parentId){
      const parent=this.byId.get(body.parentId);
      fromOrbits.set(body.id,this.orbitRadius(body,parent));
    }
  }
  const fromVisualBodies=new Map(),fromVisualOrbits=new Map();
  if(kind==='view'){
   const ringScale=this.ringScale();
   for(const body of this.visibleSceneBodies()){
    fromVisualBodies.set(body.id,{body,position:this.positions.get(body.id).slice(),
      radius:fromRadii.get(body.id),opacity:this.sceneBodyOpacity(body),ringScale});
   }
   const center=(this.positions.get(this.planetId||'sun')||[0,0,0]).slice();
   for(const body of this.visibleSceneOrbits()){
    const selected=body.id===this.selectedId;
    fromVisualOrbits.set(body.id,{body,center:center.slice(),radius:fromOrbits.get(body.id),
      opacity:this.sceneOrbitOpacity(body),selected,alpha:selected ? .70 : (this.planetId ? .22 : body.type==='planet' ? .20 : .16),
      settings:{orbitContrast:this.settings?.orbitContrast,galacticMotion:this.settings?.galacticMotion===true}});
   }
   if(prior?.kind==='view'){
    for(const source of prior.fromVisualBodies.values())if(!fromVisualBodies.has(source.body.id)){
     const ghost=this.departingBodyState(source,prior);
     if(ghost.opacity>.001)fromVisualBodies.set(source.body.id,ghost);
    }
    for(const source of prior.fromVisualOrbits.values())if(!fromVisualOrbits.has(source.body.id)){
     const ghost=this.departingOrbitState(source,prior);
     if(ghost.opacity>.001)fromVisualOrbits.set(source.body.id,ghost);
    }
   }
  }
  const orbitWave=kind==='planet-orbits-off' && this.planetId
    ? planetOrbitWaveDelays(this.planetChildren().filter(body=>this.shouldDraw(body))) : null;
  this.transition={kind,at:now,duration:LAYOUT_TRANSITION_MS,amount:0,progress:0,orbitWave,
    fromPositions,fromRadii,fromOrbits,fromOrbitOpacity,fromVisualBodies,fromVisualOrbits,
    fromRingScale:this.ringScale(),fromRow:!!this.settings?.row,fromPlanetId:this.planetId,
    fromView:this.planetId||'solar',cameraFrom:[this.camera.theta,this.camera.phi],cameraTo:null};
 }
 setCameraAngles(theta,phi){
  this.cancelCameraFlight();
  // A deliberate scene, row, cinema or preset change supersedes free look.
  this.camera.freeLook=null;
  if(this.transition){this.transition.cameraFrom=[this.camera.theta,this.camera.phi];this.transition.cameraTo=[theta,phi];}
  else{this.camera.theta=theta;this.camera.phi=phi;}
 }
 advanceTransition(now=performance.now()){
  const transition=this.transition;
  if(!transition)return;
  if(transition.kind==='cinema' && this.cinema?.active && this.cinema.reorder && !this.cinema.entrySnapped){
   // Do not morph the largest-first row while fading out. Even if playback
   // is paused for a long time, the reorder must happen only at blackout.
   transition.progress=0;transition.amount=0;
   return;
  }
  const progress=Math.max(0,Math.min(1,(now-transition.at)/transition.duration));
  transition.progress=progress;
  transition.amount=['planet-orbits-off','cinema'].includes(transition.kind)
    ? gentleEase(progress):rubberEase(progress);
  if(transition.cameraTo){
    this.camera.theta=transition.cameraFrom[0]+(transition.cameraTo[0]-transition.cameraFrom[0])*Math.min(1,transition.amount);
    this.camera.phi=transition.cameraFrom[1]+(transition.cameraTo[1]-transition.cameraFrom[1])*Math.min(1,transition.amount);
  }
  if(progress>=1){
   this.transition=null;
   if(this._cinemaRestoreFocus!==null){
    this.focusedBodyId=this._cinemaRestoreFocus;
    this._cinemaRestoreFocus=null;
   }
  }
 }
 orbitOpacity(){
  const transition=this.transition;
  if(!transition)return this.settings?.row ? 0 : 1;
  // Capture the last *drawn* opacity when reversing a row transition.
  // Previous code restarted from 0/1 and caused a visible blink.
  const amount=clamp(transition.amount,0,1);
  const target=this.settings?.row ? 0 : 1;
  return clamp(lerp(transition.fromOrbitOpacity,target,amount),0,1);
 }
 /** A new galactic session starts without history, regardless of playback speed. */
 resetGalacticTrails(){this._galacticTrails?.clear();}
 /** Identical wave timing for an orbit stroke and its moving moon/satellite. */
 orbitTransitionAmount(body){
  const t=this.transition;
  if(!t)return 1;
  return t.kind==='planet-orbits-off'
    ? planetOrbitWaveEase(t.progress,t.orbitWave?.get(body?.id)??0) : t.amount;
 }
 targetBodyRadius(body){
  return displayBodyRadius(body,this.settings,this.planetId?(this.byId?.get(this.planetId)||{radiusKm:1}):null);
 }
 orbitRadius(body,parent){
  const destination=displayOrbitRadius(body,parent,this.settings,this.planetId?this.byId?.get(this.planetId):null);
  const origin=this.transition?.fromOrbits?.get(body.id);
  return origin===undefined?destination:Math.max(0,origin+(destination-origin)*this.orbitTransitionAmount(body));
 }
 /** Return to the origin of the current scene after an Objekt/Bahn scale change. */
 resetViewCamera(){
  this.cancelCameraFlight();
  this.stopFollowing();
  this.focusedBodyId=null;
  this.cameraManuallyMoved=false;
  this.camera.freeLook=null;
  const row=this.settings?.row===true;
  this.cameraPresetIndex=row?2:0; // A row starts in the side-on preset.
  this.camera.desiredTarget=row?this.rowFrame().target.slice():[0,0,0];
  this.camera.desiredDist=row?this.rowDistance()
    :this.planetId?this.planetFrameDistance():this.solarOverviewDistance();
  this.setCameraAngles(row?0:.63,row?1.5:this.planetId?.84:.99);
  this.callbacks?.onCameraChange?.();
 }
 applyCameraPreset(index){
  if(!CAMERA_PERSPECTIVES[index])return false;
  this.cancelCameraFlight();
  this.camera.freeLook=null;
  this.cameraPresetIndex=index;this.cameraManuallyMoved=false;
  const tracked=this.followEnabled && this.followedBodyId===this.selectedId;
  this.focusedBodyId=tracked?this.selectedId:null;
  this.camera.desiredTarget=tracked?(this.positions.get(this.selectedId)?.slice()||[0,0,0]):(this.settings?.row?this.rowFrame().target:[0,0,0]);
  this.camera.desiredDist=this.settings?.row?this.rowDistance()
    :this.planetId?this.planetFrameDistance():this.solarOverviewDistance();
  const preset=CAMERA_PERSPECTIVES[index];
  const theta=this.settings?.row?0:.63,phi=this.planetId?preset.planetPhi:preset.phi;
  // Active AR uses the new heading immediately; device look is then calibrated
  // relative to this preset, instead of continuing to point at the old target.
  if(this.camera.arView){
    if(this.transition)this.transition.cameraTo=null;
    this.camera.theta=theta;this.camera.phi=phi;
  }else this.setCameraAngles(theta,phi);
  this.callbacks?.onCameraChange?.();
  return true;
 }
 updateKeyboard(now=performance.now()){moveCameraWithKeyboard(this,now);}
  resize(){const r=this.canvas.parentElement.getBoundingClientRect();const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));this.dpr=Math.min(window.devicePixelRatio||1,1.8);
  this.width=w;this.height=h;
  const pixelWidth=Math.round(w*this.dpr),pixelHeight=Math.round(h*this.dpr);
  // Assigning canvas.width/height recreates its framebuffer and 2D context.
  // ResizeObserver can fire again even when both pixel dimensions are unchanged.
  if(this.canvas.width!==pixelWidth || this.canvas.height!==pixelHeight ||
     this.labels.width!==pixelWidth || this.labels.height!==pixelHeight){
   this.canvas.width=pixelWidth;this.canvas.height=pixelHeight;
   this.labels.width=pixelWidth;this.labels.height=pixelHeight;
   this.gl.viewport(0,0,pixelWidth,pixelHeight);
  }
  this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.labels.style.width=w+'px';this.labels.style.height=h+'px';
  if(this.cinema?.active){
   this.cinema.track=cinemaTrack(this.rowGeometry(),this.width,this.height);
   const pose=cinemaSceneAt(this.cinema.track,this.cinema.progress);
   if(this.cinema.entrySnapped)this.snapCinemaPose(pose);
  }
  const mobile=preferredMobileQuality();
  if(this.textures && this.textures.mobile!==mobile)this.textures.setMobile(mobile);
 }
 setBodies(list){this.bodies=list;this.byId=new Map(list.map(o=>[o.id,o]));
  this._sceneRevision=(this._sceneRevision||0)+1;
  this._orbitGeometryCache?.clear(); // Drop stale geometry from replaced live catalogs.
  this._childrenSource=list;
  this._childrenByParent=new Map();
  for(const body of list){
    if(!body.parentId || body.type==='probe')continue;
    if(!this._childrenByParent.has(body.parentId))this._childrenByParent.set(body.parentId,[]);
    this._childrenByParent.get(body.parentId).push(body);
  }
  this.fourMoonIds=largestMoonIds(list);
  if(this.planetId && !['planet','dwarf'].includes(this.byId.get(this.planetId)?.type))this.reset();
  // The global "Folgen" toggle starts on; acquire the position as soon as
  // catalog entries are available and refresh it after future catalog loads.
  if(this.followEnabled)this.followSelectedBody();
 }
 /** The planet and its direct natural/artificial orbiters form an isolated scene. */
 planetChildren(id=this.planetId){
  return this._childrenSource===this.bodies
    ? (this._childrenByParent?.get(id)||[])
    : planetChildrenFor(this.bodies,id); // Support embedders that set bodies directly.
 }
 planetFrameDistance(id=this.planetId){return planetFrameDistance(this.width,this.height,this.byId.get(id),this.planetChildren(id),this.settings);}
  showPlanetSystem(id){if(!['planet','dwarf'].includes(this.byId.get(id)?.type))return false;
  const animated=this.canAnimateLayout();
  if(animated)this.beginTransition('view');
  this.planetId=id;this.markCameraMoved();
  this.cameraPresetIndex=0;
  this.setCameraAngles(.63,.84);
  this.callbacks?.onCameraChange?.();
  if(!animated)this.camera.target=[0,0,0];this.camera.desiredTarget=this.settings?.row?this.rowFrame().target:[0,0,0];
  const frame=this.settings?.row?this.rowDistance():this.planetFrameDistance(id);
  if(!animated)this.camera.dist=frame;this.camera.desiredDist=frame;
  this.calcPositions(this.simTime);
  if(this.followEnabled)this.followSelectedBody();
  return true;
 }
 setSelected(id,{focus=false}={}){
  // A new selection restores the ordinary orbit camera at exactly the same
  // eye/gaze before focus animation starts. Clearing selection does not jump.
  if(id!==null && id!==undefined && this.camera.freeLook)
    restoreOrbitFromLook(this.camera);
  const changed=id!==this.selectedId;
  this.selectedId=id;
  if(this.followEnabled && changed){this.followSelectedBody();return;}
  if(focus && id!==this.followedBodyId)this.focus(id);
  else if(id!==this.focusedBodyId && !this.followEnabled)this.focusedBodyId=null;
 }
 focus(id){const b=this.byId.get(id);if(!b)return;
  if(this.camera.freeLook)restoreOrbitFromLook(this.camera);
  this.markCameraMoved();this.focusedBodyId=id;
  if(this.planetId){
   if(id===this.planetId){this.camera.desiredTarget=[0,0,0];this.camera.desiredDist=this.planetFrameDistance();}
   else if(b.parentId===this.planetId){
    const pos=this.positions.get(id);if(pos)this.camera.desiredTarget=pos.slice();
    this.camera.desiredDist=b.type==='satellite'?5.5:6.5;
   }
   if(this.settings?.scaleObjects){
    const radius=this.bodyRadius(b);
    if(radius>0)this.camera.desiredDist=Math.max(this.minCameraDistance()*2,radius*10);
   }
   return;
  }
  const pos=this.positions.get(id);if(pos)this.camera.desiredTarget=pos.slice();
  const dist=b.type==='star'?24:b.type==='planet'?10.5:b.type==='moon'?3.8:b.type==='satellite'?3.6:b.type==='dwarf'?8.7:7.5;
  const radius=this.settings?.scaleObjects?this.bodyRadius(b):0;
  this.camera.desiredDist=radius>0?Math.max(this.minCameraDistance()*2,radius*10):dist;
 }
 /** Overview always exits the isolated planet view and returns to the solar system. */
 reset(){const wasPlanet=Boolean(this.planetId);
  const animated=wasPlanet && this.canAnimateLayout();
  if(animated)this.beginTransition('view');
  this.planetId=null;
  this.applyCameraPreset(0);
  if(wasPlanet){
    if(!animated){this.camera.target=[0,0,0];this.camera.dist=this.solarOverviewDistance();}
    this.calcPositions(this.simTime);
    if(this.followEnabled)this.followSelectedBody();
  }
 }
 setOverride(id,date,vector){this.overrides.set(id,{date,vector});this._sceneRevision=(this._sceneRevision||0)+1;}
 renderOrbitTime(body,timeMs){
  const clocks=this.visualAngularClocks;
  return clocks?.frameAt!=null?clocks.sample(body.id,'orbit',timeMs,Number(body.periodDays)*DAY_MS):timeMs;
 }
 renderSpinTime(body,timeMs){
  // Tidal locking follows the same bounded orbital phase as its parent-facing direction.
  if(body.synchronousRotation===true && Number(body.periodDays)>0)return this.renderOrbitTime(body,timeMs);
  const clocks=this.visualAngularClocks;
  return clocks?.frameAt!=null?clocks.sample(body.id,'spin',timeMs,Math.abs(Number(body.rotationPeriodHours))*3600000):timeMs;
 }
 calcPositions(timeMs){
  computePositions(this,timeMs);
  if(this.settings?.row){
    const layout=this.rowGeometry();
    // Stable order is also used by the alternating above/below row labels.
    this._rowLabelOrder=new Map(layout.ids.map((id,index)=>[id,index]));
    for(const [id,position] of layout.positions)this.positions.set(id,position);
  }else this._rowLabelOrder=null;
  const transition=this.transition;
  if(transition){
    for(const [id,target] of this.positions){
      // A newly visible child enters at its parent's old location if absent.
      const source=transition.fromPositions.get(id)
        ?? transition.fromPositions.get(this.byId.get(id)?.parentId)
        ?? target;
      const amount=transition.kind==='planet-orbits-off'
        ? this.orbitTransitionAmount(this.byId.get(id)) : transition.amount;
      this.positions.set(id,blendPosition(source,target,amount));
    }
  }
 }
  shouldDraw(b){
  if(this.settings?.row){
    // The row shows only the view's center and its immediate children, not
    // nested moons in the Solar scene or nested binary companions.
    const centerId=this.planetId||'sun';
    if(b.id!==centerId && b.parentId!==centerId)return false;
    // Unknown / placeholder sizes must not create tiny visual dots or movie stops.
    if(!Number.isFinite(b.radiusKm)||b.radiusKm<=0)return false;
  }
  if(!layerEnabled(this.settings?.layers,b.type))return false;
  // Categories are actual scene layers, not only catalog filters.
  // The four-moons cap affects actual spheres, labels, picking and orbit strokes.
  if(b.type==='moon' && this.settings?.fourMoons===true && !this.fourMoonIds?.has(b.id))return false;
  return b.type!=='probe'; // Missions without ephemerides remain catalog-only.
 }
 start(time,selected,settings){
  this.simTime=time;this.selectedId=selected;this.settings=settings;
  // Re-entering galactic mode (including through presets or scene changes)
  // always starts a new, empty recording instead of restoring old history.
  const recording=Boolean(settings?.galacticMotion && settings?.orbits && !settings?.row && !this.planetId);
  if(recording!==this._galacticTrailModeActive){
    this.resetGalacticTrails();
    this._galacticTrailModeActive=recording;
  }
  const layers=settings?.layers;
  const rowLayers=settings?.row ? (layers?.mode==='all' ? 'all' : [...(layers?.types||[])].sort().join(',')) : '';
  const frameKey=[time,this.planetId||'solar',!!settings?.scaleOrbits,!!settings?.scaleObjects,
    !!settings?.row,settings?.row?!!settings?.fourMoons:'',rowLayers,this._sceneRevision||0].join('|');
  // The camera and GPU still render each frame. Only Kepler world positions are
  // reused when simulated time and scene geometry did not change.
  // The recording never changes the body's live Kepler position.
  const positionsUnchanged=!this.transition;
  if(positionsUnchanged && !this.cinema?.active && this.positions?.size && this._lastPositionFrameKey===frameKey)return;
  this.calcPositions(time);
  this._lastPositionFrameKey=positionsUnchanged && !this.cinema?.active ? frameKey : null;
 }
  minCameraDistance(){return this.settings?.scaleObjects || this.settings?.row ? 0.000005 : 2.2;}
  maxCameraDistance(){
    if(this.settings?.row)return Math.max(100,this.rowDistance()*2.8);
    return this.planetId && this.settings?.scaleOrbits
      ? Math.max(100,this.planetFrameDistance()*1.5)
      : this.settings?.scaleOrbits ? 350 : !this.planetId && optimizedSolarMode(this.settings) ? 100*OPTIMIZED_ORBIT_FACTOR : 100;
  }
  bodyRadius(body){
   const target=this.targetBodyRadius(body),previous=this.transition?.fromRadii?.get(body.id);
   return previous===undefined?target:Math.max(0,previous+(target-previous)*this.transition.amount);
  }
  makeVP(visibleFocusOffset=this.visibleFocusOffset??0){this.updateKeyboard();
    // Keep the CURRENT scene center (or free-look gaze) in the uncovered part
    // of the canvas whenever the mobile sheet moves, including manual cameras.
    // Its measured CSS height already animates, so avoid additional easing lag.
    this.focusOffsetY=clamp(visibleFocusOffset,0,1);
    const far=Math.max(350,this.camera.dist*4,this.camera.desiredDist*4,this.maxCameraDistance()*1.5);
    return cameraView(this.camera,this.width,this.height,this.focusOffsetY,far);
  }
  /** A linked shader has stable uniform and attribute locations for its lifetime. */
  uniform(program,name){
   const locations=this._uniformLocations??=new Map();
   let record=locations.get(program);
   if(!record){record=new Map();locations.set(program,record);}
   if(!record.has(name))record.set(name,this.gl.getUniformLocation(program,name));
   return record.get(name);
  }
  attribute(program,name){
   const locations=this._attributeLocations??=new Map();
   let record=locations.get(program);
   if(!record){record=new Map();locations.set(program,record);}
   if(!record.has(name))record.set(name,this.gl.getAttribLocation(program,name));
   return record.get(name);
  }
  useLineProgram(vp){const gl=this.gl,p=this.lineProgram;gl.useProgram(p);
  gl.uniformMatrix4fv(this.uniform(p,'uVP'),false,vp);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.lineVB);
  const a=this.attribute(p,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  return p;
 }
 orbitLine(b,center,vp,alpha,selected,options){drawOrbitLine(this,b,center,vp,alpha,selected,options);}
  drawStars(vp){const gl=this.gl,p=this.starsProgram;gl.useProgram(p);gl.uniformMatrix4fv(this.uniform(p,'uVP'),false,vp);
  gl.uniform1f(this.uniform(p,'uPixelRatio'),this.dpr);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.starVB);
  const pos=this.attribute(p,'aPosition'),size=this.attribute(p,'aSize');gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(size);
  gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);gl.vertexAttribPointer(size,1,gl.FLOAT,false,16,12);
  gl.depthMask(false);gl.drawArrays(gl.POINTS,0,this.starCount);gl.depthMask(true);
 }
 drawSphere(body,p,vp,options={}){const gl=this.gl,program=this.bodyProgram;gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.sphereVB);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphereIB);
  const a=this.attribute(program,'aPosition'),n=this.attribute(program,'aNormal'),uv=this.attribute(program,'aUV');
  gl.enableVertexAttribArray(a);gl.enableVertexAttribArray(n);gl.enableVertexAttribArray(uv);
  gl.vertexAttribPointer(a,3,gl.FLOAT,false,32,0);gl.vertexAttribPointer(n,3,gl.FLOAT,false,32,12);
  gl.vertexAttribPointer(uv,2,gl.FLOAT,false,32,24);
  const ordinaryRadius=options.radius ?? this.bodyRadius(body);
  const r=options.radius===undefined?this.rowInspectedRadius(body,ordinaryRadius):ordinaryRadius; // HUD hover never changes the row layout.
  const opacity=clamp(options.opacity ?? this.sceneBodyOpacity(body),0,1);
  if(opacity<=.001)return;
  gl.uniform1f(this.uniform(program,'uOpacity'),opacity);
  if(opacity<.999)gl.depthMask(false);
  const modelMatrix=bodyModel(body,p,this.settings?.scaleObjects ? r : r*(this.selectedId===body.id?1.045:1),(this.renderSpinTime?.(body,this.simTime)??this.simTime));
  gl.uniformMatrix4fv(this.uniform(program,'uMVP'),false,matMul(vp,modelMatrix));
  const color=hex(body.color);gl.uniform3f(this.uniform(program,'uBase'),...color);
  const light=this.planetId?vnorm([.8,.65,1]):vnorm(vsub([0,0,0],p));
  gl.uniform3f(this.uniform(program,'uLight'),...localLightDirection(light,modelMatrix));
  gl.uniform1f(this.uniform(program,'uStyle'),STYLES[body.style]??1);
  gl.uniform1f(this.uniform(program,'uOptimizedLighting'),this.settings?.lighting==='realistic'?0:1);
  let seed=0;for(let i=0;i<body.id.length;i++)seed+=body.id.charCodeAt(i)*.11;
  gl.uniform1f(this.uniform(program,'uSeed'),seed);
  gl.uniform1f(this.uniform(program,'uTime'),this.simTime/DAY);
  const texture=this.textures?.get(body,this.planetId,this.selectedId);
  gl.uniform1f(this.uniform(program,'uHasTexture'),texture?1:0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,texture||null);
  gl.uniform1i(this.uniform(program,'uDiffuse'),0);
  gl.drawElements(gl.TRIANGLES,this.sphereCount,gl.UNSIGNED_SHORT,0);
  if(opacity<.999)gl.depthMask(true);
 }
 targetRingScale(){
  return this.settings?.scaleObjects ? this.targetBodyRadius(this.byId.get('saturn'))*2.15 : (this.planetId?2.05:1);
 }
 ringScale(){
  const target=this.targetRingScale();
  const previous=this.transition?.fromRingScale;
  return previous===undefined?target:Math.max(0,previous+(target-previous)*this.transition.amount);
 }
 drawRings(p,vp,options={}){const gl=this.gl,program=this.ringProgram;gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.ringVB);const a=this.attribute(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  const ordinaryRingScale=options.scale ?? this.ringScale();
  const saturn=this.byId.get('saturn');
  const ordinarySphere=saturn?this.bodyRadius(saturn):0;
  const ringScale=options.scale===undefined && ordinarySphere>0
    ?ordinaryRingScale*this.rowInspectedRadius(saturn,ordinarySphere)/ordinarySphere:ordinaryRingScale;
  gl.uniform1f(this.uniform(program,'uOpacity'),clamp(options.opacity ?? this.sceneBodyOpacity(this.byId.get('saturn')),0,1));
  gl.uniformMatrix4fv(this.uniform(program,'uMVP'),false,matMul(vp,ringModel(saturn,p,ringScale)));
  gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,200*6);gl.depthMask(true);
 }
 drawLabels(vp){drawSceneLabels(this,vp);}
  draw(timeMs,selectedId,settings){const gl=this.gl;if(this.width<2||this.height<2)return;
  (this.visualAngularClocks??=new VisualAngularClocks()).beginFrame(typeof performance!=='undefined'?performance.now():Date.now());
  this.advanceTransition();
  this.advanceCameraFlight();
  this.advanceCinema();
  this.start(timeMs,selectedId,settings);
  // Keep a focused object centered while its animated world position changes.
  if(this.transition && this.focusedBodyId && !this.followEnabled){
    const focused=this.positions.get(this.focusedBodyId);
    if(focused)this.camera.desiredTarget=focused.slice();
  }
  if(!this.cinema?.active)this.updateFollowTarget();
  const {vp}=this.makeVP();this.vp=vp;
  this.advanceRowInspection(vp);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  this.drawStars(vp);
  this.drawDepartingScene(vp);
  if(this.planetId)drawPlanetSystemScene(this,selectedId,settings,vp);
  else drawSolarSystemScene(this,selectedId,settings,vp);
 }
  pick(x,y){if(!this.vp)return;let best=null,dist=Infinity;
  for(const b of this.rendered){const pos=this.positions.get(b.id);if(!pos)continue;
   const p=projected(pos,this.vp,this.width,this.height);if(!p?.visible)continue;
   const radius=this.settings?.row?this.rowRenderedRadiusPx(b,p)
     :this.bodyRadius(b)*this.height/(this.camera.dist*.6);
   const d=Math.hypot(x-p.x,y-p.y);const threshold=Math.max(12,Math.min(radius+5,this.settings?.row?90:40));
   if(d<threshold&&d<dist){best=b;dist=d;}
  }
  if(best){this.callbacks.onSelect?.(best.id);}
  else{this.callbacks.onClearSelect?.();}
  return best?.id ?? null;
 }
}
