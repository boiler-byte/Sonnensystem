import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {drawOrbitLine,drawSunTrail} from '../src/renderer/orbits.js';
import {GalacticTrailHistory} from '../src/renderer/galactic-trails.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {J2000} from '../src/data/bodies.js';
import {createViewSettings} from '../src/data/layers.js';
import {keplerPosition,displayOrbitRadius} from '../src/data/orbital-math.js';
import {DAY} from '../src/renderer/math.js';

const sun={id:'sun',type:'star',radiusKm:696340};
const earth={id:'earth',type:'planet',parentId:'sun',a:1,periodDays:365.25,M:12,e:.0167,epoch:J2000,i:3,node:4,peri:15};

function mockRenderer(){
  const r=Object.create(SolarRenderer.prototype);
  r.settings=createViewSettings('solar');r.planetId=null;r.transitionsEnabled=true;r.transition=null;
  r.bodies=[sun,earth];r.byId=new Map([['sun',sun],['earth',earth]]);
  r.positions=new Map();r.overrides=new Map();r.selectedId='earth';
  r._sceneRevision=0;r.cinema=null;r.simTime=J2000;
  r.camera={theta:.63,phi:.99,target:[7,2,3],desiredTarget:[7,2,3],dist:47,desiredDist:47};
  r.cameraFlight={kind:'camera-flight-in-progress'};
  r.focusedBodyId='earth';r._cinemaRestoreFocus=null;
  r.cancelCameraFlight=()=>assert.fail('the trail mode must not stop a camera flight');
  r.start(J2000,'earth',r.settings);
  return r;
}

test('v103 supersedes v102: activating galactic mode does not start a timed reveal or alter the camera',()=>{
  const r=mockRenderer();
  const original=structuredClone(r.camera);
  r.resetGalacticTrails();
  r.settings.galacticMotion=true;
  r.start(J2000,'earth',r.settings);
  assert.equal(r.transition,null);
  assert.deepEqual(r.camera,original);
  assert.equal(r.cameraFlight.kind,'camera-flight-in-progress');
  assert.equal(r.focusedBodyId,'earth');
  assert.equal(r.orbitOpacity(),1);
  const history=r._galacticTrails??=new GalacticTrailHistory();
  assert.equal(history.record(earth,J2000,r.positions.get('earth')).length,0);
  assert.equal(history.record(earth,J2000,r.positions.get('earth')).length,0,
    'a paused simulation cannot grow a line through wall-clock time');
});

test('v103 supersedes v102: planets remain at their current Kepler coordinates while lines grow',()=>{
  const r=mockRenderer();
  r.settings.galacticMotion=true;
  r.start(J2000,'earth',r.settings);
  const history=r._galacticTrails??=new GalacticTrailHistory();
  history.record(earth,J2000,r.positions.get('earth'));
  const t=J2000+30*DAY;
  r.start(t,'earth',r.settings);
  const expected=keplerPosition(earth,sun,t,null,displayOrbitRadius(earth,sun,r.settings));
  for(let axis=0;axis<3;axis++){
    assert.ok(Math.abs(r.positions.get('earth')[axis]-expected[axis])<1e-8,
      `the Earth keeps its ordinary Kepler position on axis ${axis}`);
  }
  assert.equal(history.record(earth,t,r.positions.get('earth')).length,6);
  assert.equal(r.focusedBodyId,'earth');
  assert.equal(r.cameraFlight.kind,'camera-flight-in-progress');
});

test('v103 supersedes v102: WebGL draws no trail at entry/paused time, then only recorded samples',()=>{
  const uploads=[],draws=[];
  const gl={ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,LINE_STRIP:3,TRIANGLES:4,
    bufferData(_target,buffer){uploads.push(Float32Array.from(buffer));},
    getUniformLocation(){return {};},uniform4f(){},drawArrays(mode,_start,count){draws.push({mode,count});}};
  const r={settings:{galacticMotion:true,orbits:true,orbitContrast:false,scaleOrbits:false},
    simTime:J2000,planetId:null,gl,width:960,height:540,
    positions:new Map([['sun',[0,0,0]],['earth',[7.5,0,0]]]),
    byId:new Map([['sun',sun],['earth',earth]]),
    useLineProgram(){return {};},sceneOrbitOpacity(){return 1;}};
  const vp=new Float32Array([.025,0,0,0,0,.025,0,0,0,0,.025,0,0,0,0,1]);
  const render=()=>{drawOrbitLine(r,earth,[0,0,0],vp,.2,false);drawSunTrail(r,vp,.9);};
  render();render();
  assert.equal(draws.length,0,'zero and paused start have no orbit or sun line');
  assert.equal(r._orbitGeometryCache.entries.size,0,'the galactic mode does not sample past Kepler ellipses');
  assert.equal(r._galacticTrails.trails.size,2);
  r.simTime+=10*DAY;
  r.positions.set('earth',[7.7,.5,.2]);
  render();
  assert.equal(draws[0].mode,gl.LINE_STRIP);
  assert.equal(draws[0].count,2,'the first interval contains only two observed positions');
  assert.deepEqual([...uploads[0].slice(-3)],[7.7,.5,.2].map(v=>Math.fround(v)));
  assert.ok(draws.some(d=>d.mode===gl.TRIANGLES),'the Sun also grows its own illuminated line');
  assert.ok([...r._orbitGeometryCache.entries.keys()].every(key=>!key.startsWith('galactic')));
  assert.ok(r._galacticTraces===undefined,'no legacy retroactive cache is instantiated');
});

test('v103: the orbit button requests a trail reset, never a timed reveal or ellipse morph',async()=>{
  const ui=await readFile(new URL('../src/ui/event-handlers.js',import.meta.url),'utf8');
  const orbits=await readFile(new URL('../src/renderer/orbits.js',import.meta.url),'utf8');
  assert.match(ui,/next==='galactic'\)renderer\.resetGalacticTrails\(\)/);
  assert.doesNotMatch(ui,/renderer\.beginTransition\('galactic-trails'\)/);
  assert.doesNotMatch(ui,/renderer\.beginTransition\('orbit-frame'\)/);
  assert.doesNotMatch(orbits,/revealedTrailPoints\(/);
  assert.doesNotMatch(orbits,/getGalactic\(/);
});
