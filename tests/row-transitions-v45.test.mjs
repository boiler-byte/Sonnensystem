import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {createViewSettings} from '../src/data/layers.js';
import {rowLayout, rowFrameDistance, rubberEase, blendPosition,LAYOUT_TRANSITION_MS} from '../src/renderer/transitions.js';
import {displayBodyRadius,displayOrbitRadius,keplerPosition} from '../src/data/orbital-math.js';
import {SolarRenderer} from '../src/renderer/index.js';
const byId=id=>INITIAL_BODIES.find(b=>b.id===id);
const near=(got,want,label)=>assert.ok(Math.abs(got-want)<1e-8*Math.max(1,Math.abs(want)),`${label}: ${got} vs ${want}`);
const time=Date.UTC(2026,10,18);

function renderer(ids=['sun','earth','jupiter','mars','moon'],settings=createViewSettings('solar')){
  const r=Object.create(SolarRenderer.prototype);
  r.settings=settings;r.bodies=ids.map(byId);
  r.byId=new Map(r.bodies.map(b=>[b.id,b]));
  r.fourMoonIds=new Set(['moon']);r.planetId=null;
  r.width=1150;r.height=760;r.positions=new Map();r.overrides=new Map();r.simTime=time;
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.followEnabled=false;r.focusedBodyId=null;r.selectedId='earth';r.cameraManuallyMoved=false;
  r.transitionsEnabled=true;r.transition=null;
  r.calcPositions(time);
  return r;
}

test('v55: Reihe remains third always-visible scale button with accessible label and three dots',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const controls=html.slice(html.indexOf('class="scale-main-controls"'),html.indexOf('id="layer-picker-wrap"'));
 const a=controls.indexOf('id="scale-objects-btn"'),b=controls.indexOf('id="scale-orbits-btn"'),c=controls.indexOf('id="orbit-row-btn"');
 assert.ok(a>=0&&a<b&&b<c,'row appears as third top-level scale option');
 assert.match(controls.slice(c),/<span class="scale-option-label">Reihe<\/span>/);
 assert.match(controls,/id="orbit-row-btn"[^>]*aria-label="Reihe[^>]*aria-pressed="false"/);
 assert.match(controls,/class="row-order-icon"[\s\S]*?cx="5\.5"[^>]*r="4\.1"[\s\S]*?cx="14\.5"[^>]*r="2\.7"[\s\S]*?cx="21"[^>]*r="1\.15"/);
 const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
 assert.match(css,/\.viewport>\.control-panel \.scale-main-controls\{/);
 const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
 assert.match(app,/\$\('orbit-row-btn'\)\.addEventListener\('click',updateRow\)/);
 for(const view of ['solar','planet'])assert.equal(createViewSettings(view).row,false);
});

test('v45: row geometry is descending by physical radius, centered and has no overlap',()=>{
  const bodies=['earth','sun','mars','jupiter'].map(byId);
  const layout=rowLayout(bodies,b=>displayBodyRadius(b,{scaleObjects:false}));
  assert.deepEqual(layout.ids,['sun','jupiter','earth','mars']);
  const sizes=layout.ids.map(id=>displayBodyRadius(byId(id),{scaleObjects:false}));
  for(let i=1;i<layout.ids.length;i++){
    const separation=layout.positions.get(layout.ids[i])[0]-layout.positions.get(layout.ids[i-1])[0];
    assert.ok(separation>=sizes[i-1]+sizes[i]+layout.gap-1e-10,'no sphere overlaps');
  }
  const first=layout.positions.get(layout.ids[0])[0]-sizes[0];
  const last=layout.positions.get(layout.ids.at(-1))[0]+sizes.at(-1);
  near(first,-layout.width/2,'left bound');near(last,layout.width/2,'right bound');
  assert.ok(rowFrameDistance(layout,360,780)>rowFrameDistance(layout,1150,760),'mobile framing zooms out');
});

test('v45: Reihe positions all visible solar bodies and isolated planet children',()=>{
  const s=createViewSettings('solar');s.row=true;
  const r=renderer(['sun','earth','jupiter','mars'],s);
  assert.deepEqual(r.rowGeometry().ids,['sun','jupiter','earth','mars']);
  const sorted=r.rowGeometry().ids.map(id=>r.positions.get(id)[0]);
  assert.deepEqual(sorted,[...sorted].sort((a,b)=>a-b));
  for(const point of r.positions.values())assert.equal(point[1],0,'row planar y=0');
  for(const point of r.positions.values())assert.equal(point[2],0,'row planar z=0');
  assert.ok(r.solarOverviewDistance()>0 && r.solarOverviewDistance()<12,'new close-up row framing zooms in');
  s.row=false;r.calcPositions(time);
  assert.notDeepEqual(r.positions.get('earth'),[sorted[2],0,0],'turn off restores Kepler positions');
  const p=createViewSettings('planet');p.row=true;
  const local=renderer(['earth','moon'],p);
  local.planetId='earth';local.calcPositions(time);
  assert.deepEqual(local.rowGeometry().ids,['earth','moon']);
  assert.ok(local.positions.get('earth')[0]<local.positions.get('moon')[0]);
  assert.equal(local.positions.get('moon')[2],0);
});

test('v45: rubber easing overshoots lightly and settles with no start/end discontinuity',()=>{
  near(rubberEase(0),0,'start');near(rubberEase(1),1,'end');
  const amount=rubberEase(.75);
  assert.ok(amount>1&&amount<1.06,`small bounce: ${amount}`);
  assert.deepEqual(blendPosition([1,2,3],[5,6,7],0),[1,2,3]);
  assert.deepEqual(blendPosition([1,2,3],[5,6,7],1),[5,6,7]);
});

test('v45: schema-to-scale transition interpolates body, orbit and position together',()=>{
  const s=createViewSettings('solar');const r=renderer(['sun','earth','jupiter','mars'],s);
  const before={radius:r.bodyRadius(byId('sun')),orbit:r.orbitRadius(byId('earth'),byId('sun')),
    earth:r.positions.get('earth').slice(),saturnRing:r.ringScale()};
  const start=performance.now();r.beginTransition('scale',start);
  s.scaleObjects=true;
  r.calcPositions(time);
  near(r.bodyRadius(byId('sun')),before.radius,'starting sun radius');
  near(r.orbitRadius(byId('earth'),byId('sun')),before.orbit,'starting orbit');
  r.positions.get('earth').forEach((x,i)=>near(x,before.earth[i],'starting position '+i));
  const amount=rubberEase(.5);r.advanceTransition(start+LAYOUT_TRANSITION_MS/2);r.calcPositions(time);
  near(r.bodyRadius(byId('sun')),before.radius+(displayBodyRadius(byId('sun'),s)-before.radius)*amount,'in-flight sun radius');
  near(r.orbitRadius(byId('earth'),byId('sun')),before.orbit+(displayOrbitRadius(byId('earth'),byId('sun'),s)-before.orbit)*amount,'in-flight orbit');
  const final=keplerPosition(byId('earth'),byId('sun'),time,null,displayOrbitRadius(byId('earth'),byId('sun'),s));
  r.positions.get('earth').forEach((x,i)=>near(x,before.earth[i]+(final[i]-before.earth[i])*amount,'in-flight position '+i));
  assert.ok(r.ringScale()>0 && r.ringScale()!==before.saturnRing);
  r.advanceTransition(start+LAYOUT_TRANSITION_MS+1);r.calcPositions(time);
  assert.equal(r.transition,null);
  near(r.bodyRadius(byId('sun')),displayBodyRadius(byId('sun'),s),'finished sun radius');
  near(r.orbitRadius(byId('earth'),byId('sun')),displayOrbitRadius(byId('earth'),byId('sun'),s),'finished orbit');
  r.positions.get('earth').forEach((x,i)=>near(x,final[i],'finished earth '+i));
});

test('v45: row toggle animates from orbit to row and fades orbits; interruption stays continuous',()=>{
  const s=createViewSettings('solar');const r=renderer(['sun','earth','jupiter','mars'],s);
  const before=r.positions.get('sun').slice(),start=performance.now();
  r.beginTransition('row',start);s.row=true;
  r.calcPositions(time);assert.deepEqual(r.positions.get('sun'),before);
  near(r.orbitOpacity(),1,'initial orbit strokes');
  r.advanceTransition(start+LAYOUT_TRANSITION_MS/2);r.calcPositions(time);
  assert.ok(r.orbitOpacity()>0&&r.orbitOpacity()<1);
  const halfway=r.positions.get('sun').slice(), halfwayOpacity=r.orbitOpacity();
  const startAgain=performance.now();r.beginTransition('row',startAgain);
  s.row=false;r.calcPositions(time);
  assert.deepEqual(r.positions.get('sun'),halfway,'rapidly reversing toggle does not teleport');
  near(r.orbitOpacity(),halfwayOpacity,'orbit opacity is continuous when reversing row');
  r.advanceTransition(startAgain+LAYOUT_TRANSITION_MS+1);r.calcPositions(time);
  assert.equal(r.orbitOpacity(),1);
  assert.deepEqual(r.positions.get('sun'),before);
});

test('v45: live planet and solar view changes animate positions without teleporting camera',()=>{
  const r=renderer(['sun','earth','moon','jupiter'],createViewSettings('solar'));
  const earthBefore=r.positions.get('earth').slice(),oldDist=r.camera.dist;
  r.showPlanetSystem('earth');
  assert.equal(r.planetId,'earth');
  assert.equal(r.camera.dist,oldDist,'camera distance is not hard-cut at view switch');
  assert.deepEqual(r.positions.get('earth'),earthBefore,'transition begins at previous global planet position');
  assert.notEqual(r.camera.desiredDist,oldDist,'camera starts animated zoom');
  const t=r.transition.at;r.advanceTransition(t+LAYOUT_TRANSITION_MS+1);r.calcPositions(time);
  assert.deepEqual(r.positions.get('earth'),[0,0,0]);
  r.reset();
  assert.equal(r.planetId,null);
  assert.deepEqual(r.positions.get('earth'),[0,0,0],'return starts at current local coordinates');
  r.advanceTransition(r.transition.at+LAYOUT_TRANSITION_MS+1);r.calcPositions(time);
  assert.deepEqual(r.positions.get('earth'),earthBefore,'return ends at solar orbit');
});

test('v45: animated layout never trips too-fast follow cutoff; manual camera movement wins',()=>{
  const s=createViewSettings('solar'),r=renderer(['sun','earth','jupiter'],s);
  r.followEnabled=true;r.followedBodyId='earth';r.followLastPosition=r.positions.get('earth').slice();
  r.followLastAtMs=performance.now()-16;
  const t=performance.now();r.beginTransition('scale',t);s.scaleObjects=true;
  r.advanceTransition(t+LAYOUT_TRANSITION_MS*.8);r.calcPositions(time);
  r.updateFollowTarget(t+LAYOUT_TRANSITION_MS*.8);
  assert.equal(r.followEnabled,true,'transition movement is not real orbital velocity');
  r.transition.cameraTo=[0,1.5];r.markCameraMoved();
  assert.equal(r.transition.cameraTo,null,'manual mouse rotation interrupts camera-angle animation');
});

test('v45: reduced-motion users do not receive layout spring transitions',()=>{
  const original=globalThis.window;
  try{
    globalThis.window={matchMedia:()=>({matches:true})};
    const r=renderer(['sun','earth']);
    assert.equal(r.canAnimateLayout(),false);
    r.beginTransition('scale');
    assert.equal(r.transition,null);
  }finally{
    if(original===undefined)delete globalThis.window;
    else globalThis.window=original;
  }
});
