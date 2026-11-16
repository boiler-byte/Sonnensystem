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

test('v10: fast conjunctions do not make satellite labels switch side repeatedly',()=>{
  for(const planetId of ['earth',null]) {
    const {renderer,layout}=scene([0,0,0],planetId);
    assert.equal(layout(0)[0].side,'right');
    renderer.positions.set('sat-25544',[.94,0,0]);
    assert.equal(layout(300).length,0,'obstructed side is hidden rather than moved immediately');
    assert.equal(layout(600).length,0,'one short obstruction does not flip the side');
    renderer.positions.set('sat-25544',[0,0,0]);
    layout(800); // large position change might trigger motion-based suppression
    assert.equal(layout(1000)[0].side,'right','returns to established side, no jump');
  }
});

test('v10: only persistent blockage permits a deliberate stable side change',()=>{
  const {renderer,layout}=scene();
  assert.equal(layout(0)[0].side,'right');
  renderer.positions.set('sat-25544',[.94,0,0]);
  assert.equal(layout(300).length,0);
  assert.equal(layout(700).length,0);
  assert.equal(layout(1200).length,0,'side hold not elapsed');
  assert.equal(layout(1400).length,0,'alternative needs clear-time confirmation');
  assert.equal(layout(1620)[0].side,'left','sustained blockage triggers one switch');
  assert.equal(layout(1900)[0].side,'left');
  renderer.positions.set('sat-25544',[0,0,0]);
  layout(2300);
  assert.equal(layout(2600)[0].side,'left','does not snap back to default right side');
  assert.ok(LABEL_STABILITY.sideHoldMs>=1000);
  assert.ok(LABEL_STABILITY.blockedMs>=400);
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
