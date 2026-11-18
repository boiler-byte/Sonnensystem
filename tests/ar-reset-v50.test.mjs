import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {cameraView} from '../src/renderer/camera.js';
import {cameraLookBasis,createARMode} from '../src/renderer/ar-mode.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';

const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`expected ${a} ≈ ${b}`);
const nearVector=(a,b,tol=1e-6)=>a.forEach((v,i)=>near(v,b[i],tol));
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

function fixture({permission,available=true}={}){
 const listeners=new Map(),notifications=[],resetAttrs=new Map();
 const on=(name,handler)=>listeners.set(name,new Set([...(listeners.get(name)||[]),handler]));
 const off=(name,handler)=>listeners.get(name)?.delete(handler);
 const win={isSecureContext:available,screen:{width:390,height:844,orientation:{angle:0}},
  matchMedia:()=>({matches:true}),DeviceOrientationEvent:function DeviceOrientationEvent(){},
  addEventListener:on,removeEventListener:off};
 if(permission)win.DeviceOrientationEvent.requestPermission=permission;
 const doc={hidden:false,addEventListener(){},removeEventListener(){},getElementById(id){return id==='reset-camera'?resetButton:panel;}};
 const button={hidden:true,parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
  setAttribute(){},addEventListener:(name,cb)=>on('button-'+name,cb),removeEventListener:(name,cb)=>off('button-'+name,cb)};
 const resetButton={title:'Kamera zurücksetzen',setAttribute:(name,value)=>resetAttrs.set(name,value)};
 const panel={classList:{toggle(){}},setAttribute(){}};
 const camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
 const renderer={camera,planetId:null,moves:0,presetCalls:0,markCameraMoved(){this.moves++;},cycleCameraPerspective(){this.presetCalls++;}};
 const scene={bodies:[{id:'earth',name:'Erde',type:'planet'}]};
 const syncLabel=active=>{
  const original=globalThis.document;globalThis.document=doc;
  try{syncSceneMode(scene,renderer,active);}finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
 };
 const mode=createARMode(renderer,button,{win,nav:{maxTouchPoints:5},doc,
  notify:message=>notifications.push(message),onStateChange:syncLabel,
  schedule:()=>({unref(){}}),cancel(){}});
 const sensor=(orientation)=>{for(const handler of listeners.get('deviceorientation')||[])handler(orientation);};
 return {mode,renderer,sensor,notifications,resetButton,resetAttrs,listeners,win,syncLabel};
}

test('v50: AR camera reset re-anchors the latest valid phone posture without orbiting the eye',async()=>{
 const x=fixture();
 const start=cameraView(x.renderer.camera,390,760);
 const startBasis=cameraLookBasis(x.renderer.camera);
 const cameraBefore={...x.renderer.camera,target:x.renderer.camera.target.slice(),desiredTarget:x.renderer.camera.desiredTarget.slice()};
 await x.mode.activate();
 assert.equal(x.mode.active,false);
 x.sensor({alpha:10,beta:65,gamma:-12});
 assert.equal(x.mode.active,true);
 assert.match(x.resetButton.title,/AR-Perspektive neu ausrichten/);
 assert.match(x.resetAttrs.get('aria-label'),/AR-Perspektive neu ausrichten/);
 x.sensor({alpha:100,beta:48,gamma:27});
 const rotated=cameraView(x.renderer.camera,390,760);
 assert.ok(distance(x.renderer.camera.arView.forward,startBasis.forward)>.02);
 assert.ok(distance(rotated.vp,start.vp)>.05);
 const sensorListeners=x.listeners.get('deviceorientation').size;
 assert.equal(x.mode.recenter(),true);
 assert.match(x.notifications.at(-1),/neu ausgerichtet/);
 nearVector(x.renderer.camera.arView.forward,startBasis.forward);
 nearVector(x.renderer.camera.arView.up,startBasis.up);
 const centered=cameraView(x.renderer.camera,390,760);
 nearVector(centered.eye,start.eye);
 nearVector(centered.vp,start.vp,2e-5);
 assert.equal(x.renderer.camera.phi,cameraBefore.phi);
 assert.equal(x.renderer.camera.theta,cameraBefore.theta);
 assert.equal(x.renderer.camera.dist,cameraBefore.dist);
 assert.deepEqual(x.renderer.camera.target,cameraBefore.target);
 assert.deepEqual(x.renderer.camera.desiredTarget,cameraBefore.desiredTarget);
 assert.equal(x.renderer.presetCalls,0);
 assert.equal(x.mode.active,true);
 assert.equal(x.listeners.get('deviceorientation').size,sensorListeners);
 // Resending the posture calibrated during recenter must not turn the camera.
 x.sensor({alpha:100,beta:48,gamma:27});
 nearVector(x.renderer.camera.arView.forward,startBasis.forward);
 x.sensor({alpha:128,beta:69,gamma:10});
 assert.ok(distance(x.renderer.camera.arView.forward,startBasis.forward)>.005);
 // Repeated recenter adopts the new posture, with no new sensor permission.
 assert.equal(x.mode.recenter(),true);
 nearVector(x.renderer.camera.arView.forward,startBasis.forward);
 x.sensor({alpha:128,beta:69,gamma:10});
 nearVector(x.renderer.camera.arView.forward,startBasis.forward);
 x.mode.stop();
 assert.equal(x.resetButton.title,'Kamera zurücksetzen');
 assert.equal(x.resetAttrs.get('aria-label'),'Kamera zurücksetzen');
 assert.equal(x.renderer.camera.arView,null);
 assert.equal(x.mode.recenter(),false);
 x.mode.dispose();
});

test('v50: pending, unsupported, or stopped AR cannot recenter',async()=>{
 let resolvePermission;
 const x=fixture({permission:()=>new Promise(resolve=>{resolvePermission=resolve;})});
 const activate=x.mode.activate();
 assert.equal(x.mode.pending,true);
 assert.equal(x.mode.recenter(),false);
 assert.equal(x.resetButton.title,'Kamera zurücksetzen');
 x.sensor({alpha:20,beta:60,gamma:0}); // listener not installed while permission is pending
 assert.equal(x.mode.active,false);
 x.mode.stop();
 resolvePermission('granted');await activate;
 assert.equal(x.mode.active,false);
 assert.equal(x.listeners.get('deviceorientation')?.size||0,0);
 assert.equal(x.mode.recenter(),false);
 const unsupported=fixture({available:false});
 assert.equal(unsupported.mode.recenter(),false);
 unsupported.mode.dispose();x.mode.dispose();
});

test('v50: invalid sensor samples do not replace the current alignment reference',async()=>{
 const x=fixture();await x.mode.activate();
 x.sensor({alpha:0,beta:70,gamma:0});
 x.sensor({alpha:40,beta:75,gamma:20});
 x.sensor({alpha:null,beta:80,gamma:30});
 x.sensor({alpha:NaN,beta:80,gamma:30});
 assert.equal(x.mode.recenter(),true);
 const basis=cameraLookBasis(x.renderer.camera);
 x.sensor({alpha:40,beta:75,gamma:20});
 nearVector(x.renderer.camera.arView.forward,basis.forward);
 x.sensor({alpha:45,beta:75,gamma:20});
 assert.ok(distance(x.renderer.camera.arView.forward,basis.forward)>.001);
 x.mode.dispose();
});

test('v50: reset click chooses AR recenter only while AR is active, retaining standard camera resets otherwise',async()=>{
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/\$\('reset-camera'\)\.addEventListener\('click',\(\)=>\{\s*if\(arMode\?\.active\)\{arMode\.recenter\(\);return;\}/);
 assert.match(app,/renderer\?\.cycleCameraPerspective\(\);updateMode\(\);updateDetail\(\);mobileSheets\?\.close\(\);/);
 assert.match(app,/createARMode\(renderer,\$\('ar-mode-btn'\),\{notify:notifyToggle,onStateChange:active=>syncSceneMode\(S,renderer,active\)\}\)/);
 assert.match(app,/syncSceneMode\(S,renderer,arMode\?\.active\)/);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/id="reset-camera"[^>]*title="Kamera zurücksetzen" aria-label="Kamera zurücksetzen"/);
});


test('v50: scene-specific reset label is restored after AR ends in a planet scene',async()=>{
 const x=fixture();x.renderer.planetId='earth';
 x.syncLabel(false);
 assert.equal(x.resetButton.title,'Zurück zum Sonnensystem');
 assert.equal(x.resetAttrs.get('aria-label'),'Zurück zur Sonnensystem-Übersicht');
 await x.mode.activate();x.sensor({alpha:10,beta:70,gamma:0});
 assert.equal(x.resetButton.title,'AR-Perspektive neu ausrichten');
 x.syncLabel(true); // A scene update must not overwrite the AR reset action.
 assert.match(x.resetAttrs.get('aria-label'),/AR-Perspektive neu ausrichten/);
 x.mode.stop();
 assert.equal(x.resetButton.title,'Zurück zum Sonnensystem');
 assert.equal(x.resetAttrs.get('aria-label'),'Zurück zur Sonnensystem-Übersicht');
 x.mode.dispose();
});
