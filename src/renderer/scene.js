import { J2000, AU_KM } from '../data/bodies.js';
import { keplerPosition, planetOrbitRadius, orbitalRadius, sceneRadius } from '../data/orbital-math.js';
import { vadd } from './math.js';

export function computePositions(renderer, timeMs) {renderer.positions.clear();
  if(renderer.planetId){
   const planet=renderer.byId.get(renderer.planetId);
   if(planet?.type==='planet'){
    renderer.positions.set(planet.id,[0,0,0]);
    const date=new Date(timeMs).toISOString().slice(0,10);
    for(const child of renderer.planetChildren()){
     const r=planetOrbitRadius(child,planet),ov=renderer.overrides.get(child.id);
     let pos=keplerPosition(child,planet,timeMs,null,r);
     if(ov?.date===date){
      const [x,y,z]=ov.vector,length=Math.hypot(x,y,z)||1;
      pos=[x*r/length,z*r/length,y*r/length];
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
    let rel=keplerPosition(b,parent,timeMs);
    const date=new Date(timeMs).toISOString().slice(0,10),ov=renderer.overrides.get(id);
    if(ov&&ov.date===date){const [x,y,z]=ov.vector;const length=Math.hypot(x,y,z)||1;
      const scale=b.type==='moon'?orbitalRadius(b,parent)/length:sceneRadius(length/AU_KM)/length;
      // JPL reference ECLIPTIC: x,y are ecliptic plane; z is latitude.
      rel=[x*scale,z*scale,y*scale];
    }
    const out=vadd(center,rel);renderer.positions.set(id,out);inProgress.delete(id);return out;
  };
  renderer.bodies.filter(b=>b.type!=='probe').forEach(b=>calc(b.id));
 }
