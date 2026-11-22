import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {SolarRenderer} from '../src/renderer/index.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
function makeRenderer({planetId=null,row=false}={}){
  const r=Object.create(SolarRenderer.prototype);
  r.byId=new Map(INITIAL_BODIES.map(body=>[body.id,body]));
  r.planetId=planetId;r.settings={row,scaleObjects:false};r.simTime=Date.UTC(2026,10,21);
  r.width=1100;r.height=760;r.transitionsEnabled=false;r.transition=null;
  r.followEnabled=true;r.selectedId=planetId?'moon':'earth';r.followedBodyId=r.selectedId;
  r.followLastAtMs=100;r.followLastPosition=[1,0,0];r.focusedBodyId=r.selectedId;
  r.cameraManuallyMoved=true;r.cameraPresetIndex=2;
  r.camera={theta:1.9,phi:1.54,target:[8,0,0],desiredTarget:[1,0,0],dist:8,desiredDist:8,
    freeLook:{theta:1.9,phi:1.54,forward:[0,0,-1],up:[0,1,0]}};
  r.positions=new Map([[r.selectedId,[100,0,0]]]);
  r.calcPositions=()=>{};
  r.solarOverviewDistance=()=>47;r.planetFrameDistance=()=>18;
  r.rowFrame=()=>({target:[7,0,0],distance:26});r.rowDistance=()=>26;
  let changed=0;
  r.callbacks={onCameraChange(){changed++;}};
  return {r,get changed(){return changed;}};
}

test('v128: speed cutoff resets to oblique solar overview, preserving selection and permanent follow mode',()=>{
  const f=makeRenderer(),r=f.r;
  r.updateFollowTarget(110);
  assert.equal(r.followEnabled,true);
  assert.equal(r.selectedId,'earth','the details keep showing the selected body');
  assert.equal(r.followedBodyId,null,'tracking remains suspended');
  assert.equal(r.focusedBodyId,null);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  assert.equal(r.camera.desiredDist,47);
  assert.deepEqual([r.camera.theta,r.camera.phi],[.63,.99]);
  assert.equal(r.cameraPresetIndex,0);
  assert.equal(r.cameraManuallyMoved,false);
  assert.equal(r.camera.freeLook,null);
  assert.equal(f.changed,1,'perspective icon is refreshed');
  r.updateFollowTarget(120);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0], 'suspended target does not reengage on its own');
  r.positions.set('earth',[3,0,0]);
  r.setSelected('earth',{focus:true,zoom:false});
  assert.equal(r.followedBodyId,'earth','a deliberate reselection follows again');
  assert.deepEqual(r.camera.desiredTarget,[3,0,0]);
});

test('v128: speed cutoff keeps planet scene but returns to its local oblique view',()=>{
  const {r}=makeRenderer({planetId:'earth'});
  r.updateFollowTarget(110);
  assert.equal(r.planetId,'earth');
  assert.equal(r.selectedId,'moon');
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,null);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  assert.equal(r.camera.desiredDist,18);
  assert.deepEqual([r.camera.theta,r.camera.phi],[.63,.84]);
});

test('v128: row speed cutoff frames the row in an oblique view, not its old side-on pose',()=>{
  const {r}=makeRenderer({row:true});
  r.updateFollowTarget(110);
  assert.deepEqual(r.camera.desiredTarget,[7,0,0]);
  assert.equal(r.camera.desiredDist,26);
  assert.deepEqual([r.camera.theta,r.camera.phi],[.63,.99]);
  assert.equal(r.cameraPresetIndex,0);
});

test('v128: planet back action clears UI selection before reset and sets solar oblique view after mode change',async()=>{
  const source=await read('src/ui/event-handlers.js');
  const start=source.indexOf("  $('back-to-solar').addEventListener('click',()=>{");
  const end=source.indexOf("  $('reset-camera').addEventListener",start);
  assert.ok(start>=0 && end>start);
  const calls=[],listeners=new Map(),S={selected:'moon'};
  const renderer={planetId:'earth',selectedId:'moon',followedBodyId:'moon',camera:{theta:1.54,phi:1.54},
    reset(){assert.equal(S.selected,null);assert.equal(this.selectedId,null);calls.push('reset');this.planetId=null;},
    setSelected(id){this.selectedId=id;this.followedBodyId=null;},
    returnToStandardCamera(){calls.push('oblique');this.camera.theta=.63;this.camera.phi=.99;}};
  const arMode={active:true,alignToPerspective(){calls.push('align');}};
  const mobileSheets={close(){calls.push('close');}};
  const $=id=>({addEventListener:(_event,cb)=>listeners.set(id,cb)});
  const clearSelection=()=>{calls.push('clear');S.selected=null;renderer.setSelected(null);};
  const context=vm.createContext({$,renderer,S,arMode,mobileSheets,clearSelection,byId:id=>({id,parentId:'sun'}),updateMode(){calls.push('mode');}});
  vm.runInContext(source.slice(start,end),context);
  listeners.get('back-to-solar')();
  assert.deepEqual(calls,['clear','reset','mode','oblique','align','close']);
  assert.equal(S.selected,null);
  assert.equal(renderer.selectedId,null);
  assert.equal(renderer.followedBodyId,null);
  assert.deepEqual([renderer.camera.theta,renderer.camera.phi],[.63,.99]);
  calls.length=0;listeners.get('back-to-solar')();
  assert.deepEqual(calls,[],'in the solar view, the back button is inert');
});

test('v128: detail UI has no follow toggle, and only valid planet actions get an action row',async()=>{
  const [html,detail,handlers,css]=await Promise.all([
    read('index.html'),read('src/ui/object-details.js'),read('src/ui/event-handlers.js'),read('css/styles.css')]);
  assert.doesNotMatch(html,/id="center-object-btn"|>Folgen<\/span>/);
  assert.doesNotMatch(handlers,/center-object-btn/);
  assert.doesNotMatch(detail,/center-object-btn|Folgen ausschalten/);
  assert.doesNotMatch(css,/\.object-center-btn/);
  assert.match(detail,/\$\('detail-scene-actions'\)\.hidden=!enabled/);
});
