import assert from 'node:assert/strict';
import {test} from 'node:test';
import {OrbitGeometryCache,MAX_CACHED_ORBITS} from '../src/renderer/orbit-cache.js';
import {orbitRibbonVertices,drawOrbitLine} from '../src/renderer/orbits.js';
import {keplerPosition} from '../src/data/orbital-math.js';
import {J2000} from '../src/data/bodies.js';
import {DAY} from '../src/renderer/math.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {drawSceneBodies} from '../src/renderer/scene-objects.js';
import {TextureManager} from '../src/renderer/textures.js';
import {program} from '../src/renderer/shaders.js';
import {loop} from '../src/app/animation-loop.js';
import {S,renderer,setRenderer} from '../src/app/state.js';

const sun={id:'sun',type:'star',radiusKm:696340};
function orbit(id='earth'){
 return {id,type:'planet',parentId:'sun',a:1,periodDays:365.25,e:.1,i:7,node:35,peri:12,M:6,epoch:J2000};
}
const VP=new Float32Array([.3,0,0,0,0,.3,0,0,0,0,.3,0,0,0,0,1]);

test('cached orbital points match the original Kepler samples and react to moving centers',()=>{
 const cache=new OrbitGeometryCache(),body=orbit(),center=[2,3,4],radius=6,n=16;
 const sample=cache.get(body,sun,radius,n,center);
 assert.equal(cache.entries.size,1);
 for(let i=0;i<=n;i++){
  const reference=keplerPosition(body,sun,J2000+i/n*body.periodDays*DAY,null,radius);
  for(let j=0;j<3;j++){
   assert.equal(sample.relative[i*3+j],reference[j]);
   assert.equal(sample.world[i*3+j],Math.fround(center[j]+reference[j]));
  }
 }
 const world=sample.world,relative=sample.relative;
 assert.equal(cache.get(body,sun,radius,n,center),sample,'reuses sampled orbit');
 assert.equal(sample.world,world,'reuses the GPU input buffer');
 assert.equal(sample.relative,relative);
 const shifted=cache.get(body,sun,radius,n,[3,3,4]);
 assert.equal(shifted,sample,'moving planet keeps its orbit shape');
 assert.equal(shifted.world[0],Math.fround(shifted.relative[0]+3));
});

test('orbit cache invalidates on in-place ephemeris and scale changes, bounds memory',()=>{
 const cache=new OrbitGeometryCache(3),body=orbit();
 const base=cache.get(body,sun,1,100,[0,0,0]);
 body.e=.4;
 assert.notEqual(cache.get(body,sun,1,100,[0,0,0]),base,'new eccentricity');
 const eccentric=cache.get(body,sun,1,100,[0,0,0]);
 assert.notEqual(cache.get(body,sun,2,100,[0,0,0]),eccentric,'new orbit radius');
 for(let i=0;i<10;i++)cache.get({...orbit(`b-${i}`)},sun,1,100,[0,0,0]);
 assert.ok(cache.entries.size<=3);
 cache.clear();assert.equal(cache.entries.size,0);
 assert.equal(MAX_CACHED_ORBITS,256);
});

test('ribbon outputs remain identical with reusable buffers even across clipping',()=>{
 const p=new Float32Array([0,0,0,1,0,0,2,1,0,200,1,200,0,1,0]);
 const expected=orbitRibbonVertices(p,VP,1000,600,2.4);
 const output=new Float32Array((p.length/3-1)*18);
 const actual=orbitRibbonVertices(p,VP,1000,600,2.4,output);
 assert.deepEqual(actual,expected);
 assert.equal(actual.buffer,output.buffer,'no additional data allocation');
 assert.ok(actual.length<output.length,'clipped segments may return a view');
});

test('invisible orbit skips geometry and visible orbit reuses cached buffers',()=>{
 const b=orbit(),inputBuffers=[],calls=[];
 const gl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,TRIANGLES:3,LINE_STRIP:4,
   bufferData(_target,vertices){inputBuffers.push(vertices);},
   getUniformLocation:()=>({}),uniform4f(){},drawArrays(...args){calls.push(args);}};
 const r={gl,planetId:null,width:640,height:480,byId:new Map([['sun',sun]]),
   settings:{orbitContrast:false},useLineProgram:()=>({}),sceneOrbitOpacity:()=>0};
 drawOrbitLine(r,b,[0,0,0],VP,.2,false);
 assert.equal(r._orbitGeometryCache,undefined,'invisible orbits do not allocate');
 r.sceneOrbitOpacity=()=>1;
 drawOrbitLine(r,b,[0,0,0],VP,.2,false);
 drawOrbitLine(r,b,[0,0,0],VP,.2,false);
 assert.equal(calls.length,2);
 assert.equal(inputBuffers[0],inputBuffers[1],'vertex buffers are reused');
});

test('stable frames skip Kepler work; time, settings, overrides and transitions invalidate',()=>{
 const r=Object.create(SolarRenderer.prototype),calls=[];
 r.planetId=null;r.positions=new Map([['sun',[0,0,0]]]);r.overrides=new Map();
 r.calcPositions=time=>calls.push(time);
 const settings={scaleOrbits:false,scaleObjects:false,row:false};
 r.start(123,'earth',settings);r.start(123,'mars',settings);
 assert.equal(calls.length,1,'selection and lighting changes do not shift world positions');
 settings.lighting='realistic';r.start(123,'mars',settings);
 assert.equal(calls.length,1);
 r.start(124,'earth',settings);
 settings.scaleOrbits=true;r.start(124,'earth',settings);
 r.setOverride('earth','2026-11-19',[1,2,3]);r.start(124,'earth',settings);
 assert.equal(calls.length,4);
 r.transition={amount:.5};r.start(124,'earth',settings);r.start(124,'earth',settings);
 assert.equal(calls.length,6,'each transition step recalculates positions');
 r.transition=null;r.start(124,'earth',settings);r.start(124,'earth',settings);
 assert.equal(calls.length,7);
 settings.row=true;settings.layers={mode:'custom',types:new Set(['star','planet'])};
 r.start(124,'earth',settings);r.start(124,'earth',settings);
 assert.equal(calls.length,8);
 settings.layers.types.add('moon');r.start(124,'earth',settings);
 assert.equal(calls.length,9,'row layout reflects active category changes');
});

test('shader binding cache resolves each uniform/attribute once, including null',()=>{
 const r=Object.create(SolarRenderer.prototype),count={uniform:0,attribute:0},p={};
 r.gl={getUniformLocation(){count.uniform++;return null;},getAttribLocation(){count.attribute++;return 4;}};
 assert.equal(r.uniform(p,'not-present'),null);
 assert.equal(r.uniform(p,'not-present'),null);
 assert.equal(r.attribute(p,'aPosition'),4);
 assert.equal(r.attribute(p,'aPosition'),4);
 assert.deepEqual(count,{uniform:1,attribute:1});
});

test('repeated same-size resize does not reallocate the WebGL or label canvases',()=>{
 const oldWindow=globalThis.window,viewports=[];
 const rect={width:800,height:500};
 const makeCanvas=()=>{
  let width=0,height=0;const c={resets:0,style:{},parentElement:{getBoundingClientRect:()=>rect}};
  Object.defineProperties(c,{
   width:{get:()=>width,set:v=>{width=v;c.resets++;}},
   height:{get:()=>height,set:v=>{height=v;c.resets++;}}
  });return c;
 };
 const r=Object.create(SolarRenderer.prototype);
 r.canvas=makeCanvas();r.labels=makeCanvas();r.gl={viewport:(...v)=>viewports.push(v)};
 r.textures={mobile:false,setMobile(){assert.fail('mobile mode unchanged')}};
 try{
  globalThis.window={devicePixelRatio:1,matchMedia:()=>({matches:false}),innerWidth:1200};
  r.resize();assert.deepEqual(viewports,[[0,0,800,500]]);
  r.resize();assert.equal(r.canvas.resets,2);assert.equal(r.labels.resets,2);
  assert.equal(viewports.length,1);
  rect.width=801;r.resize();assert.equal(viewports.length,2);
  assert.equal(r.canvas.resets,4);
 }finally{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;}
});

test('planet children are indexed once, and replaceable catalog and scene buffers stay current',()=>{
 const earth={id:'earth',type:'planet',parentId:'sun'};
 const moon={id:'moon',type:'moon',parentId:'earth'};
 const r=Object.create(SolarRenderer.prototype);
 r.planetId=null;r.setBodies([sun,earth,moon]);
 const children=r.planetChildren('earth');
 assert.deepEqual(children,[moon]);
 assert.equal(r.planetChildren('earth'),children,'no per-frame filtering');
 r.setBodies([sun,earth]);assert.deepEqual(r.planetChildren('earth'),[]);
 r.bodies=[sun,earth,moon]; // External embedders may set bodies directly.
 assert.deepEqual(r.planetChildren('earth'),[moon]);
 const fake={rendered:[],positions:new Map([['earth',[0,0,0]]]),shouldDraw:()=>true,
  drawSphere(){},drawLabels(){}};
 const first=drawSceneBodies(fake,[earth],VP);
 assert.equal(drawSceneBodies(fake,[earth],VP),first);
});

test('in-flight texture uploads are released if the manager is disposed',async()=>{
 const deleted=[],gl={MAX_TEXTURE_SIZE:1,getParameter:()=>2048,deleteTexture:t=>deleted.push(t)};
 const manager=new TextureManager(gl,{mobile:true});let finish;
 manager.load=()=>new Promise(resolve=>{finish=resolve;});
 manager.get({id:'earth'},null,'earth');
 assert.equal(manager.active,1);
 manager.dispose();manager.dispose();
 const handle={id:1};finish({handle,width:32,height:32,mipmaps:false});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(deleted,[handle]);
 assert.equal(manager.entries.size,0);assert.equal(manager.bytes,0);
 assert.equal(manager.active,0);
 assert.equal(manager.get({id:'earth'},null,'earth'),null,'disposed manager does not queue new jobs');
});

test('a canceled image download cannot upload a GPU texture',async()=>{
 const gl={MAX_TEXTURE_SIZE:1,getParameter:()=>2048,deleteTexture(){}};
 const manager=new TextureManager(gl,{mobile:true});let finish,uploads=0;
 manager.manifest=new Map([['/textures/mobile/earth.webp','a'.repeat(64)]]);
 manager.nextManifestCheck=Infinity;
 manager.loadImage=()=>new Promise(resolve=>{finish=resolve;});
 manager.upload=()=>{uploads++;return {handle:{},width:32,height:32,mipmaps:false};};
 manager.get({id:'earth'},null,'earth');manager.dispose();
 finish({naturalWidth:32,naturalHeight:32});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(uploads,0);
 assert.equal(manager.bytes,0);
 assert.equal(manager.entries.size,0);
});

test('linked shader handles are cleaned up after program creation',()=>{
 const deleted=[],gl={VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,
  createShader:type=>({type}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,
  createProgram:()=>({id:1}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,
  deleteShader:s=>deleted.push(s.type)};
 assert.deepEqual(program(gl,'vertex','fragment'),{id:1});
 assert.deepEqual(deleted,[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER]);
});

test('hidden tab neither draws nor advances animation time',()=>{
 const oldDocument=globalThis.document,oldRaf=globalThis.requestAnimationFrame,oldRenderer=renderer;
 const oldTime=S.time,oldPlaying=S.playing;
 const scheduled=[],calls=[];
 try{
  S.playing=true;S.time=555;
  globalThis.document={hidden:true};
  globalThis.requestAnimationFrame=callback=>{scheduled.push(callback);};
  setRenderer({draw:()=>calls.push('draw')});
  loop.prev=0;loop(1000);
  assert.deepEqual(calls,[]);
  assert.equal(S.time,555);
  assert.equal(scheduled.length,1);
  assert.equal(scheduled[0],loop);
 }finally{
  setRenderer(oldRenderer);S.time=oldTime;S.playing=oldPlaying;
  if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
  if(oldRaf===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=oldRaf;
 }
});
