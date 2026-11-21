import {syncToggleState} from '../src/ui/control-state.js';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createViewSettings } from '../src/data/layers.js';
import { displayBodyRadius } from '../src/data/orbital-math.js';
import { rowLayout, LAYOUT_TRANSITION_MS } from '../src/renderer/transitions.js';
import { cinemaEligible,cinemaTrack,cinemaTargetAt,cinemaObjectAt,cinemaClock,CINEMA_ENTRY_MS,CINEMA_END_HOLD_MS } from '../src/renderer/cinema.js';
import { SolarRenderer } from '../src/renderer/index.js';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';
const fixtureIds=['sun','earth','jupiter','mars','moon','mercury','saturn'];
const near=(actual,expected,message='value')=>assert.ok(Math.abs(actual-expected)<1e-7*Math.max(1,Math.abs(expected)),`${message}: ${actual} != ${expected}`);

function setup(view='solar'){
 const r=Object.create(SolarRenderer.prototype);
 const s=createViewSettings(view);s.row=true;s.scaleObjects=true;s.scaleOrbits=false;
 r.settings=s;r.planetId=view==='planet'?'earth':null;
 r.bodies=fixtureIds.map(id=>INITIAL_BODIES.find(b=>b.id===id)).filter(Boolean);
 r.byId=new Map(r.bodies.map(body=>[body.id,body]));
 r.width=1150;r.height=650;r.fourMoonIds=new Set(['moon']);
 r.positions=new Map();r.overrides=new Map();r.simTime=Date.UTC(2026,10,18);
 r.camera={theta:.34,phi:1.19,dist:12,desiredDist:12,target:[9,1,2],desiredTarget:[9,1,2]};
 r.followEnabled=false;r.focusedBodyId=null;r.selectedId='earth';r.cameraManuallyMoved=true;
 r.transitionsEnabled=true;r.transition=null;r.cinema=null;r._cinemaRestoreFocus=null;
 r.heldArrows=new Set();
 r.notices=[];r.callbacks={onCinemaChange:info=>r.notices.push(info)};
 r.calcPositions(r.simTime);
 return r;
}

test('v118: Cinema requires only row mode, not any scale switch',()=>{
 for(const view of ['solar','planet']){
  const r=setup(view);assert.equal(cinemaEligible(r.settings),true);
  for(const scaleObjects of [false,true])for(const scaleOrbits of [false,true]){
   r.settings.scaleObjects=scaleObjects;r.settings.scaleOrbits=scaleOrbits;
   assert.equal(cinemaEligible(r.settings),true);
   assert.equal(r.startCinema(100),true);
   assert.equal(r.cinema?.active,true);
   r.stopCinema(200);
  }
  r.settings.row=false;
  assert.equal(cinemaEligible(r.settings),false);
  assert.equal(r.startCinema(300),false);
 }
});

test('v53: ascending ranking uses physical catalog radii, not schematic render sizes',()=>{
 const bodies=fixtureIds.map(id=>INITIAL_BODIES.find(b=>b.id===id)).filter(Boolean);
 const radius=b=>displayBodyRadius(b,{scaleObjects:false});
 const descending=rowLayout(bodies,radius,undefined,'desc');
 const ascending=rowLayout(bodies,radius,undefined,'asc');
 assert.deepEqual(ascending.ids,[...descending.ids].reverse().sort((a,b)=>{
  const ar=bodies.find(x=>x.id===a).radiusKm;
  const br=bodies.find(x=>x.id===b).radiusKm;
  return ar-br||a.localeCompare(b);
 }));
 for(let i=1;i<ascending.ids.length;i++){
  const before=ascending.ids[i-1],after=ascending.ids[i];
  assert.ok(ascending.positions.get(before)[0]<ascending.positions.get(after)[0],'each next body sits further right');
  assert.ok(bodies.find(x=>x.id===before).radiusKm<=bodies.find(x=>x.id===after).radiusKm);
 }
 assert.deepEqual(rowLayout(bodies,radius).ids,descending.ids,'legacy row remains descending');
});

test('v54: physical-size movie track travels left to right with individually framed zooms',()=>{
 const r=setup();const layout=rowLayout(r.bodies,b=>r.targetBodyRadius(b),undefined,'asc');
 const track=cinemaTrack(layout,r.width,r.height);
 assert.equal(cinemaObjectAt(track,0),track.ids[0]);
 assert.equal(cinemaObjectAt(track,1),track.ids.at(-1));
 near(cinemaTargetAt(track,0)[0],track.x[0]);
 near(cinemaTargetAt(track,1)[0],track.x.at(-1));
 for(let i=1;i<=100;i++)assert.ok(cinemaTargetAt(track,i/100)[0]>=cinemaTargetAt(track,(i-1)/100)[0]);
 near(cinemaTargetAt(track,.5)[0],track.x[Math.floor((track.ids.length-1)/2)]);
 assert.ok(track.frames.at(-1).distance>track.frames[0].distance,"large objects are viewed farther away");
 assert.ok(track.durationMs>=18000&&track.durationMs<=150000);
 assert.equal(cinemaClock(0),'00:00');assert.equal(cinemaClock(61000),'01:01');
});

test('v53: start, direct scrub, stop and reverse preserve exact pre-flight camera view',()=>{
 const r=setup(),initial={theta:r.camera.theta,phi:r.camera.phi,dist:r.camera.dist,target:r.camera.target.slice()};
 const defaultOrder=r.rowGeometry().ids;
 const start=1000;
 assert.equal(r.startCinema(start),true);
 assert.equal(r.cinema.active,true);
 assert.equal(r.transition.kind,'cinema');
 assert.equal(r.camera.desiredDist,r.cinema.track.distance);
 assert.deepEqual(r.rowGeometry().ids,[...defaultOrder].reverse().sort((a,b)=>{
  const aa=r.byId.get(a).radiusKm,bb=r.byId.get(b).radiusKm;
  return aa-bb||a.localeCompare(b);
 }));
 assert.deepEqual(r.cinema.track.ids,r.rowGeometry().ids);
 const timelineX=cinemaTargetAt(r.cinema.track,.625)[0];
 assert.equal(r.seekCinema(.625,start+1200),true);
 near(r.camera.target[0],timelineX);near(r.camera.desiredTarget[0],timelineX);
 near(r.cinema.progress,.625);
 r.setCinemaScrubbing(true,start+1200);
 r.advanceCinema(start+2000);
 near(r.cinema.progress,.625,'drag holds progress steady');
 r.setCinemaScrubbing(false,start+2000);
 r.advanceCinema(start+2100);
 assert.ok(r.cinema.progress>.625,'release resumes playback');
 assert.equal(r.stopCinema(start+2200),true);
 assert.equal(r.cinema,null);
 assert.equal(r.transition.kind,'cinema');
 assert.deepEqual(r.rowGeometry().ids,defaultOrder,'descending row restored');
 assert.deepEqual(r.camera.desiredTarget,initial.target,'camera returns to exact start target');
 near(r.camera.desiredDist,initial.dist);
 r.advanceTransition(start+2200+LAYOUT_TRANSITION_MS+1);
 near(r.camera.theta,initial.theta);near(r.camera.phi,initial.phi);
 assert.equal(r.notices.at(0).active,true);assert.equal(r.notices.at(-1).active,false);
 assert.equal(r.stopCinema(start+3300),false,'second stop does nothing');
});

test('v53: camera tour does not jump after backgrounding; it automatically restores when finished',()=>{
 const r=setup();r.startCinema(100);
 const before=r.cinema.progress;
 r.advanceCinema(100+500000);
 assert.equal(r.cinema.progress,before,'a huge hidden-tab delay is capped per frame');
 let now=100+500000;
 const frames=Math.ceil((CINEMA_ENTRY_MS+r.cinema.track.durationMs+CINEMA_END_HOLD_MS+300)/100);
 for(let k=0;k<frames;k++){now+=100;r.advanceCinema(now);}
 assert.equal(r.cinema,null,'finished tour auto-restores normal view');
 assert.deepEqual(r.rowGeometry().ids,setup().rowGeometry().ids);
});

test('v118: manual pan and leaving row end Cinema, but scale values do not',()=>{
 const r=setup();r.startCinema(100);
 r.markCameraMoved({positionChanged:true});assert.equal(r.cinema,null);
 r.startCinema(200);r.settings.scaleObjects=false;r.settings.scaleOrbits=true;r.advanceCinema(300);
 assert.equal(r.cinema?.active,true);
 r.settings.row=false;r.advanceCinema(400);
 assert.equal(r.cinema,null);
});

test('v53: UI contains context-only cinema button and dragable bottom transport',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
 const app=await readAppSource();
 const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 assert.match(html,/id="cinema-btn"[^>]*aria-label="Cinema-Kamerafahrt starten"[^>]*hidden/);
 assert.match(html,/id="cinema-timeline"[^>]*hidden/);
 assert.match(html,/id="cinema-seek"[^>]*type="range"[^>]*min="0"[^>]*max="1000"/);
 assert.match(app,/const available=Boolean\(renderer && S\.settings\.row\)/);
 assert.match(app,/seek\.addEventListener\('pointerdown'/);
 assert.match(app,/seek\.addEventListener\('input'/);
 assert.match(app,/renderer\.startCinema\(\)/);
 assert.match(app,/renderer\.stopCinema\(\)/);
 assert.match(css,/\.viewport>\.cinema-timeline\{[^}]*position:absolute;z-index:12/s);
 assert.match(css,/\.control-panel\.cinema-available\.ar-available/);
 assert.match(sw,/src\/renderer\/cinema\.js/);
});

// The gating hook is also checked with a minimal UI mock (not only text assertions).
test('v53: Cinema button and timeline visibility react to current row and renderer state',async()=>{
 const source=await readAppSource();
 const excerpt=source.slice(source.indexOf('function syncCinemaControl(){'),source.indexOf('function syncOrbitControls(){'));
 const els=new Map();
 const $=id=>{
  if(!els.has(id))els.set(id,{
   hidden:false,value:'',title:'',textContent:'',attributes:{},classFlags:{},
   setAttribute(k,v){this.attributes[k]=v;},
   classList:{toggle(key,value){els.get(id).classFlags[key]=value;}}
  });
  return els.get(id);
 };
 const S={settings:{row:false,scaleObjects:false,scaleOrbits:false}};
 const renderer={cinema:null};
 const ctx=vm.createContext({syncToggleState,$,S,renderer,byId:()=>null,cinemaClock});
 vm.runInContext(excerpt,ctx);
 vm.runInContext('syncCinemaControl()',ctx);
 assert.equal($('cinema-btn').hidden,true);
 S.settings.row=true;S.settings.scaleObjects=false;
 vm.runInContext('syncCinemaControl()',ctx);
 assert.equal($('cinema-btn').hidden,false);
 S.settings.scaleOrbits=true;
 vm.runInContext('syncCinemaControl()',ctx);
 assert.equal($('cinema-btn').hidden,false);
 assert.equal($('cinema-timeline').hidden,true);
 renderer.cinema={active:true};
 vm.runInContext('syncCinemaControl()',ctx);
 assert.equal($('cinema-btn').classFlags.active,true);
 assert.equal($('cinema-btn').attributes['aria-label'],'Cinema-Kamerafahrt stoppen');
 assert.equal($('cinema-timeline').hidden,false);
 vm.runInContext('updateCinemaTimeline({active:true,progress:0.5,durationMs:20000,objectId:"earth"})',ctx);
 assert.equal($('cinema-seek').value,'500');
 assert.equal($('cinema-time').textContent,'00:10 / 00:20');
});
