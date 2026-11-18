import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {cameraView} from '../src/renderer/camera.js';
import {projected} from '../src/renderer/math.js';
import {visibleCanvasFocusOffset} from '../src/ui/bottom-sheet.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const near=(actual,expected,tolerance=.001)=>assert.ok(Math.abs(actual-expected)<tolerance,`expected ${expected}, got ${actual}`);

const camera=()=>({theta:.63,phi:.99,dist:10.5,desiredDist:10.5,target:[0,0,0],desiredTarget:[0,0,0]});

test('v59: layer popover keeps 155px across desktop and mobile rules',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:155px;max-height:/);
  assert.doesNotMatch(css,/\.viewport>\.control-panel \.layer-popover\{width:188px/);
  assert.match(await read('sw.js'),/sonnensystem-shell-v62/);
});

test('v31: visible camera area uses the real sheet top and canvas rectangle',()=>{
  const rect={top:0,bottom:750,height:750};
  near(visibleCanvasFocusOffset(rect,750),0);
  near(visibleCanvasFocusOffset(rect,330),.56);
  near(visibleCanvasFocusOffset(rect,700),50/750);
  near(visibleCanvasFocusOffset(rect,-10),1);
  near(visibleCanvasFocusOffset({top:120,bottom:680,height:560},400),.5);
  near(visibleCanvasFocusOffset({top:120,bottom:680,height:560},800),0);
  near(visibleCanvasFocusOffset({top:20,bottom:20,height:0},20),0);
});

test('v31: off-axis projection centers the focused object above half-open sheet',()=>{
  const width=390,height=750,cam=camera();
  const plain=projected([0,0,0],cameraView(cam,width,height).vp,width,height);
  near(plain.y,height/2);
  const shifted=projected([0,0,0],cameraView(cam,width,height,.56).vp,width,height);
  near(shifted.y,165,.01); // 330px visible scene => center y=165px
  near(shifted.x,width/2);
  // Same alignment for another device size and a target away from the origin.
  const cm={...camera(),target:[14,3,-7],desiredTarget:[14,3,-7]};
  const h=900,sheetVisible=.45*h;
  const p=projected([14,3,-7],cameraView(cm,440,h,sheetVisible/h).vp,440,h);
  near(p.y,(h-sheetVisible)/2,.01);
});

test('v31: only focused selection is shifted; manual move and reset restore normal centering',()=>{
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.width=390;renderer.height=750;renderer.camera=camera();
  renderer.byId=new Map([['earth',{id:'earth',type:'planet'}],['mars',{id:'mars',type:'planet'}]]);
  renderer.positions=new Map([['earth',[0,0,0]],['mars',[5,0,-5]]]);
  renderer.selectedId='earth';renderer.planetId=null;renderer.focusedBodyId=null;renderer.focusOffsetY=0;
  renderer.updateKeyboard=()=>{};
  for(let i=0;i<100;i++)renderer.makeVP(.56);
  near(renderer.focusOffsetY,0);
  renderer.setSelected('earth',{focus:true});
  for(let i=0;i<110;i++)renderer.makeVP(.56);
  near(renderer.focusOffsetY,.56,.0001);
  const projectedY=projected(renderer.positions.get('earth'),renderer.makeVP(.56).vp,390,750).y;
  near(projectedY,165,.01);
  // Closing the sheet (offset zero) restores full-viewport centering.
  for(let i=0;i<110;i++)renderer.makeVP(0);
  near(renderer.focusOffsetY,0,.0001);
  renderer.setSelected('mars',{focus:true});
  assert.equal(renderer.focusedBodyId,'mars');
  renderer.markCameraMoved();
  assert.equal(renderer.focusedBodyId,null);
  for(let i=0;i<100;i++)renderer.makeVP(.56);
  near(renderer.focusOffsetY,0,.0001);
  renderer.setSelected('earth',{focus:true});
  renderer.applyCameraPreset(0);
  assert.equal(renderer.focusedBodyId,null);
  renderer.setSelected(null);
  for(let i=0;i<100;i++)renderer.makeVP(.56);
  near(renderer.focusOffsetY,0,.0001);
});

test('v31: app feeds mobile sheet geometry to the shared rendering pipeline',async()=>{
  const app=await read('src/app.js'),sheet=await read('src/ui/bottom-sheet.js'),renderer=await read('src/renderer/renderer.js');
  assert.match(app,/renderer\.visibleFocusOffset=mobileSheets\?\.focusOffsetFor\(renderer\.canvas\)\?\?0/);
  assert.match(sheet,/snap!=='half'/);
  assert.match(sheet,/canvas\.getBoundingClientRect\(\),sheet\.getBoundingClientRect\(\)\.top/);
  assert.match(renderer,/focusedBodyId!=null && this\.focusedBodyId===this\.selectedId/);
});
