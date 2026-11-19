import {$,S,renderer,byId} from './state.js';
import {cinemaClock} from '../renderer/cinema.js';
import {notifyToggle} from '../ui/status.js';
import {syncToggleState} from '../ui/control-state.js';

export function syncScaleControls(){
  for(const [id,key,label] of [['scale-objects-btn','scaleObjects','Objektgrößen'],['scale-orbits-btn','scaleOrbits','Bahnabstände']]){
    const button=$(id),enabled=S.settings[key]===true;
    syncToggleState(button,enabled,`${label}: ${enabled?'maßstabsgetreu':'schematisch'}`);
  }
}
export function updateScale(setting){
  if(renderer?.cinema?.active)renderer.stopCinema();
  // In the isolated planet view, collapsing physical orbit spacing should
  // sweep smoothly from the inner orbits outwards, without spring overshoot.
  const planetOrbitCollapse=setting==='scaleOrbits' && S.settings.scaleOrbits===true
    && Boolean(renderer?.planetId) && S.settings.row!==true;
  renderer?.beginTransition?.(planetOrbitCollapse?'planet-orbits-off':'scale');
  const next=!S.settings[setting];
  // Both scene modes share the same independent scale toggles.
  S.viewSettings.solar[setting]=next;
  S.viewSettings.planet[setting]=next;
  syncScaleControls();syncCinemaControl();
  const optimized=S.settings.scaleObjects && !S.settings.scaleOrbits && !renderer?.planetId;
  notifyToggle(optimized ? 'Maßstab: Optimierte Größenverhältnisse'
    : `${setting==='scaleObjects'?'Objekt':'Bahn'}: ${next?'Maßstabsgetreu':'Schematisch'}`);
  if(renderer){
    renderer._labelState=null;
    renderer.calcPositions(S.time);
    // A scale change always returns home, including after manual pan/zoom,
    // object focus or follow. The existing scale transition animates this move.
    renderer.resetViewCamera();
  }
}
/** Re-evaluate the row after catalog/layer changes without changing focus mode. */
export function refreshRowCameraFrame(){
  if(!S.settings.row || !renderer)return false;
  renderer.calcPositions(S.time);
  renderer.camera.desiredTarget=renderer.rowFrame().target;
  renderer.camera.desiredDist=renderer.rowDistance();
  return true;
}
export function syncRowControl(){
  const enabled=S.settings.row===true,button=$('orbit-row-btn');
  const order=enabled&&S.settings.rowOrder==='distance'?'distance':enabled?'size':'off';
  const title=order==='off'?'Reihe: Aus – Umlaufbahnen'
    :order==='distance'?'Reihe: Nach Entfernung (nah nach fern)'
    :'Reihe: Nach Größe (groß nach klein)';
  syncToggleState(button,enabled,title);
  button.setAttribute('data-row-mode',order);
  button.setAttribute('aria-label',`${title}. Nächster Modus: ${order==='off'?'Größe':order==='size'?'Entfernung':'Aus'}`);
}
export function updateRow(){
  if(renderer?.cinema?.active)renderer.stopCinema();
  renderer?.beginTransition?.('row');
  const wasEnabled=S.settings.row===true;
  const wasOrder=S.settings.rowOrder==='distance'?'distance':'size';
  const enabled=!wasEnabled || wasOrder==='size';
  const order=!wasEnabled?'size':wasOrder==='size'?'distance':'size';
  // Entry to the lineup always starts with true physical object proportions.
  // Both scenes share these scale toggles; leaving the row retains the chosen scale.
  if(enabled && !wasEnabled && !S.settings.scaleObjects){
    S.viewSettings.solar.scaleObjects=true;
    S.viewSettings.planet.scaleObjects=true;
    syncScaleControls();
  }
  S.settings.row=enabled;
  S.settings.rowOrder=order;
  syncRowControl();syncCinemaControl();
  notifyToggle(`Reihe: ${!enabled?'Aus (Umlaufbahnen)':order==='distance'?'Nach Entfernung (nah nach fern)':'Nach Größe (groß nach klein)'}`);
  if(!renderer)return;
  renderer._labelState=null;
  if(enabled && !wasEnabled){
    renderer._rowPreviousAngles=[renderer.camera.theta,renderer.camera.phi];
    renderer.setCameraAngles?.(0,1.5);
    renderer.cameraPresetIndex=2;
    renderer.cameraManuallyMoved=false;
  }else if(!enabled){
    const previous=renderer._rowPreviousAngles||[.63,renderer.planetId?.84:.99];
    renderer.setCameraAngles?.(...previous);
    renderer.cameraPresetIndex=0;
    renderer.cameraManuallyMoved=false;
  }
  renderer.callbacks?.onCameraChange?.();
  renderer.calcPositions(S.time);
  if(!renderer.followEnabled && !renderer.focusedBodyId){
    renderer.camera.desiredTarget=enabled?renderer.rowFrame().target:[0,0,0];
    renderer.camera.desiredDist=enabled?renderer.rowDistance()
      : renderer.planetId?renderer.planetFrameDistance():renderer.solarOverviewDistance();
  }else if(renderer.focusedBodyId)renderer.focus(renderer.focusedBodyId);
  if(renderer.followEnabled)renderer.followSelectedBody();
}
/** Cinema is available for the physical-size lineup without scaled orbits. */
export function syncCinemaControl(){
  const available=Boolean(renderer && S.settings.row && S.settings.scaleObjects && !S.settings.scaleOrbits);
  const active=Boolean(renderer?.cinema?.active);
  const button=$('cinema-btn');
  button.hidden=!available;
  syncToggleState(button,active,active
    ? 'Cinema stoppen und zur Ausgangsansicht zurückkehren'
    : S.settings.rowOrder==='distance'?'Cinema-Modus starten: von links nach rechts':'Cinema-Modus starten: von klein nach groß');
  button.setAttribute('aria-label',active?'Cinema-Kamerafahrt stoppen':'Cinema-Kamerafahrt starten');
  $('view-mode-status').classList.toggle('cinema-available',available);
  $('cinema-timeline').hidden=!active;
  const playback=$('cinema-play-pause'),paused=active && renderer?.cinema?.paused===true;
  playback.disabled=!active;
  playback.classList.toggle('is-paused',paused);
  playback.setAttribute('aria-pressed',String(paused));
  playback.setAttribute('aria-label',paused?'Cinema fortsetzen':'Cinema pausieren');
  playback.title=paused?'Cinema fortsetzen':'Cinema pausieren';
  const speed=$('cinema-speed-toggle'),doubleSpeed=active && renderer?.cinema?.speed===2;
  speed.disabled=!active;
  speed.classList.toggle('active',doubleSpeed);
  speed.setAttribute('aria-pressed',String(doubleSpeed));
  speed.setAttribute('aria-label',doubleSpeed?'Cinema mit normaler Geschwindigkeit abspielen':'Cinema mit doppelter Geschwindigkeit abspielen');
  speed.title=doubleSpeed?'Cinema 1x':'Cinema 2x';
  $('cinema-start-label').textContent=S.settings.rowOrder==='distance'?'Nah':'Klein';
  $('cinema-end-label').textContent=S.settings.rowOrder==='distance'?'Fern':'Groß';
  if(!active)$('cinema-seek').value='0';
}
export function updateCinemaTimeline({active,progress=0,durationMs=0,objectId=null}){
  syncCinemaControl();
  if(!active)return;
  const seek=$('cinema-seek');
  if(!renderer?.cinema?.seeking)seek.value=String(Math.round(progress*1000));
  seek.setAttribute('aria-valuetext',`${Math.round(progress*100)} Prozent${objectId?', '+(byId(objectId)?.name||objectId):''}`);
  $('cinema-time').textContent=`${cinemaClock(durationMs*progress)} / ${cinemaClock(durationMs)}`;
  $('cinema-object').textContent=objectId?`Cinema · ${byId(objectId)?.name||objectId}`:'Cinema-Modus';
}
