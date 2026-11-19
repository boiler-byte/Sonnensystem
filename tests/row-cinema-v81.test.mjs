import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {rowArrowGeometry,ROW_INSPECTION_ARROW_GAP_PX} from '../src/renderer/row-inspection.js';
import {cinemaTrack,cinemaPoseAt,cinemaRestingObject,CINEMA_ENTRY_MS,CINEMA_HOLD_MS,
 CINEMA_TRAVEL_MS} from '../src/renderer/cinema.js';
import {updateRowInspectionHUD} from '../src/ui/row-inspection.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const vp=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const screen=(x,y=300)=>[(x/400)-1,1-y/300,0];
const earth={id:'earth',name:'Erde',parentId:'sun',radiusKm:6371,
 meanDistanceToParent:1,meanDistanceUnit:'AU',surfaceGravityMs2:9.80665,temperatureMeanK:287};
const moon={id:'moon',name:'Mond',parentId:'earth',radiusKm:1737.4,
 meanDistanceToParent:384400,meanDistanceUnit:'km',surfaceGravityMs2:1.62,temperatureMeanK:250};
const layout={ids:['earth','moon'],positions:new Map([['earth',[0,0,0]],['moon',[10,0,0]]]),
 radii:new Map([['earth',1],['moon',.25]])};
const track=cinemaTrack(layout,800,600);

function element(svg=false){
 const attrs=new Map(svg?[['hidden','']]:[]);
 return {hidden:true,dataset:{},style:{},textContent:'',innerHTML:'',offsetWidth:100,
  classList:{add(){},remove(){}},setAttribute(k,v){attrs.set(k,String(v));},
  removeAttribute(k){attrs.delete(k);},getAttribute(k){return attrs.get(k)},
  hasAttribute(k){return attrs.has(k)}};
}
function hudFixture(body=moon){
 const ids=['row-inspection','row-inspection-scanner','row-inspection-title','row-inspection-metrics',
 'row-inspection-name','row-inspection-scan-tag','row-inspection-gravity','row-inspection-temperature',
 'row-inspection-gravity-icon','row-inspection-temperature-icon','row-inspection-vector-svg',
 'row-inspection-vector-line','row-inspection-vector-head','row-inspection-vector-origin',
 'row-inspection-distance','row-inspection-distance-value'];
 const nodes=new Map(ids.map(id=>[id,element(id==='row-inspection-vector-svg')]));
 const renderer={settings:{row:true},cinema:{active:true},rowHoveredId:body.id,
  byId:new Map([[body.id,body],['earth',earth],['sun',{id:'sun',radiusKm:696000}]]),
  positions:new Map([[body.id,screen(650)],['earth',screen(200)],['sun',screen(50)]]),
  vp,width:800,height:600,rowHoverStartedAt:0,rowRenderedRadiusPx(){return 50;}};
 return {nodes,renderer};
}

test('v81: arrow clearance is precisely three times 23px and stops at the parent silhouette',()=>{
 assert.equal(ROW_INSPECTION_ARROW_GAP_PX,69);
 const arrow=rowArrowGeometry(moon,screen(650),screen(200),vp,800,600,80,50);
 assert.equal(arrow.x,650);assert.equal(arrow.y,300+80+69);
 assert.equal(arrow.direction,-1);assert.equal(arrow.tipX,250);
 assert.equal(arrow.labelY,arrow.y+13);
 const reverse=rowArrowGeometry(moon,screen(140),screen(500),vp,800,600,80,55);
 assert.equal(reverse.tipX,445,'parent left rim when the parent lies to the right');
 const cropped=rowArrowGeometry(moon,screen(600),screen(-100),vp,800,600,80,135);
 assert.equal(cropped.tipX,35,'visible part of an offscreen parent, not screen edge or its center');
 const absent=rowArrowGeometry(moon,screen(600),screen(-200),vp,800,600,80,80);
 assert.equal(absent.tipX,0,'clip to viewport only when the whole parent is outside');
 assert.equal(rowArrowGeometry(moon,screen(650),screen(200),vp,800,600,80,500),null,
  'no reversed vector when the parent silhouette already overlaps the inspected center');
});

test('v81: name is over the body, icon-only gravity and temperature under it; old hover card is gone',async()=>{
 const [html,css,js]=await Promise.all(['index.html','css/styles.css','src/ui/row-inspection.js'].map(read));
 assert.doesNotMatch(html,/id="row-inspection-panel"|OBJEKTANALYSE|IDENTIFIKATION/);
 assert.doesNotMatch(css,/\.row-inspection-panel\{/);
 assert.match(html,/id="row-inspection-title"/);
 assert.match(html,/id="row-inspection-metrics"/);
 assert.match(html,/id="row-inspection-gravity-icon"/);
 assert.match(html,/id="row-inspection-temperature-icon"/);
 assert.doesNotMatch(html,/GRAVITATION<\/span>|TEMPERATUR<\/span>/);
 assert.match(css,/\.row-inspection-name\{[^}]*text-transform:uppercase/);
 assert.match(js,/physicalStatIcon\('gravity'\)/);
 assert.match(js,/thermometerIcon\('mean'\)/);
 const {nodes,renderer}=hudFixture();const before=globalThis.document;
 globalThis.document={getElementById:id=>nodes.get(id)};
 try{
  updateRowInspectionHUD(renderer,700);
  assert.equal(nodes.get('row-inspection').hidden,false,'Cinema HUD is allowed on a settled body');
  assert.equal(nodes.get('row-inspection-name').textContent,'Mond');
  assert.ok(parseFloat(nodes.get('row-inspection-title').style.top)<300,'heading above planet');
  assert.ok(parseFloat(nodes.get('row-inspection-metrics').style.top)>300,'physical values below planet');
  assert.match(nodes.get('row-inspection-gravity-icon').innerHTML,/class="stat-icon"/);
  assert.match(nodes.get('row-inspection-gravity-icon').innerHTML,/M12 4v13/);
  assert.match(nodes.get('row-inspection-temperature-icon').innerHTML,/class="thermometer-icon/);
  assert.equal(nodes.get('row-inspection-vector-line').getAttribute('d'),'M650.0 449.0H250.0',
   'the moon vector ends at Earth, not at the Sun');
  assert.match(nodes.get('row-inspection-gravity').textContent,/G$/);
  assert.match(nodes.get('row-inspection-temperature').textContent,/°C$/);
 }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});

test('v81: a Cinema hold highlights only the object at a settled camera pose',()=>{
 const progress=200/track.durationMs;
 const pose=cinemaPoseAt(track,progress);
 const camera={target:pose.target.slice(),dist:pose.distance};
 const c={active:true,paused:false,progress,elapsedMs:CINEMA_ENTRY_MS+200,track,seeking:false};
 assert.equal(cinemaRestingObject(c,camera,null),'earth');
 assert.equal(cinemaRestingObject({...c,elapsedMs:CINEMA_ENTRY_MS-1},camera,null),null,
  'the entry flight never activates the HUD');
 assert.equal(cinemaRestingObject({...c,seeking:true},camera,null),null);
 assert.equal(cinemaRestingObject(c,camera,{kind:'cinema'}),null);
 assert.equal(cinemaRestingObject(c,{...camera,dist:camera.dist*1.1},null),null,
  'camera still zooming does not count as settled');
 assert.equal(cinemaRestingObject(c,{...camera,target:[pose.target[0]+pose.distance*.1,0,0]},null),null,
  'camera still panning does not count as settled');
 const travelingProgress=(CINEMA_HOLD_MS+CINEMA_TRAVEL_MS/2)/track.durationMs;
 assert.equal(cinemaRestingObject({...c,progress:travelingProgress},camera,null),null);
 assert.equal(cinemaRestingObject({...c,paused:true},camera,null),'earth',
  'manual pause retains the scanner on a stationary planet');
});

test('v81: renderer reuses the same row hover enlargement for Cinema holds',()=>{
 const renderer=Object.create(SolarRenderer.prototype);
 const progress=200/track.durationMs,pose=cinemaPoseAt(track,progress);
 renderer.settings={row:true};renderer.cinema={active:true,track,elapsedMs:CINEMA_ENTRY_MS+200,progress};
 renderer.camera={target:pose.target.slice(),dist:pose.distance,arView:null};
 renderer.transition=null;renderer.rowPointer=null;renderer.rowHoveredId=null;
 renderer.rowHoverFrameAt=null;renderer.rowHoverLevels=new Map();
 renderer.advanceRowInspection(vp,100);
 assert.equal(renderer.rowHoveredId,'earth');
 assert.ok(renderer.rowHoverLevels.get('earth')>0,'same magnification tween as pointer hover');
 renderer.cinema.progress=(CINEMA_HOLD_MS+CINEMA_TRAVEL_MS/2)/track.durationMs;
 renderer.advanceRowInspection(vp,200);
 assert.equal(renderer.rowHoveredId,null,'scanner fades while the camera travels');
 renderer.cinema.progress=progress;renderer.cinema.paused=true;
 renderer.advanceRowInspection(vp,300);
 assert.equal(renderer.rowHoveredId,'earth','paused stop continues to show hover visuals');
});

test('v81: play/pause freezes only Cinema, supports seeking while paused and resumes without a jump',()=>{
 const renderer=Object.create(SolarRenderer.prototype),notices=[];
 renderer.settings={row:true,scaleObjects:true,scaleOrbits:false};
 renderer.camera={target:[0,0,0],desiredTarget:[0,0,0],dist:1,desiredDist:1};
 renderer.cinema={active:true,paused:false,reorder:false,track,progress:0,
  elapsedMs:CINEMA_ENTRY_MS+100,endedMs:0,lastAt:100,lastNoticeAt:100,seeking:false};
 renderer.callbacks={onCinemaChange:info=>notices.push(info)};
 assert.equal(renderer.toggleCinemaPause(200),true);
 const elapsed=renderer.cinema.elapsedMs;
 renderer.advanceCinema(250);
 assert.equal(renderer.cinema.elapsedMs,elapsed,'the clock does not advance in pause');
 assert.equal(renderer.cinema.paused,true);
 assert.equal(notices.at(-1).paused,true);
 renderer.seekCinema(.5,260);
 assert.equal(renderer.cinema.paused,true,'scrubbing must not unpause the movie');
 renderer.advanceCinema(350);
 assert.equal(renderer.cinema.progress,.5);
 assert.equal(renderer.toggleCinemaPause(400),false);
 assert.equal(notices.at(-1).paused,false);
 renderer.advanceCinema(500);
 assert.ok(renderer.cinema.progress>.5);
 assert.equal(renderer.toggleCinemaPause(520),true);
 assert.equal(renderer.cinema.lastAt,520);
});

test('v81: Cinema playback is an accessible control at the left side of the timeline',async()=>{
 const [html,css,events,ui]=await Promise.all(['index.html','css/styles.css',
  'src/ui/event-handlers.js','src/app/animation-controls.js'].map(read));
 assert.match(html,/id="cinema-timeline"[\s\S]*?id="cinema-play-pause"[\s\S]*?id="cinema-seek"/);
 assert.match(html,/id="cinema-play-pause"[^>]*aria-label="Cinema pausieren"[^>]*aria-pressed="false"/);
 assert.match(css,/\.cinema-play-pause\.is-paused \.cinema-resume-icon\{display:block\}/);
 assert.match(events,/\$\('cinema-play-pause'\)\.addEventListener\('click',\(\)=>renderer\?\.toggleCinemaPause\(\)\)/);
 assert.match(ui,/playback\.setAttribute\('aria-pressed',String\(paused\)\)/);
 assert.match(ui,/paused\?'Cinema fortsetzen':'Cinema pausieren'/);
});
