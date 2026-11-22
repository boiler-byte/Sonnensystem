import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {
  LAYER_TYPES,LAYER_FILTER_TYPES,LAYER_FILTER_GROUPS,layerFilterMembers,
  layerEnabled,layerPreset,layerSummary,updateLayerSelection,availableLayerTypes,
  displayMatchesPreset
} from '../src/data/layers.js';
import {CATEGORY_COLORS,TYPES} from '../src/data/bodies.js';
import {solarOrbitBodies} from '../src/renderer/solar-view.js';
import {loadCatalog} from '../src/data/catalog.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

const grouped=[
  ['asteroid','binary','Asteroiden und Doppelasteroiden'],
  ['dwarf','tno','Zwergplaneten und transneptunische Objekte']
];

test('v144: 8 underlying filter controls represent 10 unchanged scientific categories',async()=>{
  const html=await read('index.html');
  const uiTypes=[...html.matchAll(/data-layer-type="([a-z]+)"/g)].map(m=>m[1]);
  assert.deepEqual(uiTypes,['star','planet','dwarf','asteroid','comet','moon','satellite','probe']);
  assert.equal(uiTypes.length,8);
  assert.equal(LAYER_TYPES.length,10);
  for(const [filter,partner,description] of grouped){
    assert.deepEqual(layerFilterMembers(filter),[filter,partner]);
    assert.deepEqual(LAYER_FILTER_GROUPS[filter],[filter,partner]);
    assert.ok(!uiTypes.includes(partner));
    assert.match(html,new RegExp(`data-layer-type="${filter}" aria-label="${description}"/><span>${filter==='asteroid'?'Asteroiden':'Zwergplaneten'}</span>`));
  }
});

test('v90: one filter toggles each pair atomically, both directions and former ids',()=>{
  let selection=layerPreset('standard');
  const original=selection;
  selection=updateLayerSelection(selection,'asteroid',true);
  assert.equal(selection.mode,'custom');
  assert.equal(layerSummary(selection),'3 Layer');
  assert.equal(layerEnabled(selection,'asteroid'),true);
  assert.equal(layerEnabled(selection,'binary'),true);
  assert.equal(layerEnabled(original,'asteroid'),false,'preset remains immutable');
  selection=updateLayerSelection(selection,'dwarf',true);
  assert.equal(layerSummary(selection),'4 Layer');
  assert.equal(layerEnabled(selection,'dwarf'),true);
  assert.equal(layerEnabled(selection,'tno'),true);
  selection=updateLayerSelection(selection,'binary',false);
  assert.equal(layerEnabled(selection,'asteroid'),false);
  assert.equal(layerEnabled(selection,'binary'),false);
  selection=updateLayerSelection(selection,'tno',false);
  assert.deepEqual([...selection.types],['star','planet']);
  assert.equal(selection.mode,'standard');
  selection=layerPreset('all');
  selection=updateLayerSelection(selection,'dwarf',false);
  assert.equal(selection.mode,'custom');
  assert.equal(layerEnabled(selection,'tno'),false);
  assert.equal(layerEnabled(selection,'asteroid'),true);
  selection=updateLayerSelection(selection,'dwarf',true);
  assert.equal(selection.mode,'all','all preset remains reachable with 8 checkboxes');
});

test('v90: shared toggles affect rendered bodies, not their scientific types or details',async()=>{
  const readJson=async path=>JSON.parse(await read(path.replace(/^\.\//,'')));
  const {bodies}=await loadCatalog(readJson);
  const groups={dwarf:[],tno:[],asteroid:[],binary:[]};
  for(const body of bodies)if(groups[body.type])groups[body.type].push(body);
  for(const type of Object.keys(groups))assert.ok(groups[type].length,`missing catalog group ${type}`);
  const selection=updateLayerSelection(layerPreset('standard'),'dwarf',true);
  const visible=solarOrbitBodies(bodies,selection);
  assert.ok(groups.dwarf.every(b=>visible.some(v=>v.id===b.id)));
  assert.ok(groups.tno.every(b=>visible.some(v=>v.id===b.id)));
  assert.ok(groups.binary.every(b=>!visible.some(v=>v.id===b.id)));
  assert.ok(groups.asteroid.every(b=>!visible.some(v=>v.id===b.id)));
  // The detail header continues to read the original type vocabulary, not a filter label.
  const detailSource=await read('src/ui/object-details.js');
  assert.match(detailSource,/\$\('detail-type'\)\.textContent=\(TYPES\[b\.type\]\?\.label\|\|'Himmelskörper'\)\.toUpperCase\(\)/);
  assert.equal(TYPES.binary.label,'Doppelasteroid');
  assert.equal(TYPES.tno.label,'Transneptunisches Objekt');
  assert.notEqual(CATEGORY_COLORS.binary,CATEGORY_COLORS.asteroid);
  assert.notEqual(CATEGORY_COLORS.tno,CATEGORY_COLORS.dwarf);
  assert.ok(groups.binary.every(b=>b.type==='binary'));
  assert.ok(groups.tno.every(b=>b.type==='tno'));
});

test('v90: grouped panel mirrors availability and indicates a legacy half-selected pair',async()=>{
  const source=await read('src/ui/layer-panel.js');
  const functionBody=source.slice(source.indexOf('export function syncLayers(){'),source.indexOf('export function setLayerPopover(open){'))
    .replace('export function syncLayers(){','function syncLayers(){');
  const makeEl=type=>({
    dataset:{layerType:type},parentElement:{hidden:false,style:{setProperty(){}}},disabled:false,checked:false,indeterminate:false
  });
  const controls=LAYER_FILTER_TYPES.map(makeEl);
  const refs=new Map();
  const $=id=>{
    if(!refs.has(id))refs.set(id,{setAttribute(){},title:'',classList:{toggle(){}},dataset:{}});
    return refs.get(id);
  };
  const renderer={planetId:null};
  const selected={mode:'custom',types:new Set(['star','planet','dwarf'])}; // old split state
  const S={bodies:[],settings:{layers:selected}};
  const document={querySelectorAll(query){
    if(query==='[data-layer-type]')return controls;
    if(query==='[data-layer-preset]')return [];
    return [];
  }};
  const ctx=vm.createContext({$,S,renderer,document,CATEGORY_COLORS,
    LAYER_FILTER_TYPES,layerFilterMembers,availableLayerTypes,layerEnabled,layerSummary,
    displayMatchesPreset,activeView:()=>renderer.planetId?'planet':'solar',syncToggleState:()=>{},
    syncLayerPanelMode:()=>{}});
  vm.runInContext(functionBody,ctx);
  vm.runInContext('syncLayers()',ctx);
  const dwarf=controls.find(i=>i.dataset.layerType==='dwarf');
  const asteroid=controls.find(i=>i.dataset.layerType==='asteroid');
  assert.equal(dwarf.checked,false);
  assert.equal(dwarf.indeterminate,true);
  assert.equal(asteroid.checked,false);
  assert.equal(asteroid.indeterminate,false);
  // Only a dwarf is present in an isolated scene. This group is available
  // and checked for that scene even if a hidden TNO remains deselected.
  renderer.planetId='pluto';
  S.bodies=[{id:'pluto',type:'dwarf'}];
  vm.runInContext('syncLayers()',ctx);
  assert.equal(dwarf.checked,true);
  assert.equal(dwarf.indeterminate,false);
  assert.equal(dwarf.parentElement.hidden,false);
  assert.equal(asteroid.parentElement.hidden,true);
});
