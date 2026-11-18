import assert from 'node:assert/strict';
import {test} from 'node:test';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {createViewSettings} from '../src/data/layers.js';
import {displayBodyRadius} from '../src/data/orbital-math.js';
import {rowLayout,rowCameraFrame,rowFrameDistance} from '../src/renderer/transitions.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {attachCameraControls} from '../src/renderer/controls.js';
import {readFile} from 'node:fs/promises';

const body=id=>INITIAL_BODIES.find(b=>b.id===id);
const near=(a,b,txt)=>assert.ok(Math.abs(a-b)<Math.max(1e-10,Math.abs(b)*1e-8),`${txt}: ${a} vs ${b}`);
const rowBodies=['sun','jupiter','saturn','uranus','neptune','earth','venus','mars','mercury'].map(body).filter(Boolean);

function cameraFixture(settings=createViewSettings('solar'),ids=rowBodies.map(b=>b.id)){
  const r=Object.create(SolarRenderer.prototype);
  r.bodies=ids.map(body);r.byId=new Map(r.bodies.map(b=>[b.id,b]));r.planetId=null;
  r.settings=settings;r.settings.layers={mode:'all'};r.positions=new Map();r.overrides=new Map();
  r.width=1150;r.height=760;r.fourMoonIds=new Set(['moon']);r.selectedId='earth';
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.followEnabled=false;r.focusedBodyId=null;r.cameraManuallyMoved=false;
  r.transitionsEnabled=true;r.transition=null;r.simTime=Date.UTC(2026,10,18);
  r.calcPositions(r.simTime);
  return r;
}

function makeControls(){
  const handlers=new Map();const events=new Map(),picked=[];
  const canvas={addEventListener:(type,fn)=>handlers.set(type,fn),setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})};
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.canvas=canvas;renderer.height=760;renderer.settings={};
  renderer.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  renderer.pointers=new Map();renderer.drag=null;renderer.gesture=null;renderer.gestureOrigin=null;
  renderer.heldArrows=new Set();renderer.lastKeyboardFrameMs=null;
  renderer.pick=(...pos)=>picked.push(pos);
  const previousDocument=globalThis.document,previousWindow=globalThis.window;
  globalThis.document={addEventListener:(name,fn)=>events.set(name,fn),getElementById:()=>null};
  globalThis.window={addEventListener(){}};
  attachCameraControls(renderer);
  const emit=(type,id,x,y,pointerType='mouse',button=0,more={})=>handlers.get(type)?.({
    pointerId:id,clientX:x,clientY:y,pointerType,button,target:canvas,shiftKey:false,...more});
  const cleanup=()=>{if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
    if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;};
  return {renderer,emit,cleanup,picked};
}

test('v47: left mouse moves, right mouse looks, and simple left click still picks',()=>{
  const {renderer:r,emit,cleanup,picked}=makeControls();
  try{
    emit('pointerdown',1,100,100);emit('pointerup',1,100,100);
    assert.equal(picked.length,1,'tap selects');
    const angle=r.camera.theta;
    emit('pointerdown',2,100,100);
    emit('pointermove',2,140,125);
    emit('pointerup',2,140,125);
    assert.notDeepEqual(r.camera.target,[0,0,0],'left drag moves the scene');
    near(r.camera.theta,angle,'left drag does not look');
    assert.equal(picked.length,1,'drag never selects');
    const target=r.camera.target.slice();
    emit('pointerdown',3,100,100,'mouse',2);
    emit('pointermove',3,140,125,'mouse',2);
    emit('pointerup',3,140,125,'mouse',2);
    assert.deepEqual(r.camera.target,target,'right drag never moves the target');
    assert.ok(r.camera.theta<angle,'right drag looks around');
    assert.equal(picked.length,1,'right click never picks');
  }finally{cleanup();}
});

test('v47: one touch finger pans; two-finger horizontal/vertical swipes rotate without panning',()=>{
  const {renderer:r,emit,cleanup,picked}=makeControls();
  try{
    emit('pointerdown',10,100,100,'touch');
    emit('pointermove',10,130,116,'touch');
    emit('pointerup',10,130,116,'touch');
    assert.notDeepEqual(r.camera.target,[0,0,0],'one-finger swipe pans');
    const target=r.camera.target.slice();const theta=r.camera.theta,phi=r.camera.phi;
    emit('pointerdown',20,80,100,'touch');emit('pointerdown',21,180,100,'touch');
    emit('pointermove',20,115,100,'touch');emit('pointermove',21,215,100,'touch');
    assert.ok(r.camera.theta<theta,'strictly horizontal two-finger swipe rotates');
    emit('pointermove',20,115,125,'touch');emit('pointermove',21,215,125,'touch');
    assert.ok(r.camera.phi>phi,'vertical two-finger swipe changes tilt');
    assert.deepEqual(r.camera.target,target,'two-finger look never pans');
    near(r.camera.dist,47,'constant final finger span leaves zoom unchanged');
    emit('pointerup',20,115,125,'touch');emit('pointerup',21,215,125,'touch');
    assert.equal(r.pointers.size,0);assert.equal(picked.length,0);
  }finally{cleanup();}
});

test('v47: symmetric two-finger pinch zooms without introducing rotation; remaining finger cannot pick',()=>{
  const {renderer:r,emit,cleanup,picked}=makeControls();
  try{
    const beforeTheta=r.camera.theta,beforePhi=r.camera.phi;
    emit('pointerdown',30,100,100,'touch');emit('pointerdown',31,200,100,'touch');
    emit('pointermove',30,75,100,'touch');emit('pointermove',31,225,100,'touch');
    near(r.camera.dist,47*100/150,'pinch zoom');
    near(r.camera.theta,beforeTheta,'pinch does not change heading');
    near(r.camera.phi,beforePhi,'pinch does not change tilt');
    emit('pointerup',30,75,100,'touch');
    emit('pointerup',31,225,100,'touch');
    assert.equal(picked.length,0,'remaining finger is never a tap');
    assert.equal(r.gestureStartPoints,null,'gesture state reset');
  }finally{cleanup();}
});

test('v47: row keeps physical descending order and shrinks gaps with smaller neighbors',()=>{
  const layout=rowLayout(rowBodies,b=>displayBodyRadius(b,{scaleObjects:false}));
  assert.equal(layout.ids[0],'sun');
  assert.ok(layout.gaps[0]>layout.gaps.at(-1),'large adjacent bodies have larger gaps');
  assert.ok(layout.gaps.at(-1)<.15,'small bodies pack together');
  for(let i=1;i<layout.ids.length;i++){
    const prev=layout.ids[i-1],next=layout.ids[i];
    near(layout.positions.get(next)[0]-layout.positions.get(prev)[0],
      layout.radii.get(prev)+layout.radii.get(next)+layout.gaps[i-1],'size-based spacing');
  }
  near(layout.positions.get(layout.ids[0])[0]-layout.radii.get(layout.ids[0]),-layout.width/2,'left extent');
  near(layout.positions.get(layout.ids.at(-1))[0]+layout.radii.get(layout.ids.at(-1)),layout.width/2,'right extent');
});

test('v47: close-up row crops first body to 12% of its diameter, zooms in on next bodies',()=>{
  for(const scaleObjects of [false,true])for(const scaleOrbits of [false,true]){
    const settings={scaleObjects,scaleOrbits},layout=rowLayout(rowBodies,b=>displayBodyRadius(b,settings));
    const frame=rowCameraFrame(layout,1150,760);
    const first=layout.ids[0],center=layout.positions.get(first)[0],r=layout.radii.get(first);
    near((center+r-frame.left)/(2*r),.12,'cropped fraction of giant diameter');
    assert.ok(frame.distance>0 && frame.target[0]>center,'camera moves toward smaller bodies');
    assert.ok(frame.distance<layout.width/Math.tan(Math.PI/4.35/2),'closer than old whole-row framing');
    const horizontalTan=Math.tan((Math.PI/4.35)/2)*(1150/760);
    near(frame.target[0]-frame.distance*horizontalTan,frame.left,'largest remains at viewport edge');
    assert.ok(frame.target[0]+frame.distance*horizontalTan>=frame.right,'next planets still fit');
    assert.ok(rowCameraFrame(layout,375,760).distance>frame.distance,'portrait fit zooms out');
  }
});

test('v47: close row framing updates overview camera in both scene modes',()=>{
  const settings=createViewSettings('solar');settings.row=true;
  const r=cameraFixture(settings);
  const frame=r.rowFrame();r.applyCameraPreset(0);
  assert.deepEqual(r.camera.desiredTarget,frame.target,'solar overview moves off-center');
  near(r.camera.desiredDist,frame.distance,'solar overview is close');
  assert.ok(r.minCameraDistance()<2.2,'row view allows near zoom');
  r.planetId='earth';r.settings=createViewSettings('planet');r.settings.row=true;
  r.calcPositions(r.simTime);
  const planetFrame=r.rowFrame();r.applyCameraPreset(0);
  assert.deepEqual(r.camera.desiredTarget,planetFrame.target,'planet row also off-center');
  near(r.camera.desiredDist,planetFrame.distance,'planet row framing');
});

test('v47: empty and one-body rows keep finite distances and valid targets',()=>{
  for(const layout of [rowLayout([],()=>0),rowLayout([body('sun')],()=>1.13)]){
    const frame=rowCameraFrame(layout,375,720);
    assert.ok(frame.target.every(Number.isFinite));
    assert.ok(Number.isFinite(frame.distance)&&frame.distance>0);
    near(rowFrameDistance(layout,375,720),frame.distance,'helper parity');
  }
});

test('v47: documentation and version announce updated controls and close-up row',async()=>{
  const guide=await readFile(new URL('../docs/HILFE.md',import.meta.url),'utf8');
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(guide,/Links ziehen = (?:verschieben|bewegen)/i);
  assert.match(guide,/Rechts ziehen = umschauen/i);
  assert.match(guide,/Zwei Finger.*umschauen/i);
  assert.match(guide,/angeschnitten/i);
  assert.match(sw,/sonnensystem-shell-v62/);
  assert.match(html,/app-version" content="V62\.0/);
});
