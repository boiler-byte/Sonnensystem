import { layerEnabled } from '../data/layers.js';
import { projected, clamp } from './math.js';

/** Real Sun-centered Kepler paths; moons and satellites remain planet-centered. */
export function solarOrbitBodies(bodies, layers) {
  const types=new Set(['planet','dwarf','tno','asteroid','comet']);
  return bodies.filter(body=>body.parentId==='sun' && types.has(body.type) &&
    layerEnabled(layers,body.type) && Number(body.a)>0 && Number(body.periodDays)>0);
}

/** Full heliocentric overview, visually unchanged from v5. */
export function drawSolarSystemScene(renderer, selectedId, settings, vp) {
  const gl=renderer.gl;
  const visible=b=>layerEnabled(settings.layers,b.type);
  const selected=renderer.byId.get(selectedId);
  if(settings.orbits && (renderer.orbitOpacity?.() ?? 1)>.001){
    gl.depthMask(false);
    // Show every available heliocentric orbit for enabled layers, not just a
    // selection/subset. Planet-centered trajectories belong in planet view.
    const animatedCenter=renderer.positions.get('sun')||[0,0,0];
    for(const body of solarOrbitBodies(renderer.bodies,settings.layers)){
      const selectedOrbit=body.id===selectedId;
      const opacity=selectedOrbit?.70:body.type==='planet'?.20:.16;
      renderer.orbitLine(body,animatedCenter,vp,opacity,selectedOrbit);
    }
    gl.depthMask(true);
  }
  renderer.rendered=renderer.bodies.filter(b=>renderer.shouldDraw(b)&&renderer.positions.has(b.id));
  renderer.rendered.sort((a,b)=>{
    const order={star:0,planet:1,dwarf:2,tno:3,asteroid:4,comet:4,moon:5,satellite:6};return order[a.type]-order[b.type];
  });
  for(const b of renderer.rendered){const p=renderer.positions.get(b.id);if(b.id==='saturn')renderer.drawRings(p,vp);renderer.drawSphere(b,p,vp);}
  renderer.drawLabels(vp);
  const sun=projected(renderer.positions.get('sun')||[0,0,0],vp,renderer.width,renderer.height);
  if(!layerEnabled(settings.layers,'star'))renderer.glow.style.opacity='0';
  else if(sun){renderer.glow.style.left=sun.x+'px';renderer.glow.style.top=sun.y+'px';renderer.glow.style.opacity=(clamp(.98-(renderer.camera.dist-15)/90,.25,.9)*(renderer.sceneBodyOpacity?.(renderer.byId.get('sun'))??1)).toFixed(2);}
}
