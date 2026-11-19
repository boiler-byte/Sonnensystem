import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {CAMERA_FLIGHT_MS,cameraView,lookAroundFixedEye,cameraFlightPose} from '../src/renderer/camera.js';
import {cameraLookBasis,deviceOrientationQuaternion,relativeDeviceLook,createARMode} from '../src/renderer/ar-mode.js';

const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} !== ${b}`);
const vecNear=(a,b,t=1e-6)=>a.forEach((v,i)=>near(v,b[i],t));
const matNear=(a,b,t=2e-5)=>vecNear([...a],[...b],t);
const magnitude=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
function renderer(planetId=null){
 const r=Object.create(SolarRenderer.prototype);
 r.camera={theta:.63,phi:planetId?.84:.99,dist:47,desiredDist:47,
   target:[0,0,0],desiredTarget:[0,0,0]};
 r.cameraPresetIndex=0;r.cameraManuallyMoved=false;r.planetId=planetId;
 r.settings={row:false};r.callbacks={};r.height=760;r.width=390;
 r.transitionsEnabled=true;r.cameraFlight=null;r.transition=null;r.cinema=null;
 r.followEnabled=false;r.focusedBodyId=null;r.selectedId=null;
 r.stopFollowing=()=>{};r.solarOverviewDistance=()=>47;r.planetFrameDistance=()=>18;
 r.calcPositions=()=>{};r.simTime=0;
 r.beginTransition=()=>{r.cancelCameraFlight();r.transition={cameraTo:null};};
 return r;
}
function arFixture(r){
 const listeners=new Map();
 const win={isSecureContext:true,screen:{width:390,height:760,orientation:{angle:0}},
   matchMedia:()=>({matches:true}),DeviceOrientationEvent:function(){},
   addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
 const button={hidden:true,parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
   addEventListener(){},removeEventListener(){},setAttribute(){}};
 const doc={hidden:false,addEventListener(){},removeEventListener(){}};
 const mode=createARMode(r,button,{win,doc,nav:{maxTouchPoints:5},schedule:()=>({unref(){}}),cancel(){}});
 return {mode,sensor:pose=>listeners.get('deviceorientation')?.(pose)};
}

test('v70: button changes camera heading, target and zoom in a smooth 1050ms flight',()=>{
 const r=renderer();r.camera.target=[3,1,4];r.camera.desiredTarget=[3,1,4];r.camera.dist=18;r.camera.desiredDist=18;
 const original=cameraView(r.camera,r.width,r.height);
 r.cycleCameraPerspective({now:100});
 assert.equal(r.cameraPresetIndex,1);
 assert.equal(r.camera.flightActive,true);
 assert.equal(r.cameraFlight.duration,CAMERA_FLIGHT_MS);
 matNear(cameraView(r.camera,r.width,r.height).vp,original.vp);
 r.advanceCameraFlight(100+CAMERA_FLIGHT_MS/2);
 assert.ok(r.camera.phi<.99 && r.camera.phi>.16);
 assert.ok(r.camera.dist>18 && r.camera.dist<47);
 assert.ok(r.camera.target[0]>0&&r.camera.target[0]<3);
 assert.equal(r.camera.flightActive,true);
 r.advanceCameraFlight(100+CAMERA_FLIGHT_MS);
 near(r.camera.phi,.16);near(r.camera.theta,.63);near(r.camera.dist,47);
 vecNear(r.camera.target,[0,0,0]);
 assert.equal(r.cameraFlight,null);assert.equal(r.camera.flightLook,null);
 assert.equal(r.camera.flightActive,false);
 near(cameraFlightPose({theta:.63,phi:.99,dist:47,target:[0,0,0]},
    {theta:.63,phi:.16,dist:47,target:[0,0,0]},.5).phi,(.99+.16)/2);
});

test('v70: another click during the camera ride uses the displayed pose, not the first endpoint',()=>{
 const r=renderer();r.cycleCameraPerspective({now:0});
 r.advanceCameraFlight(CAMERA_FLIGHT_MS*.3);
 const visible=cameraView(r.camera,r.width,r.height);
 r.cycleCameraPerspective({now:CAMERA_FLIGHT_MS*.3});
 assert.equal(r.cameraPresetIndex,2);
 matNear(cameraView(r.camera,r.width,r.height).vp,visible.vp);
 assert.equal(r.cameraFlight.to.phi,1.54);
 r.advanceCameraFlight(CAMERA_FLIGHT_MS*1.3);
 near(r.camera.phi,1.54);assert.equal(r.cameraFlight,null);
});

test('v70: free look and sensor roll are preserved without a first-frame jump',()=>{
 const r=renderer();r.selectedId=null;
 lookAroundFixedEye(r.camera,215,-90);
 const eye=cameraView(r.camera,r.width,r.height).eye;
 const view=cameraView(r.camera,r.width,r.height).vp;
 r.cameraManuallyMoved=true;
 r.cycleCameraPerspective({now:0});
 assert.equal(r.cameraPresetIndex,0);
 assert.equal(r.camera.freeLook,null);
 vecNear(cameraView(r.camera,r.width,r.height).eye,eye);
 matNear(cameraView(r.camera,r.width,r.height).vp,view);
 assert.equal(r.cameraManuallyMoved,false);
 r.advanceCameraFlight(CAMERA_FLIGHT_MS);
 near(r.camera.phi,.99);
});

test('v70: a manual action cancels the flight without losing the visible gaze',()=>{
 const r=renderer();r.cycleCameraPerspective({now:0});
 r.advanceCameraFlight(450);
 const visible=cameraView(r.camera,r.width,r.height);
 r.markCameraMoved();
 assert.equal(r.cameraFlight,null);assert.equal(r.camera.flightActive,false);
 assert.equal(r.cameraManuallyMoved,true);
 matNear(cameraView(r.camera,r.width,r.height).vp,visible.vp);
 r.cycleCameraPerspective({now:500});
 assert.equal(r.cameraPresetIndex,0,'the next button action restores oblique');
});

test('v70: planet overview also flies back; reduced motion stays instantaneous',()=>{
 const r=renderer('earth');r.camera.phi=.84;r.camera.dist=18;r.camera.desiredDist=18;
 r.cycleCameraPerspective({now:0});
 assert.equal(r.planetId,null);
 assert.equal(r.cameraPresetIndex,0);
 assert.equal(r.cameraFlight.to.phi,.99);
 assert.equal(r.cameraFlight.to.dist,47);
 assert.equal(r.transition.cameraTo,null,'scene morph does not override the ride');
 r.advanceCameraFlight(CAMERA_FLIGHT_MS);
 near(r.camera.phi,.99);near(r.camera.dist,47);
 const reduced=renderer();reduced.transitionsEnabled=false;
 reduced.cycleCameraPerspective({now:0});
 assert.equal(reduced.cameraFlight,null);near(reduced.camera.phi,.16);
});

test('v71: AR uses the original vertical pitch in portrait and landscape; horizontal yaw remains',()=>{
 const basis=cameraLookBasis({theta:0,phi:Math.PI/2});
 for(const angle of [0,90,180,270]){
  const reference=deviceOrientationQuaternion(0,65,0,angle);
  const up=angle%180===0
   ?deviceOrientationQuaternion(0,65+(angle===0?10:-10),0,angle)
   :deviceOrientationQuaternion(0,65,angle===90?-10:10,angle);
  const look=relativeDeviceLook(reference,up,basis);
  assert.ok(look.forward[1]>.05,`tilting up faces up (${angle} degrees)`);
  near(look.forward[0],basis.forward[0]);
 }
 const ref=deviceOrientationQuaternion(0,65,0,0);
 const yaw=deviceOrientationQuaternion(10,65,0,0);
 const look=relativeDeviceLook(ref,yaw,basis);
 assert.ok(Math.abs(look.forward[0])>.01,'horizontal yaw still works');
});

test('v70: AR button changes view with a ride; new sensor samples do not snap mid-flight',async()=>{
 const r=renderer(),x=arFixture(r);
 try{
  await x.mode.activate();
  x.sensor({alpha:0,beta:65,gamma:0});
  x.sensor({alpha:32,beta:75,gamma:17});
  const before=cameraView(r.camera,r.width,r.height);
  const sensorForward=r.camera.arView.forward.slice();
  r.cycleCameraPerspective({keepPlanetScene:true,now:0});
  assert.equal(r.camera.arView,null);
  assert.equal(x.mode.alignToPerspective(),true);
  matNear(cameraView(r.camera,r.width,r.height).vp,before.vp);
  r.advanceCameraFlight(450);
  const mid=cameraView(r.camera,r.width,r.height);
  x.sensor({alpha:42,beta:80,gamma:17});
  assert.equal(r.camera.arView,null);
  matNear(cameraView(r.camera,r.width,r.height).vp,mid.vp);
  r.advanceCameraFlight(CAMERA_FLIGHT_MS);
  const destination=cameraLookBasis(r.camera);
  vecNear(r.camera.arView.forward,destination.forward);
  const aligned=r.camera.arView.forward.slice();
  x.sensor({alpha:42,beta:80,gamma:17});
  vecNear(r.camera.arView.forward,aligned);
  x.sensor({alpha:42,beta:90,gamma:17});
  assert.ok(magnitude(r.camera.arView.forward,aligned)>.004);
  assert.ok(magnitude(sensorForward,aligned)>.004);
  assert.equal(x.mode.active,true);
 }finally{x.mode.dispose();}
});

test('v70: stopping AR mid-flight never restores an AR gaze after the transition',async()=>{
 const r=renderer(),x=arFixture(r);
 try{
  await x.mode.activate();x.sensor({alpha:0,beta:65,gamma:0});
  r.cycleCameraPerspective({keepPlanetScene:true,now:0});x.mode.alignToPerspective();
  assert.equal(r.cameraFlight.restoreAR,true);
  x.mode.stop();assert.equal(r.cameraFlight.restoreAR,false);
  r.advanceCameraFlight(CAMERA_FLIGHT_MS);
  assert.equal(r.camera.arView,null);
  assert.equal(r.cameraFlight,null);
 }finally{x.mode.dispose();}
});
