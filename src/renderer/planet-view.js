import { displayOrbitRadius } from '../data/orbital-math.js';
import { CAMERA_FOV, clamp, projected } from './math.js';
import {drawSceneBodies,planetOrbitIds} from './scene-objects.js';

/** Isolated planet scene: planet and the direct children present in catalog data. */
export function drawPlanetSystemScene(renderer, selectedId, settings, vp) {
  const gl=renderer.gl;
  const selected=renderer.byId.get(selectedId);
   const planet=renderer.byId.get(renderer.planetId),children=renderer.planetChildren().filter(b=>renderer.shouldDraw(b));
   // Render opaque planets and moons first so their depth hides rear orbit
   // segments while lines nearer to the camera remain visible.
   drawSceneBodies(renderer,[planet,...children],vp);
   if(settings.orbits && (renderer.orbitOpacity?.() ?? 1)>.001){
    gl.depthMask(false);
    // All bodies remain visible. Limit the number of orbit strokes for dense live catalogs.
    const orbitIds=planetOrbitIds(children,selected);
    const animatedCenter=renderer.positions.get(renderer.planetId)||[0,0,0];
    for(const b of children)if(orbitIds.has(b.id))renderer.orbitLine(b,animatedCenter,vp,b.id===selectedId?.70:.22,b.id===selectedId);
    gl.depthMask(true);
   }
   // The Sun's halo belongs to the outgoing solar scene: let it fade
   // along with the solar sphere instead of disappearing on the first frame.
   const previousSun=renderer.transition?.kind==='view'
     ? renderer.transition.fromVisualBodies.get('sun') : null;
   const leavingSun=previousSun && renderer.departingBodyState(previousSun);
   const sun=leavingSun && projected(leavingSun.position,vp,renderer.width,renderer.height);
   if(sun?.visible && leavingSun.opacity>.001){
     renderer.glow.style.left=sun.x+'px';renderer.glow.style.top=sun.y+'px';
     renderer.glow.style.opacity=(clamp(.98-(renderer.camera.dist-15)/90,.25,.9)*leavingSun.opacity).toFixed(2);
   }else renderer.glow.style.opacity='0';
}

export function planetChildrenFor(bodies,id) {
  return bodies.filter(b=>b.parentId===id && b.type!=='probe');
}

export function planetFrameDistance(width,height,planet,children,settings={}) {
  if(!planet)return 12;
  const outer=children.reduce((r,b)=>Math.max(r,displayOrbitRadius(b,planet,settings,planet)*(1+clamp(Number(b.e)||0,0,.8))),0);
  if(!outer)return 10.5;
  const halfVertical=CAMERA_FOV/2;
  const halfHorizontal=Math.atan(Math.tan(halfVertical)*Math.max(.2,width)/Math.max(1,height));
  const maximum=settings.scaleOrbits ? 30000 : 95;
  return clamp(outer/Math.tan(Math.min(halfVertical,halfHorizontal))*1.24,12,maximum);
}
