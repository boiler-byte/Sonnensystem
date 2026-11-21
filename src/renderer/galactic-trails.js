import {DAY} from './math.js';
import {layerEnabled} from '../data/layers.js';
import {galacticOffsetAt,galacticHistoryDays} from './galactic-motion.js';

// Record each distinct simulated position (not only bends above a threshold).
// Preserve the newest fifth of the points when the budget fills up. Older
// sections alone may be reduced against the visible, galactic flight path.
export const MAX_GALACTIC_TRAIL_SAMPLES = 1000;
const EMPTY_TRAIL = new Float32Array(0);
const WORLD_BEND_TOLERANCE = 0.012;
const SCREEN_BEND_TOLERANCE_PX = 0.75;
const positionAt = (time, position) => {
  const drift=galacticOffsetAt(time,0);
  return position.map((v,i)=>v+drift[i]);
};
const makeSample = (time,position) => ({
  time,position,flight:positionAt(time,position),error:0
});

function deviationSquared(a,b,c,axes=3){
  const dx=c[0]-a[0],dy=c[1]-a[1],dz=axes===3?(c[2]??0)-(a[2]??0):0;
  const lengthSquared=dx*dx+dy*dy+dz*dz;
  if(lengthSquared<1e-20)return (b[0]-a[0])**2+(b[1]-a[1])**2+(axes===3?((b[2]??0)-(a[2]??0))**2:0);
  const bx=b[0]-a[0],by=b[1]-a[1],bz=axes===3?(b[2]??0)-(a[2]??0):0;
  const t=Math.max(0,Math.min(1,(bx*dx+by*dy+bz*dz)/lengthSquared));
  return (bx-t*dx)**2+(by-t*dy)**2+(bz-t*dz)**2;
}

/** Project a stored point into the actual current frame, in CSS-like pixels. */
function projectPoint(sample,view,frameOffset,target=null,index=0){
  if(!view?.vp || !(view.width>0) || !(view.height>0))return null;
  const {vp,width,height}=view;
  const x=sample.flight[0]-frameOffset[0];
  const y=sample.flight[1]-frameOffset[1];
  const z=sample.flight[2]-frameOffset[2];
  const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
  if(!Number.isFinite(w)||w<=0.01)return null;
  const cx=vp[0]*x+vp[4]*y+vp[8]*z+vp[12];
  const cy=vp[1]*x+vp[5]*y+vp[9]*z+vp[13];
  const cz=vp[2]*x+vp[6]*y+vp[10]*z+vp[14];
  if(cz < -w || cz > w)return null;
  const px=(cx/w)*width*.5,py=(cy/w)*height*.5;
  // Conservative pixel-per-world-unit factor for the accumulated error bound.
  const scale=Math.max(Math.hypot(vp[0],vp[4],vp[8])*width,
    Math.hypot(vp[1],vp[5],vp[9])*height)*.5/w;
  if(target){target[index]=px;target[index+1]=py;target[index+2]=scale;return true;}
  return [px,py,scale];
}

const interpolate=(a,b,time)=>{
  const ratio=Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time||1)));
  return makeSample(time,a.position.map((v,i)=>v+(b.position[i]-v)*ratio));
};

export class GalacticTrailHistory {
  constructor(maxSamples=MAX_GALACTIC_TRAIL_SAMPLES){
    this.maxSamples=Math.max(2,Math.floor(maxSamples));
    this.trails=new Map();
    this.time=null;
    this.signature=null;
  }
  clear(){this.trails.clear();this.time=null;this.signature=null;}
  /** Invisible bodies have neither a displayed trace nor retained history. */
  retainVisible(ids){
    for(const id of this.trails.keys())if(!ids.has(id))this.trails.delete(id);
  }
  remove(id){this.trails.delete(id);}
  /**
   * Evict the vertex that alters the *complete* line the least. Each segment
   * carries an upper error bound for points previously omitted from it, so
   * repeated thinning cannot silently accumulate new straight-line shortcuts.
   * Where available, screen-space error favors removing subpixel details.
   * `olderOnly` protects the most recently recorded fifth of the trail,
   * preventing speed changes from creating new straight segments behind a body.
   */
  simplify(samples,view=null,time=samples.at(-1)?.time??0,olderOnly=false){
    if(samples.length<3)return false;
    // At least one old vertex must stay removable even with tiny test budgets.
    // The first point and all recent points remain untouched by budget pruning.
    const recent=olderOnly?Math.min(samples.length-3,Math.max(2,Math.floor(this.maxSamples*.20))):0;
    const lastCandidate=samples.length-2-recent;
    const frameOffset=view?.vp?galacticOffsetAt(time,0):null;
    // Only project the old candidate region and its right-hand neighbor.
    // Recent protected points need no CPU projection during compression.
    const screen=frameOffset?(this._projectionBuffer??=new Float64Array(this.maxSamples*3)):null;
    if(screen){
      for(let i=0;i<=lastCandidate+1;i++){
        if(!projectPoint(samples[i],view,frameOffset,screen,i*3))screen[i*3]=NaN;
      }
    }
    let best=1,bestScore=Infinity,bestError=0;
    for(let i=1;i<=lastCandidate;i++){
      const a=samples[i-1],b=samples[i],c=samples[i+1];
      const bend=Math.sqrt(deviationSquared(a.flight,b.flight,c.flight));
      // Both adjoining segments can contain older discarded samples. Their
      // error bound must survive when the segments are joined into one.
      const lost=Math.max(b.error||0,c.error||0);
      const bound=bend+lost;
      let score=bound/WORLD_BEND_TOLERANCE;
      if(screen && Number.isFinite(screen[(i-1)*3]) &&
        Number.isFinite(screen[i*3]) && Number.isFinite(screen[(i+1)*3])){
        const ax=screen[(i-1)*3],ay=screen[(i-1)*3+1];
        const bx=screen[i*3],by=screen[i*3+1];
        const cx=screen[(i+1)*3],cy=screen[(i+1)*3+1];
        const dx=cx-ax,dy=cy-ay,lengthSq=dx*dx+dy*dy;
        const t=lengthSq<1e-20?0:Math.max(0,Math.min(1,((bx-ax)*dx+(by-ay)*dy)/lengthSq));
        const pixelBend=Math.hypot(bx-ax-t*dx,by-ay-t*dy);
        const pxPerUnit=Math.max(screen[(i-1)*3+2],screen[i*3+2],screen[(i+1)*3+2]);
        const pixelBound=pixelBend+lost*pxPerUnit;
        // Screen significance dominates when zoomed in; the world-space
        // floor still protects detail when the camera moves later.
        score=Math.max(score,pixelBound/SCREEN_BEND_TOLERANCE_PX);
      }
      // Prefer retaining newly drawn curvature when errors are very similar.
      score*=1+0.06*(i/samples.length)**4;
      if(score<bestScore){bestScore=score;best=i;bestError=bound;}
    }
    samples[best+1].error=bestError;
    samples.splice(best,1);
    return true;
  }
  /** Only move the oldest point after the requested history duration expires. */
  trimToWindow(samples,time,historyDays,current){
    const start=time-historyDays*DAY;
    if(samples[0].time>=start)return;
    while(samples.length>1&&samples[1].time<=start)samples.shift();
    const next=samples[1]??current;
    samples[0]=interpolate(samples[0],next,start);
  }
  /** Accept only positions that the running simulation has reached. */
  record(body,timeMs,position,signature='',view=null){
    const time=Number(timeMs);
    if(!body?.id || !Number.isFinite(time) || !position || position.length<3 ||
      ![position[0],position[1],position[2]].every(Number.isFinite))return EMPTY_TRAIL;
    if(this.time!==null&&(time<this.time||signature!==this.signature))this.clear();
    this.time=time;this.signature=signature;
    let trail=this.trails.get(body.id);
    if(trail&&time===trail.lastTime&&trail.lastSeen.position.every((v,i)=>v===position[i]))
      return trail.output??EMPTY_TRAIL; // Paused/unchanged frame: no CPU reconstruction.
    const current=makeSample(time,[position[0],position[1],position[2]]);
    if(!trail){
      trail={historyDays:galacticHistoryDays(body),samples:[current],lastSeen:current,
        lastTime:time,buffer:EMPTY_TRAIL,output:EMPTY_TRAIL};
      this.trails.set(body.id,trail);
      return EMPTY_TRAIL;
    }
    if(time<trail.lastTime){
      this.remove(body.id);
      return this.record(body,time,position,signature,view);
    }
    const samples=trail.samples;
    if(time===trail.lastTime){
      trail.lastSeen=current;
      if(samples[samples.length-1].time===time)samples[samples.length-1]=current;
    }
    if(time>trail.lastTime){
      // The previous live endpoint becomes a fixed vertex at EVERY new
      // simulation instant, however small the movement. An outer planet or a
      // just-slowed simulation must not be connected by a growing long chord.
      // The Sun is precisely linear and needs only its origin and live end.
      const previous=trail.lastSeen;
      if(body.id!=='sun'&&body.type!=='star'&&previous.time>samples.at(-1).time)
        samples.push(previous);
      trail.lastSeen=current;
      trail.lastTime=time;
      this.trimToWindow(samples,time,trail.historyDays,current);
      // Reserve one slot for the live end. Keep the latest fifth intact;
      // only older segments are candidates for geometry-based reduction.
      // The first endpoint is trimmed exclusively by the history duration.
      while(samples.length>=this.maxSamples){
        if(samples.length===2)samples.pop();
        else this.simplify(samples,view,time,true);
      }
    }
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
    trail.output=trail.buffer.subarray(0,size);
    return trail.output;
  }
}

/** Match recording eligibility to the objects that are actually drawn. */
export function recordedGalacticTrail(renderer,body,vp=null){
  const history=renderer._galacticTrails??=new GalacticTrailHistory();
  if(!layerEnabled(renderer.settings?.layers,body.type) ||
     (typeof renderer.shouldDraw==='function'&&!renderer.shouldDraw(body))){
    history.remove(body.id);
    return EMPTY_TRAIL;
  }
  const position=renderer.positions.get(body.id);
  const signature=`${Boolean(renderer.settings?.scaleOrbits)}|${renderer._sceneRevision||0}`;
  return history.record(body,renderer.simTime,position,signature,
    vp?{vp,width:renderer.width,height:renderer.height}:null);
}
