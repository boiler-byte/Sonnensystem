import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SolarRenderer} from '../src/renderer/renderer.js';

function mockRenderer(){
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.cameraPresetIndex=0;r.cameraManuallyMoved=false;r.planetId=null;r.height=700;
  r.simTime=0;r.calcPositions=()=>{};
  return r;
}

test('v28: undisturbed camera cycles oblique, side, top, oblique',()=>{
  const r=mockRenderer();
  assert.equal(r.camera.phi,.99);
  for(const [index,phi] of [[1,1.54],[2,.16],[0,.99],[1,1.54]]){
    r.cycleCameraPerspective();
    assert.equal(r.cameraPresetIndex,index);
    assert.equal(r.camera.phi,phi);
    assert.equal(r.camera.desiredDist,47);
    assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
    assert.equal(r.cameraManuallyMoved,false);
  }
});

test('v28: any manual pan interrupts cycling and next click resets to oblique',()=>{
  const r=mockRenderer();
  r.cycleCameraPerspective();r.cycleCameraPerspective();
  r.panByPixels(17,8);
  assert.equal(r.cameraManuallyMoved,true);
  r.cycleCameraPerspective();
  assert.equal(r.cameraPresetIndex,0);
  assert.equal(r.camera.phi,.99);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  r.cycleCameraPerspective();
  assert.equal(r.cameraPresetIndex,1);
});

test('v28: reset and planet-scene exit restore oblique before cycling',()=>{
  const r=mockRenderer();
  r.cycleCameraPerspective();r.reset();
  assert.equal(r.cameraPresetIndex,0);
  r.planetId='earth';r.cycleCameraPerspective();
  assert.equal(r.planetId,null);
  assert.equal(r.cameraPresetIndex,0);
  r.cycleCameraPerspective();assert.equal(r.cameraPresetIndex,1);
});
