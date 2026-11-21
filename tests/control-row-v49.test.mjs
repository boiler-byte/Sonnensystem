import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {createViewSettings} from '../src/data/layers.js';
import {displayBodyRadius} from '../src/data/orbital-math.js';
import {rowLayout,rowCameraFrame} from '../src/renderer/transitions.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {layoutSceneLabels,rowLabelSide} from '../src/renderer/labels.js';
import {CAMERA_FOV} from '../src/renderer/math.js';

const body=id=>INITIAL_BODIES.find(b=>b.id===id);
const ids=['sun','jupiter','saturn','uranus','neptune','earth','venus','mars'];
const bodies=ids.map(body);
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<=Math.max(1e-10,Math.abs(b)*1e-8),`${msg}: ${a} vs ${b}`);

function scene(settings,planetId=null,selectedBodies=bodies){
  const r=Object.create(SolarRenderer.prototype);
  r.bodies=selectedBodies;r.byId=new Map(selectedBodies.map(b=>[b.id,b]));
  r.settings=settings;r.planetId=planetId;r.fourMoonIds=new Set();
  r.positions=new Map();r.overrides=new Map();r.transition=null;
  r.width=1050;r.height=760;
  r.simTime=Date.UTC(2026,10,18);
  return r;
}

test('v55: AR, Cinema, three scale controls and Layer/Time fit the responsive toolbar',async()=>{
 const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
 const v55=css;
 assert.match(v55,/--control-main-scale-width:46px/);
 assert.match(v55,/--control-icon-width:43px/);
 assert.match(v55,/flex-wrap:wrap/);
 assert.match(v55,/\.scale-main-controls\{/);
 assert.match(v55,/\.viewport>\.control-panel \.layer-popover\{width:140px/);
 assert.match(v55,/@media\(max-width:770px\)/);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 for(const id of ['ar-mode-btn','cinema-btn','scale-objects-btn','scale-orbits-btn','orbit-row-btn','layer-btn'])
  assert.match(html,new RegExp(`id="${id}"`));
 assert.doesNotMatch(html,/id="scale-btn"|id="scale-popover"|id="speed-btn"|id="speed-popover"/);
});

test('v49: row gap between first and second is unchanged, subsequent gaps are 30% larger',()=>{
  for(const settings of [{scaleObjects:false},{scaleObjects:true,scaleOrbits:false},{scaleObjects:true,scaleOrbits:true}]){
    const layout=rowLayout(bodies,b=>displayBodyRadius(b,settings));
    for(let i=0;i<layout.gaps.length;i++){
      const a=layout.radii.get(layout.ids[i]),b=layout.radii.get(layout.ids[i+1]);
      const old=Math.max(.000005,Math.min(.8,.14*(a+b)));
      near(layout.gaps[i],old*(i===0?1:1.30),`gap ${i}`);
    }
    assert.deepEqual(layout.ids,ids,'physical ordering never changes');
  }
});

test('v49: Saturn visual ring envelope avoids overlap with both neighbors in every scale mode',()=>{
  for(const settings of [createViewSettings('solar'),
    {...createViewSettings('solar'),scaleObjects:true},
    {...createViewSettings('solar'),scaleObjects:true,scaleOrbits:true}]){
    settings.row=true;
    const r=scene(settings);
    const layout=r.rowGeometry();
    const outer=1.2*r.targetRingScale();
    assert.ok(layout.footprints.get('saturn')>=outer-1e-12);
    assert.ok(layout.footprints.get('saturn')>layout.radii.get('saturn'),'rings expand the footprint');
    const saturnIndex=layout.ids.indexOf('saturn');
    for(const neighborIndex of [saturnIndex-1,saturnIndex+1]){
      const neighbor=layout.ids[neighborIndex];
      const sep=Math.abs(layout.positions.get('saturn')[0]-layout.positions.get(neighbor)[0]);
      const gap=layout.gaps[Math.min(saturnIndex,neighborIndex)];
      near(sep,layout.footprints.get('saturn')+layout.footprints.get(neighbor)+gap,'non-overlapping rings');
    }
    const frame=rowCameraFrame(layout,1050,760);
    assert.ok(frame.distance>0 && frame.target.every(Number.isFinite));
    near((layout.positions.get('sun')[0]+layout.radii.get('sun')-frame.left)/(2*layout.radii.get('sun')),.12,'sun remains cropped');
  }
});

test('v49: Saturn in isolated planetary view also reserves ring space, not just the globe',()=>{
  const children=['saturn','titan','rhea','iapetus'].map(body).filter(Boolean);
  const settings=createViewSettings('planet');settings.row=true;settings.scaleObjects=true;
  const r=scene(settings,'saturn',children);
  const layout=r.rowGeometry();
  assert.equal(layout.ids[0],'saturn');
  assert.ok(layout.footprints.get('saturn')>layout.radii.get('saturn')*2);
  assert.ok(layout.positions.get(layout.ids[1])[0]-layout.positions.get('saturn')[0]
    >=layout.footprints.get('saturn')+layout.footprints.get(layout.ids[1]));
});

test('v49: row labels alternate above/below by physical order, including Saturn ring clearance',()=>{
  assert.deepEqual([0,1,2,3].map(rowLabelSide),['above','below','above','below']);
  assert.equal(rowLabelSide(undefined),null);
  const mockBodies=ids.slice(0,4).map(body);
  const ctx={font:'',measureText:text=>({width:text.length*7})};
  const VP=new Float32Array([20,0,0,0,0,20,0,0,0,0,1,0,0,0,0,20]);
  const r={width:960,height:600,rendered:mockBodies,
    positions:new Map(mockBodies.map((b,i)=>[b.id,[i*.38-.56,0,0]])),
    settings:{row:true,labels:true,fourMoons:false},planetId:null,selectedId:'earth',
    _rowLabelOrder:new Map(mockBodies.map((b,i)=>[b.id,i])),
    bodyRadius:()=>.06,ringScale:()=>.5};
  const layout=layoutSceneLabels(r,VP,ctx,0);
  assert.deepEqual(Object.fromEntries(layout.map(l=>[l.body.id,l.side])),{
    sun:'above',jupiter:'below',saturn:'above',uranus:'below'});
  const saturnLabel=layout.find(x=>x.body.id==='saturn');
  const projectedOuter=.6*600/(2*Math.tan(CAMERA_FOV/2)*20);
  assert.ok(saturnLabel.radius>=projectedOuter-.00001,'ring, not sphere, sets projected clearance');
  assert.ok(saturnLabel.rect.y+saturnLabel.rect.h < saturnLabel.projection.y-projectedOuter,'label clears ring');
  // Switching out of Reihe resets the stored above/below anchors.
  r.settings.row=false;
  const ordinary=layoutSceneLabels(r,VP,ctx,200);
  assert.equal(ordinary[0].side,'right');
});

test('v49: renderer remembers stable row indices and clears them on exit',()=>{
  const s=createViewSettings('solar');s.row=true;
  const r=scene(s);r.calcPositions(r.simTime);
  assert.equal(r._rowLabelOrder.get('sun'),0);
  assert.equal(r._rowLabelOrder.get('saturn'),2);
  s.row=false;r.calcPositions(r.simTime);
  assert.equal(r._rowLabelOrder,null);
});
