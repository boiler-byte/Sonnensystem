import {S,renderer,arMode} from './state.js';
import {availableLayerTypes,ensureAvailableSelection} from '../data/layers.js';
import {syncSceneMode} from '../ui/scene-mode.js';
import {syncSpeedMode,syncControls} from '../ui/timeline.js';
import {activeView,updateCatalog,updateDetail} from '../ui/catalog-controller.js';
import {syncLayers} from '../ui/layer-panel.js';
import {syncLightingControl,syncFourMoonsControl,syncOrbitControls,syncContrastControl,syncLabelControl} from '../ui/display-controls.js';
import {syncScaleControls,syncRowControl,syncCinemaControl} from './animation-controls.js';

export const updateMode=()=>{
  const view=activeView();
  S.settings=S.viewSettings[view]; // Distinct layer, orbit and label preferences per scene.
  if(renderer)renderer.settings=S.settings;
  S.settings.layers=ensureAvailableSelection(S.settings.layers,availableLayerTypes(S.bodies,view,renderer?.planetId),view);
  syncSceneMode(S,renderer,arMode?.active);
  if(syncSpeedMode(S,view)) {
    updateTime();
  }
  // Layer visibility belongs to the renderer; keep catalog selections intact.
  syncLightingControl();syncFourMoonsControl();syncLayers();syncOrbitControls();syncContrastControl();syncLabelControl();syncScaleControls();syncRowControl();syncCinemaControl();
  if(renderer?.transition?.kind==='view' && !S.settings.row)
    renderer.setCameraAngles?.(.63,renderer.planetId?.84:.99);
  if(renderer?.settings?.row && !renderer.focusedBodyId && !renderer.followedBodyId){
    renderer.camera.desiredTarget=renderer.rowFrame().target;renderer.camera.desiredDist=renderer.rowDistance();
    renderer.setCameraAngles?.(0,1.5);
  }
  renderer?.calcPositions(S.time);updateCatalog();updateDetail();
};
export const updateTime=()=>syncControls(S);
