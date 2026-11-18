import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {formatLocalDate, formatLocalDateTime, syncControls, SPEED_MODES, speedAtStep} from '../src/ui/timeline.js';

const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v18: two-line trigger shows speed and browser-local date without time; expanded menu shows time',()=>{
  const previous=globalThis.document;
  const nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',attrs:{},setAttribute(name,value){this.attrs[name]=String(value);}});
    return nodes.get(id);
  }};
  try{
    const state={playing:true,time:new Date(2026,10,17,18,32).getTime(),speed:3/24,timelineMode:'solar'};
    syncControls(state);
    assert.equal(nodes.get('sim-date-label').textContent,'17.11.2026');
    assert.equal(nodes.get('sim-date-label').attrs.datetime,'2026-11-17');
    assert.equal(nodes.get('sim-date-readout').textContent,'17.11.2026\n18:32');
    assert.equal(nodes.get('speed-readout').textContent,'3 Std. / s');
    assert.match(nodes.get('speed-btn').attrs['aria-label'],/17\.11\.2026/);
    assert.match(nodes.get('play-icon-path').attrs.d,/M7 5h4/);
    state.playing=false;
    state.timelineMode='planet';state.speed=SPEED_MODES.planet.defaultSpeed;
    syncControls(state);
    assert.equal(nodes.get('speed-readout').textContent,'1 Std. / s');
    assert.equal(nodes.get('speed').value,'75');
    assert.match(nodes.get('play-icon-path').attrs.d,/M7 4v16/);
    assert.equal(nodes.get('play-btn').attrs['aria-pressed'],'false');
    assert.match(nodes.get('speed-btn').attrs['aria-label'],/Pausiert/);
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

test('v18: time dropdown is a single collapsed button with focusable popup controls, desktop and mobile',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),app=await read('src/app.js');
  const panel=html.slice(html.indexOf('id="time-panel"'),html.indexOf('class="scene-tools"'));
  const open=panel.slice(0,panel.indexOf('id="speed-popover"'));
  const popup=panel.slice(panel.indexOf('id="speed-popover"'));
  assert.equal((open.match(/<button\b/g)||[]).length,1);
  assert.match(open,/id="speed-readout"/);
  assert.match(open,/<time id="sim-date-label"/);
  assert.doesNotMatch(open,/id="play-btn"|id="today-btn"/);
  assert.match(open,/aria-expanded="false"/);
  assert.match(popup,/id="speed-popover"[^>]*hidden/);
  for(const id of ['play-btn','today-btn','speed','sim-date-readout'])assert.match(popup,new RegExp(`id="${id}"`));
  assert.match(popup,/<svg id="play-icon"/);
  assert.match(popup,/id="today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.doesNotMatch(popup,/<span>Heute<\/span>/);
  assert.match(popup,/type="range" min="0" max="240" step="1"/);
  assert.match(css,/\.control-panel \.time-panel \.time-trigger\{/);
  assert.match(css,/\.control-panel \.time-panel \.speed-popover\{/);
  assert.match(css,/transform:translate\(-50%,-50%\) rotate\(-90deg\)/);
  assert.match(app,/if\(opening\)\{setLayerPopover\(false\);setScalePopover\(false\);\}/);
  assert.match(app,/if\(!\$\('speed-popover'\)\.hidden\)\{setSpeedPopover\(false\);\$\('speed-btn'\)\.focus/);
  assert.equal((html.match(/id="speed-btn"/g)||[]).length,1);
  assert.equal((html.match(/id="today-btn"/g)||[]).length,1);
});

test('v18: logarithmic slider limits and independent default speeds are unaffected',()=>{
  assert.equal(speedAtStep('solar',0),SPEED_MODES.solar.min);
  assert.equal(speedAtStep('solar',240),SPEED_MODES.solar.max);
  assert.equal(speedAtStep('planet',0),SPEED_MODES.planet.min);
  assert.equal(speedAtStep('planet',240),SPEED_MODES.planet.max);
});
