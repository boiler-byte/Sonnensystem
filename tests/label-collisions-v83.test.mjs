import assert from 'node:assert/strict';
import {test} from 'node:test';
import {layoutSceneLabels,drawSceneLabels} from '../src/renderer/labels.js';

const VP=new Float32Array([20,0,0,0,0,20,0,0,0,0,1,0,0,0,0,20]);
const makeBody=(id,type='satellite')=>({id,name:id,type,radiusKm:100});
const ctx={
  font:'', calls:[],
  measureText:s=>({width:s.length*7}),
  setTransform(){},clearRect(){},strokeText(s){this.calls.push(s);},fillText(s){this.calls.push(s);},
  beginPath(){},arc(){},fill(){},stroke(){}
};
const scene=(bodies,coords,options={})=>({
  width:640,height:420,dpr:1,settings:{labels:true,...options.settings},
  rendered:bodies,positions:new Map(bodies.map((b,i)=>[b.id,coords[i]])),
  selectedId:options.selectedId??'none',planetId:options.planetId??'earth',
  labels:{getContext:()=>ctx}
});

test('v83: 40 distinct objects occupying one pixel all keep their labels',()=>{
  const bodies=Array.from({length:40},(_,i)=>makeBody(`sat-${String(i).padStart(2,'0')}`));
  const r=scene(bodies,bodies.map(()=>[0,0,0]));
  const out=layoutSceneLabels(r,VP,ctx,0);
  assert.equal(out.length,40);
  assert.equal(new Set(out.map(i=>i.body.id)).size,40);
  assert.ok(out.every(i=>i.side==='right'));
  assert.equal(new Set(out.map(i=>JSON.stringify(i.rect))).size,1,
    'identical-size labels share screen rectangles instead of being hidden');
  ctx.calls=[];
  drawSceneLabels(r,VP);
  assert.equal(ctx.calls.length,80,'all 40 labels are stroked and filled');
});

test('v83: a large planet disk never removes a satellite label',()=>{
  const bodies=[makeBody('giant','planet'),makeBody('probe')];
  const r=scene(bodies,[[0,0,0],[0,0,0]],{selectedId:'giant'});
  r.bodyRadius=b=>b.id==='giant'?35:0;
  const out=layoutSceneLabels(r,VP,ctx,0);
  assert.deepEqual(new Set(out.map(i=>i.body.id)),new Set(['giant','probe']));
  assert.equal(out.at(-1).body.id,'giant');
});

test('v85: motion no longer suppresses labels; explicit toggle still works',()=>{
  const bodies=Array.from({length:5},(_,i)=>makeBody(`body-${i}`));
  const r=scene(bodies,bodies.map(()=>[0,0,0]));
  assert.equal(layoutSceneLabels(r,VP,ctx,0).length,5);
  r.positions.set('body-0',[.5,0,0]);
  const fast=layoutSceneLabels(r,VP,ctx,16);
  assert.equal(fast.length,5,'all moving bodies keep their labels');
  r.settings.labels=false;
  assert.deepEqual(layoutSceneLabels(r,VP,ctx,32),[]);
});
