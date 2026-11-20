import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {cinemaTrack,cinemaSceneAt,CINEMA_ENTRY_MS,CINEMA_TRAVEL_MS,CINEMA_HOLD_MS} from '../src/renderer/cinema.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} !== ${b}`);
const ids=['earth','mars','jupiter'];
const track=cinemaTrack({ids,positions:new Map(ids.map((id,i)=>[id,[i*140+40,0,0]])),
 radii:new Map(ids.map((id,i)=>[id,i+1]))},1200,700);

function entryRenderer(reorder){
 const r=Object.create(SolarRenderer.prototype);
 const saved={target:[-40,0,0],dist:30,theta:.65,phi:1.04,
  cameraManuallyMoved:false,focusedBodyId:null};
 r.camera={target:saved.target.slice(),desiredTarget:saved.target.slice(),dist:saved.dist,
  desiredDist:saved.dist,theta:saved.theta,phi:saved.phi};
 r.settings={row:true,scaleObjects:true,scaleOrbits:false};
 r.transition={kind:'cinema'};
 r.cinema={active:true,reorder,paused:true,seeking:false,speed:1,elapsedMs:0,
  progress:0,track,saved,entrySnapped:false,fadeOpacity:0,lastAt:0,lastNoticeAt:0};
 r.callbacks={onCinemaChange(){}};
 r.calcPositions=()=>{};
 return {r,saved};
}

test('v104: no-reorder distance row enters by camera travel without fading',()=>{
 const {r,saved}=entryRenderer(false);
 const first=cinemaSceneAt(track,0);
 const samples=[];
 for(const ms of [100,550,1000]){
  r.cinema.elapsedMs=ms;
  r.advanceCinema(ms);
  assert.equal(r.cinema.fadeOpacity,0);
  assert.equal(r.cinema.entrySnapped,false,'no abrupt camera cut during distance-row entry');
  samples.push({x:r.camera.target[0],d:r.camera.dist,theta:r.camera.theta});
 }
 assert.ok(samples[0].x>saved.target[0] && samples[0].x<samples[1].x);
 assert.ok(samples[1].x<samples[2].x && samples[2].x<first.target[0]);
 assert.ok(samples[0].d<saved.dist && samples[1].d<samples[0].d && samples[2].d<samples[1].d);
 assert.ok(samples[0].theta<saved.theta && samples[1].theta<samples[0].theta);
 r.cinema.elapsedMs=CINEMA_ENTRY_MS;
 r.advanceCinema(CINEMA_ENTRY_MS);
 assert.equal(r.cinema.entrySnapped,true);
 assert.deepEqual(r.camera.target,first.target);
 close(r.camera.dist,first.distance);
 assert.equal(r.cinema.fadeOpacity,0);
});

test('v104: size-row entry conceals only the largest-to-smallest reorder',()=>{
 const {r,saved}=entryRenderer(true);
 r.transition={kind:'cinema',at:0,duration:980,progress:0,amount:0,
  cameraFrom:[saved.theta,saved.phi],cameraTo:[0,1.48]};
 r.advanceTransition(10000);
 assert.equal(r.transition.amount,0,'the starting row remains unmoved until full blackout, even after a pause');
 close(r.camera.theta,saved.theta);
 r.cinema.elapsedMs=CINEMA_ENTRY_MS*.35;
 r.advanceCinema(385);
 assert.deepEqual(r.camera.target,saved.target);
 assert.ok(r.cinema.fadeOpacity>.1);
 r.cinema.elapsedMs=CINEMA_ENTRY_MS*.5;
 r.advanceCinema(550);
 assert.equal(r.transition,null);
 assert.deepEqual(r.camera.target,cinemaSceneAt(track,0).target);
 assert.equal(r.cinema.fadeOpacity,1);
 r.cinema.elapsedMs=CINEMA_ENTRY_MS+CINEMA_HOLD_MS+CINEMA_TRAVEL_MS*.5;
 r.cinema.progress=(CINEMA_HOLD_MS+CINEMA_TRAVEL_MS*.5)/track.durationMs;
 r.advanceCinema(2000);
 assert.equal(r.cinema.fadeOpacity,0);
 assert.equal(r.camera.target[0],(track.frames[0].x+track.frames[1].x)/2);
});

test('v104: Folgen defaults to enabled, follows the selected object, and remains manually toggleable',async()=>{
 const [source,html]=await Promise.all([
  readFile(new URL('../src/renderer/renderer.js',import.meta.url),'utf8'),
  readFile(new URL('../index.html',import.meta.url),'utf8')]);
 assert.match(source,/this\.followEnabled=true;this\.followedBodyId=null/);
 assert.match(html,/id="center-object-btn"[^>]*aria-pressed="true"/);
 const r=Object.create(SolarRenderer.prototype);
 Object.assign(r,{followEnabled:true,followedBodyId:null,followLastPosition:null,followLastAtMs:null,
  selectedId:'earth',focusedBodyId:null,simTime:Date.UTC(2026,10,20),planetId:null,
  positions:new Map(),camera:{desiredTarget:[0,0,0]},callbacks:{}});
 r.calcPositions=()=>{r.positions.set('earth',[3,0,0]);r.positions.set('mars',[7,0,0]);};
 r.focus=id=>{r.focusedBodyId=id;};
 const bodies=INITIAL_BODIES.filter(body=>['sun','earth','mars'].includes(body.id));
 r.setBodies(bodies);
 assert.equal(r.followedBodyId,'earth');
 assert.equal(r.focusedBodyId,'earth');
 assert.deepEqual(r.camera.desiredTarget,[3,0,0]);
 r.setSelected('mars');
 assert.equal(r.followEnabled,true);
 assert.equal(r.followedBodyId,'mars');
 assert.deepEqual(r.camera.desiredTarget,[7,0,0]);
 assert.equal(r.follow('mars'),false,'clicking active Folgen switches the toggle off');
 assert.equal(r.followEnabled,false);
 r.setBodies(bodies);
 assert.equal(r.followEnabled,false,'catalog refresh must not undo a manual switch-off');
});
