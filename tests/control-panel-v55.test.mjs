import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';

const read = path => readProjectSource(path);
const part = (text,start,end) => {
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Segment missing: ${start} before ${end}`);
  return text.slice(a,b);
};

const PRIMARY=['orbit-row-btn','scale-objects-btn','scale-orbits-btn'];
const EXTRA=['toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-lighting','toggle-four-moons'];

test('v55: all three scale modes are direct top-level buttons in the right order',async()=>{
  const html=await read('index.html'),control=part(html,'id="view-mode-status"','id="layer-picker-wrap"');
  assert.match(control,/class="scale-main-controls" role="group" aria-label="Maßstab und Reihendarstellung"/);
  assert.deepEqual([...control.matchAll(/id="(scale-objects-btn|scale-orbits-btn|orbit-row-btn)"/g)].map(x=>x[1]),PRIMARY);
  for(const [id,label] of PRIMARY.map((id,i)=>[id,['Reihe','Objekt','Bahn'][i]])){
    const button=control.match(new RegExp(`<button[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
    assert.ok(button,id);
    assert.match(button,/<svg\b/);
    assert.match(button,new RegExp(`scale-option-label">${label}</span>`));
    assert.match(button,/aria-pressed="false"/);
  }
  assert.doesNotMatch(html,/id="scale-btn"|id="scale-popover"|id="scale-picker-wrap"/);
});

test('v96: five appearance switches are grouped above the categories within Layer',async()=>{
 const html=await read('index.html');
 const layer=part(html,'id="layer-popover"','id="canvas-error"');
 assert.ok(layer.indexOf('class="layer-presets"')<layer.indexOf('class="layer-display-controls"'));
 assert.ok(layer.indexOf('class="layer-display-controls"')<layer.indexOf('class="layer-options"'));
 assert.match(layer,/aria-label="Darstellungseinstellungen"/);
 assert.deepEqual([...layer.matchAll(/id="(toggle-labels|toggle-lighting|toggle-four-moons|orbit-visibility-btn|orbit-contrast-btn)"/g)].map(x=>x[1]),EXTRA);
 for(const id of EXTRA){
   assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
   assert.match(layer,new RegExp(`id="${id}"[^>]*aria-pressed="(true|false)"`));
 }
 assert.match(layer,/data-layer-type="star" checked/);
 assert.match(layer,/data-layer-type="dwarf" aria-label="Zwergplaneten und transneptunische Objekte"/);
 assert.doesNotMatch(layer,/data-layer-type="tno"/);
});

test('v55: the moon and orbit toggles preserve their previous semantics and SVGs',async()=>{
 const [html,app]=await Promise.all([read('index.html'),read('src/app.js')]);
 const layer=part(html,'id="layer-popover"','id="canvas-error"');
 const moon=layer.match(/<button[^>]*id="toggle-four-moons"[\s\S]*?<\/button>/)?.[0];
 assert.ok(moon,'moon button remains present');
 assert.equal((moon.match(/<circle /g)||[]).length,9);
 assert.match(moon,/aria-pressed="false"/);
 assert.match(moon,/maximal vier Monde je Planet/);
 assert.match(app,/const showAll=S\.settings\.fourMoons===false/);
 assert.match(app,/advanceOrbitDisplayMode\(S\.settings\)/);
 assert.match(app,/S\.settings\.lighting=S\.settings\.lighting==='realistic'\?'optimized':'realistic'/);
});

test('v55: the removed scale popup has no script event or dangling references',async()=>{
 const app=await read('src/app.js');
 assert.doesNotMatch(app,/setScalePopover|\$\('scale-btn'\)|\$\('scale-popover'\)/);
 assert.match(app,/\['scale-objects-btn','scaleObjects'\]/);
 assert.match(app,/\$\('orbit-row-btn'\)\.addEventListener\('click',updateRow\)/);
 assert.doesNotMatch(app,/setSpeedPopover|speed-popover/);
 assert.match(app,/setLayerPopover\(opening\)/);
 assert.match(app,/if\(!\$\('layer-popover'\)\.hidden\)/);
});

test('v96: small viewports wrap the toolbar and the Layer switches form two paired rows',async()=>{
 const css=await read('css/styles.css');
 const v55=css;
 assert.match(v55,/flex-wrap:wrap/);
 assert.match(v55,/max-width:calc\(100% - var\(--control-right-inset\) - 8px\)!important/);
 assert.match(v55,/\.layer-display-toggles\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(v55,/\.layer-display-toggles \.scale-tool-toggle:nth-child\(4\)\{grid-column/);
 assert.match(v55,/\.viewport>\.control-panel \.layer-popover\{width:155px/);
 assert.match(v55,/@media\(max-width:770px\)/);
});

