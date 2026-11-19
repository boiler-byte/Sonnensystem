import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {renderDetail} from '../src/ui/object-details.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {availableLayerTypes,createViewSettings,layerEnabled,updateLayerSelection} from '../src/data/layers.js';

const read=p=>readProjectSource(p);
const byId=id=>INITIAL_BODIES.find(body=>body.id===id);

class Node {
  constructor(){this.hidden=false;this.innerHTML='';this.textContent='';this.title='';this.attrs={};this.style={setProperty(){}};this.classList={toggle(){}};}
  setAttribute(key,value){this.attrs[key]=value;}
  getAttribute(key){return this.attrs[key];}
  querySelectorAll(){return [];}
}

function withDetail(id,planetId=null){
  const old=globalThis.document,nodes=new Map();
  const get=key=>{if(!nodes.has(key))nodes.set(key,new Node());return nodes.get(key);};
  globalThis.document={getElementById:get};
  try{
    const state={bodies:INITIAL_BODIES,selected:id};
    const renderer={planetId,overrides:new Map()};
    renderDetail(state,renderer,()=>{});
    return {hidden:get('planet-view-actions').hidden,
      label:get('planet-view-title').textContent,
      aria:get('planet-view-btn').getAttribute('aria-label'),
      pressed:get('planet-view-btn').getAttribute('aria-pressed')};
  }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
}

test('v27: reset is a single framed zoom-out icon separate from the panel and mobile menu',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),app=await read('src/app.js');
  const action=html.split('class="viewport-actions"')[1].split('<canvas id="space"')[0];
  const panel=html.split('id="view-mode-status"')[1].split('id="canvas-error"')[0];
  assert.equal((html.match(/id="reset-camera"/g)||[]).length,1);
  assert.match(action,/id="reset-camera"[^>]*aria-label="Kamera zurücksetzen"/);
  for(const perspective of ['oblique','topdown','side'])
    assert.match(action,new RegExp(`data-perspective="${perspective}"`),'all next-view camera icons exist');
  assert.doesNotMatch(panel,/id="reset-camera"|class="scene-tools"|id="view-mode-select"/);
  assert.doesNotMatch(html,/id="help-btn"|id="help-modal"|id="mobile-menu"|id="view-mode-select"/);
  assert.doesNotMatch(app,/\$\('help-btn'\)|\$\('mobile-menu'\)|\$\('view-mode-select'\)/);
  assert.match(css,/\.viewport-actions \.camera-reset-button\{[\s\S]*?border-radius:50%/);
  assert.match(css,/\.viewport>\.control-panel\{\s*width:58px!important/);
  assert.match(app,/\$\('reset-camera'\)\.addEventListener\('click',[\s\S]*?if\(arMode\?\.active\)\{[\s\S]*?cycleCameraPerspective\(\{keepPlanetScene:true\}\)[\s\S]*?arMode\.alignToPerspective\(\)[\s\S]*?renderer\?\.cycleCameraPerspective\(\)/);
});

test('v26: layer trigger is icon-only and keeps an accessible, state-dependent name',async()=>{
  const html=await read('index.html'),app=await read('src/app.js');
  const trigger=html.split('class="layer-button"')[1].split('</button>')[0];
  assert.match(trigger,/<svg[^>]*viewBox="0 0 24 24"/);
  assert.doesNotMatch(trigger,/id="layer-summary"|>Standard<|>Alle<|>\d+ Layer</);
  assert.match(trigger,/title="Objektlayer auswählen"/);
  assert.match(app,/setAttribute\('aria-label',`Objektlayer auswählen \(\$\{summary\}\)`\)/);
  assert.ok((await read('docs/HILFE.md')).length>200,'Help stays in docs');
});

test('v26: dwarf planets and moons have the action, moon actions target the parent system',()=>{
  const pluto=withDetail('pluto');
  assert.equal(pluto.hidden,false);
  assert.equal(pluto.label,'Planetenansicht');
  assert.match(pluto.aria,/Pluto/);
  const ceres=withDetail('ceres');
  assert.equal(ceres.hidden,false,'A dwarf without children still opens an isolated scene');
  assert.equal(ceres.label,'Planetenansicht');
  const charon=withDetail('charon');
  assert.equal(charon.hidden,false);
  assert.equal(charon.label,'Planetenansicht');
  assert.match(charon.aria,/Pluto/);
  const moon=withDetail('moon','earth');
  assert.equal(moon.hidden,false);
  assert.equal(moon.label,'Planetenansicht');
  assert.equal(moon.pressed,'true');
  assert.match(moon.aria,/Erde/);
  assert.equal(withDetail('sat-25544').hidden,true,'Satellites were not requested to have scene actions');
  assert.equal(withDetail('sun').hidden,true);
});

test('v26: dwarf-centred isolated 3D scene positions and renders Pluto and its moons',()=>{
  assert.equal(byId('pluto').type,'dwarf');
  assert.equal(byId('charon').parentId,'pluto');
  assert.deepEqual(availableLayerTypes(INITIAL_BODIES,'planet','pluto'),['moon','dwarf']);
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,target:[0,0,0],desiredTarget:[0,0,0],desiredDist:47};
  r.width=1080;r.height=720;r.simTime=Date.UTC(2026,10,17);
  r.planetId=null;r.positions=new Map();r.overrides=new Map();r.glow={style:{}};
  r.gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,clear(){},depthMask(){}};
  r.makeVP=()=>({vp:'view'});r.drawStars=()=>{};r.drawLabels=()=>{};r.drawRings=()=>{};
  const spheres=[];r.drawSphere=body=>spheres.push(body.id);r.orbitLine=()=>{};
  r.setBodies(INITIAL_BODIES);
  assert.equal(r.showPlanetSystem('pluto'),true);
  assert.deepEqual(r.positions.get('pluto'),[0,0,0]);
  const moons=INITIAL_BODIES.filter(body=>body.parentId==='pluto');
  assert.equal(moons.length,5);
  assert.deepEqual(new Set(r.positions.keys()),new Set(['pluto',...moons.map(b=>b.id)]));
  assert.ok(moons.every(moon=>r.positions.get(moon.id).every(Number.isFinite)));
  const settings=createViewSettings('planet');
  settings.layers=updateLayerSelection(settings.layers,'dwarf',true,'planet',availableLayerTypes(INITIAL_BODIES,'planet','pluto'));
  r.draw(r.simTime,'pluto',settings);
  assert.deepEqual(new Set(spheres),new Set(['pluto',...moons.map(b=>b.id)]));
  assert.equal(r.glow.style.opacity,'0');
  r.reset();
  assert.equal(r.planetId,null);
  assert.ok(r.positions.has('sun'),'Reset goes back to the full solar scene');
  assert.equal(r.showPlanetSystem('charon'),false,'Moon itself does not become a scene center');
});

test('v26: opening a dwarf scene enables its central layer and moon opens its parent',async()=>{
  const source=await read('src/app.js');
  const method=source.slice(source.indexOf('/** Planetary isolation also supports'),source.indexOf('function selectBody(id,focus=false)'));
  const settings={planet:createViewSettings('planet')};
  const opened=[];
  const ctx=vm.createContext({
    byId, S:{bodies:INITIAL_BODIES,viewSettings:settings},
    renderer:{showPlanetSystem:id=>(opened.push(id),true)},
    layerEnabled,availableLayerTypes,updateLayerSelection
  });
  vm.runInContext(method+'\nthis.openPlanetScene=openPlanetScene;',ctx);
  assert.equal(ctx.openPlanetScene('pluto'),true);
  assert.equal(layerEnabled(settings.planet.layers,'dwarf'),true);
  assert.deepEqual(opened,['pluto']);
  assert.equal(ctx.openPlanetScene('charon'),false);
  assert.equal(ctx.openPlanetScene('earth'),true);
  assert.deepEqual(opened,['pluto','earth']);
  const app=source;
  assert.match(app,/const center=selected\?\.type==='moon'\?byId\(selected.parentId\):selected/);
  assert.match(app,/if\(!openPlanetScene\(center\?\.id\)\)return/);
  assert.match(app,/S\.selected=center.id/,'The details selection switches to the parent');
});

test('v26: scene accessibility updates the camera action for dwarf planet and solar views',()=>{
  const old=globalThis.document;
  const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
  globalThis.document={getElementById:get};
  try{
    const state={bodies:INITIAL_BODIES};
    syncSceneMode(state,{planetId:'pluto'});
    assert.match(get('view-mode-status').getAttribute('aria-label'),/Zwergplanet Pluto/);
    assert.equal(get('reset-camera').getAttribute('aria-label'),'Zurück zur Sonnensystem-Übersicht');
    syncSceneMode(state,{planetId:null});
    assert.equal(get('reset-camera').getAttribute('aria-label'),'Kamera zurücksetzen');
  }finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
});
