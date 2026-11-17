import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {attachCameraControls} from '../src/renderer/controls.js';
import {renderDetail} from '../src/ui/object-details.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const makeRenderer=()=>{
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  renderer.byId=new Map(INITIAL_BODIES.map(body=>[body.id,body]));
  renderer.selectedId='earth';renderer.planetId=null;renderer.simTime=Date.UTC(2026,10,18);
  renderer.width=900;renderer.height=700;
  renderer.positions=new Map([['earth',[1,0,0]],['mars',[4,0,0]],['sun',[0,0,0]],['moon',[1.2,0,0]]]);
  renderer.focusedBodyId=null;renderer.followEnabled=false;renderer.followedBodyId=null;
  renderer.followLastPosition=null;renderer.followLastAtMs=null;
  renderer.cameraManuallyMoved=false;renderer.cameraPresetIndex=0;renderer.focusOffsetY=0;
  const changes=[];renderer.callbacks={onFollowChange:enabled=>changes.push(enabled)};
  renderer.calcPositions=()=>{};
  return {renderer,changes};
};

test('v38: planet button shows only Planetenansicht and the follow icon is unchanged',async()=>{
  const html=await read('index.html'),detail=await read('src/ui/object-details.js');
  const action=html.split('id="detail-scene-actions"')[1].split('class="detail-tabs"')[0];
  assert.match(action,/<strong id="planet-view-title">Planetenansicht<\/strong>/);
  assert.doesNotMatch(action,/planet-view-subtitle|Mond[e]? und Satelliten|Planetenansicht öffnen/);
  assert.match(action,/id="center-object-btn"[\s\S]*?<circle cx="12" cy="12" r="6\.5"\/>/);
  assert.match(action,/<span>Folgen<\/span>/);
  assert.match(action,/aria-pressed="false"/);
  assert.doesNotMatch(detail,/planet-view-subtitle|moons} Monde|satellites} Satelliten/);
  assert.match(detail,/\$\('planet-view-title'\)\.textContent='Planetenansicht'/);
});

test('v38: global toggle follows each selected body without switching off',()=>{
  const {renderer:r,changes}=makeRenderer();
  assert.equal(r.follow('earth',0),true);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'earth');
  r.positions.set('earth',[1.1,0,0]);r.updateFollowTarget(100);
  assert.deepEqual(r.camera.desiredTarget,[1.1,0,0]);
  r.setSelected('mars',{focus:false});
  assert.equal(r.followEnabled,true,'selection does not disable the global toggle');
  assert.equal(r.followedBodyId,'mars');
  assert.deepEqual(r.camera.desiredTarget,[4,0,0]);
  assert.equal(r.focusedBodyId,'mars');
  r.positions.set('mars',[4.2,0,0]);r.updateFollowTarget(200);
  assert.deepEqual(r.camera.desiredTarget,[4.2,0,0]);
  r.setSelected('earth',{focus:true});
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'earth');
  assert.deepEqual(changes,[true], 'no false toggles on selection');
  assert.equal(r.follow('earth',300),false);
  assert.equal(r.followEnabled,false);
  assert.deepEqual(changes,[true,false]);
});

test('v38: follow persists on no selection and a probe; resumes when a positionable body is selected',()=>{
  const {renderer:r}=makeRenderer();
  r.follow('earth',0);
  r.setSelected(null);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,null);
  const probe=INITIAL_BODIES.find(b=>b.type==='probe');
  if(probe){r.setSelected(probe.id);assert.equal(r.followEnabled,true);assert.equal(r.followedBodyId,null);}
  r.setSelected('sun');
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'sun');
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
});

test('v38: rotate, zoom and perspective presets retain follow and keep target centered',()=>{
  const {renderer:r}=makeRenderer();
  r.follow('earth',0);
  r.markCameraMoved();
  assert.equal(r.followEnabled,true);
  assert.equal(r.focusedBodyId,'earth','mobile target framing remains active');
  r.camera.desiredDist=5.5;
  r.markCameraMoved();
  assert.equal(r.followEnabled,true);
  r.applyCameraPreset(1);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'earth');
  assert.equal(r.camera.phi,1.54);
  assert.deepEqual(r.camera.desiredTarget,[1,0,0]);
  r.positions.set('earth',[1.1,0,0]);r.updateFollowTarget(100);
  assert.deepEqual(r.camera.desiredTarget,[1.1,0,0]);
});

test('v38: panning and excess velocity still turn the global toggle off',()=>{
  const {renderer:r,changes}=makeRenderer();
  r.follow('earth',0);
  r.panByPixels(15,-5);
  assert.equal(r.followEnabled,false);
  assert.equal(r.followedBodyId,null);
  r.follow('earth',100);
  r.positions.set('earth',[100,0,0]);r.updateFollowTarget(120);
  assert.equal(r.followEnabled,false);
  assert.deepEqual(changes,[true,false,true,false]);
});

test('v38: scene and preset transitions retain global follow with fresh speed baselines',()=>{
  const {renderer:r}=makeRenderer();
  r.planetChildren=()=>[];
  r.planetFrameDistance=()=>12;
  r.calcPositions=function(){
    this.positions=new Map(this.planetId
      ? [['earth',[0,0,0]],['moon',[0.4,0,0]]]
      : [['earth',[1,0,0]],['moon',[1.2,0,0]],['mars',[4,0,0]]]);
  };
  r.follow('earth',0);
  assert.equal(r.showPlanetSystem('earth'),true);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'earth');
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  r.setSelected('moon',{focus:true});
  assert.equal(r.followedBodyId,'moon');
  assert.deepEqual(r.camera.desiredTarget,[0.4,0,0]);
  r.reset();
  assert.equal(r.planetId,null);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'moon');
  assert.deepEqual(r.camera.desiredTarget,[1.2,0,0]);
  r.updateFollowTarget(performance.now()+30);
  assert.equal(r.followEnabled,true,'changing coordinate systems must not count as sudden motion');
});

test('v38: DOM shows a global pressed state regardless of selected body',()=>{
  const old=globalThis.document,nodes=new Map();
  const el=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,innerHTML:'',textContent:'',title:'',style:{setProperty(){}},attrs:{},classList:{toggle(){}},querySelectorAll(){return []},setAttribute(k,v){this.attrs[k]=v}});
    return nodes.get(id);
  };
  globalThis.document={getElementById:el};
  const {renderer:r}=makeRenderer();r.overrides=new Map();
  const state={bodies:INITIAL_BODIES,selected:'earth'};
  try{
    r.follow('earth',0);
    renderDetail(state,r,()=>{});
    assert.equal(el('center-object-btn').attrs['aria-pressed'],'true');
    assert.equal(el('center-object-btn').attrs['aria-label'],'Folgen ausschalten');
    state.selected='mars';renderDetail(state,r,()=>{});
    assert.equal(el('center-object-btn').attrs['aria-pressed'],'true');
    assert.equal(el('planet-view-title').textContent,'Planetenansicht');
    r.stopFollowing();renderDetail(state,r,()=>{});
    assert.equal(el('center-object-btn').attrs['aria-pressed'],'false');
  }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});

test('v38: mouse wheel, drag rotation and touch pinch keep following; two-finger pan cancels it',()=>{
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  const {renderer:r}=makeRenderer(),handlers={};
  const canvas={addEventListener(name,fn){handlers[name]=fn;},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0}}};
  r.canvas=canvas;r.pointers=new Map();r.drag=null;r.gesture=null;r.gestureOrigin=null;r.heldArrows=new Set();
  globalThis.document={addEventListener(){},getElementById(){return null}};
  globalThis.window={addEventListener(){}};
  const pointer=(id,x,y,type='mouse',button=0)=>({pointerId:id,clientX:x,clientY:y,pointerType:type,button,target:canvas,shiftKey:false});
  try{
    attachCameraControls(r);
    r.follow('earth',0);
    handlers.wheel({deltaY:150,preventDefault(){}});
    assert.equal(r.followEnabled,true,'mouse wheel zoom');
    handlers.pointerdown(pointer(1,100,100));
    handlers.pointermove(pointer(1,120,108));
    assert.equal(r.followEnabled,true,'drag rotation');
    handlers.pointerup(pointer(1,120,108));
    handlers.pointerdown(pointer(10,100,100,'touch'));
    handlers.pointerdown(pointer(11,200,100,'touch'));
    handlers.pointermove(pointer(11,220,100,'touch'));
    assert.equal(r.followEnabled,true,'pinch zoom despite moving midpoint');
    handlers.pointerup(pointer(10,100,100,'touch'));
    handlers.pointerup(pointer(11,220,100,'touch'));
    handlers.pointerdown(pointer(20,100,100,'touch'));
    handlers.pointerdown(pointer(21,200,100,'touch'));
    handlers.pointermove(pointer(20,112,100,'touch'));
    handlers.pointermove(pointer(21,212,100,'touch'));
    assert.equal(r.followEnabled,false,'deliberate two-finger pan');
  }finally{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  }
});
