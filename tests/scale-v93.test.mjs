import assert from 'node:assert/strict';
import {test} from 'node:test';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {
  displayBodyRadius,displayOrbitRadius,renderRadius,OPTIMIZED_SUN_RADIUS,
  SOLAR_UNITS_PER_AU
} from '../src/data/orbital-math.js';
import {AU_KM} from '../src/data/bodies.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {computePositions} from '../src/renderer/scene.js';

const byId=id=>INITIAL_BODIES.find(body=>body.id===id);
const sun=byId('sun'),mercury=byId('mercury'),earth=byId('earth'),moon=byId('moon');
const close=(actual,expected,context)=>assert.ok(
  Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),
  `${context}: got ${actual}, expected ${expected}`);

test('v93: only Objekt aus / Bahn an reduces the solar Sun to one third',()=>{
  for(const scaleObjects of [false,true])for(const scaleOrbits of [false,true]){
    const settings={scaleObjects,scaleOrbits};
    const expected=!scaleObjects
      ?(scaleOrbits ? renderRadius(sun)/3 : renderRadius(sun))
      :(scaleOrbits ? sun.radiusKm*SOLAR_UNITS_PER_AU/AU_KM : OPTIMIZED_SUN_RADIUS);
    close(displayBodyRadius(sun,settings),expected,`Sun: objects=${scaleObjects}, orbits=${scaleOrbits}`);
    close(displayBodyRadius(earth,settings),scaleObjects
      ?(scaleOrbits ? earth.radiusKm*SOLAR_UNITS_PER_AU/AU_KM
        :earth.radiusKm*4*renderRadius(sun)/sun.radiusKm)
      :renderRadius(earth),`Earth unchanged for ${scaleObjects}/${scaleOrbits}`);
  }
});

test('v93: sun reduction feeds the actual renderer and leaves orbit geometry intact',()=>{
  const settings={scaleObjects:false,scaleOrbits:true};
  const renderer=Object.create(SolarRenderer.prototype);
  renderer.settings=settings;renderer.planetId=null;renderer.transition=null;
  renderer.byId=new Map([sun,mercury,earth].map(body=>[body.id,body]));
  close(renderer.targetBodyRadius(sun),renderRadius(sun)/3,'renderer target Sun radius');
  close(renderer.bodyRadius(sun),renderRadius(sun)/3,'actual Sun sphere radius');
  close(renderer.bodyRadius(mercury),renderRadius(mercury),'other sphere unaffected');
  close(displayOrbitRadius(mercury,sun,settings),mercury.a*SOLAR_UNITS_PER_AU,'Mercury orbit radius unchanged');

  const time=Date.UTC(2026,10,19);
  renderer.bodies=[sun,mercury,earth];
  renderer.positions=new Map();renderer.overrides=new Map();
  computePositions(renderer,time);
  const orbitLength=Math.hypot(...renderer.positions.get('mercury'));
  assert.ok(orbitLength>renderRadius(sun)/3,'Mercury stays outside reduced Sun');
  assert.ok(Number.isFinite(orbitLength),'orbital coordinates remain valid');
});

test('v93: isolated planet view uses its previous local sizing even when orbit scale is on',()=>{
  const orbitOnly={scaleObjects:false,scaleOrbits:true};
  const bothOff={scaleObjects:false,scaleOrbits:false};
  close(displayBodyRadius(earth,orbitOnly,earth),displayBodyRadius(earth,bothOff,earth),'central planet');
  close(displayBodyRadius(moon,orbitOnly,earth),displayBodyRadius(moon,bothOff,earth),'local moon');
  close(displayBodyRadius(sun,orbitOnly,earth),displayBodyRadius(sun,bothOff,earth),'local scene guard');
});
