import assert from 'node:assert/strict';
import {test} from 'node:test';
import {drawSceneLabels,layoutSceneLabels} from '../src/renderer/labels.js';

const VP=new Float32Array([20,0,0,0,0,20,0,0,0,0,1,0,0,0,0,20]);
const mockCtx=()=>({
  font:'',texts:[],dots:[],
  measureText:s=>({width:s.length*7}),
  setTransform(){},clearRect(){this.texts=[];this.dots=[];},
  beginPath(){},arc(x,y,r){this.dots.push({x,y,r});},fill(){},stroke(){},
  strokeText(s){this.texts.push(s);},fillText(s){this.texts.push(s)}
});

function createScene({row=false,selectedId='none'}={}){
  const ctx=mockCtx();
  const bodies=[
    {id:'earth',name:'Earth',type:'planet',radiusKm:6371},
    {id:'mars',name:'Mars',type:'planet',radiusKm:3389},
    {id:'probe',name:'Probe',type:'probe',radiusKm:1}
  ];
  const positions=new Map([['earth',[-.6,0,0]],['mars',[0,0,0]],['probe',[.6,0,0]]]);
  const renderer={
    width:800,height:500,dpr:1,rendered:bodies,positions,selectedId,
    planetId:'earth',settings:{labels:true,row},
    bodyRadius:()=>0,
    labels:{getContext:()=>ctx}
  };
  if(row)renderer._rowLabelOrder=new Map(bodies.map((b,i)=>[b.id,i]));
  return {ctx,renderer};
}

test('v85: large camera pan in a 4-ms frame preserves all eligible labels and markers',()=>{
  const {renderer,ctx}=createScene();
  const initial=layoutSceneLabels(renderer,VP,ctx,0);
  assert.equal(initial.length,3);
  // Simulate the entire scene moving hundreds of CSS pixels in four milliseconds.
  for(const [id,pos] of renderer.positions)renderer.positions.set(id,[pos[0]+.3,0,0]);
  const moving=layoutSceneLabels(renderer,VP,ctx,4);
  assert.deepEqual(new Set(moving.map(item=>item.body.id)),new Set(['earth','mars','probe']));
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.texts.length,6,'all three names are actually painted');
  assert.equal(ctx.dots.length,3,'tiny bodies retain their central category markers');
  assert.equal(layoutSceneLabels(renderer,VP,ctx,8).length,3,'no settling period');
});

test('v85: rapid camera movement keeps row labels and selected center marker',()=>{
  const {renderer,ctx}=createScene({row:true,selectedId:'mars'});
  assert.equal(layoutSceneLabels(renderer,VP,ctx,0).length,3);
  for(const [id,pos] of renderer.positions)renderer.positions.set(id,[pos[0]+.3,0,0]);
  const labels=layoutSceneLabels(renderer,VP,ctx,4);
  assert.equal(labels.length,3);
  assert.equal(labels.at(-1).body.id,'mars','selection retains its render priority');
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.texts.length,6);
  assert.equal(ctx.dots.length,4,'one marker per object and selected halo');
  renderer.settings.labels=false;
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.texts.length,0,'manual label toggle remains authoritative');
  assert.equal(ctx.dots.length,0);
});
