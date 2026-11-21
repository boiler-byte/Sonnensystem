import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {effectiveSimulationSpeed,ROW_SIMULATION_SPEED,SPEED_MODES} from '../src/ui/timeline.js';
import {createViewSettings} from '../src/data/layers.js';
import {syncRowControl} from '../src/app/animation-controls.js';
import {syncLayers} from '../src/ui/layer-panel.js';
import {S} from '../src/app/state.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {computePositions} from '../src/renderer/scene.js';
import {cinemaTrack,cinemaSceneAt,cinemaEntryOpacity,CINEMA_ENTRY_MS,
 CINEMA_TRAVEL_MS,CINEMA_HOLD_MS} from '../src/renderer/cinema.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);
function simpleTrack(){
 const ids=['mercury','earth','jupiter'];
 const positions=new Map(ids.map((id,i)=>[id,[10+i*200,0,0]]));
 const radii=new Map(ids.map((id,i)=>[id,1+i*10]));
 return cinemaTrack({ids,positions,radii},1200,700);
}

// These are pure operations so source view/speed preferences cannot be lost.
test('v99: only the row overrides simulated time to 30 min per real second',()=>{
 for(const mode of ['solar','planet']){
  const normal=SPEED_MODES[mode].defaultSpeed;
  const settings=createViewSettings(mode);
  const state={speed:normal,settings,modeSpeeds:{solar:13,planet:.5},playing:true};
  close(effectiveSimulationSpeed(state),normal);
  settings.row=true;
  close(effectiveSimulationSpeed(state),1/48);
  close(ROW_SIMULATION_SPEED*86400000,30*60*1000);
  assert.equal(state.speed,normal,'the slider selection is not overwritten');
  assert.deepEqual(state.modeSpeeds,{solar:13,planet:.5},'both scene preferences are retained');
  settings.row=false;
  close(effectiveSimulationSpeed(state),normal);
 }
});

test('v99: UI hides row-only controls and restores them with original layer selections',()=>{
 const prevDoc=globalThis.document,prevSettings=S.settings,prevBodies=S.bodies;
 const nodes=new Map();
 const node=id=>{
  if(!nodes.has(id))nodes.set(id,{id,title:'',hidden:false,attributes:{},
   classList:{toggle(name,on){this[name]=on;}},
   setAttribute(name,value){this.attributes[name]=value;},
   style:{setProperty(){}}});
  return nodes.get(id);
 };
 const checks=['star','planet','moon','dwarf','asteroid','satellite','comet','probe'].map(type=>({
  dataset:{layerType:type},parentElement:{hidden:false,style:{setProperty(){}}},checked:false,disabled:false
 }));
 const presets=['standard','all'].map(mode=>({dataset:{layerPreset:mode},classList:{toggle(){}},setAttribute(){}}));
 globalThis.document={getElementById:node,querySelectorAll:selector=>selector==='[data-layer-type]'?checks:selector==='[data-layer-preset]'?presets:[]};
 try{
  S.settings=createViewSettings('solar');S.bodies=INITIAL_BODIES;
  const selected=S.settings.layers;
  syncLayers();syncRowControl();
  for(const id of ['toggle-labels','orbit-visibility-btn','toggle-four-moons'])assert.equal(node(id).hidden,false);
  assert.equal(node('layer-speed-toggle').disabled,false);
  assert.equal(checks.find(x=>x.dataset.layerType==='moon').parentElement.hidden,false);
  assert.equal(checks.find(x=>x.dataset.layerType==='satellite').parentElement.hidden,false);
  S.settings.row=true;
  syncRowControl();syncLayers();
  for(const id of ['toggle-labels','orbit-visibility-btn','toggle-four-moons'])assert.equal(node(id).hidden,true,id);
  assert.equal(node('layer-speed-toggle').disabled,true,'row mode fixes speed');
  assert.equal(node('layer-speed-panel').hidden,true);
  assert.equal(checks.find(x=>x.dataset.layerType==='moon').parentElement.hidden,true);
  assert.equal(checks.find(x=>x.dataset.layerType==='satellite').parentElement.hidden,true);
  assert.equal(checks.find(x=>x.dataset.layerType==='planet').parentElement.hidden,false);
  assert.equal(node('toggle-lighting').hidden,false,'lighting remains accessible');
  assert.equal(S.settings.layers,selected,'row changes no visibility preferences');
  S.settings.row=false;
  syncRowControl();syncLayers();
  for(const id of ['toggle-labels','orbit-visibility-btn','toggle-four-moons'])assert.equal(node(id).hidden,false,id);
  assert.equal(node('layer-speed-toggle').disabled,false);
  assert.equal(checks.find(x=>x.dataset.layerType==='moon').parentElement.hidden,false);
  assert.equal(checks.find(x=>x.dataset.layerType==='satellite').parentElement.hidden,false);
 }finally{
  if(prevDoc===undefined)delete globalThis.document;else globalThis.document=prevDoc;
  S.settings=prevSettings;S.bodies=prevBodies;
 }
});

test('v104: Cinema travels continuously between stops; only the opening reorder fades',()=>{
 const track=simpleTrack();
 const a=track.frames[0],b=track.frames[1];
 const at=t=>cinemaSceneAt(track,(a.holdEndMs+t*CINEMA_TRAVEL_MS)/track.durationMs);
 const before=at(.25),middle=at(.5),after=at(.75);
 for(const pose of [before,middle,after]){
  assert.equal(pose.holding,false);
  assert.equal(pose.opacity,0,'inter-object travel has no fade');
  assert.ok(pose.target[0]>a.x && pose.target[0]<b.x,'camera moves between bodies');
  assert.ok(pose.distance>a.distance && pose.distance<b.distance,'zoom changes gradually');
 }
 close(middle.target[0],(a.x+b.x)/2);
 close(middle.distance,Math.sqrt(a.distance*b.distance));
 assert.ok(before.target[0]<middle.target[0] && middle.target[0]<after.target[0]);
 assert.equal(cinemaSceneAt(track,a.holdEndMs/track.durationMs).opacity,0);
 assert.equal(cinemaSceneAt(track,b.holdStartMs/track.durationMs).opacity,0);
 assert.equal(cinemaSceneAt(track,1).objectId,'jupiter');
 assert.equal(cinemaEntryOpacity(0),0);
 assert.equal(cinemaEntryOpacity(CINEMA_ENTRY_MS*.5),1);
 assert.equal(cinemaEntryOpacity(CINEMA_ENTRY_MS),0);
});

test('v104: live size-row Cinema fades at entry, flies between objects, then flies back',()=>{
 const r=Object.create(SolarRenderer.prototype),track=simpleTrack();
 r.settings={row:true,scaleObjects:true,scaleOrbits:false};
 r.camera={theta:.6,phi:1.1,dist:800,desiredDist:800,target:[-200,0,0],desiredTarget:[-200,0,0]};
 const saved={target:[-200,0,0],dist:800,theta:.6,phi:1.1,cameraManuallyMoved:false,focusedBodyId:'earth'};
 r.cinema={active:true,reorder:true,paused:false,speed:1,progress:0,elapsedMs:0,lastAt:0,
  lastNoticeAt:0,seeking:false,endedMs:0,saved,track,entrySnapped:false,fadeOpacity:0};
 r.transition={kind:'cinema'};r.callbacks={onCinemaChange(){}};
 r.calcPositions=()=>{};
 r.beginTransition=(kind,at)=>{r.transition={kind,at,duration:980,amount:0,
  cameraFrom:[r.camera.theta,r.camera.phi],cameraTo:null};};
 for(let at=100;at<=500;at+=100)r.advanceCinema(at);
 assert.deepEqual(r.camera.target,saved.target,'entry does not fly through scene');
 assert.equal(r.camera.dist,saved.dist);
 r.advanceCinema(600);
 assert.equal(r.transition,null,'reorder finishes while fully dark');
 assert.deepEqual(r.camera.target,[track.frames[0].x,0,0]);
 close(r.camera.dist,track.frames[0].distance);
 assert.equal(r.cinema.fadeOpacity,1);
 const a=track.frames[0],b=track.frames[1];
 for(const t of [.25,.5,.75]){
  r.cinema.paused=true;
  r.cinema.elapsedMs=CINEMA_ENTRY_MS+a.holdEndMs+t*CINEMA_TRAVEL_MS;
  r.cinema.progress=(a.holdEndMs+t*CINEMA_TRAVEL_MS)/track.durationMs;
  r.advanceCinema(2000+t*100);
  const pose=cinemaSceneAt(track,r.cinema.progress);
  assert.deepEqual(r.camera.target,pose.target);
  close(r.camera.dist,pose.distance);
  assert.equal(r.cinema.fadeOpacity,0);
 }
 r.seekCinema((a.holdEndMs+.25*CINEMA_TRAVEL_MS)/track.durationMs,2800);
 close(r.camera.target[0],cinemaSceneAt(track,r.cinema.progress).target[0]);
 assert.equal(r.stopCinema(3000),true);
 assert.equal(r.cinema,null);
 assert.equal(r.cinemaExit,undefined,'exit uses a layout/camera transition instead of a fade');
 assert.equal(r.transition.kind,'cinema');
 assert.deepEqual(r.camera.desiredTarget,saved.target);
 assert.equal(r.camera.desiredDist,saved.dist);
 assert.deepEqual(r.transition.cameraTo,[saved.theta,saved.phi]);
 r.advanceTransition(3490);
 assert.ok(r.camera.theta>0 && r.camera.theta<saved.theta,'return angle is in flight');
 r.advanceTransition(3990);
 close(r.camera.theta,saved.theta);close(r.camera.phi,saved.phi);
 assert.equal(r.focusedBodyId,saved.focusedBodyId);
 assert.equal(r.transition,null);
});

test('v99: Cinema bypasses unnecessary orbital calculations for invisible objects',()=>{
 const bodies=['sun','earth'].map(id=>INITIAL_BODIES.find(body=>body.id===id));
 const r={bodies,byId:new Map(bodies.map(body=>[body.id,body])),positions:new Map(),overrides:new Map(),
  planetId:null,settings:createViewSettings('solar'),cinema:{active:true}};
 r.settings.row=true;
 computePositions(r,Date.UTC(2026,10,20));
 assert.deepEqual([...r.positions.keys()],['sun']);
 r.cinema=null;r.settings.row=false;
 computePositions(r,Date.UTC(2026,10,20));
 assert.deepEqual([...r.positions.keys()].sort(),['earth','sun']);
});

test('v99: HTML overlay and CSS visibility rules have stable hooks',async()=>{
 const root=new URL('../',import.meta.url);
 const [html,css,loop]=await Promise.all(['index.html','css/styles.css','src/app/animation-loop.js']
  .map(file=>readFile(new URL(file,root),'utf8')));
 assert.match(html,/id="cinema-scene-fade"[^>]*aria-hidden="true"[^>]*hidden/);
 assert.match(css,/\.cinema-scene-fade\{[^}]*pointer-events:none/);
 assert.match(css,/\.layer-options \.layer-option\[hidden\]\{display:none!important\}/);
 assert.match(css,/\.time-panel\[hidden\]/);
 assert.match(loop,/effectiveSimulationSpeed\(S\)/);
 assert.match(loop,/renderer\.cinema\?\.fadeOpacity \?\? 0/);
});
