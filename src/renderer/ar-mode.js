/**
 * Smartphone motion look-around. The camera stays at its current eye position:
 * device orientation changes its forward/up vectors rather than orbiting the
 * selected body. No camera/media/location permissions are requested.
 */
import { clamp, vnorm, dot, cross } from './math.js';

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
 if(!camera?.arView)return;
 const f=vnorm(camera.arView.forward),r=camera.dist;
 const eye=[camera.target[0]+r*Math.sin(camera.phi)*Math.sin(camera.theta),
            camera.target[1]+r*Math.cos(camera.phi),
            camera.target[2]+r*Math.sin(camera.phi)*Math.cos(camera.theta)];
 // Avoid the pole singularity of the ordinary world-up orbit camera if the
 // phone is pointing straight up or down when AR is switched off.
 camera.phi=clamp(Math.acos(clamp(-f[1],-1,1)),.001,Math.PI-.001);
 camera.theta=Math.atan2(-f[0],-f[2]);
 const orbitForward=[-Math.sin(camera.phi)*Math.sin(camera.theta),
                     -Math.cos(camera.phi),
                     -Math.sin(camera.phi)*Math.cos(camera.theta)];
 camera.target=eye.map((v,i)=>v+orbitForward[i]*r);
 camera.desiredTarget=camera.target.slice();
 camera.desiredDist=r;
 camera.arView=null;
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
   reference=current;basis=cameraLookBasis(renderer.camera);
   // Start at the current view, never snap to a compass heading.
   renderer.camera.desiredTarget=renderer.camera.target.slice();
   renderer.camera.desiredDist=renderer.camera.dist;
   renderer.markCameraMoved?.();
   active=true;pending=false;
   if(timeout!==null){cancel(timeout);timeout=null;}
   notify('AR-Modus: An – Smartphone zum Umsehen bewegen');
   sync();
  }
  const next=relativeDeviceLook(reference,current,basis);
  renderer.camera.arView=smoothLook(renderer.camera.arView,next);
 };
 /** Re-anchor the phone's present attitude to the current scene-camera direction. */
 const recenter=()=>{
  if(!active||disposed||!latestOrientation||!renderer?.camera)return false;
  reference=latestOrientation;
  basis=cameraLookBasis(renderer.camera);
  // Make the alignment visible immediately. Smoothing the old AR direction
  // would otherwise pull the newly centered view away from its target.
  renderer.camera.arView={forward:basis.forward.slice(),up:basis.up.slice()};
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
  activate,stop,toggle,recenter,
  dispose(){
   if(disposed)return;
   stop();disposed=true;
   if(available){button.removeEventListener?.('click',toggle);doc?.removeEventListener?.('visibilitychange',onVisibility);win?.removeEventListener?.('pagehide',onPageHide);}
  }
 };
}
