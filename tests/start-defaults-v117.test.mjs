import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {S} from '../src/app/state.js';
import {selectionAfterCatalogLoad} from '../src/app/runtime.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {CAMERA_PERSPECTIVES} from '../src/renderer/camera.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('v117: start with no selection and do not auto-select the first catalog body',()=>{
  assert.equal(S.selected,null,'the app state has no default selected object');
  assert.equal(selectionAfterCatalogLoad(null,INITIAL_BODIES),null);
  assert.equal(selectionAfterCatalogLoad(null,[]),null);
  assert.equal(selectionAfterCatalogLoad('earth',INITIAL_BODIES),'earth','existing valid selection is retained');
  assert.equal(selectionAfterCatalogLoad('missing',INITIAL_BODIES),INITIAL_BODIES[0].id,'invalid nonempty values preserve fallback');
  assert.equal(selectionAfterCatalogLoad('missing',[]),null,'empty catalog has no selection');
});

test('v117: the renderer has no initial selection; Folgen remains on without a target',async()=>{
  const source=await read('src/renderer/renderer.js');
  assert.match(source,/this\.selectedId=null;this\.settings=/,'renderer constructor must begin unselected');
  assert.match(source,/this\.camera=\{theta:\.63,phi:\.99,dist:47/,'oblique startup camera is unchanged');
  assert.match(source,/this\.cameraPresetIndex=0;this\.cameraManuallyMoved=false/);
  assert.equal(CAMERA_PERSPECTIVES[0].id,'oblique');
  assert.equal(CAMERA_PERSPECTIVES[0].name,'Schräg/oben');
  const r=Object.create(SolarRenderer.prototype);
  r.bodies=[];r.byId=new Map();r.planetId=null;r.selectedId=null;r.followEnabled=true;
  r.followedBodyId=null;r.focusedBodyId=null;r.followLastPosition=null;r.followLastAtMs=null;
  r.camera={desiredTarget:[0,0,0],desiredDist:47};r.simTime=0;
  r.positions=new Map([['earth',[1,2,3]]]);
  r.calcPositions=()=>{};r.focus=id=>{r.focusedBodyId=id;};
  let followAttempts=0;
  const followSelectedBody=r.followSelectedBody.bind(r);
  r.followSelectedBody=(...args)=>{followAttempts++;return followSelectedBody(...args);};
  r.setBodies(INITIAL_BODIES);
  assert.equal(followAttempts,0,'no implicit tracking attempt while selection is empty');
  assert.equal(r.selectedId,null,'loading the catalog does not select a body');
  assert.equal(r.followEnabled,true,'the unchanged global follow toggle remains enabled');
  assert.equal(r.followedBodyId,null,'no selected object means no tracking target');
  assert.deepEqual(r.camera.desiredTarget,[0,0,0],'no unintended camera shift');
  r.setSelected('earth',{focus:false});
  assert.equal(r.followedBodyId,'earth','explicit selection starts following again');
  assert.deepEqual(r.camera.desiredTarget,[1,2,3]);
});

test('v117: catalog tab is the default on desktop and mobile; empty details are neutral',async()=>{
  const [html,sheets]=await Promise.all([read('index.html'),read('src/ui/bottom-sheet.js')]);
  assert.match(html,/id="sidebar-tab-catalog" class="sidebar-tab active"[^>]*aria-selected="true"/);
  assert.match(html,/id="sidebar-tab-detail" class="sidebar-tab"[^>]*aria-selected="false"/);
  assert.match(html,/id="catalog" role="tabpanel"[^>]*>/);
  assert.match(html,/id="detail" role="tabpanel"[^>]*hidden>/);
  assert.match(html,/id="sheet-tab-catalog"[^>]*aria-selected="true"/);
  assert.match(html,/id="sheet-tab-detail"[^>]*aria-selected="false"/);
  assert.match(sheets,/let panel='catalog', snap='closed'/);
  assert.match(sheets,/showPanel\(panel\)/);
  assert.match(html,/id="detail-name"[^>]*>Kein Objekt ausgewählt</);
  assert.match(html,/id="hero-body"[^>]*disabled>/);
  assert.match(html,/id="detail-type">KEINE AUSWAHL</);
});

test('v117: the oblique camera preset is selected before scene setup',async()=>{
  const html=await read('index.html');
  assert.match(html,/id="reset-camera"[^>]*data-current-perspective="oblique" data-next-perspective="topdown"/);
  assert.match(html,/data-perspective="oblique"[^>]*><g transform="rotate\(142 12 12\)"/);
  assert.match(html,/data-perspective="topdown"[^>]*hidden/);
  assert.match(html,/data-perspective="side"[^>]*hidden/);
});
