import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {attachCameraControls} from '../src/renderer/controls.js';

const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,`${message}: ${a} != ${b}`);

/** Exercise the real renderer's chart zoom and camera control handlers together. */
function setup(){
  const handlers=new Map(),picks=[];
  const canvas={
    addEventListener:(event,handler)=>handlers.set(event,handler),
    setPointerCapture(){},
    getBoundingClientRect:()=>({left:0,top:0})
  };
  const renderer=Object.create(SolarRenderer.prototype);
  Object.assign(renderer,{
    canvas,width:1000,height:680,focusOffsetY:0,visibleFocusOffset:0,
    camera:{theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]},
    settings:{orbits:true,scaleObjects:false,scaleOrbits:false,row:false},
    selectedId:null,planetId:null,cameraManuallyMoved:false,focusedBodyId:null,
    followEnabled:true,followedBodyId:null,transition:null,callbacks:{},
    positions:new Map(),overrides:new Map(),pointers:new Map(),drag:null,
    gesture:null,gestureOrigin:null,heldArrows:new Set(),lastKeyboardFrameMs:null,
    simTime:Date.UTC(2026,10,22),
    pick:(x,y)=>picks.push([x,y])
  });
  renderer.setBodies(INITIAL_BODIES.map(body=>({...body})));
  renderer.calcPositions(renderer.simTime);
  renderer.setSelected('earth',{focus:true});
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  globalThis.document={addEventListener(){},getElementById:()=>null};
  globalThis.window={addEventListener(){}};
  attachCameraControls(renderer);
  const emit=(type,id,x,y,pointerType='mouse',button=0,options={})=>{
    assert.ok(handlers.has(type),`Missing ${type} handler`);
    handlers.get(type)({target:canvas,pointerId:id,clientX:x,clientY:y,pointerType,
      button,shiftKey:false,preventDefault(){},...options});
  };
  const drag=(id,button=0,options={})=>{
    const {pointerType='mouse',dx=36,dy=14,shiftKey=false}=options;
    emit('pointerdown',id,110,120,pointerType,button);
    emit('pointermove',id,110+dx,120+dy,pointerType,button,{shiftKey});
    emit('pointerup',id,110+dx,120+dy,pointerType,button);
  };
  const swipe=(firstId=10,dx=38,dy=14)=>{
    emit('pointerdown',firstId,100,100,'touch');
    emit('pointerdown',firstId+1,200,100,'touch');
    emit('pointermove',firstId,100+dx,100+dy,'touch');
    emit('pointermove',firstId+1,200+dx,100+dy,'touch');
    emit('pointerup',firstId,100+dx,100+dy,'touch');
    emit('pointerup',firstId+1,200+dx,100+dy,'touch');
  };
  const cleanup=()=>{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  };
  return {r:renderer,emit,drag,swipe,picks,cleanup};
}

test('v161: chart NAH/FERN changes following but never switches mouse buttons with selected body',()=>{
  const {r,drag,cleanup}=setup();
  try{
    assert.equal(r.selectedId,'earth');
    assert.equal(r.followedBodyId,'earth');
    assert.equal(r.detailZoomCurrentMode('earth'),'near');
    for(const mode of ['far','near','far']){
      assert.equal(r.toggleDetailZoom('earth'),mode);
      assert.equal(r.selectedId,'earth','chart toggle does not clear selection');
      assert.equal(r.followedBodyId,mode==='near'?'earth':null,'chart follow behavior is unchanged');
      const target=r.camera.target.slice(),theta=r.camera.theta;
      drag(1);
      assert.deepEqual(r.camera.target,target,`${mode}: left mouse must look, not pan`);
      assert.ok(r.camera.theta<theta,`${mode}: left mouse must rotate`);
      const afterLook=r.camera.theta,afterTarget=r.camera.target.slice();
      drag(2,2);
      near(r.camera.theta,afterLook,`${mode}: right mouse must not look`);
      assert.notDeepEqual(r.camera.target,afterTarget,`${mode}: right mouse must pan`);
      assert.equal(r.followedBodyId,null,'manual pan suspends follow without clearing selection');
      const afterPan=r.camera.target.slice(),beforeNextLook=r.camera.theta;
      drag(3);
      assert.deepEqual(r.camera.target,afterPan,`${mode}: next left drag must still look after pan`);
      assert.ok(r.camera.theta<beforeNextLook);
    }
  }finally{cleanup();}
});

test('v161: chart NAH/FERN leaves one- and two-finger swipe roles unchanged',()=>{
  const {r,drag,swipe,cleanup}=setup();
  try{
    for(const mode of ['far','near','far']){
      assert.equal(r.toggleDetailZoom('earth'),mode);
      const target=r.camera.target.slice(),theta=r.camera.theta;
      drag(20,0,{pointerType:'touch'});
      assert.deepEqual(r.camera.target,target,`${mode}: one finger does not pan`);
      assert.ok(r.camera.theta<theta,`${mode}: one finger looks around`);
      const afterLook=r.camera.theta,afterLookTarget=r.camera.target.slice();
      swipe(30);
      near(r.camera.theta,afterLook,`${mode}: two-finger swipe does not look`);
      assert.notDeepEqual(r.camera.target,afterLookTarget,`${mode}: two-finger swipe pans`);
      assert.equal(r.selectedId,'earth');
      assert.equal(r.followedBodyId,null,'two-finger pan may suspend following');
      const afterPan=r.camera.target.slice(),afterPanTheta=r.camera.theta;
      drag(40,0,{pointerType:'touch'});
      assert.deepEqual(r.camera.target,afterPan,`${mode}: one finger keeps looking after pan`);
      assert.ok(r.camera.theta<afterPanTheta);
    }
  }finally{cleanup();}
});

test('v161: Shift+left, pinch and wheel retain their functions in FERN without follow',()=>{
  const {r,emit,drag,cleanup}=setup();
  try{
    assert.equal(r.toggleDetailZoom('earth'),'far');
    assert.equal(r.followedBodyId,null);
    const target=r.camera.target.slice(),theta=r.camera.theta;
    drag(1,0,{shiftKey:true});
    assert.notDeepEqual(r.camera.target,target,'selected Shift+left still pans');
    near(r.camera.theta,theta,'selected Shift+left does not look');
    const originalDist=r.camera.dist;
    emit('pointerdown',10,100,100,'touch');
    emit('pointerdown',11,200,100,'touch');
    emit('pointermove',10,75,100,'touch');
    emit('pointermove',11,225,100,'touch');
    near(r.camera.dist,originalDist*100/150,'pinch keeps its zoom mapping');
    emit('pointerup',10,75,100,'touch');
    emit('pointerup',11,225,100,'touch');
    const previousDesired=r.camera.desiredDist;
    emit('wheel',99,0,0,'mouse',0,{deltaY:-100});
    assert.ok(r.camera.desiredDist<previousDesired,'wheel still zooms in');
  }finally{cleanup();}
});

test('v161: only clearing selection restores unselected controls; gestures stay latched',()=>{
  const {r,emit,drag,swipe,cleanup,picks}=setup();
  try{
    r.toggleDetailZoom('earth'); // FERN without active follow
    // Clearing the selection during a right-button drag does not change that drag.
    emit('pointerdown',1,110,120,'mouse',2);
    r.setSelected(null);
    assert.equal(r.selectedId,null);
    const target=r.camera.target.slice(),theta=r.camera.theta;
    emit('pointermove',1,150,140,'mouse',2);
    assert.notDeepEqual(r.camera.target,target,'ongoing right drag keeps its pan action');
    near(r.camera.theta,theta,'ongoing drag does not become a look');
    emit('pointerup',1,150,140,'mouse',2);
    const afterPan=r.camera.target.slice(),beforeNew=r.camera.theta;
    drag(2);
    assert.notDeepEqual(r.camera.target,afterPan,'new unselected left drag pans');
    near(r.camera.theta,beforeNew,'unselected left drag does not rotate');
    const afterLeft=r.camera.target.slice();
    drag(3,2);
    assert.deepEqual(r.camera.target,afterLeft,'unselected right drag looks in place');
    assert.ok(r.camera.freeLook?.forward,'unselected right drag uses free look');
    const afterRight=r.camera.target.slice();
    const view=r.camera.freeLook.forward.slice();
    swipe(20);
    assert.deepEqual(r.camera.target,afterRight,'unselected two-finger swipe looks, not pan');
    assert.notDeepEqual(r.camera.freeLook.forward,view,'unselected two-finger swipe changes view');
    assert.equal(picks.length,0,'dragging must not accidentally select');
  }finally{cleanup();}
});

test('v161: packaging and documentation use selected-object control mapping',async()=>{
  const [html,help,readme,controls,sw,pkg]=await Promise.all([
    'index.html','docs/HILFE.md','README.md','src/renderer/controls.js','sw.js','package.json'
  ].map(name=>readFile(new URL('../'+name,import.meta.url),'utf8')));
  assert.match(html,/Bei ausgewähltem Objekt:/);
  assert.match(help,/Solange ein Objekt ausgewählt ist \(v161\)/);
  assert.match(readme,/Neu in v161/);
  assert.match(controls,/return renderer\.selectedId != null;/);
  assert.doesNotMatch(controls,/function trackingActive/);
  assert.match(sw,/sonnensystem-shell-v161/);
  assert.equal(JSON.parse(pkg).version,'161.0.0');
});
