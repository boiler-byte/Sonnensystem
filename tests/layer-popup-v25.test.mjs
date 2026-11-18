import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {STANDARD_LAYERS, PLANET_STANDARD_LAYERS, LAYER_TYPES, createViewSettings, availableLayerTypes, layerEnabled, layerPreset, updateLayerSelection} from '../src/data/layers.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const popover=html=>html.split('id="layer-popover"')[1].split('id="time-panel"')[0];

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

test('v25: HTML has accessible two-segment preset, no visible section headings or orbit note',async()=>{
  const html=await read('index.html');
  const layer=popover(html);
  assert.match(layer,/class="layer-presets" role="group" aria-label="Objektlayer-Voreinstellung"/);
  assert.match(layer,/data-layer-preset="all" aria-pressed="false">Alle/);
  assert.match(layer,/data-layer-preset="standard" aria-pressed="true">Standard/);
  assert.doesNotMatch(layer,/<[^>]+class="layer-popover-title"/);
  assert.doesNotMatch(layer,/<[^>]+class="layer-section-title"/);
  assert.doesNotMatch(layer,/<p[^>]+class="orbit-popover-note"/);
  assert.doesNotMatch(layer,/>\s*UMLAUFBAHNEN\s*</);
  assert.doesNotMatch(layer,/>\s*BESCHRIFTUNG\s*</);
  assert.doesNotMatch(layer,/class="layer-orbit-section"|class="layer-label-section"/);
  for(const id of ['orbit-visibility-btn','orbit-contrast-btn','toggle-labels'])
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  assert.doesNotMatch(layer,/id="orbit-contrast-btn"|id="toggle-labels"/);
  const scale=html.split('id="scale-popover"')[1].split('id="layer-picker-wrap"')[0];
  for(const id of ['orbit-contrast-btn','toggle-labels'])
    assert.match(scale,new RegExp(`id="${id}"`));
  assert.match(layer,/id="layer-note">Standard: Sterne und Planeten/);
});

test('v25: initial checkbox state matches solar only; view transition still synchronizes switches',async()=>{
  const html=await read('index.html'),app=await read('src/app.js');
  const layer=popover(html);
  const found=[...layer.matchAll(/<input type="checkbox" data-layer-type="(\w+)"( checked)?\/>/g)];
  assert.equal(found.length,LAYER_TYPES.length);
  assert.deepEqual(found.filter(match=>Boolean(match[2])).map(match=>match[1]),['planet','star']);
  assert.match(app,/S\.settings=S\.viewSettings\[view\]/);
  assert.match(app,/check\.checked=layerEnabled\(selected,type\)/);
  assert.match(app,/preset\.dataset\.layerPreset===selected\.mode/);
  assert.match(app,/changeLayers\(layerPreset\(btn\.dataset\.layerPreset,activeView\(\)\)\)/);
  assert.match(app,/\? 'Standard: Planeten, Monde und Satelliten\.'/);
  assert.match(app,/: 'Standard: Sterne und Planeten\.'/);
});

test('v25: dropdown is about one third narrower; preset switch shares border and options have no divider',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.layer-popover\{[^\n]*width:152px/);
  assert.match(css,/\.control-panel \.layer-popover\{[\s\S]*?width:152px/);
  assert.ok(Math.abs(152/227-2/3)<0.01);
  assert.match(css,/\.layer-presets\{[^\n]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:0/);
  assert.match(css,/\.layer-preset\{[^\n]*border:0/);
  assert.match(css,/\.layer-preset\.active/);
  assert.match(css,/\.layer-options\{display:grid;gap:3px\}/);
  assert.doesNotMatch(css,/\.layer-options\{[^\n]*border-top/);
  assert.match(css,/\.layer-orbit-section \.orbit-option\.orbit-suboption\{margin-left:9px;width:calc\(100% - 9px\)/);
  assert.doesNotMatch(css,/\.layer-section-title\{|\.orbit-popover-note\{|\.layer-popover-title\{/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{[\s\S]*?overflow-y:auto/);
});
