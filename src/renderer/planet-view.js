import { layerEnabled } from '../data/layers.js';
import { planetOrbitRadius, planetBodyRadius } from '../data/orbital-math.js';
import { CAMERA_FOV, clamp } from './math.js';

/** Isolated planet scene: planet, direct natural moons and artificial orbiters. */
export function drawPlanetSystemScene(renderer, selectedId, settings, vp) {
  const gl=renderer.gl;
  const selected=renderer.byId.get(selectedId);
   const planet=renderer.byId.get(renderer.planetId),children=renderer.planetChildren().filter(b=>layerEnabled(settings.layers,b.type));
   if(settings.orbits){
    gl.depthMask(false);
    // All bodies remain visible. Limit the number of orbit strokes for dense live catalogs.
    const moons=children.filter(b=>b.type==='moon').sort((a,b)=>b.radiusKm-a.radiusKm);
    const satellites=children.filter(b=>b.type==='satellite');
    const orbitIds=new Set([...moons.slice(0,80),...satellites.slice(0,35),selected].filter(Boolean).map(b=>b.id));
    for(const b of children)if(orbitIds.has(b.id))renderer.orbitLine(b,[0,0,0],vp,b.id===selectedId?.70:.22,b.id===selectedId);
    gl.depthMask(true);
   }
   renderer.rendered=[planet,...children].filter(b=>b && layerEnabled(settings.layers,b.type) && renderer.positions.has(b.id));
   for(const b of renderer.rendered){const pos=renderer.positions.get(b.id);if(b.id==='saturn')renderer.drawRings(pos,vp);renderer.drawSphere(b,pos,vp);}
   renderer.drawLabels(vp);
   renderer.glow.style.opacity='0';
}

export function planetChildrenFor(bodies,id) {
  return bodies.filter(b=>b.parentId===id && (b.type==='moon'||b.type==='satellite'));
}

export function planetFrameDistance(width,height,planet,children) {
  if(!planet)return 12;
  const outer=children.reduce((r,b)=>Math.max(r,planetOrbitRadius(b,planet)*(1+clamp(Number(b.e)||0,0,.8))),0);
  if(!outer)return 10.5;
  const halfVertical=CAMERA_FOV/2;
  const halfHorizontal=Math.atan(Math.tan(halfVertical)*Math.max(.2,width)/Math.max(1,height));
  return clamp(outer/Math.tan(Math.min(halfVertical,halfHorizontal))*1.24,12,95);
}
