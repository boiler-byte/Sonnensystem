import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {S,setRenderer} from '../src/app/state.js';
import {syncRowControl,syncCinemaControl} from '../src/app/animation-controls.js';
import {createViewSettings,layerPreset} from '../src/data/layers.js';
import {displayBodyRadius,displayOrbitRadius,orbitScaleActive} from '../src/data/orbital-math.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const body=id=>INITIAL_BODIES.find(item=>item.id===id);
const TIME=Date.UTC(2026,10,21);

function withControls(action){
 const previousDocument=globalThis.document;
 const previousSettings=S.settings;
 const previousViews={solar:S.viewSettings.solar,planet:S.viewSettings.planet};
 const nodes=new Map();
 const el=id=>{
  if(!nodes.has(id)){
   const classes=new Set();
   nodes.set(id,{
    id,hidden:false,disabled:false,value:'0',title:'',attributes:{},classes,
    setAttribute(name,value){this.attributes[name]=String(value);},
    classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name);}}
   });
  }
  return nodes.get(id);
 };
 globalThis.document={getElementById:el};
 S.viewSettings.solar=createViewSettings('solar');
 S.viewSettings.planet=createViewSettings('planet');
 S.settings=S.viewSettings.solar;
 const renderer={cinema:null};
 setRenderer(renderer);
 try{return action({el,renderer});}finally{
  setRenderer(null);
  S.settings=previousSettings;
  S.viewSettings.solar=previousViews.solar;
  S.viewSettings.planet=previousViews.planet;
  if(previousDocument===undefined)delete globalThis.document;
  else globalThis.document=previousDocument;
 }
}

test('v118: Bahn hides only during both row modes; its value is preserved when returning',()=>withControls(({el})=>{
 S.settings.scaleOrbits=true;
 syncRowControl();syncCinemaControl();
 assert.equal(el('scale-orbits-btn').hidden,false);
 assert.equal(el('cinema-btn').hidden,true);
 assert.equal(el('time-panel').hidden,false);
 assert.equal(el('orbit-row-btn').attributes['data-row-mode'],'off');
 for(const mode of ['size','distance']){
  S.settings.row=true;S.settings.rowOrder=mode;
  syncRowControl();syncCinemaControl();
  assert.equal(el('scale-orbits-btn').hidden,true,`${mode}: Bahn must hide`);
  assert.equal(el('time-panel').hidden,true,`${mode}: keep row timeline layout`);
  assert.equal(el('cinema-btn').hidden,false,`${mode}: Cinema Play must show`);
  assert.equal(el('orbit-row-btn').attributes['data-row-mode'],mode);
  assert.equal(S.settings.scaleOrbits,true,`${mode}: saved Bahn scale remains on`);
 }
 S.settings.row=false;
 syncRowControl();syncCinemaControl();
 assert.equal(el('scale-orbits-btn').hidden,false);
 assert.equal(el('cinema-btn').hidden,true);
 assert.equal(S.settings.scaleOrbits,true);
}));

test('v118: Cinema Play remains visible when Objekt is off or Bahn was on',()=>withControls(({el,renderer})=>{
 S.settings.row=true;
 for(const scaleObjects of [false,true])for(const scaleOrbits of [false,true]){
  S.settings.scaleObjects=scaleObjects;
  S.settings.scaleOrbits=scaleOrbits;
  for(const rowOrder of ['size','distance']){
   S.settings.rowOrder=rowOrder;
   syncRowControl();syncCinemaControl();
   assert.equal(el('cinema-btn').hidden,false);
   assert.equal(el('cinema-timeline').hidden,true);
   assert.equal(el('scale-orbits-btn').hidden,true);
  }
 }
 renderer.cinema={active:true,paused:false,speed:1};
 syncCinemaControl();
 assert.equal(el('cinema-btn').hidden,false);
 assert.equal(el('cinema-timeline').hidden,false);
 renderer.cinema=null;
 syncCinemaControl();
 assert.equal(el('cinema-timeline').hidden,true);
}));

function rowRenderer(view){
 const r=Object.create(SolarRenderer.prototype);
 r.settings=createViewSettings(view);
 r.settings.row=true;
 r.settings.layers=layerPreset('all',view);
 r.settings.fourMoons=false;
 r.settings.rowOrder='size';
 r.planetId=view==='planet'?'earth':null;
 r.bodies=(view==='planet'?['earth','moon']:['sun','mercury','earth','mars','jupiter','saturn']).map(body);
 r.byId=new Map(r.bodies.map(b=>[b.id,b]));
 r.width=1080;r.height=720;
 r.fourMoonIds=new Set();r.positions=new Map();r.overrides=new Map();r.simTime=TIME;
 r.camera={theta:0,phi:1.5,dist:10,desiredDist:10,target:[0,0,0],desiredTarget:[0,0,0]};
 r.followEnabled=false;r.focusedBodyId=null;r.selectedId=null;r.cameraManuallyMoved=false;
 r.transition=null;r.cinema=null;r.heldArrows=new Set();r.callbacks={};r.transitionsEnabled=true;
 return r;
}

function layoutSnapshot(r){
 r.calcPositions(TIME);
 const layout=r.rowGeometry();
 return {ids:layout.ids,
  positions:layout.ids.map(id=>[id,layout.positions.get(id)]),
  radii:layout.ids.map(id=>[id,layout.radii.get(id)]),
  footprints:layout.ids.map(id=>[id,layout.footprints.get(id)]),
  // Also test the underlying simulation positions, not only the row layout.
  computed:[...r.positions].sort(([a],[b])=>a.localeCompare(b)),
  camera:r.rowFrame()};
}

test('v118: Bahn has no geometric effect on either row order in solar/planet views',()=>{
 for(const view of ['solar','planet'])for(const scaleObjects of [false,true])for(const rowOrder of ['size','distance']){
  const r=rowRenderer(view);
  r.settings.scaleObjects=scaleObjects;
  r.settings.rowOrder=rowOrder;
  r.settings.scaleOrbits=false;
  const expected=layoutSnapshot(r);
  r.settings.scaleOrbits=true;
  assert.deepEqual(layoutSnapshot(r),expected,`${view}/${rowOrder}/Objekt ${scaleObjects}`);
  assert.equal(orbitScaleActive(r.settings),false);
 }
});

test('v118: Bahn still affects normal view and no remembered settings are changed',()=>{
 const sun=body('sun'),earth=body('earth');
 const normal={row:false,scaleObjects:false,scaleOrbits:false};
 const row={...normal,row:true};
 assert.equal(orbitScaleActive(normal),false);
 assert.equal(orbitScaleActive({...normal,scaleOrbits:true}),true);
 assert.notEqual(displayOrbitRadius(earth,sun,normal),displayOrbitRadius(earth,sun,{...normal,scaleOrbits:true}));
 assert.notEqual(displayBodyRadius(sun,normal),displayBodyRadius(sun,{...normal,scaleOrbits:true}));
 assert.equal(displayOrbitRadius(earth,sun,row),displayOrbitRadius(earth,sun,{...row,scaleOrbits:true}));
 assert.equal(displayBodyRadius(sun,row),displayBodyRadius(sun,{...row,scaleOrbits:true}));
});

test('v118: row-button colors map size to green, distance to blue; hidden Bahn stays hidden in CSS',async()=>{
 const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
 assert.match(css,/#scale-orbits-btn\[hidden\]\{display:none!important\}/);
 const green=css.match(/#orbit-row-btn\[data-row-mode="size"\]\{([^}]+)\}/)?.[1];
 const blue=css.match(/#orbit-row-btn\[data-row-mode="distance"\]\{([^}]+)\}/)?.[1];
 assert.ok(green && blue);
 assert.match(green,/background:#173d2d/);
 assert.match(blue,/background:#153654/);
 assert.match(green,/border-color:#399873/);
 assert.match(blue,/border-color:#428ecf/);
 assert.notEqual(green,blue);
 assert.doesNotMatch(css,/#orbit-row-btn\[data-row-mode="off"\]/);
});
