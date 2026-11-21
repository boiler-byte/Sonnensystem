import { CAMERA_FOV, projected } from './math.js';

const PROJECTION_SCALE=2*Math.tan(CAMERA_FOV/2);

/** Match the drawn sphere's footprint (perspective, row hover and selection).
 * No arbitrary upper cap: an enlarged visible edge remains clickable.
 */
export function projectedHitArea(position,vp,width,height,radiusWorld,{selected=false,scaleObjects=false}={}) {
  if(!position || !vp || !(width>0 && height>0))return null;
  const screen=projected(position,vp,width,height);
  if(!screen || !Number.isFinite(screen.x) || !Number.isFinite(screen.y))return null;
  const scale=selected && !scaleObjects ? 1.045 : 1;
  const visualRadius=Math.max(0,Number(radiusWorld)||0)*scale;
  // A near sphere's silhouette is larger than its center-depth approximation:
  // the tangent from the eye, not the equatorial plane, defines the screen edge.
  const tangentDepth=Math.sqrt(Math.max(0,screen.depth**2-visualRadius**2));
  const radiusPx=tangentDepth>0
    ? visualRadius*height/(PROJECTION_SCALE*tangentDepth) : Infinity;
  const hitRadiusPx=Math.max(12,radiusPx+5);
  // In the row the leading sphere is intentionally cropped by the viewport.
  if(screen.x+hitRadiusPx<0 || screen.x-hitRadiusPx>width ||
     screen.y+hitRadiusPx<0 || screen.y-hitRadiusPx>height)return null;
  return {...screen,radiusPx,hitRadiusPx};
}
