import {J2000} from '../data/bodies.js';
import {DAY} from './math.js';
import {keplerPosition} from '../data/orbital-math.js';

// Each active orbit keeps one trajectory, one movable world-space buffer and
// (on demand) one screen-space ribbon. Bounds include uploaded catalog entries.
export const MAX_CACHED_ORBITS = 256;

function geometryKey(body, radius, segments) {
  // Live data can replace a body OR update its orbital elements in-place.
  return [body.parentId,body.a,body.periodDays,body.epoch,body.M,body.e,
    body.i,body.node,body.peri,radius,segments].join('|');
}

export class OrbitGeometryCache {
  constructor(limit=MAX_CACHED_ORBITS) {
    this.limit=Math.max(1,Math.floor(limit));
    this.entries=new Map();
  }
  clear(){this.entries.clear();}
  get(body,parent,radius,segments,center) {
    const key=geometryKey(body,radius,segments);
    let entry=this.entries.get(body.id);
    if(!entry || entry.key!==key){
      const relative=new Float64Array((segments+1)*3);
      const periodMs=Number(body.periodDays)*DAY;
      for(let i=0;i<=segments;i++){
        const p=keplerPosition(body,parent,Number(body.epoch||J2000)+i/segments*periodMs,null,radius);
        relative[i*3]=p[0];relative[i*3+1]=p[1];relative[i*3+2]=p[2];
      }
      entry={key,relative,world:new Float32Array(relative.length),center:null,ribbon:null};
    }else this.entries.delete(body.id); // Move reused geometry to MRU position.
    this.entries.set(body.id,entry);
    while(this.entries.size>this.limit)this.entries.delete(this.entries.keys().next().value);
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
