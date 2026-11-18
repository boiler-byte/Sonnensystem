import { CAMERA_FOV, clamp, lerp, matMul, perspective, lookAt, vnorm } from './math.js';

// Preset order is also the next-action icon order: oblique -> top-down -> side.
export const CAMERA_PERSPECTIVES=Object.freeze([
  Object.freeze({id:'oblique',name:'Schräg/oben',phi:.99,planetPhi:.84}),
  Object.freeze({id:'topdown',name:'Topdown',phi:.16,planetPhi:.16}),
  Object.freeze({id:'side',name:'Seitlich',phi:1.54,planetPhi:1.54})
]);
export function nextCameraPerspectiveIndex(index=0,manuallyMoved=false){
  return manuallyMoved?0:((Number.isInteger(index)?index:0)+1)%CAMERA_PERSPECTIVES.length;
}


/**
 * Pan across the orbital ground plane (XZ), never along the tilted screen plane.
 * Right and forward depend on camera heading (theta), NOT inclination (phi).
 * Left-mouse / one-finger dragging moves the scene; arrow keys move the viewpoint.
 * Preserve the target height so panning cannot climb or sink at low angles.
 * Manual panning cancels target easing; focus()/reset() remain animated.
 */
export function panCameraByPixels(camera, dx, dy, viewportHeight) {
  const units = 2 * camera.dist * Math.tan(CAMERA_FOV / 2) / Math.max(1, viewportHeight);
  // In free-look mode the ground-plane pan follows the currently viewed
  // heading, even though rotating in place has not moved the camera's eye.
  const theta = camera.freeLook?.theta ?? camera.theta;
  const right = [Math.cos(theta), 0, -Math.sin(theta)];
  const forward = [-Math.sin(theta), 0, -Math.cos(theta)];
  const target = camera.target.map((value, i) => value + units * (-dx * right[i] + dy * forward[i]));
  camera.target = target;
  camera.desiredTarget = target.slice();
}

/**
 * Turn the gaze around the camera's current eye, without orbiting a target.
 * Used only when nothing is selected: right-drag and two-finger swipe match
 * the stationary-point-of-view behavior of device-orientation AR.
 *
 * theta/phi belong to the GAZE, not to the orbital eye position. They are
 * stored separately so cameraView() keeps the same eye while looking around.
 */
export function lookAroundFixedEye(camera,dx,dy,sensitivityX=.0051,sensitivityY=.005){
  if(!dx && !dy)return false;
  const previous=camera.freeLook || camera.arView;
  const initial=previous?.forward;
  const baseTheta=Number.isFinite(previous?.theta)?previous.theta
    :initial?Math.atan2(-initial[0],-initial[2]):camera.theta;
  const basePhi=Number.isFinite(previous?.phi)?previous.phi
    :initial?Math.acos(clamp(-vnorm(initial)[1],-1,1)):camera.phi;
  const theta=baseTheta-dx*sensitivityX;
  // Unlike target-orbit mode, free look can point above the horizon.
  // Positive screen drag is now a downward gaze (inverse of v62).
  const phi=clamp(basePhi-dy*sensitivityY,.001,Math.PI-.001);
  const forward=[-Math.sin(phi)*Math.sin(theta),-Math.cos(phi),-Math.sin(phi)*Math.cos(theta)];
  const right=[Math.cos(theta),0,-Math.sin(theta)];
  const up=[-Math.cos(phi)*Math.sin(theta),Math.sin(phi),-Math.cos(phi)*Math.cos(theta)];
  const look={theta,phi,forward,up};
  if(camera.arView){
    // Sensor readings remain authoritative in AR; any subsequent device
    // orientation event updates this gaze again without moving the camera.
    camera.arView=look;
  }else{
    // Cancel any previous zoom/focus easing so a look-only gesture is truly
    // stationary, matching the first valid AR sensor sample.
    if(!camera.freeLook){
      camera.desiredTarget=camera.target.slice();
      camera.desiredDist=camera.dist;
    }
    camera.freeLook=look;
  }
  return true;
}

/** Convert a free-look pose to an orbit pose without jumping the viewpoint. */
export function restoreOrbitFromLook(camera,key='freeLook'){
  const look=camera?.[key];
  if(!look?.forward)return false;
  const forward=vnorm(look.forward),r=camera.dist;
  const eye=[camera.target[0]+r*Math.sin(camera.phi)*Math.sin(camera.theta),
             camera.target[1]+r*Math.cos(camera.phi),
             camera.target[2]+r*Math.sin(camera.phi)*Math.cos(camera.theta)];
  camera.phi=clamp(Math.acos(clamp(-forward[1],-1,1)),.001,Math.PI-.001);
  camera.theta=Number.isFinite(look.theta)?look.theta:Math.atan2(-forward[0],-forward[2]);
  const orbitForward=[-Math.sin(camera.phi)*Math.sin(camera.theta),
                      -Math.cos(camera.phi),
                      -Math.sin(camera.phi)*Math.cos(camera.theta)];
  camera.target=eye.map((v,i)=>v+orbitForward[i]*r);
  camera.desiredTarget=camera.target.slice();
  camera.desiredDist=r;
  camera[key]=null;
  return true;
}

/**
 * Stop following when the target would cross more than one viewport-height per
 * real second at the current camera distance. This protects against jumps when
 * the simulation accelerates or the date changes, without using orbital units
 * as a fixed threshold (those differ in solar and isolated-planet scenes).
 */
export function followMotionTooFast(previous, current, distance, viewportHeight, elapsedMs) {
  if(!previous || !current || !Number.isFinite(elapsedMs) || elapsedMs<=0)return false;
  const displacement=Math.hypot(...current.map((value,i)=>value-previous[i]));
  const pixelsPerSecond=displacement/Math.max(2.2,distance)
    *viewportHeight/(2*Math.tan(CAMERA_FOV/2))*1000/elapsedMs;
  return pixelsPerSecond>viewportHeight;
}

/** Smooth focus changes; manual pan remains immediate. */
export function cameraView(camera, width, height, focusOffsetY=0, far=350) {const cam=camera;cam.dist=lerp(cam.dist,cam.desiredDist,.075);
  for(let i=0;i<3;i++)cam.target[i]=lerp(cam.target[i],cam.desiredTarget[i],.075);
  const r=cam.dist,phi=cam.phi,th=cam.theta;
  const eye=[cam.target[0]+r*Math.sin(phi)*Math.sin(th),cam.target[1]+r*Math.cos(phi),cam.target[2]+r*Math.sin(phi)*Math.cos(th)];
  // Shift the perspective's optical center upward when the mobile detail sheet
  // covers the lower viewport. All scene objects, labels and picking use this VP.
  // With focusOffsetY=.56, the camera target projects to 22% of canvas height:
  // the center of the 44% of the canvas left visible above the sheet.
  // Very small bodies need a closer near plane when the physical-size toggle is on.
  const near=Math.min(.1,Math.max(1e-7,cam.dist*.12));
  const projection=perspective(CAMERA_FOV,width/height,near,far);
  projection[9]=-clamp(focusOffsetY,0,1);
  // AR sensor and unselected-object manual look both rotate the gaze at a
  // stationary eye. Otherwise render the usual target-orbit perspective.
  const look=cam.arView || cam.freeLook;
  const gaze=look?.forward?eye.map((v,i)=>v+look.forward[i]):cam.target;
  const vp=matMul(projection,lookAt(eye,gaze,look?.up||[0,1,0]));
  return {vp,eye};
 }
