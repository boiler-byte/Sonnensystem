import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attachCameraControls} from '../src/renderer/controls.js';
import {cameraView} from '../src/renderer/camera.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {cameraLookBasis,createARMode} from '../src/renderer/ar-mode.js';

const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const nearVector=(a,b,tol=1e-7)=>a.forEach((value,i)=>near(value,b[i],tol));

function makeGesture(selectedId=null){
 const handlers=new Map();
 const canvas={addEventListener:(type,fn)=>handlers.set(type,fn),setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})};
 const renderer=Object.create(SolarRenderer.prototype);
 Object.assign(renderer,{
  canvas,selectedId,width:1100,height:720,
  pointers:new Map(),drag:null,gesture:null,gestureOrigin:null,heldArrows:new Set(),
  camera:{theta:.63,phi:.99,target:[4,0,7],desiredTarget:[4,0,7],dist:47,desiredDist:47},
  cameraManuallyMoved:false,followEnabled:false,focusedBodyId:null,transition:null,
  pick:()=>{}
 });
 const oldDoc=globalThis.document,oldWin=globalThis.window;
 globalThis.document={addEventListener(){},getElementById:()=>null};
 globalThis.window={addEventListener(){}};
 attachCameraControls(renderer);
 const emit=(type,id,x,y,pointerType='touch',button=0)=>handlers.get(type)?.({
  target:canvas,pointerId:id,clientX:x,clientY:y,pointerType,button,shiftKey:false
 });
 const swipe=(dy,dx=0)=>{
  emit('pointerdown',1,100,100);emit('pointerdown',2,220,100);
  emit('pointermove',1,100+dx,100+dy);emit('pointermove',2,220+dx,100+dy);
  emit('pointerup',1,100+dx,100+dy);emit('pointerup',2,220+dx,100+dy);
 };
 const cleanup=()=>{
  if(oldDoc===undefined)delete globalThis.document;else globalThis.document=oldDoc;
  if(oldWin===undefined)delete globalThis.window;else globalThis.window=oldWin;
 };
 return {renderer,emit,swipe,cleanup};
}

test('v71: downward and upward two-finger swipes invert only free-look pitch at a stationary eye',()=>{
 for(const dy of [50,-50]){
  const {renderer,swipe,cleanup}=makeGesture();
  try{
   const initial=cameraView(renderer.camera,1100,720);
   swipe(dy);
   assert.ok(renderer.camera.freeLook,'free look is active');
   near(renderer.camera.freeLook.phi,.99+dy*.005/2); // only the last midpoint delta (dy/2) is applied
   assert.equal(Math.sign(renderer.camera.freeLook.phi-.99),Math.sign(dy));
   assert.equal(renderer.camera.phi,.99);
   nearVector(cameraView(renderer.camera,1100,720).eye,initial.eye);
  }finally{cleanup();}
 }
});

test('v71: horizontally aligned two-finger swipe retains its original heading',()=>{
 const {renderer,swipe,cleanup}=makeGesture();
 try{
  swipe(0,50);
  near(renderer.camera.freeLook.theta,.63-25*.0051);
  near(renderer.camera.freeLook.phi,.99);
  assert.equal(renderer.cameraManuallyMoved,true);
 }finally{cleanup();}
});

test('v71: right-button free look retains its old vertical direction',()=>{
 const {renderer,emit,cleanup}=makeGesture();
 try{
  emit('pointerdown',1,100,100,'mouse',2);
  emit('pointermove',1,100,150,'mouse',2);
  emit('pointerup',1,100,150,'mouse',2);
  near(renderer.camera.freeLook.phi,.99-50*.005);
 }finally{cleanup();}
});

test('v71: selected-object two-finger look is not reversed',()=>{
 const {renderer,swipe,cleanup}=makeGesture('mars');
 try{
  swipe(50);
  near(renderer.camera.phi,.99+25*.005);
  assert.equal(renderer.camera.freeLook,undefined);
 }finally{cleanup();}
});

test('v71: two-finger pinch retains zoom and does not rotate the free gaze',()=>{
 const {renderer,emit,cleanup}=makeGesture();
 try{
  emit('pointerdown',1,100,100);emit('pointerdown',2,200,100);
  emit('pointermove',1,75,100);emit('pointermove',2,225,100);
  near(renderer.camera.dist,47*100/150);
  assert.equal(renderer.camera.freeLook,undefined);
 }finally{cleanup();}
});

function arFixture(angle){
 const listeners=new Map();
 const win={isSecureContext:true,screen:{width:390,height:740,orientation:{angle}},
  matchMedia:()=>({matches:true}),DeviceOrientationEvent:function DeviceOrientationEvent(){},
  addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const button={parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
  addEventListener(){},removeEventListener(){},setAttribute(){}};
 const doc={hidden:false,addEventListener(){},removeEventListener(){}};
 const renderer={camera:{theta:0,phi:Math.PI/2,target:[0,0,0],desiredTarget:[0,0,0],dist:30,desiredDist:30},
  markCameraMoved(){}};
 const ar=createARMode(renderer,button,{win,doc,nav:{maxTouchPoints:5},
  schedule:()=>({unref(){}}),cancel(){}});
 const sensor=(alpha,beta,gamma)=>listeners.get('deviceorientation')?.({alpha,beta,gamma});
 return {renderer,ar,sensor};
}

test('v71: active AR sensor follows up = up and down = down in all four screen orientations',async()=>{
 for(const angle of [0,90,180,270]){
  const {renderer,ar,sensor}=arFixture(angle);
  try{
   await ar.activate();
   sensor(0,65,0);
   assert.equal(ar.active,true);
   const neutral=cameraLookBasis(renderer.camera);
   nearVector(renderer.camera.arView.forward,neutral.forward);
   // For landscape, tilting vertically corresponds to screen-local gamma.
   const delta=angle===0?10:angle===180?-10:angle===90?-10:10;
   if(angle%180===0)sensor(0,65+delta,0);else sensor(0,65,delta);
   assert.ok(renderer.camera.arView.forward[1]>.04,`screen ${angle}: up points up`);
   // Return to neutral, recenter, then tilt in the opposite direction.
   sensor(0,65,0);
   assert.equal(ar.recenter(),true);
   if(angle%180===0)sensor(0,65-delta,0);else sensor(0,65,-delta);
   assert.ok(renderer.camera.arView.forward[1]<-.04,`screen ${angle}: down points down`);
  }finally{ar.dispose();}
 }
});

test('v71: active AR still responds to horizontal yaw without changing the camera eye',async()=>{
 const {renderer,ar,sensor}=arFixture(0);
 try{
  const before=cameraView(renderer.camera,1100,720).eye;
  await ar.activate();sensor(0,65,0);sensor(20,65,0);
  assert.ok(Math.abs(renderer.camera.arView.forward[0])>.02);
  nearVector(cameraView(renderer.camera,1100,720).eye,before);
 }finally{ar.dispose();}
});
