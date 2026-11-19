import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {TYPES} from '../src/data/bodies.js';
import {LAYER_TYPES,LAYER_FILTER_TYPES} from '../src/data/layers.js';
import {catalogMatches} from '../src/ui/object-list.js';
import {loadCatalog} from '../src/data/catalog.js';

const read = async name => readFile(new URL('../'+name,import.meta.url),'utf8');
const readJson = async path => JSON.parse(await read(path.replace(/^\.\//,'')));

test('v90: TNO filter is grouped with dwarf planets without renaming the object type',async()=>{
  const html=await read('index.html');
  assert.match(html,/<label class="layer-option"><input type="checkbox" data-layer-type="dwarf" aria-label="Zwergplaneten und transneptunische Objekte"\/><span>Zwergplaneten<\/span><\/label>/);
  assert.ok(!LAYER_FILTER_TYPES.includes('tno'));
  assert.doesNotMatch(html,/data-layer-type="tno"/);
  assert.ok(LAYER_TYPES.includes('tno'));
  assert.equal(TYPES.tno.plural,'Transneptunische Objekte');
  const {bodies}=await loadCatalog(readJson);
  const target=bodies.find(b=>b.id==='quaoar');
  const byId=new Map(bodies.map(b=>[b.id,b]));
  assert.ok(target);
  assert.equal(catalogMatches(target,'transneptunische objekte',byId),true);
});
