import assert from 'node:assert/strict';
import {test} from 'node:test';
import {keplerPosition,displayOrbitRadius} from '../src/data/orbital-math.js';
import {
  galacticOffsetAt, galacticHistoryDays, GALACTIC_DEPTH_FRACTION,
  GALACTIC_DRIFT_UNITS_PER_DAY, GALACTIC_SUN_HISTORY_DAYS
} from '../src/renderer/galactic-motion.js';
import {GalacticTrailHistory} from '../src/renderer/galactic-trails.js';

const DAY=86400000;
const now=Date.UTC(2026,10,20);
const almost=(actual,expected,tolerance=1e-4)=>
  assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} should be within ${tolerance} of ${expected}`);

test('v101/v103: past Sun positions lead downward in the fixed 3D Y-axis at all history scales',()=>{
  assert.deepEqual(galacticOffsetAt(now,now),[0,0,0]);
  for(const days of [1,10,100,365.25,365.25*5,GALACTIC_SUN_HISTORY_DAYS]){
    const [x,y,z]=galacticOffsetAt(now-days*DAY,now);
    assert.ok(y<0,`past ${days} days must lie on negative world Y`);
    assert.ok(z<0,`past ${days} days must extend backward into negative world Z`);
    assert.ok(Math.abs(y)>4*Math.abs(x),`past ${days} days: downward movement dominates horizontal sway`);
  }
});

test('v110: the old sinusoidal drift is replaced by fixed vector translation',()=>{
  const past=galacticOffsetAt(now-GALACTIC_SUN_HISTORY_DAYS*DAY,now);
  almost(past[1], -GALACTIC_SUN_HISTORY_DAYS*GALACTIC_DRIFT_UNITS_PER_DAY,1e-8);
  almost(past[2], -GALACTIC_SUN_HISTORY_DAYS*GALACTIC_DRIFT_UNITS_PER_DAY*GALACTIC_DEPTH_FRACTION,1e-8);
  assert.equal(past[0],0,'there is no lateral sway');
});

test('v101/v103: recorded Sun trail extends downward and ends at current origin',()=>{
  const history=new GalacticTrailHistory();
  const sun={id:'sun',type:'star'};
  const start=now-GALACTIC_SUN_HISTORY_DAYS*DAY;
  let samples=new Float32Array(0);
  for(let i=0;i<=480;i++){
    samples=history.record(sun,start+(now-start)*i/480,[0,0,0]);
  }
  assert.equal(samples.length,6,'a perfectly straight solar trace needs only two points');
  assert.ok(samples[1]<-70,'long visible trail extends downward after the simulation has advanced');
  let previousY=-Infinity;
  for(let i=0;i<samples.length;i+=3){
    assert.ok(samples[i+1]>previousY,'recorded Sun trail ascends toward the current point');
    previousY=samples[i+1];
  }
  assert.deepEqual([...samples.slice(-3)],[0,0,0]);
});

test('v101/v103: observed planet positions inherit the same 3D solar displacement',()=>{
  const sun={id:'sun',type:'star'};
  const earth={id:'earth',type:'planet',parentId:'sun',a:1,periodDays:365.25,e:0.0167,i:0.00005,node:-11.26,peri:102.94,M:100.46,epoch:now};
  const settings={scaleOrbits:false};
  const history=new GalacticTrailHistory();
  const duration=galacticHistoryDays(earth);
  const startTime=now-duration*DAY;
  const atStart=keplerPosition(earth,sun,startTime,null,displayOrbitRadius(earth,sun,settings));
  const atEnd=keplerPosition(earth,sun,now,null,displayOrbitRadius(earth,sun,settings));
  assert.equal(history.record(earth,startTime,atStart).length,0);
  const points=history.record(earth,now,atEnd);
  const drift=galacticOffsetAt(startTime,now);
  assert.equal(points.length,6,'only the two sampled times are present; no past points are reconstructed');
  for(let axis=0;axis<3;axis++)almost(points[axis]-atStart[axis],drift[axis]);
  assert.ok(drift[1]<0);
  atEnd.forEach((component,axis)=>almost(points[points.length-3+axis],component));
});
