import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {loadCatalog} from '../src/data/catalog.js';
import {probeLocationBody,rendererSelectionId,inheritedProbeLocation,bodyHeliocentricAu} from '../src/data/probe-location.js';
import {createViewSettings,layerEnabled,availableLayerTypes,updateLayerSelection} from '../src/data/layers.js';
import {renderDetail,refreshProbeDistance} from '../src/ui/object-details.js';

const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const catalog=await loadCatalog(async file=>read(file.replace(/^\.\//,'')));
const probes=read('data/catalog/probes.json').objects;
const bodies=[...catalog.bodies,...probes];
const byId=id=>bodies.find(body=>body.id===id);
const mapping={cassini:'saturn',galileo:'jupiter',huygens:'titan'};
const epoch=Date.parse('2026-11-22T00:00:00Z');

test('v142: terminal probes inherit body IDs, model snapshot and Sun distance, not fictitious spacecraft ephemerides',()=>{
 for(const [probeId,targetId] of Object.entries(mapping)){
  const probe=byId(probeId),target=byId(targetId);
  const expected=inheritedProbeLocation(probe,byId,epoch);
  assert.equal(probe.parentId,targetId);
  assert.equal(probe.focusBodyId,targetId);
  assert.equal(probe.terminalLocation.bodyId,targetId);
  assert.equal(probe.lastKnownPosition.sourceBodyId,targetId);
  assert.equal(probe.distanceToSun.sourceBodyId,targetId);
  assert.equal(probe.lastKnownPosition.cartesianJ2000Au,null,'do not mislabel model coords as Horizons J2000');
  assert.equal(probe.lastKnownPosition.epochUtc,'2026-11-22T00:00:00Z');
  assert.equal(probe.distanceToSun.sourceEpochUtc,'2026-11-22T00:00:00Z');
  assert.equal(probe.lastKnownPosition.modelCartesianAu.length,3);
  assert.equal(expected.targetName,target.name);
  for(let i=0;i<3;i++)assert.ok(Math.abs(expected.positionAu[i]-probe.lastKnownPosition.modelCartesianAu[i])<1e-8);
  assert.ok(Math.abs(expected.distanceAu-probe.distanceToSun.au)<1e-8);
  assert.equal(rendererSelectionId(probe,byId),targetId);
  const mission=read('data/mission-flights/'+probeId+'.json');
  assert.equal(mission.terminalLocation.bodyId,targetId);
  assert.equal(mission.trajectory.samples.length,0,'mission chronology is not a fake trajectory');
 }
 for(const name of ['voyager-1','voyager-2','pioneer-10','pioneer-11','new-horizons']){
  assert.equal(probeLocationBody(byId(name),byId),null);
  assert.equal(rendererSelectionId(byId(name),byId),null);
 }
});

test('v142: heliocentric position follows the body, including the Titan->Saturn->Sun parent chain',()=>{
 const a=epoch,b=Date.UTC(2027,2,18);
 for(const id of Object.keys(mapping)){
  const probe=byId(id),target=byId(mapping[id]);
  const atA=inheritedProbeLocation(probe,byId,a);
  const atB=inheritedProbeLocation(probe,byId,b);
  assert.deepEqual(atA.positionAu,bodyHeliocentricAu(target,byId,a));
  assert.deepEqual(atB.positionAu,bodyHeliocentricAu(target,byId,b));
  assert.notDeepEqual(atA.positionAu,atB.positionAu,'dynamic inheritance must not freeze at collection date');
  assert.ok(atA.distanceAu>5 && atA.distanceAu<12);
 }
 assert.equal(inheritedProbeLocation(byId('voyager-1'),byId,a),null);
 assert.equal(bodyHeliocentricAu(byId('titan'),id=>id==='titan'?byId('titan'):null,a),null,'missing parent must fail closed');
});

test('v142: catalog selection of terminal probes focuses target without replacing selected probe',async()=>{
 const source=await readFile(new URL('../src/app/camera-controller.js',import.meta.url),'utf8');
 const start=source.indexOf('export function selectBody('),end=source.indexOf('export function clearSelection()',start);
 const selectSource=source.slice(start,end).replace('export function selectBody','function selectBody');
 for(const [probeId,targetId] of Object.entries(mapping)){
  const selected={selected:null,settings:createViewSettings('solar'),bodies};
  const received=[];
  const renderer={planetId:null,cinema:null,setSelected(id,opts){received.push({id,opts});}};
  const vmContext=vm.createContext({
   S:selected,renderer,byId,probeLocationBody,rendererSelectionId,
   layerEnabled,availableLayerTypes,updateLayerSelection,
   changeLayers(next){selected.settings.layers=next;},
   updateCatalog(){},updateDetail(){},updateMode(){},arMode:null,
   mobileSheets:{open(name){received.push({sheet:name});}}
  });
  vm.runInContext(selectSource,vmContext);
  vm.runInContext(`selectBody('${probeId}',true)`,vmContext);
  assert.equal(selected.selected,probeId,'keep details on the spacecraft');
  assert.equal(received[0].id,targetId,'focus the host body instead');
  assert.equal(received[0].opts.focus,true);
  assert.equal(received[0].opts.zoom,true);
  assert.equal(received[1].sheet,'detail');
  assert.equal(layerEnabled(selected.settings.layers,byId(targetId).type),true);
 }
});

function mockDOM(){
 const elements=new Map();
 const get=id=>{
  if(!elements.has(id))elements.set(id,{
   hidden:false,disabled:false,textContent:'',innerHTML:'',title:'',className:'',
   style:{background:'',setProperty(){}},classList:{add(){},remove(){},toggle(){}},
   attrs:{},setAttribute(k,v){this.attrs[k]=String(v);},
  });
  return elements.get(id);
 };
 return {get,elements,document:{getElementById:get}};
}

test('v142: detail hero enables navigation to the target and shows an inherited Sun distance',()=>{
 const old=globalThis.document;const dom=mockDOM();globalThis.document=dom.document;
 try{
  for(const [probeId,targetId] of Object.entries(mapping)){
   const state={bodies,selected:probeId,time:epoch,search:'',catalogSort:'default',catalogPlanetOnly:false};
   renderDetail(state,{planetId:null},()=>{});
   assert.equal(dom.get('hero-body').disabled,false,'probe illustration should be clickable');
   assert.match(dom.get('hero-body').title,new RegExp(byId(targetId).name));
   assert.match(dom.get('orbit-facts').innerHTML,/Sonnenabstand/);
   assert.match(dom.get('orbit-facts').innerHTML,/Katalogmodell/);
   assert.match(dom.get('orbit-facts').innerHTML,/<b id="probe-sun-distance">[^<]+AE/);
   assert.equal(dom.get('horizons-btn').disabled,true);
   const before=inheritedProbeLocation(byId(probeId),byId,epoch).distanceAu;
   state.time=Date.UTC(2027,0,12);
   // getElementById has a stable standalone element in this fake DOM.
   refreshProbeDistance(state);
   const next=inheritedProbeLocation(byId(probeId),byId,state.time).distanceAu;
   assert.ok(Math.abs(next-before)>.00001);
   assert.ok(dom.get('probe-sun-distance').textContent.includes(' AE'));
  }
 }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});

test('v142: event handler and animation loop retain probe detail selection while focusing/rendering its target',async()=>{
 const events=await readFile(new URL('../src/ui/event-handlers.js',import.meta.url),'utf8');
 const loop=await readFile(new URL('../src/app/animation-loop.js',import.meta.url),'utf8');
 const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(events,/renderer\.toggleDetailZoom\(targetId\)/);
 assert.match(loop,/renderer\.draw\(S\.time,rendererSelectionId\(byId\(S\.selected\),byId\),S\.settings\)/);
 assert.match(loop,/refreshProbeDistance\(S\)/);
 assert.match(sw,/"\.\/src\/data\/probe-location\.js"/);
});
