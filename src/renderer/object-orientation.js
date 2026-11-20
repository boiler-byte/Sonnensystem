import { J2000 } from '../data/bodies.js';
import { keplerPosition } from '../data/orbital-math.js';
import { RAD, TAU } from './math.js';

const HOUR_MS = 3600000;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const angle = degrees => (finite(degrees) ? degrees : 0) * RAD;
const wrap = radians => ((radians % TAU) + TAU) % TAU;

/**
 * Surface maps are equirectangular: north at the top, longitude zero at u=0.5.
 * At phase zero the map centre looks towards scene +Z. The phase is measured
 * from the body's own epoch, so pausing, changing speed or seeking is exact.
 *
 * A signed sidereal period indicates the *direction* of rotation. If the
 * obliquity is >90 degrees, its inverted axis already expresses retrograde
 * rotation; applying a negative local turn would erroneously invert it twice.
 */
export function rotationPhase(body, timeMs) {
  const phase = angle(body?.texturePhaseDeg);
  if (!body || !finite(timeMs)) return wrap(phase);

  // For explicitly synchronously rotating satellites, orient the central
  // meridian towards the parent using the KEPLER position (not row positions).
  // This keeps the same face planetward in solar, planet, row and cinema views.
  if (body.synchronousRotation === true && body.parentId &&
      finite(body.periodDays) && body.periodDays > 0) {
    const relative = keplerPosition(body, null, timeMs, null, 1);
    const towardX = -relative[0], towardZ = -relative[2];
    if (Math.hypot(towardX, towardZ) > 1e-10) {
      const heading = angle(body.axisHeadingDeg);
      const x = Math.cos(heading) * towardX - Math.sin(heading) * towardZ;
      const z = Math.sin(heading) * towardX + Math.cos(heading) * towardZ;
      const tilt = angle(body.axialTiltDeg);
      return wrap(Math.atan2(Math.cos(tilt) * x, z) + phase);
    }
  }

  const period = body.rotationPeriodHours;
  if (!finite(period) || period === 0) return wrap(phase); // Unknown is not an invented spin.
  const duration = Math.abs(period) * HOUR_MS;
  if (!(duration > 0) || !Number.isFinite(duration)) return wrap(phase);
  const epoch = finite(body.rotationEpoch) ? body.rotationEpoch :
    (finite(body.epoch) ? body.epoch : J2000);
  const tilt = finite(body.axialTiltDeg) ? body.axialTiltDeg : 0;
  const direction = tilt > 90 ? 1 : Math.sign(period);
  // Remainder first avoids loss of precision at dates far from the epoch.
  return wrap(phase + direction * TAU * ((timeMs - epoch) % duration) / duration);
}

/** Column-major T * Ry(axisHeading) * Rx(obliquity) * Ry(surfacePhase) * S. */
export function orientedModel(position, radius, tiltRadians=0, phaseRadians=0, headingRadians=0) {
  const c=Math.cos(tiltRadians), s=Math.sin(tiltRadians);
  const u=Math.cos(phaseRadians), v=Math.sin(phaseRadians);
  const h=Math.cos(headingRadians), k=Math.sin(headingRadians);
  return new Float32Array([
    radius*(h*u-k*c*v), radius*s*v, radius*(-k*u-h*c*v), 0,
    radius*k*s, radius*c, radius*h*s, 0,
    radius*(h*v+k*c*u), radius*(-s*u), radius*(-k*v+h*c*u), 0,
    position[0],position[1],position[2],1
  ]);
}

export function bodyModel(body, position, radius, timeMs) {
  return orientedModel(position,radius,angle(body?.axialTiltDeg),
    rotationPhase(body,timeMs),angle(body?.axisHeadingDeg));
}

/** The rings share Saturn's *tilted rotation axis*, but not its surface spin. */
export function ringModel(body, position, radius) {
  return orientedModel(position,radius,angle(body?.axialTiltDeg),0,angle(body?.axisHeadingDeg));
}

/** Shader normals are in object space: transform a world-space sun vector back. */
export function localLightDirection(worldDirection, modelMatrix) {
  const [x,y,z] = worldDirection;
  const a=modelMatrix;
  const lx=a[0]*x+a[1]*y+a[2]*z;
  const ly=a[4]*x+a[5]*y+a[6]*z;
  const lz=a[8]*x+a[9]*y+a[10]*z;
  const length=Math.hypot(lx,ly,lz)||1;
  return [lx/length,ly/length,lz/length];
}
