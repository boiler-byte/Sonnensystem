import {$,S,renderer} from '../app/state.js';
import {displayPreset} from '../data/layers.js';
import {activeView,updateDetail} from './catalog-controller.js';
import {syncLayers} from './layer-panel.js';
import {syncToggleState} from './control-state.js';
import {refreshRowCameraFrame} from '../app/animation-controls.js';

// Contrast is an independent style toggle; the orbit mode only selects which
// paths (ordinary/galactic/off) are visible. The two flags may coexist.
export const SOLAR_ORBIT_DISPLAY_MODES = Object.freeze(['normal','galactic','off']);
export const PLANET_ORBIT_DISPLAY_MODES = Object.freeze(['normal','off']);
export const orbitDisplayModes = (view='solar') => view==='solar' ? SOLAR_ORBIT_DISPLAY_MODES : PLANET_ORBIT_DISPLAY_MODES;

export function orbitDisplayMode(settings, view=null){
  view ??= activeView?.() ?? 'solar';
  if(settings?.orbits===false)return 'off';
  if(view==='solar' && settings?.galacticMotion===true)return 'galactic';
  return 'normal';
}
export function nextOrbitDisplayMode(settings, view=null){
  view ??= activeView?.() ?? 'solar';
  const modes=orbitDisplayModes(view),current=orbitDisplayMode(settings,view);
  return modes[(modes.indexOf(current)+1)%modes.length];
}
export function advanceOrbitDisplayMode(settings, view=null){
  view ??= activeView?.() ?? 'solar';
  const next=nextOrbitDisplayMode(settings,view);
  settings.orbits=next!=='off';
  settings.galacticMotion=view==='solar' && next==='galactic';
  // Deliberately preserve settings.orbitContrast across all mode transitions.
  return next;
}
export function syncOrbitControls(){
  const view=activeView();
  const mode=orbitDisplayMode(S.settings,view),button=$('orbit-visibility-btn');
  const names={normal:'Umlaufbahn',galactic:'Galaktische Bewegung',off:'Aus'};
  const next=nextOrbitDisplayMode(S.settings,view);
  const status=mode==='off'?'Umlaufbahn und galaktische Bewegung: Aus':`${names[mode]}: An`;
  syncToggleState(button,mode!=='off',`${status} (Nächster Modus: ${names[next]})`);
  button.setAttribute('data-orbit-mode',mode);
  button.setAttribute('aria-label',`${status}. Nächster Modus: ${names[next]}`);
}
export function syncContrastControl(){
  const enabled=S.settings.orbitContrast===true,button=$('orbit-contrast-btn');
  const label=`Bahnkontrast: ${enabled?'An':'Aus'} (für Umlaufbahnen und galaktische Bewegung)`;
  syncToggleState(button,enabled,label);
  button.setAttribute('aria-label',label);
}

export function syncLabelControl(){
  const mode=S.settings.labels==='points'?'points':S.settings.labels===false?'off':'labels';
  const name={labels:'An',points:'Planetenpunkt',off:'Aus'}[mode];
  const next={labels:'Planetenpunkt',points:'Aus',off:'An'}[mode];
  const button=$('toggle-labels');
  syncToggleState(button,mode!=='off',`Beschriftung: ${name} (nächster Modus: ${next})`);
  button.setAttribute('data-label-mode',mode);
  button.setAttribute('aria-label',`Beschriftung: ${name}. Nächster Modus: ${next}`);
}

export function syncLightingControl(){
  const realistic=S.settings.lighting==='realistic',button=$('toggle-lighting');
  syncToggleState(button,realistic,`Beleuchtung: ${realistic?'An (Realistisch)':'Aus (Optimiert)'} (zum Wechseln klicken)`);
}

export function syncFourMoonsControl(){
  const showAll=S.settings.fourMoons===false,button=$('toggle-four-moons');
  syncToggleState(button,showAll,showAll
    ? 'Alle Monde: An (ohne Vierer-Begrenzung)'
    : 'Alle Monde: Aus (maximal vier Monde je Planet)');
}

export function changeLayers(next){
  if(next===S.settings.layers)return;
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.settings.row)renderer?.beginTransition?.('row');
  S.settings.layers=next;
  refreshRowCameraFrame();
  syncLayers();updateDetail();
}
export function applyDisplayPreset(name){
  const view=activeView();
  const nextPreset=displayPreset(name,view);
  // Presets restore their saved orbit style without bringing back an old morph.
  Object.assign(S.settings,nextPreset);
  if(renderer){
    renderer._labelState=null;
    refreshRowCameraFrame();
  }
  syncLabelControl();syncLightingControl();syncFourMoonsControl();syncOrbitControls();syncContrastControl();
  syncLayers();updateDetail();
}
