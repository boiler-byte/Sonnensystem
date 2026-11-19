import {$,S,renderer} from '../app/state.js';
import {displayPreset} from '../data/layers.js';
import {activeView,updateDetail} from './catalog-controller.js';
import {syncLayers} from './layer-panel.js';
import {syncToggleState} from './control-state.js';
import {refreshRowCameraFrame} from '../app/animation-controls.js';

// Three distinct UI modes share the existing orbit and contrast renderer flags.
export const ORBIT_DISPLAY_MODES = Object.freeze(['normal','contrast','off']);
export function orbitDisplayMode(settings){
  if(settings?.orbits===false)return 'off';
  return settings?.orbitContrast===true?'contrast':'normal';
}
export function advanceOrbitDisplayMode(settings){
  const current=orbitDisplayMode(settings);
  const next=ORBIT_DISPLAY_MODES[(ORBIT_DISPLAY_MODES.indexOf(current)+1)%ORBIT_DISPLAY_MODES.length];
  settings.orbits=next!=='off';
  settings.orbitContrast=next==='contrast';
  return next;
}
export function syncOrbitControls(){
  const mode=orbitDisplayMode(S.settings),button=$('orbit-visibility-btn');
  const names={normal:'Umlaufbahn',contrast:'Umlaufbahn + Bahnkontrast',off:'Beides aus'};
  const next=ORBIT_DISPLAY_MODES[(ORBIT_DISPLAY_MODES.indexOf(mode)+1)%ORBIT_DISPLAY_MODES.length];
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
  // The on/off switch controls realistic lighting; optimized remains the default when off.
  const realistic=S.settings.lighting==='realistic',button=$('toggle-lighting');
  syncToggleState(button,realistic,`Beleuchtung: ${realistic?'An (Realistisch)':'Aus (Optimiert)'} (zum Wechseln klicken)`);
}

export function syncFourMoonsControl(){
  // Internally fourMoons still means a cap. UI is inverted: OFF = four,
  // ON = all natural moons, preserving prior default scene content.
  const showAll=S.settings.fourMoons===false,button=$('toggle-four-moons');
  syncToggleState(button,showAll,showAll
    ? 'Alle Monde: An (ohne Vierer-Begrenzung)'
    : 'Alle Monde: Aus (maximal vier Monde je Planet)');
}

export function changeLayers(next){
  if(next===S.settings.layers)return;
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.settings.row)renderer?.beginTransition?.('row');
  S.settings.layers=next; // Presets affect only the current scene, not the other view.
  refreshRowCameraFrame();
  syncLayers();updateDetail(); // Catalog entries and selection remain layer-independent.
}
export function applyDisplayPreset(name){
  // Only the current scene's five presentation controls are affected.
  Object.assign(S.settings,displayPreset(name,activeView()));
  if(renderer){
    renderer._labelState=null;
    refreshRowCameraFrame();
  }
  syncLabelControl();syncLightingControl();syncFourMoonsControl();syncOrbitControls();
  syncLayers();updateDetail();
}
