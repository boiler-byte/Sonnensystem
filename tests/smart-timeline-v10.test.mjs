import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { SPEED_STEPS, SPEED_MODES, speedAtStep, stepForSpeed, formatSpeed, syncSpeedMode, syncControls } from '../src/ui/timeline.js';

const near = (actual, expected, context) =>
  assert.ok(Math.abs(actual - expected) / expected < 1e-10, `${context}: got ${actual}, expected ${expected}`);

test('v23: solar system has 1h/s–10y/s logarithmic range and exact 5days/s default', () => {
  const r = SPEED_MODES.solar;
  near(r.min, 1/24, 'solar minimum');
  near(r.defaultSpeed, 5, 'solar default');
  near(r.max, 10*365.25, 'solar maximum');
  near(speedAtStep('solar',0),r.min,'minimum slider step');
  near(speedAtStep('solar',r.pivot),r.defaultSpeed,'exact default slider step');
  near(speedAtStep('solar',SPEED_STEPS),r.max,'maximum slider step');
  assert.equal(stepForSpeed('solar',r.defaultSpeed),r.pivot);
});

test('v10: planet system has 1min/s–1y/s range and exact 1h/s default', () => {
  const r = SPEED_MODES.planet;
  near(r.min,1/1440,'planet minimum');
  near(r.defaultSpeed,1/24,'planet default');
  near(r.max,365.25,'planet maximum');
  near(speedAtStep('planet',0),r.min,'minimum slider step');
  near(speedAtStep('planet',r.pivot),r.defaultSpeed,'exact default slider step');
  near(speedAtStep('planet',SPEED_STEPS),r.max,'maximum slider step');
  assert.equal(stepForSpeed('planet',r.defaultSpeed),r.pivot);
});

test('v10: every one of 241 stages is monotonic and locally logarithmic', () => {
  assert.equal(SPEED_STEPS,240);
  for(const mode of ['solar','planet']) {
    const r = SPEED_MODES[mode];
    const values = Array.from({length:SPEED_STEPS+1},(_,i)=>speedAtStep(mode,i));
    for(let i=1;i<values.length;i++) {
      assert.ok(values[i]>values[i-1],`${mode} step ${i} must be faster`);
      assert.equal(stepForSpeed(mode,values[i]),i,`${mode} roundtrip step ${i}`);
    }
    for(const [start,end] of [[0,r.pivot],[r.pivot,SPEED_STEPS]]) {
      const ratios = values.slice(start+1,end+1).map((v,k)=>v/values[start+k]);
      assert.ok(Math.max(...ratios)-Math.min(...ratios)<1e-8,'each segment is logarithmic');
    }
    assert.equal(speedAtStep(mode,-100),r.min);
    near(speedAtStep(mode,10000),r.max,'clamped end');
  }
});

test('v10: view changes restore independent user-defined speed without affecting play/pause',()=>{
  const s={time:Date.now(),playing:false, speed:SPEED_MODES.solar.defaultSpeed,
    timelineMode:'solar',modeSpeeds:{solar:SPEED_MODES.solar.defaultSpeed,planet:SPEED_MODES.planet.defaultSpeed}};
  assert.equal(syncSpeedMode(s,'solar'),false);
  s.speed=125;
  assert.equal(syncSpeedMode(s,'planet'),true);
  near(s.speed,1/24,'planet initial default');
  assert.equal(s.playing,false);
  s.speed=1/1440;
  assert.equal(syncSpeedMode(s,'solar'),true);
  assert.equal(s.speed,125,'solar remembers custom speed');
  syncSpeedMode(s,'planet');
  near(s.speed,1/1440,'planet remembers custom speed');
  assert.equal(s.playing,false);
});

test('v10: readable German labels for extreme ranges and exact default speeds',()=>{
  assert.equal(formatSpeed(1/1440),'1 Min. / s');
  assert.equal(formatSpeed(1/24),'1 Std. / s');
  assert.equal(formatSpeed(3/24),'3 Std. / s');
  assert.equal(formatSpeed(365.25),'1 Jahr / s');
  assert.equal(formatSpeed(3652.5),'10 Jahre / s');
});

test('v10: controls update icon, pause state and speed-range labels in each scene',()=>{
  const before=globalThis.document;
  const el=new Map();
  globalThis.document={getElementById:id=>{
    if(!el.has(id)) el.set(id, {textContent:'',value:'',attrs:{},setAttribute(name,value){this.attrs[name]=value;}});
    return el.get(id);
  }};
  try {
    const state={playing:true,time:Date.UTC(2026,10,16,23,17),speed:5,timelineMode:'solar'};
    syncControls(state);
    assert.match(el.get('play-icon-path').attrs.d,/M7 5h4/);
    assert.equal(el.get('play-btn').attrs['aria-pressed'],'true');
    assert.equal(el.get('speed-readout').textContent,'5 Tage / s');
    assert.equal(el.get('speed').value,'101');
    assert.equal(el.get('speed-max-label').textContent,'10 Jahre / s');
    assert.match(el.get('sim-date-readout').textContent,/^\d{2}\.\d{2}\.2026\n\d{2}:\d{2}$/);
    state.playing=false;
    state.timelineMode='planet';state.speed=1/24;
    syncControls(state);
    assert.match(el.get('play-icon-path').attrs.d,/M7 4v16/);
    assert.equal(el.get('play-btn').attrs['aria-pressed'],'false');
    assert.equal(el.get('speed').value,'75');
    assert.equal(el.get('speed-min-label').textContent,'1 Min. / s');
    assert.equal(el.get('speed-max-label').textContent,'1 Jahr / s');
  } finally {if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});

test('v18: one compact time trigger contains Play, slider, and Heute in its popup',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
  const app=await readAppSource();
  const panel=html.split('id="time-panel"')[1].split('id="canvas-error"')[0];
  assert.equal((panel.match(/<button\b[^>]*id="(?:speed-btn|play-btn|today-btn)"/g)||[]).length,3,'one time trigger and two popup actions');
  const trigger=panel.slice(0,panel.indexOf('id="speed-popover"'));
  assert.equal((trigger.match(/<button\b/g)||[]).length,1,'only dropdown trigger is visible when closed');
  for(const id of ['play-btn','speed-btn','today-btn'])assert.match(panel,new RegExp(`id="${id}"`));
  assert.match(panel,/id="sim-date-label"/);
  assert.match(panel,/id="today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.doesNotMatch(panel,/<span>Heute<\/span>/);
  assert.doesNotMatch(panel,/type="date"/);
  assert.match(panel,/id="speed-popover"[^>]*hidden/);
  assert.match(panel,/id="speed"[^>]*type="range"[^>]*max="240"/);
  assert.match(panel,/aria-orientation="vertical"/);
  assert.match(css,/writing-mode:vertical-lr;direction:rtl/);
  assert.match(app,/if\(syncSpeedMode\(S,view\)\)/);
  assert.match(app,/\$\('speed-btn'\)\.addEventListener\('click'/);
  assert.match(app,/\$\('today-btn'\)\.addEventListener\('click',\(\)=>\{S\.time=Date\.now\(\);updateTime\(\);updateDetail\(\);\}\)/);
  assert.match(app,/if\(e\.key==='Escape'\)\{/);
  assert.match(app,/!\$\('speed-picker-wrap'\)\.contains\(e\.target\)/);
});
