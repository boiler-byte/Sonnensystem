import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  cinemaTrack,cinemaPoseAt,cinemaSceneAt,cinemaTargetAt,
  CINEMA_HOLD_MS,CINEMA_TRAVEL_MS
} from '../src/renderer/cinema.js';
import {SolarRenderer} from '../src/renderer/index.js';

function trackFrom(xs,radii){
 const ids=xs.map((_,i)=>`object-${i}`);
 const positions=new Map(ids.map((id,i)=>[id,[xs[i],0,0]]));
 const footprints=new Map(ids.map((id,i)=>[id,radii[i]]));
 return cinemaTrack({ids,positions,footprints},1200,700);
}

function sample(track,index,travelFraction){
 const time=track.frames[index].holdEndMs+travelFraction*CINEMA_TRAVEL_MS;
 return cinemaPoseAt(track,time/track.durationMs);
}

const tolerance=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<eps*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test('v119: flight between consecutive row bodies follows a visible, smooth 3D arc',()=>{
 const track=trackFrom([0,6,40],[1,2,8]);
 for(let i=0;i<track.frames.length-1;i++){
  const from=track.frames[i],to=track.frames[i+1];
  assert.deepEqual(sample(track,i,0).target,[from.x,0,0]);
  assert.deepEqual(sample(track,i,1).target,[to.x,0,0]);
  assert.equal(sample(track,i,0).holding,true);
  assert.equal(sample(track,i,1).holding,true);
  const midpoint=sample(track,i,.5);
  tolerance(midpoint.target[0],(from.x+to.x)/2);
  assert.ok(midpoint.target[1]>0,'path rises above the row');
  assert.ok(midpoint.target[2]>0,'path pulls back from the row');
  assert.equal(midpoint.holding,false);
  assert.ok(midpoint.distance>Math.min(from.distance,to.distance));
  assert.ok(midpoint.distance<Math.max(from.distance,to.distance));
  assert.equal(midpoint.objectId,to.id);
  // No jump or sharp starting/stopping speed at either five-second hold.
  const early=sample(track,i,1e-4),late=sample(track,i,1-1e-4);
  assert.ok(Math.hypot(...early.target.map((v,j)=>v-[from.x,0,0][j])) < (to.x-from.x)*1e-5);
  assert.ok(Math.hypot(...late.target.map((v,j)=>v-[to.x,0,0][j])) < (to.x-from.x)*1e-5);
  let previous=from.x;
  for(let step=1;step<=100;step++){
   const pose=sample(track,i,step/100);
   assert.ok(pose.target[0]>=previous-1e-8,'camera does not reverse along the row');
   assert.ok(Number.isFinite(pose.distance));
   previous=pose.target[0];
  }
 }
 assert.equal(track.durationMs,3*CINEMA_HOLD_MS+2*CINEMA_TRAVEL_MS);
});

test('v119: curved arc scales safely for huge gaps, close bodies and one-body rows',()=>{
 for(const [gap,radii] of [[1e-5,[.00001,.00001]],[1e6,[.001,.002]],[8,[50,1]]]){
  const track=trackFrom([0,gap],radii);
  const half=sample(track,0,.5);
  const frameDistance=Math.max(...track.frames.map(frame=>frame.distance));
  assert.ok(Number.isFinite(half.target[1]) && half.target[1]>0);
  assert.ok(Number.isFinite(half.target[2]) && half.target[2]>0);
  assert.ok(half.target[1]<=frameDistance*.225+1e-8);
  assert.ok(half.target[2]<=frameDistance*.105+1e-8);
  tolerance(half.target[0],gap/2);
 }
 const one=trackFrom([11],[2]);
 assert.deepEqual(cinemaPoseAt(one,0).target,[11,0,0]);
 assert.deepEqual(cinemaPoseAt(one,.65).target,[11,0,0]);
 assert.deepEqual(cinemaPoseAt(one,1).target,[11,0,0]);
});

test('v119: timeline scrubbing and realtime playback sample exactly the same curved pose',()=>{
 const track=trackFrom([0,9,23],[1,3,2]);
 const renderer=Object.create(SolarRenderer.prototype);
 const at=track.frames[0].holdEndMs+.4*CINEMA_TRAVEL_MS;
 const progress=at/track.durationMs;
 renderer.settings={row:true};
 renderer.camera={target:[0,0,0],desiredTarget:[0,0,0],dist:5,desiredDist:5};
 renderer.cinema={active:true,track,progress:0,elapsedMs:0,lastAt:100,
   paused:false,speed:1,seeking:false,entrySnapped:true,lastNoticeAt:100,endedMs:0};
 renderer.callbacks={onCinemaChange(){}};
 assert.equal(renderer.seekCinema(progress,200),true);
 const seekingPose=cinemaSceneAt(track,progress);
 assert.deepEqual(renderer.camera.target,seekingPose.target);
 assert.deepEqual(renderer.camera.desiredTarget,seekingPose.target);
 tolerance(renderer.camera.dist,seekingPose.distance);
 assert.deepEqual(cinemaTargetAt(track,progress),seekingPose.target);
 renderer.advanceCinema(300);
 const realtimePose=cinemaSceneAt(track,renderer.cinema.progress);
 assert.deepEqual(renderer.camera.target,realtimePose.target);
 const beforePause=renderer.cinema.progress;
 assert.equal(renderer.toggleCinemaPause(300),true);
 renderer.advanceCinema(390);
 tolerance(renderer.cinema.progress,beforePause);
 assert.deepEqual(renderer.camera.target,realtimePose.target);
 assert.equal(renderer.toggleCinemaPause(400),false);
 assert.equal(renderer.toggleCinemaSpeed(410),2);
 renderer.advanceCinema(460);
 const twicePose=cinemaSceneAt(track,renderer.cinema.progress);
 assert.deepEqual(renderer.camera.target,twicePose.target);
 assert.ok(renderer.cinema.progress>beforePause);
});
