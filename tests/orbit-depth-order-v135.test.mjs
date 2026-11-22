import assert from 'node:assert/strict';
import {test} from 'node:test';
import {drawPlanetSystemScene} from '../src/renderer/planet-view.js';
import {drawSolarSystemScene} from '../src/renderer/solar-view.js';
import {SolarRenderer} from '../src/renderer/renderer.js';

const VP=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const sun={id:'sun',type:'star'};
const planet={id:'jupiter',type:'planet',parentId:'sun',a:5.2,periodDays:4332,radiusKm:70000};
const moon={id:'europa',type:'moon',parentId:'jupiter',a:670000,periodDays:3.55,radiusKm:1560};

function fakeRenderer(planetId=null){
  const calls=[],gl={depthMask:v=>calls.push(['depthMask',v])};
  const bodies=[sun,planet,moon];
  const renderer={
    gl,bodies,planetId,glow:{style:{}},width:900,height:600,
    camera:{dist:47},rendered:[],transition:null,
    settings:{orbits:true,galacticMotion:false,layers:{mode:'all',types:new Set()}},
    byId:new Map(bodies.map(body=>[body.id,body])),
    positions:new Map(bodies.map(body=>[body.id,[0,0,0]])),
    shouldDraw:()=>true,planetChildren:()=>[moon],
    orbitOpacity:()=>1,
    drawSphere:body=>calls.push(['sphere',body.id]),
    drawRings:()=>{},drawLabels:()=>calls.push(['labels']),
    orbitLine:body=>calls.push(['orbit',body.id])
  };
  return {renderer,calls};
}

function assertDepthOrdered(calls,bodyIds,orbitIds){
  const spheres=calls.filter(c=>c[0]==='sphere').map(c=>c[1]);
  const orbits=calls.filter(c=>c[0]==='orbit').map(c=>c[1]);
  assert.deepEqual(spheres,bodyIds);
  assert.deepEqual(orbits,orbitIds);
  const lastSphere=calls.findLastIndex(c=>c[0]==='sphere');
  const firstOrbit=calls.findIndex(c=>c[0]==='orbit');
  assert.ok(lastSphere>=0 && firstOrbit>lastSphere,'all opaque bodies precede the orbit pass');
  assert.deepEqual(calls.slice(firstOrbit-1,firstOrbit),[['depthMask',false]],
    'orbit pass must not write depth');
  assert.deepEqual(calls.filter(c=>c[0]==='depthMask'),[
    ['depthMask',false],['depthMask',true]
  ],'depth writes are restored immediately after the orbit pass');
}

test('v135: solar view draws bodies before depth-tested planet orbits',()=>{
  const {renderer,calls}=fakeRenderer();
  drawSolarSystemScene(renderer,'jupiter',renderer.settings,VP);
  assertDepthOrdered(calls,['sun','jupiter','europa'],['jupiter']);
});

test('v135: planet view draws giant planet and moon before depth-tested moon orbit',()=>{
  const {renderer,calls}=fakeRenderer('jupiter');
  drawPlanetSystemScene(renderer,'europa',renderer.settings,VP);
  assertDepthOrdered(calls,['jupiter','europa'],['europa']);
});

test('v135: switching off orbit lines does not suppress objects or depth-mask writes',()=>{
  for(const planetId of [null,'jupiter']){
    const {renderer,calls}=fakeRenderer(planetId);
    renderer.settings.orbits=false;
    if(planetId)drawPlanetSystemScene(renderer,null,renderer.settings,VP);
    else drawSolarSystemScene(renderer,null,renderer.settings,VP);
    assert.ok(calls.some(c=>c[0]==='sphere'));
    assert.equal(calls.some(c=>c[0]==='orbit'),false);
    assert.equal(calls.some(c=>c[0]==='depthMask'),false);
  }
});

test('v135: transition ghosts can render bodies and orbits in separate phases',()=>{
  const calls=[];
  const r=Object.create(SolarRenderer.prototype);
  r.gl={depthMask:value=>calls.push(['depthMask',value])};
  r.transition={kind:'view',amount:.5,
    fromVisualBodies:new Map([['sun',{body:sun,position:[0,0,0],radius:2,opacity:1}]]),
    fromVisualOrbits:new Map([['jupiter',{body:planet,center:[0,0,0],radius:5,opacity:1,alpha:.3,selected:false,settings:{}}]])};
  r.visibleSceneBodies=()=>[planet];
  r.visibleSceneOrbits=()=>[moon];
  r.departingBodyState=source=>({...source,opacity:.5});
  r.departingOrbitState=source=>({...source,opacity:.5});
  r.drawSphere=body=>calls.push(['sphere',body.id]);
  r.orbitLine=body=>calls.push(['orbit',body.id]);
  r.drawRings=()=>{};
  r.drawDepartingScene(VP,'bodies');
  assert.deepEqual(calls,[['sphere','sun']]);
  r.drawDepartingScene(VP,'orbits');
  assert.deepEqual(calls,[['sphere','sun'],['depthMask',false],['orbit','jupiter'],['depthMask',true]]);
});

test('v135: frame draws fading orbit paths after the active opaque bodies',()=>{
  const calls=[];
  const r=Object.create(SolarRenderer.prototype);
  r.width=900;r.height=600;r.gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,clear:()=>calls.push('clear')};
  r.visualAngularClocks={beginFrame:()=>{}};
  r.advanceTransition=()=>{};r.advanceCameraFlight=()=>{};r.advanceCinema=()=>{};
  r.start=()=>{};r.updateFollowTarget=()=>{};
  r.makeVP=()=>({vp:VP,starVp:VP});r.advanceRowInspection=()=>{};
  r.drawStars=()=>calls.push('stars');
  r.drawDepartingScene=(vp,phase)=>calls.push(`ghost-${phase}`);
  r.planetId='jupiter';r.transition=null;r.settings={orbits:true};
  r.byId=new Map([[planet.id,planet],[moon.id,moon]]);
  r.planetChildren=()=>[moon];r.positions=new Map([[planet.id,[0,0,0]],[moon.id,[1,0,0]]]);
  r.rendered=[];r.shouldDraw=()=>true;r.orbitOpacity=()=>1;
  r.drawSphere=body=>calls.push(`sphere-${body.id}`);
  r.drawRings=()=>{};r.drawLabels=()=>{};
  r.orbitLine=body=>calls.push(`orbit-${body.id}`);
  r.gl.depthMask=()=>{};
  r.glow={style:{}};
  r.draw(0,null,r.settings);
  assert.deepEqual(calls,[
    'clear','stars','ghost-bodies','sphere-jupiter','sphere-europa',
    'orbit-europa','ghost-orbits'
  ]);
});
