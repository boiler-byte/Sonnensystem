import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {followMotionTooFast} from '../src/renderer/camera.js';
import {renderDetail} from '../src/ui/object-details.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readProjectSource(path);
const makeRenderer=()=>{
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  renderer.byId=new Map(INITIAL_BODIES.map(b=>[b.id,b]));
  renderer.selectedId='earth';renderer.planetId=null;renderer.simTime=Date.UTC(2026,10,17);
  renderer.width=900;renderer.height=700;renderer.positions=new Map([['earth',[1,0,0]],['mars',[4,0,0]]]);
  renderer.focusedBodyId=null;renderer.followEnabled=false;renderer.followedBodyId=null;
  renderer.followLastPosition=null;renderer.followLastAtMs=null;
  renderer.cameraManuallyMoved=false;renderer.focusOffsetY=0;
  const changes=[];renderer.callbacks={onFollowChange:id=>changes.push(id)};
  renderer.calcPositions=()=>{};
  return {renderer,changes};
};

test('v59: 155px layer popover, 120px time popover, existing range height intact',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:155px/);
  assert.match(css,/\.viewport>\.control-panel \.time-panel \.speed-popover\{width:120px;min-width:120px/);
  assert.match(css,/\.vertical-speed-control #speed\{[\s\S]*?width:182px;min-width:182px/);
  assert.match(css,/\.speed-slider-rail\{\s*position:relative;width:44px;height:200px/);
});

test('v37: center control is adjacent to planet view, accessible and toggleable',async()=>{
  const html=await read('index.html'),app=await read('src/app.js'),css=await read('css/styles.css');
  const action=html.split('id="detail-scene-actions"')[1].split('<div class="detail-description"')[0];
  assert.match(action,/id="planet-view-btn"[\s\S]*?id="center-object-btn"/);
  assert.match(action,/aria-pressed="true"/);
  assert.match(action,/>Folgen<\/span>/);
  assert.match(css,/\.object-center-btn\.active\{/);
  assert.match(app,/\$\('center-object-btn'\)\.addEventListener\('click'/);
  assert.match(app,/onFollowChange:\(\)=>updateDetail\(\)/);
});

test('v37: tracking centers the object and follows slow frame-by-frame motion',()=>{
  const {renderer:r,changes}=makeRenderer();
  assert.equal(r.follow('earth',0),true);
  assert.equal(r.followedBodyId,'earth');
  assert.deepEqual(r.camera.desiredTarget,[1,0,0]);
  assert.equal(r.focusedBodyId,'earth');
  r.positions.set('earth',[1.2,0,0]);
  r.updateFollowTarget(100);
  assert.equal(r.followedBodyId,'earth');
  assert.deepEqual(r.camera.desiredTarget,[1.2,0,0]);
  r.positions.set('earth',[1.35,0,0]);
  r.updateFollowTarget(200);
  assert.deepEqual(r.camera.desiredTarget,[1.35,0,0]);
  assert.deepEqual(changes,[true]);
  assert.equal(r.follow('earth',250),false,'second click toggles tracking off');
  assert.equal(r.followedBodyId,null);
  assert.deepEqual(changes,[true,false]);
});

test('v38: manual pan stops follow; rotation, zoom and presets retain global toggle',()=>{
  const {renderer:r}=makeRenderer();
  r.follow('earth',0);
  r.panByPixels(5,0);
  assert.equal(r.followEnabled,true,'manual pan keeps the global switch on');
  assert.equal(r.followedBodyId,null,'manual pan suspends steering');
  r.setSelected('earth',{focus:true}); // Explicitly reselect to resume.
  assert.equal(r.followedBodyId,'earth');
  r.markCameraMoved();
  assert.equal(r.followEnabled,true,'manual rotation or zoom keeps global following');
  assert.equal(r.followedBodyId,'earth');
  r.applyCameraPreset(1);
  assert.equal(r.followedBodyId,'earth','camera preset keeps target');
  assert.equal(r.followEnabled,true);
  assert.deepEqual(r.camera.desiredTarget,[1,0,0]);
});

test('v38: changing selection switches the followed target without switching off',()=>{
  const {renderer:r}=makeRenderer();
  r.follow('earth',0);
  r.setSelected('earth',{focus:true});
  assert.equal(r.followedBodyId,'earth');
  r.setSelected('mars',{focus:true});
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'mars');
  assert.equal(r.focusedBodyId,'mars');
  assert.deepEqual(r.camera.desiredTarget,[4,0,0]);
  r.selectedId='earth';r.updateFollowTarget(250);
  assert.equal(r.followedBodyId,null,'direct mutation suspends tracking until explicit selection');
  r.setSelected('earth',{focus:true});
  assert.equal(r.followedBodyId,'earth','explicit selection resumes steering');
  assert.equal(r.followEnabled,true);
});

test('v37: high projected movement speed stops following without moving camera to new position',()=>{
  const {renderer:r,changes}=makeRenderer();
  assert.equal(followMotionTooFast([1,0,0],[1.1,0,0],10,700,100),false);
  assert.equal(followMotionTooFast([1,0,0],[100,0,0],10,700,10),true);
  r.follow('earth',0);
  const target=r.camera.desiredTarget.slice();
  r.positions.set('earth',[100,0,0]);
  r.updateFollowTarget(20);
  assert.equal(r.followedBodyId,null);
  assert.deepEqual(r.camera.desiredTarget,target,'no violent jump to the fast target');
  assert.deepEqual(changes,[true],'high velocity does not toggle off Folgen');
  assert.equal(r.followEnabled,true);
});

test('v37: cannot follow unpositioned spacecraft or lost bodies',()=>{
  const {renderer:r}=makeRenderer();
  assert.equal(r.follow('missing',0),false);
  const probe=INITIAL_BODIES.find(b=>b.type==='probe');
  if(probe) assert.equal(r.follow(probe.id,0),false);
  r.follow('earth',50);
  r.positions.delete('earth');
  r.updateFollowTarget(100);
  assert.equal(r.followedBodyId,null);
});

test('v37: object details reflect follow button for planet, moon, no object and probe',()=>{
  const old=globalThis.document,nodes=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,innerHTML:'',textContent:'',title:'',style:{setProperty(){}},
      attr:{},classList:{toggle(){}},setAttribute(key,value){this.attr[key]=value;},querySelectorAll(){return [];}});
    return nodes.get(id);
  };
  globalThis.document={getElementById:get};
  const {renderer:r}=makeRenderer();r.overrides=new Map();
  const state={bodies:INITIAL_BODIES,selected:'earth'};
  try{
    renderDetail(state,r,()=>{});
    assert.equal(get('detail-scene-actions').hidden,false);
    assert.equal(get('planet-view-actions').hidden,false);
    assert.equal(get('center-object-btn').attr['aria-pressed'],'false');
    r.follow('earth',0);
    renderDetail(state,r,()=>{});
    assert.equal(get('center-object-btn').attr['aria-pressed'],'true');
    state.selected='sun';renderDetail(state,r,()=>{});
    assert.equal(get('center-object-btn').attr['aria-pressed'],'true','toggle is independent of the selected body');
    assert.equal(get('detail-scene-actions').hidden,false);
    assert.equal(get('planet-view-actions').hidden,true,'Sun has no planet view but can be centered');
    state.selected=null;renderDetail(state,r,()=>{});
    assert.equal(get('detail-scene-actions').hidden,true);
    const probe=INITIAL_BODIES.find(b=>b.type==='probe');
    if(probe){state.selected=probe.id;renderDetail(state,r,()=>{});assert.equal(get('detail-scene-actions').hidden,true);}
  }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
