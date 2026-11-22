import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {FpsMeter} from '../src/ui/fps-meter.js';
import {
  GalacticTrailHistory,recordedGalacticTrail,galacticTrailSampleLimit,
  MAX_GALACTIC_TRAIL_SAMPLES,HIGH_FPS_GALACTIC_TRAIL_SAMPLES,
  GALACTIC_TRAIL_FPS_THRESHOLD
} from '../src/renderer/galactic-trails.js';
import {layerPreset} from '../src/data/layers.js';
import {DAY} from '../src/renderer/math.js';

const earth={id:'earth',type:'planet',periodDays:365.25,a:1};
const time=Date.UTC(2026,0,1);
const position=i=>[6*Math.cos(i*.015),6*Math.sin(i*.015),Math.sin(i*.007)];
const source=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v147: strictly more than 59 measured FPS unlocks 3,000 points, independent of HUD state',()=>{
  assert.equal(MAX_GALACTIC_TRAIL_SAMPLES,1000);
  assert.equal(HIGH_FPS_GALACTIC_TRAIL_SAMPLES,3000);
  assert.equal(GALACTIC_TRAIL_FPS_THRESHOLD,59);
  for(const value of [undefined,null,NaN,-Infinity,0,58.9,59,Infinity])
    assert.equal(galacticTrailSampleLimit(value),1000,`FPS ${value}`);
  assert.equal(galacticTrailSampleLimit(59.01),3000);
  const fps=new FpsMeter();
  assert.equal(galacticTrailSampleLimit(fps.read().current),1000);
  for(let i=0;i<=120;i++)fps.addFrame(i*1000/60);
  assert.equal(galacticTrailSampleLimit(fps.read().current),3000);
  for(let i=1;i<=30;i++)fps.addFrame(2000+i*1000/30);
  assert.equal(galacticTrailSampleLimit(fps.read().current),1000);
});

test('v147: growing the budget retains the existing history and allows more than 1,000 points',()=>{
  const r={simTime:time,settings:{layers:layerPreset('standard'),scaleOrbits:false},
    positions:new Map([['earth',position(0)]]),_sceneRevision:0,
    galacticTrailSampleLimit:1000};
  for(let i=0;i<650;i++){
    r.simTime=time+i*DAY;
    r.positions.set('earth',position(i));
    recordedGalacticTrail(r,earth);
  }
  const h=r._galacticTrails;
  assert.equal(h.maxSamples,1000);
  const original=h.trails.get('earth').samples[0];
  r.galacticTrailSampleLimit=3000;
  for(let i=650;i<=1400;i++){
    r.simTime=time+i*DAY;
    r.positions.set('earth',position(i));
    recordedGalacticTrail(r,earth);
  }
  assert.equal(h.maxSamples,3000);
  assert.equal(h.trails.get('earth').samples[0],original);
  assert.equal(h.trails.get('earth').output.length,1401*3);
});

test('v147: dropping to 1,000 is one-pass, preserves oldest and most recent positions and paused output',()=>{
  const h=new GalacticTrailHistory(3000);
  for(let i=0;i<=1500;i++)h.record(earth,time+i*DAY,position(i));
  const before=h.trails.get('earth');
  const oldest=before.samples[0];
  const last200=before.samples.slice(-200);
  const pausedTime=time+1500*DAY;
  h.setMaxSamples(1000);
  assert.equal(h.maxSamples,1000);
  assert.equal(before.samples.length,999);
  assert.equal(before.samples[0],oldest);
  for(const sample of last200)assert.ok(before.samples.includes(sample));
  const paused=h.record(earth,pausedTime,position(1500));
  assert.equal(paused.length,1000*3);
  assert.deepEqual([...paused.slice(-3)],position(1500).map(Math.fround));
  for(let i=1501;i<=1520;i++){
    const result=h.record(earth,time+i*DAY,position(i));
    assert.ok(result.length<=3000);
  }
  h.setMaxSamples(3000);
  const expanded=h.record(earth,time+1521*DAY,position(1521));
  assert.ok(expanded.length>3000,'increasing the limit does not reset the observed trail');
});

test('v147: WebGL projection buffer grows with the point limit instead of using a stale 1,000-point array',()=>{
  const h=new GalacticTrailHistory();
  const samples=Array.from({length:1010},(_,i)=>({
    time:i,position:[i/10,Math.sin(i),0],flight:[i/10,Math.sin(i),0],error:0
  }));
  const view={vp:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),width:800,height:600};
  h.simplify(samples.slice(0,900),view);
  assert.equal(h._projectionBuffer.length,3000);
  h.setMaxSamples(3000);
  h.simplify(samples,view);
  assert.equal(h._projectionBuffer.length,9000);
});

test('v147: animation loop samples successful draws regardless of Debug HUD and version is consistent',async()=>{
  const [loop,sw,readme,history,help,html,pkg]=await Promise.all([
    source('src/app/animation-loop.js'),source('sw.js'),source('README.md'),
    source('docs/RELEASE-HISTORY.md'),source('docs/HILFE.md'),source('index.html'),source('package.json')
  ]);
  assert.match(loop,/const galacticFrameRate=new FpsMeter\(\)/);
  assert.match(loop,/galacticFrameRate\.reset\(\)/);
  assert.match(loop,/renderer\.galacticTrailSampleLimit=galacticTrailSampleLimit\(/);
  assert.match(loop,/renderer\.draw\([\s\S]*?galacticFrameRate\.addFrame\(now\)/);
  assert.match(loop,/elapsed>=1000/);
  assert.match(sw,/sonnensystem-shell-v147/);
  assert.match(readme,/v147/);
  assert.match(history,/## v147/);
  assert.match(help,/3\.000/);
  assert.match(html,/V147\.0/);
  assert.equal(JSON.parse(pkg).version,'147.0.0');
});
