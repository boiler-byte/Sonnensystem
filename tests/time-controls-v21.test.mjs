import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {syncControls,SPEED_MODES,SPEED_STEPS,speedAtStep} from '../src/ui/timeline.js';

const read=async filename=>readFile(new URL('../'+filename,import.meta.url),'utf8');

// Keep the v21 time-control markup and CSS layout in sync across desktop/mobile.
test('v125: the Layer tempo panel displays moving speed, icon actions and date in order',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const panel=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  const order=['class="layer-speed-layout"','id="layer-speed"','class="layer-speed-value-track"','id="layer-speed-value"','class="layer-speed-actions"','id="layer-play-btn"','id="layer-today-btn"','id="layer-sim-date"'];
  let last=-1;
  for(const part of order){const at=panel.indexOf(part);assert.ok(at>last,`${part} follows previous elements`);last=at;}
  assert.match(css,/\.layer-speed-panel\{display:flex;flex-direction:column/);
  assert.match(css,/\.layer-speed-actions\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.layer-speed-value-track\{position:absolute/);
  assert.match(css,/\.layer-speed-date\{[^}]*padding:9px 0 0/);
});

test('v124: Layer speed range remains keyboard accessible and has filled tracks in WebKit and Firefox',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.layer-speed-rail\{position:relative;width:42px;height:190px/);
  assert.match(css,/\.layer-speed-rail #layer-speed\{[^}]*rotate\(-90deg\)/);
  for(const pseudo of ['::-webkit-slider-runnable-track','::-moz-range-track']){
    const block=css.slice(css.indexOf(`.layer-speed-rail #layer-speed${pseudo}{`));
    assert.match(block,/height:6px/);
    assert.match(block,/background:var\(--speed-track-bg\)/);
  }
  // The shared track token remains local to the two range inputs, so the
  // JavaScript-updated --speed-progress is resolved on each individual slider.
  assert.match(css,/\.vertical-speed-control #speed, \.layer-speed-rail #layer-speed\{[^}]*--speed-track-bg:linear-gradient\(/);
  assert.match(css,/--speed-track-bg:[^}]*var\(--speed-fill\) var\(--speed-progress\)/);
  assert.match(css,/--speed-track-bg:[^}]*var\(--speed-empty\) var\(--speed-progress\)/);
  assert.match(css,/#layer-speed::-webkit-slider-thumb\{[^}]*width:26px;height:26px/);
  assert.match(css,/#layer-speed::-moz-range-thumb\{[^}]*width:26px;height:26px/);
});

test('v124: Layer slider fill mirrors both scene modes without unpausing or resetting date',()=>{
  const before=globalThis.document,nodes=new Map();
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
        assert.equal(Number(nodes.get('layer-speed').value),step);
        const actual=Number(nodes.get('layer-speed').attrs.style.match(/--speed-progress:([\d.]+)%/)[1]);
        assert.ok(Math.abs(actual-100*step/SPEED_STEPS)<1e-8,`track fill at ${mode} ${step}`);
        assert.equal(nodes.get('layer-play-btn').attrs['aria-pressed'],'false');
        assert.equal(nodes.get('layer-sim-date').textContent,'17.11.2026 19:17');
      }
    }
  }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});

