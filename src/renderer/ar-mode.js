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
export function createARMode(renderer,button,{win=globalThis.window,nav=globalThis.navigator,doc=globalThis.document,notify=()=>{},onStateChange=()=>{},schedule=setTimeout,cancel=clearTimeout}={}){
 let active=false,pending=false,disposed=false,reference=null,latestOrientation=null,basis=null,timeout=null,session=0;
 const available=supportsARLook(win,nav);
 const sync=()=>{
  button.hidden=!available;
  button.classList.toggle('active',active);
  button.classList.toggle('pending',pending);
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-busy',String(pending));
  button.title=active?'AR-Modus: An – zum Ausschalten tippen':pending?'AR-Modus: wartet auf Bewegungsdaten':'AR-Modus: Umsehen durch Bewegung des Smartphones';
  button.parentElement?.classList.toggle('ar-available',available);
  onStateChange(active);
 };
 const stop=(message)=>{
  session++;
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
 /** Align the current sensor attitude to the selected camera preset. */
 const alignToPerspective=()=>{
  if(!active||disposed||!latestOrientation||!renderer?.camera)return false;
  reference=latestOrientation;
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
  doc?.addEventListener?.('visibilitychange',onVisibility);
  win?.addEventListener?.('pagehide',onPageHide);
 }
 sync();
 return {
  get available(){return available;},get active(){return active;},get pending(){return pending;},
  activate,stop,toggle,recenter,alignToPerspective,
  dispose(){
   if(disposed)return;
   stop();disposed=true;
   if(available){button.removeEventListener?.('click',toggle);doc?.removeEventListener?.('visibilitychange',onVisibility);win?.removeEventListener?.('pagehide',onPageHide);}
  }
 };
}
