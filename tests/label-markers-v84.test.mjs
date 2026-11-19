import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CATEGORY_COLORS} from '../src/data/bodies.js';
import {layoutSceneLabels,drawSceneLabels} from '../src/renderer/labels.js';

const VP=new Float32Array([20,0,0,0,0,20,0,0,0,0,1,0,0,0,0,20]);

function makeCtx(){
  return {
    font:'',fillStyle:'',strokeStyle:'',lineWidth:0,globalAlpha:1,textBaseline:'',lineJoin:'',
    ops:[],_path:null,
    measureText:s=>({width:s.length*7}),
    setTransform(){},clearRect(){},beginPath(){this._path=null;},
    arc(x,y,r){this._path={x,y,r};},
    fill(){this.ops.push({type:'fillArc',...this._path,style:this.fillStyle,alpha:this.globalAlpha});},
    stroke(){this.ops.push({type:'strokeArc',...this._path,style:this.strokeStyle,alpha:this.globalAlpha,lineWidth:this.lineWidth});},
    strokeText(text,x,y){this.ops.push({type:'strokeText',text,x,y,style:this.strokeStyle,alpha:this.globalAlpha});},
    fillText(text,x,y){this.ops.push({type:'fillText',text,x,y,style:this.fillStyle,alpha:this.globalAlpha});}
  };
}

function scene(body, options={}){
  const ctx=makeCtx();
  return {
    ctx,
    renderer:{
      width:640,height:420,dpr:1,
      settings:{labels:true,...options.settings},
      rendered:[body],positions:new Map([[body.id,options.pos??[0,0,0]]]),
      selectedId:options.selectedId??'none',planetId:options.planetId??'earth',
      bodyRadius:()=>options.bodyRadius??0,
      labels:{getContext:()=>ctx}
    }
  };
}

test('v84: tiny labeled object gets only a center marker in category color',()=>{
  const body={id:'iss',name:'ISS',type:'satellite',radiusKm:1};
  const {ctx,renderer}=scene(body,{bodyRadius:0.05});
  const placed=layoutSceneLabels(renderer,VP,ctx,0);
  assert.equal(placed.length,1);
  drawSceneLabels(renderer,VP);
  const fillArcs=ctx.ops.filter(op=>op.type==='fillArc');
  assert.equal(fillArcs.length,1,'no extra leading label bullet remains');
  assert.deepEqual(fillArcs[0],{
    type:'fillArc',x:placed[0].projection.x,y:placed[0].projection.y,r:2.2,
    style:CATEGORY_COLORS.satellite,alpha:1
  });
  const strokeText=ctx.ops.find(op=>op.type==='strokeText');
  assert.equal(strokeText.x,placed[0].rect.x+2);
});

test('v84: large unselected objects keep their labels without any center marker',()=>{
  const body={id:'earth',name:'Earth',type:'planet',radiusKm:6371};
  const {ctx,renderer}=scene(body,{bodyRadius:8,selectedId:'none',planetId:null});
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.ops.filter(op=>op.type==='fillArc').length,0);
});

test('v84: selected object always shows a center marker in the selection color',()=>{
  const body={id:'mars',name:'Mars',type:'planet',radiusKm:3389};
  const {ctx,renderer}=scene(body,{bodyRadius:8,selectedId:'mars',planetId:null});
  const placed=layoutSceneLabels(renderer,VP,ctx,0);
  drawSceneLabels(renderer,VP);
  const fillArcs=ctx.ops.filter(op=>op.type==='fillArc');
  assert.equal(fillArcs.length,1);
  assert.deepEqual(fillArcs[0],{
    type:'fillArc',x:placed[0].projection.x,y:placed[0].projection.y,r:2.6,
    style:'#e7b979',alpha:1
  });
  const ring=ctx.ops.find(op=>op.type==='strokeArc');
  assert.ok(ring,'selected halo remains visible');
  assert.equal(ring.x,placed[0].projection.x);
  assert.equal(ring.y,placed[0].projection.y);
});
