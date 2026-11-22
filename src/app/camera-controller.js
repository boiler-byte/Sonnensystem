import {S,renderer,mobileSheets,arMode,byId} from './state.js';
import {layerEnabled,availableLayerTypes,updateLayerSelection} from '../data/layers.js';
import {updateCatalog,updateDetail} from '../ui/catalog-controller.js';
import {updateMode} from './view-mode.js';
import {changeLayers} from '../ui/display-controls.js';
import {probeLocationBody,rendererSelectionId} from '../data/probe-location.js';

/** Planetary isolation also supports dwarf planets that have catalogued moons. */
export function openPlanetScene(id){
  if(renderer?.cinema?.active)renderer.stopCinema();
  const center=byId(id);
  if(!center || !['planet','dwarf'].includes(center.type) || !renderer?.showPlanetSystem(id))return false;
  // Each newly opened planet system starts with its own objects isolated in the catalog.
  // The user can switch the filter off afterwards without changing the scene.
  S.catalogPlanetOnly=true;
  // When a dwarf system is opened, its central dwarf must be included in the
  // renderer mask even though ordinary planet-view defaults only include planets.
  if(center.type==='dwarf' && !layerEnabled(S.viewSettings.planet.layers,'dwarf')){
    const available=availableLayerTypes(S.bodies,'planet',id);
    S.viewSettings.planet.layers=updateLayerSelection(S.viewSettings.planet.layers,'dwarf',true,'planet',available);
  }
  return true;
}
export function selectBody(id,focus=false,{zoom=focus}={}){
  if(renderer?.cinema?.active)renderer.stopCinema();
  const body=byId(id);if(!body)return;
  const target=probeLocationBody(body,byId)||body;
  const sceneId=target.id;
  if(renderer?.planetId && sceneId!==renderer.planetId && target.parentId!==renderer.planetId){
    if(target.type==='planet'||target.type==='dwarf')openPlanetScene(target.id);
    else{renderer.reset();renderer.calcPositions(S.time);}
    updateMode();
  }
  // A catalog selection must be visible even if its category was filtered out.
  // Preserve every other active layer and the independent settings of each view.
  if(!layerEnabled(S.settings.layers,target.type)){
    const view=renderer?.planetId?'planet':'solar';
    const available=availableLayerTypes(S.bodies,view,renderer?.planetId);
    if(available.includes(target.type))
      changeLayers(updateLayerSelection(S.settings.layers,target.type,true,view,available));
  }
  S.selected=id;
  const renderId=rendererSelectionId(body,byId);
  renderer?.setSelected(renderId,{focus:focus&&renderId!==null,zoom:zoom&&renderId!==null});
  // Selecting a catalog body moves the camera's orbit target. In AR the gaze
  // is sensor-relative and otherwise remains pointed at the previous object.
  // Adopt the new perspective as the neutral phone posture, with no new prompt.
  if(focus && rendererSelectionId(body,byId)!==null && arMode?.active)arMode.alignToPerspective();
  updateCatalog();updateDetail();
  if(focus)mobileSheets?.open('detail');
}
export function clearSelection(){
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.selected!==null){
    S.selected=null;
    renderer?.setSelected(null);
    updateCatalog();updateDetail();
  }
  // On desktop and mobile, show "Objekte" whenever no object is selected.
  // Do not expand a closed mobile bottom sheet just to change its active tab.
  mobileSheets?.selectPanel('catalog');
}
