import {DAY, TAU, clamp} from './math.js';

// Illustrative Sun-relative galactic motion, not a measured Milky Way ephemeris.
// Scene Y is vertical and the historical trail has negative Y; a much smaller
// negative-Z component gives depth while the camera remains entirely unchanged.
export const GALACTIC_DRIFT_UNITS_PER_DAY = 0.012;
export const GALACTIC_DEPTH_FRACTION = 0.16;
export const GALACTIC_SIDE_SWAY_AMPLITUDE = 0.65;
export const GALACTIC_SIDE_SWAY_PERIOD_DAYS = 365.25 * 7;
export const GALACTIC_SWAY_Y_AMPLITUDE = 1.15;
export const GALACTIC_SWAY_Z_AMPLITUDE = 0.72;
export const GALACTIC_SWAY_Y_PERIOD_DAYS = 365.25 * 9.5;
export const GALACTIC_SWAY_Z_PERIOD_DAYS = 365.25 * 15.5;
export const GALACTIC_MIN_HISTORY_DAYS = 365.25 * 2.2;
export const GALACTIC_MAX_HISTORY_DAYS = 365.25 * 16;
export const GALACTIC_SUN_HISTORY_DAYS = 365.25 * 18;

export function galacticOffsetAt(timeMs, referenceTimeMs=timeMs){
  const deltaDays=(Number(timeMs)-Number(referenceTimeMs))/DAY;
  const sideSway=GALACTIC_SIDE_SWAY_AMPLITUDE*Math.sin(deltaDays*TAU/GALACTIC_SIDE_SWAY_PERIOD_DAYS);
  const swayY=GALACTIC_SWAY_Y_AMPLITUDE*Math.sin(deltaDays*TAU/GALACTIC_SWAY_Y_PERIOD_DAYS);
  const swayZ=GALACTIC_SWAY_Z_AMPLITUDE*(Math.sin(deltaDays*TAU/GALACTIC_SWAY_Z_PERIOD_DAYS + TAU/8)-Math.sin(TAU/8));
  return [
    sideSway, // No sideways drift: camera rotations never re-define "down".
    deltaDays*GALACTIC_DRIFT_UNITS_PER_DAY+swayY,
    deltaDays*GALACTIC_DRIFT_UNITS_PER_DAY*GALACTIC_DEPTH_FRACTION+swayZ
  ];
}

export function galacticHistoryDays(body){
  const period=Math.abs(Number(body?.periodDays)||0);
  if(body?.id==='sun' || body?.type==='star')return GALACTIC_SUN_HISTORY_DAYS;
  const scaled=period>0 ? period*1.6 : GALACTIC_MIN_HISTORY_DAYS;
  return clamp(scaled,GALACTIC_MIN_HISTORY_DAYS,GALACTIC_MAX_HISTORY_DAYS);
}
