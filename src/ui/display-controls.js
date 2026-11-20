import {$,S,renderer} from '../app/state.js';
import {displayPreset} from '../data/layers.js';
import {activeView,updateDetail} from './catalog-controller.js';
import {syncLayers} from './layer-panel.js';
import {syncToggleState} from './control-state.js';
import {refreshRowCameraFrame} from '../app/animation-controls.js';

export const SOLAR_ORBIT_DISPLAY_MODES = Object.freeze(['normal','contrast','galactic','off']);
export const PLANET_ORBIT_DISPLAY_MODES = Object.freeze(['normal','contrast','off']);
export const orbitDisplayModes = (view='solar') => view==='solar' ? SOLAR_ORBIT_DISPLAY_MODES : PLANET_ORBIT_DISPLAY_MODES;

export function orbitDisplayMode(settings, view=null){
  view ??= activeView?.() ?? 'solar';
  if(settings?.orbits===false)return 'off';
  if(view==='solar' && settings?.galacticMotion===true)return 'galactic';
  return settings?.orbitContrast===true?'contrast':'normal';
}
export function nextOrbitDisplayMode(settings, view=null){
  view ??= activeView?.() ?? 'solar';
  const modes=orbitDisplayModes(view), current=orbitDisplayMode(settings,view);
  return modes[(modes.indexOf(current)+1)%modes.length];
}
export function advanceOrbitDisplayMode(settings, view=null){
  view ??= activeView?.() ?? 'solar';
  const next=nextOrbitDisplayMode(settings,view);
  settings.orbits=next!=='off';
  settings.orbitContrast=next==='contrast';
  settings.galacticMotion=view==='solar' && next==='galactic';
  return next;
}
export function syncOrbitControls(){
  const view=activeView();
  const mode=orbitDisplayMode(S.settings,view),button=$('orbit-visibility-btn');
  const names={normal:'Umlaufbahn',contrast:'Umlaufbahn + Bahnkontrast',galactic:'Galaktische Bewegung',off:'Beides aus'};
  const next=nextOrbitDisplayMode(S.settings,view);
  const status=mode==='off'?'Umlaufbahn und Bahnkontrast: Aus':`${names[mode]}: An`;
  syncToggleState(button,mode!=='off',`${status} (Nächster Modus: ${names[next]})`);
  button.setAttribute('data-orbit-mode',mode);
  button.setAttribute('aria-label',`${status}. Nächster Modus: ${names[next]}`);
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
  syncLabelControl();syncLightingControl();syncFourMoonsControl();syncOrbitControls();
  syncLayers();updateDetail();
}
