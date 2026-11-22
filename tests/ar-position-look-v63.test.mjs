import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cameraView,lookAroundFixedEye} from '../src/renderer/camera.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {attachCameraControls} from '../src/renderer/controls.js';

const read=path=>readProjectSource(path);
const approx=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} !== ${b}`);
function camera(){return {theta:.63,phi:.99,target:[4,0,7],desiredTarget:[4,0,7],dist:47,desiredDist:47};}

function setup(selectedId=null){
 const handlers=new Map();
 const canvas={addEventListener:(name,fn)=>handlers.set(name,fn),setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0})};
 const r=Object.create(SolarRenderer.prototype);
 r.canvas=canvas;r.selectedId=selectedId;r.width=1100;r.height=720;
 r.pointers=new Map();r.drag=null;r.gesture=null;r.gestureOrigin=null;r.heldArrows=new Set();
 r.camera=camera();r.cameraManuallyMoved=false;r.followEnabled=false;r.focusedBodyId=null;
 const priorDocument=globalThis.document,priorWindow=globalThis.window;
 globalThis.document={addEventListener(){},getElementById:()=>null};
 globalThis.window={addEventListener(){}};
 attachCameraControls(r);
 const emit=(type,id,x,y,pointerType='mouse',button=0)=>handlers.get(type)?.({
   target:canvas,pointerId:id,clientX:x,clientY:y,pointerType,button,shiftKey:false
 });
 const cleanup=()=>{
  if(priorDocument===undefined)delete globalThis.document;else globalThis.document=priorDocument;
  if(priorWindow===undefined)delete globalThis.window;else globalThis.window=priorWindow;
 };
 return {r,emit,cleanup};
}

test('v64: AR and camera reset share the same bottom action container, not the upper panel',async()=>{
 const html=await read('index.html');
 const actions=html.split('<div class="viewport-actions"')[1].split('</div>')[0];
 const control=html.split('id="view-mode-status"')[1].split('</section>')[0];
 assert.match(actions,/id="ar-mode-btn"/);
 assert.match(actions,/id="reset-camera"/);
 assert.ok(actions.indexOf('id="ar-mode-btn"')<actions.indexOf('id="reset-camera"'));
 assert.doesNotMatch(control,/id="ar-mode-btn"/);
 assert.equal((html.match(/id="ar-mode-btn"/g)||[]).length,1);
 assert.equal((html.match(/id="reset-camera"/g)||[]).length,1);
 assert.match(html,/id="ar-mode-btn"[^>]*aria-pressed="false"[^>]*hidden>/);
});

test('v64: AR hidden/mobile offsets share the camera-reset sheet movement and inert state',async()=>{
 const [css,sheet]=await Promise.all([read('css/styles.css'),read('src/ui/bottom-sheet.js')]);
 const v64=css; 
 assert.match(v64,/\.viewport-actions\{[\s\S]*?left:max\(15px,env\(safe-area-inset-left\)\)/);
 assert.match(v64,/justify-content:space-between/);
 assert.match(v64,/\.viewport-actions \.camera-reset-button\{margin-left:auto\}/);
 assert.match(v64,/\.viewport-actions \.ar-mode-button\[hidden\]\{display:none!important\}/);
 assert.match(v64,/@media\(max-width:770px\)/);
 assert.match(css,/\.viewport-actions\{\s*bottom:calc\(var\(--sheet-visible,45px\)/);
 assert.match(sheet,/const cameraActions = \$\('reset-camera'\)\.parentElement/);
 assert.match(sheet,/cameraActions\.style\.setProperty\('--sheet-visible',height\)/);
 assert.match(sheet,/cameraActions\.inert=mobile\(\)&&next==='full'/);
 assert.match(sheet,/cameraActions\.classList\.add\('sheet-dragging'\)/);
});

test('v64: free look inverts Y without changing camera eye, X direction or sensor orientation',()=>{
 const a=camera(),b=camera();
 const eye=cameraView(a,1100,720).eye;
 lookAroundFixedEye(a,80,65);
 lookAroundFixedEye(b,80,-65);
 assert.ok(a.freeLook.phi<.99,'downward drag looks down');
 assert.ok(b.freeLook.phi>.99,'upward drag looks up');
 approx(a.freeLook.phi,.99-65*.005);
 approx(b.freeLook.phi,.99+65*.005);
 approx(a.freeLook.theta,b.freeLook.theta);
 assert.ok(a.freeLook.forward[1]<b.freeLook.forward[1]);
 cameraView(a,1100,720).eye.forEach((v,i)=>approx(v,eye[i]));
 assert.equal(a.phi,.99);assert.equal(a.theta,.63);
});

test('v161: right mouse free-look remains unselected; selected-object left drag keeps orbit direction',()=>{
 for(const selected of [null,'earth']){
  const {r,emit,cleanup}=setup(selected);
  try{
   const button=selected===null?2:0;
   emit('pointerdown',1,100,100,'mouse',button);
   emit('pointermove',1,100,155,'mouse',button);
   emit('pointerup',1,100,155,'mouse',button);
   if(selected===null){
    assert.ok(r.camera.freeLook.phi<.99);
    approx(r.camera.phi,.99);
   }else{
    assert.ok(r.camera.phi>.99,'selected object retains established orbital mapping');
    assert.equal(r.camera.freeLook,undefined);
   }
  }finally{cleanup();}
 }
});

test('v104: a two-finger downward swipe looks downward at a fixed eye',()=>{
 const {r,emit,cleanup}=setup();
 try{
  const eye=cameraView(r.camera,1100,720).eye;
  emit('pointerdown',1,100,100,'touch');emit('pointerdown',2,220,100,'touch');
  emit('pointermove',1,100,150,'touch');emit('pointermove',2,220,150,'touch');
  assert.ok(r.camera.freeLook?.phi<.99);
  approx(r.camera.dist,47);
  cameraView(r.camera,1100,720).eye.forEach((v,i)=>approx(v,eye[i]));
  emit('pointerup',1,100,150,'touch');emit('pointerup',2,220,150,'touch');
 }finally{cleanup();}
});
