/**
 * Camera tour through the currently visible row.
 * Every object is held for five seconds at normal playback speed.
 * The opening reorder (largest to smallest) is concealed by a fade. Subsequent
 * objects are reached by continuous camera travel, as in v98.
 * Sampling by elapsed time makes playback and timeline scrubbing consistent.
 */
import { CAMERA_FOV, clamp, lerp } from './math.js';

export const CINEMA_ENTRY_MS=1100;
export const CINEMA_HOLD_MS=5000;
// Retained as an alias for integrations expecting the v88 planet-specific constant.
export const CINEMA_PLANET_HOLD_MS=CINEMA_HOLD_MS;
export const CINEMA_TRAVEL_MS=1300;
export const CINEMA_END_HOLD_MS=200;


export function cinemaEligible(settings){
 return settings?.row===true;
}

/** Scale the viewing distance to each object's visible sphere or ring extent. */
export function cinemaTrack(layout,width,height,bodyById){
 const ids=layout?.ids??[];
 const aspect=Math.max(1,width)/Math.max(1,height);
 const verticalTan=Math.tan(CAMERA_FOV/2);
 const horizontalTan=verticalTan*aspect;
 let elapsedMs=0;
 const frames=ids.map((id,index)=>{
  const radius=Math.max(0,layout?.footprints?.get(id)??layout?.radii?.get(id)??0);
  // Zero or unknown radius must never collapse the near plane.
  const distance=Math.max(.00001,radius*1.53/verticalTan,
    radius*1.43/Math.max(.12,horizontalTan));
  const holdMs=CINEMA_HOLD_MS;
  const holdStartMs=elapsedMs;
  const holdEndMs=holdStartMs+holdMs;
  const travelEndMs=holdEndMs+(index<ids.length-1?CINEMA_TRAVEL_MS:0);
  elapsedMs=travelEndMs;
  return {id,x:layout.positions.get(id)?.[0]??0,radius,distance,
    holdStartMs,holdEndMs,travelEndMs};
 });
 return {ids,frames,x:frames.map(frame=>frame.x),
   distance:frames[0]?.distance??1,durationMs:elapsedMs};
}

const smooth=t=>{const k=clamp(t,0,1);return k*k*(3-2*k);};

/** Continuous camera travel between the individual five-second holds. */
export function cinemaPoseAt(track,progress){
 const frames=track?.frames??[];
 if(!frames.length)return {target:[0,0,0],distance:1,objectId:null,holding:false};
 const elapsedMs=clamp(Number(progress)||0,0,1)*(track.durationMs||0);
 for(let i=0;i<frames.length;i++){
  const frame=frames[i];
  if(elapsedMs<=frame.holdEndMs || i===frames.length-1){
   return {target:[frame.x,0,0],distance:frame.distance,objectId:frame.id,holding:true};
  }
  if(elapsedMs<frame.travelEndMs){
   const next=frames[i+1];
   const t=smooth((elapsedMs-frame.holdEndMs)/CINEMA_TRAVEL_MS);
   // Exponential interpolation avoids linear-zoom jolts across orders of magnitude.
   const distance=Math.exp(lerp(Math.log(frame.distance),Math.log(next.distance),t));
   return {target:[lerp(frame.x,next.x,t),0,0],distance,
     objectId:t<.5?frame.id:next.id,holding:false};
  }
 }
 const last=frames[frames.length-1];
 return {target:[last.x,0,0],distance:last.distance,objectId:last.id,holding:true};
}

/** There is no blackout between objects; only the opening reorder uses one. */
export function cinemaSceneAt(track,progress){
 return {...cinemaPoseAt(track,progress),opacity:0};
}

// Compatibility for integrations using the v99 helper name.
export const cinemaFadeSceneAt=cinemaSceneAt;

/** Fade the initial size-row reorder (largest -> smallest) around a hidden cut. */
export function cinemaEntryOpacity(elapsedMs,durationMs=CINEMA_ENTRY_MS){
 const t=clamp((Number(elapsedMs)||0)/durationMs,0,1);
 if(t<.27)return smooth(t/.27);
 if(t<=.73)return 1;
 return smooth((1-t)/.27);
}

export function cinemaTargetAt(track,progress){return cinemaPoseAt(track,progress).target;}
export function cinemaObjectAt(track,progress){return cinemaPoseAt(track,progress).objectId;}

/** Scan a stop only once the camera has actually arrived, not during travel or entry. */
export function cinemaRestingObject(cinema,camera,transition){
 if(!cinema?.active || !camera || transition || cinema.seeking || cinema.elapsedMs<CINEMA_ENTRY_MS)return null;
 const pose=cinemaSceneAt(cinema.track,cinema.progress);
 if(!pose.holding || !pose.objectId)return null;
 const dist=Math.max(.00001,pose.distance);
 const positionError=Math.hypot(...pose.target.map((value,i)=>value-(camera.target?.[i]??NaN)));
 return Number.isFinite(positionError) && positionError/dist<.025 &&
   Math.abs(camera.dist-dist)/dist<.025 ? pose.objectId : null;
}

export function cinemaClock(ms){
 const s=Math.max(0,Math.floor((Number(ms)||0)/1000));
 return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
