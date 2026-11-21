import {galacticOffsetAt} from './galactic-motion.js';

// A visual depth cue, not a physical parsec-scale stellar simulation.
// The existing star sphere spans 100..225 world units. Nearby stars shift
// more than distant ones; the shader evaluates this weight per star on GPU.
export const STAR_PARALLAX_NEAR_RADIUS = 100;
export const STAR_PARALLAX_FAR_RADIUS = 225;
export const STAR_PARALLAX_WORLD_SCALE = 0.006;
export const STAR_PARALLAX_MAX_WORLD_OFFSET = 8;
export const STAR_PARALLAX_EASE_MS = 320;

export function starParallaxDepthWeight(radius){
  const near=Math.min(1,Math.max(0,(STAR_PARALLAX_FAR_RADIUS-radius)/
    (STAR_PARALLAX_FAR_RADIUS-STAR_PARALLAX_NEAR_RADIUS)));
  return .02+.98*near*near;
}

/** Camera-following galactic backdrop: stars drift opposite the Sun. */
export function galacticStarParallaxTarget(timeMs,referenceTimeMs,active=true){
  if(!active || !Number.isFinite(timeMs) || !Number.isFinite(referenceTimeMs))return [0,0,0];
  const offset=galacticOffsetAt(timeMs,referenceTimeMs)
    .map(component=>component===0 ? 0 : -component*STAR_PARALLAX_WORLD_SCALE);
  const distance=Math.hypot(...offset);
  if(distance<=STAR_PARALLAX_MAX_WORLD_OFFSET)return offset;
  const factor=STAR_PARALLAX_MAX_WORLD_OFFSET/distance;
  return offset.map(component=>component*factor);
}

/** Smooth entry, pause/scrub jumps and exit without altering simulation time. */
export function easeGalacticStarOffset(previous,target,elapsedMs){
  const elapsed=Math.min(150,Math.max(0,Number(elapsedMs)||0));
  const alpha=1-Math.exp(-elapsed/STAR_PARALLAX_EASE_MS);
  return target.map((component,i)=>(Number(previous?.[i])||0)*(1-alpha)+component*alpha);
}
