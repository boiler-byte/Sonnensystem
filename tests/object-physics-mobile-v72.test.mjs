import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog,parseCategory,mergeLiveBodies} from '../src/data/catalog.js';
import {displayTemperatureK,displayAtmosphericPressure,displaySurfaceGravity,displayMeanParentDistance} from '../src/ui/formatters.js';
import {renderDetail} from '../src/ui/object-details.js';

const readJSON=async path=>JSON.parse(await readFile(new URL('../'+path.slice(2),import.meta.url),'utf8'));
const getBodies=async()=> (await loadCatalog(readJSON)).bodies;
const get=id=>getBodies().then(b=>b.find(x=>x.id===id));
const deepCopy=x=>structuredClone(x);

test('v72: schema accepts optional values, provenance, and mean distance while rejecting invalid data',async()=>{
  const planetDoc=await readJSON('./data/catalog/planets.json');
  const mercury=planetDoc.objects.find(x=>x.id==='mercury');
  const parsed=parseCategory(planetDoc,'planet');
  assert.equal(parsed.find(x=>x.id==='mercury').temperatureMinK,93.15);
  assert.equal(parsed.find(x=>x.id==='mercury').temperatureMaxK,703.15);
  assert.equal(parsed.find(x=>x.id==='earth').atmosphericPressurePa,100000);
  const invalid=(change)=>{
    const doc=deepCopy(planetDoc);change(doc.objects.find(x=>x.id==='mercury'));
    return ()=>parseCategory(doc,'planet');
  };
  assert.throws(invalid(o=>o.physical.temperatureMinK=900),/Temperatur-Minimum > Maximum|mittlere Temperatur < Minimum/);
  assert.throws(invalid(o=>o.physical.temperatureMeanK=4000),/mittlere Temperatur > Maximum/);
  assert.throws(invalid(o=>o.physical.atmosphericPressurePa=-1),/atmosphericPressurePa/);
  assert.throws(invalid(o=>o.physical.surfaceGravityMs2='9.8'),/surfaceGravityMs2/);
  assert.throws(invalid(o=>o.physical.dataSourceUrl='http://test.com'),/dataSourceUrl/);
  assert.throws(invalid(o=>o.orbit.meanDistance=-1),/meanDistance/);
  assert.throws(invalid(o=>o.orbit.meanDistance='1'),/meanDistance/);
  const optional=deepCopy(planetDoc);const e=optional.objects.find(x=>x.id==='earth');
  e.physical.temperatureMinK=null;e.physical.temperatureMaxK=null;e.physical.surfaceGravityMs2=0;
  e.orbit.meanDistance=1.2345;
  const loaded=parseCategory(optional,'planet').find(x=>x.id==='earth');
  assert.equal(loaded.temperatureMinK,null);
  assert.equal(loaded.surfaceGravityMs2,0);
  assert.equal(loaded.meanDistanceToParent,1.2345);
  assert.equal(loaded.meanDistanceEstimated,false);
  assert.equal(loaded.meanDistanceUnit,'AU');
});

test('v72: 192 objects remain; NASA entries do not fabricate unknown extrema or giant-planet pressure',async()=>{
  const bodies=await getBodies();
  assert.equal(bodies.length,192);
  const byId=new Map(bodies.map(b=>[b.id,b]));
  assert.equal(byId.get('moon').meanDistanceToParent,384400);
  assert.equal(byId.get('moon').meanDistanceUnit,'km');
  assert.equal(byId.get('earth').temperatureMeanK,288.15);
  assert.equal(byId.get('earth').surfaceGravityMs2,9.8);
  assert.equal(byId.get('sun').surfaceGravityMs2,274);
  assert.equal(byId.get('pluto').atmosphericPressurePa,1);
  assert.equal(byId.get('charon').surfaceGravityMs2,.29);
  assert.equal(byId.get('jupiter').atmosphericPressurePa,undefined);
  assert.equal(byId.get('jupiter').temperatureMinK,undefined);
  assert.equal(byId.get('earth').temperatureMinK,undefined);
  assert.equal(byId.get('phobos').temperatureMeanK,undefined);
  assert.equal(byId.get('phobos').meanDistanceToParent,9376);
  assert.equal(bodies.filter(b=>b.dataSourceUrl).length,12);
});

test('v72: source temperatures and pressure are displayed in readable German units',()=>{
  assert.equal(displayTemperatureK(288.15),'15 °C');
  assert.equal(displayTemperatureK(93.15),'-180 °C');
  assert.equal(displayTemperatureK(null),'—');
  assert.equal(displayAtmosphericPressure(9200000),'92 bar');
  assert.equal(displayAtmosphericPressure(1000),'0,01 bar');
  assert.equal(displayAtmosphericPressure(1),'1 Pa');
  assert.equal(displayAtmosphericPressure(1e-10),'1 × 10^-10 Pa');
  assert.equal(displayAtmosphericPressure(undefined),'—');
  assert.equal(displayAtmosphericPressure(0),'0 Pa');
  assert.equal(displaySurfaceGravity(.62),'0,063 G');
  assert.equal(displaySurfaceGravity(null),'—');
  assert.equal(displayMeanParentDistance({parentId:'sun',a:1.523679}),'1,524 AE');
  assert.equal(displayMeanParentDistance({parentId:'earth',a:384400}),'384.400 km');
  assert.equal(displayMeanParentDistance({parentId:null,a:0}),'—');
});

test('v72: live orbit updates refresh estimated distance without replacing explicit measurements',async()=>{
  const bodies=await getBodies();
  const updated=mergeLiveBodies(bodies,[{id:'earth',a:1.2},{id:'moon',a:382000}]);
  const earth=updated.find(x=>x.id==='earth'),moon=updated.find(x=>x.id==='moon');
  assert.equal(earth.meanDistanceEstimated,true);
  assert.equal(earth.meanDistanceToParent,1.2);
  assert.equal(earth.atmosphericPressurePa,100000);
  assert.equal(moon.meanDistanceEstimated,false);
  assert.equal(moon.meanDistanceToParent,384400);
  assert.equal(moon.a,382000);
});

test('v72: detail panel renders physical values, sources and missing-data marks',async()=>{
  const bodies=await getBodies();
  const original=globalThis.document,items=new Map();
  const el=id=>{
    if(!items.has(id))items.set(id,{
      hidden:false,disabled:false,innerHTML:'',textContent:'',style:{setProperty(){}},
      classList:{toggle(){}},setAttribute(){},querySelectorAll(){return []}
    });
    return items.get(id);
  };
  globalThis.document={getElementById:el};
  const show=id=>renderDetail({bodies,selected:id},{followEnabled:false,planetId:null,overrides:new Map()},()=>{});
  try{
    show('mercury');
    assert.match(el('stats-grid').innerHTML,/TEMPERATUR/);
    assert.match(el('stats-grid').innerHTML,/thermometer-icon--min/);
    assert.match(el('stats-grid').innerHTML,/-180 °C/);
    assert.match(el('stats-grid').innerHTML,/430 °C/);
    assert.match(el('orbit-facts').innerHTML,/https:\/\/science\.nasa\.gov\/mercury\/facts\//);
    show('earth');
    assert.match(el('stats-grid').innerHTML,/thermometer-icon--mean/);
    assert.match(el('stats-grid').innerHTML,/15 °C/);
    assert.match(el('stats-grid').innerHTML,/1 bar/);
    assert.match(el('stats-grid').innerHTML,/1 G/);
    assert.match(el('orbit-facts').innerHTML,/aus großer Halbachse/);
    show('jupiter');
    assert.match(el('stats-grid').innerHTML,/GRAVITATION \(1 BAR\)/);
    assert.match(el('stats-grid').innerHTML,/2,36 G/);
    show('phobos');
    assert.match(el('stats-grid').innerHTML,/MITTL\. ABSTAND/);
    assert.match(el('stats-grid').innerHTML,/9\.376 km/);
    assert.match(el('stats-grid').innerHTML,/ATMOSPHÄRENDRUCK/);
    assert.match(el('stats-grid').innerHTML,/—/);
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});
