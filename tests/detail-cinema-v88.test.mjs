import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {cinemaTrack,cinemaPoseAt,CINEMA_ENTRY_MS,CINEMA_HOLD_MS,CINEMA_PLANET_HOLD_MS,CINEMA_TRAVEL_MS} from '../src/renderer/cinema.js';
import {SolarRenderer} from '../src/renderer/renderer.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function track(){
  const layout={ids:['sun','earth','moon','pluto'],
    positions:new Map([['sun',[0,0,0]],['earth',[4,0,0]],['moon',[8,0,0]],['pluto',[12,0,0]]]),
    radii:new Map([['sun',3],['earth',1],['moon',.4],['pluto',.65]])};
  const byId=new Map([['sun',{id:'sun',type:'star'}],['earth',{id:'earth',type:'planet'}],
    ['moon',{id:'moon',type:'moon'}],['pluto',{id:'pluto',type:'dwarf'}]]);
  return cinemaTrack(layout,1200,750,byId);
}

test('v91: Daten is default in HTML; controls restore the last chosen detail tab',async()=>{
  const html=await read('index.html');
  assert.match(html,/<button class="detail-tab active" id="detail-tab-daten"[^>]*aria-selected="true" tabindex="0"/);
  assert.match(html,/<button class="detail-tab" id="detail-tab-wissen"[^>]*aria-selected="false" tabindex="-1"/);
  assert.match(html,/<div class="detail-tab-panel" id="detail-daten"[^>]*tabindex="0">/);
  assert.match(html,/<div class="detail-tab-panel" id="detail-wissen"[^>]*tabindex="0" hidden>/);
  const controls=await read('src/ui/event-handlers.js');
  assert.match(controls,/restoreDetailTab\(\)/);
  assert.doesNotMatch(controls,/setDetailTab\('wissen'\)|setDetailTab\('daten'\)/);
});

test('v88: desktop details reserve scrollbar width to avoid horizontal shifts when swapping tabs',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/@media\(min-width:771px\)\{\.detail-scroll\{scrollbar-gutter:stable\}\}/);
  assert.match(css,/\.detail-scroll\{overflow:auto/);
  assert.match(css,/\.detail-tab-panel\[hidden\]\{display:none!important\}/);
});

test('v91: Cinema holds stars, planets, moons and dwarf planets five seconds',()=>{
  const t=track();
  assert.deepEqual(t.frames.map(f=>f.holdEndMs-f.holdStartMs),[5000,5000,5000,5000]);
  assert.equal(CINEMA_HOLD_MS,5000);
  assert.equal(CINEMA_PLANET_HOLD_MS,5000);
  assert.equal(t.durationMs,4*CINEMA_HOLD_MS+3*CINEMA_TRAVEL_MS);
  assert.equal(cinemaPoseAt(t,(t.frames[1].holdStartMs+2500)/t.durationMs).objectId,'earth');
  assert.equal(cinemaPoseAt(t,(t.frames[1].holdStartMs+2500)/t.durationMs).holding,true);
  assert.equal(cinemaPoseAt(t,(t.frames[1].holdEndMs+350)/t.durationMs).holding,false);
});

test('v88: 2x button follows play/pause, can be toggled, and has pressed styling and keyboard hints',async()=>{
  const [html,css,handlers,controls]=await Promise.all([
    read('index.html'),read('css/styles.css'),read('src/ui/event-handlers.js'),read('src/app/animation-controls.js')]);
  assert.match(html,/id="cinema-play-pause"[\s\S]*?<button class="cinema-play-pause cinema-speed-button" id="cinema-speed-toggle"[^>]*aria-pressed="false"[^>]*>2x<\/button>[\s\S]*?id="cinema-seek"/);
  assert.match(handlers,/\$\('cinema-speed-toggle'\)\.addEventListener\('click',\(\)=>renderer\?\.toggleCinemaSpeed\(\)\)/);
  assert.match(controls,/speed\.setAttribute\('aria-pressed',String\(doubleSpeed\)\)/);
  assert.match(css,/\.cinema-speed-button\.active\{/);
});

test('v88: double speed advances only Cinema clock, works after scrubbing, and pauses independently',()=>{
  const t=track();
  const r=Object.create(SolarRenderer.prototype);
  r.settings={row:true,scaleObjects:true,scaleOrbits:false};
  r.camera={target:[0,0,0],dist:20,desiredTarget:[0,0,0],desiredDist:20};
  const notices=[];
  r.callbacks={onCinemaChange:value=>notices.push(value)};
  r.cinema={active:true,reorder:false,paused:false,speed:1,progress:0,
    elapsedMs:CINEMA_ENTRY_MS,lastAt:100,lastNoticeAt:100,endedMs:0,seeking:false,
    saved:{},track:t};
  r.advanceCinema(200);
  assert.equal(r.cinema.elapsedMs,CINEMA_ENTRY_MS+100);
  assert.equal(r.toggleCinemaSpeed(200),2);
  assert.equal(notices.at(-1).speed,2);
  r.advanceCinema(300);
  assert.equal(r.cinema.elapsedMs,CINEMA_ENTRY_MS+300);
  const beforePause=r.cinema.elapsedMs;
  assert.equal(r.toggleCinemaPause(300),true);
  r.advanceCinema(400);
  assert.equal(r.cinema.elapsedMs,beforePause);
  assert.equal(r.seekCinema(.3,400),true);
  assert.equal(r.cinema.paused,true,'scrubbing does not unpause Cinema');
  const sought=r.cinema.elapsedMs;
  assert.equal(r.toggleCinemaPause(400),false);
  r.advanceCinema(500);
  assert.equal(r.cinema.elapsedMs,sought+200);
  assert.equal(r.toggleCinemaSpeed(500),1);
  r.advanceCinema(600);
  assert.equal(r.cinema.elapsedMs,sought+300);
  assert.equal(notices.at(-1).speed,1);
  assert.ok(r.cinema.progress>.3);
});
