/** Rolling display-frame rate measured from requestAnimationFrame timestamps.
 * Uses actual completed draws, not the simulated time-step or monitor refresh rate.
 */
export class FpsMeter {
  constructor(){this.reset();}

  reset(){
    this.times=[];
    this.head=0;
    this.last=NaN;
  }

  addFrame(now){
    if(!Number.isFinite(now))return;
    // After a background tab, a paused debugger or a clock discontinuity, do
    // not include the idle period as if it were slow active rendering.
    if(Number.isFinite(this.last) && (now<=this.last || now-this.last>3000))this.reset();
    this.times.push(now);
    this.last=now;
    while(this.head<this.times.length-1 && this.times[this.head]<now-60000)this.head++;
    // Amortized O(1) insertion and pruning; retain only ~60 seconds of frames.
    if(this.head>=1024 && this.head>=this.times.length/2){
      this.times=this.times.slice(this.head);
      this.head=0;
    }
  }

  read(){
    const times=this.times, end=times.length-1;
    if(end<=this.head)return {current:null,minute:null};
    const last=times[end];
    const minute=1000*(end-this.head)/(last-times[this.head]);
    // Binary-search the last second; do not traverse every frame on each read.
    let lo=this.head,hi=end,minimum=last-1000;
    while(lo<hi){const mid=(lo+hi)>>1;if(times[mid]<minimum)lo=mid+1;else hi=mid;}
    // At very low frame rates, use the last frame interval instead of --.
    const current=lo<end
      ? 1000*(end-lo)/(last-times[lo])
      : 1000/(last-times[end-1]);
    return {current,minute};
  }
}
