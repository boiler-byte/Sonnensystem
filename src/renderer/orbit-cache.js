import {J2000} from '../data/bodies.js';
import {DAY} from './math.js';
import {keplerPosition} from '../data/orbital-math.js';

export const MAX_CACHED_ORBITS = 256;

function geometrySignature(body, radius, segments) {
  return [body.id,body.parentId,body.a,body.periodDays,body.epoch,body.M,body.e,
    body.i,body.node,body.peri,radius,segments].join('|');
}
function touch(map,key,entry,limit=MAX_CACHED_ORBITS){
  if(map.has(key))map.delete(key);
  map.set(key,entry);
  while(map.size>limit)map.delete(map.keys().next().value);
  return entry;
}

// This cache only holds ordinary closed Kepler ellipses. Galactic trajectories
// are recorded incrementally by GalacticTrailHistory, never back-calculated.
export class OrbitGeometryCache {
  constructor(limit=MAX_CACHED_ORBITS) {
    this.limit=Math.max(1,Math.floor(limit));
    this.entries=new Map();
  }
  clear(){this.entries.clear();}
  get(body,parent,radius,segments,center) {
    const signature=geometrySignature(body,radius,segments);
    const key=`normal|${signature}`;
    let entry=this.entries.get(key);
    if(!entry){
      const relative=new Float64Array((segments+1)*3);
      const periodMs=Math.abs(Number(body.periodDays)||365.25)*DAY;
      for(let i=0;i<=segments;i++){
        const p=keplerPosition(body,parent,Number(body.epoch||J2000)+i/segments*periodMs,null,radius);
        relative[i*3]=p[0];relative[i*3+1]=p[1];relative[i*3+2]=p[2];
      }
      entry={key,relative,world:new Float32Array(relative.length),center:null,ribbon:null,blend:null};
    }
    touch(this.entries,key,entry,this.limit);
    if(!entry.center || entry.center[0]!==center[0] || entry.center[1]!==center[1] || entry.center[2]!==center[2]){
      const {relative,world}=entry;
      for(let i=0;i<relative.length;i+=3){
        world[i]=relative[i]+center[0];
        world[i+1]=relative[i+1]+center[1];
        world[i+2]=relative[i+2]+center[2];
      }
      entry.center=[center[0],center[1],center[2]];
    }
    return entry;
  }
}
