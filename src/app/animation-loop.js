import {$,S,renderer,mobileSheets} from './state.js';
import {updateTime} from './view-mode.js';
import {effectiveSimulationSpeed} from '../ui/timeline.js';
import {updateRowInspectionHUD} from '../ui/row-inspection.js';

let lastTimeReadoutAt=0;
export function loop(now){
  const d=Math.min(.12,Math.max(0,(now-(loop.prev||now))/1000));loop.prev=now;
  // rAF is usually throttled in background tabs, but must not still draw a
  // heavyweight WebGL scene or advance the simulated clock while hidden.
  if(typeof document!=='undefined' && document.hidden){
    requestAnimationFrame(loop);
    return;
  }
  const simulationSpeed=effectiveSimulationSpeed(S);
  if(S.playing&&simulationSpeed>0)S.time+=d*simulationSpeed*86400000;
  try{
    renderer.visibleFocusOffset=mobileSheets?.focusOffsetFor(renderer.canvas)??0;
    renderer.draw(S.time,S.selected,S.settings);
    const fade=$('cinema-scene-fade');
    if(fade){
      const visible=renderer.cinema?.active===true;
      fade.hidden=!visible;
      fade.style.opacity=String(renderer.cinema?.fadeOpacity ?? 0);
    }
    updateRowInspectionHUD(renderer,now);
  }
  catch(e){console.error('Renderfehler:',e);$('canvas-error').hidden=false;return;}
  if(now-lastTimeReadoutAt>=250){lastTimeReadoutAt=now;updateTime();}
  requestAnimationFrame(loop);
}
