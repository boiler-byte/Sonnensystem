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

test('v124: Layer controls update icon, pause state and speed-range labels in each scene',()=>{
  const before=globalThis.document,el=new Map();
  globalThis.document={getElementById:id=>{
    if(!el.has(id))el.set(id,{textContent:'',value:'',attrs:{},setAttribute(name,value){this.attrs[name]=value;}});
    return el.get(id);
  }};
  try{
    const state={playing:true,time:Date.UTC(2026,10,16,23,17),speed:5,timelineMode:'solar'};
    syncControls(state);
    assert.match(el.get('layer-play-icon-path').attrs.d,/M7 5h4/);
    assert.equal(el.get('layer-play-btn').attrs['aria-pressed'],'true');
    assert.equal(el.get('layer-speed-value').textContent,'5 Tage / s');
    assert.equal(el.get('layer-speed').value,'101');
    assert.equal(el.get('layer-speed-max-label').textContent,'10 Jahre / s');
    assert.match(el.get('layer-sim-date').textContent,/^\d{2}\.\d{2}\.2026 \d{2}:\d{2}$/);
    state.playing=false;state.timelineMode='planet';state.speed=1/24;
    syncControls(state);
    assert.match(el.get('layer-play-icon-path').attrs.d,/M7 4v16/);
    assert.equal(el.get('layer-play-btn').attrs['aria-pressed'],'false');
    assert.equal(el.get('layer-speed').value,'75');
    assert.equal(el.get('layer-speed-min-label').textContent,'1 Min. / s');
    assert.equal(el.get('layer-speed-max-label').textContent,'1 Jahr / s');
  }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});

test('v124: one integrated Layer panel contains playback, speed and today',async()=>{
  const [html,css,app]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../css/styles.css',import.meta.url),'utf8'),readAppSource()
  ]);
  const panel=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  for(const id of ['layer-play-btn','layer-speed','layer-today-btn','layer-sim-date'])assert.match(panel,new RegExp(`id="${id}"`));
  assert.doesNotMatch(panel,/class="layer-speed-caption"|>Geschwindigkeit<\/span>|>Datum<\/span>/);
  assert.match(panel,/class="layer-speed-value-track"/);
  assert.match(panel,/aria-orientation="vertical"/);
  assert.match(css,/\.layer-speed-rail #layer-speed\{[^}]*rotate\(-90deg\)/);
  assert.match(app,/if\(syncSpeedMode\(S,view\)\)/);
  assert.match(app,/\$\('layer-speed'\)\.addEventListener\('input'/);
  assert.match(app,/\$\('layer-today-btn'\)\.addEventListener\('click',resetToToday\)/);
  assert.match(app,/if\(e\.key==='Escape'\)\{/);
  assert.doesNotMatch(html,/id="time-panel"|id="speed-popover"/);
});

