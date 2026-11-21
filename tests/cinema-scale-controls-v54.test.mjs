import {syncToggleState} from '../src/ui/control-state.js';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createViewSettings} from '../src/data/layers.js';
import {cinemaEligible,cinemaTrack,cinemaPoseAt,CINEMA_HOLD_MS,CINEMA_PLANET_HOLD_MS,CINEMA_TRAVEL_MS} from '../src/renderer/cinema.js';
import {rowLayout} from '../src/renderer/transitions.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=name=>readProjectSource(name);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const bodies=['moon','earth','jupiter','sun'].map(id=>INITIAL_BODIES.find(b=>b.id===id));
const layout=()=>rowLayout(bodies,b=>b.radiusKm/100000,undefined,'asc');
const midpoint=(a,b)=>(a+b)/2;

function renderer(){
 const r=Object.create(SolarRenderer.prototype);
 r.settings=createViewSettings('solar');r.settings.row=true;r.settings.scaleObjects=true;
 r.settings.scaleOrbits=false;r.bodies=bodies;r.byId=new Map(bodies.map(b=>[b.id,b]));
 r.planetId=null;r.width=1150;r.height=700;r.fourMoonIds=new Set(['moon']);
 r.positions=new Map();r.overrides=new Map();r.simTime=Date.UTC(2026,10,18);
 r.camera={theta:.29,phi:1.11,dist:17,desiredDist:17,target:[3,1,-2],desiredTarget:[3,1,-2]};
 r.transition=null;r.transitionsEnabled=true;r.cinema=null;r._cinemaRestoreFocus=null;
 r.heldArrows=new Set();r.selectedId='earth';r.followEnabled=false;r.focusedBodyId=null;
 r.cameraManuallyMoved=false;r.callbacks={};r.calcPositions(r.simTime);
 return r;
}

test('v118: Play is available whenever Reihe is on, independent of both scales',()=>{
 const s={row:true,scaleObjects:true,scaleOrbits:false};
 assert.equal(cinemaEligible(s),true);
 for(const scaleObjects of [false,true])for(const scaleOrbits of [false,true])
  assert.equal(cinemaEligible({...s,scaleObjects,scaleOrbits}),true);
 assert.equal(cinemaEligible({...s,row:false}),false);
});

test('v91: every object type has the same five-second Cinema hold',()=>{
 const t=cinemaTrack(layout(),1150,700,new Map(bodies.map(b=>[b.id,b])));
 assert.equal(t.ids.length,4);
 assert.equal(CINEMA_HOLD_MS,5000);
 assert.equal(CINEMA_PLANET_HOLD_MS,CINEMA_HOLD_MS);
 assert.equal(t.durationMs,4*CINEMA_HOLD_MS+3*CINEMA_TRAVEL_MS);
 for(const frame of t.frames){
  assert.equal(frame.holdEndMs-frame.holdStartMs, 5000);
  const start=cinemaPoseAt(t,(frame.holdStartMs+1)/t.durationMs);
  const middle=cinemaPoseAt(t,(frame.holdStartMs+750)/t.durationMs);
  const ending=cinemaPoseAt(t,(frame.holdEndMs-1)/t.durationMs);
  for(const pose of [start,middle,ending]){
   assert.equal(pose.objectId,frame.id);assert.equal(pose.holding,true);
   close(pose.target[0],frame.x);close(pose.distance,frame.distance);
  }
 }
});

test('v54: zoom adapts to physical radius, moving left to right without jumps',()=>{
 const t=cinemaTrack(layout(),1280,720);
 for(let i=1;i<t.frames.length;i++){
  assert.ok(t.frames[i].radius>t.frames[i-1].radius);
  assert.ok(t.frames[i].distance>t.frames[i-1].distance,'larger objects require wider framing');
  assert.ok(t.frames[i].x>t.frames[i-1].x);
  const a=t.frames[i-1],b=t.frames[i];
  const half=cinemaPoseAt(t,midpoint(a.holdEndMs,a.travelEndMs)/t.durationMs);
  assert.equal(half.holding,false);
  close(half.target[0],midpoint(a.x,b.x));
  close(half.distance,Math.sqrt(a.distance*b.distance));
 }
 let previous=-Infinity;
 for(let i=0;i<=500;i++){
  const pose=cinemaPoseAt(t,i/500);
  assert.ok(Number.isFinite(pose.distance)&&pose.distance>0);
  assert.ok(pose.target[0]>=previous-1e-9);
  previous=pose.target[0];
 }
});

test('v54: portrait viewport keeps each full-sized body framed',()=>{
 const wide=cinemaTrack(layout(),1200,650),portrait=cinemaTrack(layout(),360,740);
 assert.equal(wide.durationMs,portrait.durationMs);
 for(let i=0;i<wide.frames.length;i++){
  assert.equal(wide.frames[i].id,portrait.frames[i].id);
  assert.ok(portrait.frames[i].distance>=wide.frames[i].distance,'portrait should never zoom closer');
 }
});

test('v54: seeking updates zoom and target; stopping restores the pre-film camera and large-first row',()=>{
 const r=renderer();const order=r.rowGeometry().ids;
 const saved={target:r.camera.target.slice(),dist:r.camera.dist,theta:r.camera.theta,phi:r.camera.phi};
 assert.equal(r.startCinema(100),true);
 assert.deepEqual(r.rowGeometry().ids,order.slice().reverse());
 const t=r.cinema.track;
 const first=r.cinema.track.frames[0],last=t.frames.at(-1);
 assert.ok(last.distance>first.distance);
 const newProgress=(last.holdStartMs+400)/t.durationMs;
 assert.equal(r.seekCinema(newProgress,1200),true);
 close(r.camera.dist,last.distance);
 close(r.camera.target[0],last.x);
 r.setCinemaScrubbing(true,1300);
 r.advanceCinema(1800);
 close(r.cinema.progress,newProgress);
 r.setCinemaScrubbing(false,1800);
 r.advanceCinema(1900);
 assert.ok(r.cinema.progress>newProgress);
 assert.equal(r.stopCinema(2000),true);
 assert.deepEqual(r.rowGeometry().ids,order);
 assert.deepEqual(r.camera.desiredTarget,saved.target);
 close(r.camera.desiredDist,saved.dist);
 r.advanceTransition(2000+980+1);
 close(r.camera.theta,saved.theta);close(r.camera.phi,saved.phi);
});

test('v55: Cinema prerequisites have three direct controls, nine moon dots in Layer panel',async()=>{
 const html=await read('index.html'),css=await read('css/styles.css');
 const main=html.slice(html.indexOf('class="scale-main-controls"'),html.indexOf('id="layer-picker-wrap"'));
 assert.deepEqual([...main.matchAll(/<button class="scale-option(?: scale-row-toggle)?" id="([a-z-]+)"/g)].map(x=>x[1]),
  ['orbit-row-btn','scale-objects-btn','scale-orbits-btn']);
 for(const label of ['Reihe','Objekt','Bahn'])assert.match(main,new RegExp(`<span class="scale-option-label">${label}</span>`));
 assert.match(css,/\.viewport>\.control-panel \.scale-main-controls\{/);
 const layer=html.slice(html.indexOf('id="layer-popover"'),html.indexOf('id="time-panel"'));
 const moonButton=layer.match(/<button[^>]*id="toggle-four-moons"[^>]*>[\s\S]*?<\/button>/)?.[0];
 assert.ok(moonButton);
 assert.match(moonButton,/aria-pressed="false"/);
 assert.match(moonButton,/aria-label="Alle Monde anzeigen"/);
 const svg=moonButton.match(/<svg class="nine-moons-icon"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
 const coords=[...svg.matchAll(/<circle cx="([0-9.]+)" cy="([0-9.]+)" r="([0-9.]+)"\/>/g)];
 assert.equal(coords.length,9);
 for(const m of coords)assert.ok(Math.abs(Math.hypot(Number(m[1])-12,Number(m[2])-12)-7.5)<.02);
});

test('v54: inversed moon toggle OFF caps to four, ON shows all, with scene defaults intact',async()=>{
 const app=await read('src/app.js');
 const source=app.slice(app.indexOf('function syncFourMoonsControl(){'),app.indexOf('function changeLayers(next){'));
 const button={attrs:{},classes:new Set(),title:'',setAttribute(n,v){this.attrs[n]=v;},
  classList:{toggle(n,enabled){if(enabled)button.classes.add(n);else button.classes.delete(n);}}};
 const solar=createViewSettings('solar'),planet=createViewSettings('planet');
 assert.equal(solar.fourMoons,true,'solar still caps to four');
 assert.equal(planet.fourMoons,false,'planet still shows all');
 const S={settings:solar};const ctx=vm.createContext({syncToggleState,S,$:()=>button});
 vm.runInContext(source+'\nsyncFourMoonsControl()',ctx);
 assert.equal(button.attrs['aria-pressed'],'false');assert.match(button.title,/maximal vier/);
 S.settings=planet;
 vm.runInContext('syncFourMoonsControl()',ctx);
 assert.equal(button.attrs['aria-pressed'],'true');assert.match(button.title,/ohne Vierer-Begrenzung/);
 const r=renderer();
 r.settings=solar;
 r.bodies=INITIAL_BODIES;r.byId=new Map(INITIAL_BODIES.map(b=>[b.id,b]));r.setBodies(INITIAL_BODIES);
 solar.layers={mode:'all',types:new Set(['moon'])};
 assert.equal(r.shouldDraw(r.byId.get('himalia')),false);
 solar.fourMoons=false;
 assert.equal(r.shouldDraw(r.byId.get('himalia')),true);
});
