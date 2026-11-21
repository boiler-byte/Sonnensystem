import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {STANDARD_LAYERS, PLANET_STANDARD_LAYERS, LAYER_TYPES, LAYER_FILTER_TYPES, createViewSettings, availableLayerTypes, layerEnabled, layerPreset, updateLayerSelection} from '../src/data/layers.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=async path=>readProjectSource(path);
const popover=html=>html.split('id="layer-popover"')[1].split('id="canvas-error"')[0];

test('v25: solar standard contains only Sun/star and planets; renderer layer mask is independent',()=>{
  assert.deepEqual(STANDARD_LAYERS,['star','planet']);
  const scene=createViewSettings('solar');
  assert.equal(scene.layers.mode,'standard');
  assert.deepEqual([...scene.layers.types],['star','planet']);
  for(const type of LAYER_TYPES)
    assert.equal(layerEnabled(scene.layers,type),['star','planet'].includes(type),type);
  const solarBods=INITIAL_BODIES.filter(body=>layerEnabled(scene.layers,body.type));
  assert.equal(solarBods.filter(body=>body.type==='planet').length,8);
  assert.deepEqual(solarBods.filter(body=>body.type==='star').map(body=>body.id),['sun']);
  assert.equal(solarBods.filter(body=>body.type==='moon').length,0);
  assert.equal(solarBods.filter(body=>body.type==='satellite').length,0);
});

test('v25: planet default remains planet, moon, satellite and the views preserve their own choices',()=>{
  assert.deepEqual(PLANET_STANDARD_LAYERS,['planet','moon','satellite']);
  const solar=createViewSettings('solar');
  const planet=createViewSettings('planet');
  assert.deepEqual([...planet.layers.types],['planet','moon','satellite']);
  assert.deepEqual(availableLayerTypes(INITIAL_BODIES,'planet','earth'),['planet','moon','satellite']);
  for(const type of LAYER_TYPES)
    assert.equal(layerEnabled(planet.layers,type),PLANET_STANDARD_LAYERS.includes(type),type);
  solar.layers=layerPreset('all','solar');
  solar.layers=updateLayerSelection(solar.layers,'star',false,'solar');
  planet.layers=updateLayerSelection(planet.layers,'moon',false,'planet',availableLayerTypes(INITIAL_BODIES,'planet','earth'));
  assert.equal(solar.layers.mode,'custom');
  assert.equal(planet.layers.mode,'custom');
  assert.equal(layerEnabled(planet.layers,'star'),false);
  planet.layers=layerPreset('standard','planet');
  assert.equal(planet.layers.mode,'standard');
  assert.equal(solar.layers.mode,'custom','switching or resetting a planet preset must not reset the solar view');
  solar.layers=layerPreset('standard','solar');
  assert.deepEqual([...solar.layers.types],STANDARD_LAYERS);
  assert.equal(layerEnabled(planet.layers,'moon'),true);
});

test('v55: Layer preset precedes appearance settings and object categories',async()=>{
  const html=await read('index.html'),layer=popover(html);
  assert.match(layer,/class="layer-presets" role="group" aria-label="Objektlayer-Voreinstellung"/);
  assert.match(layer,/data-layer-preset="all" aria-pressed="false">Alle/);
  assert.match(layer,/data-layer-preset="standard" aria-pressed="true">Standard/);
  assert.ok(layer.indexOf('layer-presets')<layer.indexOf('layer-display-controls'));
  assert.ok(layer.indexOf('layer-display-controls')<layer.indexOf('class="layer-options"'));
  for(const id of ['orbit-visibility-btn','toggle-labels','toggle-lighting','toggle-four-moons']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
    assert.match(layer,new RegExp(`id="${id}"`));
  }
  assert.doesNotMatch(layer,/class="layer-section-title"|class="orbit-popover-note"/);
  assert.doesNotMatch(layer,/id="layer-note"|class="layer-display-heading"/);
});

test('v25: initial checkbox state matches solar only; view transition still synchronizes switches',async()=>{
  const html=await read('index.html'),app=await read('src/app.js');
  const layer=popover(html);
  const found=[...layer.matchAll(/<input type="checkbox" data-layer-type="(\w+)"( checked)?(?: aria-label="[^"]*")?\/>/g)];
  assert.equal(found.length,LAYER_FILTER_TYPES.length);
  assert.deepEqual(found.filter(match=>Boolean(match[2])).map(match=>match[1]),['star','planet']);
  assert.match(app,/S\.settings=S\.viewSettings\[view\]/);
  assert.match(app,/check\.checked=members\.length>0 && members\.every\(member => layerEnabled\(selected,member\)\)/);
  assert.match(app,/preset\.dataset\.layerPreset===selected\.mode/);
  assert.match(app,/changeLayers\(layerPreset\(btn\.dataset\.layerPreset,activeView\(\)\)\)/);
  assert.doesNotMatch(app,/\$\('layer-note'\)/);
});

test('v25: dropdown is about one third narrower; preset switch shares border and options have no divider',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.layer-popover\{[^\n]*width:155px/);
  assert.match(css,/\.control-panel \.layer-popover\{[\s\S]*?width:155px/);
  assert.ok(Math.abs(155/227-2/3)<0.02);
  assert.match(css,/\.layer-presets\{[^\n]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:0/);
  assert.match(css,/\.layer-preset\{[^\n]*border:0/);
  assert.match(css,/\.layer-preset\.active/);
  assert.match(css,/\.layer-options\{display:grid;gap:3px\}/);
  assert.doesNotMatch(css,/\.layer-options\{[^\n]*border-top/);
  assert.doesNotMatch(css,/\.layer-orbit-section|\.orbit-suboption/,'removed orbit submenu has no remaining CSS');
  assert.doesNotMatch(css,/\.layer-section-title\{|\.orbit-popover-note\{|\.layer-popover-title\{/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{[\s\S]*?overflow-y:auto/);
});
