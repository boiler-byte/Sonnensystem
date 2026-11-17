import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {syncControls,SPEED_MODES,SPEED_STEPS,speedAtStep} from '../src/ui/timeline.js';

const read=async filename=>readFile(new URL('../'+filename,import.meta.url),'utf8');

// Keep the v21 time-control markup and CSS layout in sync across desktop/mobile.
test('v21: dropdown matches its trigger width; slider, side-by-side icons and date are vertically stacked',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const time=html.slice(html.indexOf('id="time-panel"'),html.indexOf('class="scene-tools"'));
  const popup=time.slice(time.indexOf('id="speed-popover"'));
  const order=['class="vertical-speed-control"','class="speed-slider-rail"','id="speed"','class="time-popover-actions"','class="time-popover-buttons"','id="play-btn"','id="today-btn"','id="sim-date-readout"'];
  let last=-1;
  for(const item of order){const at=popup.indexOf(item);assert.ok(at>last,`${item} must follow preceding control`);last=at;}
  assert.match(popup,/id="today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.doesNotMatch(popup,/<span>Heute<\/span>/);
  assert.match(css,/\.control-panel \.time-panel \.speed-popover\{[\s\S]*?width:100%;min-width:0;max-width:none;box-sizing:border-box/);
  assert.match(css,/\.control-panel \.time-panel \.time-popover-grid\{\s*display:flex;flex-direction:column/);
  assert.match(css,/\.control-panel \.time-panel \.time-popover-buttons\{\s*display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.control-panel \.time-panel \.time-popover-date\{[\s\S]*?white-space:pre-line/);
});

test('v21: centered 26px thumb and filled track work in WebKit/Chromium and Firefox',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.speed-slider-rail\{\s*position:relative;width:44px;height:150px/);
  assert.match(css,/\.vertical-speed-control #speed\{[\s\S]*?top:50%;left:50%;[\s\S]*?transform:translate\(-50%,-50%\) rotate\(-90deg\)/);
  for(const pseudo of ['::-webkit-slider-runnable-track','::-moz-range-track']){
    const block=css.slice(css.lastIndexOf(`.vertical-speed-control #speed${pseudo}{`));
    assert.match(block,/height:6px/);
    assert.match(block,/background:linear-gradient\(to right,[\s\S]*?var\(--speed-fill\) var\(--speed-progress\),[\s\S]*?var\(--speed-empty\) var\(--speed-progress\)/);
  }
  assert.match(css,/#speed::-webkit-slider-thumb\{[\s\S]*?width:26px;height:26px;[\s\S]*?margin-top:-11px/);
  assert.match(css,/#speed::-moz-range-thumb\{[\s\S]*?width:26px;height:26px/);
});

test('v21: fill matches the logarithmic step in both timeline modes while date and playback remain independent',()=>{
  const before=globalThis.document;
  const nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',attrs:{},setAttribute(key,val){this.attrs[key]=String(val);}});
    return nodes.get(id);
  }};
  try{
    const state={time:new Date(2026,10,17,19,17).getTime(),playing:false,speed:SPEED_MODES.solar.defaultSpeed,timelineMode:'solar'};
    for(const mode of ['solar','planet']){
      state.timelineMode=mode;
      for(const step of [0,23,75,120,SPEED_STEPS]){
        state.speed=speedAtStep(mode,step);
        syncControls(state);
        assert.equal(Number(nodes.get('speed').value),step);
        const actual=Number(nodes.get('speed').attrs.style.match(/--speed-progress:([\d.]+)%/)[1]);
        assert.ok(Math.abs(actual-100*step/SPEED_STEPS)<1e-8,`track fill at ${mode} ${step}`);
        assert.equal(nodes.get('play-btn').attrs['aria-pressed'],'false');
        assert.equal(nodes.get('sim-date-readout').textContent,'17.11.2026\n19:17');
      }
    }
  }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});
