import {$,S,renderer} from '../app/state.js';
import {displayPreset} from '../data/layers.js';
import {activeView,updateDetail} from './catalog-controller.js';
import {syncLayers} from './layer-panel.js';
import {syncToggleState} from './control-state.js';
import {refreshRowCameraFrame} from '../app/animation-controls.js';

export function syncOrbitControls(){
  for(const [id,setting] of [['orbit-visibility-btn','orbits'],['orbit-contrast-btn','orbitContrast']]){
    const enabled=S.settings[setting]!==false,button=$(id);
    const label={orbits:'Umlaufbahn',orbitContrast:'Kontrast'}[setting];
    syncToggleState(button,enabled,`${label}: ${enabled?'An':'Aus'}`);
  }
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
