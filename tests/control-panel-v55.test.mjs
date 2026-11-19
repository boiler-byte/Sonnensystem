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

const PRIMARY=['scale-objects-btn','scale-orbits-btn','orbit-row-btn'];
const EXTRA=['toggle-labels','toggle-lighting','toggle-four-moons','orbit-visibility-btn','orbit-contrast-btn'];

test('v55: all three scale modes are direct top-level buttons in the right order',async()=>{
  const html=await read('index.html'),control=part(html,'id="view-mode-status"','id="layer-picker-wrap"');
  assert.match(control,/class="scale-main-controls" role="group" aria-label="Maßstab und Reihendarstellung"/);
  assert.deepEqual([...control.matchAll(/id="(scale-objects-btn|scale-orbits-btn|orbit-row-btn)"/g)].map(x=>x[1]),PRIMARY);
  for(const [id,label] of PRIMARY.map((id,i)=>[id,['Objekt','Bahn','Reihe'][i]])){
    const button=control.match(new RegExp(`<button[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
    assert.ok(button,id);
    assert.match(button,/<svg\b/);
    assert.match(button,new RegExp(`scale-option-label">${label}</span>`));
    assert.match(button,/aria-pressed="false"/);
  }
  assert.doesNotMatch(html,/id="scale-btn"|id="scale-popover"|id="scale-picker-wrap"/);
});

test('v55: five appearance switches are grouped above the categories within Layer',async()=>{
 const html=await read('index.html');
 const layer=part(html,'id="layer-popover"','id="time-panel"');
 assert.ok(layer.indexOf('class="layer-presets"')<layer.indexOf('class="layer-display-controls"'));
 assert.ok(layer.indexOf('class="layer-display-controls"')<layer.indexOf('class="layer-options"'));
 assert.match(layer,/aria-label="Darstellungseinstellungen"/);
 assert.deepEqual([...layer.matchAll(/id="(toggle-labels|toggle-lighting|toggle-four-moons|orbit-visibility-btn|orbit-contrast-btn)"/g)].map(x=>x[1]),EXTRA);
 for(const id of EXTRA){
   assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
   assert.match(layer,new RegExp(`id="${id}"[^>]*aria-pressed="(true|false)"`));
 }
 assert.match(layer,/data-layer-type="star" checked/);
 assert.match(layer,/data-layer-type="tno"/);
});

test('v55: the moon and orbit toggles preserve their previous semantics and SVGs',async()=>{
 const [html,app]=await Promise.all([read('index.html'),read('src/app.js')]);
 const layer=part(html,'id="layer-popover"','id="time-panel"');
 const moon=part(layer,'id="toggle-four-moons"','id="orbit-visibility-btn"');
 assert.equal((moon.match(/<circle /g)||[]).length,9);
 assert.match(moon,/aria-pressed="false"/);
 assert.match(moon,/maximal vier Monde je Planet/);
 assert.match(app,/const showAll=S\.settings\.fourMoons===false/);
 assert.match(app,/for\(const \[id,setting\] of \[\['orbit-visibility-btn','orbits'\],\['orbit-contrast-btn','orbitContrast'\]\]\)/);
 assert.match(app,/S\.settings\.lighting=S\.settings\.lighting==='realistic'\?'optimized':'realistic'/);
});

test('v55: the removed scale popup has no script event or dangling references',async()=>{
 const app=await read('src/app.js');
 assert.doesNotMatch(app,/setScalePopover|\$\('scale-btn'\)|\$\('scale-popover'\)/);
 assert.match(app,/\['scale-objects-btn','scaleObjects'\]/);
 assert.match(app,/\$\('orbit-row-btn'\)\.addEventListener\('click',updateRow\)/);
 assert.match(app,/if\(opening\)setSpeedPopover\(false\)/);
 assert.match(app,/if\(opening\)setLayerPopover\(false\)/);
 assert.match(app,/if\(!\$\('layer-popover'\)\.hidden\)/);
});

test('v57: small viewports wrap the toolbar and the Layer switches form three plus two rows',async()=>{
 const css=await read('css/styles.css');
 const v55=css;
 assert.match(v55,/flex-wrap:wrap/);
 assert.match(v55,/max-width:calc\(100% - var\(--control-right-inset\) - 8px\)!important/);
 assert.match(v55,/\.layer-display-toggles\{[\s\S]*?grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.ok(v55.includes('.layer-display-toggles .scale-tool-toggle:nth-child(4){grid-column:2 / span 2}'));
 assert.match(v55,/\.layer-popover,[\s\S]*?\.time-panel \.speed-popover\{[\s\S]*?top:calc\(100% \+ 7px\)/);
 assert.match(v55,/@media\(max-width:770px\)/);
});

