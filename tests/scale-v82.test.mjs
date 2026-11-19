import assert from 'node:assert/strict';
import {test} from 'node:test';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {
  sceneRadius,renderRadius,orbitalRadius,displayBodyRadius,displayOrbitRadius,
  optimizedSolarOrbitRadius,OPTIMIZED_SUN_MAGNIFICATION,OPTIMIZED_SUN_RADIUS,
  SOLAR_REFERENCE_RADIUS_KM,SOLAR_UNITS_PER_AU
} from '../src/data/orbital-math.js';
import {AU_KM} from '../src/data/bodies.js';
import {computePositions} from '../src/renderer/scene.js';

const byId=id=>INITIAL_BODIES.find(b=>b.id===id);
const planets=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'].map(byId);
const schematic={scaleObjects:false,scaleOrbits:false};
const optimized={scaleObjects:true,scaleOrbits:false};
const physical={scaleObjects:true,scaleOrbits:true};
const close=(actual,want,message)=>assert.ok(
  Math.abs(actual-want)<=1e-9*Math.max(1,Math.abs(want)),`${message}: ${actual} != ${want}`);
const oldRadius=a=>3.4*Math.sqrt(Math.max(.01,a)+.22);

// Orbit spacing is measured between actual catalog semi-major axes. The
// illustrative mapping must also work for nonplanetary catalog entries.
test('v82: the eight schematic planetary paths have uniform, flatter distances',()=>{
  const sun=byId('sun');
  const radii=planets.map(b=>displayOrbitRadius(b,sun,schematic));
  for(let i=1;i<radii.length;i++)close(radii[i]-radii[i-1],2.25,`planet gap ${i}`);
  assert.ok(radii[0]*(1-planets[0].e)>renderRadius(sun),'schematic Mercury perihelion clears Sun');
  assert.ok(radii[3]-radii[2]<oldRadius(planets[3].a)-oldRadius(planets[2].a)+2.5);
  assert.ok(radii[4]-radii[3]<oldRadius(planets[4].a)-oldRadius(planets[3].a),'outer gap flattened');
  assert.ok(sceneRadius(100)>sceneRadius(30.11),'minor bodies beyond Neptune retain ordered distances');
  assert.ok(sceneRadius(100)-sceneRadius(30.11)<sceneRadius(30.11)-sceneRadius(5.2044),'tail does not flare out');
});

test('v82: optimized Sun triples relative to v81, while planets keep their own sizes',()=>{
  const sun=byId('sun');
  assert.equal(OPTIMIZED_SUN_MAGNIFICATION,3);
  close(OPTIMIZED_SUN_RADIUS,3*4*renderRadius(sun),'tripled previous optimized Sun');
  close(displayBodyRadius(sun,optimized),OPTIMIZED_SUN_RADIUS,'visible Sun');
  close(displayBodyRadius(sun,{...optimized,row:true}),4*renderRadius(sun),'row and Cinema keep their original Sun proportions');
  for(const body of planets){
    close(displayBodyRadius(body,optimized),4*renderRadius(sun)*body.radiusKm/SOLAR_REFERENCE_RADIUS_KM,`unmodified ${body.id} size`);
    close(displayBodyRadius(body,physical),body.radiusKm/AU_KM*SOLAR_UNITS_PER_AU,`physical ${body.id} size`);
  }
});

test('v82: optimized orbit spacing clears the enlarged Sun and compresses the outer paths',()=>{
  const sun=byId('sun');
  const expected=[19.5,25,29,33,41,49,58,67];
  planets.forEach((body,i)=>{
    close(displayOrbitRadius(body,sun,optimized),expected[i],`${body.id} new orbit`);
    close(optimizedSolarOrbitRadius(body.a),expected[i],`${body.id} lookup`);
  });
  assert.ok(displayOrbitRadius(planets[0],sun,optimized)*(1-planets[0].e)-OPTIMIZED_SUN_RADIUS>1.5,
    'Mercury perihelion and Sun surface keep visible clearance');
  for(let i=1;i<planets.length;i++){
    const prev=planets[i-1],next=planets[i];
    const outer=displayOrbitRadius(prev,sun,optimized)*(1+prev.e)+displayBodyRadius(prev,optimized);
    const inner=displayOrbitRadius(next,sun,optimized)*(1-next.e)-displayBodyRadius(next,optimized);
    assert.ok(inner>outer,`${prev.id} and ${next.id} orbit bands must not intersect`);
  }
  for(const body of planets.slice(0,6))assert.ok(
    optimizedSolarOrbitRadius(body.a)>4*oldRadius(body.a),`${body.id} orbit displaced outward`);
  for(const body of planets.slice(6))assert.ok(
    optimizedSolarOrbitRadius(body.a)<4*oldRadius(body.a),`${body.id} outer orbit compressed`);
});

test('v82: both visual mappings remain continuous and strictly monotonic for arbitrary heliocentric objects',()=>{
  const values=[0,.1,.387097,.387098,.387099,.45,.723332,.87,1,1.25,1.523679,2.5,5.2044,6,
    9.5826,14,19.2184,26,30.11,30.110001,39.5,68,150,1e4];
  for(const radiusOf of [sceneRadius,optimizedSolarOrbitRadius]){
    let last=-Infinity;
    for(const a of values){
      const r=radiusOf(a);
      assert.ok(Number.isFinite(r)&&r>last,`positive monotonic mapping at ${a}`);
      last=r;
    }
    for(const a of [.387098,.723332,1,1.523679,5.2044,9.5826,19.2184,30.11]){
      const near=radiusOf(a+1e-8)-radiusOf(a-1e-8);
      assert.ok(near>=0&&near<1e-5,`no orbit radius jump at ${a}`);
    }
  }
});

test('v82: Kepler and external JPL override positions use precisely the same orbit radii',()=>{
  const date=Date.UTC(2026,10,19),day=new Date(date).toISOString().slice(0,10);
  const sun=byId('sun'),mercury=planets[0],neptune=planets[7];
  for(const settings of [schematic,optimized,physical]){
    const bodies=[sun,mercury,neptune];
    const overrides=new Map([mercury,neptune].map(b=>[
      b.id,{date:day,vector:[b.a*AU_KM*(1-b.e),0,0]}
    ]));
    const r={bodies,byId:new Map(bodies.map(b=>[b.id,b])),positions:new Map(),
      planetId:null,settings,overrides};
    computePositions(r,date);
    for(const body of [mercury,neptune]){
      const expected=displayOrbitRadius(body,sun,settings)*(1-body.e);
      close(r.positions.get(body.id)[0],expected,`${body.id} JPL perihelion`);
      close(r.positions.get(body.id)[1],0,`${body.id} Y`);
      close(r.positions.get(body.id)[2],0,`${body.id} Z`);
    }
  }
});

test('v82: isolated planet-scene geometry stays unchanged',()=>{
  const earth=byId('earth'),moon=byId('moon');
  close(displayBodyRadius(earth,optimized,earth),1.28,'center radius');
  close(displayBodyRadius(moon,optimized,earth),moon.radiusKm/earth.radiusKm*1.28,'moon radius');
  close(displayOrbitRadius(moon,earth,optimized,earth),displayOrbitRadius(moon,earth,schematic,earth),'unscaled local orbit');
  close(displayOrbitRadius(moon,earth,physical,earth),moon.a/earth.radiusKm*1.28,'scaled local orbit');
});
