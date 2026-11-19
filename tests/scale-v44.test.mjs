import {syncToggleState} from '../src/ui/control-state.js';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {AU_KM} from '../src/data/bodies.js';
import {createViewSettings} from '../src/data/layers.js';
import {
  OPTIMIZED_ORBIT_FACTOR, OPTIMIZED_SUN_RADIUS, SOLAR_REFERENCE_RADIUS_KM,
  optimizedSolarMode, displayBodyRadius, displayOrbitRadius,
  renderRadius, orbitalRadius, planetOrbitRadius, keplerPosition,
  SOLAR_UNITS_PER_AU
} from '../src/data/orbital-math.js';
import {SolarRenderer} from '../src/renderer/index.js';

const byId=id=>INITIAL_BODIES.find(body=>body.id===id);
const close=(got,want,label)=>assert.ok(
  Math.abs(got-want)<1e-10*Math.max(1,Math.abs(want)),`${label}: ${got} != ${want}`);

function mockRenderer(settings,ids=['sun','earth','mars','moon']) {
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.settings=settings;
  renderer.planetId=null;
  renderer.bodies=ids.map(byId);
  renderer.byId=new Map(renderer.bodies.map(b=>[b.id,b]));
  renderer.positions=new Map();
  renderer.overrides=new Map();
  renderer.simTime=Date.UTC(2026,10,18,12,0,0);
  return renderer;
}

test('v44: optimized mode is exclusively Objekt an and Bahn aus',()=>{
  for(const scaleObjects of [false,true])for(const scaleOrbits of [false,true]){
    const active=optimizedSolarMode({scaleObjects,scaleOrbits});
    assert.equal(active,scaleObjects && !scaleOrbits);
  }
  assert.equal(optimizedSolarMode(createViewSettings('solar')),false,'default remains schematic');
  assert.equal(OPTIMIZED_ORBIT_FACTOR,4);
});

test('v44: Sun is exactly 4x schematic; planet radii preserve physical ratios to each other and Sun',()=>{
  const settings={scaleObjects:true,scaleOrbits:false};
  const sun=byId('sun'),earth=byId('earth'),mars=byId('mars'),jupiter=byId('jupiter');
  assert.equal(sun.radiusKm,SOLAR_REFERENCE_RADIUS_KM,'calibration matches Sun catalog');
  close(OPTIMIZED_SUN_RADIUS,4*renderRadius(sun),'preset Sun radius');
  close(displayBodyRadius(sun,settings),4*renderRadius(sun),'Sun 4x schematic');
  close(displayBodyRadius(jupiter,settings)/displayBodyRadius(earth,settings),jupiter.radiusKm/earth.radiusKm,'Jupiter / Earth');
  close(displayBodyRadius(mars,settings)/displayBodyRadius(earth,settings),mars.radiusKm/earth.radiusKm,'Mars / Earth');
  close(displayBodyRadius(earth,settings)/displayBodyRadius(sun,settings),earth.radiusKm/sun.radiusKm,'Earth / Sun');
  close(displayBodyRadius({type:'asteroid',radiusKm:0},settings),0,'unknown radius stays unknown');
  close(displayBodyRadius({id:'sun',type:'star',radiusKm:0},settings),0,'unknown Sun radius stays unknown');
});

test('v44: schematic solar orbital spacing grows uniformly and preserves ratios',()=>{
  const settings={scaleObjects:true,scaleOrbits:false},schematic={scaleObjects:false,scaleOrbits:false};
  const sun=byId('sun'),earth=byId('earth'),mercury=byId('mercury'),jupiter=byId('jupiter'),moon=byId('moon');
  for(const [body,parent] of [[mercury,sun],[earth,sun],[jupiter,sun],[moon,earth]]){
    close(displayOrbitRadius(body,parent,settings),OPTIMIZED_ORBIT_FACTOR*displayOrbitRadius(body,parent,schematic),`${body.id} orbit`);
  }
  const minSeparation=displayOrbitRadius(mercury,sun,settings)*(1-mercury.e)
    -displayBodyRadius(sun,settings)-displayBodyRadius(mercury,settings);
  assert.ok(minSeparation>0,`Mercury orbit must not cut through expanded Sun: ${minSeparation}`);
  close(displayOrbitRadius(jupiter,sun,settings)/displayOrbitRadius(earth,sun,settings),
        orbitalRadius(jupiter,sun)/orbitalRadius(earth,sun),'schematic orbit ratio retained');
});

test('v44: other three modes and isolated planet view remain unchanged',()=>{
  const sun=byId('sun'),earth=byId('earth'),moon=byId('moon');
  const bothOff={scaleObjects:false,scaleOrbits:false},bothOn={scaleObjects:true,scaleOrbits:true},orbitOnly={scaleObjects:false,scaleOrbits:true};
  close(displayBodyRadius(sun,bothOff),renderRadius(sun),'schematic sun');
  close(displayOrbitRadius(earth,sun,bothOff),orbitalRadius(earth,sun),'schematic earth orbit');
  close(displayOrbitRadius(earth,sun,orbitOnly),earth.a*SOLAR_UNITS_PER_AU,'physical earth orbit');
  close(displayBodyRadius(earth,orbitOnly),renderRadius(earth),'schematic earth body');
  close(displayBodyRadius(sun,bothOn),sun.radiusKm/AU_KM*SOLAR_UNITS_PER_AU,'physical sun');
  close(displayOrbitRadius(earth,sun,bothOn),earth.a*SOLAR_UNITS_PER_AU,'physical orbit');
  const optimized={scaleObjects:true,scaleOrbits:false};
  close(displayBodyRadius(moon,optimized,earth),moon.radiusKm/earth.radiusKm*1.28,'planet-view moon radius');
  close(displayBodyRadius(earth,optimized,earth),1.28,'planet-view central body');
  close(displayOrbitRadius(moon,earth,optimized,earth),planetOrbitRadius(moon,earth),'planet-view orbit');
});

test('v44: displayed orbits and positions agree in optimized mode, including live overrides',()=>{
  const settings={scaleObjects:true,scaleOrbits:false};
  const renderer=mockRenderer(settings);
  const earth=byId('earth'),moon=byId('moon'),sun=byId('sun');
  const t=renderer.simTime;
  renderer.calcPositions(t);
  const expected=keplerPosition(earth,sun,t,null,displayOrbitRadius(earth,sun,settings));
  renderer.positions.get('earth').forEach((coord,i)=>close(coord,expected[i],`Earth position ${i}`));
  const expectedMoon=keplerPosition(moon,earth,t,null,displayOrbitRadius(moon,earth,settings));
  renderer.positions.get('moon').forEach((coord,i)=>close(coord,expected[i]+expectedMoon[i],`Moon position ${i}`));
  const date=new Date(t).toISOString().slice(0,10);
  renderer.overrides.set('earth',{date,vector:[AU_KM,0,0]});
  renderer.calcPositions(t);
  const optimizedX=renderer.positions.get('earth')[0];
  renderer.settings={scaleObjects:false,scaleOrbits:false};
  renderer.calcPositions(t);
  close(optimizedX,OPTIMIZED_ORBIT_FACTOR*renderer.positions.get('earth')[0],'JPL override scaled 4x');
});

test('v44: overview and reset camera include expanded solar scheme while planet view stays local',()=>{
  const renderer=mockRenderer({scaleObjects:true,scaleOrbits:false});
  renderer.camera={theta:.63,phi:.99,desiredDist:47,dist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  renderer.followEnabled=false;
  renderer.focusedBodyId=null;
  renderer.cameraManuallyMoved=false;
  close(renderer.solarOverviewDistance(),188,'optimized overview');
  close(renderer.maxCameraDistance(),400,'optimized max zoom out');
  renderer.applyCameraPreset(2);
  close(renderer.camera.desiredDist,188,'preset overview reframed');
  renderer.settings={scaleObjects:true,scaleOrbits:true};
  close(renderer.solarOverviewDistance(),160,'physical orbits retain existing overview');
  renderer.settings={scaleObjects:false,scaleOrbits:false};
  close(renderer.solarOverviewDistance(),47,'schematic overview remains unchanged');
  renderer.settings={scaleObjects:true,scaleOrbits:false};
  renderer.planetId='earth';
  close(renderer.maxCameraDistance(),100,'local planet view retains its zoom range');
});

test('v44: Control Panel announces optimized mode and automatically reframes on each toggle',async()=>{
  const app=await readAppSource();
  const section=app.slice(app.indexOf('function syncScaleControls(){'),app.indexOf('function syncOrbitControls(){'));
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  const elements=new Map(),$=id=>{
    if(!elements.has(id))elements.set(id,{
      hidden:true,attrs:{},title:'',setAttribute(k,v){this.attrs[k]=v},
      classList:{toggle(){}},
    });
    return elements.get(id);
  };
  const renderer={settings:solar,planetId:null,camera:{desiredDist:47,desiredTarget:[0,0,0]},
    focusedBodyId:null,cameraManuallyMoved:false,followEnabled:false,_labelState:null,
    calcCount:0,calcPositions(){this.calcCount++},
    resetViewCamera(){this.camera.desiredTarget=[0,0,0];this.camera.desiredDist=this.solarOverviewDistance();
      this.focusedBodyId=null;this.cameraManuallyMoved=false;},solarOverviewDistance(){
      return solar.scaleOrbits?160:solar.scaleObjects?188:47;
    }};
  const S={settings:solar,viewSettings:{solar,planet},time:Date.UTC(2026,10,18)};
  const notices=[];
  const context=vm.createContext({syncToggleState,$,S,renderer,notifyToggle:msg=>notices.push(msg)});
  vm.runInContext(section,context);
  vm.runInContext('updateScale("scaleObjects")',context);
  assert.equal(renderer.camera.desiredDist,188);
  assert.match($('scale-objects-btn').title,/maßstabsgetreu/);
  assert.equal(notices.at(-1),'Maßstab: Optimierte Größenverhältnisse');
  vm.runInContext('updateScale("scaleOrbits")',context);
  assert.equal(renderer.camera.desiredDist,160);
  assert.match($('scale-orbits-btn').title,/maßstabsgetreu/);
  vm.runInContext('updateScale("scaleOrbits")',context);
  assert.equal(renderer.camera.desiredDist,188);
  vm.runInContext('updateScale("scaleObjects")',context);
  assert.equal(renderer.camera.desiredDist,47);
  assert.equal(solar.scaleObjects,false);
  assert.equal(planet.scaleObjects,false);
  assert.equal(solar.scaleOrbits,false);
  assert.equal(planet.scaleOrbits,false);
  assert.equal(renderer.calcCount,4);
  assert.deepEqual(notices,[
    'Maßstab: Optimierte Größenverhältnisse',
    'Bahn: Maßstabsgetreu',
    'Maßstab: Optimierte Größenverhältnisse',
    'Objekt: Schematisch'
  ]);
});
