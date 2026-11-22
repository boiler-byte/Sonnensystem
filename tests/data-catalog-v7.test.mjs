import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { loadCatalog, validateManifest, parseCategory, assembleCatalog, mergeLiveBodies } from '../src/data/catalog.js';
import { keplerPosition } from '../src/data/orbital-math.js';

const readJSON=async path=>JSON.parse(await readFile(new URL('../'+path.slice(2),import.meta.url),'utf8'));
const manifest=await readJSON('./data/catalog/manifest.json');
const categoryDocs=await Promise.all(manifest.categories.map(e=>readJSON(e.path)));
const editorial=await readJSON('./data/editorial/de.json');
const clone=x=>structuredClone(x);

test('v52 catalog extends split category/editorial files and retains all 37 legacy bodies',async()=>{
  const {bodies,articles,version}=await loadCatalog(readJSON);
  assert.equal(version,'10.2.0');
  assert.equal(bodies.length,192);
  assert.equal(articles.size,192);
  assert.equal(bodies.filter(b=>b.type==='planet').length,8);
  const earth=bodies.find(x=>x.id==='earth');
  assert.equal(earth.radiusKm,6371);
  assert.equal(earth.a,1);
  assert.equal(earth.editorial.status,'imported');
  assert.match(earth.description,/Heimatwelt/);
  assert.equal(bodies.find(b=>b.id==='moon').parentId,'earth');
  assert.deepEqual(bodies.filter(b=>b.parentId==='earth').map(b=>b.id).sort(),['moon','sat-20580','sat-25544','sat-48274','sat-39741','sat-40730','sat-43013','sat-54234','sat-41866','sat-51850'].sort());
  const planets=bodies.filter(b=>b.type==='planet');
  for(const planet of planets)assert.ok(keplerPosition(planet,bodies[0],Date.now()).every(Number.isFinite));
  assert.equal(manifest.categories.find(e=>e.type==='comet').path,'./data/catalog/comets.json');
  assert.deepEqual(categoryDocs.find(d=>d.type==='comet').objects,[],'Reserved category is empty, not populated with fabricated data');
});

test('Manifest and categories reject mismatched schemas, duplicated IDs, missing parents and invalid orbits',()=>{
  const m=clone(manifest);
  m.schemaVersion=2;assert.throws(()=>validateManifest(m),/schemaVersion/);
  m.schemaVersion=1;m.categories[0].path='./data/catalog/../../server/config.json';
  assert.throws(()=>validateManifest(m),/Kategoriedatei/);
  m.categories[0].path=manifest.categories[1].path;
  assert.throws(()=>validateManifest(m),/doppelter Pfad/);
  const mismatch=clone(categoryDocs[0]);mismatch.type='planet';
  assert.throws(()=>parseCategory(mismatch,'star','stars.json'),/Kategorie/);
  const duplicate=clone(categoryDocs);duplicate[1].objects.push(clone(categoryDocs[0].objects[0]));
  assert.throws(()=>assembleCatalog(manifest,duplicate,editorial),/doppelte Himmelskörper-ID/);
  const orphan=clone(categoryDocs);orphan[1].objects[0].parentId='unknown-parent';orphan[1].objects[0].orbit.unit='km';
  assert.throws(()=>assembleCatalog(manifest,orphan,editorial),/unbekanntes parentId/);
  const wrongUnit=clone(categoryDocs);wrongUnit[1].objects[0].orbit.unit='km';
  assert.throws(()=>assembleCatalog(manifest,wrongUnit,editorial),/Einheit passt nicht/);
  const badEcc=clone(categoryDocs);badEcc[1].objects[0].orbit.eccentricity=1.5;
  assert.throws(()=>assembleCatalog(manifest,badEcc,editorial),/gebundene elliptische Bahnen/);
  const cycle=clone(categoryDocs);cycle[0].objects[0].parentId='earth';cycle[0].objects[0].orbit.unit='km';cycle[0].objects[0].orbit.semiMajorAxis=5000;cycle[0].objects[0].orbit.periodDays=1;
  assert.throws(()=>assembleCatalog(manifest,cycle,editorial),/Zyklus/);
});

test('Editorial drafts stay hidden, published sections and HTTPS references are checked',()=>{
  const e=clone(editorial);
  const article=e.articles.find(x=>x.id==='earth');
  article.status='draft';article.sections=[{heading:'Unfertig',text:'Noch nicht veröffentlicht'}];
  const draft=assembleCatalog(manifest,categoryDocs,e);
  assert.equal(draft.bodies.find(b=>b.id==='earth').editorial,undefined);
  assert.equal(draft.bodies.find(b=>b.id==='earth').description,'');
  article.status='published';article.summary='Geprüfter Teaser';
  article.sections=[{heading:'Einleitung',text:'Längerer redaktioneller Inhalt.'}];
  article.references=[{title:'Quellenbeispiel',url:'https://example.org/source'}];
  const published=assembleCatalog(manifest,categoryDocs,e);
  assert.equal(published.bodies.find(b=>b.id==='earth').editorial.sections[0].heading,'Einleitung');
  assert.equal(published.bodies.find(b=>b.id==='earth').description,'Geprüfter Teaser');
  article.references[0].url='javascript:alert(1)';
  assert.throws(()=>assembleCatalog(manifest,categoryDocs,e),/Quellenlink muss HTTPS/);
  article.references[0].url='https://example.org/source';
  e.articles.push(clone(article));
  assert.throws(()=>assembleCatalog(manifest,categoryDocs,e),/doppelte ID/);
  const omitted=clone(editorial);omitted.articles.pop();
  assert.equal(assembleCatalog(manifest,categoryDocs,omitted).bodies.length,192,'Missing article does not delete astronomical body');
});

test('Live data enrich orbital fields but never overwrites curated copy',()=>{
  const {bodies}=assembleCatalog(manifest,categoryDocs,editorial);
  const earth=bodies.find(b=>b.id==='earth');
  const result=mergeLiveBodies(bodies,[{id:'earth',a:1.001,source:'Solar System OpenData',description:'provider overwrite attempt',editorial:null},
    {id:'sbdb-new',name:'Neuer Asteroid',type:'asteroid',parentId:'sun'}]);
  const updated=result.find(b=>b.id==='earth');
  assert.equal(updated.a,1.001);
  assert.equal(updated.source,'Solar System OpenData');
  assert.equal(updated.description,earth.description);
  assert.equal(updated.editorial,earth.editorial);
  assert.equal(result.length,193);
  assert.equal(bodies.length,192,'Original catalog remains unchanged');
});
