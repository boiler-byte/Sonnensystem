import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {availableLayerTypes,createViewSettings,layerEnabled,updateLayerSelection} from '../src/data/layers.js';
import {displayBodyRadius,displayOrbitRadius,sceneRadius,PLANET_RADIUS_UNITS} from '../src/data/orbital-math.js';
import {syncDetailSceneAction,renderDetail} from '../src/ui/object-details.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';
import {TYPES,AU_KM} from '../src/data/bodies.js';
const source=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const byId=id=>INITIAL_BODIES.find(b=>b.id===id);
const probe={id:'synthetic-probe',name:'Testsatellit ohne Ephemeride',type:'probe',parentId:null,
  radiusKm:0,launchDate:'2001-01-01',missionStatus:'Beendet',targets:'Test',description:'Symbolische Testsonde',color:'#aabbcc',style:'rock'};

function renderer(bodies=INITIAL_BODIES){
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=1100;r.height=740;r.planetId=null;r.selectedId=null;r.positions=new Map();r.overrides=new Map();
  r.simTime=Date.UTC(2026,10,22);r.glow={style:{}};r.settings=createViewSettings('planet');
  r.gl={depthMask(){}};r.makeVP=()=>({vp:'test'});r.drawStars=()=>{};
  r.setBodies(bodies);
  return r;
}
function dom(){
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id)){
      const attrs={},classList={active:false,toggle(name,value){this[name]=value;}};
      nodes.set(id,{id,hidden:true,disabled:false,innerHTML:'',textContent:'',title:'',style:{setProperty(){}},
        attrs,classList,querySelector(selector){return selector==='span'?this.labelSpan:null;},
        querySelectorAll(){return []},setAttribute(key,value){attrs[key]=value},getAttribute(key){return attrs[key]}});
    }
    return nodes.get(id);
  };
  get('back-to-solar').labelSpan={textContent:'Sonnensystem'};
  return {nodes,get,document:{getElementById:get}};
}

for(const [id,type] of [
  ['sun','star'],['earth','planet'],['moon','moon'],['pluto','dwarf'],['charon','moon'],
  ['ceres','dwarf'],['didymos','binary'],['dimorphos','binary'],['sat-25544','satellite']
]){
  test(`v150: ${id} (${type}) opens its own isolated view`,()=>{
    const r=renderer();
    assert.equal(byId(id)?.type,type);
    assert.equal(r.showPlanetSystem(id),true);
    assert.equal(r.planetId,id);
    assert.deepEqual(r.positions.get(id),[0,0,0]);
    assert.deepEqual(new Set(r.positions.keys()),new Set([id,...INITIAL_BODIES.filter(b=>b.parentId===id&&b.type!=='probe').map(b=>b.id)]));
    assert.ok(Number.isFinite(r.planetFrameDistance())&&r.planetFrameDistance()>0);
    assert.ok(Math.abs(displayBodyRadius(byId(id),r.settings,byId(id))-PLANET_RADIUS_UNITS)<1e-10);
    assert.ok(availableLayerTypes(INITIAL_BODIES,'planet',id).includes(type));
  });
}

test('v150: all catalog categories can be local centers, including comets and TNOs',()=>{
  const r=renderer();
  const seen=new Set();
  for(const body of INITIAL_BODIES){
    if(seen.has(body.type))continue;
    seen.add(body.type);
    assert.equal(r.showPlanetSystem(body.id),true,`${body.type}: ${body.name}`);
    assert.equal(r.planetId,body.id);
    assert.equal(r.positions.has(body.id),true);
    assert.ok(Number.isFinite(r.camera.dist));
  }
  assert.deepEqual([...seen].sort(),Object.keys(TYPES).filter(type=>type!=='probe').sort());
  assert.equal(r.showPlanetSystem('nonexistent'),false);
});

test("v150: Sun's local planets follow AU scale, not physically tiny moon-km scale",()=>{
  const sun=byId('sun'),earth=byId('earth');
  assert.equal(displayOrbitRadius(earth,sun,{scaleOrbits:false},sun),sceneRadius(earth.a));
  const physical=displayOrbitRadius(earth,sun,{scaleOrbits:true},sun);
  assert.ok(Math.abs(physical-earth.a*AU_KM*PLANET_RADIUS_UNITS/sun.radiusKm)<1e-8);
  const r=renderer();r.showPlanetSystem('sun');
  assert.ok(Math.hypot(...r.positions.get('earth'))>3,'planet is not collapsed onto the Sun');
  assert.ok(displayBodyRadius(earth,{scaleObjects:false},sun)<displayBodyRadius(sun,{scaleObjects:false},sun),
    'Sun remains visually larger than an orbiting planet');
});

test('v150: an isolated moon stays visible with the four-moons cap enabled',()=>{
  const r=renderer();
  assert.equal(r.showPlanetSystem('moon'),true);
  r.settings.fourMoons=true;
  r.fourMoonIds=new Set(); // The isolated center is not necessarily one of the selected four.
  assert.equal(r.shouldDraw(byId('moon')),true);
});

test('v150: probe scene is a symbolic standalone center without invented orbiters',()=>{
  const r=renderer([...INITIAL_BODIES,probe]);
  assert.equal(r.showPlanetSystem(probe.id),true);
  assert.deepEqual([...r.positions.keys()],[probe.id]);
  assert.equal(r.shouldDraw(probe),false,'probe layer is not enabled by default');
  const available=availableLayerTypes([...INITIAL_BODIES,probe],'planet',probe.id);
  assert.deepEqual(available,['probe']);
  r.settings.layers=updateLayerSelection(r.settings.layers,'probe',true,'planet',available);
  assert.equal(layerEnabled(r.settings.layers,'probe'),true);
  assert.equal(r.shouldDraw(probe),true,'the single schematic center can be rendered');
  r.planetId='earth';assert.equal(r.shouldDraw(probe),false,'probe is not drawn as a real orbiter');
  r.planetId=probe.id;r.settings.row=true;
  assert.equal(r.shouldDraw(probe),true,'symbolic center remains visible in row mode');
  assert.equal(displayBodyRadius(probe,{scaleObjects:true},probe),PLANET_RADIUS_UNITS);
});

test('v150: detail panel offers a view for any selected object, including probes',()=>{
  const original=globalThis.document;
  const {get,document}=dom();globalThis.document=document;
  try{
    for(const id of ['sun','moon','charon','didymos','dimorphos','sat-25544', 'earth']){
      syncDetailSceneAction(byId(id),{planetId:id});
      assert.equal(get('planet-view-actions').hidden,false,id);
      assert.equal(get('detail-scene-actions').hidden,false,id);
      assert.equal(get('planet-view-btn').getAttribute('aria-pressed'),'true',id);
      assert.ok(get('planet-view-btn').getAttribute('aria-label').includes(byId(id).name));
    }
    syncDetailSceneAction(probe,{planetId:null});
    assert.equal(get('planet-view-actions').hidden,false);
    renderDetail({selected:probe.id,bodies:[...INITIAL_BODIES,probe],time:Date.UTC(2026,10,22)},
      {planetId:null,overrides:new Map()},()=>{});
    assert.equal(get('planet-view-actions').hidden,false,'probe detail branch keeps its scene action');
    syncDetailSceneAction(null,{});
    assert.equal(get('planet-view-actions').hidden,true);
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});

test('v150: back button displays parent name and handles nested + top-level scenes',()=>{
  const original=globalThis.document;
  const {get,document}=dom();globalThis.document=document;
  try{
    const state={bodies:INITIAL_BODIES};
    const camera={camera:{},cameraPresetIndex:0,cameraManuallyMoved:false};
    for(const [center,target] of [['moon','Erde'],['charon','Pluto'],['dimorphos',byId('didymos').name],
      ['earth','Sonnensystem'],['pluto','Sonnensystem'],['sun','Sonnensystem']]){
      syncSceneMode(state,{planetId:center,...camera});
      assert.equal(get('back-to-solar').hidden,false);
      assert.equal(get('back-to-solar').labelSpan.textContent,target);
      assert.equal(get('back-to-solar').title,target==='Sonnensystem'?'Zurück zum Sonnensystem':target==='Erde'?'Zurück zur Erde':`Zurück zu ${target}`);
    }
    syncSceneMode({...state,bodies:[...state.bodies,probe]},{planetId:probe.id,...camera});
    assert.equal(get('schematic-scene-note').hidden,false);
    syncSceneMode(state,{planetId:null,...camera});
    assert.equal(get('schematic-scene-note').hidden,true);
    assert.equal(get('back-to-solar').hidden,true);
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
});

test('v152: details action cycles Moon from solar into Earth without discarding Moon selection',async()=>{
  const src=await source('src/ui/event-handlers.js');
  const start=src.indexOf("  $('planet-view-btn').addEventListener('click',()=>{");
  const end=src.indexOf('  const togglePlayback=',start);
  assert.ok(start>0 && end>start);
  const callbacks=new Map(),calls=[],S={selected:'moon',bodies:INITIAL_BODIES,
    viewSettings:{solar:createViewSettings('solar'),planet:createViewSettings('planet')}};
  const renderer={planetId:null,setSelected(id){calls.push(['selected',id])}};
  const context=vm.createContext({$:id=>({addEventListener(_name,cb){callbacks.set(id,cb)}}),
    renderer,S,byId,openPlanetScene:id=>(calls.push(['opened',id]),renderer.planetId=id,true),
    nextDetailSceneId:(body,bodies,current)=>{
      assert.equal(body.id,'moon');assert.equal(current,null);return 'earth';
    },layerEnabled,availableLayerTypes,updateLayerSelection,
    rendererSelectionId:body=>body.id,
    updateMode:()=>calls.push('mode'),updateCatalog:()=>calls.push('catalog'),
    updateDetail:()=>calls.push('detail'),arMode:null,mobileSheets:{close:()=>calls.push('close')}});
  vm.runInContext(src.slice(start,end),context);
  callbacks.get('planet-view-btn')();
  assert.equal(renderer.planetId,'earth');
  assert.equal(S.selected,'moon');
  assert.deepEqual(calls[0],['opened','earth']);
  assert.deepEqual(calls[1],['selected','moon']);
});

test('v150: top-left back performs Moon → Earth → Sonnensystem and clears solar selection',async()=>{
  const src=await source('src/ui/event-handlers.js');
  const start=src.indexOf("  $('back-to-solar').addEventListener('click',()=>{");
  const end=src.indexOf("  $('reset-camera').addEventListener",start);
  const callbacks=new Map(),calls=[];
  const S={selected:'moon'};
  const renderer={planetId:'moon',cinema:null,selectedId:'moon',
    setSelected(id){this.selectedId=id;calls.push(['select',id])},
    reset(){this.planetId=null;calls.push('reset')},
    returnToStandardCamera(){calls.push('overview')}};
  const ctx=vm.createContext({$:id=>({addEventListener(_name,cb){callbacks.set(id,cb)}}),S,renderer,byId,
    clearSelection(){S.selected=null;renderer.setSelected(null);calls.push('clear')},
    openPlanetScene(id){renderer.planetId=id;calls.push(['open',id]);return true},
    updateMode:()=>calls.push('mode'),arMode:null,mobileSheets:{close:()=>calls.push('close')}});
  vm.runInContext(src.slice(start,end),ctx);
  const back=callbacks.get('back-to-solar');
  back();
  assert.equal(renderer.planetId,'earth');
  assert.equal(S.selected,'earth');
  assert.ok(calls.some(entry=>Array.isArray(entry) && entry[0]==='open' && entry[1]==='earth'));
  assert.ok(!calls.includes('reset'),'Moon returns to Earth, not the solar overview');
  calls.length=0;back();
  assert.equal(renderer.planetId,null);
  assert.equal(S.selected,null);
  assert.deepEqual(calls,[['select',null],'clear','reset','mode','overview','close']);
});
