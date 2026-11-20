/** Rendering-only light pulses along the Sun's already recorded galactic path.
 * The history, simulated clock and physical positions are never modified.
 */
export const SUN_TRAIL_FLOW_CYCLE_SECONDS = 6;
export const SUN_TRAIL_FLOW_PULSES = 3;
export const SUN_TRAIL_PULSE_LENGTH = 0.075;

/** Advance while the simulation advances; pause, rewind and resume are stable. */
export class SunTrailFlowClock {
  constructor(){this.phase=0;this.lastFrameAt=null;this.lastSimTime=null;}
  advance(frameAtMs,simTimeMs,reducedMotion=false){
    const now=Number(frameAtMs),time=Number(simTimeMs);
    if(!Number.isFinite(now)||!Number.isFinite(time))return this.phase;
    const dt=this.lastFrameAt===null?0:Math.max(0,Math.min(120,now-this.lastFrameAt));
    if(this.lastSimTime!==null){
      if(time<this.lastSimTime)this.phase=0;
      else if(time>this.lastSimTime&&!reducedMotion){
        this.phase=(this.phase+dt/(1000*SUN_TRAIL_FLOW_CYCLE_SECONDS))%1;
      }
    }
    this.lastFrameAt=now;
    this.lastSimTime=time;
    return this.phase;
  }
  reset(){this.phase=0;this.lastFrameAt=null;this.lastSimTime=null;}
}

/** Returns 3D ribbons sampled at equal arc-length intervals, not sample indices.
 * Points are ordered oldest -> current Sun. The light moves current -> oldest.
 */
export function sunTrailFlowSegments(points,phase,{pulses=SUN_TRAIL_FLOW_PULSES,length=SUN_TRAIL_PULSE_LENGTH,steps=12}={}){
  if(!points || points.length<6 || points.length%3!==0 || !Number.isFinite(phase) ||
     !Number.isInteger(pulses)||pulses<1 || !Number.isFinite(length)||length<=0 ||
     !Number.isInteger(steps)||steps<2)return [];
  const count=points.length/3,cumulative=new Float64Array(count);
  for(let i=1;i<count;i++){
    const k=i*3,prev=k-3;
    const distance=Math.hypot(points[k]-points[prev],points[k+1]-points[prev+1],points[k+2]-points[prev+2]);
    if(!Number.isFinite(distance))return [];
    cumulative[i]=cumulative[i-1]+distance;
  }
  const total=cumulative[count-1];
  if(!Number.isFinite(total)||total<1e-8)return [];
  const output=[];
  const wrapped=((phase%1)+1)%1;
  for(let pulse=0;pulse<pulses;pulse++){
    const head=1-((wrapped+pulse/pulses)%1);
    const end=Math.min(1,head+length);
    if(end-head<1e-5)continue;
    const segment=new Float32Array(steps*3);
    for(let step=0;step<steps;step++){
      const distance=(head+(end-head)*step/(steps-1))*total;
      // A binary search ensures equal-speed movement even with sparse samples.
      let lo=0,hi=count-1;
      while(lo+1<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<distance)lo=mid;else hi=mid;}
      const span=cumulative[hi]-cumulative[lo];
      const t=span>1e-10?Math.max(0,Math.min(1,(distance-cumulative[lo])/span)):0;
      for(let axis=0;axis<3;axis++){
        segment[step*3+axis]=points[lo*3+axis]*(1-t)+points[hi*3+axis]*t;
      }
    }
    output.push(segment);
  }
  return output;
}
