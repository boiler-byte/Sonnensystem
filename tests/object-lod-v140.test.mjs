import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { OBJECT_LOD, LOD_DIAMETERS, objectLOD, projectedSphereDiameter, LODMarkerBatch, MARKER_FLOATS } from '../src/renderer/lod.js';
import { CAMERA_FOV, perspective } from '../src/renderer/math.js';
import { sphereGeometry, ringGeometry } from '../src/renderer/geometry.js';
import { BODY_SIMPLE_FS, LOD_MARKER_VS, LOD_MARKER_FS } from '../src/renderer/shaders.js';
import { SolarRenderer } from '../src/renderer/renderer.js';
import { drawSceneBodies } from '../src/renderer/scene-objects.js';

const WIDTH=900,HEIGHT=600,DEPTH=10,POSITION=[0,0,-DEPTH];
const VP=perspective(CAMERA_FOV,WIDTH/HEIGHT,.1,100);
const radiusForPixels=diameter=>{const t=diameter*Math.tan(CAMERA_FOV/2)/HEIGHT;return DEPTH*t/Math.sqrt(1+t*t);};

// Cross all three LOD thresholds without relying on floating-point equality.
test('v140: exact 32/8/2 CSS-pixel diameter thresholds choose all four levels',()=>{
  assert.deepEqual(LOD_DIAMETERS,{full:32,simple:8,marker:2});
  for(const [diameter,level] of [[100,0],[32,0],[31.99,1],[8,1],[7.99,2],[2,2],[1.99,3],[0,3]])
    assert.equal(objectLOD(diameter),level,`${diameter}px -> ${level}`);
  assert.equal(objectLOD(NaN),OBJECT_LOD.FULL,'invalid projection falls back to sphere');
  assert.equal(objectLOD(Infinity),OBJECT_LOD.FULL,'camera within large sphere');
});

test('v140: screen diameter is perspective-correct, uses CSS pixels and handles the near plane',()=>{
  for(const diameter of [1,4,16,40]){
    const result=projectedSphereDiameter(POSITION,VP,HEIGHT,radiusForPixels(diameter));
    assert.ok(Math.abs(result-diameter)<1e-9,`${diameter} -> ${result}`);
  }
  const r=radiusForPixels(8);
  assert.ok(projectedSphereDiameter([0,0,-5],VP,HEIGHT,r)>projectedSphereDiameter(POSITION,VP,HEIGHT,r));
  assert.equal(projectedSphereDiameter(POSITION,VP,HEIGHT,11),Infinity);
  assert.equal(projectedSphereDiameter(POSITION,VP,HEIGHT,0),0);
  assert.ok(Number.isNaN(projectedSphereDiameter(POSITION,VP,0,r)));
});

test('v140: simple mesh and Saturn ring reduce geometry by more than 80%',()=>{
  const full=sphereGeometry(),simple=sphereGeometry(12,16);
  assert.ok(simple.indices.length<full.indices.length*.20);
  assert.ok(simple.vertices.length<full.vertices.length*.20);
  assert.equal(ringGeometry(40).length,ringGeometry().length/5);
  assert.match(BODY_SIMPLE_FS,/uOptimizedLighting/);
  assert.doesNotMatch(BODY_SIMPLE_FS,/noise3|texture2D/);
  assert.match(LOD_MARKER_VS,/uPixelRatio/);
  assert.match(LOD_MARKER_VS,/gl_PointSize/);
  assert.match(LOD_MARKER_FS,/gl_PointCoord/);
});

test('v140: marker batch reuses buffers, separates transparent ghosts and preserves the 1px point',()=>{
  const batch=new LODMarkerBatch(1);
  batch.push([1,2,3],[.2,.3,.4],1,4,OBJECT_LOD.MARKER);
  batch.push([4,5,6],[.5,.6,.7],.5,1.5,OBJECT_LOD.PIXEL);
  batch.push([7,8,9],[1,0,0],1,7,OBJECT_LOD.MARKER); // growth
  assert.equal(batch.opaqueCount,2);
  assert.equal(batch.translucentCount,1);
  assert.equal(batch.vertices('opaque').length,2*MARKER_FLOATS);
  assert.equal(batch.vertices('opaque')[7],4);
  assert.equal(batch.vertices('opaque')[8],0);
  assert.equal(batch.vertices('translucent')[7],1);
  assert.equal(batch.vertices('translucent')[8],1);
  batch.reset();
  assert.equal(batch.opaqueCount+batch.translucentCount,0);
  assert.ok(batch.opaque.length>=2*MARKER_FLOATS,'buffer capacity persists');
});

function fakeGL(){
 const calls={elements:[],arrays:[],bufferData:[],depthMask:[],useProgram:[]};
 const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,FLOAT:3,TRIANGLES:4,UNSIGNED_SHORT:5,
  POINTS:6,DYNAMIC_DRAW:7,TEXTURE0:8,TEXTURE_2D:9,
  useProgram:p=>calls.useProgram.push(p),bindBuffer(){},enableVertexAttribArray(){},
  vertexAttribPointer(){},uniform1f(){},uniform3f(){},uniformMatrix4fv(){},
  uniform1i(){},activeTexture(){},bindTexture(){},
  depthMask:v=>calls.depthMask.push(v),
  bufferData:(target,data,usage)=>calls.bufferData.push({target,values:Array.from(data),usage}),
  drawArrays:(mode,first,count)=>calls.arrays.push({mode,first,count}),
  drawElements:(mode,count)=>calls.elements.push(count)};
 return {gl,calls};
}
function fakeRenderer(){
 const {gl,calls}=fakeGL();
 const r=Object.create(SolarRenderer.prototype);
 Object.assign(r,{gl,width:WIDTH,height:HEIGHT,dpr:1.5,bodyProgram:'full',simpleBodyProgram:'simple',
  markerProgram:'marker',ringProgram:'rings',sphereVB:'high-v',sphereIB:'high-i',sphereCount:7560,
  simpleSphereVB:'low-v',simpleSphereIB:'low-i',simpleSphereCount:1152,
  simpleRingVB:'small-ring',ringVB:'ring',markerVB:'points',
  _lodMarkers:new LODMarkerBatch(),settings:{lighting:'realistic',layers:{mode:'all',types:new Set()}},
  planetId:null,selectedId:null,simTime:0,byId:new Map(),positions:new Map(),rendered:[],
  sceneBodyOpacity:()=>1,rowInspectedRadius:(_body,radius)=>radius,renderSpinTime:()=>0,
  bodyRadius:body=>body.radius,shouldDraw:()=>true,drawLabels:()=>{},
  textures:{get:()=>{calls.textureReads=(calls.textureReads??0)+1;return null;}},
  attribute:(_p,name)=>({aPosition:0,aNormal:1,aUV:2,aColor:1,aSize:2,aPixel:3})[name]??-1,
  uniform:(_p,name)=>name});
 return {r,calls};
}

test('v140: renderer draws high/low-poly spheres and batches both point levels (no low-LOD texture fetches)',()=>{
 const {r,calls}=fakeRenderer();
 const bodies=[40,16,4,1].map((pixels,i)=>({id:`obj-${i}`,color:'#c4c0a4',type:'planet',style:'rock',radius:radiusForPixels(pixels)}));
 for(const b of bodies){r.positions.set(b.id,POSITION);r.byId.set(b.id,b);}
 drawSceneBodies(r,bodies,VP);
 assert.deepEqual(calls.elements,[7560,1152]);
 assert.equal(calls.textureReads,1,'only LOD0 resolves textures');
 assert.equal(calls.arrays.length,1,'LOD2 and LOD3 share one draw call');
 assert.equal(calls.arrays[0].count,2);
 assert.equal(calls.arrays[0].mode,r.gl.POINTS);
 const uploaded=calls.bufferData.at(-1).values;
 assert.ok(Math.abs(uploaded[7]-4)<1e-9,'LOD2 uses actual projected CSS diameter');
 assert.equal(uploaded[8],0,'LOD2 circular marker');
 assert.equal(uploaded[MARKER_FLOATS+7],1,'LOD3 always one CSS pixel');
 assert.equal(uploaded[MARKER_FLOATS+8],1,'LOD3 is a square pixel');
 assert.equal(r.rendered.length,4,'LOD does not hide objects from picking or labels');
 assert.equal(r._lodMarkers.opaqueCount,0,'batch is reset after rendering');
});

test('v140: 1000 distant bodies use just one point draw without texture lookups',()=>{
 const {r,calls}=fakeRenderer();
 const bodies=Array.from({length:1000},(_,i)=>({id:`small-${i}`,radius:radiusForPixels(i%2?1:3),
   color:'#c1cedd',style:'rock',type:'asteroid'}));
 for(const b of bodies){r.byId.set(b.id,b);r.positions.set(b.id,POSITION);}
 drawSceneBodies(r,bodies,VP);
 assert.equal(calls.arrays.length,1);
 assert.equal(calls.arrays[0].count,1000);
 assert.equal(calls.elements.length,0);
 assert.equal(calls.textureReads??0,0);
 assert.equal(r.rendered.length,1000);
 assert.ok(r._lodMarkers.opaque.length>=1000*MARKER_FLOATS,'GPU staging buffer grows as needed');
});

test('v140: semi-transparent scene ghosts use separate, non-depth-writing point draw',()=>{
 const {r,calls}=fakeRenderer();
 const body={id:'ghost',radius:radiusForPixels(4),color:'#ffffff',style:'rock'};
 r.drawSphere(body,POSITION,VP,{opacity:.35});
 r.flushLODMarkers(VP);
 assert.equal(calls.arrays.length,1);
 assert.deepEqual(calls.depthMask,[false,true]);
 assert.ok(Math.abs(calls.bufferData[0].values[6]-.35)<1e-7);
});

test('v140: Saturn rings become low-poly at LOD1 and disappear at point LODs',()=>{
 const {r,calls}=fakeRenderer();
 const saturn={id:'saturn',color:'#ddccaa',type:'planet',style:'saturn',radius:radiusForPixels(16)};
 r.byId.set('saturn',saturn);r.positions.set('saturn',POSITION);
 r.ringScale=()=>1;
 drawSceneBodies(r,[saturn],VP);
 assert.ok(calls.arrays.some(call=>call.mode===r.gl.TRIANGLES&&call.count===240),'40 segments for LOD1 ring');
 calls.arrays.length=0;
 saturn.radius=radiusForPixels(4);
 drawSceneBodies(r,[saturn],VP);
 assert.ok(calls.arrays.every(call=>call.mode!==r.gl.TRIANGLES),'LOD2 does not draw rings');
});

test('v140: zooming back in restores detailed sphere without changing selection/picking',()=>{
 const {r,calls}=fakeRenderer();
 const body={id:'earth',radius:radiusForPixels(1),color:'#3377aa',type:'planet',style:'earth'};
 r.byId.set('earth',body);r.positions.set('earth',POSITION);
 drawSceneBodies(r,[body],VP);
 assert.equal(calls.elements.length,0);
 body.radius=radiusForPixels(40);
 drawSceneBodies(r,[body],VP);
 assert.deepEqual(calls.elements,[7560]);
 assert.equal(r.rendered[0],body);
});

test('v140: new LOD module is available in the offline shell and app version is updated',async()=>{
 const root=new URL('../',import.meta.url);
 const [sw,html,pkg]=await Promise.all(['sw.js','index.html','package.json'].map(p=>readFile(new URL(p,root),'utf8')));
 const {version}=JSON.parse(pkg);
 const [major,minor]=version.split('.');
 assert.match(sw,new RegExp(`sonnensystem-shell-v${major}(?!\\d)`));
 assert.match(sw,/"\.\/src\/renderer\/lod\.js"/);
 assert.match(html,new RegExp(`name="app-version" content="V${major}\\.${minor}"`));
});
