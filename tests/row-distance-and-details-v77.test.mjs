import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {createViewSettings,layerPreset} from '../src/data/layers.js';
import {orderedRowBodies} from '../src/renderer/transitions.js';
import {cinemaPoseAt} from '../src/renderer/cinema.js';
import {AU_KM} from '../src/data/bodies.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const body=id=>INITIAL_BODIES.find(b=>b.id===id);
const time=Date.UTC(2026,10,19);
function setup(ids,view='solar'){
 const r=Object.create(SolarRenderer.prototype);
 r.settings=createViewSettings(view);r.settings.row=true;r.settings.scaleObjects=true;
 r.settings.scaleOrbits=false;r.settings.layers=layerPreset('all',view);r.settings.fourMoons=false;
 r.planetId=view==='planet'?'earth':null;
 r.bodies=ids.map(id=>typeof id==='string'?body(id):id).filter(Boolean);
 r.byId=new Map(r.bodies.map(b=>[b.id,b]));r.fourMoonIds=new Set();
 r.width=1080;r.height=730;r.positions=new Map();r.overrides=new Map();r.simTime=time;
 r.camera={theta:0,phi:1.5,dist:10,desiredDist:10,target:[0,0,0],desiredTarget:[0,0,0]};
 r.followEnabled=false;r.focusedBodyId=null;r.selectedId='earth';r.cameraManuallyMoved=false;
 r.transitionsEnabled=true;r.transition=null;r.cinema=null;r._cinemaRestoreFocus=null;
 r.heldArrows=new Set();r.callbacks={};r.calcPositions(time);
 return r;
}

test('v77: rows use only the view center and direct children, across all category layers',()=>{
 const moon=body('moon');const phobos=body('phobos');
 assert.equal(moon.parentId,'earth');assert.equal(phobos.parentId,'mars');
 const r=setup(['sun','earth','mars','jupiter','moon','phobos']);
 assert.deepEqual(new Set(r.rowGeometry().ids),new Set(['sun','earth','mars','jupiter']));
 assert.equal(r.shouldDraw(moon),false);
 assert.equal(r.shouldDraw(phobos),false);
 assert.equal(r.positions.has('moon'),true,'orbital positions can remain cached');
 assert.equal(r.visibleSceneBodies().some(b=>b.id==='moon'),false,'cached moon is not rendered in the row');
 r.settings.row=false;
 assert.equal(r.shouldDraw(moon),true,'turning off Reihe restores ordinary layer visibility');
 const child={...moon,id:'nested',name:'Nested orbiter',parentId:'moon',radiusKm:4,a:100,periodDays:8};
 const local=setup(['earth','moon',child],'planet');
 assert.deepEqual(local.rowGeometry().ids,['earth','moon']);
 assert.equal(local.shouldDraw(child),false);
});

test('v77: invalid and unknown radii do not render or consume Cinema stops',()=>{
 const mars=body('mars');
 const missing=[{...mars,id:'radius-zero',radiusKm:0},
  {...mars,id:'radius-null',radiusKm:null},
  {...mars,id:'radius-nan',radiusKm:NaN},
  {...mars,id:'radius-missing',radiusKm:undefined}];
 const r=setup(['sun','earth','mars',...missing]);
 for(const unknown of missing){
  assert.equal(r.shouldDraw(unknown),false,unknown.id);
  assert.equal(r.rowGeometry().ids.includes(unknown.id),false,unknown.id);
 }
 assert.equal(r.startCinema(100),true);
 assert.deepEqual(new Set(r.cinema.track.ids),new Set(['sun','earth','mars']));
 assert.equal(r.cinema.track.frames.length,3,'only visible bodies create holds');
 assert.equal(r.cinema.track.durationMs,3*1500+2*1300);
 r.stopCinema(200);
});

test('v77: distance mode uses mean parent distance, center first, null last, and normalized units',()=>{
 const bodies=[
  {id:'center',parentId:null,radiusKm:100},
  {id:'far',parentId:'sun',radiusKm:12,a:4,meanDistanceToParent:3},
  {id:'near',parentId:'sun',radiusKm:5,a:1.5,meanDistanceToParent:1},
  {id:'unknown',parentId:'sun',radiusKm:2,a:0},
  {id:'km',parentId:'sun',radiusKm:9,a:100,meanDistanceToParent:AU_KM*2,meanDistanceUnit:'km'},
 ];
 assert.deepEqual(orderedRowBodies(bodies,'distance').map(b=>b.id),['center','near','km','far','unknown']);
 const r=setup(['sun','earth','mars','jupiter']);
 r.settings.rowOrder='distance';
 r.calcPositions(time);
 const ids=r.rowGeometry().ids;
 assert.equal(ids[0],'sun');
 assert.ok(ids.indexOf('earth')<ids.indexOf('mars'));
 assert.ok(ids.indexOf('mars')<ids.indexOf('jupiter'));
 assert.deepEqual(ids.map(id=>r.positions.get(id)[0]),ids.map(id=>r.positions.get(id)[0]).sort((a,b)=>a-b));
 const local=setup(['earth','moon'],'planet');local.settings.rowOrder='distance';
 assert.deepEqual(local.rowGeometry().ids,['earth','moon']);
});

test('v77: Cinema in distance mode retains layout before, during and after tour, moving left to right',()=>{
 const r=setup(['sun','earth','mars','jupiter']);r.settings.rowOrder='distance';r.calcPositions(time);
 const initialOrder=r.rowGeometry().ids,initialXs=initialOrder.map(id=>r.positions.get(id)[0]);
 assert.equal(r.startCinema(100),true);
 assert.equal(r.cinema.reorder,false);
 assert.deepEqual(r.rowGeometry().ids,initialOrder);
 assert.deepEqual(initialOrder.map(id=>r.positions.get(id)[0]),initialXs);
 const t=r.cinema.track;
 assert.deepEqual(t.ids,initialOrder);
 for(let i=1;i<=100;i++){
  assert.ok(cinemaPoseAt(t,i/100).target[0]>=cinemaPoseAt(t,(i-1)/100).target[0]);
 }
 r.seekCinema(.72,230);
 assert.deepEqual(r.rowGeometry().ids,initialOrder);
 r.stopCinema(500);
 assert.deepEqual(r.rowGeometry().ids,initialOrder);
 const size=setup(['sun','earth','mars','jupiter']);
 const sizeOrder=size.rowGeometry().ids;
 size.startCinema(100);
 assert.notDeepEqual(size.rowGeometry().ids,sizeOrder,'legacy size Cinema still reorders');
 size.stopCinema(500);
 assert.deepEqual(size.rowGeometry().ids,sizeOrder);
});

test('v77: half-column temperature and switched tabs have correct markup and keyboard order',async()=>{
 const html=await read('index.html'),css=await read('css/styles.css'),handlers=await read('src/ui/event-handlers.js');
 const tabs=html.slice(html.indexOf('class="detail-tabs"'),html.indexOf('id="detail-wissen"'));
 assert.ok(tabs.indexOf('id="detail-tab-daten"')<tabs.indexOf('id="detail-tab-wissen"'));
 assert.match(handlers,/e\.key==='Home'\?'daten':e\.key==='End'\?'wissen'/);
 assert.match(css,/\.stat-temperature\{grid-column:auto;/);
 assert.match(css,/\.temperature-values\.has-extremes\{display:grid;grid-template-columns:minmax\(0,\.84fr\) minmax\(0,1\.16fr\)/);
 assert.match(css,/#orbit-row-btn\[data-row-mode="distance"\] \.row-icon-distance\{display:block\}/);
 assert.match(html,/class="row-order-icon row-icon-distance"/);
});
