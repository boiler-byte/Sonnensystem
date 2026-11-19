import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {createViewSettings,layerPreset} from '../src/data/layers.js';
import {cameraView} from '../src/renderer/camera.js';
import {projected,CAMERA_FOV} from '../src/renderer/math.js';
import {ROW_INSPECTION_DIAMETER_PX,rowHoveredBody,rowInspectionRadius,rowArrowGeometry,
  rowParentDistance,formatRowParentDistance,rowInspectionMetrics} from '../src/renderer/row-inspection.js';
import {updateRowInspectionHUD} from '../src/ui/row-inspection.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const body=id=>INITIAL_BODIES.find(b=>b.id===id);
function sampleRenderer(view='solar'){
 const r=Object.create(SolarRenderer.prototype);
 r.settings=createViewSettings(view);r.settings.row=true;r.settings.scaleObjects=true;r.settings.scaleOrbits=false;
 r.settings.layers=layerPreset('all',view);r.settings.fourMoons=false;r.settings.rowOrder='distance';
 r.planetId=view==='planet'?'earth':null;
 r.bodies=(view==='planet'?['earth','moon']:['sun','mercury','venus','earth','mars','jupiter'])
  .map(body).filter(Boolean);
 r.byId=new Map(r.bodies.map(b=>[b.id,b]));r.fourMoonIds=new Set();
 r.width=1100;r.height=740;r.positions=new Map();r.overrides=new Map();r.simTime=Date.UTC(2026,10,19);
 r.camera={theta:0,phi:Math.PI/2,dist:12,desiredDist:12,target:[0,0,0],desiredTarget:[0,0,0]};
 r.followEnabled=false;r.focusedBodyId=null;r.selectedId='earth';r.cameraManuallyMoved=false;
 r.transitionsEnabled=true;r.transition=null;r.cinema=null;r.rowHoveredId=null;r.rowHoverLevels=new Map();
 r.rowHoverFrameAt=null;r.rowHoverStartedAt=0;r.rowPointer=null;
 r.calcPositions(r.simTime);
 const frame=r.rowFrame();r.camera.dist=frame.distance;r.camera.desiredDist=frame.distance;
 r.camera.target=frame.target.slice();r.camera.desiredTarget=frame.target.slice();
 r.vp=cameraView(r.camera,r.width,r.height).vp;
 return r;
}

function findVisible(r){
 for(const id of r.rowGeometry().ids){
  const b=r.byId.get(id),p=projected(r.positions.get(id),r.vp,r.width,r.height);
  if(b.parentId && p?.visible && p.x>80 && p.x<r.width-100)return {b,p};
 }
 throw Error('No inspectable child appears within test viewport');
}

test('v78: hover targets the actual WebGL row projection, not a 160px invisible hotspot',()=>{
 const r=sampleRenderer();const {b,p}=findVisible(r);
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y})?.id,b.id);
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y-180}),null);
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y+180}),null);
 r.settings.row=false;
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y}),null,'ordinary orbit mode has no row scan');
 r.settings.row=true;r.cinema={active:true};
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y}),null,'Cinema disables scanning');
 r.cinema=null;r.transition={kind:'row'};
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y}),null,'layout transitions do not scan moving silhouettes');
 r.transition=null;r.camera.arView={forward:[0,0,-1]};
 assert.equal(rowHoveredBody(r,{x:p.x,y:p.y}),null,'AR cannot accidentally activate mouse scan');
});

test('v78: a large central planet cropped at the left edge can be scanned on its visible silhouette',()=>{
 const r=sampleRenderer('planet');
 const jupiter=r.byId.get('earth');
 const center=projected(r.positions.get(jupiter.id),r.vp,r.width,r.height);
 const radius=r.bodyRadius(jupiter)*r.height/(2*Math.tan(CAMERA_FOV/2)*center.depth);
 assert.ok(center.x<0,'the leading central body is deliberately cropped');
 assert.ok(center.x+radius>0,'its bright edge still enters the viewport');
 const x=Math.min(28,(center.x+radius)*.5);
 assert.equal(rowHoveredBody(r,{x,y:center.y})?.id,jupiter.id);
 r.setRowPointer({x,y:center.y});r.advanceRowInspection(r.vp,100);
 assert.equal(r.rowHoveredId,jupiter.id);
});

test('v78: a small sphere grows continuously to a real 160 CSS pixel diameter, without altering its layout',()=>{
 const r=sampleRenderer();const {b,p}=findVisible(r);
 const beforePositions=r.rowGeometry().ids.map(id=>[id,r.positions.get(id)[0]]);
 const base=r.bodyRadius(b);
 const depth=p.depth, height=r.height;
 const half=rowInspectionRadius(base,depth,height,.5),full=rowInspectionRadius(base,depth,height,1);
 assert.ok(full>=base);
 assert.ok(half>=base && half<=full);
 const radius=full*height/(2*Math.tan(CAMERA_FOV/2)*depth);
 assert.ok(radius*2>=ROW_INSPECTION_DIAMETER_PX-.0001,'160px measured from actual perspective projection');
 const xPositions=r.rowGeometry().ids.map(id=>[id,r.positions.get(id)[0]]);
 assert.deepEqual(xPositions,beforePositions,'only the rendered sphere is magnified, never the row geometry');
});

test('v78: hover magnification eases in, reverts on exit and does not pick beyond the UI halo',()=>{
 const r=sampleRenderer();const {b,p}=findVisible(r);
 r.setRowPointer({x:p.x,y:p.y});r.advanceRowInspection(r.vp,100);
 assert.equal(r.rowHoveredId,b.id);assert.ok(r.rowHoverLevels.get(b.id)>0);
 const first=r.rowInspectedRadius(b,r.bodyRadius(b));
 r.advanceRowInspection(r.vp,200);
 assert.ok(r.rowInspectedRadius(b,r.bodyRadius(b))>first);
 r.setRowPointer(null);r.advanceRowInspection(r.vp,300);
 assert.equal(r.rowHoveredId,null);
 const fading=r.rowHoverLevels.get(b.id);
 assert.ok(fading>0 && fading<1,'sphere fades instead of collapsing instantly');
 r.advanceRowInspection(r.vp,1000);r.advanceRowInspection(r.vp,1100);
 assert.ok((r.rowHoverLevels.get(b.id)||0)<fading);
});

test('v78: parent-directed arrow begins under the hovered sphere and travels toward center',()=>{
 const r=sampleRenderer();const {b,p}=findVisible(r);
 const center=r.positions.get('sun');
 const arrow=rowArrowGeometry(b,r.positions.get(b.id),center,r.vp,r.width,r.height,80);
 assert.ok(arrow);assert.ok(arrow.y>p.y+80);
 const parent=projected(center,r.vp,r.width,r.height);
 assert.equal(arrow.direction,Math.sign(parent.x-p.x)||1);
 assert.equal(Math.sign(arrow.tipX-arrow.x),arrow.direction);
 assert.ok(arrow.labelY>arrow.y,'label is below the hovered body');
 assert.equal(rowArrowGeometry(r.byId.get('sun'),center,center,r.vp,r.width,r.height,80),null);
 const local=sampleRenderer('planet'),{b:moon}=findVisible(local);
 assert.ok(rowArrowGeometry(moon,local.positions.get('moon'),local.positions.get('earth'),local.vp,local.width,local.height,80));
});

test('v78: distances are scientific parent distances with the <=0.2 AE unit rule',()=>{
 const sun=body('sun'),earth=body('earth'),moon=body('moon');
 assert.equal(formatRowParentDistance(sun),'—');
 assert.match(formatRowParentDistance(earth),/AE$/);
 assert.match(formatRowParentDistance(moon),/km$/);
 assert.equal(formatRowParentDistance({...earth,meanDistanceToParent:.2,meanDistanceUnit:'AU'}).endsWith('km'),true);
 assert.equal(formatRowParentDistance({...earth,meanDistanceToParent:.200001,meanDistanceUnit:'AU'}).endsWith('AE'),true);
 assert.equal(formatRowParentDistance({...earth,meanDistanceToParent:null,a:0}), '—');
 assert.equal(rowParentDistance({...earth,meanDistanceToParent:-1}),null);
});

test('v78: the scanner uses real size, gravity and Celsius values, never guesses blanks',()=>{
 const earth=body('earth'),sun=body('sun');
 const result=rowInspectionMetrics(earth);
 assert.match(result.diameter,/km$/);
 assert.match(result.gravity,/G$/);
 assert.match(result.temperature,/°C$/);
 const empty=rowInspectionMetrics({...earth,radiusKm:null,surfaceGravityMs2:null,temperatureMeanK:null,temperatureK:undefined});
 assert.equal(empty.diameter,'—');assert.equal(empty.gravity,'—');assert.equal(empty.temperature,'—');
 assert.equal(rowInspectionMetrics(sun).distance,'—');
});

test('v78: row inspector has a pointer-transparent overlay, screen-sized SVG arrow and reduced-motion fallback',async()=>{
 const [html,css,js,controls,loop,sw]=await Promise.all([
  'index.html','css/styles.css','src/ui/row-inspection.js','src/renderer/controls.js',
  'src/app/animation-loop.js','sw.js'].map(file=>readFile(new URL('../'+file,import.meta.url),'utf8')));
 for(const id of ['row-inspection','row-inspection-scanner','row-inspection-panel',
  'row-inspection-vector-line','row-inspection-vector-head','row-inspection-distance-value',
  'row-inspection-diameter','row-inspection-gravity','row-inspection-temperature']){
  assert.match(html,new RegExp(`id="${id}"`));
 }
 assert.match(css,/\.row-inspection\{[^}]*pointer-events:none/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(controls,/pointerType==='mouse'\|\|e\.pointerType==='pen'/);
 assert.match(controls,/pointerleave/);
 assert.match(loop,/updateRowInspectionHUD\(renderer,now\)/);
 assert.match(sw,/src\/ui\/row-inspection\.js/);
 assert.match(sw,/src\/renderer\/row-inspection\.js/);
 assert.match(js,/rowArrowGeometry/);
});

test('v78: SVG vector grows from hovered body origin and HUD restores on leaving row mode',()=>{
 const r=sampleRenderer();const {b,p}=findVisible(r);
 r.setRowPointer({x:p.x,y:p.y});r.advanceRowInspection(r.vp,100);
 const ids=['row-inspection','row-inspection-scanner','row-inspection-panel','row-inspection-name',
  'row-inspection-diameter','row-inspection-gravity','row-inspection-temperature','row-inspection-scan-tag','row-inspection-id',
  'row-inspection-vector-svg','row-inspection-vector-line','row-inspection-vector-head',
  'row-inspection-vector-origin','row-inspection-distance','row-inspection-distance-value'];
 const nodes=new Map(ids.map(id=>[id,{
  hidden:true,dataset:{},style:{},attributes:{},textContent:'',offsetWidth:100,
  classList:{classes:new Set(),add(s){this.classes.add(s)},remove(s){this.classes.delete(s)}},
  setAttribute(name,value){this.attributes[name]=value},
  removeAttribute(name){delete this.attributes[name]},
  hasAttribute(name){return Object.hasOwn(this.attributes,name)}
 }]));
 const previous=globalThis.document;
 globalThis.document={getElementById:id=>nodes.get(id)};
 try{
  updateRowInspectionHUD(r,100);
  assert.equal(nodes.get('row-inspection').hidden,false);
  assert.equal(nodes.get('row-inspection-name').textContent,b.name);
  const line=nodes.get('row-inspection-vector-line');
  const atStart=line.attributes.d;
  updateRowInspectionHUD(r,700);
  const end=line.attributes.d;
  assert.ok(atStart && end && end!==atStart,'the vector extends over time without changing the body');
  assert.ok(nodes.get('row-inspection-distance-value').textContent.includes('AE'));
  r.settings.row=false;
  updateRowInspectionHUD(r,800);
  assert.equal(nodes.get('row-inspection').hidden,true);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
