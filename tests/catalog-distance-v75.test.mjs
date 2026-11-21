import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AU_KM} from '../src/data/bodies.js';
import {
  catalogDistanceAu,catalogListingDistance,catalogMetric,filteredBodies,renderCatalog
} from '../src/ui/object-list.js';

const body=(id,props={})=>({id,name:id,type:'planet',parentId:'sun',a:1,radiusKm:1,...props});
const sun=body('sun',{name:'Sonne',type:'star',parentId:null,a:0});
const earth=body('earth',{name:'Erde',a:1});
const moon=body('moon',{name:'Mond',type:'moon',parentId:'earth',meanDistanceToParent:384400,meanDistanceUnit:'km'});
const venus=body('venus',{name:'Venus',a:0.723});
const mars=body('mars',{name:'Mars',a:1.524});
const phobos=body('phobos',{name:'Phobos',type:'moon',parentId:'mars',meanDistanceToParent:9376,meanDistanceUnit:'km'});
const iss=body('iss',{name:'ISS',type:'satellite',parentId:'earth',meanDistanceToParent:6800,meanDistanceUnit:'km'});
const bodies=[moon,mars,venus,sun,iss,earth,phobos];
const byId=new Map(bodies.map(b=>[b.id,b]));
const list=(state={},options={})=>filteredBodies({bodies,search:'',catalogSort:'distance',...state},options).map(b=>b.id);

function rendered(state,options={}){
  const nodes=new Map(['object-list','object-count','list-label','catalog-sort'].map(id=>[id,{
    innerHTML:'',textContent:'',dataset:{},attrs:{},title:'',querySelectorAll:()=>[],
    setAttribute(name,value){this.attrs[name]=value;}
  }]));
  const previous=globalThis.document;
  globalThis.document={getElementById:id=>nodes.get(id)};
  try{renderCatalog({bodies,selected:'earth',search:'',catalogSort:'distance',...state},()=>{},options);}
  finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
  return nodes.get('object-list').innerHTML;
}
const row=(markup,id)=>{
  const match=markup.match(new RegExp(`<button class="object-row[^>]*data-id="${id}"[^>]*>[\\s\\S]*?<\\/button>`));
  assert.ok(match,`missing row for ${id}`);
  return match[0];
};

test('v75: km display at and below 0.2 AE; AE above threshold (boundary inclusive)',()=>{
  const atThreshold=body('at',{a:0.2});
  const lower=body('below',{a:0.2-0.00001});
  const higher=body('above',{a:0.20001});
  assert.equal(catalogMetric(atThreshold,'distance').value,
    `${new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(AU_KM*0.2)} km`);
  assert.match(catalogMetric(lower,'distance').value,/ km$/);
  assert.match(catalogMetric(higher,'distance').value,/ AE$/);
  assert.equal(catalogMetric(moon,'distance').value,'384.400 km');
  assert.equal(catalogMetric(earth,'distance').value,'1 AE');
  assert.equal(catalogMetric(body('unknown',{a:0}),'distance').value,'—');
  assert.equal(catalogMetric(sun,'distance').value,'—');
  assert.equal(catalogDistanceAu(moon),384400/AU_KM,'stored parent orbital distances stay unchanged');
});

test('v75: moon inherits exactly its parent distance only when configured for the full atlas',()=>{
  assert.deepEqual(catalogListingDistance(moon,{byId,useParentForMoons:true}),{au:1,fromParent:'Erde'});
  assert.deepEqual(catalogListingDistance(phobos,{byId,useParentForMoons:true}),{au:1.524,fromParent:'Mars'});
  assert.deepEqual(catalogListingDistance(moon,{byId,useParentForMoons:false}),
    {au:384400/AU_KM,fromParent:null});
  assert.deepEqual(catalogListingDistance(iss,{byId,useParentForMoons:true}),
    {au:1,fromParent:'Erde'},'satellites share their parent distance in the full atlas');
  assert.deepEqual(catalogListingDistance(iss,{byId,useParentForMoons:false}),
    {au:6800/AU_KM,fromParent:null},'filtered satellite values are still local');
  assert.equal(catalogListingDistance(body('orphan',{type:'moon',parentId:'missing',a:12000}),
    {byId,useParentForMoons:true}).au,12000/AU_KM,'missing parent falls back to own distance');
  const missing=body('missing-parent',{a:0});
  assert.equal(catalogListingDistance(body('child',{type:'moon',parentId:'missing-parent',a:900}),
    {byId:new Map([['missing-parent',missing]]),useParentForMoons:true}).au,null,
    'unknown parent distance is not silently replaced by moon distance');
});

test('v75: sorting inherits moon distances in solar overview even with default filter state',()=>{
  assert.deepEqual(list({catalogPlanetOnly:true}),
    ['venus','earth','iss','moon','mars','phobos','sun']);
  assert.deepEqual(list({catalogPlanetOnly:false}),
    ['venus','earth','iss','moon','mars','phobos','sun']);
  assert.deepEqual(list({catalogPlanetOnly:false},{planetId:'earth'}),
    ['venus','earth','iss','moon','mars','phobos','sun'],'filter switched off in planet scene');
  assert.deepEqual(list({catalogPlanetOnly:true},{planetId:'earth'}),
    ['iss','moon','earth'],'active planet filter uses original moon orbit and hides other systems');
  assert.deepEqual(list({search:'Erde',catalogPlanetOnly:false}),
    ['iss','moon','earth'],'search uses original moon orbit even with filter switched off');
  assert.deepEqual(list({search:'   ',catalogPlanetOnly:false}),
    ['venus','earth','iss','moon','mars','phobos','sun'],'whitespace is an empty query');
});

test('v75: visible metric and sorting use identical distances for each context',()=>{
  const full=rendered({catalogPlanetOnly:true});
  assert.match(row(full,'moon'),/>1 AE<\/span>/);
  assert.match(row(full,'moon'),/Mittlere Entfernung wie Erde/);
  assert.match(row(full,'phobos'),/>1,524 AE<\/span>/);
  assert.match(row(full,'iss'),/>1 AE<\/span>/);
  assert.match(row(full,'iss'),/Mittlere Entfernung wie Erde/);
  const search=rendered({search:'Erde',catalogPlanetOnly:false});
  assert.match(row(search,'moon'),/>384\.400 km<\/span>/);
  assert.doesNotMatch(row(search,'moon'),/Entfernung wie Erde/);
  assert.match(row(search,'iss'),/>6\.800 km<\/span>/);
  const filtered=rendered({catalogPlanetOnly:true},{planetId:'earth'});
  assert.match(row(filtered,'moon'),/>384\.400 km<\/span>/);
  assert.match(row(filtered,'iss'),/>6\.800 km<\/span>/);
  const unfiltered=rendered({catalogPlanetOnly:false},{planetId:'earth'});
  assert.match(row(unfiltered,'moon'),/>1 AE<\/span>/);
  assert.match(row(unfiltered,'iss'),/>1 AE<\/span>/);
});
