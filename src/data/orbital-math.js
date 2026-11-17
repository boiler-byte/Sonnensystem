import { J2000 } from './bodies.js';
import { TAU, RAD, DAY, clamp } from '../renderer/math.js';

export const sceneRadius = (aAU) => 3.4 * Math.sqrt(Math.max(0.01,aAU) + 0.22);
export function renderRadius(body) {
  if (!body) return 0;
  if (body.id === 'sun' || body.type === 'star') return 1.13;
  if (body.type === 'satellite') return .060;
  if (body.type === 'asteroid' || body.type === 'comet') return .11;
  if (body.type === 'moon') return clamp(.115+Math.log10(Math.max(1,body.radiusKm)/1000)*.055, .075,.235);
  if (body.type === 'dwarf') return .18;
  return clamp(.19+.48*Math.pow(Math.max(0,body.radiusKm)/69911,.39),.19,.67);
}
export function orbitalRadius(body, parent) {
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
