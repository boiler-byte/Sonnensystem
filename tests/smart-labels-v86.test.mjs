import assert from 'node:assert/strict';
import {test} from 'node:test';
import {layoutSceneLabels,drawSceneLabels,ORBIT_LABEL_SPEED,solarOrbiterLabelIds} from '../src/renderer/labels.js';

const DAY=86400000;
const VP=new Float32Array([20,0,0,0, 0,20,0,0, 0,0,1,0, 0,0,0,20]);
const body=(id,type='moon',radiusKm=2,parentId=null)=>({id,name:id,type,radiusKm,parentId});

function scene(bodies,{planetId=null,selectedId='none',fourMoons=false,row=false,simTime=0}={}) {
  const dots=[],texts=[];
  const ctx={
    font:'',fillStyle:'',dots,texts,_arc:null,
    measureText:s=>({width:s.length*7}),
    setTransform(){},clearRect(){dots.length=0;texts.length=0;},
    beginPath(){this._arc=null;},arc(x,y,r){this._arc={x,y,r};},
    fill(){if(this._arc)dots.push({...this._arc,color:this.fillStyle});},stroke(){},
    strokeText(s){texts.push(s);},fillText(s){texts.push(s)}
  };
  const positions=new Map(bodies.map(b=>[b.id,[0,0,0]]));
  const renderer={
    width:640,height:420,dpr:1,rendered:bodies,byId:new Map(bodies.map(b=>[b.id,b])),
    settings:{labels:true,row,fourMoons},selectedId,planetId,simTime,positions,
    bodyRadius:()=>0,labels:{getContext:()=>ctx}
  };
  return {ctx,renderer,layout:(now=0,vp=VP)=>layoutSceneLabels(renderer,vp,ctx,now)};
}

const names=labels=>new Set(labels.map(item=>item.body.id));

test('v86: solar view labels at most four largest orbiters per planet even with Alle Monde on',()=>{
  const bodies=[body('sun','star',500),body('earth','planet',6000,'sun'),body('jupiter','planet',70000,'sun'),
    ...[100,90,80,70,60,50].map((r,i)=>body(`earth-m${i}`,'moon',r,'earth')),
    body('iss','satellite',95,'earth'),
    ...[120,110,100,90,80,70].map((r,i)=>body(`jupiter-m${i}`,'moon',r,'jupiter')),
    body('comet','comet',10,'sun')];
  const {layout,renderer}=scene(bodies,{fourMoons:false});
  const result=names(layout());
  assert.equal(result.size,12, '3 primary bodies + 1 comet + four children each for Earth and Jupiter');
  for(const id of ['sun','earth','jupiter','comet','earth-m0','iss','earth-m1','earth-m2','jupiter-m0','jupiter-m1','jupiter-m2','jupiter-m3'])
    assert.ok(result.has(id),`visible: ${id}`);
  for(const id of ['earth-m3','earth-m4','earth-m5','jupiter-m4','jupiter-m5'])
    assert.ok(!result.has(id),`hidden: ${id}`);
  assert.equal(renderer.rendered.length,bodies.length,'only labels are limited, not the scene objects');
  renderer.settings.fourMoons=true;
  assert.deepEqual(names(layout(16)),result,'the label cap is independent of Alle Monde');
});

test('v86: selected fifth moon replaces the fourth label without exceeding the limit',()=>{
  const bodies=[body('saturn','planet',60000,'sun'),...[10,9,8,7,6,5].map((r,i)=>body(`s${i}`,'moon',r,'saturn'))];
  const {layout}=scene(bodies,{selectedId:'s5'});
  const result=names(layout());
  assert.deepEqual(result,new Set(['saturn','s0','s1','s2','s5']));
  assert.equal([...result].filter(id=>id!=='saturn').length,4);
  assert.ok(solarOrbiterLabelIds(bodies,'s5',4,new Map(bodies.map(b=>[b.id,b]))).has('s5'));
});

test('v86: planet detail view remains unlimited, independently of the solar cap',()=>{
  const bodies=[body('earth','planet',6400,'sun'),...[10,9,8,7,6,5,4].map((r,i)=>body(`m${i}`,'moon',r,'earth'))];
  const {layout}=scene(bodies,{planetId:'earth'});
  assert.equal(layout().length,8);
});

test('v86: fast simulated orbital movement hides an unreadable label but not a stationary planet',()=>{
  const bodies=[body('earth','planet',6000,'sun'),body('sat','satellite',1,'earth')];
  const {renderer,layout}=scene(bodies,{planetId:'earth',simTime:100*DAY});
  assert.equal(layout(0).length,2);
  renderer.positions.set('sat',[.35,0,0]);
  renderer.simTime+=5*DAY;
  assert.deepEqual(names(layout(16)),new Set(['earth']));
  assert.ok(renderer._labelState.observations.get('sat').fast);
  renderer.simTime+=0; // paused clock, no movement
  assert.deepEqual(names(layout(32)),new Set(['earth','sat']),'label is back as soon as orbit stops');
  assert.equal(renderer._labelState.observations.get('sat').fast,false);
});

test('v86: fast motion of a parent does not count as its moon orbiting',()=>{
  const bodies=[body('sun','star',500),body('earth','planet',6000,'sun'),body('moon','moon',1700,'earth')];
  const {renderer,layout}=scene(bodies,{planetId:null,simTime:100*DAY});
  renderer.positions.set('moon',[.1,0,0]);
  layout(0);
  renderer.positions.set('earth',[.5,0,0]);
  renderer.positions.set('moon',[.6,0,0]);
  renderer.simTime+=5*DAY;
  const result=names(layout(16));
  assert.ok(result.has('moon'),'parent translation must not hide an orbitally stationary moon');
  assert.ok(!result.has('earth'),'Earth is moving around the Sun');
});

test('v86: camera-only movement never hides labels, even while simulation time advances',()=>{
  const bodies=[body('earth','planet',6000,'sun'),body('m','moon',100,'earth')];
  const {renderer,layout}=scene(bodies,{planetId:'earth',simTime:100*DAY});
  layout(0);
  const movedVP=new Float32Array(VP);
  movedVP[12]=8;
  renderer.simTime+=5*DAY;
  assert.deepEqual(names(layout(16,movedVP)),new Set(['earth','m']));
});

test('v86: fast simulated orbital motion is ignored for row animation and manual date jumps',()=>{
  const bodies=[body('earth','planet',6000,'sun'),body('m','moon',100,'earth')];
  const {renderer,layout}=scene(bodies,{planetId:'earth',simTime:100*DAY});
  layout(0);
  renderer.positions.set('m',[.4,0,0]);
  renderer.simTime+=365*DAY; // too large a step for the UI timeline to have played at this frame rate
  assert.equal(layout(16).length,2);
  renderer.settings.row=true;
  renderer._rowLabelOrder=new Map([['earth',0],['m',1]]);
  layout(32);
  renderer.positions.set('m',[-.4,0,0]);
  renderer.simTime+=5*DAY;
  assert.equal(layout(48).length,2,'row positions are animations, not orbital motion');
});

test('v86: fast selected body loses unreadable text but retains center selection marker',()=>{
  const bodies=[body('earth','planet',6000,'sun'),body('selected','moon',3,'earth')];
  const {renderer,ctx,layout}=scene(bodies,{planetId:'earth',selectedId:'selected',simTime:100*DAY});
  layout(0);
  // Set a deterministic previous frame relative to the real draw call's timestamp.
  renderer._labelState.at=performance.now()-16;
  renderer.positions.set('selected',[.35,0,0]);
  renderer.simTime+=5*DAY;
  drawSceneLabels(renderer,VP);
  assert.ok(ctx.texts.includes('EARTH'));
  assert.ok(!ctx.texts.includes('SELECTED'),'too-fast selected text is suppressed');
  assert.ok(ctx.dots.some(dot=>dot.r===2.6 && dot.color==='#e7b979'),
    'selected center marker remains even while its name is hidden');
  renderer.settings.labels=false;
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.texts.length,0);
  assert.equal(ctx.dots.length,0);
});

test('v86: a tiny fast orbiter keeps its category-colored body dot when its label vanishes',()=>{
  const bodies=[body('earth','planet',6000,'sun'),body('small','moon',1,'earth')];
  const {renderer,ctx,layout}=scene(bodies,{planetId:'earth',simTime:100*DAY});
  layout(0);
  renderer._labelState.at=performance.now()-16;
  renderer.positions.set('small',[.35,0,0]);
  renderer.simTime+=5*DAY;
  drawSceneLabels(renderer,VP);
  assert.ok(!ctx.texts.includes('SMALL'),'moving label text is hidden');
  assert.ok(ctx.dots.some(dot=>dot.r===2.2 && dot.color==='#E6EDF5'),
    "the small body's category dot stays on its position");
});

test('v86: readability threshold is pixel speed, with hysteresis but no time delay',()=>{
  assert.equal(ORBIT_LABEL_SPEED.hideAbove,190);
  assert.equal(ORBIT_LABEL_SPEED.showBelow,135);
  const bodies=[body('earth','planet',6000,'sun'),body('m','moon',2,'earth')];
  const {renderer,layout}=scene(bodies,{planetId:'earth',simTime:100*DAY});
  layout(0);
  // 0.01 world units at 640px viewport = 3.2px/16ms = 200px/s.
  renderer.positions.set('m',[.01,0,0]);renderer.simTime+=1*DAY;
  assert.ok(!names(layout(16)).has('m'));
  // 0.008 units = 160px/s, within the lower hysteresis band: stays hidden.
  renderer.positions.set('m',[.018,0,0]);renderer.simTime+=1*DAY;
  assert.ok(!names(layout(32)).has('m'));
  // 0.006 units = 120px/s, below the re-show boundary: appears now.
  renderer.positions.set('m',[.024,0,0]);renderer.simTime+=1*DAY;
  assert.ok(names(layout(48)).has('m'));
});
