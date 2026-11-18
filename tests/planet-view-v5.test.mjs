import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';
import { SolarRenderer, keplerPosition, planetOrbitRadius, planetBodyRadius, orbitalRadius } from '../src/renderer/index.js';

const bodies=INITIAL_BODIES.map(b=>({...b}));
const byId=id=>bodies.find(b=>b.id===id);
const near=(a,b,what)=>assert.ok(Math.abs(a-b)<1e-8,`${what}: got ${a}, expected ${b}`);
function makeRenderer(width=1000,height=680){
 const r=Object.create(SolarRenderer.prototype);
 r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
 r.width=width;r.height=height;r.planetId=null;r.selectedId='earth';r.positions=new Map();r.overrides=new Map();
 r.simTime=Date.UTC(2026,10,16);r.glow={style:{}};
 r.gl={COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,clear(){},depthMask(){}};
 r.makeVP=()=>({vp:'test-vp'});r.drawStars=()=>{};
 r.setBodies(bodies);return r;
}
const at=Date.UTC(2026,10,16);
// Isolated planet system: only its own moons and artificial satellites, no sun, no other planets.
for(const planet of bodies.filter(b=>b.type==='planet')){
 const r=makeRenderer();assert.equal(r.showPlanetSystem(planet.id),true);
 assert.equal(r.planetId,planet.id);
 const children=bodies.filter(b=>b.parentId===planet.id&&(b.type==='moon'||b.type==='satellite'));
 assert.deepEqual([...r.positions.keys()].sort(),[planet.id,...children.map(c=>c.id)].sort(),`${planet.id}: isolated bodies`);
 assert.deepEqual(r.positions.get(planet.id),[0,0,0],`${planet.id}: at scene origin`);
 near(r.camera.dist,r.planetFrameDistance(),`${planet.id}: camera framed`);
 assert.ok(r.camera.dist>0 && r.camera.dist<=95,`${planet.id}: safe frame distance`);
 for(const moon of children){
  assert.ok(r.positions.get(moon.id).every(Number.isFinite),`${moon.id}: coordinates finite`);
  assert.ok(planetOrbitRadius(moon,planet)>planetBodyRadius(planet),`${moon.id}: outside planet`);
  const want=keplerPosition(moon,planet,at,null,planetOrbitRadius(moon,planet));
  const actual=(()=>{r.calcPositions(at);return r.positions.get(moon.id);})();
  actual.forEach((c,i)=>near(c,want[i],`${moon.id}: follows local orbit (${i})`));
 }
 assert.deepEqual(r.camera.target,[0,0,0],`${planet.id}: centered`);
}
{
 const r=makeRenderer();assert.equal(r.showPlanetSystem('earth'),true);
 const ids=[...r.positions.keys()].sort();
 assert.deepEqual(ids,['earth',...bodies.filter(b=>b.parentId==='earth').map(b=>b.id)].sort(),'Earth has the Moon, ISS, Hubble and v56 satellites');
 assert.ok(planetOrbitRadius(byId('moon'),byId('earth'))>planetOrbitRadius(byId('sat-25544'),byId('earth')),'Moon orbits farther out than ISS');
 assert.ok(planetBodyRadius(byId('earth'))>planetBodyRadius(byId('moon')),'Planet prominently larger than moon');
 assert.ok(orbitalRadius(byId('moon'),byId('earth'))!==planetOrbitRadius(byId('moon'),byId('earth')),'Solar scaling untouched');
 const initial=r.positions.get('moon').slice();r.calcPositions(at+86400000);
 assert.notDeepEqual(r.positions.get('moon'),initial,'Moon advances with timeline in planet scene');
 r.setSelected('moon',{focus:true});assert.deepEqual(r.camera.desiredTarget,r.positions.get('moon'),'Selecting moon focuses within planet scene');
 assert.ok(r.camera.desiredDist<r.planetFrameDistance(),'Moon focus closer than whole system');
 r.reset();assert.equal(r.planetId,null,'Overview exits planet mode');
 assert.equal(r.camera.dist,47,'Overview restores solar-system distance immediately');
 assert.deepEqual(r.camera.target,[0,0,0],'Overview centers sun immediately');
 assert.ok(r.positions.has('sun')&&r.positions.has('jupiter'),'Overview recalculates full solar system');
 assert.equal(r.showPlanetSystem('moon'),false,'No planet scene for a moon');
 assert.equal(r.showPlanetSystem('no-id'),false,'No scene for invalid object');
}
{
 const r=makeRenderer(380,780);r.showPlanetSystem('earth');
 const mobileDist=r.camera.dist;
 const desktop=makeRenderer(1000,680);desktop.showPlanetSystem('earth');
 assert.ok(mobileDist>desktop.camera.dist,'Portrait viewport frames wider for entire orbit');
}
{
 const r=makeRenderer();r.showPlanetSystem('earth');
 const planet=byId('earth');
 const dynamic={...byId('moon'),id:'other-earth-moon',name:'Neuer Mond',a:800000};
 r.setBodies([...bodies,dynamic]);r.calcPositions(at);
 assert.ok(r.positions.has(dynamic.id),'Newly loaded moons join planet mode automatically');
 const all=[...r.positions.keys()];assert.equal(all.length,2+bodies.filter(b=>b.parentId==='earth').length,'Only Earth and cataloged orbiters plus the new moon');
 r.showPlanetSystem('mars');assert.deepEqual([...r.positions.keys()].sort(),['mars','phobos','deimos'].sort(),'Changing planet changes local system');
 assert.equal(r.planetId,'mars');
 r.setBodies(bodies.filter(b=>b.id!=='mars'));assert.equal(r.planetId,null,'Removed parent exits scene');
}
{
 const r=makeRenderer();r.showPlanetSystem('earth');
 const calls=[];
 r.orbitLine=b=>calls.push(['orbit',b.id]);
 r.drawSphere=b=>calls.push(['sphere',b.id]);
 r.drawRings=()=>calls.push(['rings']);
 r.drawLabels=()=>{};
 r.draw(at,'earth',{orbits:true,labels:true});
 assert.deepEqual(calls.filter(x=>x[0]==='sphere').map(x=>x[1]),['earth',...bodies.filter(b=>b.parentId==='earth').map(b=>b.id)],'Only local system rendered, including artificial orbiters');
 assert.deepEqual(calls.filter(x=>x[0]==='orbit').map(x=>x[1]).sort(),bodies.filter(b=>b.parentId==='earth').map(b=>b.id).sort(),'All cataloged child orbits rendered');
 assert.equal(r.glow.style.opacity,'0','Sun glow removed from isolated scene');
 calls.length=0;r.draw(at,'earth',{orbits:false,labels:false});
 assert.equal(calls.some(x=>x[0]==='orbit'),false,'Orbit toggle also works in planet scene');
 r.reset();calls.length=0;r.draw(at,'earth',{orbits:false,labels:true});
 assert.ok(calls.some(x=>x[0]==='sphere' && x[1]==='sun'),'Sun restored to solar system render');
}
{
 const r=makeRenderer();
 const extra=Array.from({length:130},(_,i)=>({...byId('moon'),id:`new-${i}`,type:i%2?'moon':'satellite',parentId:'earth',a:7000+i*3000}));
 r.setBodies([...bodies,...extra]);r.showPlanetSystem('earth');
 r.orbitLine=()=>{};const drawn=[];r.drawSphere=b=>drawn.push(b.id);r.drawLabels=()=>{};
 r.draw(at,'earth',{orbits:true,labels:true});
 assert.equal(drawn.length,1+bodies.filter(b=>b.parentId==='earth').length+130,'All cataloged orbiters rendered even when orbit lines capped');
}
console.log('✓ v5 planet-mode engine regression: geometry, selection, camera, rendering and dynamic satellites');
