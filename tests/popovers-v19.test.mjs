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
  const html=await read('index.html'),app=await read('src/app.js'),layerModel=await read('src/data/layers.js');
  const layer=within(html,'id="layer-popover"','id="time-panel"');
  assert.match(layer,/class="layer-display-toggles"/);
  assert.doesNotMatch(html,/id="scale-popover"|id="scale-btn"/);
  for(const id of ['orbit-visibility-btn']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
    assert.match(layer,new RegExp(`id="${id}"[^>]*aria-pressed="${'true'}"`));
  }
  assert.doesNotMatch(html,/id="toggle-orbits"|id="orbit-popover"|id="orbit-picker-wrap"|id="orbit-colors-btn"/);
  assert.doesNotMatch(app,/setOrbitPopover|orbit-popover|toggle-orbits/);
  assert.match(layerModel,/orbitContrast:false,\s*labels:true/);
  assert.match(app,/\$\('layer-btn'\)\.addEventListener\('click'/);
  assert.match(app,/advanceOrbitDisplayMode\(S\.settings\)/);
  assert.doesNotMatch(layer,/id="orbit-contrast-btn"/);
});

test('v21: time menu header has only speed, and a stacked slider precedes two action buttons and date/time',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const menu=within(html,'class="speed-popover" id="speed-popover"','id="canvas-error"');
  const head=within(menu,'class="speed-popover-header"','class="time-popover-grid"');
  assert.match(head,/id="speed-popover-value"/);
  assert.doesNotMatch(head,/ZEITSTEUERUNG|Zeitsteuerung|sim-date-readout/);
  const grid=menu.slice(menu.indexOf('class="time-popover-grid"'));
  const slider=within(grid,'class="vertical-speed-control"','class="time-popover-actions"');
  assert.match(slider,/id="speed" type="range"/);
  assert.ok(grid.indexOf('id="play-btn"')<grid.indexOf('id="today-btn"'));
  assert.ok(grid.indexOf('id="today-btn"')<grid.indexOf('id="sim-date-readout"'));
  assert.match(menu,/id="sim-date-readout" class="time-popover-date"/);
  assert.match(css,/\.control-panel \.time-panel \.time-popover-grid\{\s*display:flex;flex-direction:column/);
  assert.match(css,/\.control-panel \.time-panel \.time-popover-buttons\{\s*display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.control-panel \.time-panel \.time-popover-actions\{\s*display:flex;flex-direction:column/);
  assert.match(css,/white-space:pre-line/);
});

test('v20: both menus remain aligned under triggers on desktop and mobile',async()=>{
  const css=await read('css/styles.css'),html=await read('index.html');
  const v19=css;
  assert.match(v19,/\.control-panel \.layer-popover\{\s*top:calc\(100% \+ 7px\);right:0;left:auto;bottom:auto;/);
  assert.match(v19,/\.control-panel \.time-panel \.speed-popover\{\s*position:absolute;top:calc\(100% \+ 7px\);right:0;left:auto;bottom:auto;/);
  assert.match(v19,/\.viewport>\.control-panel \.layer-popover\{/);
  assert.match(v19,/\.viewport>\.control-panel \.time-panel \.time-trigger\{/);
  assert.doesNotMatch(v19,/\.control-panel \.scene-tools\{/,'removed scene tools have no remaining CSS');
  assert.equal((html.match(/id="layer-btn"/g)||[]).length,1);
  assert.equal((html.match(/id="speed-btn"/g)||[]).length,1);
});

test('v19: local time readout breaks between calendar date and time while trigger remains date-only',()=>{
  const previous=globalThis.document, nodes=new Map();
  globalThis.document={getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:'',value:'',attrs:{},setAttribute(k,v){this.attrs[k]=String(v);}});
    return nodes.get(id);
  }};
  try{
    const time=new Date(2026,10,17,21,6).getTime();
    const state={time,playing:true,speed:SPEED_MODES.solar.defaultSpeed,timelineMode:'solar'};
    syncControls(state);
    assert.equal(nodes.get('sim-date-label').textContent,'17.11.2026');
    assert.equal(nodes.get('sim-date-readout').textContent,'17.11.2026\n21:06');
    assert.equal(nodes.get('speed-readout').textContent,'5 Tage / s');
    assert.ok(!nodes.get('speed-btn').attrs['aria-label'].includes('21:06'));
    assert.match(nodes.get('sim-date-readout').attrs.datetime,/^2026-11-17T/);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
