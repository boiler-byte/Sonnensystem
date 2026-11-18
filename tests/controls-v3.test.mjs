import assert from 'node:assert/strict';
import { SolarRenderer, panCameraByPixels } from '../src/renderer/index.js';
import { readFile } from 'node:fs/promises';

const near=(actual,want,msg)=>assert.ok(Math.abs(actual-want)<1e-8,`${msg}: expected ${want}, got ${actual}`);
const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0);
const delta=(a,b)=>a.map((n,i)=>n-b[i]);
const axes=cam=>({
  right:[Math.cos(cam.theta),0,-Math.sin(cam.theta)],
  up:[-Math.sin(cam.theta),0,-Math.cos(cam.theta)]
});
const freshCamera=()=>({theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[80,4,20]});
for(const [theta,phi] of [[0,Math.PI/2],[.63,.99],[2.4,.42],[-1.8,1.42]]){
  const cam=freshCamera();cam.theta=theta;cam.phi=phi;
  const {right,up}=axes(cam);
  panCameraByPixels(cam,96,0,600);
  assert.ok(dot(cam.target,right)<0,'Dragging right shifts scene right at each camera angle');
  near(dot(cam.target,up),0,'Horizontal drag has no vertical drift');
  assert.deepEqual(cam.target,cam.desiredTarget,'Manual pan is immediate and cancels easing');
  const before=cam.target.slice();
  panCameraByPixels(cam,0,72,600);
  assert.ok(dot(delta(cam.target,before),up)>0,'Dragging downward shifts scene downward');
  near(dot(delta(cam.target,before),right),0,'Vertical drag has no horizontal drift');
}

const documentHandlers=new Map(),windowHandlers=new Map();
const on=(map,type,cb)=>map.set(type,[...(map.get(type)||[]),cb]);
const dispatch=(map,type,event)=>{for(const cb of map.get(type)||[])cb(event);};
const originalDocument=globalThis.document, originalWindow=globalThis.window;
const modal={hidden:true};
globalThis.document={
  hidden:false,
  addEventListener(type,cb){on(documentHandlers,type,cb);},
  getElementById(id){return id==='help-modal'?modal:null;}
};
globalThis.window={addEventListener(type,cb){on(windowHandlers,type,cb);}};
let nextId=1;
function makeRenderer(){
  const handlers=new Map(),selected=[];
  const canvas={
    addEventListener(type,cb){on(handlers,type,cb);},
    setPointerCapture(){},
    getBoundingClientRect(){return {left:10,top:20};}
  };
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.canvas=canvas;
  renderer.camera=freshCamera();renderer.camera.desiredTarget=[0,0,0];
  renderer.height=600;renderer.drag=null;renderer.pointers=new Map();renderer.gesture=null;
  renderer.heldArrows=new Set();renderer.lastKeyboardFrameMs=null;
  renderer.pick=(x,y)=>selected.push([x,y]);
  renderer.attachEvents();
  const emit=(type,{pointerId=nextId,button=0,pointerType='mouse',clientX=100,clientY=100,shiftKey=false,...rest}={})=>
    dispatch(handlers,type,{target:canvas,pointerId,button,pointerType,clientX,clientY,shiftKey,...rest});
  return {renderer,emit,selected};
}
try{
  // Single click remains a selection; dragging with one finger or left mouse pans.
  {
    const {renderer,emit,selected}=makeRenderer();
    emit('pointerdown',{pointerId:1,clientX:120,clientY:150});
    emit('pointerup',{pointerId:1,clientX:120,clientY:150});
    assert.deepEqual(selected,[[110,130]],'Left click selects object');
    const before=renderer.camera.target.slice();
    emit('pointerdown',{pointerId:2,clientX:100});
    emit('pointermove',{pointerId:2,clientX:140});
    emit('pointerup',{pointerId:2,clientX:140});
    assert.notDeepEqual(renderer.camera.target,before,'Left drag moves across orbital plane');
    assert.equal(selected.length,1,'Left drag does not pick');
  }
  // Right mouse drag looks around, leaving the camera target untouched.
  {
    const {renderer,emit,selected}=makeRenderer();
    const cam=renderer.camera,theta=cam.theta,phi=cam.phi,target=cam.target.slice();
    emit('pointerdown',{pointerId:3,button:2,clientX:100,clientY:100});
    emit('pointermove',{pointerId:3,button:2,clientX:140,clientY:130});
    assert.ok(cam.theta<theta,'Right-drag changes camera heading');
    assert.ok(cam.phi>phi,'Right-drag changes camera tilt');
    assert.deepEqual(cam.target,target,'Looking around does not translate the camera');
    emit('pointerup',{pointerId:3,button:2,clientX:140,clientY:130});
    assert.equal(selected.length,0,'Right click does not select');
  }
  // Shift+left drag is an alternative look gesture; mouse wheel still zooms.
  {
    const {renderer,emit}=makeRenderer(),cam=renderer.camera;
    const before=cam.theta;
    emit('pointerdown',{pointerId:4,button:0,clientX:100,clientY:100});
    emit('pointermove',{pointerId:4,clientX:115,clientY:100,shiftKey:true});
    emit('pointerup',{pointerId:4,clientX:115,clientY:100});
    assert.ok(cam.theta<before,'Shift+drag rotates instead of panning');
    assert.deepEqual(cam.target,[0,0,0]);
    const dist=cam.dist;
    let prevented=false;
    emit('wheel',{deltaY:-100,preventDefault(){prevented=true;}});
    assert.ok(prevented && cam.desiredDist<dist && cam.dist===dist,'Mouse wheel zoom unchanged');
  }
  // Pinch responds to finger separation and not to the vertical motion of one finger.
  {
    const {renderer,emit,selected}=makeRenderer(),cam=renderer.camera;
    emit('pointerdown',{pointerId:10,pointerType:'touch',clientX:100,clientY:200});
    emit('pointerdown',{pointerId:11,pointerType:'touch',clientX:200,clientY:200});
    emit('pointermove',{pointerId:10,pointerType:'touch',clientX:80,clientY:200});
    emit('pointermove',{pointerId:11,pointerType:'touch',clientX:220,clientY:200});
    near(cam.dist,47*100/140,'Spreading fingers zooms in using pinch distance');
    near(cam.desiredDist,cam.dist,'Pinch zoom is immediately visible');
    emit('pointermove',{pointerId:10,pointerType:'touch',clientX:100,clientY:200});
    emit('pointermove',{pointerId:11,pointerType:'touch',clientX:200,clientY:200});
    near(cam.dist,47,'Pinching closed zooms out');
    emit('pointerup',{pointerId:10,pointerType:'touch',clientX:100,clientY:200});
    emit('pointerup',{pointerId:11,pointerType:'touch',clientX:200,clientY:200});
    assert.equal(selected.length,0,'Two-finger gesture cannot select an object');
  }
  // Translate both fingers without changing their final distance; this looks around.
  {
    const {renderer,emit}=makeRenderer(),cam=renderer.camera;
    const theta=cam.theta,phi=cam.phi,origin=cam.target.slice();
    emit('pointerdown',{pointerId:20,pointerType:'touch',clientX:100,clientY:200});
    emit('pointerdown',{pointerId:21,pointerType:'touch',clientX:200,clientY:200});
    emit('pointermove',{pointerId:20,pointerType:'touch',clientX:130,clientY:220});
    emit('pointermove',{pointerId:21,pointerType:'touch',clientX:230,clientY:220});
    near(cam.dist,47,'Same final gap means no net zoom');
    assert.ok(cam.theta<theta && cam.phi>phi,'Two-finger swipe rotates camera');
    assert.deepEqual(cam.target,origin,'Two-finger look does not pan');
    emit('pointercancel',{pointerId:20,pointerType:'touch',clientX:130,clientY:220});
    emit('pointerup',{pointerId:21,pointerType:'touch',clientX:230,clientY:220});
    assert.equal(renderer.pointers.size,0,'Pointer cancellation cleans up gesture');
  }
  // Arrow keys pan continuously during hold, do not hijack controls or modal.
  {
    const {renderer}=makeRenderer(),cam=renderer.camera;
    const {right,up}=axes(cam);
    const body={closest:()=>null};
    const key=(type,key,target=body,other={})=>{
      const ev={key,target,defaultPrevented:false,preventDefault(){this.prevented=true;},...other};
      dispatch(documentHandlers,type,ev);
      return ev;
    };
    const first=key('keydown','ArrowRight');
    assert.equal(first.prevented,true,'Arrow navigation prevents page scroll');
    renderer.lastKeyboardFrameMs=1000;
    renderer.updateKeyboard(1016);
    assert.ok(dot(cam.target,right)>0,'ArrowRight moves viewpoint right');
    const firstTarget=cam.target.slice();
    renderer.updateKeyboard(1032);
    assert.ok(dot(delta(cam.target,firstTarget),right)>0,'Held arrow continues moving each frame');
    key('keyup','ArrowRight');
    const released=cam.target.slice();renderer.updateKeyboard(1048);
    assert.deepEqual(cam.target,released,'Key release stops movement');
    const input={closest:()=>({tagName:'INPUT'})};
    key('keydown','ArrowUp',input);
    assert.equal(renderer.heldArrows.size,0,'Form input keeps its arrow keys');
    modal.hidden=false;
    key('keydown','ArrowUp');
    assert.equal(renderer.heldArrows.size,0,'Open modal blocks camera keys');
    modal.hidden=true;
    key('keydown','ArrowUp',body,{metaKey:true});
    assert.equal(renderer.heldArrows.size,0,'Browser shortcuts are untouched');
    key('keydown','ArrowUp');
    renderer.lastKeyboardFrameMs=2000;renderer.updateKeyboard(2016);
    assert.ok(dot(delta(cam.target,released),up)>0,'ArrowUp moves viewpoint upwards');
    dispatch(windowHandlers,'blur',{});
    assert.equal(renderer.heldArrows.size,0,'Blur clears held keys');
    key('keydown','ArrowLeft');
    globalThis.document.hidden=true;
    dispatch(documentHandlers,'visibilitychange',{});
    assert.equal(renderer.heldArrows.size,0,'Hidden page clears held keys');
  }
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(sw,/sonnensystem-shell-v(?:[4-9]|[12][0-9]|3[0-9])\d*/,'PWA cache bumped');
  assert.match(html,/V(?:[4-9]|[12][0-9]|3[0-9])\d*\.\d+/,'UI version bumped');
  const guide=await readFile(new URL('../docs/HILFE.md',import.meta.url),'utf8');
  assert.match(guide,/zwei Finger/i,'Documentation keeps mobile gesture help');
  console.log('✓ v3 gesture regression (v4 ground-plane) mouse pan, keyboard movement, two-finger pinch/look, focus and selection regression checks passed');
}finally{
  if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
  if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
}
