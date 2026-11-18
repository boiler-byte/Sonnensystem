import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {createViewSettings} from '../src/data/layers.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {drawPlanetSystemScene} from '../src/renderer/planet-view.js';
import {drawSolarSystemScene} from '../src/renderer/solar-view.js';
import {LAYOUT_TRANSITION_MS, rubberEase} from '../src/renderer/transitions.js';

const time=Date.UTC(2026,10,18);
const byId=id=>INITIAL_BODIES.find(b=>b.id===id);
function close(a,b,label='values'){
  assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${label}: ${a} vs ${b}`);
}
function renderer(){
  const r=Object.create(SolarRenderer.prototype);
  r.settings=createViewSettings('solar');
  r.bodies=['sun','earth','moon','jupiter','mars'].map(byId);
  r.byId=new Map(r.bodies.map(b=>[b.id,b]));
  r.planetId=null;r.width=960;r.height=670;
  r.fourMoonIds=new Set(['moon']);
  r.positions=new Map();r.overrides=new Map();r.simTime=time;
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.followEnabled=false;r.focusedBodyId=null;r.selectedId='earth';r.cameraManuallyMoved=false;
  r.transitionsEnabled=true;r.transition=null;
  r.calcPositions(time);
  return r;
}

test('v46: view transition fades incoming bodies, old bodies and outgoing orbits',()=>{
  const r=renderer(),start=performance.now();
  r.beginTransition('view',start);
  const t=r.transition;
  assert.equal(t.fromVisualBodies.get('sun').opacity,1);
  assert.equal(t.fromVisualOrbits.get('earth').opacity,1);
  r.planetId='earth';r.settings=createViewSettings('planet');r.calcPositions(time);
  close(r.sceneBodyOpacity(byId('earth')),1,'Earth stays visible');
  close(r.sceneBodyOpacity(byId('moon')),0,'Moon starts invisible');
  close(r.sceneOrbitOpacity(byId('moon')),0,'Moon orbit starts invisible');
  close(r.departingBodyState(t.fromVisualBodies.get('sun')).opacity,1,'Sun begins visible');
  close(r.departingOrbitState(t.fromVisualOrbits.get('earth')).opacity,1,'old Earth orbit begins visible');
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);r.calcPositions(time);
  const amount=rubberEase(.5);
  close(r.sceneBodyOpacity(byId('moon')),amount,'Moon fades in');
  close(r.sceneOrbitOpacity(byId('moon')),amount,'Moon orbit fades in');
  close(r.departingBodyState(t.fromVisualBodies.get('sun')).opacity,1-amount,'Sun fades out');
  close(r.departingOrbitState(t.fromVisualOrbits.get('earth')).opacity,1-amount,'old Earth orbit fades out');
  const oldCenter=t.fromVisualOrbits.get('earth').center;
  const movingCenter=r.departingOrbitState(t.fromVisualOrbits.get('earth')).center;
  assert.notDeepEqual(movingCenter,oldCenter,'old orbit migrates with the scene');
  r.advanceTransition(start+LAYOUT_TRANSITION_MS+1);r.calcPositions(time);
  close(r.sceneBodyOpacity(byId('moon')),1,'Moon fully visible');
  assert.equal(r.transition,null,'finished transition drops its ghost geometry');
});

test('v46: departing WebGL spheres and orbit lines are actually drawn with fade alpha',()=>{
  const r=renderer(),start=performance.now();
  r.beginTransition('view',start);
  r.planetId='earth';r.settings=createViewSettings('planet');r.calcPositions(time);
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);r.calcPositions(time);
  const calls={body:[],orbit:[],depth:[]};
  r.gl={depthMask:flag=>calls.depth.push(flag)};
  r.drawSphere=(b,p,v,opts)=>calls.body.push({id:b.id,alpha:opts.opacity});
  r.orbitLine=(b,p,v,a,s,opts)=>calls.orbit.push({id:b.id,alpha:opts.opacity});
  r.drawRings=()=>{};
  r.drawDepartingScene(new Float32Array(16));
  assert.ok(calls.body.some(b=>b.id==='sun'&&b.alpha>0&&b.alpha<1),'old Sun fades');
  assert.ok(calls.orbit.some(b=>b.id==='earth'&&b.alpha>0&&b.alpha<1),'old Earth orbit fades');
  assert.deepEqual(calls.depth,[false,true],'ghost orbits never write depth');
});

test('v46: current planet-view orbits follow the moving planet rather than static origin',()=>{
  const r=renderer(),start=performance.now();
  r.beginTransition('view',start);
  r.planetId='earth';r.settings=createViewSettings('planet');r.calcPositions(time);
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);r.calcPositions(time);
  const origin=r.positions.get('earth');
  assert.ok(Math.hypot(...origin)>0.01,'planet is still migrating from solar coordinates');
  const lines=[];
  r.gl={depthMask:()=>{}};r.glow={style:{}};
  r.orbitLine=(b,center)=>lines.push({id:b.id,center:center.slice()});
  r.drawSphere=()=>{};r.drawLabels=()=>{};r.drawRings=()=>{};
  drawPlanetSystemScene(r,'earth',r.settings,new Float32Array(16));
  assert.ok(lines.some(l=>l.id==='moon'),'Moon orbit is drawn');
  for(const line of lines)assert.deepEqual(line.center,origin,`${line.id} orbit follows animated Earth`);
});

test('v46: solar orbits stay attached to Sun as Reihe animates',()=>{
  const r=renderer(),start=performance.now();
  r.beginTransition('row',start);r.settings.row=true;r.calcPositions(time);
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);r.calcPositions(time);
  const sun=r.positions.get('sun');
  assert.ok(Math.abs(sun[0])>.01,'Sun moves sideways during row transition');
  const lines=[];
  r.gl={depthMask:()=>{}};r.glow={style:{}};
  r.orbitLine=(b,center)=>lines.push(center.slice());
  r.drawSphere=()=>{};r.drawLabels=()=>{};r.drawRings=()=>{};
  drawSolarSystemScene(r,'earth',r.settings,new Float32Array(16));
  assert.ok(lines.length>0);
  for(const center of lines)assert.deepEqual(center,sun);
});

test('v46: immediate reverse view preserves partial body and orbit opacity',()=>{
  const r=renderer(),solarSettings=r.settings,planetSettings=createViewSettings('planet');
  const start=performance.now();r.beginTransition('view',start);
  r.planetId='earth';r.settings=planetSettings;r.calcPositions(time);
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);r.calcPositions(time);
  const previous=r.transition;
  const sunAlpha=r.departingBodyState(previous.fromVisualBodies.get('sun')).opacity;
  const moonAlpha=r.sceneBodyOpacity(byId('moon'));
  const earthOrbitAlpha=r.departingOrbitState(previous.fromVisualOrbits.get('earth')).opacity;
  const moonOrbitAlpha=r.sceneOrbitOpacity(byId('moon'));
  r.beginTransition('view',performance.now());
  r.planetId=null;r.settings=solarSettings;r.calcPositions(time);
  close(r.sceneBodyOpacity(byId('sun')),sunAlpha,'Sun re-enters without flash');
  close(r.departingBodyState(r.transition.fromVisualBodies.get('moon')).opacity,moonAlpha,'Moon leaves from current alpha');
  close(r.sceneOrbitOpacity(byId('earth')),earthOrbitAlpha,'Earth orbit restores without flash');
  close(r.departingOrbitState(r.transition.fromVisualOrbits.get('moon')).opacity,moonOrbitAlpha,'Moon orbit leaves from current alpha');
});

test('v46: interrupting Reihe orbit fade retains its actual displayed brightness',()=>{
  const r=renderer(),start=performance.now();
  r.beginTransition('row',start);r.settings.row=true;
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);
  const oldOpacity=r.orbitOpacity();assert.ok(oldOpacity>0&&oldOpacity<1);
  r.beginTransition('row',performance.now());r.settings.row=false;
  close(r.orbitOpacity(),oldOpacity,'row reverse must be seamless');
  r.advanceTransition(r.transition.at+LAYOUT_TRANSITION_MS+1);
  close(r.orbitOpacity(),1,'orbital lines reappear fully');
});

test('v46: shader alpha applies to spheres and Saturn rings; reduced-motion bypasses view morph',async()=>{
  const shaders=await readFile(new URL('../src/renderer/shaders.js',import.meta.url),'utf8');
  assert.match(shaders,/uOpacity/);
  assert.match(shaders,/gl_FragColor=vec4\(pow\(max\(col,0\.0\),vec3\(\.92\)\),clamp\(uOpacity/);
  assert.match(shaders,/a\*clamp\(uOpacity/);
  const r=renderer();r.beginTransition('view');r.transitionsEnabled=false;
  r.beginTransition('view');assert.equal(r.transition,null,'reduced motion cancels existing fade state');
  assert.equal(r.sceneBodyOpacity(byId('moon')),1);
});
