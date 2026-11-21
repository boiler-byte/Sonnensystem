import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {cameraView} from '../src/renderer/camera.js';
import {projected} from '../src/renderer/math.js';
import {visibleCanvasFocusOffset} from '../src/ui/bottom-sheet.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
const read=path=>readProjectSource(path);
const near=(actual,expected,tolerance=.001)=>assert.ok(Math.abs(actual-expected)<tolerance,`expected ${expected}, got ${actual}`);

const camera=()=>({theta:.63,phi:.99,dist:10.5,desiredDist:10.5,target:[0,0,0],desiredTarget:[0,0,0]});

test('v59: layer popover keeps 140px across desktop and mobile rules',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:140px;max-width:calc\(100vw - 20px\)/);
  assert.doesNotMatch(css,/\.viewport>\.control-panel \.layer-popover\{width:188px/);
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

test('v72: the current gaze is recentered for any camera mode while the mobile sheet is open',()=>{
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.width=390;renderer.height=750;renderer.camera=camera();
  renderer.byId=new Map([['earth',{id:'earth',type:'planet'}],['mars',{id:'mars',type:'planet'}]]);
  renderer.positions=new Map([['earth',[0,0,0]],['mars',[5,0,-5]]]);
  renderer.selectedId='earth';renderer.planetId=null;renderer.focusedBodyId=null;renderer.focusOffsetY=0;
  renderer.updateKeyboard=()=>{};
  renderer.makeVP(.39); // No automatic focus: still reframe the visible scene.
  near(renderer.focusOffsetY,.39);
  near(projected([0,0,0],renderer.makeVP(.39).vp,390,750).y,750*(1-.39)/2,.01);
  renderer.setSelected('earth',{focus:true});
  renderer.makeVP(.39);
  near(renderer.focusOffsetY,.39);
  renderer.markCameraMoved();
  renderer.makeVP(.39);
  near(renderer.focusOffsetY,.39);
  renderer.setSelected(null);
  renderer.camera.freeLook={theta:renderer.camera.theta,phi:renderer.camera.phi,
    forward:[-.5,-.55,-.669],up:[0,1,0]};
  renderer.makeVP(.39);
  near(renderer.focusOffsetY,.39);
  renderer.makeVP(0); // Sheet closes: full viewport center is restored.
  near(renderer.focusOffsetY,0);
});

test('v31: app feeds mobile sheet geometry to the shared rendering pipeline',async()=>{
  const app=await read('src/app.js'),sheet=await read('src/ui/bottom-sheet.js'),renderer=await read('src/renderer/renderer.js');
  assert.match(app,/renderer\.visibleFocusOffset=mobileSheets\?\.focusOffsetFor\(renderer\.canvas\)\?\?0/);
  assert.match(sheet,/const blend=clamp\(\(visibleSheet-collapsed\)\/collapsed,0,1\)/);
  assert.match(sheet,/visibleCanvasFocusOffset\(sceneRect,sheetRect\.top\)/);
  assert.match(renderer,/this\.focusOffsetY=clamp\(visibleFocusOffset,0,1\)/);
});
