/** Choose the same paths for the planet scene and its transition snapshots. */
export function planetOrbitIds(children, selected) {
  const moons=children.filter(body=>body.type==='moon').sort((a,b)=>b.radiusKm-a.radiusKm);
  const satellites=children.filter(body=>body.type==='satellite');
  const others=children.filter(body=>body.type!=='moon'&&body.type!=='satellite');
  return new Set([...moons.slice(0,80),...satellites.slice(0,35),...others,selected]
    .filter(Boolean).map(body=>body.id));
}

/** Sphere/ring rendering and label ordering are identical in both scene modes. */
export function drawSceneBodies(renderer, candidates, vp, compare) {
  const rendered=renderer.rendered||[];
  rendered.length=0;
  for(const body of candidates)if(body && renderer.shouldDraw(body) && renderer.positions.has(body.id))rendered.push(body);
  if(compare)rendered.sort(compare);
  renderer.rendered=rendered;
  for(const body of rendered) {
    const position=renderer.positions.get(body.id);
    const lod=renderer.objectLOD?.(body,position,vp) ?? 0;
    if(body.id==='saturn' && lod<2)renderer.drawRings(position,vp,{lod});
    renderer.drawSphere(body,position,vp,{lod});
  }
  renderer.flushLODMarkers?.(vp); // Pixel sprites must precede translucent orbit strokes.
  renderer.drawLabels(vp);
  return rendered;
}
