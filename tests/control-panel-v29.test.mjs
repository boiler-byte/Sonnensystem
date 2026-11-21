import {syncToggleState} from '../src/ui/control-state.js';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createViewSettings, largestMoonIds, layerPreset, updateLayerSelection} from '../src/data/layers.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {BODY_FS} from '../src/renderer/shaders.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=file=>readProjectSource(file);
const byId=id=>INITIAL_BODIES.find(b=>b.id===id);

function mockRenderer(){
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=1000;r.height=700;r.simTime=Date.UTC(2026,10,17);
  r.planetId=null;r.positions=new Map();r.overrides=new Map();r.glow={style:{}};
  r.gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,clear(){},depthMask(){}};
  r.makeVP=()=>({vp:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]});
  r.drawStars=()=>{};r.drawRings=()=>{};r.drawLabels=()=>{};
  r.drawSphere=()=>{};r.orbitLine=()=>{};
  r.setBodies(INITIAL_BODIES);
  return r;
}

test('v42: realistic lighting defaults to planet view, and four moons to solar overview',()=>{
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  assert.equal(solar.lighting,'optimized');
  assert.equal(planet.lighting,'realistic');
  assert.equal(solar.fourMoons,true);
  assert.equal(planet.fourMoons,false);
  solar.lighting='realistic';solar.fourMoons=false;
  assert.equal(planet.lighting,'realistic','scene preferences remain independent');
  assert.equal(planet.fourMoons,false,'scene preferences remain independent');
  assert.deepEqual([...solar.layers.types],['star','planet'],'solar layer defaults remain unchanged');
  assert.deepEqual([...planet.layers.types],['planet','moon','satellite'],'planet layer defaults remain unchanged');
});

test('v29: largest moon selection is exactly four per planet or dwarf planet by size',()=>{
  const allowed=largestMoonIds(INITIAL_BODIES);
  for(const parent of ['jupiter','saturn','uranus','neptune','pluto']){
    const moons=INITIAL_BODIES.filter(b=>b.type==='moon'&&b.parentId===parent);
    assert.ok(moons.length>4,`${parent} has more than four moons in test fixture`);
    const expected=moons.slice().sort((a,b)=>b.radiusKm-a.radiusKm||a.id.localeCompare(b.id)).slice(0,4);
    assert.deepEqual(new Set(moons.filter(b=>allowed.has(b.id)).map(b=>b.id)),
      new Set(expected.map(b=>b.id)),parent);
  }
  assert.ok(allowed.has('moon'),'Earth keeps its sole natural moon');
  assert.ok(!allowed.has('himalia'),'Smaller Jupiter moon is not included');
  assert.ok(!allowed.has('styx'),'Fifth Pluto moon is not included');
  assert.ok(!allowed.has('sat-25544'),'Artificial satellites are never counted as moons');
  const tied=[
    {id:'moon-b',type:'moon',parentId:'test',radiusKm:42},
    {id:'moon-a',type:'moon',parentId:'test',radiusKm:42},
    {id:'moon-c',type:'moon',parentId:'test',radiusKm:0},
    {id:'other',type:'satellite',parentId:'test',radiusKm:800}
  ];
  assert.deepEqual([...largestMoonIds(tied,1)],['moon-a'],'Ties are deterministic');
});

test('v29: solar overview caps visible and selectable natural moons while preserving catalogue entries',()=>{
  const r=mockRenderer();
  const settings=createViewSettings('solar');
  r.settings=settings;
  assert.ok(!r.shouldDraw(byId('ganymede')),'Default solar layer preset keeps all moons hidden');
  settings.layers=updateLayerSelection(settings.layers,'moon',true);
  r.draw(r.simTime,'himalia',settings);
  const visible=()=>r.rendered.filter(b=>b.type==='moon'&&b.parentId==='jupiter').map(b=>b.id);
  assert.deepEqual(new Set(visible()),new Set(['ganymede','callisto','io','europa']));
  assert.equal(r.rendered.some(b=>b.id==='himalia'),false,'Catalog selection does not bypass the cap');
  settings.fourMoons=false;
  r.draw(r.simTime,'himalia',settings);
  assert.ok(visible().length>4);
  assert.ok(visible().includes('himalia'),'All moons return when switch is off');
  assert.ok(r.bodies.some(b=>b.id==='himalia'),'Filtering does not delete catalogue bodies');
  r.setBodies([...INITIAL_BODIES,{...byId('himalia'),id:'test-giant',radiusKm:3000}]);
  r.settings=settings;
  settings.fourMoons=true;
  assert.ok(r.shouldDraw(r.byId.get('test-giant')),'Live catalog updates recalculate the four largest');
  assert.equal(r.shouldDraw(r.byId.get('europa')),false);
});

test('v29: isolated planet/moon and dwarf scenes cap both spheres and orbit lines when enabled',()=>{
  const r=mockRenderer(),spheres=[],orbits=[];
  r.drawSphere=b=>spheres.push(b.id);
  r.orbitLine=b=>orbits.push(b.id);
  const settings=createViewSettings('planet');
  assert.equal(r.showPlanetSystem('jupiter'),true);
  r.draw(r.simTime,'himalia',settings);
  assert.ok(spheres.includes('himalia') && orbits.includes('himalia'),'Planet view initially shows all moons');
  spheres.length=0;orbits.length=0;
  settings.fourMoons=true;
  r.draw(r.simTime,'himalia',settings);
  assert.deepEqual(new Set(spheres.filter(id=>r.byId.get(id).type==='moon')),
    new Set(['ganymede','callisto','io','europa']));
  assert.deepEqual(new Set(orbits.filter(id=>r.byId.get(id).type==='moon')),
    new Set(['ganymede','callisto','io','europa']));
  assert.ok(!r.rendered.some(b=>b.id==='himalia'),'Hidden moon cannot be picked');
  assert.equal(r.showPlanetSystem('pluto'),true);
  spheres.length=0;orbits.length=0;
  settings.layers=layerPreset('all','planet');
  r.draw(r.simTime,'styx',settings);
  assert.ok(!spheres.includes('styx')&&!orbits.includes('styx'));
  assert.equal(spheres.filter(id=>r.byId.get(id).type==='moon').length,4);
  assert.ok(spheres.includes('pluto'),'Center remains visible');
});

test('v29: lighting toggle sends GPU uniform; realistic retains old shader formula',()=>{
  const r=Object.create(SolarRenderer.prototype),uniforms=[];
  const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,FLOAT:3,TRIANGLES:4,
    UNSIGNED_SHORT:5,TEXTURE0:6,TEXTURE_2D:7,
    useProgram(){},bindBuffer(){},getAttribLocation(){return 0;},enableVertexAttribArray(){},
    vertexAttribPointer(){},getUniformLocation(_program,name){return name;},
    uniformMatrix4fv(){},uniform3f(){},uniform1f(name,value){uniforms.push([name,value]);},
    activeTexture(){},bindTexture(){},uniform1i(){},drawElements(){}};
  r.gl=gl;r.bodyProgram={};r.sphereVB={};r.sphereIB={};r.sphereCount=3;
  r.planetId=null;r.selectedId='earth';r.simTime=0;r.textures={get:()=>null};
  const vp=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
  for(const [lighting,expected] of [['optimized',1],['realistic',0]]){
    r.settings={lighting};uniforms.length=0;
    r.drawSphere(byId('earth'),[1,0,0],vp);
    assert.deepEqual(uniforms.find(([name])=>name==='uOptimizedLighting'),['uOptimizedLighting',expected]);
  }
  assert.match(BODY_FS,/float light=clamp\(\.13\+\.89\*diffuse,\.08,1\.0\)/);
  assert.match(BODY_FS,/mix\(light,\.50\+\.50\*diffuse,step\(\.5,uOptimizedLighting\)\)/);
  assert.match(BODY_FS,/if \(uStyle<\.5\) light=1\.0/);
});

test('v29: new toggles follow labels, expose states, and synchronize for each view',async()=>{
  const html=await read('index.html'),app=await read('src/app.js'),css=await read('css/styles.css');
  const label=html.indexOf('id="toggle-labels"'),light=html.indexOf('id="toggle-lighting"'),moons=html.indexOf('id="toggle-four-moons"');
  assert.ok(label>0 && label<light && light<moons,'Controls appear under Beschriftung in the right order');
  for(const id of ['toggle-lighting','toggle-four-moons']){
    assert.equal(html.split(`id="${id}"`).length-1,1);
    assert.match(html.slice(html.indexOf(`id="${id}"`)),/aria-label=/);
    assert.match(app,new RegExp(`\\$\\('${id}'\\)\\.addEventListener\\('click'`));
  }
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:140px/);
  const start=app.indexOf('function syncLightingControl(){');
  const end=app.indexOf('function changeLayers(next){',start);
  assert.ok(start>=0&&end>start);
  const buttons={};
  for(const id of ['toggle-lighting','toggle-four-moons']){
    buttons[id]={attrs:{},classes:new Set(),title:'',
      setAttribute(key,value){this.attrs[key]=value;},
      classList:{toggle(name,enabled){if(enabled)buttons[id].classes.add(name);else buttons[id].classes.delete(name);}}};
  }
  const S={settings:createViewSettings('solar')};
  const ctx=vm.createContext({syncToggleState,S,$:id=>buttons[id]});
  vm.runInContext(app.slice(start,end)+'\nthis.syncControlsV29=()=>{syncLightingControl();syncFourMoonsControl()};',ctx);
  ctx.syncControlsV29();
  assert.match(buttons['toggle-lighting'].title,/Aus \(Optimiert\)/);
  assert.equal(buttons['toggle-lighting'].attrs['aria-pressed'],'false');
  assert.equal(buttons['toggle-lighting'].classes.has('active'),false);
  assert.equal(buttons['toggle-four-moons'].attrs['aria-pressed'],'false');
  S.settings.lighting='realistic';S.settings.fourMoons=false;
  ctx.syncControlsV29();
  assert.match(buttons['toggle-lighting'].title,/An \(Realistisch\)/);
  assert.equal(buttons['toggle-lighting'].attrs['aria-pressed'],'true');
  assert.equal(buttons['toggle-lighting'].classes.has('active'),true);
  assert.match(buttons['toggle-four-moons'].title,/Alle Monde: An/);
  assert.equal(buttons['toggle-four-moons'].attrs['aria-pressed'],'true');
  S.settings=createViewSettings('planet');
  ctx.syncControlsV29();
  assert.match(buttons['toggle-lighting'].title,/An \(Realistisch\)/);
  assert.equal(buttons['toggle-four-moons'].attrs['aria-pressed'],'true');
  assert.match(app,/syncLightingControl\(\);syncFourMoonsControl\(\);syncLayers\(\);/,
    'Scene switch refreshes both new controls');
});
