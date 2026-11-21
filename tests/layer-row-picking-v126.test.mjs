import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {projected, CAMERA_FOV} from '../src/renderer/math.js';
import {projectedHitArea} from '../src/renderer/picking.js';
import {rowBodyFocusDistance} from '../src/renderer/transitions.js';
import {rowHoveredBody} from '../src/renderer/row-inspection.js';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const vp=new Float32Array([20,0,0,0, 0,20,0,0, 0,0,1,0, 0,0,0,20]);
const earth={id:'earth',type:'planet',radiusKm:6371,parentId:'sun'};
const moon={id:'moon',type:'moon',radiusKm:1737,parentId:'earth'};

function renderer({row=false,planetId=null,scaleObjects=false,followEnabled=false}={}) {
  const r=Object.create(SolarRenderer.prototype);
  r.settings={row,scaleObjects};r.planetId=planetId;r.width=800;r.height=600;
  r.camera={theta:0,phi:1.5,dist:40,desiredDist:40,target:[0,0,0],desiredTarget:[0,0,0]};
  r.byId=new Map([[earth.id,earth],[moon.id,moon]]);
  r.positions=new Map([['earth',[5,0,0]],['moon',[8,0,0]]]);
  r.selectedId=null;r.focusedBodyId=null;r.cameraManuallyMoved=false;
  r.followEnabled=followEnabled;r.followedBodyId=null;r.callbacks={};
  r.rowDistance=()=>100;r.calcPositions=()=>{};r.simTime=Date.UTC(2026,10,21);
  return r;
}

function pickScene(radius,{row=false,selectedId=null,position=[0,0,0]}={}) {
 const r=renderer({row});
 r.vp=vp;r.rendered=[earth];r.positions.set('earth',position);
 r.selectedId=selectedId;r.bodyRadius=()=>radius;
 r.calls=[];r.callbacks={onSelect:id=>r.calls.push(id),onClearSelect:()=>r.calls.push('clear')};
 return r;
}

test('v126: 140px is the sole width of the Layer Control popover on desktop and mobile',async()=>{
 const css=await read('css/styles.css');
 const widths=[...css.matchAll(/(?:\.viewport>\.control-panel |\.control-panel )?\.layer-popover\{[^}]*?width:(\d+)px/g)]
  .map(m=>Number(m[1]));
 assert.ok(widths.length>=3);
 assert.ok(widths.every(width=>width===140),`Conflicting layer widths: ${widths}`);
 assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:140px;max-width:calc\(100vw - 20px\)/);
});

test('v126: clicked row bodies center and zoom to a size-dependent distance in either scene',()=>{
 for(const planetId of [null,'earth']){
  const r=renderer({row:true,planetId});
  for(const [body,id,position] of [[earth,'earth',[5,0,0]],[moon,'moon',[8,0,0]]]){
   r.setSelected(id,{focus:true,zoom:true});
   assert.deepEqual(r.camera.desiredTarget,position);
   assert.equal(r.focusedBodyId,id);
   const expected=Math.max(r.minCameraDistance()*2,Math.min(r.maxCameraDistance(),rowBodyFocusDistance(r.bodyRadius(body))));
   assert.ok(Math.abs(r.camera.desiredDist-expected)<1e-9);
  }
 }
});

test('v126: row close-up is proportional to real displayed radius rather than hover size',()=>{
 const r=renderer({row:true});
 assert.ok(rowBodyFocusDistance(1)>rowBodyFocusDistance(.1));
 const distance=rowBodyFocusDistance(1);
 const diameterFraction=1/(Math.tan(CAMERA_FOV/2)*distance);
 assert.ok(Math.abs(diameterFraction-.46)<1e-12);
 assert.equal(rowBodyFocusDistance(0),null);
 assert.equal(rowBodyFocusDistance(NaN),null);
 r.rowHoverLevels=new Map([['earth',1]]);
 r.vp=vp;r.rowInspectedRadius=()=>100;
 r.setSelected('earth',{focus:true,zoom:true});
 assert.ok(r.camera.desiredDist<100,'hover growth does not cause camera zoom-out');
});

test('v126: outside row mode canvas focus still centers WITHOUT zoom; followed row picks do zoom',()=>{
 const normal=renderer();
 normal.setSelected('earth',{focus:true,zoom:false});
 assert.deepEqual(normal.camera.desiredTarget,[5,0,0]);
 assert.equal(normal.camera.desiredDist,40);
 const followed=renderer({row:true,followEnabled:true});
 followed.setSelected('earth',{focus:true,zoom:true});
 assert.equal(followed.followedBodyId,'earth');
 assert.ok(followed.camera.desiredDist<40);
 assert.deepEqual(followed.camera.desiredTarget,[5,0,0]);
 assert.equal(followed.followEnabled,true);
});

test('v126: canvas click requests zoom only in the row; catalog remains independently zoomable',async()=>{
 const src=await read('src/app/runtime.js');
 assert.match(src,/onSelect:id=>selectBody\(id,true,\{zoom:renderer\?\.settings\?\.row===true\}\)/);
});

test('v126: click zone reaches the actual large sphere in both regular and row view',()=>{
 for(const row of [false,true]){
  const r=pickScene(5,{row});
  const area=projectedHitArea([0,0,0],vp,800,600,5);
  assert.ok(area.radiusPx>90);
  assert.equal(r.pick(400+Math.floor(area.radiusPx-8),300),'earth');
  assert.deepEqual(r.calls,['earth']);
  assert.equal(r.pick(400+Math.ceil(area.hitRadiusPx+6),300),null);
 }
});

test('v126: temporary hover enlargement increases click radius, not only the scanner',()=>{
 const r=pickScene(.5,{row:true});
 r.rowInspectedRadius=()=>7;
 const area=projectedHitArea([0,0,0],vp,800,600,7);
 assert.ok(area.radiusPx>160);
 assert.equal(r.pick(550,300),'earth');
 r.rowInspectedRadius=(_body,ordinary)=>ordinary;
 assert.equal(r.pick(550,300),null);
});

test('v126: cropped sphere is clickable even with its center far outside viewport',()=>{
 const r=pickScene(9,{row:true,position:[-1.7,0,0]});
 const center=projected([-1.7,0,0],vp,800,600);
 assert.equal(center.visible,false);
 assert.ok(center.x<0);
 assert.equal(r.pick(30,300),'earth');
 assert.equal(r.pick(760,300),null);
});

test('v126: the apparent silhouette grows faster than r/depth when a sphere is near the camera',()=>{
 const area=projectedHitArea([0,0,0],vp,800,600,14);
 const approximate=14*600/(2*Math.tan(CAMERA_FOV/2)*20);
 assert.ok(area.radiusPx>approximate*1.35);
 const r=pickScene(14);
 assert.equal(r.pick(400+Math.round(approximate*1.2),300),'earth');
});

test('v126: tiny objects retain an easy 12px target; selected visual enlargement counts',()=>{
 const r=pickScene(.00001);
 assert.equal(r.pick(411,300),'earth');
 assert.equal(r.pick(414,300),null);
 const selected=projectedHitArea([0,0,0],vp,800,600,2,{selected:true});
 const normal=projectedHitArea([0,0,0],vp,800,600,2);
 assert.ok(selected.radiusPx>normal.radiusPx);
 assert.ok(selected.hitRadiusPx>normal.hitRadiusPx);
});

test('v126: very close row camera projection remains selectable',()=>{
 const nearVP=new Float32Array([.001,0,0,0, 0,.001,0,0, 0,0,1,0, 0,0,0,.001]);
 const r=pickScene(.0002,{row:true});r.vp=nearVP;
 const area=projectedHitArea([0,0,0],nearVP,800,600,.0002);
 assert.ok(area.radiusPx>90);
 assert.equal(r.pick(510,300),'earth');
});

test('v126: enlarged row sphere remains hovered across visible footprint beyond 92px',()=>{
 const r=pickScene(.5,{row:true});
 r.bodies=[earth];r.rowHoveredId='earth';r.rowRenderedRadiusPx=()=>180;
 r.shouldDraw=()=>true;
 r.rowPointer={x:560,y:300};
 assert.equal(rowHoveredBody(r,r.rowPointer)?.id,'earth');
 r.rowHoveredId=null;
 assert.equal(rowHoveredBody(r,r.rowPointer),null);
});
