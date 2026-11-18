import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {createViewSettings} from '../src/data/layers.js';
import {displayOrbitRadius,keplerPosition} from '../src/data/orbital-math.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {
  LAYOUT_TRANSITION_MS, PLANET_ORBIT_WAVE_MAX_DELAY,
  gentleEase, planetOrbitWaveDelays, planetOrbitWaveEase
} from '../src/renderer/transitions.js';

const time=Date.UTC(2026,10,18),byId=id=>INITIAL_BODIES.find(b=>b.id===id);
const near=(a,b,label='value')=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${label}: ${a} vs ${b}`);
const nearVector=(a,b,label='vector')=>a.forEach((x,i)=>near(x,b[i],`${label}[${i}]`));

function mockControl(view='solar'){
  const viewSettings={solar:createViewSettings('solar'),planet:createViewSettings('planet')};
  const settings=viewSettings[view];
  const elements=new Map();
  const $=id=>{
    if(!elements.has(id))elements.set(id,{attrs:{},title:'',classes:{},
      setAttribute(key,value){this.attrs[key]=value;},
      classList:{toggle(key,value){elements.get(id).classes[key]=value;}}});
    return elements.get(id);
  };
  const snapshots=[];
  const renderer={settings,planetId:view==='solar'?null:'earth',
    _labelState:{},camera:{theta:.63,phi:.99,desiredDist:47,desiredTarget:[0,0,0]},
    followEnabled:false,focusedBodyId:null,cameraManuallyMoved:false,calcCalls:0,
    beginTransition(kind){snapshots.push({kind,scaleObjects:settings.scaleObjects,scaleOrbits:settings.scaleOrbits,row:settings.row});},
    setCameraAngles(theta,phi){this.camera.theta=theta;this.camera.phi=phi;},
    calcPositions(){this.calcCalls++;},rowFrame(){return {target:[1,0,0]};},rowDistance(){return 7;},
    planetFrameDistance(){return 24;},solarOverviewDistance(){return 47;}
  };
  const S={viewSettings,settings,time};
  const notices=[];
  const context=vm.createContext({$,S,renderer,notifyToggle:notice=>notices.push(notice)});
  return {context,viewSettings,settings,elements,renderer,snapshots,notices,$};
}

const appSource=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
const scaleFunctions=appSource.slice(appSource.indexOf('function syncScaleControls(){'),appSource.indexOf('function syncOrbitControls(){'));

test('v51: entering Reihe auto-enables physical object sizes in both views and updates accessible control',()=>{
  for(const view of ['solar','planet']){
    const f=mockControl(view);vm.runInContext(scaleFunctions,f.context);
    assert.equal(f.settings.scaleObjects,false,'normal startup remains schematic');
    vm.runInContext('updateRow()',f.context);
    assert.equal(f.settings.row,true);
    assert.equal(f.viewSettings.solar.scaleObjects,true);
    assert.equal(f.viewSettings.planet.scaleObjects,true);
    assert.equal(f.$('scale-objects-btn').attrs['aria-pressed'],'true');
    assert.match(f.$('scale-objects-btn').title,/maßstabsgetreu/);
    assert.equal(f.$('scale-objects-btn').classes.active,true);
    assert.equal(f.$('orbit-row-btn').attrs['aria-pressed'],'true');
    assert.equal(f.$('orbit-row-btn').classes.active,true);
    assert.equal(f.settings.scaleOrbits,false,'the Bahn switch remains independent');
    assert.deepEqual(f.snapshots,[{kind:'row',scaleObjects:false,scaleOrbits:false,row:false}],
      'capture original layout before the automatic scale change');
    vm.runInContext('updateRow()',f.context);
    assert.equal(f.settings.row,false);
    assert.equal(f.settings.scaleObjects,true,'leaving Reihe retains the chosen object scale');
    assert.equal(f.$('orbit-row-btn').attrs['aria-pressed'],'false');
    assert.equal(f.renderer.calcCalls,2);
  }
});

test('v51: manually disabling size scale in Reihe remains possible; next entry restores physical default',()=>{
  const f=mockControl('planet');vm.runInContext(scaleFunctions,f.context);
  vm.runInContext('updateRow();updateScale("scaleObjects")',f.context);
  assert.equal(f.settings.row,true);
  assert.equal(f.settings.scaleObjects,false);
  assert.equal(f.viewSettings.solar.scaleObjects,false);
  vm.runInContext('updateRow();updateRow()',f.context);
  assert.equal(f.settings.scaleObjects,true);
  assert.equal(f.settings.row,true);
  assert.equal(f.$('scale-objects-btn').attrs['aria-pressed'],'true');
});

test('v51: scale OFF uses the wave only in planetary orbit view, not for other toggles',()=>{
  for(const [view,row,setting,expectKind] of [
    ['planet',false,'scaleOrbits','planet-orbits-off'],
    ['planet',true,'scaleOrbits','scale'],
    ['solar',false,'scaleOrbits','scale'],
    ['planet',false,'scaleObjects','scale']
  ]){
    const f=mockControl(view);vm.runInContext(scaleFunctions,f.context);
    f.viewSettings.solar.scaleOrbits=true;f.viewSettings.planet.scaleOrbits=true;
    f.settings.row=row;
    vm.runInContext(`updateScale('${setting}')`,f.context);
    assert.equal(f.snapshots[0].kind,expectKind,`${view}/${row}/${setting}`);
    assert.equal(f.snapshots[0].scaleOrbits,true,'captures physical state before switching');
  }
  const f=mockControl('planet');vm.runInContext(scaleFunctions,f.context);
  vm.runInContext('updateScale("scaleOrbits")',f.context);
  assert.equal(f.snapshots[0].kind,'scale','turning Bahn ON retains usual spring animation');
});

test('v51: planetary wave easing is gentle, non-overshooting and sorted inner-to-outer',()=>{
  const bodies=[{id:'outer',a:300},{id:'inner',a:100},{id:'middle',a:200}];
  const delays=planetOrbitWaveDelays(bodies);
  near(delays.get('inner'),0);near(delays.get('middle'),PLANET_ORBIT_WAVE_MAX_DELAY/2);
  near(delays.get('outer'),PLANET_ORBIT_WAVE_MAX_DELAY);
  near(planetOrbitWaveEase(0,0),0);near(planetOrbitWaveEase(1,PLANET_ORBIT_WAVE_MAX_DELAY),1);
  for(let i=0;i<=100;i++){
    const t=i/100;
    assert.ok(gentleEase(t)>=0&&gentleEase(t)<=1,'no rubber band overshoot');
    assert.ok(planetOrbitWaveEase(t,0)>=planetOrbitWaveEase(t,PLANET_ORBIT_WAVE_MAX_DELAY),
      'inner orbit progresses ahead of outer orbit');
    if(i>0)assert.ok(gentleEase(t)>=gentleEase((i-1)/100),'monotonic ease');
  }
  near(planetOrbitWaveEase(.1,delays.get('outer')),0,'outer stays at starting radius during delay');
  assert.ok(planetOrbitWaveEase(.1,delays.get('inner'))>0,'inner has begun transitioning');
  near(planetOrbitWaveDelays([{id:'only',a:800}]).get('only'),0,'single orbit needs no delay');
});

function planetRenderer(){
  const earth=byId('earth'),template=byId('moon');
  const children=[
    {...template,id:'moon-outer',a:490000,periodDays:28},
    {...template,id:'moon-inner',a:120000,periodDays:3},
    {...template,id:'moon-middle',a:320000,periodDays:16},
  ];
  const r=Object.create(SolarRenderer.prototype);
  r.settings=createViewSettings('planet');r.settings.scaleOrbits=true;
  r.bodies=[earth,...children];r.byId=new Map(r.bodies.map(b=>[b.id,b]));
  r.planetId='earth';r.width=900;r.height=720;
  r.fourMoonIds=new Set(children.map(b=>b.id));
  r.positions=new Map();r.overrides=new Map();r.simTime=time;
  r.camera={theta:.63,phi:.84,dist:100,desiredDist:100,target:[0,0,0],desiredTarget:[0,0,0]};
  r.followEnabled=false;r.focusedBodyId=null;r.selectedId=children[1].id;r.cameraManuallyMoved=false;
  r.transitionsEnabled=true;r.transition=null;
  r.calcPositions(time);
  return {r,earth,children};
}

test('v51: planet orbits and their satellites follow the same staggered in-to-out interpolation',()=>{
  const {r,earth,children}=planetRenderer();
  const start=performance.now();
  const origins=new Map(children.map(b=>[b.id,{radius:r.orbitRadius(b,earth),position:r.positions.get(b.id).slice()}]));
  r.beginTransition('planet-orbits-off',start);r.settings.scaleOrbits=false;
  r.calcPositions(time);
  assert.equal(r.transition.kind,'planet-orbits-off');
  for(const body of children){
    near(r.orbitRadius(body,earth),origins.get(body.id).radius,'orbit starts at previous radius');
    nearVector(r.positions.get(body.id),origins.get(body.id).position,'body starts at previous location');
  }
  const [outer,inner,middle]=children;
  near(r.transition.orbitWave.get(inner.id),0);
  near(r.transition.orbitWave.get(outer.id),PLANET_ORBIT_WAVE_MAX_DELAY);
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.1);r.calcPositions(time);
  assert.ok(r.orbitRadius(inner,earth)<origins.get(inner.id).radius,'inner already begins shrinking');
  near(r.orbitRadius(outer,earth),origins.get(outer.id).radius,'outer waits slightly');
  nearVector(r.positions.get(outer.id),origins.get(outer.id).position,'outer body waits with orbit');
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.5);r.calcPositions(time);
  assert.ok(r.orbitTransitionAmount(inner)>r.orbitTransitionAmount(middle));
  assert.ok(r.orbitTransitionAmount(middle)>r.orbitTransitionAmount(outer));
  for(const body of children){
    const progress=r.orbitTransitionAmount(body);
    const destRadius=displayOrbitRadius(body,earth,r.settings,earth);
    const expectedRadius=origins.get(body.id).radius+(destRadius-origins.get(body.id).radius)*progress;
    near(r.orbitRadius(body,earth),expectedRadius,'orbit stroke matches body progress');
    const destPos=keplerPosition(body,earth,time,null,destRadius);
    const expectedPos=origins.get(body.id).position.map((value,i)=>value+(destPos[i]-value)*progress);
    nearVector(r.positions.get(body.id),expectedPos,'body and stroke are synchronized');
    assert.ok(r.orbitRadius(body,earth)>=Math.min(origins.get(body.id).radius,destRadius));
    assert.ok(r.orbitRadius(body,earth)<=Math.max(origins.get(body.id).radius,destRadius));
  }
  r.advanceTransition(start+LAYOUT_TRANSITION_MS+1);r.calcPositions(time);
  assert.equal(r.transition,null);
  for(const body of children)near(r.orbitRadius(body,earth),displayOrbitRadius(body,earth,r.settings,earth));
});

test('v51: interrupting a planetary wave preserves positions and orbit radii without a jump',()=>{
  const {r,earth,children}=planetRenderer();const start=performance.now();
  r.beginTransition('planet-orbits-off',start);r.settings.scaleOrbits=false;
  r.advanceTransition(start+LAYOUT_TRANSITION_MS*.48);r.calcPositions(time);
  const beforePos=new Map(children.map(b=>[b.id,r.positions.get(b.id).slice()]));
  const beforeRadius=new Map(children.map(b=>[b.id,r.orbitRadius(b,earth)]));
  const next=performance.now();r.beginTransition('scale',next);r.settings.scaleOrbits=true;
  r.calcPositions(time);
  for(const b of children){
    nearVector(r.positions.get(b.id),beforePos.get(b.id),'reverse begins without a body jump');
    near(r.orbitRadius(b,earth),beforeRadius.get(b.id),'reverse begins without an orbit jump');
  }
  r.advanceTransition(next+LAYOUT_TRANSITION_MS*.25);r.calcPositions(time);
  const reversePos=r.positions.get(children[0].id).slice();
  const reverseRadius=r.orbitRadius(children[0],earth);
  r.beginTransition('planet-orbits-off',performance.now());r.settings.scaleOrbits=false;
  r.calcPositions(time);
  nearVector(r.positions.get(children[0].id),reversePos,'second collapse starts from currently visible body');
  near(r.orbitRadius(children[0],earth),reverseRadius,'second collapse starts from currently visible orbit');
});

test('v51: reduced-motion preference skips the planet orbit wave',()=>{
  const original=globalThis.window;
  try{
    globalThis.window={matchMedia:()=>({matches:true})};
    const {r,earth,children}=planetRenderer();
    r.beginTransition('planet-orbits-off',performance.now());
    assert.equal(r.transition,null);
    r.settings.scaleOrbits=false;r.calcPositions(time);
    for(const b of children)near(r.orbitRadius(b,earth),displayOrbitRadius(b,earth,r.settings,earth));
  }finally{if(original===undefined)delete globalThis.window;else globalThis.window=original;}
});
