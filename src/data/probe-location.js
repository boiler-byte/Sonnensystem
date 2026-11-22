/** Spacecraft without ongoing ephemerides can inherit their terminal body's location.
 * This is an explicit display convention, NOT a spacecraft trajectory or measurement.
 */
import {AU_KM} from './bodies.js';
import {keplerPosition} from './orbital-math.js';

export function probeLocationBody(body,byId){
  if(body?.type!=='probe' || !body.focusBodyId || typeof byId!=='function')return null;
  const target=byId(body.focusBodyId);
  return target && target.type!=='probe' ? target : null;
}

/** Renderer selections need a real body, while the detail pane retains the probe. */
export function rendererSelectionId(body,byId){
  if(!body)return null;
  if(body.type!=='probe')return body.id;
  return probeLocationBody(body,byId)?.id??null;
}

/** Modelled physical heliocentric position, independent of visual orbit scaling.
 * Based on the same catalog orbital elements as the target. No fabricated SPICE data.
 */
export function bodyHeliocentricAu(body,byId,timeMs,visited=new Set()){
  if(!body || !Number.isFinite(timeMs) || visited.has(body.id))return null;
  if(body.id==='sun')return [0,0,0];
  if(!body.parentId)return null;
  const parent=byId(body.parentId);
  if(!parent)return null;
  const next=new Set(visited);next.add(body.id);
  const center=bodyHeliocentricAu(parent,byId,timeMs,next);
  if(!center)return null;
  const a=Number(body.a);
  if(!Number.isFinite(a)||a<=0)return null;
  const unit=body.meanDistanceUnit||(body.parentId==='sun'?'AU':'km');
  const radiusAu=unit==='AU'?a:unit==='km'?a/AU_KM:null;
  if(!Number.isFinite(radiusAu)||radiusAu<=0)return null;
  const relative=keplerPosition(body,parent,timeMs,null,radiusAu);
  if(relative.some(x=>!Number.isFinite(x)))return null;
  return center.map((v,i)=>v+relative[i]);
}

export function inheritedProbeLocation(body,byId,timeMs){
  const target=probeLocationBody(body,byId);
  if(!target)return null;
  const positionAu=bodyHeliocentricAu(target,byId,timeMs);
  return {targetId:target.id,targetName:target.name,positionAu,
    distanceAu:positionAu?Math.hypot(...positionAu):null,
    status:'inherited-body-model'};
}
