import {$,S,renderer,mobileSheets} from './state.js';
import {updateTime} from './view-mode.js';
import {effectiveSimulationSpeed} from '../ui/timeline.js';
import {updateRowInspectionHUD} from '../ui/row-inspection.js';
import {rendererSelectionId} from '../data/probe-location.js';
import {byId} from './state.js';
import {refreshProbeDistance} from '../ui/object-details.js';
import {recordRenderedFrame} from '../ui/debug-controls.js';
import {FpsMeter} from '../ui/fps-meter.js';
import {galacticTrailUsesExtendedHistory} from '../renderer/galactic-trails.js';

let lastTimeReadoutAt=0;
// Always measure rendered FPS, even when the optional Debug FPS HUD is off.
const galacticFrameRate=new FpsMeter();
export function loop(now){
  const d=Math.min(.12,Math.max(0,(now-(loop.prev||now))/1000));loop.prev=now;
  // rAF is usually throttled in background tabs, but must not still draw a
  // heavyweight WebGL scene or advance the simulated clock while hidden.
  if(typeof document!=='undefined' && document.hidden){
    galacticFrameRate.reset();
    requestAnimationFrame(loop);
    return;
  }
  const simulationSpeed=effectiveSimulationSpeed(S);
  if(S.playing&&simulationSpeed>0)S.time+=d*simulationSpeed*86400000;
  try{
    renderer.visibleFocusOffset=mobileSheets?.focusOffsetFor(renderer.canvas)??0;
    renderer.setSimulationPaused?.(!S.playing);
    // Wait for at least one second of rendered frames before using the FPS
    // threshold. The rendering budget remains at 1,000 trail points in all modes.
    const elapsed=galacticFrameRate.last-galacticFrameRate.times[galacticFrameRate.head];
    renderer.galacticTrailExtendedHistory=galacticTrailUsesExtendedHistory(
      elapsed>=1000 ? galacticFrameRate.read().current : null);
    renderer.draw(S.time,rendererSelectionId(byId(S.selected),byId),S.settings);
    galacticFrameRate.addFrame(now);
    recordRenderedFrame(now);
    const fade=$('cinema-scene-fade');
    if(fade){
      const visible=renderer.cinema?.active===true;
      fade.hidden=!visible;
      fade.style.opacity=String(renderer.cinema?.fadeOpacity ?? 0);
    }
    updateRowInspectionHUD(renderer,now);
  }
  catch(e){console.error('Renderfehler:',e);$('canvas-error').hidden=false;return;}
  if(now-lastTimeReadoutAt>=250){lastTimeReadoutAt=now;updateTime();refreshProbeDistance(S);}
  requestAnimationFrame(loop);
}
