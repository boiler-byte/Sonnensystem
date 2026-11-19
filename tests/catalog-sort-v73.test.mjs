import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {AU_KM} from '../src/data/bodies.js';
import {
  CATALOG_SORT_MODES,nextCatalogSort,catalogDistanceAu,catalogDiameterKm,catalogMetric,
  filteredBodies,renderCatalog
} from '../src/ui/object-list.js';
import {S,setRenderer} from '../src/app/state.js';
import {openPlanetScene} from '../src/app/camera-controller.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf8');
const object=(id,props={})=>({id,name:id,type:'planet',parentId:'sun',a:1,radiusKm:1,...props});
const distance=body=>catalogDistanceAu(body);

function withDOM(state,options={}){
  const nodes=new Map(['object-list','object-count','list-label','catalog-sort'].map(id=>[id,{
    innerHTML:'',textContent:'',dataset:{},attrs:{},title:'',querySelectorAll:()=>[],
    setAttribute(name,value){this.attrs[name]=value;}
  }]));
  const previous=globalThis.document;
  globalThis.document={getElementById:id=>nodes.get(id)};
  try{renderCatalog(state,()=>{},options);}
  finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
  return nodes;
}

function renderedIds(nodes){return [...nodes.get('object-list').innerHTML.matchAll(/data-id="([^"]+)"/g)].map(m=>m[1]);}

// Clicking the same button cycles exactly three modes, without changing other preferences.
test('v73: catalog sort toggle cycles Standard → Entfernung → Größe → Standard',()=>{
  assert.deepEqual(CATALOG_SORT_MODES,['default','distance','size']);
  let mode='default';
  for(const expected of ['distance','size','default','distance']){
    mode=nextCatalogSort(mode);
    assert.equal(mode,expected);
  }
  assert.equal(nextCatalogSort('unknown'),'distance');
});

test('v73: default sort retains featured object order and search ranking',()=>{
  const plain={bodies:INITIAL_BODIES,search:''};
  const standard=filteredBodies(plain).map(b=>b.id);
  assert.deepEqual(filteredBodies({...plain,catalogSort:'default'}).map(b=>b.id),standard);
  assert.deepEqual(standard.slice(0,4),['sun','mercury','venus','earth']);
  for(const query of ['saturn','jupiter mond','uranus c']){
    const before=filteredBodies({...plain,search:query}).map(b=>b.id);
    assert.deepEqual(filteredBodies({...plain,search:query,catalogSort:'default'}).map(b=>b.id),before);
  }
});

test('v73: mean distance is normalized from AU and km, with unknown separation handled explicitly',()=>{
  const moon=object('moon',{type:'moon',parentId:'earth',a:384400,meanDistanceToParent:384400,meanDistanceUnit:'km'});
  assert.ok(Math.abs(distance(moon)-384400/AU_KM)<1e-12);
  assert.equal(distance(object('earth',{a:1.0001,meanDistanceToParent:1.23,meanDistanceUnit:'AU'})),1.23);
  assert.equal(distance(object('earth',{a:1.0})),1);
  assert.equal(distance(object('moon',{parentId:'earth',a:600000})),600000/AU_KM);
  assert.equal(distance(object('sun',{parentId:null,a:0})),null);
  assert.equal(distance(object('unknown',{a:0})),null);
  assert.equal(distance(object('invalid',{meanDistanceUnit:'m',a:100})),null);
  assert.equal(distance(object('invalid',{a:Number.POSITIVE_INFINITY})),null);
  const rendered=catalogMetric(moon,'distance');
  assert.equal(rendered.value,'384.400 km');
  assert.match(rendered.label,/Elternkörper/);
  const tiny=catalogMetric(object('iss',{type:'satellite',parentId:'earth',a:6780,meanDistanceUnit:'km'}),'distance');
  assert.equal(tiny.value,'6.780 km','sub-0.2-AE distances are rendered in km');
});

test('v75: distance sort groups moons at their parent in the unfiltered atlas',()=>{
  const bodies=[
    object('sun',{parentId:null,a:0,radiusKm:696340}),
    object('earth',{a:1}),
    object('moon',{type:'moon',parentId:'earth',a:384400,meanDistanceUnit:'km'}),
    object('venus',{a:.72}),
    object('iss',{type:'satellite',parentId:'earth',a:6775,meanDistanceUnit:'km',radiusKm:0}),
    object('unknown',{a:0}),
  ];
  const before=bodies.map(b=>b.id);
  assert.deepEqual(filteredBodies({bodies,search:'',catalogSort:'distance'}).map(b=>b.id),
    ['iss','venus','earth','moon','sun','unknown']);
  assert.deepEqual(bodies.map(b=>b.id),before,'sort must not reorder catalog source');
});

test('v73: size sorting is by diameter descending (not radius or scene scale), missing after measured',()=>{
  const bodies=[object('tiny',{radiusKm:.004}),object('big',{radiusKm:200}),
    object('medium',{radiusKm:6.5}),object('no-size',{radiusKm:0}),
    object('unset',{radiusKm:undefined}),object('invalid',{radiusKm:-3})];
  assert.equal(catalogDiameterKm(bodies[1]),400);
  assert.equal(catalogMetric(bodies[1],'size').value,'400 km');
  assert.equal(catalogDiameterKm(bodies[3]),null);
  assert.equal(catalogMetric(bodies[3],'size').value,'—');
  assert.deepEqual(filteredBodies({bodies,search:'',catalogSort:'size'}).map(b=>b.id),
    ['big','medium','tiny','no-size','unset','invalid']);
  const full=filteredBodies({bodies:INITIAL_BODIES,search:'',catalogSort:'size'});
  assert.equal(full[0].id,'sun','Sun has greatest catalog diameter');
});

test('v73: sorting composes with search and planet isolation without changing search matches',()=>{
  const filtered=filteredBodies({bodies:INITIAL_BODIES,search:'uranus c',catalogPlanetOnly:true,catalogSort:'distance'},
    {planetId:'uranus'});
  assert.equal(filtered.length,9);
  assert.ok(filtered.every(b=>b.parentId==='uranus'));
  const values=filtered.map(b=>catalogDistanceAu(b));
  assert.deepEqual(values,[...values].sort((a,b)=>a-b));
  const noFilter=filteredBodies({bodies:INITIAL_BODIES,search:'uranus c',catalogPlanetOnly:false,catalogSort:'size'},
    {planetId:'earth'});
  assert.equal(noFilter.length,9);
  assert.deepEqual(filteredBodies({bodies:INITIAL_BODIES,search:'uranus c',catalogPlanetOnly:true,catalogSort:'size'},
    {planetId:'earth'}),[]);
});

test('v73: header button, values on right and object count update for all sort modes',()=>{
  const bodies=[object('earth',{name:'Erde',a:1,radiusKm:6371}),
    object('moon',{name:'Mond',type:'moon',parentId:'earth',meanDistanceToParent:384400,meanDistanceUnit:'km',radiusKm:1737.4}),
    object('sun',{name:'Sonne',type:'star',parentId:null,a:0,radiusKm:696340})];
  for(const [mode,label,first,metricRegex] of [
    ['default','OBJEKTE IM ATLAS','sun',null],
    ['distance','ENTFERNUNG ↑','earth',/class="object-metric"[^>]*>1 AE<\/span>/],
    ['size','GRÖSSE ↓','sun',/class="object-metric"[^>]*>1\.392\.680 km<\/span>/]
  ]){
    const nodes=withDOM({bodies,selected:'earth',search:'',catalogSort:mode});
    const markup=nodes.get('object-list').innerHTML;
    assert.equal(renderedIds(nodes)[0],first);
    assert.equal(nodes.get('list-label').textContent,label);
    assert.equal(nodes.get('object-count').textContent,'03');
    assert.equal(nodes.get('catalog-sort').dataset.sort,mode);
    assert.match(nodes.get('catalog-sort').attrs['aria-label'],/Sortierung:/);
    if(metricRegex){assert.match(markup,metricRegex);assert.doesNotMatch(markup,/class="row-arrow"/);}
    else{assert.match(markup,/class="row-arrow"/);assert.doesNotMatch(markup,/class="object-metric"/);}
    if(mode==='distance')assert.match(markup,/Mittlere Entfernung zum Elternkörper: unbekannt.*?—<\/span>/);
  }
});

test('v73: entering a planet view enables the planet filter, but user can turn it off until next scene',()=>{
  const originalBodies=S.bodies,originalFilter=S.catalogPlanetOnly;
  S.bodies=INITIAL_BODIES;
  const fakeRenderer={planetId:null,showPlanetSystem(id){this.planetId=id;return true;}};
  setRenderer(fakeRenderer);
  try{
    S.catalogPlanetOnly=false;
    assert.equal(openPlanetScene('earth'),true);
    assert.equal(S.catalogPlanetOnly,true);
    assert.ok(filteredBodies({bodies:S.bodies,search:'',catalogPlanetOnly:S.catalogPlanetOnly},{planetId:'earth'})
      .every(b=>b.id==='earth'||b.parentId==='earth'));
    S.catalogPlanetOnly=false;
    assert.equal(filteredBodies({bodies:S.bodies,search:'',catalogPlanetOnly:S.catalogPlanetOnly},{planetId:'earth'}).length,INITIAL_BODIES.length);
    assert.equal(openPlanetScene('mars'),true);
    assert.equal(S.catalogPlanetOnly,true,'switching planet systems should re-enable the default');
    S.catalogPlanetOnly=false;
    assert.equal(openPlanetScene('moon'),false,'a moon is not a valid planet scene');
    assert.equal(S.catalogPlanetOnly,false,'an invalid scene must not change the filter');
  }finally{S.bodies=originalBodies;S.catalogPlanetOnly=originalFilter;setRenderer(null);}
});

test('v73: markup and event handlers expose the same sort control on desktop and mobile',async()=>{
  const [html,css,handlers,state]=await Promise.all([
    read('index.html'),read('css/styles.css'),read('src/ui/event-handlers.js'),read('src/app/state.js')]);
  assert.equal((html.match(/id="catalog-sort"/g)||[]).length,1);
  assert.match(html,/<div class="list-header"><button id="catalog-sort"/);
  assert.match(html,/id="catalog-sort"[^>]*aria-controls="object-list"/);
  assert.match(css,/\.list-sort-button\{display:inline-flex/);
  assert.match(css,/\.object-metric\{[^}]+text-align:right/);
  assert.match(handlers,/\$\('catalog-sort'\)\.addEventListener\('click'/);
  assert.match(handlers,/S\.catalogSort=nextCatalogSort\(S\.catalogSort\)/);
  assert.match(state,/catalogPlanetOnly:true, catalogSort:'default'/);
  assert.match(css,/\.sheet-content>\.catalog/,'mobile sheet reuses the catalog');
});
