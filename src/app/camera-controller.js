import {S,renderer,mobileSheets,arMode,byId} from './state.js';
import {layerEnabled,availableLayerTypes,updateLayerSelection} from '../data/layers.js';
import {setDetailTab} from '../ui/object-details.js';
import {updateCatalog,updateDetail} from '../ui/catalog-controller.js';
import {updateMode} from './view-mode.js';
import {loadAsteroid} from './object-catalog.js';

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
export function selectBody(id,focus=false){
  if(renderer?.cinema?.active)renderer.stopCinema();
  const body=byId(id);if(!body)return;
  if(renderer?.planetId && id!==renderer.planetId && body.parentId!==renderer.planetId){
    if(body.type==='planet'||body.type==='dwarf')openPlanetScene(body.id);
    else{renderer.reset();renderer.calcPositions(S.time);}
    updateMode();
  }
  if(S.selected!==id)setDetailTab('wissen');
  S.selected=id;
  renderer?.setSelected(body.type==='probe'?null:id,{focus:focus&&body.type!=='probe'});
  // Selecting a catalog body moves the camera's orbit target. In AR the gaze
  // is sensor-relative and otherwise remains pointed at the previous object.
  // Adopt the new perspective as the neutral phone posture, with no new prompt.
  if(focus && body.type!=='probe' && arMode?.active)arMode.alignToPerspective();
  updateCatalog();updateDetail();
  if(focus)mobileSheets?.open('detail');
  if(body.type==='asteroid'&&!body.sbdbLoaded)loadAsteroid(body.name,body);
}
export function clearSelection(){
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.selected===null)return;
  S.selected=null;
  setDetailTab('wissen');
  renderer?.setSelected(null);
  updateCatalog();updateDetail();
}
