import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {
  catalogDistanceAu,catalogListingDistance,catalogMetric,filteredBodies,renderCatalog
} from '../src/ui/object-list.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const byId=new Map(INITIAL_BODIES.map(body=>[body.id,body]));
const earth=byId.get('earth');
const satellites=INITIAL_BODIES.filter(body=>body.type==='satellite');
const state=(overrides={})=>({bodies:INITIAL_BODIES,catalogSort:'distance',search:'',catalogPlanetOnly:false,...overrides});

function render(s,options={}){
  const nodes=new Map(['object-list','object-count','list-label','catalog-sort'].map(id=>[id,{
    innerHTML:'',textContent:'',dataset:{},title:'',querySelectorAll:()=>[],setAttribute(){}
  }]));
  const before=globalThis.document;
  globalThis.document={getElementById:id=>nodes.get(id)};
  try{renderCatalog(s,()=>{},options);}
  finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
  return nodes.get('object-list').innerHTML;
}
function row(markup,id){
  const match=markup.match(new RegExp(`<button class="object-row[^>]*data-id="${id}"[^>]*>[\\s\\S]*?<\\/button>`));
  assert.ok(match,`${id} not found`);
  return match[0];
}

test('v129: all nine real Earth satellites inherit the parent distance in the unfiltered distance list',()=>{
  assert.equal(satellites.length,9);
  for(const satellite of satellites){
    assert.equal(satellite.parentId,'earth');
    const listed=catalogListingDistance(satellite,{byId,useParentForMoons:true});
    assert.deepEqual(listed,{au:catalogDistanceAu(earth),fromParent:earth.name},satellite.name);
    assert.equal(catalogMetric(satellite,'distance',listed).value,'1 AE');
    assert.notEqual(catalogDistanceAu(satellite),catalogDistanceAu(earth),'catalog orbital data remains unchanged');
  }
});

test('v129: all satellites display the same distance as Earth, not their local altitude',()=>{
  const markup=render(state());
  for(const satellite of satellites){
    assert.match(row(markup,satellite.id),/>1 AE<\/span>/);
    assert.match(row(markup,satellite.id),/Mittlere Entfernung wie Erde/);
  }
  const sorted=filteredBodies(state());
  const venusIndex=sorted.findIndex(body=>body.id==='venus');
  const earthIndex=sorted.findIndex(body=>body.id==='earth');
  const marsIndex=sorted.findIndex(body=>body.id==='mars');
  assert.ok(venusIndex<earthIndex&&earthIndex<marsIndex);
  for(const satellite of satellites){
    const index=sorted.findIndex(body=>body.id===satellite.id);
    assert.ok(index>venusIndex&&index<marsIndex,`${satellite.name} belongs with Earth`);
  }
});

test('v129: active search and planet isolation retain local satellite distances',()=>{
  const example=satellites.find(body=>body.id==='sat-25544');
  assert.ok(example);
  const own=catalogListingDistance(example,{byId,useParentForMoons:false});
  const original=catalogMetric(example,'distance',own).value;
  assert.equal(original,'6.795 km');
  for(const [s,options] of [
    [state({search:'ISS'}),{}],
    [state({catalogPlanetOnly:true}),{planetId:'earth'}]
  ]){
    const markup=render(s,options);
    assert.ok(row(markup,example.id).includes(`>${original}</span>`));
    assert.doesNotMatch(row(markup,example.id),/Mittlere Entfernung wie Erde/);
  }
  const full=render(state({catalogPlanetOnly:false}),{planetId:'earth'});
  assert.match(row(full,example.id),/>1 AE<\/span>/);
});

test('v129: nested satellites inherit system distance, but probes continue using their own',()=>{
  const nested={id:'nested-sat',name:'Subsatellit',type:'satellite',parentId:'sat-25544',a:120,meanDistanceUnit:'km'};
  const nestedMap=new Map([...byId,[nested.id,nested]]);
  assert.deepEqual(catalogListingDistance(nested,{byId:nestedMap,useParentForMoons:true}),{
    au:catalogDistanceAu(earth),fromParent:'ISS'
  });
  assert.equal(catalogListingDistance(nested,{byId:nestedMap,useParentForMoons:false}).au,
    120/149597870.7);
  const probe={id:'probe-local',type:'probe',parentId:'earth',a:20000,meanDistanceUnit:'km'};
  assert.deepEqual(catalogListingDistance(probe,{byId,useParentForMoons:true}),{
    au:catalogDistanceAu(probe),fromParent:null
  });
});

test('v129: clearing selection switches to Objekte, including if the scene already has none',async()=>{
  const source=await readFile(new URL('../src/app/camera-controller.js',import.meta.url),'utf8');
  const extracted=source.match(/export function clearSelection\(\)\{[\s\S]*?\n\}/)?.[0];
  assert.ok(extracted,'selection controller function exists');
  const calls=[],S={selected:'earth'};
  const renderer={setSelected(value){calls.push(['setSelected',value]);}};
  const mobileSheets={selectPanel(value){calls.push(['selectPanel',value]);}};
  const context=vm.createContext({S,renderer,mobileSheets,
    updateCatalog:()=>calls.push(['renderCatalog']),updateDetail:()=>calls.push(['renderDetail'])});
  const clear=vm.runInContext(extracted.replace('export function','function')+'\nclearSelection;',context);
  clear();
  assert.equal(S.selected,null);
  assert.deepEqual(calls,[['setSelected',null],['renderCatalog'],['renderDetail'],['selectPanel','catalog']]);
  calls.length=0;
  clear();
  assert.deepEqual(calls,[['selectPanel','catalog']],'clearing an already empty selection still selects Objekte');
});
