import {$,S,renderer} from '../app/state.js';
import {availableLayerTypes,displayMatchesPreset,layerEnabled,layerSummary,layerFilterMembers,LAYER_FILTER_TYPES} from '../data/layers.js';
import {CATEGORY_COLORS} from '../data/bodies.js';
import {activeView} from './catalog-controller.js';
import {syncToggleState} from './control-state.js';

export function syncLayers(){
  const view=activeView(), selected=S.settings.layers;
  const available=new Set(availableLayerTypes(S.bodies,view,renderer?.planetId));
  const summary=layerSummary(selected);
  const row= S.settings.row === true;
  for(const id of ['toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-four-moons'])
    $(id).hidden=row;
  $('layer-popover').classList.toggle('row-layer-options',row);
  $('layer-btn').setAttribute('aria-label',`Objektlayer auswählen (${summary})`);
  $('layer-btn').title=selected.mode==='custom'
    ? 'Aktive Objektlayer: '+LAYER_FILTER_TYPES.filter(filter => layerFilterMembers(filter).some(type => layerEnabled(selected,type))).join(', ')
    : (selected.mode==='all'?'Alle Objektkategorien':`Standardfilter (${view==='planet'?'Planetenansicht':'Sonnensystem'})`);
  $('layer-popover').setAttribute('aria-label',view==='planet'?'Objektlayer der Planetenansicht':'Objektlayer des Sonnensystems');
  for(const check of document.querySelectorAll('[data-layer-type]')){
    const type=check.dataset.layerType;
    const members=layerFilterMembers(type).filter(member => available.has(member));
    check.parentElement.hidden=!members.length || (row && (type==='moon' || type==='satellite'));
    check.disabled=!members.length;
    check.checked=members.length>0 && members.every(member => layerEnabled(selected,member));
    // Legacy split selections can still be represented without losing data.
    check.indeterminate=!check.checked && members.some(member => layerEnabled(selected,member));
    check.parentElement?.style.setProperty('--category-color',CATEGORY_COLORS[type]||'#E6EDF5');
  }
  syncLayerPanelMode();
  for(const preset of document.querySelectorAll('[data-layer-preset]')){
    const active=preset.dataset.layerPreset===selected.mode
      && displayMatchesPreset(S.settings,preset.dataset.layerPreset,view);
    syncToggleState(preset,active);
  }
}
export function setLayerPopover(open){
  $('layer-popover').hidden=!open;
  $('layer-btn').setAttribute('aria-expanded',String(open));
}

// Only the content below the appearance controls changes; layer filters stay active.
let speedPanelVisible=false;
function syncLayerPanelMode(){
  const row=S.settings.row===true;
  if(row)speedPanelVisible=false; // The lineup uses a fixed simulation speed.
  const button=$('layer-speed-toggle');
  button.disabled=row;
  const current=speedPanelVisible?'Tempo':'Kategorien';
  const next=speedPanelVisible?'Kategorien':'Tempo';
  const description=row
    ? 'Aktuelle Ansicht: Kategorien. In der Reihenansicht ist die Simulationsgeschwindigkeit fest'
    : `Aktuelle Ansicht: ${current}. Zu ${next} wechseln`;
  syncToggleState(button,speedPanelVisible,description);
  button.setAttribute('aria-label',description);
  button.setAttribute('data-layer-view',speedPanelVisible?'tempo':'categories');
  $('layer-speed-toggle-label').textContent=current;
  $('layer-categories').hidden=speedPanelVisible;
  $('layer-speed-panel').hidden=!speedPanelVisible;
}
export function toggleLayerSpeedPanel(){
  if(S.settings.row)return;
  speedPanelVisible=!speedPanelVisible;
  syncLayerPanelMode();
  if(speedPanelVisible)$('layer-speed').focus({preventScroll:true});
}
