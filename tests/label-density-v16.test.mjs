import assert from 'node:assert/strict';
import {test} from 'node:test';
import {layerPreset, STANDARD_LAYERS, layerEnabled} from '../src/data/layers.js';
import {layoutSceneLabels, LABEL_DENSITY} from '../src/renderer/labels.js';

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

test('v16: density cap holds in both views; selection is always visible',()=>{
  for(const planetId of [null,'earth']){
    const scene=makeScene(planetId);
    let labels=layoutSceneLabels(scene,VP,ctx,0);
    assert.equal(labels.length,LABEL_DENSITY.maxPerCell+1);
    assert.equal(labels[0].body.id,'sat-9');
    // Labels can visibly overlap now, without being suppressed by a collision.
    assert.deepEqual(labels[1].rect,labels[2].rect);
    for(const t of [16,32,64,120,200]){
      const newer=layoutSceneLabels(scene,VP,ctx,t);
      assert.deepEqual(newer.map(l=>l.body.id),labels.map(l=>l.body.id));
      assert.deepEqual(newer.map(l=>l.side),labels.map(l=>l.side));
    }
  }
});

test('v16: selected label remains visible even when the tile is full',()=>{
  const scene=makeScene('earth');
  scene.selectedId='offscreen';
  const first=layoutSceneLabels(scene,VP,ctx,0);
  assert.equal(first.length,2);
  scene.selectedId='sat-9';
  const second=layoutSceneLabels(scene,VP,ctx,250);
  assert.equal(second.length,3);
  assert.ok(second.some(x=>x.body.id==='sat-9'));
});

test('v16: labels retain a grid tile across small boundary changes',()=>{
  const scene=makeScene();
  scene.rendered=[body('sat-1')];scene.positions=new Map([['sat-1',[-.01,0,0]]]);
  layoutSceneLabels(scene,VP,ctx,0);
  const cell=scene._labelState.anchors.get('sat-1').cell;
  scene.positions.set('sat-1',[.01,0,0]);
  layoutSceneLabels(scene,VP,ctx,500);
  assert.deepEqual(scene._labelState.anchors.get('sat-1').cell,cell);
});
