import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {deviceOrientationQuaternion,rotateVector,cameraLookBasis,relativeDeviceLook,restoreOrbitFromDeviceLook,supportsARLook,createARMode} from '../src/renderer/ar-mode.js';
import {cameraView} from '../src/renderer/camera.js';

const camera=()=>({theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]});
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`expected ${a} ≈ ${b}`);
const nearVector=(a,b,tol=1e-6)=>a.forEach((v,i)=>near(v,b[i],tol));
const length=v=>Math.hypot(...v);
function fixture({permission,secure=true,touch=5,coarse=true,width=390,height=844,sensor=true}={}){
  const events=new Map(),docs=new Map(),msgs=[],classes=new Set(),attrs=new Map();
  const track=(map,name,cb)=>map.set(name,new Set([...(map.get(name)||[]),cb]));
  const remove=(map,name,cb)=>map.get(name)?.delete(cb);
  const fire=(map,name,arg)=>{for(const fn of map.get(name)||[])fn(arg);};
  const window={isSecureContext:secure,screen:{width,height,orientation:{angle:0}},
    matchMedia:()=>({matches:coarse}),
    addEventListener:(name,cb)=>track(events,name,cb),
    removeEventListener:(name,cb)=>remove(events,name,cb),
    DeviceOrientationEvent:sensor?function DeviceOrientationEvent(){}:undefined};
  if(permission!==undefined && sensor)window.DeviceOrientationEvent.requestPermission=permission;
  const nav={maxTouchPoints:touch},document={hidden:false,addEventListener:(name,cb)=>track(docs,name,cb),removeEventListener:(name,cb)=>remove(docs,name,cb)};
  const parent={classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}};
  const button={hidden:true,parentElement:parent,classList:{toggle:(name,on)=>on?classes.add('button-'+name):classes.delete('button-'+name)},
    setAttribute:(name,val)=>attrs.set(name,val),addEventListener:(name,cb)=>track(events,'button-'+name,cb),removeEventListener:(name,cb)=>remove(events,'button-'+name,cb)};
  const renderer={camera:camera(),moves:[],markCameraMoved(opts){this.moves.push(opts)}};
  let timer=null,cancelled=0;
  const controller=createARMode(renderer,button,{win:window,nav,doc:document,notify:m=>msgs.push(m),
    schedule:(fn,ms)=>{timer={fn,ms,unref(){}};return timer;},cancel:t=>{if(t===timer)timer=null;cancelled++;}});
  return {window,nav,document,button,renderer,controller,events,docs,attrs,classes,msgs,
    click:()=>fire(events,'button-click'),sensor:e=>fire(events,'deviceorientation',e),hide:()=>fire(docs,'visibilitychange'),
    pagehide:()=>fire(events,'pagehide'),get timer(){return timer;},get cancelled(){return cancelled;}};
}

test('v48: AR requires secure mobile touch hardware and the orientation API',()=>{
 const x=fixture();assert.equal(supportsARLook(x.window,x.nav),true);
 assert.equal(x.controller.available,true);assert.equal(x.button.hidden,false);assert.ok(x.classes.has('ar-available'));
 assert.equal(x.attrs.get('aria-pressed'),'false');
 for(const option of [{secure:false},{sensor:false},{touch:0},{coarse:false},{width:1200,height:900}]){
  const y=fixture(option);
  assert.equal(y.controller.available,false);assert.equal(y.button.hidden,true);
  assert.equal(y.events.get('button-click')?.size||0,0,'no listeners attached on unsupported devices');
 }
 x.controller.dispose();
});

test('v48: permission is requested immediately from the click, and first sample leaves the camera unchanged',async()=>{
 let requests=0;
 const x=fixture({permission:()=>{requests++;return Promise.resolve('granted')}});
 const before=cameraView(x.renderer.camera,390,760);
 x.click(); // Must synchronously ask for permission while click activation is live.
 assert.equal(requests,1);
 assert.equal(x.controller.pending,true);assert.equal(x.attrs.get('aria-busy'),'true');
 await Promise.resolve();await Promise.resolve();
 assert.equal(x.controller.active,false,'permission alone is not sensor availability');
 assert.equal(x.events.get('deviceorientation').size,1);
 x.sensor({alpha:30,beta:60,gamma:15});
 assert.equal(x.controller.active,true);
 assert.equal(x.controller.pending,false);
 assert.equal(x.attrs.get('aria-pressed'),'true');
 assert.ok(x.classes.has('button-active'));
 assert.match(x.msgs.at(-1),/AR-Modus: An/);
 nearVector(x.renderer.camera.arView.forward,cameraLookBasis(x.renderer.camera).forward);
 const after=cameraView(x.renderer.camera,390,760);
 nearVector(after.eye,before.eye);
 after.vp.forEach((v,i)=>near(v,before.vp[i],2e-5));
 assert.equal(x.events.get('deviceorientation').size,1);
 x.controller.dispose();
 assert.equal(x.events.get('deviceorientation').size,0);
});

test('v48: sensor yaw/pitch/roll change viewing direction and horizon, without moving camera eye',async()=>{
 const x=fixture();await x.controller.activate();
 x.sensor({alpha:0,beta:60,gamma:0});
 const origin=cameraView(x.renderer.camera,390,760),base=x.renderer.camera.arView;
 x.sensor({alpha:50,beta:75,gamma:20});
 const next=x.renderer.camera.arView;
 assert.ok(length(next.forward.map((v,i)=>v-base.forward[i]))>.01,'view turns with phone');
 assert.ok(length(next.up.map((v,i)=>v-base.up[i]))>.01,'roll and pitch change horizon');
 near(length(next.forward),1);near(length(next.up),1);
 near(next.forward.reduce((n,v,i)=>n+v*next.up[i],0),0,1e-5);
 const turned=cameraView(x.renderer.camera,390,760);
 nearVector(origin.eye,turned.eye,1e-6);
 assert.ok(length([...origin.vp].map((v,i)=>v-turned.vp[i]))>.1,'WebGL view changes with device');
 x.controller.stop();
 assert.equal(x.renderer.camera.arView,null);
 nearVector(cameraView(x.renderer.camera,390,760).eye,turned.eye,1e-5);
 assert.equal(x.events.get('deviceorientation').size,0);
 assert.match(x.msgs.at(-1),/AR-Modus: Aus/);
 x.controller.dispose();
});

test('v48: the quaternion is finite, relative directions use a local calibrated reference',()=>{
 const ref=deviceOrientationQuaternion(359,85,-15,0);
 const next=deviceOrientationQuaternion(1,85,-15,0);
 near(length(ref),1,1e-10);near(length(next),1,1e-10);
 assert.equal(deviceOrientationQuaternion(NaN,0,0),null);
 assert.equal(deviceOrientationQuaternion(null,0,0),null);
 nearVector(rotateVector([0,0,0,1],[1,2,3]),[1,2,3]);
 const basis=cameraLookBasis(camera());
 const same=relativeDeviceLook(ref,ref,basis);
 nearVector(same.forward,basis.forward);
 nearVector(same.up,basis.up);
 const moved=relativeDeviceLook(ref,next,basis);
 assert.ok(length(moved.forward.map((v,i)=>v-basis.forward[i]))<.1,'359° → 1° is not a full spin');
 assert.ok(length(moved.forward.map((v,i)=>v-basis.forward[i]))>.001,'small movement is still detectable');
 const tilted=deviceOrientationQuaternion(0,60,0,90);
 assert.ok(length(tilted)>.99,'landscape screen orientation is handled');
});

test('v48: denied sensor permission, malformed events and missing samples fail without claiming active',async()=>{
 const denied=fixture({permission:()=>Promise.resolve('denied')});
 await denied.controller.activate();
 assert.equal(denied.controller.active,false);assert.equal(denied.controller.pending,false);
 assert.equal(denied.events.get('deviceorientation')?.size||0,0);
 assert.match(denied.msgs.at(-1),/abgelehnt/);
 const x=fixture();await x.controller.activate();
 x.sensor({alpha:null,beta:35,gamma:0});
 assert.equal(x.controller.active,false);
 assert.equal(x.controller.pending,true);
 assert.equal(x.timer.ms,2800);
 x.timer.fn();
 assert.equal(x.controller.pending,false);
 assert.equal(x.events.get('deviceorientation').size,0);
 assert.match(x.msgs.at(-1),/Keine Bewegungsdaten/);
 const rejected=fixture({permission:()=>Promise.reject(Error('blocked'))});
 await rejected.controller.activate();
 assert.match(rejected.msgs.at(-1),/nicht verfügbar/);
 denied.controller.dispose();x.controller.dispose();rejected.controller.dispose();
});

test('v48: rapid cancellation, backgrounding and dispose remove all listeners',async()=>{
 let resolvePermission;
 const x=fixture({permission:()=>new Promise(r=>resolvePermission=r)});
 const waiting=x.controller.activate();
 assert.equal(x.controller.pending,true);
 x.controller.stop();resolvePermission('granted');await waiting;
 assert.equal(x.controller.active,false);
 assert.equal(x.events.get('deviceorientation')?.size||0,0,'late permission cannot reopen sensor');
 x.window.DeviceOrientationEvent.requestPermission=()=>Promise.resolve('granted');
 await x.controller.activate();x.sensor({alpha:10,beta:80,gamma:0});
 assert.equal(x.controller.active,true);
 x.document.hidden=true;x.hide();
 assert.equal(x.controller.active,false);
 assert.equal(x.events.get('deviceorientation')?.size||0,0);
 x.document.hidden=false;
 await x.controller.activate();x.sensor({alpha:10,beta:80,gamma:0});x.pagehide();
 assert.equal(x.controller.active,false);
 x.controller.dispose();
 assert.equal(x.events.get('button-click').size,0);
 assert.equal(x.events.get('pagehide').size,0);
 assert.equal(x.docs.get('visibilitychange').size,0);
});

test('v48: switching off retains eye and forward direction in the normal orbit camera',()=>{
 const c=camera();c.arView={forward:[-.2,-.3,-.9327379],up:[0,1,0]};
 const initialEye=cameraView(c,390,760).eye;
 const desired=c.arView.forward.map(v=>v/length(c.arView.forward));
 restoreOrbitFromDeviceLook(c);
 assert.equal(c.arView,null);
 const transformed=cameraLookBasis(c).forward;
 nearVector(transformed,desired,1e-6);
 nearVector(cameraView(c,390,760).eye,initialEye,1e-6);
 for(const f of [[0,1,0],[0,-1,0]]){
  const pole=camera();pole.arView={forward:f,up:[0,0,1]};
  restoreOrbitFromDeviceLook(pole);
  const view=cameraView(pole,390,760);
  assert.ok([...view.vp].every(Number.isFinite),'restoring at the pole cannot make an invalid projection');
 }
});

test('v48: SVG trigger sits left of the three menus, with conditional width and correct PWA entries',async()=>{
 const root=new URL('../',import.meta.url);
 const [html,css,app,sw,pkg]=await Promise.all(['index.html','css/styles.css','src/app.js','sw.js','package.json']
  .map(f=>readFile(new URL(f,root),'utf8')));
 assert.ok(html.indexOf('id="ar-mode-btn"')<html.indexOf('id="scale-objects-btn"'));
 assert.ok(html.indexOf('id="scale-objects-btn"')<html.indexOf('id="layer-btn"'));
 assert.ok(html.indexOf('id="layer-btn"')<html.indexOf('id="speed-btn"'));
 assert.match(html,/<button class="ar-mode-button"[^>]*hidden>/);
 assert.match(html,/id="ar-mode-btn"[\s\S]*?<svg viewBox="0 0 24 24"/);
 assert.match(css,/\.viewport>\.control-panel\.ar-available\{[\s\S]*?width:calc\(4 \* var\(--control-trigger-width\)/);
 assert.doesNotMatch(css,/\.viewport>\.control-panel\.ar-available \.scale-popover/);
 assert.match(app,/arMode=createARMode\(renderer,\$\('ar-mode-btn'\)/);
 assert.match(sw,/src\/renderer\/ar-mode\.js/);
 assert.match(sw,/sonnensystem-shell-v55/);
 assert.equal(JSON.parse(pkg).version,'55.0.0');
});
