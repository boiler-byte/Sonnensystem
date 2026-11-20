import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readProjectSource} from './helpers/app-source.mjs';
import {createARMode,deviceMotionInScene,motionPanStep,cameraLookBasis} from '../src/renderer/ar-mode.js';
import {panCameraByPixels} from '../src/renderer/camera.js';

function fakeButton(parent){
 const callbacks=new Map(),classes=new Set(),attributes=new Map();
 return {
  hidden:true,classes,attributes,callbacks,parentElement:parent,
  classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name)}},
  setAttribute(name,value){attributes.set(name,value)},
  addEventListener(name,fn){callbacks.set(name,fn)},
  removeEventListener(name){callbacks.delete(name)},
  click(){callbacks.get('click')?.()}
 };
}
function fixture({permission='granted',motionPermission='granted',motionSensor=true}={}){
 const events=new Map(),docEvents=new Map(),messages=[],timers=new Set();
 const connect=(map,name,cb)=>{if(!map.has(name))map.set(name,new Set());map.get(name).add(cb)};
 const disconnect=(map,name,cb)=>map.get(name)?.delete(cb);
 const emit=(map,name,value)=>{for(const fn of map.get(name)||[])fn(value)};
 const win={isSecureContext:true,screen:{width:390,height:840,orientation:{angle:0}},
   matchMedia:()=>({matches:true}),
   DeviceOrientationEvent:function DeviceOrientationEvent(){},
   DeviceMotionEvent:motionSensor?function DeviceMotionEvent(){}:undefined,
   addEventListener(name,fn){connect(events,name,fn)},
   removeEventListener(name,fn){disconnect(events,name,fn)}
 };
 win.DeviceOrientationEvent.requestPermission=()=>Promise.resolve(permission);
 if(motionSensor)win.DeviceMotionEvent.requestPermission=()=>Promise.resolve(motionPermission);
 const doc={hidden:false,addEventListener(name,fn){connect(docEvents,name,fn)},removeEventListener(name,fn){disconnect(docEvents,name,fn)}};
 const parent={classList:{toggle(){}}},arButton=fakeButton(parent),motionButton=fakeButton(parent);
 const camera={theta:0,phi:.99,dist:40,desiredDist:40,target:[0,0,0],desiredTarget:[0,0,0]};
 const renderer={camera,height:800,selectedId:null,pans:[],markCameraMoved(){},panByPixels(dx,dy){
  this.pans.push([dx,dy]);panCameraByPixels(this.camera,dx,dy,this.height);
 }};
 const controller=createARMode(renderer,arButton,{win,nav:{maxTouchPoints:5},doc,motionButton,
  notify:m=>messages.push(m),schedule:(fn,ms)=>{const t={fn,ms,unref(){}};timers.add(t);return t},
  cancel:t=>timers.delete(t)});
 return {win,doc,events,docEvents,renderer,arButton,motionButton,controller,messages,timers,
  orientation:(alpha=0,beta=80,gamma=0)=>emit(events,'deviceorientation',{alpha,beta,gamma}),
  motion:(x,y,z,interval=16)=>emit(events,'devicemotion',{acceleration:{x,y,z},interval}),
  inclusive:(x,y,z,interval=16)=>emit(events,'devicemotion',{acceleration:null,accelerationIncludingGravity:{x,y,z},interval}),
  fire:(event,arg)=>emit(events,event,arg),hide:()=>emit(docEvents,'visibilitychange')};
}

test('v106: the directional toggle sits immediately beside AR and shares its mobile control row',async()=>{
 const [html,css,controller,readme,sw,pkg]=await Promise.all([
  'index.html','css/styles.css','src/app/ar-controller.js','README.md','sw.js','package.json'].map(readProjectSource));
 const actions=html.split('<div class="viewport-actions"')[1].split('</div>')[0];
 assert.ok(actions.indexOf('id="ar-mode-btn"')<actions.indexOf('id="ar-motion-btn"'));
 assert.ok(actions.indexOf('id="ar-motion-btn"')<actions.indexOf('id="reset-camera"'));
 assert.match(actions,/id="ar-motion-btn"[^>]*aria-pressed="false"[^>]*hidden>/);
 assert.match(css,/\.viewport-actions \.ar-motion-button\{margin-right:auto\}/);
 assert.match(controller,/motionButton:\$\('ar-motion-btn'\)/);
 assert.match(readme,/Delta v106 – AR-Bewegungsnavigation/);
 assert.match(sw,/sonnensystem-shell-v106/);
 assert.equal(JSON.parse(pkg).version,'106.0.0');
});

test('v106: motion activation requires AR, valid sensor events and an independent toggle',async()=>{
 const x=fixture();
 try{
  assert.equal(x.motionButton.hidden,true);
  assert.equal(await x.controller.activateMotion(),false,'cannot start without AR');
  await x.controller.activate();
  assert.equal(x.motionButton.hidden,true,'pending AR does not show second button');
  x.orientation();
  assert.equal(x.controller.active,true);
  assert.equal(x.motionButton.hidden,false);
  assert.equal(x.motionButton.attributes.get('aria-pressed'),'false');
  await x.controller.activateMotion();
  assert.equal(x.controller.motionPending,true);
  assert.equal(x.motionButton.attributes.get('aria-busy'),'true');
  assert.equal(x.events.get('devicemotion')?.size,1);
  x.motion(null,null,null);
  assert.equal(x.controller.motionActive,false,'incomplete sample must be ignored');
  x.motion(0,0,0);
  assert.equal(x.controller.motionActive,true);
  assert.equal(x.controller.active,true,'motion must not disable AR orientation');
  assert.equal(x.motionButton.classes.has('active'),true);
  assert.equal(x.motionButton.attributes.get('aria-pressed'),'true');
  assert.deepEqual(x.renderer.pans,[],'first sensor event only establishes neutral baseline');
  x.motion(2,0,0);
  assert.ok(x.renderer.pans.length>0);
  assert.ok(x.renderer.pans[0][0]<0,'device to the right moves viewpoint right, as in a one-finger pan');
  assert.ok(x.renderer.camera.target[0]>0);
  x.controller.stopMotion();
  assert.equal(x.controller.active,true);
  assert.equal(x.controller.motionActive,false);
  assert.equal(x.events.get('devicemotion').size,0);
  assert.equal(x.motionButton.hidden,false);
  assert.equal(x.motionButton.attributes.get('aria-pressed'),'false');
 }finally{x.controller.dispose();}
});

test('v106: backward/forward physical input maps to XZ-ground-plane panning',async()=>{
 const x=fixture();
 try{
  await x.controller.activate();x.orientation();
  await x.controller.activateMotion();x.motion(0,0,0);
  const before=x.renderer.camera.target[2];
  x.motion(0,0,-3);
  assert.ok(x.renderer.pans.at(-1)[1]>0,'device forward maps to positive one-finger pan dy');
  assert.ok(x.renderer.camera.target[2]<before,'viewpoint moves forward into the scene');
  x.controller.stopMotion();
  await x.controller.activateMotion();x.motion(0,0,0);
  const middle=x.renderer.camera.target[2];
  x.motion(0,0,3);
  assert.ok(x.renderer.pans.at(-1)[1]<0);
  assert.ok(x.renderer.camera.target[2]>middle);
 }finally{x.controller.dispose();}
});

test('v106: camera translation obeys deadzone, frame delta cap and bounded velocity',()=>{
 const basis=cameraLookBasis({theta:0,phi:Math.PI/2});
 const q=[0,0,0,1];
 assert.deepEqual(deviceMotionInScene(q,q,basis,[1,0,0]),basis.right);
 deviceMotionInScene(q,q,basis,[0,0,-1]).forEach((value,i)=>assert.ok(Math.abs(value-basis.forward[i])<1e-12));
 assert.equal(deviceMotionInScene(q,q,basis,[NaN,0,1]),null);
 const stopped=motionPanStep([0,0],[.1,0,-.1],0,.016);
 assert.deepEqual(stopped,{velocity:[0,0],dx:0,dy:0});
 const moved=motionPanStep([0,0],[2,0,-3],0,.016);
 assert.ok(moved.dx<0 && moved.dy>0);
 const extreme=motionPanStep([1e6,1e6],[1e6,0,1e6],0,5);
 assert.ok(Math.abs(extreme.dx)<=22.5 && Math.abs(extreme.dy)<=22.5);
 const noFrame=motionPanStep([10,10],[1,0,1],0,-.1);
 assert.deepEqual(noFrame.velocity,[0,0]);
});

test('v106: motion permission is requested inside the click, denial and timeout clean up listeners',async()=>{
 let asked=0;
 const x=fixture();
 try{
  await x.controller.activate();x.orientation();
  x.win.DeviceMotionEvent.requestPermission=()=>{asked++;return Promise.resolve('denied')};
  x.motionButton.click();
  assert.equal(asked,1,'permission API must run directly in the click task');
  await Promise.resolve();await Promise.resolve();
  assert.equal(x.controller.motionActive,false);
  assert.equal(x.controller.motionPending,false);
  assert.equal(x.events.get('devicemotion')?.size||0,0);
  assert.match(x.messages.at(-1),/abgelehnt/);
  x.win.DeviceMotionEvent.requestPermission=()=>Promise.resolve('granted');
  await x.controller.activateMotion();
  assert.equal(x.controller.motionPending,true);
  const timer=[...x.timers].find(t=>t.ms===2800);
  assert.ok(timer);
  timer.fn();
  assert.equal(x.controller.motionPending,false);
  assert.equal(x.events.get('devicemotion').size,0);
  assert.match(x.messages.at(-1),/Keine Bewegungsdaten/);
 }finally{x.controller.dispose();}
});

test('v106: no movement sensor, backgrounding and late permissions cannot leave a listener behind',async()=>{
 const missing=fixture({motionSensor:false});
 await missing.controller.activate();missing.orientation();
 assert.equal(missing.motionButton.hidden,false);
 assert.equal(await missing.controller.activateMotion(),false);
 assert.match(missing.messages.at(-1),/nicht verfügbar/);
 missing.controller.dispose();
 const x=fixture();
 try{
  await x.controller.activate();x.orientation();
  let resolve;
  x.win.DeviceMotionEvent.requestPermission=()=>new Promise(r=>resolve=r);
  const waiting=x.controller.activateMotion();
  x.controller.stop();
  resolve('granted');await waiting;
  assert.equal(x.controller.motionActive,false);
  assert.equal(x.controller.active,false);
  assert.equal(x.motionButton.hidden,true);
  assert.equal(x.events.get('devicemotion')?.size||0,0);
  x.win.DeviceMotionEvent.requestPermission=()=>Promise.resolve('granted');
  await x.controller.activate();x.orientation();await x.controller.activateMotion();x.motion(0,0,0);
  x.doc.hidden=true;x.hide();
  assert.equal(x.controller.active,false);
  assert.equal(x.controller.motionActive,false);
  assert.equal(x.events.get('devicemotion')?.size||0,0);
  assert.equal(x.events.get('deviceorientation')?.size||0,0);
 }finally{x.controller.dispose();}
});

test('v106: gravity-inclusive fallback filters stationary noise and freezes movement during camera flights',async()=>{
 const x=fixture();
 try{
  await x.controller.activate();x.orientation();await x.controller.activateMotion();
  x.inclusive(0,9.81,0);
  assert.equal(x.controller.motionActive,true);
  x.inclusive(0,9.81,0);
  assert.equal(x.renderer.pans.length,0,'stationary gravity must not cause translation');
  x.inclusive(3,9.81,0);
  assert.ok(x.renderer.pans.length>0);
  const count=x.renderer.pans.length;
  x.renderer.cameraFlight={};x.inclusive(4,9.81,0);
  assert.equal(x.renderer.pans.length,count);
  x.controller.stop();
  assert.equal(x.controller.motionActive,false);
  assert.equal(x.motionButton.hidden,true);
 }finally{x.controller.dispose();}
});
