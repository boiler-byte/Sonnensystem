import { J2000, AU_KM } from '../data/bodies.js';
import { keplerPosition, displayOrbitRadius, orbitalRadius, sceneRadius, SOLAR_UNITS_PER_KM, optimizedSolarMode, OPTIMIZED_ORBIT_FACTOR } from '../data/orbital-math.js';
import { vadd } from './math.js';

/** Horizons ECLIPTIC x/y define the orbital plane; scene y points to latitude. */
export function eclipticVectorToScene(vector, scale) {
  const [x,y,z]=vector;
  return [x*scale,z*scale,y*scale];
}

export function computePositions(renderer, timeMs) {
  renderer.positions.clear();
  if(renderer.settings?.row && renderer.cinema?.active){
    // The Cinema lineup replaces the orbital positions of its visible bodies
    // in calcPositions(). Computing thousands of Kepler orbits in every movie
    // frame adds no visual information and causes avoidable frame stalls.
    renderer.positions.set(renderer.planetId||'sun',[0,0,0]);
    return;
  }
  const date=new Date(timeMs).toISOString().slice(0,10);
  if(renderer.planetId){
   const planet=renderer.byId.get(renderer.planetId);
   if(['planet','dwarf'].includes(planet?.type)){
    renderer.positions.set(planet.id,[0,0,0]);
    for(const child of renderer.planetChildren()){
     const r=displayOrbitRadius(child,planet,renderer.settings,planet),ov=renderer.overrides.get(child.id);
     let pos=keplerPosition(child,planet,(renderer.renderOrbitTime?.(child,timeMs)??timeMs),null,r);
     if(ov?.date===date){
      const length=Math.hypot(...ov.vector)||1;
      const factor=renderer.settings?.scaleOrbits ? (1.28/Math.max(1,Number(planet.radiusKm)||0)) : r/length;
      pos=eclipticVectorToScene(ov.vector,factor);
     }
     renderer.positions.set(child.id,pos);
    }
    return;
   }
   renderer.planetId=null;
  }
  const inProgress=new Set();
  const calc=id=>{if(renderer.positions.has(id))return renderer.positions.get(id);
    const b=renderer.byId.get(id);if(!b)return[0,0,0];
    if(inProgress.has(id))return[0,0,0];inProgress.add(id);
    if(!b.parentId){renderer.positions.set(id,[0,0,0]);inProgress.delete(id);return[0,0,0];}
    const parent=renderer.byId.get(b.parentId);const center=calc(b.parentId);
    let rel=keplerPosition(b,parent,(renderer.renderOrbitTime?.(b,timeMs)??timeMs),null,displayOrbitRadius(b,parent,renderer.settings));
    const ov=renderer.overrides.get(id);
    if(ov&&ov.date===date){const length=Math.hypot(...ov.vector)||1;
      const scale=renderer.settings?.scaleOrbits
        ? ((b.type==='moon'||b.type==='satellite'||(b.type==='binary'&&b.parentId!=='sun')) ? SOLAR_UNITS_PER_KM : 3.4/AU_KM)
        : b.parentId==='sun' && Number(b.a)>0
          // Use the same semi-major-axis scale as the drawn Kepler orbit.
          // Otherwise non-linear schematics can put JPL bodies off their paths.
          ? displayOrbitRadius(b,parent,renderer.settings)/(Number(b.a)*AU_KM)
          : (b.type==='moon'||(b.type==='binary'&&b.parentId!=='sun') ? orbitalRadius(b,parent)/length : sceneRadius(length/AU_KM)/length)
            * (optimizedSolarMode(renderer.settings) ? OPTIMIZED_ORBIT_FACTOR : 1);
      // JPL reference ECLIPTIC: x,y are ecliptic plane; z is latitude.
      rel=eclipticVectorToScene(ov.vector,scale);
    }
    const out=vadd(center,rel);renderer.positions.set(id,out);inProgress.delete(id);return out;
  };
  renderer.bodies.filter(b=>b.type!=='probe').forEach(b=>calc(b.id));
 }
