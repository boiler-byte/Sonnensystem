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

test('v55: three scale toggles precede Layer and Time, without scale dropdown',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const panel=between(html,'id="view-mode-status"','id="canvas-error"');
  const ids=['scale-objects-btn','scale-orbits-btn','orbit-row-btn','layer-btn','speed-btn'];
  const re=/id="(scale-objects-btn|scale-orbits-btn|orbit-row-btn|layer-btn|speed-btn)"/g;
  assert.deepEqual([...panel.matchAll(re)].map(m=>m[1]),ids);
  assert.match(panel,/class="scale-main-controls" role="group"/);
  for(const label of ['Objekt','Bahn','Reihe'])assert.match(panel,new RegExp(`class="scale-option-label">${label}</span>`));
  assert.doesNotMatch(panel,/id="scale-btn"|id="scale-popover"|id="scale-picker-wrap"/);
  assert.match(panel,/id="layer-btn"[^>]*aria-controls="layer-popover"/);
  assert.match(panel,/id="speed-btn"[^>]*aria-controls="speed-popover"/);
  const v55=css;
  assert.match(v55,/\.scale-main-controls\{/);
  assert.match(v55,/flex-wrap:wrap/);
  assert.match(v55,/\.layer-popover,[\s\S]*?\.time-panel \.speed-popover\{/);
});

test('v96: two toolbar scale toggles plus Reihe; four paired icons above Layer categories',async()=>{
  const html=await read('index.html');
  const scale=between(html,'class="scale-main-controls"','id="layer-picker-wrap"');
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  const ids=['scale-objects-btn','scale-orbits-btn','orbit-row-btn'];
  assert.deepEqual([...scale.matchAll(/id="(scale-objects-btn|scale-orbits-btn|orbit-row-btn)"/g)].map(m=>m[1]),ids);
  assert.match(scale,/id="orbit-row-btn"[\s\S]*?scale-option-label">Reihe<\/span>/);
  const appearance=['toggle-labels','orbit-visibility-btn','toggle-lighting','toggle-four-moons'];
  const tools=between(layer,'class="layer-display-controls"','class="layer-options"');
  assert.deepEqual([...tools.matchAll(/id="(toggle-labels|toggle-lighting|toggle-four-moons|orbit-visibility-btn|orbit-contrast-btn)"/g)].map(m=>m[1]),appearance);
  assert.ok(layer.indexOf('layer-display-controls')<layer.indexOf('layer-options'));
  for(const id of appearance){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
    assert.match(tools,new RegExp(`id="${id}"[^>]*aria-label="[^"]+"[^>]*aria-pressed="(true|false)"`));
    assert.doesNotMatch(scale,new RegExp(`id="${id}"`));
  }
  const dots=tools.match(/<svg class="nine-moons-icon"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  assert.equal((dots?.match(/<circle /g)||[]).length,9);
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

test('v55: appearance toggles retain aria-pressed states, titles and keyboard focus styling',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  const defaults={'toggle-labels':true,'toggle-lighting':false,'toggle-four-moons':false,
                  'orbit-visibility-btn':true};
  for(const [id,enabled] of Object.entries(defaults)){
    const button=layer.match(new RegExp(`<button[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
    assert.ok(button,id);
    assert.match(button,new RegExp(`aria-pressed="${enabled}"`));
    assert.match(button,/title="[^"]+"/);
    assert.doesNotMatch(button,/orbit-toggle-indicator/);
  }
  assert.match(css,/\.scale-tool-toggle:focus-visible\{outline:2px solid/);
  assert.match(css,/\.scale-tool-toggle svg\{[\s\S]*?pointer-events:none/);
});

