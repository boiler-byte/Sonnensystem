import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {GalacticTrailHistory} from '../src/renderer/galactic-trails.js';
import {GALACTIC_SUN_HISTORY_DAYS} from '../src/renderer/galactic-motion.js';
import {DAY} from '../src/renderer/math.js';
import {SunTrailFlowClock,sunTrailFlowSegments,SUN_TRAIL_FLOW_CYCLE_SECONDS} from '../src/renderer/sun-trail-flow.js';
import {SolarRenderer} from '../src/renderer/renderer.js';

const sun={id:'sun',type:'star'};
const t0=Date.UTC(2026,10,20);
const points=new Float32Array([0,-12,0, 2,-8,0, 1,-4,0, 0,0,0]);

test('v106: moving sunlight changes even when the stored Sun-relative trail is stationary',()=>{
  const frozen=Float32Array.from(points);
  const atStart=sunTrailFlowSegments(points,0.11);
  const later=sunTrailFlowSegments(points,0.24);
  assert.equal(atStart.length,3);
  assert.equal(later.length,3);
  assert.notDeepEqual([...atStart[0]],[...later[0]],'the luminous segment must move');
  assert.deepEqual([...points],[...frozen],'highlights cannot modify the recorded trail');
  assert.ok(atStart.every(s=>s.length===36 && [...s].every(Number.isFinite)));
});

test('v106: travelling highlights move from Sun to older points with smooth arc-length sampling',()=>{
  const line=new Float32Array([0,-10,0, 0,-9,0, 0,-1,0, 0,0,0]);
  const start=sunTrailFlowSegments(line,0.10,{pulses:1,length:0.075,steps:5})[0];
  const next=sunTrailFlowSegments(line,0.20,{pulses:1,length:0.075,steps:5})[0];
  assert.ok(next[1]<start[1], 'leading edge travels away from the Sun');
  assert.ok(Math.abs((next[1]-start[1])+1)<1e-5,'motion follows distance rather than uneven vertex indices');
  for(let i=3;i<start.length;i+=3)assert.ok(start[i+1]>=start[i-2], 'pulse points remain ordered toward the Sun');
});

test('v106: render clock runs only when simulation is advancing, not when paused',()=>{
  const clock=new SunTrailFlowClock();
  assert.equal(clock.advance(1000,t0),0);
  assert.ok(Math.abs(clock.advance(1100,t0+DAY)-.1/(SUN_TRAIL_FLOW_CYCLE_SECONDS))<1e-8);
  const phase=clock.phase;
  assert.equal(clock.advance(1200,t0+DAY),phase,'paused simulation freezes flow');
  assert.equal(clock.advance(2000,t0+DAY),phase,'wall-clock time alone does not move the trail');
  const after=clock.advance(2100,t0+2*DAY);
  assert.ok(after>phase && after-phase<0.02,'resume advances without catching up during pause');
  assert.equal(clock.advance(2200,t0+DAY),0,'rewinding resets the visual effect');
  assert.equal(clock.advance(2300,t0+2*DAY,true),0,'reduced-motion prevents pulsing');
});

test('v106: the 18-year history limit stays unchanged; the flow never writes into it',()=>{
  const h=new GalacticTrailHistory(40);
  const start=t0-GALACTIC_SUN_HISTORY_DAYS*DAY;
  for(let i=0;i<200;i++)h.record(sun,start+i*45*DAY,[0,0,0]);
  const simTime=start+199*45*DAY;
  const original=Float32Array.from(h.record(sun,simTime,[0,0,0]));
  const count=h.trails.get('sun').samples.length;
  sunTrailFlowSegments(original,0.2);
  assert.equal(h.trails.get('sun').samples.length,count);
  assert.ok(h.trails.get('sun').samples.every(sample=>sample.time>=simTime-GALACTIC_SUN_HISTORY_DAYS*DAY));
});

test('v106: session reset clears highlight phase alongside the history',()=>{
  const renderer=Object.create(SolarRenderer.prototype);
  renderer._sunTrailFlow=new SunTrailFlowClock();
  renderer._sunTrailFlow.advance(1000,t0);
  renderer._sunTrailFlow.advance(1100,t0+DAY);
  renderer._galacticTrails=new GalacticTrailHistory();
  renderer._galacticTrails.record(sun,t0,[0,0,0]);
  assert.ok(renderer._sunTrailFlow.phase>0);
  renderer.resetGalacticTrails();
  assert.equal(renderer._sunTrailFlow.phase,0);
  assert.equal(renderer._galacticTrails.trails.size,0);
});

test('v106: offline shell retains flow utility and static sun-trail drawing without changing timeline',async()=>{
  const root=new URL('../',import.meta.url);
  const [sw,orbits,motion,loop,pkg]=await Promise.all([
    readFile(new URL('sw.js',root),'utf8'),
    readFile(new URL('src/renderer/orbits.js',root),'utf8'),
    readFile(new URL('src/renderer/galactic-motion.js',root),'utf8'),
    readFile(new URL('src/app/animation-loop.js',root),'utf8'),
    readFile(new URL('package.json',root),'utf8')
  ]);
  const {version}=JSON.parse(pkg);
  assert.match(sw,new RegExp(`sonnensystem-shell-v${version.split('.')[0]}`));
  assert.match(sw,/"\.\/src\/renderer\/sun-trail-flow\.js"/);
  assert.match(orbits,/export function drawSunTrail\(/);
  assert.match(orbits,/recordedGalacticTrail\(renderer,sun,vp\)/);
  assert.doesNotMatch(motion,/sunTrailFlowSegments|SunTrailFlowClock/);
  assert.doesNotMatch(loop,/SunTrailFlowClock|sunTrailFlowSegments/);
  assert.match(version,/^\d+\.\d+\.\d+$/);
});
