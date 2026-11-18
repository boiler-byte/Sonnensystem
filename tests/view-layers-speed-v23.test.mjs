import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {
  availableLayerTypes, createViewSettings, ensureAvailableSelection, layerEnabled, layerPreset,
  updateLayerSelection, LAYER_TYPES, STANDARD_LAYERS, PLANET_STANDARD_LAYERS
} from '../src/data/layers.js';
import {SPEED_MODES, speedAtStep, stepForSpeed, formatSpeed, syncSpeedMode} from '../src/ui/timeline.js';
import {planetChildrenFor} from '../src/renderer/planet-view.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v23: 5 simulated days per real second is the exact initial solar speed', async()=>{
  assert.equal(SPEED_MODES.solar.defaultSpeed,5);
  assert.equal(SPEED_MODES.solar.min,1/24);
  assert.equal(SPEED_MODES.planet.defaultSpeed,1/24,'planet speed is unchanged');
  assert.equal(formatSpeed(5),'5 Tage / s');
  assert.equal(speedAtStep('solar',SPEED_MODES.solar.pivot),5);
  assert.equal(stepForSpeed('solar',5),SPEED_MODES.solar.pivot);
  const html=await read('index.html');
  assert.match(html,/id="speed-readout">5 Tage \/ s/);
  assert.match(html,/id="speed-popover-value">5 Tage \/ s/);
  assert.match(html,new RegExp(`id="speed"[^>]+value="${SPEED_MODES.solar.pivot}"`));
  const app=await read('src/app.js');
  assert.match(app,/speed:SPEED_MODES\.solar\.defaultSpeed/);
  const state={timelineMode:'solar',speed:5,modeSpeeds:{solar:5,planet:SPEED_MODES.planet.defaultSpeed},playing:false};
  syncSpeedMode(state,'planet');
  assert.equal(state.speed,SPEED_MODES.planet.defaultSpeed);
  syncSpeedMode(state,'solar');
  assert.equal(state.speed,5);
});

test('v23: only direct child categories of the active planet are offered',()=>{
  assert.deepEqual(availableLayerTypes(INITIAL_BODIES,'solar'),LAYER_TYPES);
  assert.deepEqual(availableLayerTypes(INITIAL_BODIES,'planet','earth'),['planet','moon','satellite']);
  for(const planet of ['jupiter','mars','saturn','uranus','neptune']){
    assert.deepEqual(availableLayerTypes(INITIAL_BODIES,'planet',planet),['planet','moon'],planet);
  }
  assert.deepEqual(availableLayerTypes(INITIAL_BODIES,'planet','unknown'),['planet']);
  assert.ok(!availableLayerTypes(INITIAL_BODIES,'planet','earth').includes('star'));
  assert.ok(!availableLayerTypes(INITIAL_BODIES,'planet','earth').includes('asteroid'));
  assert.ok(!availableLayerTypes(INITIAL_BODIES,'planet','earth').includes('dwarf'));
  const extended=[...INITIAL_BODIES,{id:'test-child',name:'Test',type:'asteroid',parentId:'earth',a:10000,periodDays:1}];
  assert.deepEqual(availableLayerTypes(extended,'planet','earth'),['planet','moon','asteroid','satellite']);
  assert.ok(planetChildrenFor(extended,'earth').some(body=>body.id==='test-child'),
    'a newly available category must also appear in the planet scene');
});

test('v23: separate default selections and independent states for layer/orbit/label controls',()=>{
  assert.deepEqual(STANDARD_LAYERS,['star','planet']);
  assert.deepEqual(PLANET_STANDARD_LAYERS,['planet','moon','satellite']);
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  assert.deepEqual([...solar.layers.types],STANDARD_LAYERS);
  assert.deepEqual([...planet.layers.types],PLANET_STANDARD_LAYERS);
  for(const type of ['planet','moon','satellite']){
    assert.equal(layerEnabled(solar.layers,type),type==='planet');
    assert.ok(layerEnabled(planet.layers,type));
  }
  assert.equal(layerEnabled(planet.layers,'star'),false);
  assert.equal(layerEnabled(solar.layers,'star'),true,'Sun stays visible in the overview');
  solar.layers=updateLayerSelection(solar.layers,'dwarf',true,'solar');
  solar.orbits=false;solar.orbitContrast=true;solar.labels=false;
  assert.equal(planet.orbits,true);
  assert.equal(planet.orbitContrast,false);
  assert.equal(planet.labels,true);
  assert.equal(layerEnabled(planet.layers,'dwarf'),false);
  planet.layers=updateLayerSelection(planet.layers,'moon',false,'planet');
  assert.equal(planet.layers.mode,'custom');
  assert.equal(layerEnabled(solar.layers,'moon'),false,'planet mode must not affect solar mode');
  planet.layers=updateLayerSelection(planet.layers,'moon',true,'planet');
  assert.equal(planet.layers.mode,'standard','restore the planet-specific preset');
  solar.layers=updateLayerSelection(solar.layers,'dwarf',false,'solar');
  assert.equal(solar.layers.mode,'standard','restore the solar-specific preset');
});

test('v23: a category hidden for the active planet cannot become the last effective layer',()=>{
  const available=availableLayerTypes(INITIAL_BODIES,'planet','jupiter');
  let selection=layerPreset('standard','planet');
  selection=updateLayerSelection(selection,'moon',false,'planet',available);
  assert.ok(layerEnabled(selection,'planet'));
  assert.ok(layerEnabled(selection,'satellite'),'hidden satellite state remains stored');
  const rejected=updateLayerSelection(selection,'planet',false,'planet',available);
  assert.equal(rejected,selection,'would leave zero renderable categories for Jupiter');
  const earth=availableLayerTypes(INITIAL_BODIES,'planet','earth');
  const allowed=updateLayerSelection(selection,'planet',false,'planet',earth);
  assert.equal(layerEnabled(allowed,'planet'),false);
  assert.equal(layerEnabled(allowed,'satellite'),true);
});

test('v23: switching from Earth with satellite-only selection to Jupiter avoids a blank scene',()=>{
  const earth=availableLayerTypes(INITIAL_BODIES,'planet','earth');
  let selection=layerPreset('standard','planet');
  selection=updateLayerSelection(selection,'planet',false,'planet',earth);
  selection=updateLayerSelection(selection,'moon',false,'planet',earth);
  assert.equal(layerEnabled(selection,'satellite'),true);
  const jupiter=availableLayerTypes(INITIAL_BODIES,'planet','jupiter');
  assert.ok(jupiter.every(type=>!layerEnabled(selection,type)));
  const restored=ensureAvailableSelection(selection,jupiter,'planet');
  assert.equal(layerEnabled(restored,'planet'),true);
  assert.equal(layerEnabled(restored,'satellite'),true,'hidden selections persist');
  assert.equal(ensureAvailableSelection(restored,jupiter,'planet'),restored);
});

test('v23: application binds the scene-specific settings to render, catalog and layer controls',async()=>{
  const app=await read('src/app.js'),html=await read('index.html'),css=await read('css/styles.css');
  assert.match(app,/viewSettings = \{solar:createViewSettings\('solar'\),planet:createViewSettings\('planet'\)\}/);
  assert.match(app,/S\.settings=S\.viewSettings\[view\]/);
  assert.match(app,/S\.settings\.layers=ensureAvailableSelection\(/);
  assert.match(app,/const available=new Set\(availableLayerTypes\(S\.bodies,view,renderer\?\.planetId\)\)/);
  assert.match(app,/check\.parentElement\.hidden=!available\.has\(type\)/);
  assert.match(app,/check\.disabled=!available\.has\(type\)/);
  assert.match(app,/S\.settings\.layers=next/);
  assert.match(app,/renderer\.draw\(S\.time,S\.selected,S\.settings\)/);
  assert.match(app,/syncLayers\(\);syncOrbitControls\(\);syncLabelControl\(\);syncScaleControls\(\);syncRowControl\(\)/);
  assert.match(css,/\.layer-option\[hidden\]\{display:none!important\}/);
  for(const type of ['planet','star'])
    assert.match(html,new RegExp(`data-layer-type="${type}" checked`));
  for(const type of ['moon','satellite'])
    assert.doesNotMatch(html,new RegExp(`data-layer-type="${type}" checked`));
  assert.doesNotMatch(html,/id="layer-note"/);
});
