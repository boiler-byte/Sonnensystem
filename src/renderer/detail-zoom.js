import {CAMERA_FOV, clamp} from './math.js';

/** How large a world-space radius can be while still fitting into the unobscured
 *  part of a portrait canvas? The mobile detail sheet moves the optical center
 *  upward, so the available vertical half-frame gets smaller as it opens. */
export function detailZoomFrameTangent(width,height,focusOffset=0){
  const vertical=Math.tan(CAMERA_FOV/2);
  const horizontal=vertical*Math.max(1,width)/Math.max(1,height);
  return Math.max(1e-5,Math.min(horizontal,vertical*(1-clamp(focusOffset,0,.85))));
}

/** Frame a body rather than using its orbit radius; leave some space around its disc. */
export function detailNearDistance(radius,minDistance,width,height,focusOffset=0){
  const tangent=detailZoomFrameTangent(width,height,focusOffset);
  const discRadius=Math.max(0,Number(radius)||0);
  return Math.max(minDistance*2,discRadius*(1+1.55/tangent));
}

/** The camera looks at the system center. Count the *historical full ellipses*,
 *  not merely current positions, so even eccentric apoapses stay in frame.
 *  The 1x radius accounts for parts of the ellipse closer to the camera. */
export function detailFarDistance(orbits,orbitRadius,width,height,{focusOffset=0,fallback=0,centerRadius=0}={}){
  let extent=Math.max(0,Number(centerRadius)||0);
  for(const body of orbits||[]){
    const radius=Number(orbitRadius(body));
    if(!Number.isFinite(radius)||radius<=0)continue;
    const eccentricity=clamp(Number(body.e)||0,0,.98);
    extent=Math.max(extent,radius*(1+eccentricity));
  }
  const tangent=detailZoomFrameTangent(width,height,focusOffset);
  return Math.max(Number(fallback)||0,extent*(1+1.25/tangent));
}
