import {DAY} from './math.js';

// Schematic, Sun-relative galactic drift. A fixed direction and constant speed
// make the Sun's observed path exactly straight, regardless of elapsed time.
export const GALACTIC_DRIFT_UNITS_PER_DAY = 0.012;
export const GALACTIC_DEPTH_FRACTION = 0.16;
export const GALACTIC_YEAR_DAYS = 365.25;
export const GALACTIC_SUN_HISTORY_DAYS = GALACTIC_YEAR_DAYS * 50;
export const GALACTIC_INNER_HISTORY_DAYS = GALACTIC_YEAR_DAYS * 30;
export const GALACTIC_OUTER_HISTORY_DAYS = GALACTIC_YEAR_DAYS * 100;
// Kept as the bounds for non-star objects (and for existing integrations).
export const GALACTIC_MIN_HISTORY_DAYS = GALACTIC_INNER_HISTORY_DAYS;
export const GALACTIC_MAX_HISTORY_DAYS = GALACTIC_OUTER_HISTORY_DAYS;

export function galacticOffsetAt(timeMs, referenceTimeMs=timeMs){
  const days=(Number(timeMs)-Number(referenceTimeMs))/DAY;
  return [0,days*GALACTIC_DRIFT_UNITS_PER_DAY,
    days*GALACTIC_DRIFT_UNITS_PER_DAY*GALACTIC_DEPTH_FRACTION];
}

/** Visible history window per body class, independent of playback speed. */
export function galacticHistoryDays(body){
  if(body?.id==='sun'||body?.type==='star')return GALACTIC_SUN_HISTORY_DAYS;
  if(body?.type==='tno')return GALACTIC_OUTER_HISTORY_DAYS;
  if(['mercury','venus','earth','mars'].includes(body?.id))return GALACTIC_INNER_HISTORY_DAYS;
  if(['jupiter','saturn','uranus','neptune'].includes(body?.id))return GALACTIC_OUTER_HISTORY_DAYS;
  if(body?.type==='planet')return Number(body?.a)>=5
    ? GALACTIC_OUTER_HISTORY_DAYS:GALACTIC_INNER_HISTORY_DAYS;
  // Dwarf planets in the Kuiper belt are trans-Neptunian, even if their
  // catalog type is 'dwarf'. Other small bodies use their solar distance.
  const distance=Number(body?.a);
  return Number.isFinite(distance)&&distance>=5 ? GALACTIC_OUTER_HISTORY_DAYS
    : GALACTIC_INNER_HISTORY_DAYS;
}
