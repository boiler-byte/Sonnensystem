import assert from 'node:assert/strict';
import {test} from 'node:test';
import {galacticOffsetAt, galacticHistoryDays, GALACTIC_SUN_HISTORY_DAYS, GALACTIC_MIN_HISTORY_DAYS, GALACTIC_MAX_HISTORY_DAYS} from '../src/renderer/galactic-motion.js';
import {GalacticTrailHistory} from '../src/renderer/galactic-trails.js';

const DAY=86400000;

test('v100/v103: galactic offset is anchored at the current sun position',()=>{
  assert.deepEqual(galacticOffsetAt(1000,1000),[0,0,0]);
  const past=galacticOffsetAt(1000-DAY*10,1000);
  assert.ok(past[1] < 0,'historical trail extends below the present Sun in 3D world coordinates');
  assert.ok(Math.abs(past[1]) > 4*Math.abs(past[0]),'downward drift dominates sideways sway');
  assert.equal(past[0],0,'v110 removes the sideways sine wave');
  assert.notEqual(past[2],0);
});

test('v110: galactic duration follows fixed body categories instead of orbital-period scaling',()=>{
  assert.equal(galacticHistoryDays({id:'sun',type:'star'}),GALACTIC_SUN_HISTORY_DAYS);
  assert.equal(galacticHistoryDays({id:'mercury',periodDays:88}),GALACTIC_MIN_HISTORY_DAYS);
  const earth=galacticHistoryDays({id:'earth',periodDays:365.25});
  assert.equal(earth,GALACTIC_MIN_HISTORY_DAYS);
  assert.equal(galacticHistoryDays({id:'neptune',periodDays:60190.03}),GALACTIC_MAX_HISTORY_DAYS);
});

test('v103: sun and planets only have trajectories after two actual simulated positions',()=>{
  const history=new GalacticTrailHistory();
  const sun={id:'sun',type:'star'};
  const earth={id:'earth',type:'planet',parentId:'sun',a:1,periodDays:365.25};
  const start=Date.UTC(2026,10,20);
  assert.equal(history.record(sun,start,[0,0,0]).length,0);
  assert.equal(history.record(earth,start,[7.5,0,0]).length,0);
  assert.equal(history.record(sun,start,[0,0,0]).length,0);
  assert.equal(history.record(earth,start,[7.5,0,0]).length,0);
  const later=start+10*DAY;
  const sunWorld=history.record(sun,later,[0,0,0]);
  const earthWorld=history.record(earth,later,[7.6,.3,0]);
  assert.equal(sunWorld.length,6);
  assert.equal(earthWorld.length,6);
  assert.deepEqual([...sunWorld.slice(-3)],[0,0,0]);
  assert.deepEqual([...earthWorld.slice(-3)],[Math.fround(7.6),Math.fround(.3),0]);
  assert.ok(sunWorld[1]<0);
  assert.ok(earthWorld[1]<0);
});
