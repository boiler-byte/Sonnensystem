import {syncToggleState} from '../src/ui/control-state.js';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {
  LAYER_TYPES,DISPLAY_SETTING_KEYS,createViewSettings,displayMatchesPreset,displayPreset,
  layerPreset,layerEnabled,layerSummary,availableLayerTypes
} from '../src/data/layers.js';
import {CATEGORY_COLORS} from '../src/data/bodies.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readProjectSource(path);
const segment=(text,start,end)=>{
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0 && b>a,`${start} before ${end}`);
  return text.slice(a,b);
};

function element(extra={}){
  const state={attrs:{},classes:new Set(),title:'',hidden:false,style:{setProperty(){}},...extra};
  state.classList={toggle(name,enabled){if(enabled)state.classes.add(name);else state.classes.delete(name);}};
  state.setAttribute=(key,value)=>{state.attrs[key]=value;};
  return state;
}

function mockLayerEnvironment(app){
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  const S={settings:solar,viewSettings:{solar,planet},bodies:INITIAL_BODIES,time:Date.UTC(2026,10,18)};
  const controls=new Map();
  const $=id=>{if(!controls.has(id))controls.set(id,element());return controls.get(id);};
  const presets=['all','standard'].map(mode=>element({dataset:{layerPreset:mode}}));
  const categories=LAYER_TYPES.map(type=>element({dataset:{layerType:type},parentElement:element()}));
  const renderer={planetId:null,camera:{desiredTarget:[0,0,0],desiredDist:20},_labelState:{},
    cinema:null,calcCount:0,calcPositions(){this.calcCount++;},rowFrame(){return {target:[6,0,0]};},rowDistance(){return 55;}};
  let details=0;
  const document={querySelectorAll(selector){return selector==='[data-layer-preset]'?presets:selector==='[data-layer-type]'?categories:[];}};
  const ctx=vm.createContext({syncToggleState,S,$,document,renderer,activeView:()=>renderer.planetId?'planet':'solar',CATEGORY_COLORS,
    availableLayerTypes,layerSummary,layerEnabled,layerPreset,displayPreset,displayMatchesPreset,
    updateDetail:()=>{details++;}});
  vm.runInContext([
    segment(app,'function refreshRowCameraFrame(){','function syncRowControl(){'),
    segment(app,'function syncLayers(){','function setLayerPopover(open){'),
    segment(app,'function syncOrbitControls(){','function mergeBodies(list){')
  ].join('\n'),ctx);
  return {ctx,S,renderer,controls,presets,categories,get:$,get details(){return details;}};
}

test('v57: both removed Layer captions are absent and controls form 3+2 ordered rows',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const layer=segment(html,'id="layer-popover"','id="time-panel"');
  assert.doesNotMatch(layer,/class="layer-display-heading"|id="layer-note"|class="layer-note"/);
  assert.doesNotMatch(css,/\.layer-display-heading\{|\.layer-note\{/);
  assert.match(layer,/role="group" aria-label="Darstellungseinstellungen"/,'accessible description remains');
  const tools=segment(layer,'class="layer-display-toggles"','class="layer-options"');
  assert.deepEqual([...tools.matchAll(/id="(toggle-labels|toggle-lighting|toggle-four-moons|orbit-visibility-btn|orbit-contrast-btn)"/g)]
    .map(m=>m[1]),['toggle-labels','toggle-lighting','toggle-four-moons','orbit-visibility-btn','orbit-contrast-btn']);
  assert.match(css,/\.layer-display-toggles\{\s*display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css,/\.layer-display-toggles \.scale-tool-toggle\{[^}]*grid-column:span 2/);
  assert.ok(css.includes('.layer-display-toggles .scale-tool-toggle:nth-child(4){grid-column:2 / span 2}'));
  assert.ok(css.includes('.layer-display-toggles .scale-tool-toggle:nth-child(5){grid-column:4 / span 2}'));
});

test('v57: Alle activates all five appearances; Standard restores view-specific defaults',()=>{
  assert.deepEqual(DISPLAY_SETTING_KEYS,['labels','lighting','fourMoons','orbits','orbitContrast']);
  const all=displayPreset('all');
  assert.deepEqual(all,{labels:true,lighting:'realistic',fourMoons:false,orbits:true,orbitContrast:true});
  for(const view of ['solar','planet']){
    const normal=createViewSettings(view),defaults=displayPreset('standard',view);
    for(const key of DISPLAY_SETTING_KEYS)assert.equal(defaults[key],normal[key],`${key} ${view}`);
    assert.equal(defaults.orbitContrast,false);
    assert.equal(defaults.fourMoons,view==='solar');
    assert.equal(defaults.lighting,view==='solar'?'optimized':'realistic');
    assert.equal(displayMatchesPreset(normal,'standard',view),true);
    assert.equal(displayMatchesPreset({...normal,...all},'all',view),true);
    for(const key of DISPLAY_SETTING_KEYS){
      const invalid={...normal,...all,[key]:key==='lighting'?'optimized':!all[key]};
      assert.equal(displayMatchesPreset(invalid,'all',view),false,`${key} is part of Alle`);
    }
  }
});

test('v57: combined presets update only the active scene and preserve Object, Bahn and Reihe',async()=>{
  const app=await read('src/app.js');
  const env=mockLayerEnvironment(app),{ctx,S,renderer,presets,get}=env;
  S.settings.scaleObjects=true;S.settings.scaleOrbits=true;S.settings.row=true;
  vm.runInContext('syncLayers()',ctx);
  assert.deepEqual(presets.map(p=>p.attrs['aria-pressed']),['false','true']);
  vm.runInContext('changeLayers(layerPreset("all",activeView()));applyDisplayPreset("all")',ctx);
  assert.equal(S.settings.layers.mode,'all');
  assert.deepEqual(presets.map(p=>p.attrs['aria-pressed']),['true','false']);
  for(const key of DISPLAY_SETTING_KEYS)assert.equal(S.settings[key],displayPreset('all')[key],key);
  assert.equal(S.settings.scaleObjects,true);assert.equal(S.settings.scaleOrbits,true);
  assert.equal(S.settings.row,true);
  assert.equal(renderer.calcCount,2,'the row was recalculated for categories and the changed moon cap');
  assert.deepEqual(renderer.camera.desiredTarget,[6,0,0]);
  for(const input of env.categories)assert.equal(input.checked,true);
  assert.equal(get('toggle-four-moons').attrs['aria-pressed'],'true','all moons uses inverted internal cap');
  assert.equal(get('toggle-lighting').attrs['aria-pressed'],'true');
  assert.equal(get('orbit-contrast-btn').attrs['aria-pressed'],'true');

  S.settings.labels=false;vm.runInContext('syncLayers()',ctx);
  assert.deepEqual(presets.map(p=>p.attrs['aria-pressed']),['false','false'],
    'a manual display change must remove the Alle selection highlight');
  vm.runInContext('changeLayers(layerPreset("standard",activeView()));applyDisplayPreset("standard")',ctx);
  assert.deepEqual(presets.map(p=>p.attrs['aria-pressed']),['false','true']);
  assert.equal(S.settings.fourMoons,true,'solar standard caps at four');
  assert.equal(S.settings.lighting,'optimized');
  assert.equal(S.settings.orbitContrast,false);
  assert.deepEqual([...S.settings.layers.types],['star','planet']);

  // The other scene keeps its own display and layer settings.
  const solar=S.settings;
  renderer.planetId='earth';S.settings=S.viewSettings.planet;
  S.settings.row=false;
  vm.runInContext('syncLayers()',ctx);
  assert.deepEqual(presets.map(p=>p.attrs['aria-pressed']),['false','true']);
  vm.runInContext('changeLayers(layerPreset("all",activeView()));applyDisplayPreset("all")',ctx);
  assert.equal(S.settings.orbitContrast,true);
  assert.equal(S.settings.lighting,'realistic');
  assert.equal(S.settings.fourMoons,false);
  assert.equal(solar.orbitContrast,false,'planet presets do not update solar preferences');
  vm.runInContext('changeLayers(layerPreset("standard",activeView()));applyDisplayPreset("standard")',ctx);
  assert.equal(S.settings.lighting,'realistic','planet default is realistic');
  assert.equal(S.settings.fourMoons,false,'planet default shows all moons');
  assert.equal(S.settings.orbitContrast,false);
  assert.deepEqual([...S.settings.layers.types],['planet','moon','satellite']);
  assert.equal(solar.scaleObjects,true);assert.equal(solar.scaleOrbits,true);
  assert.match(app,/changeLayers\(layerPreset\(btn\.dataset\.layerPreset,activeView\(\)\)\)/);
  assert.match(app,/applyDisplayPreset\(btn\.dataset\.layerPreset\)/);
});

function cameraFixture(view='solar',row=false){
 const r=Object.create(SolarRenderer.prototype);
 r.settings=createViewSettings(view);r.settings.row=row;
 r.planetId=view==='planet'?'saturn':null;
 r.camera={theta:2.8,phi:.3,dist:11,desiredDist:13,target:[19,-4,6],desiredTarget:[19,-4,6]};
 r.cameraManuallyMoved=true;r.cameraPresetIndex=2;
 r.focusedBodyId='moon';r.followEnabled=true;r.followedBodyId='moon';
 r.callbacks={onFollowChange:()=>r.followChanges++};r.followChanges=0;
 r.solarOverviewDistance=()=>72;
 r.planetFrameDistance=()=>33;
 r.rowFrame=()=>({target:[42,1,0],distance:22});r.rowDistance=()=>22;
 r.transition=null;r.cinema=null;
 return r;
}

test('v57: camera origin is restored in overview, planet view and size-order row',()=>{
 for(const [view,row,expectedTarget,expectedDist,expectedAngles] of [
  ['solar',false,[0,0,0],72,[.63,.99]],
  ['planet',false,[0,0,0],33,[.63,.84]],
  ['solar',true,[42,1,0],22,[0,1.5]],
  ['planet',true,[42,1,0],22,[0,1.5]]
 ]){
  const r=cameraFixture(view,row);
  r.resetViewCamera();
  assert.deepEqual(r.camera.desiredTarget,expectedTarget,`${view}/${row}: position`);
  assert.equal(r.camera.desiredDist,expectedDist,`${view}/${row}: distance`);
  assert.deepEqual([r.camera.theta,r.camera.phi],expectedAngles);
  assert.equal(r.cameraManuallyMoved,false);
  assert.equal(r.focusedBodyId,null);
  assert.equal(r.followEnabled,false);
  assert.equal(r.followedBodyId,null);
  assert.equal(r.followChanges,1);
  assert.equal(r.cameraPresetIndex,row?2:0);
 }
});

test('v57: camera reset during a scale transition animates the return angles',()=>{
 const r=cameraFixture('planet');
 r.transition={cameraFrom:[0,0],cameraTo:null};
 r.resetViewCamera();
 assert.deepEqual(r.transition.cameraFrom,[2.8,.3]);
 assert.deepEqual(r.transition.cameraTo,[.63,.84]);
 assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
 assert.equal(r.camera.desiredDist,33);
 assert.equal(r.camera.theta,2.8,'angle interpolation starts at the previous pose');
});

test('v57: both scale switches recenter even after manual motion, focus and follow',async()=>{
 const app=await read('src/app.js');
 const source=segment(app,'function syncScaleControls(){','function syncOrbitControls(){');
 const solar=createViewSettings('solar'),planet=createViewSettings('planet');
 const S={settings:solar,viewSettings:{solar,planet},time:Date.UTC(2026,10,18)};
 const r=cameraFixture('solar');
 r.settings=solar;r.planetId=null;
 r._labelState={};r.calcCount=0;r.calcPositions=()=>r.calcCount++;
 r.beginTransition=kind=>{r.lastTransition=kind;r.transition={cameraFrom:[r.camera.theta,r.camera.phi],cameraTo:null};};
 r.solarOverviewDistance=SolarRenderer.prototype.solarOverviewDistance;
 r.planetFrameDistance=()=>34;
 const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
 const ctx=vm.createContext({syncToggleState,S,renderer:r,$:get,notifyToggle:()=>{}});
 vm.runInContext(source,ctx);
 vm.runInContext('updateScale("scaleObjects")',ctx);
 assert.equal(r.lastTransition,'scale');
 assert.equal(r.calcCount,1);
 assert.equal(r.camera.desiredDist,188,'optimized solar scale uses the home overview distance');
 assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
 assert.deepEqual(r.transition.cameraTo,[.63,.99]);
 assert.equal(r.focusedBodyId,null);assert.equal(r.followEnabled,false);assert.equal(r.cameraManuallyMoved,false);

 r.cameraManuallyMoved=true;r.focusedBodyId='mars';r.camera.theta=1.8;r.camera.phi=.24;
 r.camera.desiredTarget=[65,3,4];
 vm.runInContext('updateScale("scaleOrbits")',ctx);
 assert.equal(r.camera.desiredDist,160);
 assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
 assert.deepEqual(r.transition.cameraTo,[.63,.99]);

 S.settings=planet;r.settings=planet;r.planetId='saturn';r.cameraManuallyMoved=true;
 r.camera.desiredTarget=[77,9,2];r.focusedBodyId='titan';
 vm.runInContext('updateScale("scaleObjects")',ctx);
 assert.equal(r.camera.desiredDist,34);
 assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
 assert.deepEqual(r.transition.cameraTo,[.63,.84]);
 assert.equal(r.focusedBodyId,null);

 planet.row=true;r.cameraManuallyMoved=true;
 vm.runInContext('updateScale("scaleOrbits")',ctx);
 assert.deepEqual(r.camera.desiredTarget,[42,1,0]);
 assert.equal(r.camera.desiredDist,22);
 assert.deepEqual(r.transition.cameraTo,[0,1.5]);
 assert.equal(r.cameraManuallyMoved,false);
 assert.equal(r.calcCount,4);
});
