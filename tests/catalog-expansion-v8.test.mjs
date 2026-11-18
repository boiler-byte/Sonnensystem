import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadCatalog, assembleCatalog } from '../src/data/catalog.js';
import { keplerPosition } from '../src/data/orbital-math.js';

const readJSON=async path=>JSON.parse(await readFile(new URL('../'+path.slice(2),import.meta.url),'utf8'));
const manifest=await readJSON('./data/catalog/manifest.json');
const categoryDocs=await Promise.all(manifest.categories.map(x=>readJSON(x.path)));
const editorialEntries=manifest.editorial.filter(e=>e.locale===manifest.defaultLocale);
const editorialDocs=await Promise.all(editorialEntries.map(x=>readJSON(x.path)));
const clone=x=>structuredClone(x);

const groupCounts={star:1,planet:8,moon:136,dwarf:5,asteroid:6,satellite:2,comet:2};
test('v8 imports 123 documented real objects, retains 37 legacy objects, and builds all 160 published-visible articles',async()=>{
  const catalog=await loadCatalog(readJSON);
  assert.equal(catalog.version,'8.0.0');
  assert.equal(catalog.bodies.length,160);
  assert.equal(catalog.articles.size,160);
  assert.equal(editorialEntries.length,3);
  for(const [type,n] of Object.entries(groupCounts))assert.equal(catalog.bodies.filter(b=>b.type===type).length,n,type);
  assert.equal(catalog.bodies.filter(b=>b.type==='moon'&&b.parentId==='jupiter').length,42);
  assert.equal(catalog.bodies.filter(b=>b.type==='moon'&&b.parentId==='saturn').length,45);
  assert.equal(catalog.bodies.filter(b=>b.type==='moon'&&b.parentId==='uranus').length,27);
  assert.equal(catalog.bodies.filter(b=>b.type==='moon'&&b.parentId==='neptune').length,14);
  assert.equal(catalog.bodies.filter(b=>b.type==='moon'&&b.parentId==='pluto').length,5);
  const ids=new Set();
  for(const b of catalog.bodies){
    assert.ok(!ids.has(b.id),b.id);ids.add(b.id);
    assert.equal(b.editorial?.id,b.id,`Missing editorial for ${b.id}`);
    assert.ok(b.editorial?.summary.length>=20,`Missing summary for ${b.id}`);
    assert.ok(b.editorial?.sections?.length>=1,`Missing section for ${b.id}`);
    assert.ok(b.editorial?.references?.length>=1,`Missing sources for ${b.id}`);
    assert.equal(b.description,b.editorial.summary);
    for(const ref of b.editorial.references)assert.match(ref.url,/^https:\/\//);
  }
  assert.ok(catalog.bodies.some(b=>b.id==='amalthea'));
  assert.ok(catalog.bodies.some(b=>b.id==='phoebe'));
  assert.ok(catalog.bodies.some(b=>b.id==='nix'));
  assert.ok(catalog.bodies.some(b=>b.id==='halley'));
  assert.ok(catalog.bodies.some(b=>b.id==='encke'));
  assert.ok(catalog.bodies.some(b=>b.id==='juno'));
});

test('v8 moon sources use mean-element metadata and unknown radii are not fabricated',async()=>{
  const {bodies}=await loadCatalog(readJSON);
  const moon=bodies.find(x=>x.id==='amalthea');
  assert.equal(moon.orbitModel,'mean-elements');
  assert.match(moon.source,/NASA\/JPL/);
  assert.ok(moon.orbitFrame);
  const unknown=bodies.find(b=>b.orbitModel==='mean-elements'&&b.radiusKm===0);
  assert.ok(unknown,'At least one radius remains marked as unknown');
  assert.match(unknown.editorial.sections.map(s=>s.text).join(' '),/nicht angegeben|nicht geschätzt/);
  const juno=bodies.find(b=>b.id==='juno');
  assert.equal(juno.orbitModel,'osculating-sample');
  assert.equal(juno.radiusKm,0,'Unknown physical radius is not invented');
  for(const id of ['halley','encke'])assert.equal(bodies.find(b=>b.id===id).orbitModel,'historical-perihelion');
  // Kepler engine only promises finite display locations, not physical ephemerides.
  for(const b of bodies.filter(b=>b.orbitModel)){
    const parent=bodies.find(p=>p.id===b.parentId);
    assert.ok(keplerPosition(b,parent,Date.UTC(2026,10,16)).every(Number.isFinite),b.id);
  }
});

test('v8 rejects duplicate editorial IDs across different files and preserves drafts',()=>{
  const duplicate=clone(editorialDocs);
  duplicate[2].articles.push(clone(duplicate[1].articles[0]));
  assert.throws(()=>assembleCatalog(manifest,categoryDocs,duplicate),/doppelte ID/);
  const missing=clone(editorialDocs);
  missing[1].articles=missing[1].articles.filter(a=>a.id!=='amalthea');
  const noArticle=assembleCatalog(manifest,categoryDocs,missing);
  assert.equal(noArticle.bodies.length,160);
  assert.equal(noArticle.bodies.find(b=>b.id==='amalthea').editorial,undefined);
  const withDraft=clone(editorialDocs);
  withDraft[1].articles.find(a=>a.id==='amalthea').status='draft';
  assert.equal(assembleCatalog(manifest,categoryDocs,withDraft).bodies.find(b=>b.id==='amalthea').editorial,undefined);
});

test('v8 PWA manifests every imported JSON file and shows approximate-model note',async()=>{
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  const details=await readFile(new URL('../src/ui/object-details.js',import.meta.url),'utf8');
  assert.match(sw,/sonnensystem-shell-v50/);
  assert.match(sw,/manifest\.categories,\.\.\.manifest\.editorial/);
  assert.match(details,/Mittlere Elemente · schematisch/);
  assert.match(details,/Historische Beispielbahn/);
  assert.equal(manifest.categories.length,17);
  for(const entry of [...manifest.categories,...manifest.editorial])assert.ok((await readJSON(entry.path)).schemaVersion===1);
});
