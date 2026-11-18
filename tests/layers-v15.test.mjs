import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {layerEnabled, layerPreset, updateLayerSelection, layerSummary, LAYER_TYPES, STANDARD_LAYERS} from '../src/data/layers.js';
import {catalogMatches, filteredBodies} from '../src/ui/object-list.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('v25: Solar Standard includes only star and planets; Alle enables every known type',()=>{
  const normal=layerPreset('standard'),all=layerPreset('all');
  assert.deepEqual([...normal.types],STANDARD_LAYERS);
  assert.deepEqual([...all.types],LAYER_TYPES);
  assert.equal(layerSummary(normal),'Standard');
  assert.equal(layerSummary(all),'Alle');
  for(const category of LAYER_TYPES){
    assert.equal(layerEnabled(all,category),true);
    assert.equal(layerEnabled(normal,category),STANDARD_LAYERS.includes(category),category);
  }
});

test('v15: independent category checkboxes support multiselect and collapse back to presets',()=>{
  const initial=layerPreset('standard');
  const chosen=updateLayerSelection(initial,'asteroid',true);
  assert.equal(chosen.mode,'custom');
  assert.equal(layerSummary(chosen),'3 Layer');
  assert.deepEqual([...chosen.types],['star','planet','asteroid']);
  assert.equal(initial.types.size,2,'Original state is immutable');
  const again=updateLayerSelection(chosen,'asteroid',false);
  assert.equal(again.mode,'standard');
  const solo=updateLayerSelection(initial,'planet',false);
  assert.deepEqual([...solo.types],['star'],'Solar Standard keeps the star when planets are removed');
  assert.equal(updateLayerSelection(solo,'not-a-type',true),solo);
  let all=layerPreset('all');
  all=updateLayerSelection(all,'star',false);
  assert.equal(all.mode,'custom');
  all=updateLayerSelection(all,'star',true);
  assert.equal(all.mode,'all');
});

test('v15: search matches type singular/plural and immediate parent name case/accent independently',()=>{
  const bodies=INITIAL_BODIES;
  const byId=new Map(bodies.map(b=>[b.id,b]));
  const earth=byId.get('earth'),moon=byId.get('moon'),iss=byId.get('sat-25544');
  assert.ok(earth&&moon&&iss);
  assert.equal(catalogMatches(earth,'planeten',byId),true);
  assert.equal(catalogMatches(moon,'Monde',byId),true);
  assert.equal(catalogMatches(moon,'ERDE',byId),true,'Parent name matches');
  assert.equal(catalogMatches(iss,'erde',byId),true);
  assert.equal(catalogMatches(iss,'Satelliten',byId),true);
  assert.equal(catalogMatches(moon,'asteroid',byId),false);
  const moonList=filteredBodies({bodies,settings:{layers:layerPreset('standard')},search:'Erde'});
  assert.ok(moonList.some(b=>b.id==='moon'),'Moons are included in the new Standard');
  assert.ok(moonList.some(b=>b.id==='earth'));
  assert.ok(moonList.some(b=>b.id==='sat-25544'), 'Artificial satellites are included in Standard');
  const satList=filteredBodies({bodies,settings:{layers:layerPreset('all')},search:'Satellit'});
  assert.ok(satList.some(b=>b.id==='sat-25544'));
  assert.ok(satList.every(b=>b.type==='satellite'));
});

test('v24: catalog ignores the renderer layer mask, but WebGL still obeys it',()=>{
  const bodies=INITIAL_BODIES;
  const settings={layers:layerPreset('standard')};
  const state={bodies,settings,search:''};
  const visible=filteredBodies(state);
  assert.equal(visible.length,bodies.length,'All loaded objects are listed even if their category is not rendered');
  assert.ok(visible.some(b=>!STANDARD_LAYERS.includes(b.type)),'Disabled category is still discoverable');
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.settings=settings;
  assert.ok(renderer.shouldDraw(bodies.find(b=>b.id==='earth')));
  assert.equal(renderer.shouldDraw(bodies.find(b=>b.id==='moon')),false);
  assert.ok(renderer.shouldDraw(bodies.find(b=>b.id==='sun')));
  assert.equal(renderer.shouldDraw(bodies.find(b=>b.id==='sat-25544')),false);
  settings.layers=layerPreset('all');
  assert.ok(renderer.shouldDraw(bodies.find(b=>b.id==='sun')));
  assert.ok(renderer.shouldDraw(bodies.find(b=>b.id==='sat-25544')));
});

test('v15: new panel has a single accessible dropdown and old catalog chips are gone',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),app=await read('src/app.js');
  const catalog=html.split('<aside class="catalog"')[1].split('</aside>')[0];
  assert.doesNotMatch(catalog,/data-filter=|class="filters"/);
  assert.doesNotMatch(html,/id="view-mode-select"|for="view-mode-select"/);
  assert.doesNotMatch(html,/class="control-label" for="view-mode-select">Ansicht</);
  assert.equal((html.match(/id="layer-btn"/g)||[]).length,1);
  assert.equal((html.match(/data-layer-type="/g)||[]).length,LAYER_TYPES.length);
  assert.match(html,/data-layer-preset="all"/);
  assert.match(html,/data-layer-preset="standard"/);
  assert.match(html,/aria-controls="layer-popover"/);
  assert.match(html,/role="group" aria-label="Einzelne Objektkategorien"/);
  assert.match(css,/width:58px!important;max-width:calc\(100% - 20px\)/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{/);
  assert.match(app,/\$\('layer-btn'\)\.addEventListener\('click'/);
  assert.match(app,/\$\('search'\)\.addEventListener\('input'/);
});

test('v15: search and layer model are part of offline PWA cache',async()=>{
  const sw=await read('sw.js'),pkg=JSON.parse(await read('package.json'));
  const shell=JSON.parse(sw.match(/const SHELL=(\[[^;]+\]);/)[1]);
  assert.equal(pkg.version,'63.0.0');
  assert.match(sw,/sonnensystem-shell-v63/);
  assert.ok(shell.includes('./src/data/layers.js'));
});

test('v15: actual solar and planet draw calls obey layer visibility, including orbit lines and glow',()=>{
  const bodies=INITIAL_BODIES.map(b=>({...b}));
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=1000;r.height=680;r.planetId=null;r.selectedId='earth';r.simTime=Date.UTC(2026,10,16);
  r.positions=new Map();r.overrides=new Map();r.glow={style:{}};
  r.gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,clear(){},depthMask(){}};
  r.makeVP=()=>({vp:'test-vp'});r.drawStars=()=>{};
  const spheres=[],orbits=[],labelCounts=[];
  r.drawSphere=b=>spheres.push(b.type);
  r.drawRings=()=>{};
  r.drawLabels=()=>labelCounts.push(r.rendered.map(b=>b.type));
  r.orbitLine=b=>orbits.push(b.type);
  r.setBodies(bodies);
  const options={orbits:true,labels:true,layers:layerPreset('standard')};
  r.draw(r.simTime,'earth',options);
  assert.ok(spheres.includes('planet') && spheres.includes('star'));
  assert.ok(!spheres.includes('moon') && !spheres.includes('satellite')); 
  assert.ok(spheres.every(type=>STANDARD_LAYERS.includes(type)));
  assert.ok(orbits.every(type=>STANDARD_LAYERS.includes(type)));
  assert.ok(labelCounts.at(-1).every(type=>STANDARD_LAYERS.includes(type)));
  assert.notEqual(r.glow.style.opacity,'0','Star is visible with the default preset');
  options.layers=updateLayerSelection(options.layers,'star',false);
  r.draw(r.simTime,'earth',options);
  assert.equal(r.glow.style.opacity,'0','Star glow hides when star is deselected');
  spheres.length=0;orbits.length=0;
  options.layers=layerPreset('all');
  r.draw(r.simTime,'earth',options);
  assert.ok(spheres.includes('star') && spheres.includes('satellite'));
  r.showPlanetSystem('earth');
  spheres.length=0;orbits.length=0;
  options.layers=layerPreset('standard','planet');
  r.draw(r.simTime,'earth',options);
  assert.ok(spheres.includes('planet') && spheres.includes('moon') && spheres.includes('satellite'), 'New planet Standard includes moons and satellites');
  assert.ok(orbits.includes('satellite'));
  spheres.length=0;orbits.length=0;
  options.layers=layerPreset('all');
  r.draw(r.simTime,'earth',options);
  assert.ok(spheres.includes('satellite') && orbits.includes('satellite'));
});
