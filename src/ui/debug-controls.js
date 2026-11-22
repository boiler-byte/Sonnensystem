import {FpsMeter} from './fps-meter.js';

const TRIPLE_TAP_GAP_MS=700;
const TRIPLE_TAP_TOTAL_MS=1500;
const HUD_REFRESH_MS=500;
let controller=null;

function formatFps(value){return Number.isFinite(value)?value.toFixed(1):'–';}

/** Attach a hidden debug view to the date in Layer > Tempo. */
export function initDebugControls(doc=document,clickClock=()=>Date.now()){
  const get=id=>doc.getElementById(id);
  const dateButton=get('layer-debug-entry');
  const timeControls=get('layer-time-controls');
  const debugPanel=get('layer-debug-panel');
  const backButton=get('layer-debug-back');
  const fpsButton=get('layer-debug-fps');
  const hud=get('debug-fps-hud');
  const currentLabel=get('debug-fps-current');
  const minuteLabel=get('debug-fps-minute');
  const meter=new FpsMeter();
  const current={enabled:false,lastPaintAt:null,doc,meter,currentLabel,minuteLabel};
  controller=current;
  let taps=0,firstTapAt=-Infinity,lastTapAt=-Infinity;

  function showDebug(show){
    timeControls.hidden=show;
    debugPanel.hidden=!show;
    (show?fpsButton:dateButton).focus?.({preventScroll:true});
  }
  function resetReadout(){
    meter.reset();
    current.lastPaintAt=null;
    currentLabel.textContent='–';
    minuteLabel.textContent='–';
  }
  dateButton.addEventListener('click',()=>{
    const now=clickClock();
    if(now-lastTapAt>TRIPLE_TAP_GAP_MS || now-firstTapAt>TRIPLE_TAP_TOTAL_MS){
      taps=0;firstTapAt=now;
    }
    lastTapAt=now;
    if(++taps===3){
      taps=0;firstTapAt=-Infinity;lastTapAt=-Infinity;
      showDebug(true);
    }
  });
  backButton.addEventListener('click',()=>showDebug(false));
  fpsButton.addEventListener('click',()=>{
    current.enabled=!current.enabled;
    resetReadout();
    hud.hidden=!current.enabled;
    fpsButton.setAttribute('aria-pressed',String(current.enabled));
    fpsButton.title=current.enabled?'Bildrate oben links ausblenden':'Bildrate oben links einblenden';
  });
  doc.addEventListener('visibilitychange',()=>{
    // Restart the one-second and 60-second windows after backgrounding.
    if(doc.hidden)resetReadout();
  });
  return current;
}

/** Called exactly once after each successful WebGL draw; a no-op by default. */
export function recordRenderedFrame(now){
  const c=controller;
  if(!c?.enabled || c.doc.hidden)return;
  c.meter.addFrame(now);
  if(c.lastPaintAt!==null && now-c.lastPaintAt<HUD_REFRESH_MS)return;
  c.lastPaintAt=now;
  const fps=c.meter.read();
  c.currentLabel.textContent=formatFps(fps.current);
  c.minuteLabel.textContent=formatFps(fps.minute);
}
