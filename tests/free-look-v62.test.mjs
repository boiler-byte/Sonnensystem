import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {cameraView,lookAroundFixedEye,restoreOrbitFromLook,panCameraByPixels} from '../src/renderer/camera.js';
import {attachCameraControls} from '../src/renderer/controls.js';
import {cameraLookBasis,createARMode} from '../src/renderer/ar-mode.js';

const approx=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<=t,`${a} !== ${b}`);
const nearVec=(a,b,t=1e-5)=>a.forEach((n,i)=>approx(n,b[i],t));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

function setup(selectedId=null){
 const handlers=new Map();
 const canvas={addEventListener:(name,fn)=>handlers.set(name,fn),setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})};
 const r=Object.create(SolarRenderer.prototype);
 r.canvas=canvas;r.selectedId=selectedId;r.height=720;r.width=1100;
 r.callbacks={};r.pointers=new Map();r.drag=null;r.gesture=null;r.gestureOrigin=null;r.heldArrows=new Set();
 r.camera={theta:.63,phi:.99,target:[4,0,7],desiredTarget:[4,0,7],dist:47,desiredDist:47};
 r.cameraManuallyMoved=false;r.followEnabled=false;r.focusedBodyId=null;r.transition=null;
 r.pick=()=>{};
 const oldDocument=globalThis.document,oldWindow=globalThis.window;
 globalThis.document={addEventListener(){},getElementById:()=>null};
 globalThis.window={addEventListener(){}};
 attachCameraControls(r);
 const emit=(type,id,x,y,pointerType='mouse',button=0,extra={})=>handlers.get(type)?.({
  target:canvas,pointerId:id,clientX:x,clientY:y,pointerType,button,shiftKey:false,...extra
 });
 const cleanup=()=>{
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
  if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
 };
 return {r,emit,cleanup};
}

test('v62: no selection + right drag turns the gaze without orbiting the camera eye',()=>{
 const {r,emit,cleanup}=setup();
 try{
  const before=cameraView(r.camera,r.width,r.height);
  const target=r.camera.target.slice(),theta=r.camera.theta,phi=r.camera.phi;
  emit('pointerdown',1,100,100,'mouse',2);
  emit('pointermove',1,165,140,'mouse',2);
  emit('pointerup',1,165,140,'mouse',2);
  const after=cameraView(r.camera,r.width,r.height);
  nearVec(after.eye,before.eye);
  assert.equal(r.camera.theta,theta,'orbit heading does not move');
  assert.equal(r.camera.phi,phi,'orbit elevation does not move');
  nearVec(r.camera.target,target);
  assert.ok(r.camera.freeLook?.forward,'free-look vector is set');
  assert.ok(distance([...after.vp],[...before.vp])>.2,'actual rendered camera gaze turns');
  assert.equal(r.cameraManuallyMoved,true,'manual movement still updates reset-icon state');
 }finally{cleanup();}
});

test('v62: without selection, synchronous two-finger swipe looks in place, pinch still zooms',()=>{
 const {r,emit,cleanup}=setup();
 try{
  const eye=cameraView(r.camera,r.width,r.height).eye;
  emit('pointerdown',10,100,100,'touch');emit('pointerdown',11,200,100,'touch');
  emit('pointermove',10,140,115,'touch');emit('pointermove',11,240,115,'touch');
  nearVec(cameraView(r.camera,r.width,r.height).eye,eye);
  assert.equal(r.camera.theta,.63);assert.equal(r.camera.phi,.99);
  approx(r.camera.dist,47);
  assert.ok(r.camera.freeLook?.forward);
  const lookTheta=r.camera.freeLook.theta;
  emit('pointerup',10,140,115,'touch');emit('pointerup',11,240,115,'touch');
  emit('pointerdown',12,100,100,'touch');emit('pointerdown',13,200,100,'touch');
  emit('pointermove',12,75,100,'touch');emit('pointermove',13,225,100,'touch');
  approx(r.camera.dist,47*100/150);
  approx(r.camera.freeLook.theta,lookTheta);
  emit('pointerup',12,75,100,'touch');emit('pointerup',13,225,100,'touch');
 }finally{cleanup();}
});

test('v62: with selected object the previous target-orbit look remains intact',()=>{
 const {r,emit,cleanup}=setup('saturn');
 try{
  const eye=cameraView(r.camera,r.width,r.height).eye;
  emit('pointerdown',1,110,120,'mouse',2);emit('pointermove',1,175,145,'mouse',2);
  emit('pointerup',1,175,145,'mouse',2);
  assert.ok(r.camera.theta<.63 && r.camera.phi>.99);
  assert.equal(r.camera.freeLook,undefined);
  assert.ok(distance(eye,cameraView(r.camera,r.width,r.height).eye)>.1);
 }finally{cleanup();}
});

test('v62: a new object selection hands free-look back to orbit camera seamlessly',()=>{
 const {r,emit,cleanup}=setup(null);
 try{
  emit('pointerdown',1,110,120,'mouse',2);emit('pointermove',1,195,142,'mouse',2);
  emit('pointerup',1,195,142,'mouse',2);
  const old=cameraView(r.camera,r.width,r.height);
  const forward=r.camera.freeLook.forward.slice();
  r.setSelected('mars');
  assert.equal(r.selectedId,'mars');assert.equal(r.camera.freeLook,null);
  const next=cameraView(r.camera,r.width,r.height);
  nearVec(next.eye,old.eye);
  nearVec(cameraLookBasis(r.camera).forward,forward);
  assert.ok(distance([...old.vp],[...next.vp])<.001,'no view jump on selection');
 }finally{cleanup();}
});

test('v62: free-looking also allows upward viewing and panning uses current gaze heading',()=>{
 const cam={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
 assert.ok(lookAroundFixedEye(cam,310,-570));
 assert.ok(cam.freeLook.phi>Math.PI/2,'the camera can look above the horizon');
 const oldTheta=cam.theta,oldTarget=cam.target.slice();
 panCameraByPixels(cam,100,0,720);
 assert.notDeepEqual(cam.target,oldTarget);
 assert.equal(cam.theta,oldTheta,'panning does not rotate the fixed-eye orbit');
 restoreOrbitFromLook(cam);
 assert.equal(cam.freeLook,null);
 const oldAngles=[cam.theta,cam.phi];
 assert.ok(oldAngles.every(Number.isFinite));
});

test('v62: explicit camera preset discards free-look and the abbreviated TNO label remains',async()=>{
 const {r,emit,cleanup}=setup();
 try{
  emit('pointerdown',1,110,120,'mouse',2);emit('pointermove',1,175,145,'mouse',2);
  emit('pointerup',1,175,145,'mouse',2);
  r.settings={row:false};r.planetId=null;r.cameraPresetIndex=0;
  r.solarOverviewDistance=()=>47;
  r.applyCameraPreset(1);
  assert.equal(r.camera.freeLook,null);
  approx(r.camera.phi,.16);
 }finally{cleanup();}
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<input type="checkbox" data-layer-type="tno" aria-label="Transneptunische Objekte"\/><span>Transnept\. Objekte<\/span>/);
 const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
});


test('v62: activating AR preserves the manually chosen free-look orientation and eye',async()=>{
 const {r,emit,cleanup}=setup();
 try{
  emit('pointerdown',4,100,100,'mouse',2);emit('pointermove',4,145,125,'mouse',2);emit('pointerup',4,145,125,'mouse',2);
  const before=cameraView(r.camera,r.width,r.height);
  const listeners=new Map();
  const win={isSecureContext:true,screen:{width:390,height:740,orientation:{angle:0}},
   matchMedia:()=>({matches:true}),DeviceOrientationEvent:function(){},
   addEventListener(name,fn){listeners.set(name,fn)},removeEventListener(name){listeners.delete(name)}};
  const button={parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
   addEventListener(){},removeEventListener(){},setAttribute(){}};
  const doc={hidden:false,addEventListener(){},removeEventListener(){}};
  const mode=createARMode(r,button,{win,nav:{maxTouchPoints:5},doc,
   schedule:()=>({unref(){}}),cancel(){}});
  try{
   await mode.activate();
   listeners.get('deviceorientation')({alpha:30,beta:72,gamma:10});
   assert.equal(mode.active,true);
   assert.equal(r.camera.freeLook,null);
   assert.ok(r.camera.arView?.forward);
   const after=cameraView(r.camera,r.width,r.height);
   nearVec(after.eye,before.eye);
   assert.ok(distance([...after.vp],[...before.vp])<.001);
  }finally{mode.dispose();}
 }finally{cleanup();}
});
