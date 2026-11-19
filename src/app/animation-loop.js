import {$,S,renderer,mobileSheets} from './state.js';
import {updateTime} from './view-mode.js';

let lastTimeReadoutAt=0;
export function loop(now){
  const d=Math.min(.12,Math.max(0,(now-(loop.prev||now))/1000));loop.prev=now;
  // rAF is usually throttled in background tabs, but must not still draw a
  // heavyweight WebGL scene or advance the simulated clock while hidden.
  if(typeof document!=='undefined' && document.hidden){
    requestAnimationFrame(loop);
    return;
  }
  if(S.playing&&S.speed>0)S.time+=d*S.speed*86400000;
  try{
    renderer.visibleFocusOffset=mobileSheets?.focusOffsetFor(renderer.canvas)??0;
    renderer.draw(S.time,S.selected,S.settings);
  }
  catch(e){console.error('Renderfehler:',e);$('canvas-error').hidden=false;return;}
  if(now-lastTimeReadoutAt>=250){lastTimeReadoutAt=now;updateTime();}
  requestAnimationFrame(loop);
}
