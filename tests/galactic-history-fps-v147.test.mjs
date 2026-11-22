import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {FpsMeter} from '../src/ui/fps-meter.js';
import {
  GalacticTrailHistory,recordedGalacticTrail,galacticTrailUsesExtendedHistory,
  MAX_GALACTIC_TRAIL_SAMPLES,GALACTIC_TRAIL_FPS_THRESHOLD
} from '../src/renderer/galactic-trails.js';
import {
  galacticHistoryDays,GALACTIC_DRIFT_UNITS_PER_DAY,GALACTIC_YEAR_DAYS,
  GALACTIC_HIGH_FPS_SUN_HISTORY_DAYS,GALACTIC_HIGH_FPS_INNER_HISTORY_DAYS,
  GALACTIC_HIGH_FPS_OUTER_HISTORY_DAYS
} from '../src/renderer/galactic-motion.js';
import {layerPreset} from '../src/data/layers.js';
import {DAY} from '../src/renderer/math.js';

const start=Date.UTC(2026,0,1);
const year=GALACTIC_YEAR_DAYS*DAY;
const sun={id:'sun',type:'star'};
const otherStar={id:'alpha-centauri',type:'star',a:100};
const earth={id:'earth',type:'planet',a:1};
const jupiter={id:'jupiter',type:'planet',a:5.2};
const innerAsteroid={id:'asteroid-inner',type:'asteroid',a:3};
const outerDwarf={id:'kuiper',type:'dwarf',a:40};
const tno={id:'trans-neptunian',type:'tno',a:0};
const source=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
function near(actual,expected,tolerance=0.002){
  assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);
}
function recordedSpan(body,extended){
  const history=new GalacticTrailHistory();
  history.setExtendedHistory(extended);
  const end=start+800*year;
  assert.equal(history.record(body,start,[0,0,0]).length,0);
  const output=history.record(body,end,[0,0,0]);
  return {history,trail:history.trails.get(body.id),output,end};
}

test('v147: >59 rendered FPS is the exclusive high-history threshold',()=>{
  assert.equal(MAX_GALACTIC_TRAIL_SAMPLES,1000);
  assert.equal(GALACTIC_TRAIL_FPS_THRESHOLD,59);
  for(const fps of [null,undefined,NaN,-Infinity,Infinity,0,30,58.999,59])
    assert.equal(galacticTrailUsesExtendedHistory(fps),false,`FPS ${fps}`);
  for(const fps of [59.0001,60,120])
    assert.equal(galacticTrailUsesExtendedHistory(fps),true,`FPS ${fps}`);
  const meter=new FpsMeter();
  assert.equal(galacticTrailUsesExtendedHistory(meter.read().current),false);
  for(let i=0;i<=120;i++)meter.addFrame(i*1000/60);
  assert.equal(galacticTrailUsesExtendedHistory(meter.read().current),true);
  for(let i=1;i<=30;i++)meter.addFrame(2000+i*1000/30);
  assert.equal(galacticTrailUsesExtendedHistory(meter.read().current),false);
});

test('v147: high-FPS windows are exactly 300/100/500 years, low-FPS stays 50/30/100',()=>{
  assert.equal(GALACTIC_HIGH_FPS_SUN_HISTORY_DAYS,300*365.25);
  assert.equal(GALACTIC_HIGH_FPS_INNER_HISTORY_DAYS,100*365.25);
  assert.equal(GALACTIC_HIGH_FPS_OUTER_HISTORY_DAYS,500*365.25);
  for(const [body,lowYears,highYears] of [
    [sun,50,300],[otherStar,50,300],[earth,30,100],
    [jupiter,100,500],[innerAsteroid,30,100],[outerDwarf,100,500],[tno,100,500]
  ]){
    assert.equal(galacticHistoryDays(body),lowYears*365.25);
    assert.equal(galacticHistoryDays(body,true),highYears*365.25);
    for(const extended of [false,true]){
      const years=extended?highYears:lowYears;
      const {history,trail,output,end}=recordedSpan(body,extended);
      assert.equal(history.extendedHistory,extended);
      assert.equal(history.maxSamples,1000);
      assert.equal(trail.historyDays,lowYears*365.25);
      assert.equal(trail.extendedDays,highYears*365.25);
      near(trail.samples[0].time,end-years*year,0.5);
      assert.equal(output.length,6,'larger time window, same two recorded vertices');
      near(output[1],-years*365.25*GALACTIC_DRIFT_UNITS_PER_DAY,0.03);
      assert.deepEqual([...output.slice(-3)],[0,0,0]);
    }
  }
});

test('v147: returning to low FPS clips rendered history and preserves the prior long record',()=>{
  for(const [body,lowYears,highYears] of [[sun,50,300],[earth,30,100],[jupiter,100,500]]){
    const {history,trail,output:high,end}=recordedSpan(body,true);
    const oldTime=trail.samples[0].time;
    near(high[1],-highYears*365.25*GALACTIC_DRIFT_UNITS_PER_DAY,0.03);
    history.setExtendedHistory(false);
    const low=history.record(body,end,[0,0,0]); // Same sim-time must redraw.
    assert.notEqual(low,high);
    assert.equal(trail.samples[0].time,oldTime,'recorded earlier years remain cached');
    assert.equal(low.length,6);
    near(low[1],-lowYears*365.25*GALACTIC_DRIFT_UNITS_PER_DAY,0.03);
    history.setExtendedHistory(true);
    const highAgain=history.record(body,end,[0,0,0]);
    near(highAgain[1],high[1],0.03);
    assert.equal(history.maxSamples,1000);
    assert.equal(trail.samples[0].time,oldTime);
    assert.deepEqual([...highAgain.slice(-3)],[0,0,0]);
  }
});

test('v147: low-FPS view clips a dense high-FPS curve to its 30 most recent years',()=>{
  const history=new GalacticTrailHistory();
  history.setExtendedHistory(true);
  const position=i=>[Math.cos(i/8),Math.sin(i/8),0];
  for(let i=0;i<=80;i++)history.record(earth,start+i*year,position(i));
  const trail=history.trails.get('earth');
  assert.equal(trail.samples[0].time,start,'80 years fit inside high-FPS 100-year window');
  assert.equal(trail.output.length,81*3);
  history.setExtendedHistory(false);
  const low=history.record(earth,start+80*year,position(80));
  assert.equal(low.length,31*3);
  near(low[0],position(50)[0],0.00001);
  near(low[1],position(50)[1]-30*365.25*GALACTIC_DRIFT_UNITS_PER_DAY);
  assert.equal(trail.samples.length,80,'retained older history remains intact');
  history.setExtendedHistory(true);
  assert.equal(history.record(earth,start+80*year,position(80)).length,81*3);
});

test('v147: low-FPS cutoff is interpolated at the actual historical timestamp',()=>{
  const history=new GalacticTrailHistory();
  history.setExtendedHistory(true);
  for(let i=0;i<=110;i+=2)history.record(earth,start+i*year,[i,0,0]);
  history.record(earth,start+110.5*year,[110.5,0,0]);
  history.setExtendedHistory(false);
  const visible=history.record(earth,start+110.5*year,[110.5,0,0]);
  near(visible[0],80.5,0.00001);
  near(visible[1],-30*365.25*GALACTIC_DRIFT_UNITS_PER_DAY);
  assert.equal(history.trails.get('earth').samples[0].time,start+10.5*year);
});

test('v147: dense long trails respect 1000-point budget even after low-FPS clipping',()=>{
  const history=new GalacticTrailHistory();
  history.setExtendedHistory(true);
  for(let i=0;i<=1030;i++){
    const angle=i/20;
    history.record(earth,start+i*(year/5),[Math.cos(angle),Math.sin(angle),i/500]);
  }
  const trail=history.trails.get('earth');
  assert.ok(trail.samples.length<=999);
  assert.ok(trail.output.length<=MAX_GALACTIC_TRAIL_SAMPLES*3);
  history.setExtendedHistory(false);
  const low=history.record(earth,start+1030*(year/5),[Math.cos(1030/20),Math.sin(1030/20),1030/500]);
  assert.ok(low.length<=MAX_GALACTIC_TRAIL_SAMPLES*3);
  assert.ok(trail.samples.length<=999);
  // It includes the old recorded 100 years, not only more tightly packed vertices.
  assert.ok(trail.samples[0].time<=start+930*(year/5));
});

test('v147: renderer wires high historical years without relying on FPS debug toggle',()=>{
  const renderer={simTime:start,settings:{layers:layerPreset('standard'),scaleOrbits:false},
    positions:new Map([['sun',[0,0,0]]]),_sceneRevision:0,
    galacticTrailExtendedHistory:true};
  recordedGalacticTrail(renderer,sun);
  assert.equal(renderer._galacticTrails.extendedHistory,true);
  renderer.simTime+=800*year;
  const high=recordedGalacticTrail(renderer,sun);
  near(high[1],-300*365.25*GALACTIC_DRIFT_UNITS_PER_DAY,0.03);
  renderer.galacticTrailExtendedHistory=false;
  const low=recordedGalacticTrail(renderer,sun);
  near(low[1],-50*365.25*GALACTIC_DRIFT_UNITS_PER_DAY,0.03);
  assert.equal(renderer._galacticTrails.maxSamples,1000);
});

test('v147: frame-rate feed, historical docs and current release version stay consistent',async()=>{
  const [loop,sw,readme,help,history,html,pkg]=await Promise.all([
    source('src/app/animation-loop.js'),source('sw.js'),source('README.md'),
    source('docs/HILFE.md'),source('docs/RELEASE-HISTORY.md'),source('index.html'),source('package.json')
  ]);
  assert.match(loop,/const galacticFrameRate=new FpsMeter\(\)/);
  assert.match(loop,/galacticFrameRate\.reset\(\)/);
  assert.match(loop,/renderer\.galacticTrailExtendedHistory=galacticTrailUsesExtendedHistory\(/);
  assert.match(loop,/elapsed>=1000/);
  assert.match(loop,/renderer\.draw\([\s\S]*?galacticFrameRate\.addFrame\(now\)/);
  assert.doesNotMatch(loop,/galacticTrailSampleLimit|galacticFrameRate\.read\(\)\.minute/);
  const {version}=JSON.parse(pkg);
  const [major,minor]=version.split('.');
  assert.ok(Number(major)>=147);
  assert.match(sw,new RegExp(`sonnensystem-shell-v${major}`));
  for(const documentation of [readme,help,history]){
    assert.match(documentation,/300(?: statt 50)? Jahre/);
    assert.match(documentation,/100(?: statt 30)? Jahre/);
    assert.match(documentation,/500(?: statt 100)? Jahre/);
  }
  assert.match(help,/1\.000 Punkten/);
  assert.match(history,/## v147/);
  assert.match(html,new RegExp(`V${major}\\.${minor}`));
});
