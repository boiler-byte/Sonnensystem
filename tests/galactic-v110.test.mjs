import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DAY} from '../src/renderer/math.js';
import {galacticOffsetAt,galacticHistoryDays,GALACTIC_SUN_HISTORY_DAYS,
  GALACTIC_INNER_HISTORY_DAYS,GALACTIC_OUTER_HISTORY_DAYS} from '../src/renderer/galactic-motion.js';
import {GalacticTrailHistory,MAX_GALACTIC_TRAIL_SAMPLES,recordedGalacticTrail} from '../src/renderer/galactic-trails.js';
import {layerPreset,updateLayerSelection} from '../src/data/layers.js';

const t0=Date.UTC(2026,0,1), year=365.25*DAY;
const sun={id:'sun',type:'star'};
const earth={id:'earth',type:'planet',periodDays:365.25,a:1};
const neptune={id:'neptune',type:'planet',periodDays:60190,a:30};

const almost=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} !== ${b}`);

test('v110: Sun travels with exact constant velocity along a straight 3D direction',()=>{
  const a=galacticOffsetAt(t0-11*DAY,t0),b=galacticOffsetAt(t0-22*DAY,t0);
  assert.deepEqual(b,a.map(x=>x*2));
  for(const days of [1,10,365.25*7,365.25*50]){
    const result=galacticOffsetAt(t0-days*DAY,t0);
    assert.equal(result[0],0);
    almost(result[2],result[1]*.16);
  }
  assert.deepEqual(galacticOffsetAt(t0,t0),[0,0,0]);
});

test('v110: 50/30/100/100-year history windows follow the object groups',()=>{
  assert.equal(galacticHistoryDays(sun),GALACTIC_SUN_HISTORY_DAYS);
  for(const id of ['mercury','venus','earth','mars'])
    assert.equal(galacticHistoryDays({...earth,id}),GALACTIC_INNER_HISTORY_DAYS);
  for(const id of ['jupiter','saturn','uranus','neptune'])
    assert.equal(galacticHistoryDays({...earth,id}),GALACTIC_OUTER_HISTORY_DAYS);
  assert.equal(galacticHistoryDays({id:'pluto',type:'dwarf',a:39.5}),GALACTIC_OUTER_HISTORY_DAYS);
  assert.equal(galacticHistoryDays({id:'sedna',type:'tno',a:500}),GALACTIC_OUTER_HISTORY_DAYS);
  assert.equal(galacticHistoryDays({id:'ceres',type:'dwarf',a:2.8}),GALACTIC_INNER_HISTORY_DAYS);
});

test('v110: straight solar path uses two vertices even after thousands of frames; 50-year window rolls',()=>{
  const history=new GalacticTrailHistory();
  for(let i=0;i<=2000;i++){
    const t=t0+i*year/20;
    const points=history.record(sun,t,[0,0,0]);
    if(i>0){assert.equal(points.length,6);assert.equal(history.trails.get('sun').samples.length,1);}
  }
  const trail=history.trails.get('sun');
  almost((t0+100*year-trail.samples[0].time)/DAY,GALACTIC_SUN_HISTORY_DAYS);
  const points=history.record(sun,t0+100*year,[0,0,0]);
  almost(points[1],-GALACTIC_SUN_HISTORY_DAYS*.012);
  assert.deepEqual([...points.slice(-3)],[0,0,0]);
});

test('v110: older point remains until max duration, then tracks the new time-window boundary',()=>{
  const history=new GalacticTrailHistory(20);
  for(let i=0;i<=29;i++)history.record(earth,t0+i*year,[i%2,Math.sin(i),0]);
  assert.equal(history.trails.get('earth').samples[0].time,t0,
    'do not remove the first sample just because the bounded sample count is reached');
  history.record(earth,t0+31*year,[0,0,0]);
  const first=history.trails.get('earth').samples[0];
  almost(first.time,t0+year);
  assert.ok(history.trails.get('earth').samples.length<20);
});

test('v110: curved paths preserve bends and never exceed the fixed vertex budget',()=>{
  const h=new GalacticTrailHistory(16),body={...neptune,id:'test-outer'};
  let points;
  for(let i=0;i<500;i++){
    const angle=i*.07,t=t0+i*year/10;
    points=h.record(body,t,[5*Math.cos(angle),5*Math.sin(angle),0]);
    assert.ok(h.trails.get(body.id).samples.length<16);
    assert.ok(points.length<=16*3);
  }
  assert.ok(h.trails.get(body.id).samples.length>2,'bends deserve more than a straight line');
  assert.ok(MAX_GALACTIC_TRAIL_SAMPLES>=16);
});

test('v110: a hidden layer has no trace or recording; enabling it starts a new one',()=>{
  const planet={...earth};
  const renderer={settings:{layers:layerPreset('standard'),scaleOrbits:false},
    positions:new Map([['earth',[7,0,0]]]),simTime:t0,_sceneRevision:0};
  assert.equal(recordedGalacticTrail(renderer,planet).length,0);
  renderer.simTime+=DAY;
  assert.equal(recordedGalacticTrail(renderer,planet).length,6);
  renderer.settings.layers=updateLayerSelection(renderer.settings.layers,'planet',false,'solar');
  assert.equal(recordedGalacticTrail(renderer,planet).length,0);
  assert.equal(renderer._galacticTrails.trails.has('earth'),false);
  renderer.settings.layers=updateLayerSelection(renderer.settings.layers,'planet',true,'solar');
  assert.equal(recordedGalacticTrail(renderer,planet).length,0,'a re-enabled object starts fresh');
  renderer._galacticTrails.retainVisible(new Set(['sun']));
  assert.equal(renderer._galacticTrails.trails.has('earth'),false);
});
