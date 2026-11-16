import assert from 'node:assert/strict';
import {test} from 'node:test';
import {layoutSceneLabels, LABEL_STABILITY} from '../src/renderer/labels.js';

const VP=new Float32Array([20,0,0,0, 0,20,0,0, 0,0,1,0, 0,0,0,20]);
const b=(id,type='satellite')=>({id,type,name:id,radiusKm:0});
const ctx={font:'',measureText:s=>({width:s.length*7})};
function scene(pos=[0,0,0],planetId='earth'){
  const body=b('sat-25544');
  const renderer={width:640,height:420,settings:{labels:true},selectedId:'earth',planetId,
    rendered:[body],positions:new Map([[body.id,pos]])};
  return {renderer,layout:now=>layoutSceneLabels(renderer,VP,ctx,now)};
}

test('v16: satellite label only changes side to remain on-screen',()=>{
  for (const planetId of ['earth',null]) {
    const {renderer,layout}=scene([0,0,0],planetId);
    assert.equal(layout(0)[0].side,'right');
    renderer.positions.set('sat-25544',[.94,0,0]);
    assert.equal(layout(300)[0].side,'left','edge requires alternate side immediately');
    assert.equal(layout(600)[0].side,'left');
    renderer.positions.set('sat-25544',[0,0,0]);
    assert.equal(layout(1000)[0].side,'left','keeps established side on return');
  }
});

test('v16: no delayed collision-driven side switching',()=>{
  const {renderer,layout}=scene();
  assert.equal(layout(0)[0].side,'right');
  renderer.positions.set('sat-25544',[.94,0,0]);
  for (const now of [300,700,1200,1400,1620,1900])
    assert.equal(layout(now)[0].side,'left');
  renderer.positions.set('sat-25544',[0,0,0]);
  assert.equal(layout(2600)[0].side,'left');
});

test('v10: reset and fast-motion filter remain functional with anchors',()=>{
  const {renderer,layout}=scene();
  layout(0);
  assert.equal(renderer._labelState.anchors.get('sat-25544').side,'right');
  renderer.positions.set('sat-25544',[.8,0,0]);
  assert.equal(layout(16).length,0,'fast satellite hidden');
  assert.equal(renderer._labelState.anchors.get('sat-25544').side,'right','fast movement remembers anchor');
  renderer.planetId='mars';
  assert.equal(layout(32)[0].side,'left','different scene resets placement');
  renderer.settings.labels=false;
  assert.equal(layout(48).length,0);
  assert.equal(renderer._labelState,null);
});
