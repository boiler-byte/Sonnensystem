import { CAMERA_FOV, clamp, lerp, matMul, perspective, lookAt } from './math.js';

/**
 * Pan across the orbital ground plane (XZ), never along the tilted screen plane.
 * Right and forward depend on camera heading (theta), NOT inclination (phi).
 * Dragging moves the scene with the pointer; arrow keys move the viewpoint.
 * Preserve the target height so panning cannot climb or sink at low angles.
 * Manual panning cancels target easing; focus()/reset() remain animated.
 */
export function panCameraByPixels(camera, dx, dy, viewportHeight) {
  const units = 2 * camera.dist * Math.tan(CAMERA_FOV / 2) / Math.max(1, viewportHeight);
  const theta = camera.theta;
  const right = [Math.cos(theta), 0, -Math.sin(theta)];
  const forward = [-Math.sin(theta), 0, -Math.cos(theta)];
  const target = camera.target.map((value, i) => value + units * (-dx * right[i] + dy * forward[i]));
  camera.target = target;
  camera.desiredTarget = target.slice();
}

/** Smooth focus changes; manual pan remains immediate. */
export function cameraView(camera, width, height, focusOffsetY=0) {const cam=camera;cam.dist=lerp(cam.dist,cam.desiredDist,.075);
  for(let i=0;i<3;i++)cam.target[i]=lerp(cam.target[i],cam.desiredTarget[i],.075);
  const r=cam.dist,phi=cam.phi,th=cam.theta;
  const eye=[cam.target[0]+r*Math.sin(phi)*Math.sin(th),cam.target[1]+r*Math.cos(phi),cam.target[2]+r*Math.sin(phi)*Math.cos(th)];
  // Shift the perspective's optical center upward when the mobile detail sheet
  // covers the lower viewport. All scene objects, labels and picking use this VP.
  // With focusOffsetY=.56, the camera target projects to 22% of canvas height:
  // the center of the 44% of the canvas left visible above the sheet.
  const projection=perspective(CAMERA_FOV,width/height,.1,350);
  projection[9]=-clamp(focusOffsetY,0,1);
  const vp=matMul(projection,lookAt(eye,cam.target));
  return {vp,eye};
 }
