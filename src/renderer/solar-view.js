import { layerEnabled } from '../data/layers.js';
import { projected, clamp } from './math.js';
import {drawSceneBodies} from './scene-objects.js';
import {drawSunTrail} from './orbits.js';

/** Real Sun-centered Kepler paths; moons and satellites remain planet-centered. */
const SOLAR_ORBIT_TYPES=new Set(['planet','dwarf','tno','asteroid','binary','comet']);
export function solarOrbitBodies(bodies, layers) {
  return bodies.filter(body=>body.parentId==='sun' && SOLAR_ORBIT_TYPES.has(body.type) &&
    layerEnabled(layers,body.type) && Number(body.a)>0 && Number(body.periodDays)>0);
}

/** Full heliocentric overview, visually unchanged from v5. */
export function drawSolarSystemScene(renderer, selectedId, settings, vp) {
  const gl=renderer.gl;
  const visible=b=>layerEnabled(settings.layers,b.type);
  const selected=renderer.byId.get(selectedId);
  const orbitBodies=solarOrbitBodies(renderer.bodies,settings.layers)
    .filter(body=>renderer.shouldDraw?.(body)!==false);
  const binaryOrbits=renderer.bodies.filter(body=>{
    const parent=renderer.byId.get(body.parentId);
    return body.type==='binary'&&parent?.type==='binary'&&visible(body)&&
      renderer.shouldDraw?.(body)!==false&&renderer.positions.has(parent.id);
  });
  if(settings.galacticMotion&&renderer._galacticTrails){
    const ids=new Set([...orbitBodies,...binaryOrbits].map(body=>body.id));
    const sun=renderer.byId.get('sun');
    if(settings.orbits&&sun&&visible(sun)&&renderer.shouldDraw?.(sun)!==false)ids.add('sun');
    renderer._galacticTrails.retainVisible(ids);
  }
  if(settings.orbits && (renderer.orbitOpacity?.() ?? 1)>.001){
    gl.depthMask(false);
    const animatedCenter=renderer.positions.get('sun')||[0,0,0];
    drawSunTrail(renderer,vp,.92,settings);
    for(const body of orbitBodies){
      const selectedOrbit=body.id===selectedId;
      const opacity=selectedOrbit?.70:body.type==='planet'?.20:.16;
      renderer.orbitLine(body,animatedCenter,vp,opacity,selectedOrbit);
    }
    for(const body of binaryOrbits){
      const center=renderer.positions.get(body.parentId);
      renderer.orbitLine(body,center,vp,body.id===selectedId?.70:.22,body.id===selectedId);
    }
    gl.depthMask(true);
  }
  const order={star:0,planet:1,dwarf:2,tno:3,asteroid:4,binary:4,comet:4,moon:5,satellite:6};
  drawSceneBodies(renderer,renderer.bodies,vp,(a,b)=>order[a.type]-order[b.type]);
  const sun=projected(renderer.positions.get('sun')||[0,0,0],vp,renderer.width,renderer.height);
  if(!layerEnabled(settings.layers,'star'))renderer.glow.style.opacity='0';
  else if(sun){renderer.glow.style.left=sun.x+'px';renderer.glow.style.top=sun.y+'px';renderer.glow.style.opacity=(clamp(.98-(renderer.camera.dist-15)/90,.25,.9)*(renderer.sceneBodyOpacity?.(renderer.byId.get('sun'))??1)).toFixed(2);}
}
