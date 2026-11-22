import {S,renderer,mobileSheets,arMode,byId} from './state.js';
import {layerEnabled,availableLayerTypes,updateLayerSelection} from '../data/layers.js';
import {updateCatalog,updateDetail} from '../ui/catalog-controller.js';
import {updateMode} from './view-mode.js';
import {changeLayers} from '../ui/display-controls.js';
import {probeLocationBody,rendererSelectionId} from '../data/probe-location.js';

/** Open a local system around any catalogued object, including moons and minor bodies. */
export function openPlanetScene(id){
  const center=byId(id);
  if(!center || !renderer?.showPlanetSystem)return false;
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(!renderer.showPlanetSystem(id))return false;
  // Every local scene initially filters the catalog to its center and descendants.
  S.catalogPlanetOnly=true;
  // Default planet layers omit stars, minor bodies and probes. Always unmask
  // the chosen center without changing the solar-system layer preferences.
  if(!layerEnabled(S.viewSettings.planet.layers,center.type)){
    const available=availableLayerTypes(S.bodies,'planet',id);
    S.viewSettings.planet.layers=updateLayerSelection(S.viewSettings.planet.layers,center.type,true,'planet',available);
  }
  return true;
}
export function selectBody(id,focus=false,{zoom=focus}={}){
  if(renderer?.cinema?.active)renderer.stopCinema();
  const body=byId(id);if(!body)return;
  // In a symbolic probe scene, selecting its center must not jump to the
  // probe's terminal target (e.g. Cassini -> Saturn).
  const target=renderer?.planetId===body.id?body:(probeLocationBody(body,byId)||body);
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
  const renderId=renderer?.planetId===body.id?body.id:rendererSelectionId(body,byId);
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
