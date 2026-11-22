import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog,parseCategory} from '../src/data/catalog.js';
import {TYPES,CATEGORY_COLORS} from '../src/data/bodies.js';
import {keplerPosition,renderRadius} from '../src/data/orbital-math.js';
import {LAYER_TYPES,LAYER_FILTER_TYPES,layerPreset,layerEnabled,availableLayerTypes} from '../src/data/layers.js';
import {catalogMatches,filteredBodies} from '../src/ui/object-list.js';
import {solarOrbitBodies} from '../src/renderer/solar-view.js';
import {orbitAppearance} from '../src/renderer/orbits.js';

const read=async name=>readProjectSource(name);
const readJson=async path=>JSON.parse(await read(path.replace(/^\.\//,'')));
const catalogPromise=loadCatalog(readJson);
const newGroups={
  asteroid:{psyche:'(16) Psyche',hygiea:'(10) Hygiea',ryugu:'(162173) Ryugu',itokawa:'(25143) Itokawa',ida:'(243) Ida'},
  comet:{'churyumov-gerasimenko':'67P/Tschurjumow-Gerassimenko','tempel-1':'9P/Tempel 1','hartley-2':'103P/Hartley 2','wild-2':'81P/Wild 2'},
  tno:{quaoar:'Quaoar',orcus:'Orcus',gonggong:'Gonggong',sedna:'Sedna',arrokoth:'Arrokoth'}
};
const requiredIds=Object.values(newGroups).flatMap(group=>Object.keys(group));

// A new visible category must not affect the solar or isolated-planet presets.
test('v144: category controls retain the full scientific types while the visual order changes',async()=>{
  const html=await read('index.html');
  const layer=html.split('id="layer-popover"')[1].split('id="canvas-error"')[0];
  const entries=[...layer.matchAll(/<label class="layer-option"><input type="checkbox" data-layer-type="([a-z]+)"( checked)?(?: aria-label="[^"]*")?\/><span>([^<]+)<\/span><\/label>/g)];
  assert.equal(entries.length,LAYER_FILTER_TYPES.length);
  assert.deepEqual(entries.map(m=>m[1]),['star','planet','dwarf','asteroid','comet','moon','satellite','probe']);
  assert.equal(entries[0][1],'star');
  assert.equal(entries[0][3],'Sterne');
  assert.deepEqual(entries.filter(m=>m[2]).map(m=>m[1]),['star','planet']);
  assert.equal(entries.find(m=>m[1]==='dwarf')[3],'Zwergplaneten');
  assert.equal(entries.find(m=>m[1]==='asteroid')[3],'Asteroiden');
  assert.ok(LAYER_TYPES.includes('tno') && LAYER_TYPES.includes('binary'),'scientific types are retained');
  assert.equal((layer.match(/data-layer-type="star"/g)||[]).length,1);
});

test('v52: fourteen specifically named bodies are added to three catalog groups',async()=>{
  const {bodies,articles,version}=await catalogPromise;
  assert.equal(version,'10.2.0');
  assert.equal(bodies.length,192);
  assert.equal(articles.size,192);
  const byId=new Map(bodies.map(b=>[b.id,b]));
  assert.equal(byId.size,bodies.length);
  for(const [type,group] of Object.entries(newGroups)){
    for(const [id,name] of Object.entries(group)){
      const body=byId.get(id);
      assert.ok(body,`missing ${id}`);
      assert.equal(body.name,name);
      assert.equal(body.type,type);
      assert.equal(body.parentId,'sun');
      assert.ok(body.radiusKm>0,`radius of ${id}`);
      assert.ok(body.a>0 && body.periodDays>0 && body.e>=0 && body.e<1,`orbit of ${id}`);
      assert.ok(body.editorial && body.editorial.summary && body.editorial.sections.length,`editorial of ${id}`);
      assert.ok(body.editorial.references.every(ref=>ref.url.startsWith('https://')),`source URLs of ${id}`);
      assert.ok(Number.isFinite(body.epoch),`epoch of ${id}`);
    }
    assert.equal(Object.keys(group).length,type==='asteroid'?5:type==='comet'?4:5);
  }
  const counts={};for(const b of bodies)counts[b.type]=(counts[b.type]||0)+1;
  assert.equal(counts.asteroid,11);
  assert.equal(counts.comet,6);
  assert.equal(counts.tno,5);
});

test('v52: all new trajectories calculate finite positions at multiple dates',async()=>{
  const {bodies}=await catalogPromise;
  const byId=new Map(bodies.map(b=>[b.id,b]));
  const sun=byId.get('sun');
  for(const id of requiredIds){
    const body=byId.get(id);
    for(const time of [Date.UTC(2015,0,1),Date.UTC(2026,10,18),Date.UTC(2050,0,1)]){
      const p=keplerPosition(body,sun,time);
      assert.equal(p.length,3);
      assert.ok(p.every(Number.isFinite),`${id}: non-finite position`);
      assert.ok(Math.hypot(...p)>0,`${id}: zero orbit radius`);
    }
    assert.ok(renderRadius(body)>0,`${id}: not renderable`);
  }
});

test('v52: trans-Neptunian bodies are a separately enabled and colored layer',async()=>{
  const {bodies}=await catalogPromise;
  assert.equal(TYPES.tno.label,'Transneptunisches Objekt');
  assert.equal(TYPES.tno.plural,'Transneptunische Objekte');
  assert.equal(CATEGORY_COLORS.tno,'#7BB6CF');
  assert.equal(layerEnabled(layerPreset('standard','solar'),'tno'),false);
  assert.equal(layerEnabled(layerPreset('all','solar'),'tno'),true);
  const standard=solarOrbitBodies(bodies,layerPreset('standard','solar'));
  const all=solarOrbitBodies(bodies,layerPreset('all','solar'));
  for(const id of requiredIds){
    assert.equal(standard.some(b=>b.id===id),false,`hidden from standard: ${id}`);
    assert.equal(all.some(b=>b.id===id),true,`missing from all: ${id}`);
  }
  for(const b of bodies.filter(b=>b.type==='tno'))assert.equal(orbitAppearance(b,{}).color,CATEGORY_COLORS.tno);
  assert.equal(availableLayerTypes(bodies,'planet','earth').includes('tno'),false);
});

test('v52: search matches German catalog categories and international comet aliases',async()=>{
  const {bodies}=await catalogPromise;
  const byId=new Map(bodies.map(b=>[b.id,b]));
  const search=(id,q)=>catalogMatches(byId.get(id),q,byId);
  assert.equal(search('arrokoth','2014 MU69'),true);
  assert.equal(search('arrokoth','486958'),true);
  assert.equal(search('churyumov-gerasimenko','67P/Churyumov-Gerasimenko'),true);
  assert.equal(search('tempel-1','9P/Tempel'),true);
  assert.equal(search('quaoar','transneptunische Objekte'),true);
  assert.equal(search('sedna','transneptunische Objekte'),true);
  assert.equal(search('hygiea','(10) Hygiea'),true);
  const visible=filteredBodies({bodies,search:'transneptunische objekte'});
  assert.deepEqual(new Set(visible.map(b=>b.id)),new Set(Object.keys(newGroups.tno)));
});

test('v52: new data paths, source provenance and editorial files are fully manifest-driven',async()=>{
  const manifest=await readJson('data/catalog/manifest.json');
  assert.equal(manifest.catalogVersion,'10.2.0');
  assert.equal(manifest.categories.length,23);
  assert.equal(manifest.editorial.length,5);
  for(const [type,file] of [ ['asteroid','asteroids-v52'], ['comet','comets-v52'], ['tno','transneptunian-v52'] ]){
    assert.ok(manifest.categories.some(c=>c.type===type&&c.path===`./data/catalog/${file}.json`));
    const doc=await readJson(`data/catalog/${file}.json`);
    assert.equal(doc.type,type);
    assert.equal(doc.schemaVersion,1);
    assert.match(doc.provenance.sourceUrl,/^https:\/\//);
    assert.equal(parseCategory(doc,type).length,Object.keys(newGroups[type]).length);
  }
  const editorialPath='./data/editorial/de-objects-v52.json';
  assert.ok(manifest.editorial.some(e=>e.path===editorialPath));
  const editorial=await readJson(editorialPath);
  assert.deepEqual(new Set(editorial.articles.map(a=>a.id)),new Set(requiredIds));
});

test('v52: malformed aliases are rejected instead of breaking catalog search',async()=>{
  const doc=await readJson('data/catalog/comets-v52.json');
  doc.objects[0].aliases=[true];
  assert.throws(()=>parseCategory(doc,'comet'),/aliases/);
});

test('v52: release and offline shell version match the added data',async()=>{
  assert.match(await read('src/ui/object-details.js'),/Oskulierende Elemente · schematische Bahn/);
});
