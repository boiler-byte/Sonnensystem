import assert from 'node:assert/strict';
import {test} from 'node:test';
import {layerPreset, STANDARD_LAYERS, layerEnabled} from '../src/data/layers.js';
import {layoutSceneLabels} from '../src/renderer/labels.js';

const VP=new Float32Array([20,0,0,0, 0,20,0,0, 0,0,1,0, 0,0,0,20]);
const ctx={font:'',measureText:s=>({width:s.length*7})};
const body=(id,type='satellite')=>({id,name:id,type,radiusKm:0});
function makeScene(planetId=null){
  const bodies=Array.from({length:10},(_,i)=>body(`sat-${i}`));
  return {width:640,height:420,settings:{labels:true},planetId,selectedId:'sat-9',
    rendered:bodies,positions:new Map(bodies.map(b=>[b.id,[0,0,0]]))};
}

test('v25: solar Standard excludes moons and artificial satellites',()=>{
  assert.deepEqual([...STANDARD_LAYERS],['star','planet']);
  const standard=layerPreset('standard');
  for(const type of ['star','planet']) assert.ok(layerEnabled(standard,type));
  for(const type of ['moon','satellite']) assert.ok(!layerEnabled(standard,type));
  assert.equal(layerEnabled(standard,'asteroid'),false);
});

// The historic v16 density suite now guards against reintroducing that cap.
test('v83: no screen cell or overlap limit in either view',()=>{
  for(const planetId of [null,'earth']){
    const scene=makeScene(planetId);
    const labels=layoutSceneLabels(scene,VP,ctx,0);
    assert.equal(labels.length,scene.rendered.length);
    assert.equal(labels.at(-1).body.id,'sat-9','selected label is painted on top');
    assert.deepEqual(labels[0].rect,labels[1].rect,'coincident text rectangles stay visible');
    for(const t of [16,32,64,120,200]){
      const newer=layoutSceneLabels(scene,VP,ctx,t);
      assert.deepEqual(newer.map(l=>l.body.id),labels.map(l=>l.body.id));
      assert.deepEqual(newer.map(l=>l.side),labels.map(l=>l.side));
    }
  }
});

test('v83: switching selection never hides other labels in a crowded area',()=>{
  const scene=makeScene('earth');
  scene.selectedId='offscreen';
  const first=layoutSceneLabels(scene,VP,ctx,0);
  assert.equal(first.length,10);
  scene.selectedId='sat-9';
  const second=layoutSceneLabels(scene,VP,ctx,250);
  assert.equal(second.length,10);
  assert.ok(second.at(-1).selected);
  assert.deepEqual(new Set(first.map(x=>x.body.id)),new Set(second.map(x=>x.body.id)));
});

test('v83: no density-tile state remains when an object crosses a grid boundary',()=>{
  const scene=makeScene();
  scene.rendered=[body('sat-1')];scene.positions=new Map([['sat-1',[-.01,0,0]]]);
  assert.equal(layoutSceneLabels(scene,VP,ctx,0).length,1);
  assert.ok(!('cell' in scene._labelState.anchors.get('sat-1')));
  scene.positions.set('sat-1',[.01,0,0]);
  assert.equal(layoutSceneLabels(scene,VP,ctx,500).length,1);
  assert.ok(!('cell' in scene._labelState.anchors.get('sat-1')));
});
