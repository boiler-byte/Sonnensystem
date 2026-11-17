import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { catalogMatches, filteredBodies } from '../src/ui/object-list.js';
import { layerPreset, updateLayerSelection } from '../src/data/layers.js';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';

const read=async name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const ids=bodies=>new Set(bodies.map(b=>b.id));
const byId=new Map(INITIAL_BODIES.map(b=>[b.id,b]));

// Layer state is deliberately passed in but cannot change the catalog.
test('v24: catalog shows all loaded types regardless of active renderer layers',()=>{
  const selected=layerPreset('standard','solar');
  const state={bodies:INITIAL_BODIES,settings:{layers:selected},search:''};
  const standard=filteredBodies(state);
  assert.equal(standard.length,INITIAL_BODIES.length);
  for(const type of ['asteroid','dwarf','comet','star','moon','planet','satellite'])
    assert.ok(standard.some(body=>body.type===type),`category ${type} must be present`);
  state.settings.layers=layerPreset('all','solar');
  assert.deepEqual(ids(filteredBodies(state)),ids(standard));
  state.settings.layers=updateLayerSelection(layerPreset('standard','solar'),'asteroid',false,'solar');
  assert.deepEqual(ids(filteredBodies(state)),ids(standard));
  state.settings.layers={mode:'custom',types:new Set(['star'])};
  assert.deepEqual(ids(filteredBodies(state)),ids(standard));
  delete state.settings;
  assert.deepEqual(ids(filteredBodies(state)),ids(standard));
});

test('v24: search terms can match separately against parent and object name',()=>{
  const matches=filteredBodies({bodies:INITIAL_BODIES,search:'uranus c'});
  const names=new Set(matches.map(b=>b.name));
  assert.deepEqual(names,new Set([
    'Puck','Cordelia','Bianca','Cressida','Cupid','Caliban','Sycorax','Trinculo','Francisco'
  ]));
  assert.ok(matches.every(b=>b.type==='moon'&&b.parentId==='uranus'));
  for(const query of ['C URANUS','   uranus    c ','UrAnUs mOnDe c','c   uranus'])
    assert.deepEqual(ids(filteredBodies({bodies:INITIAL_BODIES,search:query})),ids(matches),query);
  assert.ok(catalogMatches(byId.get('cordelia'),'uraNus Cor',byId));
  assert.ok(!catalogMatches(byId.get('miranda'),'uranus c',byId));
});

test('v24: categories, ID and parent still searchable in multi-term mode',()=>{
  const moons=filteredBodies({bodies:INITIAL_BODIES,search:'Jupiter monde'});
  assert.ok(moons.length>20);
  assert.ok(moons.every(b=>b.type==='moon' && b.parentId==='jupiter'));
  const moon=filteredBodies({bodies:INITIAL_BODIES,search:'ERDE mond'});
  assert.ok(ids(moon).has('moon'));
  assert.ok(!ids(moon).has('earth'));
  const satellite=filteredBodies({bodies:INITIAL_BODIES,search:'satelliten erde'});
  assert.ok(satellite.length>0);
  assert.ok(satellite.every(b=>b.type==='satellite'&&b.parentId==='earth'));
  assert.deepEqual(filteredBodies({bodies:INITIAL_BODIES,search:'uranus unfindable'}),[]);
});

test('v24: planet-only toggle defaults off; on isolates current planet and descendants only',()=>{
  const state={bodies:INITIAL_BODIES,search:'',catalogPlanetOnly:false,
    settings:{layers:{mode:'custom',types:new Set(['star'])}}};
  assert.equal(filteredBodies(state,{planetId:'uranus'}).length,INITIAL_BODIES.length);
  state.catalogPlanetOnly=true;
  const uranus=filteredBodies(state,{planetId:'uranus'});
  assert.equal(uranus.length,28,'Uranus plus 27 known moons');
  assert.ok(ids(uranus).has('uranus'));
  assert.ok(!ids(uranus).has('earth'));
  assert.ok(uranus.every(b=>b.id==='uranus'||b.parentId==='uranus'));
  const earth=filteredBodies(state,{planetId:'earth'});
  assert.ok(ids(earth).has('earth')&&ids(earth).has('moon')&&ids(earth).has('sat-25544'));
  assert.ok(!ids(earth).has('uranus'));
  assert.equal(filteredBodies(state).length,INITIAL_BODIES.length,'No planet view => ignore toggle');
});

test('v24: combine planet filter and word search; nested orbital children are included safely',()=>{
  const state={bodies:INITIAL_BODIES,search:'uranus c',catalogPlanetOnly:true};
  assert.equal(filteredBodies(state,{planetId:'uranus'}).length,9);
  assert.equal(filteredBodies(state,{planetId:'earth'}).length,0);
  state.search='';
  state.bodies=[...INITIAL_BODIES,{id:'moonlet',name:'Moonlet',parentId:'puck',type:'moon',a:1},
    {id:'bad-a',name:'Bad A',parentId:'bad-b',type:'moon'},
    {id:'bad-b',name:'Bad B',parentId:'bad-a',type:'moon'}];
  assert.ok(ids(filteredBodies(state,{planetId:'uranus'})).has('moonlet'));
  assert.ok(!ids(filteredBodies(state,{planetId:'uranus'})).has('bad-a'));
});

test('v24: icon-only planet filter is visible only in planet mode and shares the catalog on mobile',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),app=await read('src/app.js');
  assert.equal((html.match(/id="catalog-planet-filter"/g)||[]).length,1);
  const button=html.match(/<button class="catalog-planet-filter"[^>]+>[\s\S]+?<\/button>/)?.[0];
  assert.ok(button);
  assert.match(button,/aria-pressed="false"/);
  assert.match(button,/aria-controls="object-list"/);
  assert.match(button,/aria-label="[^"]+"/);
  assert.match(button,/<svg[^>]+viewBox="0 0 24 24"/);
  assert.doesNotMatch(button,/<span|<label|<b>|Planetenfilter<\/button>/);
  assert.match(html,/<div class="catalog-search-row">/);
  assert.match(css,/\.catalog-search-row\{display:flex/);
  assert.match(css,/\.catalog-planet-filter\[hidden\]\{display:none!important\}/);
  assert.match(app,/catalogPlanetOnly:false/);
  assert.match(app,/toggle\.hidden=!planetId/);
  assert.match(app,/renderCatalog\(S,selectBody,\{planetId\}\)/);
  assert.match(app,/\$\('catalog-planet-filter'\)\.addEventListener\('click'/);
  assert.match(app,/S\.catalogPlanetOnly=!S\.catalogPlanetOnly/);
  assert.doesNotMatch(app,/if\(S\.selected && !layerEnabled\(next/);
  assert.match(app,/renderer\.draw\(S\.time,S\.selected,S\.settings\)/);
  const sheet=await read('src/ui/bottom-sheet.js');
  assert.match(sheet,/panels = \{catalog:\$\('catalog'\),detail:\$\('detail'\)\}/);
});
