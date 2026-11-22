import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {J2000} from '../src/data/bodies.js';
import {keplerPosition} from '../src/data/orbital-math.js';
import {sphereGeometry} from '../src/renderer/geometry.js';
import {bodyModel,ringModel,rotationPhase,localLightDirection} from '../src/renderer/object-orientation.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {parseCategory} from '../src/data/catalog.js';

const HOUR=3600000, eps=1e-5;
const approx=(actual,expected,tolerance=eps)=>assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected}`);
const angular=(a,b)=>approx(Math.atan2(Math.sin(a-b),Math.cos(a-b)),0);
const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const catalog=async(file,type)=>parseCategory(JSON.parse(await readFile(new URL('../data/catalog/'+file,import.meta.url),'utf8')),type,file);

test('atlas sphere maps north/up, 0-degree longitude/front and east/right without mirroring',()=>{
 const {vertices}=sphereGeometry(8,16);
 const vertex=(lat,lon)=>Array.from(vertices.slice((lat*17+lon)*8,(lat*17+lon)*8+8));
 const front=vertex(4,8),east=vertex(4,12),west=vertex(4,4);
 approx(front[0],0);approx(front[1],0);approx(front[2],1);
 approx(front[6],.5);approx(front[7],.5);
 approx(east[0],1);approx(east[2],0);approx(east[6],.75);
 approx(west[0],-1);approx(west[2],0);approx(west[6],.25);
 approx(vertex(0,8)[7],1);approx(vertex(8,8)[7],0);
 const seam0=vertex(4,0),seam1=vertex(4,16);
 approx(seam0[0],seam1[0]);approx(seam0[2],seam1[2]);
 approx(seam0[6],0);approx(seam1[6],1);
});

test('sidereal rotation is based only on simulated time and supports seek/pause',()=>{
 const earth={rotationPeriodHours:24,axialTiltDeg:23.4,epoch:J2000};
 angular(rotationPhase(earth,J2000),0);
 angular(rotationPhase(earth,J2000+6*HOUR),Math.PI/2);
 angular(rotationPhase(earth,J2000+12*HOUR),Math.PI);
 angular(rotationPhase(earth,J2000+24*HOUR),0);
 angular(rotationPhase(earth,J2000-6*HOUR),-Math.PI/2);
 assert.equal(rotationPhase(earth,J2000+7*HOUR),rotationPhase(earth,J2000+7*HOUR));
 angular(rotationPhase({...earth,texturePhaseDeg:90},J2000),Math.PI/2);
 // Absent/unknown periods must not be replaced with arbitrary rotation speeds.
 angular(rotationPhase({epoch:J2000},J2000+20*HOUR),0);
 angular(rotationPhase({rotationPeriodHours:0,texturePhaseDeg:30},J2000+200*HOUR),Math.PI/6);
});

test('retrograde Venus/Uranus have inverted axes, not a doubly inverted spin',()=>{
 const venus={rotationPeriodHours:-24,axialTiltDeg:177.4,epoch:J2000};
 const uranus={rotationPeriodHours:-17.2,axialTiltDeg:97.8,epoch:J2000};
 angular(rotationPhase(venus,J2000+6*HOUR),Math.PI/2);
 assert.ok(bodyModel(venus,[0,0,0],1,J2000)[5]<0);
 assert.ok(bodyModel(uranus,[0,0,0],1,J2000)[5]<0);
 angular(rotationPhase({rotationPeriodHours:-24,axialTiltDeg:0,epoch:J2000},J2000+6*HOUR),-Math.PI/2);
});

test('sphere surface rotates around its tilted axis while Saturn rings remain in its equatorial plane',()=>{
 const saturn={id:'saturn',axialTiltDeg:26.7,rotationPeriodHours:10.7,epoch:J2000};
 const sphere=bodyModel(saturn,[1,2,3],3,J2000+2*HOUR);
 const rings=ringModel(saturn,[1,2,3],6);
 for(let i=0;i<3;i++)approx(sphere[4+i]/3,rings[4+i]/6);
 approx(sphere[12],1);approx(sphere[13],2);approx(sphere[14],3);
 const before=bodyModel(saturn,[1,2,3],3,J2000);
 assert.ok(Math.abs(before[8]-sphere[8])>.01,'the sphere must spin');
 approx(rings[5]/6,Math.cos(26.7*Math.PI/180));
 // Heading metadata can adjust a texture axis without changing scale/position.
 const heading=ringModel({...saturn,axisHeadingDeg:90},[0,0,0],1);
 approx(heading[4],Math.sin(26.7*Math.PI/180));
});

test('tidally locked moons face the parent as the orbit progresses, even at non-circular phases',()=>{
 const moon={parentId:'earth',synchronousRotation:true,periodDays:27.3,
  a:384400,e:.07,i:5,node:17,peri:24,M:115,epoch:J2000,axialTiltDeg:6.7};
 const parent={id:'earth'};
 for(const ms of [J2000,J2000+7*86400000,J2000+15*86400000,J2000+30*86400000]){
   const rel=keplerPosition(moon,parent,ms,null,1);
   const toward=[-rel[0],-rel[1],-rel[2]];
   const length=Math.hypot(...toward);
   const m=bodyModel(moon,[100,200,300],1,ms);
   const alignment=(m[8]*toward[0]+m[9]*toward[1]+m[10]*toward[2])/length;
   assert.ok(alignment>.97,`sub-parent longitude wandered: ${alignment}`);
 }
});

test('lighting transforms into object space so the world-space terminator does not rotate',()=>{
 const body={axialTiltDeg:25,rotationPeriodHours:24,epoch:J2000};
 const world=[.4,.2,.9],norm=Math.hypot(...world),sun=world.map(n=>n/norm);
 for(const hours of [0,2,6,11]){
  const m=bodyModel(body,[2,3,4],2,J2000+hours*HOUR);
  const local=localLightDirection(sun,m);
  const reconstructed=[m[0]*local[0]+m[4]*local[1]+m[8]*local[2],
   m[1]*local[0]+m[5]*local[1]+m[9]*local[2],
   m[2]*local[0]+m[6]*local[1]+m[10]*local[2]];
  reconstructed.forEach((n,i)=>approx(n/2,sun[i]));
 }
});

test('curated source catalog exposes rotation/tilt and synchronous metadata',async()=>{
 const planets=await catalog('planets.json','planet');
 const earth=planets.find(b=>b.id==='earth'),venus=planets.find(b=>b.id==='venus');
 assert.ok(earth.rotationPeriodHours>23 && earth.rotationPeriodHours<24);
 assert.ok(earth.axialTiltDeg>23 && earth.axialTiltDeg<24);
 assert.ok(venus.rotationPeriodHours<0 && venus.axialTiltDeg>90);
 const moons=await catalog('moons.json','moon');
 for(const id of ['moon','phobos','io','europa','ganymede','callisto','titan','charon'])
  assert.equal(moons.find(b=>b.id===id)?.synchronousRotation,true);
 const saturn=planets.find(b=>b.id==='saturn');
 approx(ringModel(saturn,[0,0,0],1)[5],Math.cos(saturn.axialTiltDeg*Math.PI/180));
});

test('catalog rejects impossible or malformed rotational properties but accepts optional data',async()=>{
 const doc=JSON.parse(await readFile(new URL('../data/catalog/planets.json',import.meta.url),'utf8'));
 const make=()=>structuredClone(doc);
 for(const bad of [0,Infinity,NaN,'24']){
  const record=make();record.objects[0].physical.rotationPeriodHours=bad;
  assert.throws(()=>parseCategory(record,'planet'),/rotationPeriodHours/);
 }
 for(const bad of [-1,181,'45']){
  const record=make();record.objects[0].physical.axialTiltDeg=bad;
  assert.throws(()=>parseCategory(record,'planet'),/axialTiltDeg/);
 }
 const phase=make();phase.objects[0].appearance.texturePhaseDeg=45;
 phase.objects[0].appearance.axisHeadingDeg=-35;
 const parsed=parseCategory(phase,'planet');
 approx(parsed[0].texturePhaseDeg,45);approx(parsed[0].axisHeadingDeg,-35);
 const noData=make();delete noData.objects[0].physical.rotationPeriodHours;
 delete noData.objects[0].physical.axialTiltDeg;
 assert.equal(parseCategory(noData,'planet')[0].rotationPeriodHours,undefined);
});

test('local rotation data remains available without live updates',async()=>{
 const planets=await catalog('planets.json','planet');
 const earth=planets.find(body=>body.id==='earth');
 assert.ok(Number.isFinite(earth.rotationPeriodHours)&&earth.rotationPeriodHours>0);
 assert.ok(Number.isFinite(earth.axialTiltDeg));
});

test('real WebGL drawing path uploads animated model, object-space light and aligned rings',()=>{
 const calls={matrix:[],light:[]};
 const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,FLOAT:3,TRIANGLES:4,UNSIGNED_SHORT:5,
  TEXTURE_2D:6,TEXTURE0:7,
  useProgram(){},bindBuffer(){},enableVertexAttribArray(){},vertexAttribPointer(){},uniform1f(){},
  uniform1i(){},activeTexture(){},bindTexture(){},drawElements(){},drawArrays(){},depthMask(){},
  uniformMatrix4fv:(name,transpose,m)=>calls.matrix.push([name,Array.from(m)]),
  uniform3f:(name,...v)=>calls.light.push([name,v])};
 const saturn={id:'saturn',type:'planet',style:'saturn',color:'#cbbab0',
  axialTiltDeg:26.7,rotationPeriodHours:10.7,epoch:J2000};
 const mock={gl,bodyProgram:'b',ringProgram:'r',sphereVB:1,sphereIB:2,ringVB:3,sphereCount:6,
  settings:{scaleObjects:false,lighting:'realistic'},selectedId:null,planetId:null,
  simTime:J2000+3*HOUR,bodyRadius:()=>1,rowInspectedRadius:(b,r)=>r,
  sceneBodyOpacity:()=>1,uniform:(p,name)=>name,attribute:(p,name)=>1,
  textures:{get:()=>null},byId:new Map([['saturn',saturn]]),ringScale:()=>2};
 SolarRenderer.prototype.drawSphere.call(mock,saturn,[2,0,0],identity);
 SolarRenderer.prototype.drawRings.call(mock,[2,0,0],identity);
 const [sphere,rings]=calls.matrix.filter(([name])=>name==='uMVP').map(([,m])=>m);
 for(let i=0;i<3;i++)approx(sphere[4+i],rings[4+i]/2);
 assert.ok(calls.light.some(([name])=>name==='uLight'));
 assert.ok(Math.abs(sphere[8]-rings[8]/2)>.1,'sphere spins independently of its rings');
});
