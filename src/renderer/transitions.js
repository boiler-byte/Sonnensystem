import { CAMERA_FOV, clamp, lerp } from './math.js';
import { AU_KM } from '../data/bodies.js';

export const LAYOUT_TRANSITION_MS = 980;
export const PLANET_ORBIT_WAVE_MAX_DELAY = 0.20; // last orbit starts ~196 ms after the first

/** Monotonic start/finish, without the rubber-band recoil of ordinary layout changes. */
export function gentleEase(progress) {
  const t=clamp(Number(progress)||0,0,1);
  return t*t*(3-2*t);
}

/** Order physical planet-centric orbits by distance, regardless of catalog order. */
export function planetOrbitWaveDelays(bodies) {
  const sorted=[...bodies].filter(b=>Number(b?.a)>0)
    .sort((a,b)=>Number(a.a)-Number(b.a)||String(a.id).localeCompare(String(b.id)));
  const last=sorted.length-1;
  return new Map(sorted.map((body,index)=>[body.id,last ? index/last*PLANET_ORBIT_WAVE_MAX_DELAY : 0]));
}

/** Each orbit uses the same non-elastic curve, starting a little later further out. */
export function planetOrbitWaveEase(progress,delay=0) {
  const lag=clamp(Number(delay)||0,0,PLANET_ORBIT_WAVE_MAX_DELAY);
  return gentleEase((clamp(Number(progress)||0,0,1)-lag)/(1-lag));
}

/** Smooth spring-like arrival with a small (<5%) overshoot, then settles to 1. */
export function rubberEase(progress) {
  const t=clamp(Number(progress)||0,0,1);
  // Cubic easing plus a small damped overshoot near arrival (not at halfway).
  return 1-Math.pow(1-t,3)+.06*Math.sin(Math.PI*t)*t;
}

/** Deterministic positions: size order from real radius; distance uses mean orbital separation. */
export function orderedRowBodies(bodies, order='desc', centerId=null) {
  if(order==='distance'){
    const distance=body=>{
      if(body?.id===centerId || !body?.parentId)return 0; // Center of this scene remains at the left.
      const value=body.meanDistanceToParent??body.a;
      if(typeof value!=='number'||!Number.isFinite(value)||value<=0)return null;
      const unit=body.meanDistanceUnit||(body.parentId==='sun'?'AU':'km');
      return unit==='AU'?value*AU_KM:unit==='km'?value:null;
    };
    return [...bodies].sort((a,b)=>{
      const da=distance(a),db=distance(b);
      if(da===null||db===null)return da===null?(db===null?String(a.id).localeCompare(String(b.id)):1):-1;
      return da-db||String(a.id).localeCompare(String(b.id));
    });
  }
  const sign=order==='asc'?1:-1;
  return [...bodies].sort((a,b)=>sign*((Number(a.radiusKm)||0)-(Number(b.radiusKm)||0))
    || String(a.id).localeCompare(String(b.id)));
}

/** Physical row ordered by radius or orbital distance; each body has a sphere radius and optional larger visual footprint.
 * The latter reserves room for Saturn's rendered rings without changing sphere sizes.
 * The first clearance remains as in v47; gaps after the second body grow by 30%.
 */
export function rowLayout(bodies, radiusOf, footprintOf=(_body,radius)=>radius,order='desc',centerId=null) {
  const ordered=orderedRowBodies(bodies,order,centerId);
  const sizes=ordered.map(b=>Math.max(0,Number(radiusOf(b))||0));
  const footprints=ordered.map((body,i)=>Math.max(sizes[i],Number(footprintOf(body,sizes[i]))||0));
  const largest=Math.max(0,...sizes);
  const gaps=[];
  let x=0;
  const entries=[];
  ordered.forEach((body,i)=>{
    const footprint=footprints[i];
    x+=footprint;
    entries.push([body.id,[x,0,0]]);
    x+=footprint;
    if(i<ordered.length-1){
      // The gap follows the sphere sizes, while the outer visual envelope
      // (Saturn's ring edge) is used for collision-free center separation.
      const base=Math.max(.000005,Math.min(.8,.14*(sizes[i]+sizes[i+1])));
      const gap=i===0?base:base*1.30;
      gaps.push(gap);
      x+=gap;
    }
  });
  for(const [,point] of entries)point[0]-=x/2;
  return {positions:new Map(entries),radii:new Map(ordered.map((b,i)=>[b.id,sizes[i]])),
    footprints:new Map(ordered.map((b,i)=>[b.id,footprints[i]])),
    width:x,largest,gap:gaps.length?Math.min(...gaps):0,gaps,ids:ordered.map(b=>b.id)};
}

/**
 * Frame the next bodies close-up, with only a narrow slice of the biggest body
 * entering at the LEFT screen edge. Further small bodies can be reached by
 * dragging (instead of shrinking the whole lineup to fit the screen).
 */
export function rowCameraFrame(layout, width, height) {
  const ids=layout?.ids||[];
  const aspect=Math.max(1,width)/Math.max(1,height);
  const horizontalTan=Math.tan(CAMERA_FOV/2)*aspect;
  const verticalTan=Math.tan(CAMERA_FOV/2);
  if(!ids.length)return {target:[0,0,0],distance:12,left:0,right:0};
  const at=i=>layout.positions.get(ids[i])?.[0]??0;
  const radius=i=>layout.radii?.get(ids[i])??0;
  const visualExtent=i=>layout.footprints?.get(ids[i])??radius(i);
  const largest=radius(0);
  if(ids.length===1){
    return {target:[at(0),0,0],distance:Math.max(.00001,largest*3.3),
      left:at(0)-largest,right:at(0)+largest};
  }
  // Only 12% of the largest diameter is shown, as a cropped leading edge.
  const left=at(0)+largest*.76;
  const finalIndex=Math.min(ids.length-1,6);
  const right=at(finalIndex)+visualExtent(finalIndex);
  const span=Math.max(.00001,right-left);
  // Exclude the cropped giant from vertical fitting; fit the smaller bodies.
  const tallest=Math.max(0,...ids.slice(1,finalIndex+1).map((_,i)=>visualExtent(i+1)));
  const distance=Math.max(.00001,span/(1.85*horizontalTan),tallest/(.76*verticalTan));
  // Lock the left boundary even on portrait screens, so the giant stays cropped.
  const targetX=left+distance*horizontalTan;
  return {target:[targetX,0,0],distance,left,right};
}

/** Frame a clicked row body at about 46% of the viewport height.
 * Use the normal sphere radius rather than its temporary hover enlargement.
 */
export function rowBodyFocusDistance(radius) {
  const r=Number(radius);
  return Number.isFinite(r) && r>0 ? r/(.46*Math.tan(CAMERA_FOV/2)) : null;
}

/** Distance-only compatibility helper for existing camera callers. */
export function rowFrameDistance(layout,width,height){
  return rowCameraFrame(layout,width,height).distance;
}

export function blendPosition(source,target,amount) {
  return target.map((component,i)=>lerp(Number(source?.[i])||0,component,amount));
}
