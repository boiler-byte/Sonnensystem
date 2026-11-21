import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {GalacticTrailHistory,MAX_GALACTIC_TRAIL_SAMPLES} from '../src/renderer/galactic-trails.js';
import {galacticOffsetAt,GALACTIC_INNER_HISTORY_DAYS,
  GALACTIC_SUN_HISTORY_DAYS} from '../src/renderer/galactic-motion.js';
import {DAY} from '../src/renderer/math.js';

const start=Date.UTC(2026,0,1);
const earth={id:'earth',type:'planet',periodDays:365.25};
const sun={id:'sun',type:'star'};
const sample=(time,x,y,z=0,error=0)=>({
  time,position:[x,y,z],flight:[x,y,z],error
});

test('v112: keep up to 1,000 samples, oldest time endpoint and newest live point',()=>{
  assert.equal(MAX_GALACTIC_TRAIL_SAMPLES,1000);
  const h=new GalacticTrailHistory();
  const days=GALACTIC_INNER_HISTORY_DAYS;
  let newest;
  for(let i=0;i<=5000;i++){
    const d=i*days/5000,angle=d*2*Math.PI/365.25;
    newest=[6*Math.cos(angle),6*Math.sin(angle),0];
    const output=h.record(earth,start+d*DAY,newest);
    assert.ok(output.length<=MAX_GALACTIC_TRAIL_SAMPLES*3);
  }
  const history=h.trails.get('earth');
  assert.equal(history.samples[0].time,start,'budget pressure must not advance the oldest time');
  assert.ok(history.samples.length>=800,'dense curved track keeps a high level of detail');
  assert.ok(history.samples.length<MAX_GALACTIC_TRAIL_SAMPLES);
  assert.deepEqual([...history.output.slice(-3)],newest.map(Math.fround));
  assert.ok(Math.max(...history.samples.map(s=>s.error))<.10,
    'conservative merged-error envelope stays small on the full Earth helix');
  h.record(earth,start+(days+10)*DAY,[5,0,0]);
  assert.ok(h.trails.get('earth').samples[0].time>=start+10*DAY,
    'the oldest sample is only advanced after the history window expires');
});

test('v112: prefer removing a nearly collinear point over a clearly visible corner',()=>{
  const h=new GalacticTrailHistory();
  const samples=[sample(0,0,0),sample(1,1,.0001),sample(2,2,0),
    sample(3,3,2),sample(4,4,0)];
  h.simplify(samples);
  assert.deepEqual(samples.map(s=>s.time),[0,2,3,4]);
  assert.equal(samples[0].time,0);
  assert.equal(samples.at(-1).time,4);
  assert.ok(samples[1].error<.001,'removed detail has a conservative error bound');
});

test('v112: repeated reduction accounts for discarded geometry rather than hiding cumulative errors',()=>{
  const h=new GalacticTrailHistory();
  const samples=[sample(0,0,0),sample(1,1,.008),sample(2,2,0),
    sample(3,3,.008),sample(4,4,0)];
  h.simplify(samples);
  const before=Math.max(...samples.map(s=>s.error));
  h.simplify(samples);
  const after=Math.max(...samples.map(s=>s.error));
  assert.ok(after>=before,'the previously discarded bend remains in the error envelope');
});

test('v112: near-invisible screen deviations are removed before a visible bend',()=>{
  const h=new GalacticTrailHistory();
  const original=[sample(0,0,0,0),sample(1,.2,0,.010),sample(2,.4,0,0),
    sample(3,.6,.009,0),sample(4,.8,0,0)];
  const withoutProjection=original.map(s=>({...s}));
  h.simplify(withoutProjection);
  assert.ok(!withoutProjection.some(s=>s.time===2),
    '3D-only reduction slightly favors the world-smallest corner');
  const projected=original.map(s=>({...s}));
  const vp=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  h.simplify(projected,{vp,width:800,height:800},0);
  assert.ok(!projected.some(s=>s.time===1),
    'a depth-only subpixel displacement is cheaper than a several-pixel screen bend');
  assert.ok(projected.some(s=>s.time===3));
});

test('v112: solar trail stays exactly linear, compressed and limited to 50 years',()=>{
  const h=new GalacticTrailHistory();
  let output;
  for(let i=0;i<=1200;i++){
    const d=i*GALACTIC_SUN_HISTORY_DAYS/1200;
    output=h.record(sun,start+d*DAY,[0,0,0]);
  }
  assert.equal(output.length,6);
  assert.equal(h.trails.get('sun').samples.length,1);
  assert.ok(Math.abs(output[1] + GALACTIC_SUN_HISTORY_DAYS*.012)<.01);
  assert.equal(output[4],0);
  assert.deepEqual(galacticOffsetAt(start,start),[0,0,0]);
});

test('v112: renderer forwards its view projection to the live recorder',async()=>{
  const [orbits,worker]=await Promise.all([
    readFile(new URL('../src/renderer/orbits.js',import.meta.url),'utf8'),
    readFile(new URL('../sw.js',import.meta.url),'utf8')
  ]);
  assert.match(orbits,/recordedGalacticTrail\(renderer,body,vp\)/);
  assert.match(orbits,/recordedGalacticTrail\(renderer,sun,vp\)/);
  assert.match(worker,/const CACHE_NAME='sonnensystem-shell-v\d+'/);
});
