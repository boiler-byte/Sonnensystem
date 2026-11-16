import { projected, clamp } from './math.js';

/** Full heliocentric overview, visually unchanged from v5. */
export function drawSolarSystemScene(renderer, selectedId, settings, vp) {
  const gl=renderer.gl;
  const selected=renderer.byId.get(selectedId);
  if(settings.orbits){gl.depthMask(false);
   const primary=renderer.bodies.filter(b=>b.parentId==='sun'&&b.type==='planet');
   for(const b of primary)renderer.orbitLine(b,[0,0,0],vp,b.id===selectedId?.65:.20,b.id===selectedId);
   for(const b of renderer.bodies.filter(b=>b.parentId==='sun'&&b.type==='dwarf'&&(['pluto','ceres'].includes(b.id)||b.id===selectedId)))renderer.orbitLine(b,[0,0,0],vp,b.id===selectedId?.63:.12,b.id===selectedId);
   if(selected?.type==='asteroid'||selected?.type==='comet')renderer.orbitLine(selected,[0,0,0],vp,.71,true);
   const moons=renderer.bodies.filter(b=>b.type==='moon'&&b.parentId&&(b.id===selectedId||b.parentId===selectedId||(selected?.parentId===b.parentId&&b.radiusKm>180)));
   for(const b of moons.slice(0,24))renderer.orbitLine(b,renderer.positions.get(b.parentId)||[0,0,0],vp,b.id===selectedId?.64:.2,b.id===selectedId);
   gl.depthMask(true);
  }
  renderer.rendered=renderer.bodies.filter(b=>renderer.shouldDraw(b)&&renderer.positions.has(b.id));
  renderer.rendered.sort((a,b)=>{
    const order={star:0,planet:1,dwarf:2,asteroid:3,comet:3,moon:4,satellite:5};return order[a.type]-order[b.type];
  });
  for(const b of renderer.rendered){const p=renderer.positions.get(b.id);if(b.id==='saturn')renderer.drawRings(p,vp);renderer.drawSphere(b,p,vp);}
  renderer.drawLabels(vp);
  const sun=projected([0,0,0],vp,renderer.width,renderer.height);
  if(sun){renderer.glow.style.left=sun.x+'px';renderer.glow.style.top=sun.y+'px';renderer.glow.style.opacity=clamp(.98-(renderer.camera.dist-15)/90,.25,.9).toFixed(2);}
}
