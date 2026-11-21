import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {S,setRenderer} from '../src/app/state.js';
import {updateRow} from '../src/app/animation-controls.js';
import {createViewSettings} from '../src/data/layers.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

function withRowControls(action){
 const previousDocument=globalThis.document;
 const oldRenderer=S.settings;
 const oldBodies=S.bodies;
 const oldSolar=S.viewSettings.solar;
 const nodes=new Map();
 const element=id=>{
  if(!nodes.has(id))nodes.set(id,{
   hidden:false,disabled:false,value:'0',textContent:'',title:'',
   classList:{toggle(){},add(){},remove(){}},
   setAttribute(name,value){this[name]=value},
  });
  return nodes.get(id);
 };
 globalThis.document={getElementById:element,querySelectorAll:()=>[]};
 S.viewSettings.solar=createViewSettings('solar');
 S.settings=S.viewSettings.solar;
 S.settings.scaleObjects=true;
 S.bodies=INITIAL_BODIES;
 const renderer={
  settings:S.settings,
  cinema:null,planetId:null,
  camera:{theta:.63,phi:.99,desiredTarget:[7,0,0],desiredDist:17},
  cameraPresetIndex:0,cameraManuallyMoved:true,
  followedBodyId:null,focusedBodyId:null,followEnabled:true,
  callbacks:{onCameraChange(){}},
  beginTransition(){},calcPositions(){},
  rowFrame:()=>({target:[3,0,0],distance:13}),rowDistance:()=>13,
  solarOverviewDistance:()=>47,
  setCameraAngles(theta,phi){this.camera.theta=theta;this.camera.phi=phi},
  followSelectedBody(){this.followCalls++;this.camera.desiredTarget=[1,0,0];this.camera.desiredDist=6;return true},
  followCalls:0,
 };
 setRenderer(renderer);
 try{return action(renderer)}finally{
  setRenderer(null);S.settings=oldRenderer;S.viewSettings.solar=oldSolar;S.bodies=oldBodies;
  if(previousDocument===undefined)delete globalThis.document;
  else globalThis.document=previousDocument;
 }
}

test('v115: row entry frames the complete row without reactivating suspended follow',()=>withRowControls(r=>{
 updateRow();
 assert.equal(S.settings.row,true);
 assert.equal(r.followCalls,0,'no implicit restart while Folgen toggle remains on');
 assert.equal(r.followEnabled,true,'global switch stays on');
 assert.deepEqual(r.camera.desiredTarget,[3,0,0]);
 assert.equal(r.camera.desiredDist,13);
 assert.deepEqual([r.camera.theta,r.camera.phi],[0,1.5]);
 // v113 after stopping tracking framed the row identically; v114 accidentally
 // resumed following the selection and replaced this camera target and zoom.
 updateRow();
 assert.equal(S.settings.rowOrder,'distance');
 assert.equal(r.followCalls,0,'switching row order cannot reactivate an interrupted follow');
 updateRow();
 assert.equal(S.settings.row,false);
 assert.equal(r.followCalls,0);
 assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
 assert.equal(r.camera.desiredDist,47);
 assert.deepEqual([r.camera.theta,r.camera.phi],[.63,.99]);
}));

test('v115: an already tracked object remains tracked when changing row mode',()=>withRowControls(r=>{
 r.followedBodyId='earth';
 updateRow();
 assert.equal(r.followCalls,1);
 assert.equal(r.followEnabled,true);
 assert.deepEqual(r.camera.desiredTarget,[1,0,0]);
 assert.equal(r.camera.desiredDist,6);
}));

test('v115: catalog refresh cannot silently re-enable suspended tracking',()=>{
 const r=Object.create(SolarRenderer.prototype);
 r.bodies=[];r.planetId=null;r.followEnabled=true;r.followedBodyId=null;
 r.selectedId='earth';r.callbacks={};
 r.followCalls=0;
 r.followSelectedBody=()=>{r.followCalls++};
 r.setBodies(INITIAL_BODIES);
 assert.equal(r.followCalls,1,'initial catalog still establishes default following');
 r.followedBodyId=null;
 r.setBodies(INITIAL_BODIES);
 assert.equal(r.followCalls,1,'subsequent catalog merge cannot restart suspended tracking');
 r.followedBodyId='earth';
 r.setBodies(INITIAL_BODIES);
 assert.equal(r.followCalls,2,'live target gets position refresh from updated catalog');
});

test('v115: planet-scene and overview transitions do not resume a suspended camera follow',()=>{
 const r=Object.create(SolarRenderer.prototype);
 r.byId=new Map(INITIAL_BODIES.map(body=>[body.id,body]));
 r.settings={row:false};r.planetId=null;r.transitionsEnabled=false;
 r.camera={theta:.63,phi:.99,target:[0,0,0],dist:47,desiredTarget:[0,0,0],desiredDist:47};
 r.followEnabled=true;r.followedBodyId=null;r.callbacks={};
 r.followCalls=0;r.followSelectedBody=()=>{r.followCalls++};
 r.canAnimateLayout=()=>false;r.markCameraMoved=()=>{};r.calcPositions=()=>{};
 r.planetFrameDistance=()=>13;r.solarOverviewDistance=()=>47;
 r.setCameraAngles=()=>{};r.applyCameraPreset=()=>{};
 assert.equal(r.showPlanetSystem('earth'),true);
 assert.equal(r.followCalls,0);
 r.reset();
 assert.equal(r.followCalls,0);
 r.followedBodyId='earth';
 r.showPlanetSystem('earth');
 assert.equal(r.followCalls,1);
 r.reset();
 assert.equal(r.followCalls,2);
});

test('v115: v114 rendering pick, hero zoom, contrast toggle and row button placement stay intact',async()=>{
 const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
 const [runtime,html,display,sw]=await Promise.all([
  read('src/app/runtime.js'),read('index.html'),read('src/ui/display-controls.js'),read('sw.js')
 ]);
 assert.match(runtime,/onSelect:id=>selectBody\(id,true,\{zoom:renderer\?\.settings\?\.row===true\}\)/);
 assert.match(html,/id="hero-body" class="hero-body" type="button"[^>]*disabled/); // v117: no startup selection
 assert.ok(html.indexOf('id="orbit-row-btn"')<html.indexOf('id="scale-objects-btn"'));
 assert.match(html,/id="orbit-contrast-btn"/);
 assert.match(display,/export function syncContrastControl\(/);
 const version=JSON.parse(await read('package.json')).version.split('.')[0];
 assert.match(sw,new RegExp(`const CACHE_NAME='sonnensystem-shell-v${version}'`));
});
