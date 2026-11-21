import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {SolarRenderer} from '../src/renderer/index.js';

function makeRenderer(){
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=900;r.height=700;r.simTime=Date.UTC(2026,10,18);
  r.planetId=null;r.selectedId=null;r.positions=new Map();r.overrides=new Map();
  r.followEnabled=true;r.followedBodyId=null;r.followLastPosition=null;r.followLastAtMs=null;
  r.focusedBodyId=null;r.cameraManuallyMoved=false;r.cameraPresetIndex=0;
  r.callbacks={};r.setBodies(INITIAL_BODIES);r.calcPositions(r.simTime);
  return r;
}

test('v128: the former parent-scene follow handler is removed entirely',async()=>{
  const app=await readAppSource(),html=await readProjectSource('index.html');
  assert.doesNotMatch(app,/center-object-btn/);
  assert.doesNotMatch(html,/center-object-btn/);
});

test('v128: selecting a moon follows it directly without requiring a toggle',()=>{
  const r=makeRenderer();
  r.setSelected('moon',{focus:true});
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'moon');
  assert.deepEqual(r.camera.desiredTarget,r.positions.get('moon'));
  assert.equal(r.planetId,null,'selection alone does not unexpectedly change scenes');
});

test('v128: moons and satellites follow within an explicitly opened parent view',()=>{
  for(const [body,parent] of [['moon','earth'],['charon','pluto'],['sat-25544','earth']]){
    const r=makeRenderer();
    assert.equal(r.showPlanetSystem(parent),true);
    r.setSelected(body,{focus:true});
    assert.equal(r.followedBodyId,body);
    assert.deepEqual(r.camera.desiredTarget,r.positions.get(body));
    assert.equal(r.planetId,parent);
  }
});

test('v128: a follow request never switches the global mode off',()=>{
  const r=makeRenderer();
  r.setSelected('charon',{focus:true});
  assert.equal(r.follow('charon'),true);
  assert.equal(r.follow('charon'),true);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'charon');
});

test('v128: planets, dwarfs and heliocentric objects keep their existing scene',()=>{
  for(const id of ['earth','pluto','ceres','sun']){
    const r=makeRenderer();
    r.setSelected(id,{focus:true});
    assert.equal(r.planetId,null);
    assert.equal(r.followedBodyId,id);
    assert.deepEqual(r.camera.desiredTarget,r.positions.get(id));
  }
});
