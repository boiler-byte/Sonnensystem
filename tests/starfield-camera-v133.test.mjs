import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {cameraView,orbitCameraLook} from '../src/renderer/camera.js';
import {starGeometry} from '../src/renderer/geometry.js';
import {planetFrameDistance} from '../src/renderer/planet-view.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {projected} from '../src/renderer/math.js';

const width=1000,height=680;
const camera=(distance,target=[0,0,0],extras={})=>({
  theta:.63,phi:.99,dist:distance,desiredDist:distance,
  target:target.slice(),desiredTarget:target.slice(),...extras
});
const stars=starGeometry(2200);
const point=i=>[stars[i*4],stars[i*4+1],stars[i*4+2]];
const coords=matrix=>{
  const result=new Map();
  for(let i=0;i<stars.length/4;i++){
    const pixel=projected(point(i),matrix,width,height);
    if(pixel?.visible)result.set(i,[pixel.x,pixel.y]);
  }
  return result;
};
const near=(a,b,description,tolerance=1e-4)=>assert.ok(Math.abs(a-b)<tolerance,`${description}: ${a} != ${b}`);

for(const planetId of ['jupiter','saturn','uranus','neptune']){
  test(`v133: ${planetId} keeps the same star distribution when Bahn-Maßstab changes camera distance`,()=>{
    const planet=INITIAL_BODIES.find(body=>body.id===planetId);
    const children=INITIAL_BODIES.filter(body=>body.parentId===planetId);
    const ordinaryDistance=planetFrameDistance(width,height,planet,children,{scaleOrbits:false});
    const physicalDistance=planetFrameDistance(width,height,planet,children,{scaleOrbits:true});
    assert.ok(physicalDistance>ordinaryDistance*10,`${planetId}: physical orbit must trigger a large zoom`);
    const ordinary=cameraView(camera(ordinaryDistance),width,height,0,Math.max(350,ordinaryDistance*4));
    const physical=cameraView(camera(physicalDistance),width,height,0,Math.max(350,physicalDistance*4));
    assert.notDeepEqual([...ordinary.vp],[...physical.vp], 'foreground VP must still respond to camera zoom');
    assert.deepEqual([...ordinary.starVp],[...physical.starVp], 'background VP cannot depend on camera distance');
    const before=coords(ordinary.starVp),after=coords(physical.starVp);
    assert.ok(before.size>15,`${planetId}: sky retains enough stars across the viewport`);
    assert.deepEqual([...before.keys()],[...after.keys()]);
    for(const [id,position] of before){
      near(position[0],after.get(id)[0],`${planetId}: star ${id} X`);
      near(position[1],after.get(id)[1],`${planetId}: star ${id} Y`);
    }
    const xs=[...before.values()].map(value=>value[0]);
    const ys=[...before.values()].map(value=>value[1]);
    assert.ok(Math.max(...xs)-Math.min(...xs)>width*.7,`${planetId}: stars span the viewport width`);
    assert.ok(Math.max(...ys)-Math.min(...ys)>height*.7,`${planetId}: stars span the viewport height`);
  });
}

test('v133: star background is unchanged by camera pan, distant focus and extreme close-up',()=>{
  const original=cameraView(camera(47),width,height,0,350);
  for(const [distance,target] of [[30000,[0,0,0]],[.000005,[0,0,0]],
    [470,[100,-40,25]],[30000,[100000,30000,-100000]]]){
    const moved=cameraView(camera(distance,target),width,height,0,Math.max(350,distance*4));
    for(let i=0;i<16;i++)near(original.starVp[i],moved.starVp[i],`star VP entry ${i} at distance ${distance}`,1e-5);
  }
});

test('v133: sky responds to camera heading, AR gaze and the mobile-sheet focal shift',()=>{
  const initial=cameraView(camera(50),width,height,0,350);
  const rotated=cameraView(camera(50,[0,0,0],{theta:1.2}),width,height,0,350);
  assert.notDeepEqual([...rotated.starVp],[...initial.starVp],'rotation must update the star directions');
  const ar=orbitCameraLook(1.6,1.0);
  const sensorClose=cameraView(camera(40,[3,2,5],{arView:ar}),width,height,0,350);
  const sensorFar=cameraView(camera(13000,[0,0,0],{arView:ar}),width,height,0,55000);
  for(let i=0;i<16;i++)near(sensorClose.starVp[i],sensorFar.starVp[i],`AR background rotation ${i}`,1e-5);
  const shifted=cameraView(camera(50),width,height,.39,350);
  const baseline=coords(initial.starVp),withSheet=coords(shifted.starVp);
  const matching=[...baseline.keys()].find(id=>withSheet.has(id));
  assert.ok(matching!==undefined);
  near(withSheet.get(matching)[0],baseline.get(matching)[0],'mobile horizontal optical center');
  near(withSheet.get(matching)[1]-baseline.get(matching)[1],-.39*height/2,'mobile vertical optical center');
});

test('v133: distant stars stay inside the fixed sky clipping range',()=>{
  const {starVp}=cameraView(camera(30000),width,height,.39,120000);
  const pixels=coords(starVp);
  assert.ok(pixels.size>15);
  for(const id of pixels.keys()){
    const [x,y,z]=point(id);
    const w=starVp[3]*x+starVp[7]*y+starVp[11]*z+starVp[15];
    const depth=(starVp[2]*x+starVp[6]*y+starVp[10]*z+starVp[14])/w;
    assert.ok(depth>=-1&&depth<=1,`star ${id} must not be clipped`);
  }
});

test('v133: renderer only applies sky matrix to stars; planets and labels keep scene matrix',()=>{
  const calls=[];
  const r=Object.create(SolarRenderer.prototype);
  r.width=width;r.height=height;r.camera={dist:100};r.glow={style:{}};
  r.gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,clear(){}};
  r.visualAngularClocks={beginFrame(){}};
  r.advanceTransition=()=>{};r.advanceCameraFlight=()=>{};r.advanceCinema=()=>{};
  r.start=()=>{};r.updateFollowTarget=()=>{};r.advanceRowInspection=()=>{};
  r.makeVP=()=>({vp:'scene-camera',starVp:'sky-camera'});
  r.drawStars=vp=>calls.push(['stars',vp]);r.drawDepartingScene=()=>{};
  r.planetId='saturn';r.byId=new Map([['saturn',{id:'saturn',type:'planet'}]]);
  r.planetChildren=()=>[];r.shouldDraw=()=>true;
  r.positions=new Map([['saturn',[0,0,0]]]);r.rendered=[];
  r.drawSphere=(body,p,vp)=>calls.push(['planet',vp]);
  r.drawRings=()=>{};r.drawLabels=vp=>calls.push(['labels',vp]);
  r.draw(0,null,{orbits:false});
  assert.deepEqual(calls,[['stars','sky-camera'],['planet','scene-camera'],['labels','scene-camera']]);
});

test('app version and offline cache have been updated',async()=>{
  const [html,manifest,serviceWorker]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../package.json',import.meta.url),'utf8'),
    readFile(new URL('../sw.js',import.meta.url),'utf8')]);
  // This camera regression also checks release consistency without pinning an obsolete version.
  const version=JSON.parse(manifest).version;
  const [major,minor]=version.split('.');
  assert.match(html,new RegExp(`content="V${major}\\.${minor}"`));
  assert.match(serviceWorker,new RegExp(`sonnensystem-shell-v${major}`));
});
