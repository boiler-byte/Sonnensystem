import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {CATEGORY_COLORS,TYPES} from '../src/data/bodies.js';
import {createViewSettings} from '../src/data/layers.js';
import {orbitAppearance} from '../src/renderer/orbits.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const between=(text,start,end)=>{
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`${start} precedes ${end}`);
  return text.slice(a,b);
};

test('v42: Maßstab is the first toolbar trigger, before Objektlayer and Zeit',async()=>{
  const html=await read('index.html');
  const panel=between(html,'id="view-mode-status"','id="canvas-error"');
  const ids=['scale-btn','layer-btn','speed-btn'];
  assert.deepEqual([...panel.matchAll(/id="(scale-btn|layer-btn|speed-btn)"/g)].map(m=>m[1]),ids);
  assert.match(panel,/id="scale-btn"[^>]*aria-controls="scale-popover"/);
  assert.match(panel,/id="layer-btn"[^>]*aria-controls="layer-popover"/);
  assert.match(panel,/id="speed-btn"[^>]*aria-controls="speed-popover"/);
  const css=await read('css/styles.css');
  const v42=css.slice(css.indexOf('/* v42: Maßstab is first'));
  assert.match(v42,/\.viewport>\.control-panel \.scale-popover\{[\s\S]*?- var\(--control-trigger-width\) - var\(--control-trigger-width\) - var\(--control-trigger-gap\) - var\(--control-trigger-gap\) - var\(--control-right-inset\)/);
  assert.match(v42,/\.viewport>\.control-panel \.layer-popover\{[\s\S]*?- var\(--control-trigger-width\) - var\(--control-trigger-gap\) - var\(--control-right-inset\)/);
  assert.match(css,/\.viewport>\.control-panel \.time-panel \.speed-popover\{[\s\S]*?right:calc\(0px - var\(--control-right-inset\)\)/);
});

test('v42: two scale columns contain the correct independent icon toggles',async()=>{
  const html=await read('index.html');
  const scale=between(html,'id="scale-popover"','id="layer-picker-wrap"');
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  const columns=scale.split('<div class="scale-column"');
  assert.equal(columns.length,3,'exactly two scale columns');
  const object=columns[1],orbit=columns[2];
  assert.deepEqual([...object.matchAll(/id="(scale-objects-btn|toggle-labels|toggle-lighting|toggle-four-moons)"/g)].map(m=>m[1]),
    ['scale-objects-btn','toggle-labels','toggle-lighting','toggle-four-moons']);
  assert.deepEqual([...orbit.matchAll(/id="(scale-orbits-btn|orbit-visibility-btn|orbit-contrast-btn)"/g)].map(m=>m[1]),
    ['scale-orbits-btn','orbit-visibility-btn','orbit-contrast-btn']);
  const icons=['tab-label-icon','flashlight-icon','four-moons-icon','orbit-visibility-icon','contrast-icon'];
  for(const icon of icons)assert.match(scale,new RegExp(`<svg class="${icon}"[^>]*aria-hidden="true"[^>]*focusable="false"`),icon);
  for(const label of ['Beschriftung','Beleuchtung','4 Monde','Umlaufbahn','Kontrast'])
    assert.doesNotMatch(scale,new RegExp(`<span>${label}</span>`),`visible label ${label} was replaced by an icon`);
  for(const id of ['toggle-labels','toggle-lighting','toggle-four-moons','orbit-visibility-btn','orbit-contrast-btn']){
    assert.match(scale,new RegExp(`id="${id}"[^>]*aria-label="[^"]+"[^>]*aria-pressed="(true|false)"`),id);
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
    assert.doesNotMatch(layer,new RegExp(`id="${id}"`),`${id} was removed from the layer panel`);
  }
  assert.match(object,/class="four-moons-icon"[\s\S]*?<circle[^>]*\/>[\s\S]*?<circle[^>]*\/>[\s\S]*?<circle[^>]*\/>[\s\S]*?<circle[^>]*\/>/);
  assert.match(orbit,/class="orbit-visibility-icon"[^>]*><circle[^>]*\/><circle[^>]*\/>/);
  assert.match(orbit,/class="contrast-icon"[^>]*><circle[^>]*fill="#f5f7fc"[^>]*><\/circle>|class="contrast-icon"[^>]*><circle[^>]*fill="#f5f7fc"[^>]*\/>/);
});

test('v42: solar starts with lighting off; planet starts with lighting on',()=>{
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  assert.equal(solar.lighting,'optimized');
  assert.equal(planet.lighting,'realistic');
  assert.equal(solar.labels,true);
  assert.equal(solar.fourMoons,true);
  assert.equal(planet.fourMoons,false);
  assert.equal(solar.orbitContrast,false);
  assert.equal(planet.orbitContrast,false);
  solar.lighting='realistic';
  assert.equal(planet.lighting,'realistic','solar and planet toggles remain independent');
  planet.lighting='optimized';
  assert.equal(solar.lighting,'realistic','planet changes do not affect solar preferences');
});

test('v42: moon category colour remains #E6EDF5 everywhere it is reused',()=>{
  assert.equal(CATEGORY_COLORS.moon,'#E6EDF5');
  assert.equal(TYPES.moon.color,'#E6EDF5');
  assert.equal(orbitAppearance({type:'moon',id:'moon'},{orbitContrast:false,orbitColors:true}).color,'#E6EDF5');
});

test('v43: icon toggles retain visual pressed state and keyboard focus without status text',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const scale=between(html,'id="scale-popover"','id="layer-picker-wrap"');
  const defaults={
    'toggle-labels':true,'toggle-lighting':false,'toggle-four-moons':true,
    'orbit-visibility-btn':true,'orbit-contrast-btn':false
  };
  for(const [id,enabled] of Object.entries(defaults)){
    const button=scale.match(new RegExp(`<button[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
    assert.ok(button,id);
    assert.match(button,new RegExp(`aria-pressed="${enabled}"`));
    assert.doesNotMatch(button,/<span class="orbit-toggle-indicator"/);
    assert.match(button,/title="[^"]+"/);
  }
  assert.doesNotMatch(scale,/id="orbit-colors-btn"|class="palette-icon"/);
  assert.match(css,/\.scale-tool-toggle:focus-visible\{outline:2px solid/);
  assert.match(css,/\.scale-tool-toggle svg\{[\s\S]*?pointer-events:none/);
});
