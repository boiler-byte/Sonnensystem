import { J2000, AU_KM } from './bodies.js';
import { TAU, RAD, DAY, clamp } from '../renderer/math.js';

/** Physically proportional world coordinates: 1 AU = 3.4 units in the solar view.
 * In planet view, the parent's physical radius is 1.28 units; sizes and
 * distances therefore use the same reference when both toggles are active.
 */
export const SOLAR_UNITS_PER_AU = 3.4;
export const SOLAR_UNITS_PER_KM = SOLAR_UNITS_PER_AU / AU_KM;
export const PLANET_RADIUS_UNITS = 1.28;

// The optimized solar overview is intentionally illustrative, not a physical
// distance/size scale. Keep the previous v44 planet-size calibration (4x the
// schematic Sun) and enlarge ONLY the Sun to 3x its v81 optimized size.
// Planet view and Objekt an/Bahn an retain their physical size ratios.
export const OPTIMIZED_ORBIT_FACTOR = 4;
export const OPTIMIZED_SUN_MAGNIFICATION = 3;
export const SOLAR_REFERENCE_RADIUS_KM = 696340;
// Physical orbital spacing has no meaning in the lined-up representation.
// Keep the saved switch untouched so it takes effect again after leaving Reihe.
export const orbitScaleActive = settings => settings?.scaleOrbits === true && settings?.row !== true;
export const optimizedSolarMode = settings => settings?.scaleObjects === true && !orbitScaleActive(settings);
const OPTIMIZED_PLANET_REFERENCE_RADIUS = OPTIMIZED_ORBIT_FACTOR * renderRadius({id:'sun',type:'star'});
export const OPTIMIZED_SUN_RADIUS = OPTIMIZED_PLANET_REFERENCE_RADIUS * OPTIMIZED_SUN_MAGNIFICATION;

/**
 * Visual orbit anchors use real semi-major axes (AU) only as ordered keys.
 * Schematic distances are close to evenly spaced, rather than spreading the
 * outer planets with a square root. In the optimized overview the enlarged
 * Sun pushes Mercury through Mars out; distant paths are packed closer than
 * the old 4x-schematic arrangement. Interpolation also covers minor bodies.
 * Do not use these illustrative distances for Objekt an/Bahn an.
 */
const SOLAR_ORBIT_ANCHORS = [
  // a [AU], schematic radius, optimized radius
  [0.387098,  3.00, 19.50], // Mercury
  [0.723332,  5.25, 25.00], // Venus
  [1.000000,  7.50, 29.00], // Earth
  [1.523679,  9.75, 33.00], // Mars
  [5.204400, 12.00, 41.00], // Jupiter
  [9.582600, 14.25, 49.00], // Saturn
  [19.21840, 16.50, 58.00], // Uranus
  [30.11000, 18.75, 67.00]  // Neptune
];

function visualSolarOrbitRadius(aAU,column){
  const raw=Number(aAU);
  const a=Number.isFinite(raw)?Math.max(0,raw):0;
  const first=SOLAR_ORBIT_ANCHORS[0];
  if(a<=first[0]){
    const base=column===1?1.8:OPTIMIZED_SUN_RADIUS+1.6;
    return base+(first[column]-base)*a/first[0];
  }
  for(let i=1;i<SOLAR_ORBIT_ANCHORS.length;i++){
    const end=SOLAR_ORBIT_ANCHORS[i],start=SOLAR_ORBIT_ANCHORS[i-1];
    if(a<=end[0])return start[column]+(end[column]-start[column])*(a-start[0])/(end[0]-start[0]);
  }
  // Flatter-than-linear tail beyond Neptune, smooth at the last anchor.
  const last=SOLAR_ORBIT_ANCHORS.at(-1),previous=SOLAR_ORBIT_ANCHORS.at(-2);
  const span=last[0]-previous[0];
  return last[column]+(last[column]-previous[column])*Math.log1p((a-last[0])/span);
}

export const sceneRadius = aAU => visualSolarOrbitRadius(aAU,1);
export const optimizedSolarOrbitRadius = aAU => visualSolarOrbitRadius(aAU,2);

/** Schematic by default, radius proportional to catalog radius when enabled. */
export function displayBodyRadius(body, settings = {}, center = null) {
  if (!settings?.scaleObjects) {
    // Solar overview only: for Objekt aus / Bahn an, shrink the Sun to one
    // third of its schematic radius without changing any planetary bodies.
    if (!center && orbitScaleActive(settings) && body?.id === 'sun') return renderRadius(body) / 3;
    // Any object can be the local system center, not just planets/dwarfs.
    return center && body?.id===center.id ? PLANET_RADIUS_UNITS
      : center?.id==='sun' ? renderRadius(body)
      : center ? planetBodyRadius(body) : renderRadius(body);
  }
  const radiusKm = Math.max(0, Number(body?.radiusKm) || 0);
  if (center) {
    // A probe has no known physical radius: its isolated illustration is symbolic.
    if (body?.id===center.id) return PLANET_RADIUS_UNITS;
    return radiusKm * PLANET_RADIUS_UNITS / Math.max(1, Number(center.radiusKm) || 0);
  }
  if (optimizedSolarMode(settings)) {
    // Row/Cinema compare radii in their own layout; keep their v81 proportions.
    if (body?.id === 'sun' || body?.type === 'star')
      return radiusKm ? (settings?.row ? OPTIMIZED_PLANET_REFERENCE_RADIUS : OPTIMIZED_SUN_RADIUS) : 0;
    return radiusKm * OPTIMIZED_PLANET_REFERENCE_RADIUS / SOLAR_REFERENCE_RADIUS_KM;
  }
  return radiusKm * SOLAR_UNITS_PER_KM;
}

/** Orbits remain Keplerian; only the semi-major axis mapping changes. */
export function displayOrbitRadius(body, parent, settings = {}, center = null) {
  if (!orbitScaleActive(settings)) {
    // Sun-centered children use AU-based solar spacings, not km-based moon spacings.
    const schematic = center?.id==='sun' ? sceneRadius(Number(body?.a)||0)
      : center ? planetOrbitRadius(body, center) : orbitalRadius(body, parent);
    if (!center && optimizedSolarMode(settings)) {
      return parent?.id==='sun' ? optimizedSolarOrbitRadius(body.a) : schematic * OPTIMIZED_ORBIT_FACTOR;
    }
    return schematic;
  }
  const a = Math.max(0, Number(body?.a) || 0);
  if (center) {
    const unit=body?.meanDistanceUnit||(center.id==='sun'?'AU':'km');
    const km=unit==='AU'?a*AU_KM:a;
    return km * PLANET_RADIUS_UNITS / Math.max(1, Number(center.radiusKm) || 0);
  }
  return body?.type === 'moon' || body?.type === 'satellite' || (body?.type === 'binary' && body?.parentId !== 'sun')
    ? a * SOLAR_UNITS_PER_KM : a * SOLAR_UNITS_PER_AU;
}
export function renderRadius(body) {
  if (!body) return 0;
  if (body.id === 'sun' || body.type === 'star') return 1.13;
  if (body.type === 'satellite') return .060;
  if (body.type === 'asteroid' || body.type === 'binary' || body.type === 'comet') return .11;
  if (body.type === 'moon') return clamp(.115+Math.log10(Math.max(1,body.radiusKm)/1000)*.055, .075,.235);
  if (body.type === 'dwarf') return .18;
  if (body.type === 'tno') return .16;
  return clamp(.19+.48*Math.pow(Math.max(0,body.radiusKm)/69911,.39),.19,.67);
}
export function orbitalRadius(body, parent) {
  if (body.type === 'binary' && body.parentId !== 'sun') {
    return renderRadius(parent)+.38+clamp(Math.log10(Math.max(.01,body.a)/1.152)*.13,-.1,.3);
  }
  if (body.type === 'moon') {
    return renderRadius(parent)+.68+clamp(Math.log10(Math.max(10,body.a)/384400)*.36,-.26,.9);
  }
  if (body.type === 'satellite') {
    const rKm = Math.max(6300,body.a);
    return renderRadius(parent)+.28+clamp((rKm-6700)/35000*.35,0,1.0);
  }
  return sceneRadius(body.a);
}
/** Local planet view: preserve orbit order but compress huge real-world distances. */
export function planetOrbitRadius(child, planet) {
  const ratio = Math.max(1, (Number(child?.a)||0) / Math.max(1, Number(planet?.radiusKm)||1));
  return clamp(2.4 + 2.05*Math.log10(ratio), 2.4, 11);
}
export function planetBodyRadius(body) {
  if (body.type === 'planet' || body.type === 'dwarf') return 1.28;
  if (body.type === 'satellite') return .09;
  return clamp(renderRadius(body)*1.40, .14, .35);
}
export function keplerPosition(body, parent, timeMs, phase = null, displayRadius = null) {
  const a = displayRadius ?? orbitalRadius(body,parent);
  const ecc = clamp(Number(body.e)||0,0,.98);
  const period = Math.abs(Number(body.periodDays)) || 365.25;
  const t = ((timeMs - (Number(body.epoch)||J2000))/DAY) / period;
  let M = (phase == null ? (Number(body.M)||0)*RAD : phase) + t*TAU;
  M = ((M + Math.PI) % TAU + TAU) % TAU - Math.PI;
  let E = M;
  for (let j=0;j<7;j++) E -= (E - ecc*Math.sin(E) - M) / (1 - ecc*Math.cos(E));
  const f = Math.atan2(Math.sqrt(1-ecc*ecc)*Math.sin(E), Math.cos(E)-ecc);
  const r = a*(1-ecc*Math.cos(E));
  const i = (Number(body.i)||0)*RAD;
  const N = (Number(body.node)||0)*RAD;
  const w = (Number(body.peri)||0)*RAD;
  const u = f+w;
  const X = r*(Math.cos(N)*Math.cos(u)-Math.sin(N)*Math.sin(u)*Math.cos(i));
  const Y = r*Math.sin(u)*Math.sin(i);
  const Z = r*(Math.sin(N)*Math.cos(u)+Math.cos(N)*Math.sin(u)*Math.cos(i));
  return [X,Y,Z];
}
