import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  catalogDistanceAu,catalogListingDistance,catalogMetric,filteredBodies,renderCatalog
} from '../src/ui/object-list.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const byId=new Map(INITIAL_BODIES.map(body=>[body.id,body]));
const didymos=byId.get('didymos');
const dimorphos=byId.get('dimorphos');
const state=(changes={})=>({bodies:INITIAL_BODIES,search:'',catalogSort:'distance',catalogPlanetOnly:false,...changes});

function render(stateValue,options={}){
  const nodes=new Map(['object-list','object-count','list-label','catalog-sort'].map(id=>[id,{
    innerHTML:'',textContent:'',dataset:{},title:'',querySelectorAll:()=>[],setAttribute(){}
  }]));
  const previous=globalThis.document;
  globalThis.document={getElementById:id=>nodes.get(id)};
  try{renderCatalog(stateValue,()=>{},options);}
  finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
  return nodes.get('object-list').innerHTML;
}
function row(markup,id){
  const match=markup.match(new RegExp(`<button class="object-row[^>]*data-id="${id}"[^>]*>[\\s\\S]*?<\\/button>`));
  assert.ok(match,`Katalogeintrag ${id} fehlt`);
  return match[0];
}

test('v127: Dimorphos inherits Didymos solar distance in an unfiltered catalog',()=>{
  assert.equal(didymos.type,'binary');
  assert.equal(dimorphos.type,'binary','the companion is not cataloged as type moon');
  assert.equal(dimorphos.parentId,didymos.id);
  const distance=catalogListingDistance(dimorphos,{byId,useParentForMoons:true});
  assert.deepEqual(distance,{au:catalogDistanceAu(didymos),fromParent:didymos.name});
  assert.equal(catalogMetric(dimorphos,'distance',distance).value,
    catalogMetric(didymos,'distance').value);
  assert.equal(catalogDistanceAu(dimorphos),1.152/149597870.7,
    'the underlying moon orbital separation must stay untouched');
});

test('v127: sorted rows put Didymos and Dimorphos together instead of Dimorphos at the start',()=>{
  const ordered=filteredBodies(state()).map(body=>body.id);
  const parent=ordered.indexOf('didymos'),moon=ordered.indexOf('dimorphos');
  assert.ok(parent>=0 && moon>=0);
  assert.equal(moon,parent+1,'the two entries share the same sorting distance');
  assert.notEqual(ordered[0],'dimorphos');
  const markup=render(state());
  const text=catalogMetric(didymos,'distance').value;
  assert.ok(row(markup,'didymos').includes(`>${text}</span>`));
  assert.ok(row(markup,'dimorphos').includes(`>${text}</span>`),
    'the inherited distance must also appear in the UI');
  assert.match(row(markup,'dimorphos'),/Mittlere Entfernung wie \(65803\) Didymos/);
});

test('v127: search and active planet filter retain Dimorphos own orbital separation',()=>{
  const own=catalogListingDistance(dimorphos,{byId,useParentForMoons:false});
  assert.equal(catalogMetric(dimorphos,'distance',own).value,'1,152 km');
  const searched=render(state({search:'Didymos'}));
  assert.ok(row(searched,'dimorphos').includes('>1,152 km</span>'));
  const isolated=render(state({catalogPlanetOnly:true}),{planetId:'didymos'});
  assert.ok(row(isolated,'dimorphos').includes('>1,152 km</span>'));
  const fullInPlanet=render(state({catalogPlanetOnly:false}),{planetId:'didymos'});
  assert.ok(row(fullInPlanet,'dimorphos').includes(
    `>${catalogMetric(didymos,'distance').value}</span>`),
    'a disabled planet filter behaves like the full catalog');
});

test('v127: moon-of-moon inheritance resolves to the distant solar parent',()=>{
  const nested={id:'nested-moon',name:'Unter-Mond',type:'moon',parentId:'dimorphos',
    a:0.3,meanDistanceToParent:0.3,meanDistanceUnit:'km'};
  const nestedMap=new Map([...byId,[nested.id,nested]]);
  assert.deepEqual(catalogListingDistance(nested,{byId:nestedMap,useParentForMoons:true}),{
    au:catalogDistanceAu(didymos),fromParent:dimorphos.name
  });
  assert.equal(catalogListingDistance(nested,{byId:nestedMap,useParentForMoons:false}).au,
    0.3/149597870.7);
});

test('v129: satellites inherit, but probes and Sun-orbiting binary asteroids do not',()=>{
  const artificial=INITIAL_BODIES.find(body=>body.type==='satellite'&&body.parentId==='earth');
  assert.ok(artificial);
  const earth=byId.get('earth');
  assert.deepEqual(catalogListingDistance(artificial,{byId,useParentForMoons:true}),{
    au:catalogDistanceAu(earth),fromParent:earth.name
  });
  const probe={id:'probe-earth',name:'Space probe',type:'probe',parentId:'earth',a:6800,meanDistanceUnit:'km'};
  assert.deepEqual(catalogListingDistance(probe,{byId,useParentForMoons:true}),{
    au:catalogDistanceAu(probe),fromParent:null
  });
  assert.deepEqual(catalogListingDistance(didymos,{byId,useParentForMoons:true}),{
    au:catalogDistanceAu(didymos),fromParent:null
  });
  const moon=byId.get('moon');
  assert.equal(catalogListingDistance(moon,{byId,useParentForMoons:true}).au,
    catalogDistanceAu(earth),'regular moons continue inheriting');
});

test('v127: every catalog moon receives its parent solar distance in the full listing',()=>{
  const moons=INITIAL_BODIES.filter(body=>body.type==='moon');
  assert.ok(moons.length>100);
  for(const moon of moons){
    const parent=byId.get(moon.parentId);
    assert.ok(parent,`${moon.name} has an existing parent`);
    const metric=catalogListingDistance(moon,{byId,useParentForMoons:true});
    assert.equal(metric.au,catalogDistanceAu(parent),`${moon.name} inherits ${parent.name}`);
    assert.equal(metric.fromParent,parent.name);
  }
});
