/** Limit visible orbital and surface turns without changing the simulation clock. */
export const MAX_VISIBLE_TURNS_PER_SECOND = 5;
export const DAY_MS = 86400000;

/** Independent clocks for each object and type of rotation. */
export class VisualAngularClocks {
  constructor(){this.entries=new Map();this.frameAt=null;this.frameSeconds=0;}
  beginFrame(nowMs){
    const now=Number(nowMs);
    this.frameSeconds=Number.isFinite(now)&&Number.isFinite(this.frameAt)
      ?Math.max(0,(now-this.frameAt)/1000):0;
    if(Number.isFinite(now))this.frameAt=now;
  }
  sample(id,kind,simulationTimeMs,periodMs){
    if(!Number.isFinite(simulationTimeMs)||!Number.isFinite(periodMs)||periodMs<=0)return simulationTimeMs;
    const key=`${kind}:${id}`,old=this.entries.get(key);
    if(!old){this.entries.set(key,{sim:simulationTimeMs,visual:simulationTimeMs});return simulationTimeMs;}
    if(old.sim===simulationTimeMs)return old.visual;
    const maximum=MAX_VISIBLE_TURNS_PER_SECOND*periodMs*this.frameSeconds;
    const requested=simulationTimeMs-old.sim;
    const bounded=Math.max(-maximum,Math.min(maximum,requested));
    const visual=old.visual+bounded;
    this.entries.set(key,{sim:simulationTimeMs,visual});
    return visual;
  }
  reset(){this.entries.clear();this.frameAt=null;this.frameSeconds=0;}
}
