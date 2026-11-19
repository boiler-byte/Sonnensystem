import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../src/data/catalog.js';
import {LAYER_TYPES,layerPreset,updateLayerSelection,layerEnabled} from '../src/data/layers.js';
import {displayOrbitRadius,orbitalRadius,keplerPosition,SOLAR_UNITS_PER_KM} from '../src/data/orbital-math.js';
import {filteredBodies,catalogMatches,catalogSearchRank} from '../src/ui/object-list.js';
import {displayA} from '../src/ui/formatters.js';
import {solarOrbitBodies} from '../src/renderer/solar-view.js';
import {computePositions} from '../src/renderer/scene.js';

const readJSON=async path=>JSON.parse(await readFile(new URL('../'+path.slice(2),import.meta.url),'utf8'));
const manifest=await readJSON('./data/catalog/manifest.json');
const {bodies,articles,version}=await loadCatalog(readJSON);
const byId=new Map(bodies.map(b=>[b.id,b]));
const view=(query,items=bodies)=>filteredBodies({bodies:items,search:query});
const ids=items=>items.map(x=>x.id);
const newMoonIds=['s2003-j2','s2003-j4','s2018-j2','loge','skoll','greip','tarqeq','s2002-n5','s2021-n1'];
const newSatelliteIds=['sat-48274','sat-39741','sat-40730','sat-43013','sat-54234','sat-41866','sat-51850'];

test('v56: manifest loads exactly 18 additions with complete editorial details',()=>{
  assert.equal(version,'10.1.0');
  assert.equal(bodies.length,192);
  assert.equal(articles.size,bodies.length);
  for(const id of ['didymos','dimorphos',...newMoonIds,...newSatelliteIds]){
    const body=byId.get(id);
    assert.ok(body,`Missing ${id}`);
    assert.equal(body.editorial?.id,id);
    assert.ok(body.editorial?.references.length>=1);
    assert.ok(body.editorial.sections.length>=2);
  }
  assert.equal(bodies.filter(b=>b.type==='binary').length,2);
  assert.equal(bodies.filter(b=>b.type==='satellite').length,9);
  assert.equal(bodies.filter(b=>b.type==='moon').length,145);
  assert.equal(manifest.categories.length,23);
});

test('v56: new satellites carry unique matching NORAD identifiers and local model labels',()=>{
  const nums=new Set();
  for(const id of newSatelliteIds){
    const b=byId.get(id);
    assert.equal(b.type,'satellite');
    assert.equal(b.parentId,'earth');
    assert.ok(Number.isInteger(b.catalog)&&b.catalog>0);
    assert.ok(!nums.has(b.catalog),id); nums.add(b.catalog);
    assert.equal(b.orbitModel,'illustrative-catalog-orbit');
    assert.match(b.orbitFrame,/illustrative/);
    assert.equal(b.radiusKm,0,'unknown physical size is not invented');
  }
  assert.equal(byId.get('sat-48274').catalog,48274);
  assert.ok(view('Tiangong')[0]?.id==='sat-48274');
  assert.deepEqual(ids(view('NOAA-20')),[ 'sat-43013' ]);
  assert.deepEqual(ids(view('GOES-18')),[ 'sat-51850' ]);
});

test('v56: nine new natural moons are linked to the expected primary bodies',()=>{
  const expected={jupiter:3,saturn:4,neptune:2};
  for(const [parentId,count] of Object.entries(expected))
    assert.equal(newMoonIds.filter(id=>byId.get(id).parentId===parentId).length,count,parentId);
  for(const id of newMoonIds){
    const b=byId.get(id);
    assert.equal(b.type,'moon');
    assert.equal(b.radiusKm,0);
    assert.equal(b.orbitModel,'mean-elements');
    assert.ok(b.a>10000000);
    assert.ok(b.periodDays>100);
  }
  assert.ok(view('S/2021 N 1').some(b=>b.id==='s2021-n1'));
  assert.ok(view('Loge').some(b=>b.id==='loge'));
});

test('v56: binary Didymos/Dimorphos preserves parentage, correct orbit units and 11h22m period',()=>{
  const didymos=byId.get('didymos'),dimorphos=byId.get('dimorphos');
  assert.equal(didymos.type,'binary');
  assert.equal(didymos.parentId,'sun');
  assert.equal(dimorphos.type,'binary');
  assert.equal(dimorphos.parentId,didymos.id);
  assert.ok(Math.abs(dimorphos.a-1.152)<.0001);
  assert.ok(Math.abs(dimorphos.periodDays*24-11.3675)<.01);
  assert.match(displayA(dimorphos),/1,152 km/);
  assert.match(displayA(didymos),/AE/);
  const physical=displayOrbitRadius(dimorphos,didymos,{scaleObjects:true,scaleOrbits:true});
  assert.ok(Math.abs(physical-1.152*SOLAR_UNITS_PER_KM)<1e-12);
  const schematic=orbitalRadius(dimorphos,didymos);
  assert.ok(schematic>.3 && schematic<.7,'non-AU companion orbit in schematic mode');
});

test('v56: Kepler positions remain finite, and nested binary position orbits Didymos',()=>{
  const t=Date.UTC(2026,10,18);
  for(const id of ['didymos','dimorphos',...newMoonIds,...newSatelliteIds]){
    const b=byId.get(id),position=keplerPosition(b,byId.get(b.parentId),t);
    assert.equal(position.length,3);
    assert.ok(position.every(Number.isFinite),id);
  }
  const r={positions:new Map(),planetId:null,bodies,byId,settings:{scaleObjects:false,scaleOrbits:false},overrides:new Map()};
  computePositions(r,t);
  assert.equal(r.positions.size,bodies.length); // all catalog bodies have deterministic scene positions
  const parent=r.positions.get('didymos'),child=r.positions.get('dimorphos');
  const separation=Math.hypot(...child.map((coord,i)=>coord-parent[i]));
  assert.ok(separation>.1&&separation<1,'Dimorphos remains close to Didymos, not to the Sun');
});

test('v56: binary minor bodies have a dedicated selectable layer and distinct heliocentric orbit',()=>{
  assert.ok(LAYER_TYPES.includes('binary'));
  const all=layerPreset('all','solar');
  assert.ok(layerEnabled(all,'binary'));
  let standard=layerPreset('standard','solar');
  assert.ok(!layerEnabled(standard,'binary'));
  standard=updateLayerSelection(standard,'binary',true,'solar');
  assert.ok(layerEnabled(standard,'binary'));
  standard=updateLayerSelection(standard,'binary',false,'solar');
  assert.ok(!layerEnabled(standard,'binary'));
  const allOrbitIds=ids(solarOrbitBodies(bodies,all));
  assert.ok(allOrbitIds.includes('didymos'));
  assert.ok(!allOrbitIds.includes('dimorphos'));
  assert.ok(!ids(solarOrbitBodies(bodies,standard)).includes('didymos'));
});

test('v56: exact Saturn is always ranked before prefix/parent/substring matches',()=>{
  const satellite={id:'saturn-explorer',name:'Saturn Explorer',type:'satellite',parentId:'earth'};
  const substring={id:'pseudo-saturn',name:'Pseudo Saturn Marker',type:'moon',parentId:'jupiter'};
  const items=[...bodies,satellite,substring];
  const sorted=view('sAtUrN',items);
  assert.equal(sorted[0].id,'saturn','exact object name comes first');
  assert.ok(sorted.findIndex(b=>b.id==='saturn-explorer')<sorted.findIndex(b=>b.id==='pseudo-saturn'));
  assert.ok(sorted.findIndex(b=>b.id==='pseudo-saturn')>sorted.findIndex(b=>b.id==='saturn'));
  assert.equal(catalogSearchRank(sorted[0],'SATURN',new Map(items.map(b=>[b.id,b]))),0);
});

test('v56: exact category matches precede prefix and partial names',()=>{
  const examples=[
    {id:'category-prefix',name:'Planetenforscher',type:'moon'},
    {id:'category-partial',name:'Kleine Planetenforschung',type:'asteroid'},
    {id:'category-planet',name:'Mars',type:'planet'},
    {id:'category-dwarf',name:'Ceres',type:'dwarf'},
  ];
  assert.deepEqual(ids(view('Planeten',examples)),['category-planet','category-prefix','category-partial','category-dwarf']);
  const dwarfList=view('Zwergplaneten',bodies);
  assert.equal(dwarfList[0].type,'dwarf');
  assert.ok(dwarfList.every(b=>b.type==='dwarf'));
  assert.ok(view('Monde').every(b=>b.type==='moon'));
  assert.ok(view('Doppelasteroiden').every(b=>b.type==='binary'));
});

test('v56: category priority planet > dwarf > moon > other is used within the same match class',()=>{
  const examples=[
    {id:'other',name:'Saturn Vergleich D',type:'comet'},
    {id:'moon',name:'Saturn Vergleich C',type:'moon'},
    {id:'dwarf',name:'Saturn Vergleich B',type:'dwarf'},
    {id:'planet',name:'Saturn Vergleich A',type:'planet'},
  ];
  assert.deepEqual(ids(view('Saturn Vergleich',examples)),['planet','dwarf','moon','other']);
  assert.deepEqual(ids(view('Vergleich',examples)),['planet','dwarf','moon','other']);
});

test('v56: multi-term, aliases, parents and planet isolation still work',()=>{
  assert.ok(view('saturn monde').length>=40);
  assert.ok(view('saturn monde').every(x=>x.type==='moon'&&x.parentId==='saturn'));
  assert.ok(view('Dimorphos')[0].id==='dimorphos');
  assert.ok(view('Didymos B')[0].id==='dimorphos');
  assert.ok(view('GPS PRN 06')[0].id==='sat-39741');
  assert.ok(catalogMatches(byId.get('tarqeq'),'Saturn Tarqeq',byId));
  const planetOnly=filteredBodies({bodies,search:'Saturn',catalogPlanetOnly:true},{planetId:'jupiter'});
  assert.deepEqual(planetOnly,[]);
  assert.ok(view('Saturn').some(x=>x.id==='skoll'));
});

test('v56: layer checkbox and offline cache include new data and category',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(html,/data-layer-type="binary"[^>]*><span>Doppelasteroiden<\/span>/);
  assert.match(sw,/manifest\.categories,\.\.\.manifest\.editorial/);
  for(const category of ['binary-asteroids-v56','moons-additions-v56','satellites-additions-v56'])
    assert.ok(manifest.categories.some(item=>item.path.includes(category)),category);
  assert.ok(manifest.editorial.some(item=>item.path.includes('de-objects-v56')));
});
