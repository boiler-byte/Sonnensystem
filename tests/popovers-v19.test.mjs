import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {syncControls, SPEED_MODES} from '../src/ui/timeline.js';
const read=async name=>readProjectSource(name);

const within=(text,start,end)=>{
  const a=text.indexOf(start), b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`${start} must precede ${end}`);
  return text.slice(a,b);
};

test('v55: Layer dropdown owns orbit toggles; category palette remains enabled',async()=>{
  const html=await read('index.html'),app=await read('src/ui/event-handlers.js'),layerModel=await read('src/data/layers.js');
  const layer=within(html,'id="layer-popover"','id="canvas-error"');
  assert.match(layer,/class="layer-display-toggles"/);
  assert.doesNotMatch(html,/id="scale-popover"|id="scale-btn"/);
  for(const id of ['orbit-visibility-btn']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
    assert.match(layer,new RegExp(`id="${id}"[^>]*aria-pressed="${'true'}"`));
  }
  assert.doesNotMatch(html,/id="toggle-orbits"|id="orbit-popover"|id="orbit-picker-wrap"|id="orbit-colors-btn"/);
  assert.doesNotMatch(app,/setOrbitPopover|orbit-popover|toggle-orbits/);
  assert.match(layerModel,/orbitContrast:false,\s*galacticMotion:false,\s*labels:true/);
  assert.match(app,/\$\('layer-btn'\)\.addEventListener\('click'/);
  assert.match(app,/advanceOrbitDisplayMode\(S\.settings\)/);
  assert.match(layer,/id="orbit-contrast-btn"/);
});

test('v125: single Layer tempo panel groups floating speed value, actions and date',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const panel=within(html,'id="layer-speed-panel"','id="canvas-error"');
  const order=['class="layer-speed-layout"','id="layer-speed"','class="layer-speed-value-track"','id="layer-speed-value"','class="layer-speed-actions"','id="layer-play-btn"','id="layer-today-btn"','id="layer-sim-date"'];
  let last=-1;
  for(const item of order){const at=panel.indexOf(item);assert.ok(at>last,`${item} must appear in order`);last=at;}
  assert.match(css,/\.layer-speed-value-track\{position:absolute/);
  assert.match(css,/\.layer-speed-date\{[^}]*border-top:1px solid/);
});

test('v124: only the Layer menu sits beneath its toolbar button',async()=>{
  const [css,html]=await Promise.all([read('css/styles.css'),read('index.html')]);
  assert.match(css,/\.control-panel \.layer-popover\{top:calc\(100% \+ 7px\);right:0;left:auto;bottom:auto/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:140px/);
  assert.equal((html.match(/id="layer-btn"/g)||[]).length,1);
  assert.equal((html.match(/id="speed-btn"/g)||[]).length,0);
  assert.equal((html.match(/id="time-panel"/g)||[]).length,0);
});

test('v124: Layer date is local and shows date plus time',()=>{
  const previous=globalThis.document,nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',attrs:{},setAttribute(k,v){this.attrs[k]=String(v);}});
    return nodes.get(id);
  }};
  try{
    const time=new Date(2026,10,17,21,6).getTime();
    const state={time,playing:true,speed:SPEED_MODES.solar.defaultSpeed,timelineMode:'solar'};
    syncControls(state);
    assert.equal(nodes.get('layer-sim-date').textContent,'17.11.2026 21:06');
    assert.equal(nodes.get('layer-speed-value').textContent,'5 Tage / s');
    assert.match(nodes.get('layer-sim-date').attrs.datetime,/^2026-11-17T/);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

