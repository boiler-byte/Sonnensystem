import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {CAMERA_PERSPECTIVES,nextCameraPerspectiveIndex,cameraView} from '../src/renderer/camera.js';
import {cameraLookBasis,createARMode} from '../src/renderer/ar-mode.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';

const close=(a,b,t=.0001)=>assert.ok(Math.abs(a-b)<t,`expected ${a} ≈ ${b}`);
const vectorClose=(a,b,t=.0001)=>a.forEach((v,i)=>close(v,b[i],t));
const separation=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function makeRenderer(planetId=null){
 const r=Object.create(SolarRenderer.prototype);
 r.camera={theta:.63,phi:planetId?.84:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
 r.cameraPresetIndex=0;r.cameraManuallyMoved=false;r.planetId=planetId;
 r.settings={row:false};r.callbacks={};r.height=760;r.width=390;r.cinema=null;r.transition=null;
 r.stopFollowing=()=>{};r.solarOverviewDistance=()=>47;r.planetFrameDistance=()=>18;
 r.calcPositions=()=>{};r.simTime=0;
 return r;
}
function iconFixture(renderer){
 const icons=[{id:'free'},...CAMERA_PERSPECTIVES].map(p=>({dataset:{perspective:p.id},hidden:true,
  setAttribute(name){if(name==='hidden')this.hidden=true;},
  removeAttribute(name){if(name==='hidden')this.hidden=false;}}));
 const attrs=new Map(),button={title:'',setAttribute:(name,value)=>attrs.set(name,value),querySelectorAll:()=>icons};
 const panel={classList:{toggle(){}},setAttribute(){}};
 const doc={getElementById:id=>id==='reset-camera'?button:panel};
 const state={bodies:[{id:'saturn',name:'Saturn',type:'planet'}]};
 return {icons,attrs,button,doc,state,visible:()=>icons.filter(i=>!i.hidden).map(i=>i.dataset.perspective),
   sync:(active=false)=>{
    const old=globalThis.document;globalThis.document=doc;
    try{syncSceneMode(state,renderer,active);}finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
   }};
}
function sensorFixture(renderer,notify=()=>{}){
 const listeners=new Map();
 const on=(name,cb)=>listeners.set(name,new Set([...(listeners.get(name)||[]),cb]));
 const off=(name,cb)=>listeners.get(name)?.delete(cb);
 const win={isSecureContext:true,screen:{width:390,height:840,orientation:{angle:0}},
  matchMedia:()=>({matches:true}),DeviceOrientationEvent: function(){},
  addEventListener:on,removeEventListener:off};
 const button={hidden:true,parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
  setAttribute(){},addEventListener(){},removeEventListener(){}};
 const doc={hidden:false,addEventListener(){},removeEventListener(){}};
 const mode=createARMode(renderer,button,{win,nav:{maxTouchPoints:5},doc,notify,
   schedule:()=>({unref(){}}),cancel(){}});
 return {mode,listeners,sensor:orientation=>{for(const fn of listeners.get('deviceorientation')||[])fn(orientation);}};
}

test('v69: camera direction icons include free view, plus the three existing presets',async()=>{
 assert.deepEqual(CAMERA_PERSPECTIVES.map(p=>p.id),['oblique','topdown','side']);
 assert.equal(nextCameraPerspectiveIndex(0,false),1);
 assert.equal(nextCameraPerspectiveIndex(1,false),2);
 assert.equal(nextCameraPerspectiveIndex(2,false),0);
 assert.equal(nextCameraPerspectiveIndex(2,true),0);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const markup=html.slice(html.indexOf('id="reset-camera"'),html.indexOf('</button>',html.indexOf('id="reset-camera"')));
 assert.equal((markup.match(/<svg\b/g)||[]).length,4);
 for(const id of ['free','oblique','topdown','side'])assert.match(markup,new RegExp(`data-perspective="${id}"`));
 assert.match(markup,/rotate\(142 12 12\)/);
 assert.match(markup,/rotate\(90 12 12\)/);
 assert.match(markup,/rotate\(180 12 12\)/);
 assert.match(markup,/<circle cx="12" cy="12" r="5\.1"/);
 assert.match(await readFile(new URL('../css/styles.css',import.meta.url),'utf8'),/\.camera-reset-button svg\[hidden\]\{display:none!important\}/);
});

test('v69: current icon and next-action accessibility update immediately on cycling and movement',()=>{
 const r=makeRenderer(),ui=iconFixture(r);
 r.callbacks.onCameraChange=()=>ui.sync();ui.sync();
 assert.deepEqual(ui.visible(),['oblique']);
 assert.equal(ui.attrs.get('aria-label'),'Nächste Perspektive: Topdown');
 r.cycleCameraPerspective();close(r.camera.phi,.16);
 assert.deepEqual(ui.visible(),['topdown']);
 r.cycleCameraPerspective();close(r.camera.phi,1.54);
 assert.deepEqual(ui.visible(),['side']);
 r.panByPixels(11,4); // Uses the existing renderer input path and marks a displacement.
 assert.deepEqual(ui.visible(),['free']);
 assert.equal(r.cameraManuallyMoved,true);
 r.cycleCameraPerspective();
 assert.equal(r.cameraPresetIndex,0);close(r.camera.phi,.99);
 assert.deepEqual(ui.visible(),['oblique']);
 r.markCameraMoved();assert.deepEqual(ui.visible(),['free']);
});

test('v58: AR sensor rotation alone never interrupts the perspective cycle',async()=>{
 const r=makeRenderer(),ui=iconFixture(r),s=sensorFixture(r);let updates=0;
 r.callbacks.onCameraChange=()=>{updates++;ui.sync(true);};
 await s.mode.activate();
 s.sensor({alpha:20,beta:70,gamma:-10});
 assert.equal(s.mode.active,true);assert.equal(r.cameraManuallyMoved,false);
 ui.sync(true);assert.deepEqual(ui.visible(),['oblique']);
 const firstEye=cameraView(r.camera,390,760).eye;
 s.sensor({alpha:85,beta:58,gamma:18});
 assert.equal(r.cameraManuallyMoved,false,'looking around is not panning');
 assert.deepEqual(ui.visible(),['oblique']);
 const turned=r.camera.arView.forward;
 assert.ok(separation(turned,cameraLookBasis(r.camera).forward)>.02);
 r.cycleCameraPerspective({keepPlanetScene:true});
 assert.equal(r.cameraPresetIndex,1);close(r.camera.phi,.16);
 assert.equal(s.mode.alignToPerspective(),true);
 vectorClose(r.camera.arView.forward,cameraLookBasis(r.camera).forward);
 vectorClose(r.camera.arView.up,cameraLookBasis(r.camera).up);
 assert.ok(separation(firstEye,cameraView(r.camera,390,760).eye)>1);
 assert.deepEqual(ui.visible(),['topdown']);
 s.sensor({alpha:85,beta:58,gamma:18});
 vectorClose(r.camera.arView.forward,cameraLookBasis(r.camera).forward);
 r.cycleCameraPerspective({keepPlanetScene:true});
 assert.equal(s.mode.alignToPerspective(),true);
 assert.equal(r.cameraPresetIndex,2);close(r.camera.phi,1.54);
 assert.deepEqual(ui.visible(),['side']);
 s.sensor({alpha:90,beta:62,gamma:22});
 assert.equal(r.cameraManuallyMoved,false);
 assert.equal(s.listeners.get('deviceorientation').size,1,'same sensor listener is retained');
 s.mode.dispose();
});

test('v87: camera cycles within a planet scene with and without AR; reset explicitly exits',()=>{
 const r=makeRenderer('saturn'),ui=iconFixture(r);
 r.callbacks.onCameraChange=()=>ui.sync(true);
 ui.sync(true);
 assert.deepEqual(ui.visible(),['oblique']);
 assert.equal(ui.button.title,'AR: Nächste Perspektive: Topdown');
 r.cycleCameraPerspective({keepPlanetScene:true});
 assert.equal(r.planetId,'saturn');
 assert.equal(r.camera.desiredDist,18,'planet distance, not solar overview');
 assert.equal(r.cameraPresetIndex,1);
 assert.deepEqual(ui.visible(),['topdown']);
 ui.sync(false);
 assert.equal(ui.button.title,'Nächste Perspektive: Seitlich');
 assert.deepEqual(ui.visible(),['topdown']);
 r.cycleCameraPerspective({keepPlanetScene:true});
 assert.equal(r.planetId,'saturn');
 assert.deepEqual(ui.visible(),['side']);
 r.reset();
 assert.equal(r.planetId,null);
});

test('v58: manually moving or zooming an AR camera returns next action to oblique',async()=>{
 const r=makeRenderer(),s=sensorFixture(r),ui=iconFixture(r);
 r.callbacks.onCameraChange=()=>ui.sync(true);
 await s.mode.activate();s.sensor({alpha:0,beta:70,gamma:0});
 r.cycleCameraPerspective({keepPlanetScene:true});s.mode.alignToPerspective();
 assert.deepEqual(ui.visible(),['topdown']);
 r.markCameraMoved({positionChanged:true});
 assert.deepEqual(ui.visible(),['free']);
 r.cycleCameraPerspective({keepPlanetScene:true});s.mode.alignToPerspective();
 assert.equal(r.cameraPresetIndex,0);assert.deepEqual(ui.visible(),['oblique']);
 s.mode.dispose();
});

test('v58: AR switch uses the existing sensor session rather than requesting new permission',async()=>{
 const app=await readAppSource();
 assert.match(app,/cycleCameraPerspective\(\{keepPlanetScene:true\}\);[\s\S]*?if\(arMode\?\.active\)arMode\.alignToPerspective\(\);/);
 assert.doesNotMatch(app,/if\(arMode\?\.active\)\{\s*arMode\.recenter\(\)/);
 assert.match(app,/onCameraChange:\(\)=>syncSceneMode\(S,renderer,arMode\?\.active\)/);
 assert.match(app,/\$\('back-to-solar'\)\.addEventListener\('click',[\s\S]*?renderer\.reset\(\);[\s\S]*?updateMode\(\)/);
});
