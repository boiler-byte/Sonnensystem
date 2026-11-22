import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {rowArrowGeometry,ROW_INSPECTION_ARROW_MS} from '../src/renderer/row-inspection.js';
import {updateRowInspectionHUD} from '../src/ui/row-inspection.js';
import {createARMode,cameraLookBasis} from '../src/renderer/ar-mode.js';

const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf8');
const vp=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const planet={id:'earth',name:'Erde',type:'planet',parentId:'sun',radiusKm:6371,
 meanDistanceToParent:1,meanDistanceUnit:'AU',temperatureMeanK:287,surfaceGravityMs2:9.80665};
const coordinates=(x,y=0)=>[(x/400)-1,1-y/300,0]; // 800x600 identity projection

// The arrow must never stop after an arbitrary 300px when the center is farther away.
test('v80: parent arrow reaches its actual on-screen center, even beyond 300 pixels',()=>{
 const child=coordinates(690,300),center=coordinates(125,300);
 const geometry=rowArrowGeometry(planet,child,center,vp,800,600,80);
 assert.equal(geometry.x,690);assert.equal(geometry.tipX,125);
 assert.equal(geometry.direction,-1);assert.equal(geometry.y,449);
 assert.ok(Math.abs(geometry.tipX-geometry.x)>300);
});

test('v80: parent outside either side produces an arrow to the corresponding viewport edge',()=>{
 const left=rowArrowGeometry(planet,coordinates(640),coordinates(-250),vp,800,600,80);
 assert.equal(left.tipX,0);assert.equal(left.direction,-1);
 const right=rowArrowGeometry(planet,coordinates(100),coordinates(1350),vp,800,600,80);
 assert.equal(right.tipX,800);assert.equal(right.direction,1);
 const centered=coordinates(320);
 assert.equal(rowArrowGeometry(planet,centered,centered,vp,800,600,80),null,
  'the currently viewed central planet does not point to itself');
 assert.equal(rowArrowGeometry({...planet,parentId:null},centered,coordinates(0),vp,800,600,80),null);
});

test('v80: scanner markup displays diameter, wider brackets and inward/outward measurement heads',async()=>{
 const [html,css,js]=await Promise.all(['index.html','css/styles.css','src/ui/row-inspection.js'].map(read));
 assert.doesNotMatch(html,/SCAN\s*\/\/\s*AKTIV|ABSTAND ZUM PARENT/);
 assert.match(html,/id="row-inspection-scan-tag"/);
 assert.match(html,/class="row-inspection-diameter-rule" d="M13 16H187 M24 9L13 16L24 23 M176 9L187 16L176 23"/);
 assert.match(html,/class="row-inspection-brackets" d="M47 28H14V58 M153 28H186V58/);
 assert.match(css,/\.row-inspection-diameter-rule\{/);
 assert.match(css,/@keyframes row-inspection-measure/);
 assert.match(js,/row-inspection-scan-tag'\)\.textContent=`Ø \$\{metrics\.diameter\}`/);
});

function element(svg=false){const attributes=new Map(svg?[['hidden','']]:[]);return{
 hidden:true,dataset:{},style:{},textContent:'',offsetWidth:100,
 classList:{add(){},remove(){}},setAttribute(k,v){attributes.set(k,String(v));},
 removeAttribute(k){attributes.delete(k);},getAttribute(k){return attributes.get(k);},
 hasAttribute(k){return attributes.has(k);}
};}

test('v80: animated arrow reaches the edge and the scanner shows formatted diameter',()=>{
 const ids=['row-inspection','row-inspection-scanner','row-inspection-title','row-inspection-metrics','row-inspection-gravity-icon','row-inspection-temperature-icon','row-inspection-name',
  'row-inspection-scan-tag','row-inspection-gravity','row-inspection-temperature',
  'row-inspection-vector-svg','row-inspection-vector-line',
  'row-inspection-vector-head','row-inspection-vector-origin','row-inspection-distance',
  'row-inspection-distance-value'];
 const nodes=new Map(ids.map(id=>[id,element(id==='row-inspection-vector-svg')]));
 const renderer={settings:{row:true},cinema:null,byId:new Map([['earth',planet],['sun',{id:'sun',radiusKm:696000}]]),rowHoveredId:'earth',
  positions:new Map([['earth',coordinates(550,300)],['sun',coordinates(-500,300)]]),vp,width:800,height:600,
  planetId:null,rowHoverStartedAt:0,rowRenderedRadiusPx:()=>80};
 const previous=globalThis.document;
 globalThis.document={getElementById:id=>nodes.get(id)};
 try{
  updateRowInspectionHUD(renderer,0);
  assert.match(nodes.get('row-inspection-scan-tag').textContent,/Ø 12\.742 km/);
  assert.equal(nodes.get('row-inspection-vector-svg').hasAttribute('hidden'),false);
  const start=nodes.get('row-inspection-vector-line').getAttribute('d');
  updateRowInspectionHUD(renderer,ROW_INSPECTION_ARROW_MS+1);
  assert.equal(nodes.get('row-inspection-vector-line').getAttribute('d'),'M550.0 449.0H0.0');
  assert.notEqual(start,nodes.get('row-inspection-vector-line').getAttribute('d'));
  assert.match(nodes.get('row-inspection-distance-value').textContent,/AE$/);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

function arFixture(){
 const listeners=new Map();let sensorSubscriptions=0;
 const win={isSecureContext:true,screen:{width:390,height:844,orientation:{angle:0}},
  matchMedia:()=>({matches:true}),DeviceOrientationEvent:function(){},
  addEventListener(name,fn){if(name==='deviceorientation')sensorSubscriptions++;listeners.set(name,fn);},
  removeEventListener(name){listeners.delete(name);}};
 const button={parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
  setAttribute(){},addEventListener(){},removeEventListener(){}};
 const camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
 const mode=createARMode({camera},button,{win,nav:{maxTouchPoints:5},
  doc:{addEventListener(){},removeEventListener(){}},schedule:()=>({unref(){}}),cancel(){}});
 return {mode,camera,emit:orientation=>listeners.get('deviceorientation')?.(orientation),
  subscriptionCount:()=>sensorSubscriptions};
}
const difference=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));

test('v80: AR can re-anchor to the new selected perspective without a permission restart',async()=>{
 const x=arFixture();
 assert.equal(x.mode.alignToPerspective(),false,'AR inactive: do nothing');
 await x.mode.activate();x.emit({alpha:12,beta:72,gamma:5});
 x.emit({alpha:63,beta:56,gamma:5});
 assert.ok(difference(x.camera.arView.forward,cameraLookBasis(x.camera).forward)>.02);
 // A catalog focus or scene switch may change theta/phi and the target.
 x.camera.theta=1.25;x.camera.phi=.84;x.camera.desiredTarget=[4,0,0];
 assert.equal(x.mode.alignToPerspective(),true);
 assert.ok(difference(x.camera.arView.forward,cameraLookBasis(x.camera).forward)<1e-6);
 assert.equal(x.subscriptionCount(),1,'existing sensor session is reused');
 x.emit({alpha:77,beta:52,gamma:2});
 assert.ok(difference(x.camera.arView.forward,cameraLookBasis(x.camera).forward)>.001,
  'sensor movement must keep working immediately after realignment');
 x.mode.dispose();
});

test('v80: catalog focus and details planet-view click both invoke active AR realignment',async()=>{
 const [selection,handlers]=await Promise.all(['src/app/camera-controller.js','src/ui/event-handlers.js'].map(read));
 assert.match(selection,/arMode\?\.active\)arMode\.alignToPerspective\(\)/);
 assert.match(selection,/if\(focus && rendererSelectionId\(body,byId\)!==null && arMode\?\.active\)/);
 assert.match(handlers,/\$\('planet-view-btn'\)\.addEventListener\('click',[\s\S]*?updateMode\(\);[\s\S]*?if\(arMode\?\.active\)arMode\.alignToPerspective\(\)/);
 assert.match(handlers,/\$\('reset-camera'\)\.addEventListener\('click',[\s\S]*?arMode\.alignToPerspective\(\)/);
});
