/**
 * Smartphone motion look-around. The camera stays at its current eye position:
 * device orientation changes its forward/up vectors rather than orbiting the
 * selected body. No camera/media/location permissions are requested.
 */
import { clamp, vnorm, dot, cross } from './math.js';
import { restoreOrbitFromLook } from './camera.js';

const DEG=Math.PI/180;
const normalize=q=>{const n=Math.hypot(...q)||1;return q.map(v=>v/n);};
const mul=(a,b)=>[
 a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
 a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
 a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
 a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]
];
const conjugate=q=>[-q[0],-q[1],-q[2],q[3]];
export function rotateVector(q,v){
 const [x,y,z,w]=q;
 const t=[2*(y*v[2]-z*v[1]),2*(z*v[0]-x*v[2]),2*(x*v[1]-y*v[0])];
 return [v[0]+w*t[0]+y*t[2]-z*t[1],v[1]+w*t[1]+z*t[0]-x*t[2],v[2]+w*t[2]+x*t[1]-y*t[0]];
}

/** The intrinsic Z-X-Y device rotation plus portrait camera/screen correction. */
export function deviceOrientationQuaternion(alpha,beta,gamma,screenAngle=0){
 if(![alpha,beta,gamma,screenAngle].every(Number.isFinite))return null;
 const x=beta*DEG/2,y=alpha*DEG/2,z=-gamma*DEG/2;
 const c1=Math.cos(x),c2=Math.cos(y),c3=Math.cos(z),s1=Math.sin(x),s2=Math.sin(y),s3=Math.sin(z);
 const euler=[
  s1*c2*c3+c1*s2*s3,
  c1*s2*c3-s1*c2*s3,
  c1*c2*s3-s1*s2*c3,
  c1*c2*c3+s1*s2*s3
 ]; // Euler order YXZ, as used by a portrait-held virtual camera.
 const faceForward=[-Math.SQRT1_2,0,0,Math.SQRT1_2];
 const screen=[0,0,Math.sin(-screenAngle*DEG/2),Math.cos(-screenAngle*DEG/2)];
 return normalize(mul(mul(euler,faceForward),screen));
}

export function cameraLookBasis(camera){
 const {phi,theta}=camera;
 const forward=vnorm([-Math.sin(phi)*Math.sin(theta),-Math.cos(phi),-Math.sin(phi)*Math.cos(theta)]);
 const back=forward.map(v=>-v);
 const right=vnorm(cross([0,1,0],back));
 const up=vnorm(cross(back,right));
 return {forward,right,up,back};
}

/** Apply sensor-relative movement in the frame where AR was started. */
export function relativeDeviceLook(reference,current,basis){
 const q=normalize(mul(conjugate(reference),current));
 const transform=local=>{
  const v=rotateVector(q,local);
  return vnorm([0,1,2].map(i=>basis.right[i]*v[0]+basis.up[i]*v[1]+basis.back[i]*v[2]));
 };
 return {forward:transform([0,0,-1]),up:transform([0,1,0])};
}

function smoothLook(old,next){
 if(!old)return next;
 const a=.35;
 const forward=vnorm(next.forward.map((v,i)=>old.forward[i]*(1-a)+v*a));
 const draft=vnorm(next.up.map((v,i)=>old.up[i]*(1-a)+v*a));
 const d=dot(draft,forward);
 const up=vnorm(draft.map((v,i)=>v-forward[i]*d));
 return {forward,up};
}

/** Map acceleration from the handset into the current AR camera's scene. */
export function deviceMotionInScene(reference,current,basis,acceleration){
 if(!reference||!current||!basis||!acceleration?.every(Number.isFinite))return null;
 const relative=normalize(mul(conjugate(reference),current));
 const local=rotateVector(relative,acceleration);
 return [0,1,2].map(i=>basis.right[i]*local[0]+basis.up[i]*local[1]+basis.back[i]*local[2]);
}

/** Acceleration-based movement is a damped gesture, NOT absolute 6DOF tracking. */
export function motionPanStep(velocity,acceleration,theta,dt){
 if(!acceleration?.every(Number.isFinite)||!Number.isFinite(theta)||!Number.isFinite(dt)||dt<=0)
  return {velocity:[0,0],dx:0,dy:0};
 const seconds=clamp(dt,.008,.05);
 const right=[Math.cos(theta),0,-Math.sin(theta)];
 const forward=[-Math.sin(theta),0,-Math.cos(theta)];
 const deadzone=value=>Math.sign(value)*Math.max(0,Math.abs(value)-.3);
 const accelR=deadzone(clamp(dot(acceleration,right),-8,8));
 const accelF=deadzone(clamp(dot(acceleration,forward),-8,8));
 const friction=Math.exp(-4*seconds);
 const vR=clamp((velocity?.[0]||0)*friction+accelR*650*seconds,-450,450);
 const vF=clamp((velocity?.[1]||0)*friction+accelF*650*seconds,-450,450);
 const next=[Math.abs(vR)<.5?0:vR,Math.abs(vF)<.5?0:vF];
 // panByPixels() moves the viewpoint opposite the dragged screen image.
 return {velocity:next,dx:next[0]?-next[0]*seconds:0,dy:next[1]?next[1]*seconds:0};
}

/** Render device-look as an ordinary orbit camera again without a view jump. */
export function restoreOrbitFromDeviceLook(camera){
 restoreOrbitFromLook(camera,'arView');
}

/** Show the control only where motion sensors can actually be requested. */
export function supportsARLook(win=globalThis.window,nav=globalThis.navigator){
 return Boolean(win?.isSecureContext===true && typeof win.DeviceOrientationEvent==='function'
  && Number(nav?.maxTouchPoints)>0 && win.matchMedia?.('(pointer: coarse)')?.matches
  && Math.min(win.screen?.width||Infinity,win.screen?.height||Infinity)<=850);
}

/**
 * Permission request is made synchronously from the AR click, before any await.
 * A valid first sensor event is required before the button becomes active.
 */
export function createARMode(renderer,button,{win=globalThis.window,nav=globalThis.navigator,doc=globalThis.document,motionButton=null,notify=()=>{},onStateChange=()=>{},schedule=setTimeout,cancel=clearTimeout}={}){
 let active=false,pending=false,disposed=false,reference=null,latestOrientation=null,basis=null,timeout=null,session=0;
 let motionActive=false,motionPending=false,motionTimeout=null,motionSession=0;
 let motionVelocity=[0,0],gravity=null;
 const available=supportsARLook(win,nav);
 const syncMotion=()=>{
  if(!motionButton)return;
  motionButton.hidden=!active;
  motionButton.classList.toggle('active',motionActive);
  motionButton.classList.toggle('pending',motionPending);
  motionButton.setAttribute('aria-pressed',String(motionActive));
  motionButton.setAttribute('aria-busy',String(motionPending));
  const label=motionActive?'AR-Bewegungsnavigation ausschalten'
   :motionPending?'AR-Bewegungsnavigation wird aktiviert'
   :'AR-Bewegungsnavigation einschalten: Smartphone vor, zurück, links oder rechts bewegen';
  motionButton.setAttribute('aria-label',label);
  motionButton.title=label;
 };
 const sync=()=>{
  button.hidden=!available;
  button.classList.toggle('active',active);
  button.classList.toggle('pending',pending);
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-busy',String(pending));
  button.title=active?'AR-Modus: An – zum Ausschalten tippen':pending?'AR-Modus: wartet auf Bewegungsdaten':'AR-Modus: Umsehen durch Bewegung des Smartphones';
  button.parentElement?.classList.toggle('ar-available',available);
  syncMotion();
  onStateChange(active);
 };
 const stopMotion=(message,silent=false)=>{
  ++motionSession;
  if(motionTimeout!==null){cancel(motionTimeout);motionTimeout=null;}
  win?.removeEventListener?.('devicemotion',onMotion);
  const wasActive=motionActive;
  motionActive=false;motionPending=false;motionVelocity=[0,0];gravity=null;
  if(!disposed)syncMotion();
  if(!silent){
   if(message)notify(message);
   else if(wasActive&&active)notify('AR-Bewegung: Aus');
  }
 };
 const stop=(message)=>{
  session++;
  // The second toggle must never keep listening after AR ends.
  stopMotion(undefined,true);
  if(timeout!==null){cancel(timeout);timeout=null;}
  win?.removeEventListener?.('deviceorientation',onOrientation);
  const wasOn=active;
  // An AR camera ride may continue, but must not reactivate device look at its end.
  if(renderer?.cameraFlight?.restoreAR)renderer.cameraFlight.restoreAR=false;
  active=false;pending=false;reference=null;latestOrientation=null;basis=null;
  if(renderer?.camera?.arView){
   restoreOrbitFromDeviceLook(renderer.camera);
   renderer.markCameraMoved?.({positionChanged:true});
  }
  if(!disposed)sync();
  if(message)notify(message);
  else if(wasOn)notify('AR-Modus: Aus');
 };
 const onOrientation=event=>{
  if(!active&&!pending)return;
  const angle=Number(win?.screen?.orientation?.angle ?? win?.orientation ?? 0);
  const current=deviceOrientationQuaternion(event.alpha,event.beta,event.gamma,angle);
  if(!current)return;
  latestOrientation=current;
  if(!reference){
   // The sensor takes over the last manually chosen, stationary direction
   // without snapping back to the old target-orbit orientation.
   if(renderer.cameraFlight)renderer.cancelCameraFlight?.();
   if(renderer.camera.freeLook)restoreOrbitFromLook(renderer.camera);
   reference=current;basis=cameraLookBasis(renderer.camera);
   // Start at the current view, never snap to a compass heading.
   renderer.camera.desiredTarget=renderer.camera.target.slice();
   renderer.camera.desiredDist=renderer.camera.dist;
   // Looking around by sensor rotates the gaze, not the camera's position.
   // Do not mark the preset as manually displaced, so AR can cycle all views.
   active=true;pending=false;
   if(timeout!==null){cancel(timeout);timeout=null;}
   notify('AR-Modus: An – Smartphone zum Umsehen bewegen');
   sync();
  }
  if(renderer.cameraFlight?.restoreAR){
   // During the flight, update the neutral phone posture instead of letting
   // fresh sensor samples override its in-between view.
   reference=current;
   return;
  }
  if(!renderer.camera.arView){
   // A manual gesture may have interrupted the flight. Resume sensor look
   // at its current direction rather than jumping to the original preset.
   reference=current;basis=cameraLookBasis(renderer.camera);
  }
  // Follow the device's natural pitch again: phone up = look up.
  const next=relativeDeviceLook(reference,current,basis);
  renderer.camera.arView=smoothLook(renderer.camera.arView,next);
 };
 const onMotion=event=>{
  if(!active||(!motionActive&&!motionPending)||disposed)return;
  let acceleration=null;
  const linear=event.acceleration;
  if([linear?.x,linear?.y,linear?.z].every(Number.isFinite)){
   acceleration=[linear.x,linear.y,linear.z];
   gravity=null;
  }else{
   // Some browsers expose gravity-inclusive values only. Remove the resting
   // baseline with a high-pass filter to prevent perpetual camera drift.
   const sample=event.accelerationIncludingGravity;
   if(![sample?.x,sample?.y,sample?.z].every(Number.isFinite))return;
   const raw=[sample.x,sample.y,sample.z];
   if(!gravity)gravity=raw.slice();
   acceleration=raw.map((v,i)=>v-gravity[i]);
   gravity=raw.map((v,i)=>gravity[i]*.96+v*.04);
  }
  if(!reference||!basis)return;
  if(!motionActive){
   motionPending=false;motionActive=true;
   if(motionTimeout!==null){cancel(motionTimeout);motionTimeout=null;}
   syncMotion();
   notify('AR-Bewegung: An – Smartphone vor, zurück oder seitlich bewegen');
   return; // First sample anchors the movement; never cause an initial jump.
  }
  if(renderer.cameraFlight)return;
  const sceneAcceleration=deviceMotionInScene(reference,latestOrientation||reference,basis,acceleration);
  if(!sceneAcceleration)return;
  const dt=Number.isFinite(event.interval)?event.interval/1000:.016;
  const step=motionPanStep(motionVelocity,sceneAcceleration,renderer.camera.theta,dt);
  motionVelocity=step.velocity;
  if(step.dx||step.dy)renderer.panByPixels?.(step.dx,step.dy);
 };
 const activateMotion=async()=>{
  if(!active||motionActive||motionPending||disposed||!motionButton)return false;
  if(typeof win?.DeviceMotionEvent!=='function'){
   notify('AR-Bewegung: Bewegungssensor nicht verfügbar');return false;
  }
  motionPending=true;const id=++motionSession;syncMotion();
  try{
   // On iOS this permission call must happen inside the button's click task.
   const permission=win.DeviceMotionEvent.requestPermission;
   if(typeof permission==='function'){
    const result=await permission.call(win.DeviceMotionEvent);
    if(id!==motionSession||disposed||!active)return false;
    if(result!=='granted'){stopMotion('AR-Bewegung: Sensorzugriff abgelehnt');return false;}
   }
   if(id!==motionSession||disposed||!active)return false;
   win.addEventListener('devicemotion',onMotion);
   motionTimeout=schedule(()=>{
    if(id===motionSession&&!motionActive)stopMotion('AR-Bewegung: Keine Bewegungsdaten verfügbar');
   },2800);
   motionTimeout?.unref?.();
   return true;
  }catch{
   if(id===motionSession&&!disposed)stopMotion('AR-Bewegung: Sensorzugriff nicht verfügbar');
   return false;
  }
 };
 const toggleMotion=()=>motionActive||motionPending?stopMotion():activateMotion();
 /** Align the current sensor attitude to the selected camera preset. */
 const alignToPerspective=()=>{
  if(!active||disposed||!latestOrientation||!renderer?.camera)return false;
  reference=latestOrientation;
  motionVelocity=[0,0];gravity=null;
  const destination=renderer.cameraFlight?.restoreAR?renderer.cameraFlight.to:renderer.camera;
  basis=cameraLookBasis(destination);
  // The active flight already animates the gaze: only re-anchor the sensor.
  // Without a flight, explicit AR realignment remains immediate.
  if(!renderer.cameraFlight?.restoreAR)
   renderer.camera.arView={forward:basis.forward.slice(),up:basis.up.slice()};
  return true;
 };
 /** Existing explicit realignment remains available for callers other than reset. */
 const recenter=()=>{
  if(!alignToPerspective())return false;
  notify('AR-Perspektive neu ausgerichtet');
  return true;
 };
 const activate=async()=>{
  if(!available||disposed||pending||active)return false;
  pending=true;const id=++session;sync();
  try{
   const permission=win.DeviceOrientationEvent.requestPermission;
   if(typeof permission==='function'){
    const result=await permission.call(win.DeviceOrientationEvent);
    if(id!==session||disposed)return false;
    if(result!=='granted'){stop('AR-Modus: Zugriff auf Bewegungssensoren abgelehnt');return false;}
   }
   if(id!==session||disposed)return false;
   win.addEventListener('deviceorientation',onOrientation);
   timeout=schedule(()=>{
    if(id===session&&!active)stop('AR-Modus: Keine Bewegungsdaten verfügbar');
   },2800);
   timeout?.unref?.();
   return true;
  }catch{
   if(id===session&&!disposed)stop('AR-Modus: Sensorzugriff nicht verfügbar');
   return false;
  }
 };
 const toggle=()=>active||pending?stop():activate();
 const onVisibility=()=>{if(doc?.hidden&&(active||pending))stop();};
 const onPageHide=()=>{if(active||pending)stop();};
 if(available){
  button.addEventListener('click',toggle);
  motionButton?.addEventListener('click',toggleMotion);
  doc?.addEventListener?.('visibilitychange',onVisibility);
  win?.addEventListener?.('pagehide',onPageHide);
 }
 sync();
 return {
  get available(){return available;},get active(){return active;},get pending(){return pending;},
  get motionActive(){return motionActive;},get motionPending(){return motionPending;},
  activate,stop,toggle,activateMotion,toggleMotion,stopMotion,recenter,alignToPerspective,
  dispose(){
   if(disposed)return;
   stop();disposed=true;
   if(available){button.removeEventListener?.('click',toggle);motionButton?.removeEventListener?.('click',toggleMotion);doc?.removeEventListener?.('visibilitychange',onVisibility);win?.removeEventListener?.('pagehide',onPageHide);}
  }
 };
}
