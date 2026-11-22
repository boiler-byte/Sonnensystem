import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {attachCameraControls} from '../src/renderer/controls.js';

const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-9,`${message}: ${a} != ${b}`);

function setup({selectedId='earth',tracking=true}={}){
  const handlers=new Map(),picked=[];
  const canvas={
    addEventListener:(name,cb)=>handlers.set(name,cb),
    setPointerCapture(){},
    getBoundingClientRect:()=>({left:0,top:0})
  };
  const r=Object.create(SolarRenderer.prototype);
  Object.assign(r,{
    canvas,width:1000,height:700,selectedId,
    pointers:new Map(),drag:null,gesture:null,gestureOrigin:null,
    heldArrows:new Set(),lastKeyboardFrameMs:null,
    camera:{theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]},
    cameraManuallyMoved:false,followEnabled:true,
    followedBodyId:tracking?selectedId:null,focusedBodyId:tracking?selectedId:null,
    callbacks:{},transition:null,settings:{},
    pick:(x,y)=>picked.push([x,y])
  });
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  globalThis.document={addEventListener(){},getElementById:()=>null};
  globalThis.window={addEventListener(){}};
  attachCameraControls(r);
  const emit=(type,id,x,y,pointerType='mouse',button=0,extra={})=>{
    const e={target:canvas,pointerId:id,clientX:x,clientY:y,pointerType,button,
      shiftKey:false,preventDefault(){},...extra};
    handlers.get(type)?.(e);
    return e;
  };
  const cleanup=()=>{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  };
  return {r,emit,cleanup,picked};
}

test('v145: following + left mouse looks instead of moving; click still selects',()=>{
  const {r,emit,cleanup,picked}=setup();
  try{
    emit('pointerdown',1,100,100);
    emit('pointerup',1,100,100);
    assert.equal(picked.length,1,'left click must still select');
    const originalTarget=r.camera.target.slice(),theta=r.camera.theta,phi=r.camera.phi;
    emit('pointerdown',2,100,100);
    emit('pointermove',2,145,118);
    emit('pointerup',2,145,118);
    assert.ok(r.camera.theta<theta,'left mouse drag looks horizontally');
    assert.ok(r.camera.phi>phi,'left mouse drag looks vertically');
    assert.deepEqual(r.camera.target,originalTarget,'left mouse drag does not move camera');
    assert.equal(r.followedBodyId,'earth','looking retains active follow');
    assert.equal(picked.length,1,'left drag must not select');
  }finally{cleanup();}
});

test('v145: following + right mouse pans continuously, suspends tracking, and does not pick',()=>{
  const {r,emit,cleanup,picked}=setup();
  try{
    const theta=r.camera.theta,phi=r.camera.phi,target=r.camera.target.slice();
    emit('pointerdown',3,100,100,'mouse',2);
    emit('pointermove',3,125,110,'mouse',2);
    assert.notDeepEqual(r.camera.target,target,'right drag translates the camera');
    assert.equal(r.followedBodyId,null,'right drag suspends tracking');
    assert.equal(r.followEnabled,true,'permanent follow mode stays enabled');
    const afterFirst=r.camera.target.slice();
    emit('pointermove',3,165,135,'mouse',2);
    assert.notDeepEqual(r.camera.target,afterFirst,'same drag keeps panning after tracking stops');
    near(r.camera.theta,theta,'no switch to looking on second movement');
    near(r.camera.phi,phi,'no accidental tilt on second movement');
    emit('pointerup',3,165,135,'mouse',2);
    assert.equal(picked.length,0,'right click cannot select');
    // v161: suspended follow does not undo selected-object controls.
    const beforeNewDrag=r.camera.target.slice(),beforeNewAngle=r.camera.theta;
    emit('pointerdown',4,100,100);
    emit('pointermove',4,125,105);
    emit('pointerup',4,125,105);
    assert.deepEqual(r.camera.target,beforeNewDrag,'new left drag does not pan with selection');
    assert.ok(r.camera.theta<beforeNewAngle,'new left drag still looks after follow suspension');
  }finally{cleanup();}
});

test('v161: Shift + left mirrors right mouse depending on selection, not tracking',()=>{
  for(const [selectedId,tracking] of [['earth',true],['earth',false],[null,false]]){
    const {r,emit,cleanup}=setup({selectedId,tracking});
    try{
      const initialTheta=r.camera.theta,target=r.camera.target.slice();
      emit('pointerdown',5,100,100);
      emit('pointermove',5,145,110,'mouse',0,{shiftKey:true});
      emit('pointerup',5,145,110);
      if(selectedId!=null){
        assert.notDeepEqual(r.camera.target,target,'selected Shift+left pans');
        near(r.camera.theta,initialTheta,'selected Shift+left does not look');
        assert.equal(r.followedBodyId,null,'pan suspends active follow if present');
      }else{
        assert.deepEqual(r.camera.target,target,'unselected Shift+left does not pan');
        near(r.camera.theta,initialTheta,'unselected free-look preserves orbit heading');
        assert.ok(r.camera.freeLook?.forward,'unselected Shift+left looks');
      }
    }finally{cleanup();}
  }
});

test('v145: following + one finger looks; pinch zoom remains available without suspending follow',()=>{
  const {r,emit,cleanup,picked}=setup();
  try{
    const target=r.camera.target.slice(),theta=r.camera.theta,phi=r.camera.phi;
    emit('pointerdown',10,100,120,'touch');
    emit('pointermove',10,135,140,'touch');
    emit('pointerup',10,135,140,'touch');
    assert.ok(r.camera.theta<theta && r.camera.phi>phi,'one finger looks in both axes');
    assert.deepEqual(r.camera.target,target,'one finger must not move camera while following');
    assert.equal(r.followedBodyId,'earth','one finger look retains tracking');
    const lookTheta=r.camera.theta,lookPhi=r.camera.phi;
    emit('pointerdown',11,100,120,'touch');
    emit('pointerdown',12,200,120,'touch');
    emit('pointermove',11,75,120,'touch');
    emit('pointermove',12,225,120,'touch');
    near(r.camera.dist,47*100/150,'pinch zooms based on finger separation');
    near(r.camera.desiredDist,r.camera.dist,'pinch distance applied immediately');
    near(r.camera.theta,lookTheta,'pinch must not turn');
    near(r.camera.phi,lookPhi,'pinch must not tilt');
    assert.deepEqual(r.camera.target,target,'pinch must not pan');
    assert.equal(r.followedBodyId,'earth','pinch retains active follow');
    emit('pointerup',11,75,120,'touch');
    emit('pointerup',12,225,120,'touch');
    assert.equal(picked.length,0,'touch drag/pinch cannot pick');
  }finally{cleanup();}
});

test('v145: following + two-finger swipe pans, stays a pan after follow suspension',()=>{
  const {r,emit,cleanup,picked}=setup();
  try{
    const theta=r.camera.theta,phi=r.camera.phi,target=r.camera.target.slice();
    emit('pointerdown',20,100,100,'touch');
    emit('pointerdown',21,200,100,'touch');
    emit('pointermove',20,125,110,'touch');
    emit('pointermove',21,225,110,'touch');
    near(r.camera.dist,47,'equal finger separation does not zoom');
    assert.notDeepEqual(r.camera.target,target,'two-finger swipe moves camera');
    assert.equal(r.followedBodyId,null,'two-finger pan suspends follow');
    assert.equal(r.followEnabled,true,'follow toggle stays enabled');
    const targetAfter=r.camera.target.slice();
    emit('pointermove',20,145,123,'touch');
    emit('pointermove',21,245,123,'touch');
    assert.notDeepEqual(r.camera.target,targetAfter,'gesture stays panning after suspension');
    near(r.camera.theta,theta,'no heading change during followed two-finger pan');
    near(r.camera.phi,phi,'no tilt change during followed two-finger pan');
    emit('pointerup',21,245,123,'touch');
    const beforeOneFinger=r.camera.target.slice();
    emit('pointermove',20,160,140,'touch');
    assert.deepEqual(r.camera.target,beforeOneFinger,'remaining finger stays in its captured look mode');
    assert.ok(r.camera.theta<theta,'remaining finger still looks, even though follow was suspended');
    emit('pointerup',20,160,140,'touch');
    assert.equal(r.pointers.size,0);
    assert.equal(picked.length,0,'multi-finger gesture never selects');
    const nextTarget=r.camera.target.slice(),nextAngle=r.camera.theta;
    emit('pointerdown',22,100,100,'touch');
    emit('pointermove',22,140,100,'touch');
    emit('pointerup',22,140,100,'touch');
    assert.deepEqual(r.camera.target,nextTarget,'new one-finger gesture remains look with selection');
    assert.ok(r.camera.theta<nextAngle,'new one-finger swipe keeps selected-object look');
  }finally{cleanup();}
});

test('v161: selected but no active tracking keeps selected-object controls on every new gesture',()=>{
  const {r,emit,cleanup}=setup({tracking:false});
  try{
    assert.equal(r.followEnabled,true,'permanent follow setting remains enabled');
    const initial=r.camera.target.slice(),theta=r.camera.theta;
    emit('pointerdown',30,100,100);
    emit('pointermove',30,150,105);
    emit('pointerup',30,150,105);
    assert.deepEqual(r.camera.target,initial,'left button looks with tracking suspended');
    assert.ok(r.camera.theta<theta,'left button keeps selected-object look');
    const target=r.camera.target.slice(),afterLeft=r.camera.theta;
    emit('pointerdown',31,100,100,'mouse',2);
    emit('pointermove',31,135,110,'mouse',2);
    emit('pointerup',31,135,110,'mouse',2);
    near(r.camera.theta,afterLeft,'right button does not look with tracking suspended');
    assert.notDeepEqual(r.camera.target,target,'right button pans with selected object');
    const afterRight=r.camera.target.slice();
    emit('pointerdown',32,100,100,'touch');
    emit('pointerdown',33,200,100,'touch');
    emit('pointermove',32,135,110,'touch');
    emit('pointermove',33,235,110,'touch');
    near(r.camera.theta,afterLeft,'two fingers do not look with selected object');
    assert.notDeepEqual(r.camera.target,afterRight,'two-finger swipe pans with selected object');
  }finally{cleanup();}
});

test('v145: documentation and packaging identify the new control modes',async()=>{
  const [html,guide,readme]=await Promise.all([
    readFile(new URL('../index.html',import.meta.url),'utf8'),
    readFile(new URL('../docs/HILFE.md',import.meta.url),'utf8'),
    readFile(new URL('../README.md',import.meta.url),'utf8')
  ]);
  assert.match(html,/<meta name="app-version" content="V(?:14[5-9]|1[5-9]\d|[2-9]\d{2})\.0"/);
  assert.match(html,/Bei ausgewähltem Objekt/);
  assert.match(guide,/Objektverfolgung/);
  assert.match(guide,/ein Finger.*umsehen/i);
  assert.match(readme,/v145/);
});
