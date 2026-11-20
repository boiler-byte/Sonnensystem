import {DAY} from './math.js';
import {galacticOffsetAt,galacticHistoryDays} from './galactic-motion.js';

// Recording begins on entry into the galactic mode. No position before entry
// is ever sampled, reconstructed or revealed by a wall-clock animation.
export const MAX_GALACTIC_TRAIL_SAMPLES = 240;
const EMPTY_TRAIL = new Float32Array(0);

export class GalacticTrailHistory {
  constructor(maxSamples=MAX_GALACTIC_TRAIL_SAMPLES){
    this.maxSamples=Math.max(2,Math.floor(maxSamples));
    this.trails=new Map();
    this.time=null;
    this.signature=null;
  }
  clear(){this.trails.clear();this.time=null;this.signature=null;}

  /** Accept only positions that the running simulation has actually reached. */
  record(body,timeMs,position,signature=''){
    const time=Number(timeMs);
    if(!body?.id || !Number.isFinite(time) || !position || position.length<3 ||
      !Number.isFinite(position[0]) || !Number.isFinite(position[1]) || !Number.isFinite(position[2]))return EMPTY_TRAIL;
    if(this.time!==null && (time<this.time || signature!==this.signature))this.clear();
    this.time=time;
    this.signature=signature;

    const id=body.id,historyDays=galacticHistoryDays(body);
    let trail=this.trails.get(id);
    if(!trail){
      trail={historyDays,samples:[{time,position:[...position]}],lastTime:time,buffer:EMPTY_TRAIL};
      this.trails.set(id,trail);
      return EMPTY_TRAIL;
    }
    if(time<trail.lastTime){
      this.trails.delete(id);
      return this.record(body,time,position,signature);
    }
    // Keep past samples sparse and bounded, but always render the newest point.
    // This grows even at low playback speeds without allocating on every frame.
    const samples=trail.samples,interval=historyDays*DAY/(this.maxSamples-1);
    if(time>trail.lastTime && time-samples[samples.length-1].time>=interval){
      samples.push({time,position:[...position]});
    }
    trail.lastTime=time;
    const oldest=time-historyDays*DAY;
    while(samples.length>1 && samples[0].time<oldest)samples.shift();
    while(samples.length>this.maxSamples)samples.shift();

    const includeCurrent=samples[samples.length-1].time<time;
    const count=samples.length+(includeCurrent?1:0);
    if(count<2)return EMPTY_TRAIL;
    const size=count*3;
    if(trail.buffer.length<size)trail.buffer=new Float32Array(Math.max(size,trail.buffer.length*2));
    for(let i=0;i<samples.length;i++){
      const sample=samples[i],offset=galacticOffsetAt(sample.time,time),index=i*3;
      trail.buffer[index]=sample.position[0]+offset[0];
      trail.buffer[index+1]=sample.position[1]+offset[1];
      trail.buffer[index+2]=sample.position[2]+offset[2];
    }
    if(includeCurrent){
      const index=samples.length*3;
      trail.buffer[index]=position[0];
      trail.buffer[index+1]=position[1];
      trail.buffer[index+2]=position[2];
    }
    return trail.buffer.subarray(0,size);
  }
}

/** Consistent with live Kepler positions, including JPL overrides, if present. */
export function recordedGalacticTrail(renderer,body){
  const history=renderer._galacticTrails??=new GalacticTrailHistory();
  const position=renderer.positions.get(body.id);
  const signature=`${Boolean(renderer.settings?.scaleOrbits)}|${renderer._sceneRevision||0}`;
  return history.record(body,renderer.simTime,position,signature);
}
