import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {GalacticTrailHistory,MAX_GALACTIC_TRAIL_SAMPLES} from '../src/renderer/galactic-trails.js';
import {GALACTIC_INNER_HISTORY_DAYS,galacticOffsetAt} from '../src/renderer/galactic-motion.js';
import {DAY} from '../src/renderer/math.js';

const start=Date.UTC(2026,0,1);
const earth={id:'earth',type:'planet',periodDays:365.25};
const neptune={id:'neptune',type:'planet',periodDays:60190,a:30};

function orbitalPosition(body,days,radius=6){
  const angle=2*Math.PI*days/body.periodDays;
  return [radius*Math.cos(angle),radius*Math.sin(angle),0];
}

test('v113: a slowly moving outer planet adds every observed step, not one growing straight chord',()=>{
  const h=new GalacticTrailHistory();
  assert.equal(h.record(neptune,start,orbitalPosition(neptune,0,30)).length,0);
  for(let i=1;i<=120;i++){
    const time=start+i*.002*DAY;
    const position=orbitalPosition(neptune,i*.002,30);
    const output=h.record(neptune,time,position);
    assert.equal(output.length,(i+1)*3,`frame ${i} was skipped`);
    assert.deepEqual([...output.slice(-3)],position.map(Math.fround));
    assert.equal(h.trails.get('neptune').samples.length,i,
      'previous live endpoint is committed at every new simulated time');
  }
  const trail=h.trails.get('neptune');
  assert.equal(trail.samples.at(-1).time,start+119*.002*DAY);
  const before=Float32Array.from(trail.output);
  const paused=h.record(neptune,start+120*.002*DAY,orbitalPosition(neptune,120*.002,30));
  assert.deepEqual([...paused],[...before],'paused rendering does not record duplicate vertices');
});

test('v113: after fast playback slows, recent frames remain continuous under memory pressure',()=>{
  const max=64,h=new GalacticTrailHistory(max);
  let days=0;
  h.record(earth,start,orbitalPosition(earth,days));
  for(let i=1;i<=250;i++){
    days+=3;
    const output=h.record(earth,start+days*DAY,orbitalPosition(earth,days));
    assert.ok(output.length<=max*3);
  }
  assert.ok(h.trails.get('earth').samples.length>=max-2,'fast section fills sample budget');
  const slowTimes=[];
  let previousLength=0;
  for(let i=0;i<12;i++){
    days+=.001;
    const time=start+days*DAY;
    slowTimes.push(time);
    const points=h.record(earth,time,orbitalPosition(earth,days));
    assert.ok(points.length<=max*3,'sample budget remains fixed');
    assert.ok(points.length>=previousLength,'recent line never loses the live end');
    previousLength=points.length;
    assert.deepEqual([...points.slice(-3)],orbitalPosition(earth,days).map(Math.fround));
  }
  const stored=h.trails.get('earth').samples;
  const recordedSlow=stored.filter(x=>x.time>=slowTimes[0]).map(x=>x.time);
  assert.deepEqual(recordedSlow,slowTimes.slice(0,-1),
    'no slow frame is dropped behind the planet, even after pruning');
  const last12=stored.slice(-12);
  const slowGaps=last12.slice(2).map((s,i)=>(s.time-last12[i+1].time)/DAY);
  assert.ok(slowGaps.every(gap=>gap>.0009&&gap<.0011),
    'the tail keeps small consecutive steps instead of a long line');
});

test('v113: only older vertices may be simplified while preserving the oldest point',()=>{
  const max=20,h=new GalacticTrailHistory(max);
  const samples=Array.from({length:max},(_,i)=>({
    time:i,position:[i,Math.sin(i),0],flight:[i,Math.sin(i),0],error:0
  }));
  const oldest=samples[0];
  const recent=samples.slice(-Math.floor(max*.2));
  h.simplify(samples,null,19,true);
  assert.equal(samples.length,max-1);
  assert.equal(samples[0],oldest);
  for(const point of recent)assert.ok(samples.includes(point),'recent vertex was simplified');
});

test('v113: dense recording keeps the actual 30-year Earth curve within a small geometric deviation',()=>{
  const h=new GalacticTrailHistory(),source=[];
  const steps=5000;
  for(let i=0;i<=steps;i++){
    const days=i*GALACTIC_INNER_HISTORY_DAYS/steps;
    const position=orbitalPosition(earth,days);
    const time=start+days*DAY;
    const drift=galacticOffsetAt(time,0);
    source.push({time,flight:position.map((p,k)=>p+drift[k])});
    h.record(earth,time,position);
  }
  const stored=[...h.trails.get('earth').samples,h.trails.get('earth').lastSeen];
  assert.equal(stored.length,MAX_GALACTIC_TRAIL_SAMPLES);
  let next=1,maxDeviation=0;
  for(const p of source){
    while(next<stored.length-1&&stored[next].time<p.time)next++;
    const a=stored[next-1].flight,b=stored[next].flight;
    const delta=b.map((value,k)=>value-a[k]);
    const fromStart=p.flight.map((value,k)=>value-a[k]);
    const along=Math.max(0,Math.min(1,fromStart.reduce((sum,value,k)=>sum+value*delta[k],0)/
      (delta.reduce((sum,value)=>sum+value*value,0)||1)));
    const distance=Math.hypot(...p.flight.map((value,k)=>value-a[k]-along*delta[k]));
    maxDeviation=Math.max(maxDeviation,distance);
  }
  assert.ok(maxDeviation<.08,`actual recorded curve differs by ${maxDeviation} world units`);
  assert.equal(stored[0].time,start,'time-window start is not discarded by a full sample budget');
});

test('v113: galactic recorder remains cached in the latest release shell',async()=>{
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.match(sw,new RegExp(`const CACHE_NAME='sonnensystem-shell-v${pkg.version.split('.')[0]}'`));
  assert.match(sw,/"\.\/src\/renderer\/galactic-trails\.js"/);
});
