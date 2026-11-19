import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {SolarRenderer} from '../src/renderer/index.js';

const byId=id=>INITIAL_BODIES.find(body=>body.id===id);
const handlerSource=readAppSource().then(app=>{
  const start=app.indexOf("  $('center-object-btn').addEventListener('click',()=>{");
  const end=app.indexOf("  $('reset-camera').addEventListener('click'",start);
  assert.ok(start>=0 && end>start,'Follow handler present in app.js');
  return app.slice(start,end);
});

function makeRenderer(selected){
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=900;r.height=700;r.simTime=Date.UTC(2026,10,18);
  r.planetId=null;r.selectedId=selected;r.positions=new Map();r.overrides=new Map();
  r.followEnabled=false;r.followedBodyId=null;r.followLastPosition=null;r.followLastAtMs=null;
  r.focusedBodyId=null;r.cameraManuallyMoved=false;r.cameraPresetIndex=0;
  r.callbacks={};r.setBodies(INITIAL_BODIES);r.calcPositions(r.simTime);
  return r;
}

async function setup(selected,{initialPlanetId=null,alreadyFollowing=false}={}){
  const r=makeRenderer(selected),events=[],S={selected};
  if(initialPlanetId)assert.equal(r.showPlanetSystem(initialPlanetId),true);
  if(alreadyFollowing)assert.equal(r.follow(selected),true);
  const originalFollow=r.follow.bind(r);
  r.follow=id=>{events.push(['follow',id,r.planetId]);return originalFollow(id);};
  let press;
  const ctx=vm.createContext({
    $:id=>({addEventListener:(event,handler)=>{
      assert.equal(id,'center-object-btn');assert.equal(event,'click');press=handler;
    }}),
    byId,S,renderer:r,
    openPlanetScene:id=>{events.push(['scene',id]);return r.showPlanetSystem(id);},
    updateMode:()=>events.push(['mode']),
    updateDetail:()=>events.push(['detail'])
  });
  vm.runInContext(await handlerSource,ctx);
  assert.equal(typeof press,'function');
  return {r,S,events,press};
}

test('v39: Folgen opens the direct parent system for a moon and tracks the moon, not the parent',async()=>{
  const {r,S,events,press}=await setup('moon');
  press();
  assert.deepEqual(events,[['scene','earth'],['mode'],['follow','moon','earth'],['detail']]);
  assert.equal(r.planetId,'earth');
  assert.equal(S.selected,'moon');
  assert.equal(r.selectedId,'moon');
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,'moon');
  assert.deepEqual(r.camera.desiredTarget,r.positions.get('moon'));
  assert.notDeepEqual(r.camera.desiredTarget,r.positions.get('earth'));
});

test('v39: Folgen opens dwarf-planet scene for Charon and planet scene for an artificial satellite',async()=>{
  for(const [id,parent] of [['charon','pluto'],['sat-25544','earth']]){
    assert.equal(byId(id).parentId,parent);
    const {r,S,events,press}=await setup(id);
    press();
    assert.equal(r.planetId,parent);
    assert.equal(r.followedBodyId,id);
    assert.equal(r.followEnabled,true);
    assert.equal(S.selected,id);
    assert.deepEqual(events.slice(0,2),[['scene',parent],['mode']]);
  }
});

test('v39: with parent scene already open, Folgen starts without reopening it',async()=>{
  const {r,events,press}=await setup('moon',{initialPlanetId:'earth'});
  press();
  assert.equal(r.planetId,'earth');
  assert.equal(r.followedBodyId,'moon');
  assert.deepEqual(events,[['follow','moon','earth'],['detail']]);
});

test('v39: toggling Folgen off never changes the scene, even for a bound moon',async()=>{
  const {r,events,press}=await setup('charon',{alreadyFollowing:true});
  assert.equal(r.planetId,null);
  press();
  assert.equal(r.followEnabled,false);
  assert.equal(r.planetId,null);
  assert.deepEqual(events,[['follow','charon',null],['detail']]);
});

test('v39: planets, dwarfs and objects orbiting the Sun do not open another scene',async()=>{
  for(const id of ['earth','pluto','ceres','sun']){
    const {r,events,press}=await setup(id);
    press();
    assert.equal(r.planetId,null,`${id} stays in solar view`);
    assert.equal(r.followedBodyId,id);
    assert.ok(events.every(event=>event[0]!=='scene'&&event[0]!=='mode'));
  }
});
