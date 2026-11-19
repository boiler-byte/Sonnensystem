import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CATEGORY_COLORS} from '../src/data/bodies.js';
import {CAMERA_FOV} from '../src/renderer/math.js';
import {drawSceneLabels} from '../src/renderer/labels.js';

const VP = new Float32Array([20,0,0,0,0,20,0,0,0,0,1,0,0,0,0,20]);
const projectionScale = 420/(2*Math.tan(CAMERA_FOV/2)*20);

function canvas(){
  return {
    ops:[],path:null,globalAlpha:1,
    setTransform(){},clearRect(){this.ops=[];},
    beginPath(){this.path=null;},arc(x,y,r){this.path={x,y,r};},
    fill(){this.ops.push({kind:'dot',...this.path,color:this.fillStyle});},
    stroke(){this.ops.push({kind:'ring',...this.path});},
    fillText(text){this.ops.push({kind:'text',text});},
    strokeText(text){this.ops.push({kind:'outline',text});},
    measureText:text=>({width:text.length*7})
  };
}
function scene(bodies,{radii={},selectedId='none',mode='points',planetId=null,row=false,ringScale}={}){
  const ctx=canvas();
  const renderer={
    width:640,height:420,dpr:1,
    settings:{labels:mode,row,fourMoons:false},selectedId,planetId,simTime:Date.now(),
    rendered:bodies,bodies,byId:new Map(bodies.map(b=>[b.id,b])),
    positions:new Map(bodies.map((b,i)=>[b.id,[i*0.04,0,0]])),
    bodyRadius:b=>radii[b.id]??0,
    ringScale,
    labels:{getContext:()=>ctx}
  };
  return {ctx,renderer};
}
const draw=(r,vp=VP)=>{drawSceneLabels(r.renderer,vp);return r.ctx.ops;};
const dots=ops=>ops.filter(op=>op.kind==='dot');

test('v92: point-only uses the ordinary labels threshold for unselected objects',()=>{
  const planet={id:'mars',name:'Mars',type:'planet',radiusKm:3389};
  const under=2.1/projectionScale;
  const over=2.3/projectionScale;
  const scenePoints=scene([planet],{radii:{mars:over}});
  assert.equal(dots(draw(scenePoints)).length,0,'big visible planet does not need an extra dot');
  assert.equal(scenePoints.ctx.ops.filter(o=>o.kind==='text').length,0);
  scenePoints.renderer.bodyRadius=()=>under;
  assert.deepEqual(dots(draw(scenePoints)).map(d=>[d.r,d.color]),[[2.2,CATEGORY_COLORS.planet]],
    'a smaller-than-dot planet gets exactly one center marker');
  scenePoints.renderer.bodyRadius=()=>over;
  assert.equal(dots(draw(scenePoints)).length,0,'marker disappears again as body grows');
  scenePoints.renderer.settings.labels=true;
  assert.equal(dots(draw(scenePoints)).length,0,'ordinary labels use same threshold');
  assert.equal(scenePoints.ctx.ops.filter(o=>o.kind==='text').length,1);
  scenePoints.renderer.bodyRadius=()=>under;
  assert.equal(dots(draw(scenePoints)).length,1,'ordinary labels show a marker for tiny bodies');
});

test('v92: selected large object has permanent gold dot and selection ring without text',()=>{
  const body={id:'jupiter',name:'Jupiter',type:'planet',radiusKm:69911};
  const current=scene([body],{selectedId:'jupiter',radii:{jupiter:10}});
  const ops=draw(current);
  assert.deepEqual(dots(ops).map(d=>({x:d.x,y:d.y,r:d.r,color:d.color})),
    [{x:320,y:210,r:2.6,color:'#e7b979'}]);
  assert.equal(ops.filter(o=>o.kind==='ring').length,1);
  assert.equal(ops.filter(o=>o.kind==='text'||o.kind==='outline').length,0);
  current.renderer.settings.labels=false;
  assert.equal(draw(current).length,0,'off mode still clears all markers and rings');
});

test('v92: only small or selected bodies are marked; category colors and priority remain',()=>{
  const bodies=[
    {id:'earth',name:'Erde',type:'planet',radiusKm:6371},
    {id:'tiny',name:'Mini',type:'asteroid',radiusKm:1},
    {id:'giant',name:'Riese',type:'dwarf',radiusKm:1300}
  ];
  const current=scene(bodies,{radii:{earth:12,tiny:0.02,giant:18},selectedId:'giant'});
  const ops=draw(current);
  assert.equal(dots(ops).length,2,'large unselected planet is not marked');
  assert.deepEqual(dots(ops).map(o=>o.color),[CATEGORY_COLORS.asteroid,'#e7b979']);
  assert.deepEqual(dots(ops).map(o=>o.r),[2.2,2.6]);
  assert.equal(ops.filter(o=>o.kind==='ring').length,1);
  assert.equal(ops.filter(o=>o.kind==='text').length,0);
});

test('v92: in row view, Saturn ring silhouette uses same clearance as ordinary labels',()=>{
  const saturn={id:'saturn',name:'Saturn',type:'planet',radiusKm:58232};
  const current=scene([saturn],{radii:{saturn:0.01},row:true,ringScale:()=>2});
  assert.equal(dots(draw(current)).length,0,'visible ring means the planet is not marker-sized');
  current.renderer.selectedId='saturn';
  assert.equal(dots(draw(current)).length,1,'selection overrides ring size');
});
