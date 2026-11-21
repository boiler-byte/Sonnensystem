import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {formatLocalDate, formatLocalDateTime, syncControls, SPEED_MODES, speedAtStep} from '../src/ui/timeline.js';

const read=async path=>readProjectSource(path);

test('v124: one Layer panel displays browser-local date/time and speed',()=>{
  const previous=globalThis.document,nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',attrs:{},setAttribute(name,value){this.attrs[name]=String(value);}});
    return nodes.get(id);
  }};
  try{
    const state={playing:true,time:new Date(2026,10,17,18,32).getTime(),speed:3/24,timelineMode:'solar'};
    syncControls(state);
    assert.equal(nodes.get('layer-sim-date').textContent,'17.11.2026 18:32');
    assert.equal(nodes.get('layer-speed-value').textContent,'3 Std. / s');
    assert.match(nodes.get('layer-play-icon-path').attrs.d,/M7 5h4/);
    state.playing=false;state.timelineMode='planet';state.speed=SPEED_MODES.planet.defaultSpeed;
    syncControls(state);
    assert.equal(nodes.get('layer-speed-value').textContent,'1 Std. / s');
    assert.equal(nodes.get('layer-speed').value,'75');
    assert.match(nodes.get('layer-play-icon-path').attrs.d,/M7 4v16/);
    assert.equal(nodes.get('layer-play-btn').attrs['aria-pressed'],'false');
    assert.match(nodes.get('layer-play-btn').attrs['aria-label'],/Simulation starten/);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('v18: date label follows local timezone across midnight rather than UTC',()=>{
  const moduleUrl=new URL('../src/ui/timeline.js',import.meta.url).href;
  const script=`import {formatLocalDate} from ${JSON.stringify(moduleUrl)}; process.stdout.write(formatLocalDate(Date.UTC(2026,0,1,1,23)))`;
  const readInZone=TZ=>execFileSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,TZ},encoding:'utf8'});
  assert.equal(readInZone('Pacific/Honolulu'),'31.12.2025');
  assert.equal(readInZone('Europe/Berlin'),'01.01.2026');
  assert.equal(formatLocalDate(new Date(2026,9,31,16,45)),'31.10.2026');
  assert.match(formatLocalDateTime(new Date(2026,9,31,16,45)),/31\.10\.2026 16:45/);
});

test('v124: Layer is the only desktop/mobile time dropdown and time controls are focusable',async()=>{
  const [html,css,app]=await Promise.all([read('index.html'),read('css/styles.css'),read('src/app.js')]);
  const panel=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  assert.match(html,/id="layer-btn"[^>]*aria-controls="layer-popover"/);
  assert.match(html,/id="layer-speed-panel"[^>]*hidden/);
  for(const id of ['layer-play-btn','layer-today-btn','layer-speed','layer-sim-date'])assert.match(panel,new RegExp(`id="${id}"`));
  assert.match(panel,/id="layer-today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.match(panel,/type="range" min="0" max="240" step="1"/);
  assert.match(css,/\.layer-speed-rail #layer-speed\{[^}]*transform:translate\(-50%,-50%\) rotate\(-90deg\)/);
  assert.match(app,/\$\('layer-play-btn'\)\.addEventListener\('click',togglePlayback\)/);
  assert.match(app,/\$\('layer-today-btn'\)\.addEventListener\('click',resetToToday\)/);
  assert.doesNotMatch(html,/id="time-panel"|id="speed-btn"|id="speed-popover"|id="today-btn"/);
});

test('v18: logarithmic slider limits and independent default speeds are unaffected',()=>{
  assert.equal(speedAtStep('solar',0),SPEED_MODES.solar.min);
  assert.equal(speedAtStep('solar',240),SPEED_MODES.solar.max);
  assert.equal(speedAtStep('planet',0),SPEED_MODES.planet.min);
  assert.equal(speedAtStep('planet',240),SPEED_MODES.planet.max);
});
