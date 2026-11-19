import {$,S,renderer} from '../app/state.js';
import {availableLayerTypes,displayMatchesPreset,layerEnabled,layerSummary} from '../data/layers.js';
import {CATEGORY_COLORS} from '../data/bodies.js';
import {activeView} from './catalog-controller.js';
import {syncToggleState} from './control-state.js';

export function syncLayers(){
  const view=activeView(), selected=S.settings.layers;
  const available=new Set(availableLayerTypes(S.bodies,view,renderer?.planetId));
  const summary=layerSummary(selected);
  $('layer-btn').setAttribute('aria-label',`Objektlayer auswählen (${summary})`);
  $('layer-btn').title=selected.mode==='custom'
    ? 'Aktive Objektlayer: '+[...selected.types].join(', ')
    : (selected.mode==='all'?'Alle Objektkategorien':`Standardfilter (${view==='planet'?'Planetenansicht':'Sonnensystem'})`);
  $('layer-popover').setAttribute('aria-label',view==='planet'?'Objektlayer der Planetenansicht':'Objektlayer des Sonnensystems');
  for(const check of document.querySelectorAll('[data-layer-type]')){
    const type=check.dataset.layerType;
    check.parentElement.hidden=!available.has(type);
    check.disabled=!available.has(type);
    check.checked=layerEnabled(selected,type);
    check.parentElement?.style.setProperty('--category-color',CATEGORY_COLORS[type]||'#E6EDF5');
  }
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
