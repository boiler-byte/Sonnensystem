import {$,S,renderer,mobileSheets,arMode,byId} from '../app/state.js';
import {availableLayerTypes,layerEnabled,layerPreset,updateLayerSelection} from '../data/layers.js';
import {syncScaleControls,updateScale,syncRowControl,updateRow,syncCinemaControl,refreshRowCameraFrame} from '../app/animation-controls.js';
import {syncLayers,setLayerPopover,toggleLayerSpeedPanel} from './layer-panel.js';
import {syncOrbitControls,advanceOrbitDisplayMode,orbitDisplayMode,nextOrbitDisplayMode,syncContrastControl,syncLabelControl,syncLightingControl,syncFourMoonsControl,changeLayers,applyDisplayPreset} from './display-controls.js';
import {activeView,updateCatalog,updateDetail} from './catalog-controller.js';
import {nextCatalogSort} from './object-list.js';
import {openPlanetScene,selectBody,clearSelection} from '../app/camera-controller.js';
import {updateMode,updateTime} from '../app/view-mode.js';
import {alignHorizons} from '../app/horizons-controller.js';
import {detailNavigation,setDetailTab,restoreDetailTab,toggleDetailSizeReference} from './object-details.js';
import {syncSceneMode} from './scene-mode.js';
import {speedAtStep} from './timeline.js';
import {notifyToggle} from './status.js';
import {rendererSelectionId} from '../data/probe-location.js';

export function initControls(){
  $('layer-btn').addEventListener('click',()=>{
    const opening=$('layer-popover').hidden;
    setLayerPopover(opening);
  });
  for(const [id,setting] of [['scale-objects-btn','scaleObjects'],['scale-orbits-btn','scaleOrbits']])
    $(id).addEventListener('click',()=>updateScale(setting));
  syncScaleControls();
  $('layer-speed-toggle').addEventListener('click',toggleLayerSpeedPanel);
  $('orbit-row-btn').addEventListener('click',updateRow);syncRowControl();syncCinemaControl();
  $('cinema-btn').addEventListener('click',()=>{
    if(!renderer)return;
    if(renderer.cinema?.active){renderer.stopCinema();notifyToggle(S.settings.rowOrder==='distance'?'Cinema: Beendet – Entfernungsreihe bleibt bestehen':'Cinema: Beendet – Reihe wieder groß nach klein');return;}
    if(arMode?.active||arMode?.pending)arMode.stop(); // Sensor look cannot override the movie camera.
    if(renderer.startCinema())notifyToggle(S.settings.rowOrder==='distance'?'Cinema: Kamerafahrt von links nach rechts':'Cinema: Kamerafahrt von klein nach groß');
  });
  $('cinema-play-pause').addEventListener('click',()=>renderer?.toggleCinemaPause());
  $('cinema-speed-toggle').addEventListener('click',()=>renderer?.toggleCinemaSpeed());
  const seek=$('cinema-seek');
  seek.addEventListener('pointerdown',()=>renderer?.setCinemaScrubbing(true));
  seek.addEventListener('input',()=>renderer?.seekCinema(Number(seek.value)/1000));
  for(const event of ['pointerup','pointercancel','lostpointercapture'])
    seek.addEventListener(event,()=>renderer?.setCinemaScrubbing(false));
  seek.addEventListener('change',()=>renderer?.setCinemaScrubbing(false));
  for(const btn of document.querySelectorAll('[data-layer-preset]'))
    btn.addEventListener('click',()=>{
      changeLayers(layerPreset(btn.dataset.layerPreset,activeView()));
      applyDisplayPreset(btn.dataset.layerPreset);
    });
  for(const input of document.querySelectorAll('[data-layer-type]'))
    input.addEventListener('change',()=>{
      const available=availableLayerTypes(S.bodies,activeView(),renderer?.planetId);
      const next=updateLayerSelection(S.settings.layers,input.dataset.layerType,input.checked,activeView(),available);
      changeLayers(next);syncLayers(); // Restore the last checkbox if it was the only active layer.
    });
  $('search').addEventListener('input',e=>{S.search=e.target.value;updateCatalog();});
  $('catalog-sort').addEventListener('click',()=>{
    S.catalogSort=nextCatalogSort(S.catalogSort);
    updateCatalog();$('object-list').scrollTop=0;
  });
  $('catalog-planet-filter').addEventListener('click',()=>{S.catalogPlanetOnly=!S.catalogPlanetOnly;updateCatalog();});
  for(const [id,key] of [['detail-prev','previousId'],['detail-next','nextId']]){
    $(id).addEventListener('click',()=>{
      const target=detailNavigation(S)[key];
      if(target)selectBody(target,true);
    });
  }
  for(const tab of document.querySelectorAll('[data-detail-tab]')){
    tab.addEventListener('click',()=>setDetailTab(tab.dataset.detailTab));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();
      const next=e.key==='Home'?'daten':e.key==='End'?'wissen':tab.dataset.detailTab==='wissen'?'daten':'wissen';
      setDetailTab(next);$('detail-tab-'+next).focus();
    });
  }
  restoreDetailTab();
  $('orbit-visibility-btn').addEventListener('click',()=>{
    const view=activeView();
    const current=orbitDisplayMode(S.settings,view);
    const next=nextOrbitDisplayMode(S.settings,view);
    // A new session records only positions reached after this click.
    if(renderer && current!=='galactic' && next==='galactic')renderer.resetGalacticTrails();
    const mode=advanceOrbitDisplayMode(S.settings);
    syncOrbitControls();syncLayers();
    notifyToggle({normal:'Umlaufbahn: An',galactic:'Galaktische Bewegung: An',off:'Umlaufbahn und galaktische Bewegung: Aus'}[mode]);
  });
  syncOrbitControls();
  $('orbit-contrast-btn').addEventListener('click',()=>{
    S.settings.orbitContrast=!S.settings.orbitContrast;
    syncContrastControl();syncLayers();
    notifyToggle(`Bahnkontrast: ${S.settings.orbitContrast?'An':'Aus'}`);
  });
  syncContrastControl();
  $('toggle-labels').addEventListener('click',()=>{
    // Three levels of detail: names + points -> points only -> off.
    S.settings.labels=S.settings.labels===true?'points':S.settings.labels==='points'?false:true;
    syncLabelControl();syncLayers();
    notifyToggle(`Beschriftung: ${S.settings.labels==='points'?'Planetenpunkt':S.settings.labels?'An':'Aus'}`);
  });
  syncLabelControl();
  $('toggle-lighting').addEventListener('click',()=>{
    S.settings.lighting=S.settings.lighting==='realistic'?'optimized':'realistic';
    syncLightingControl();syncLayers();
    notifyToggle(`Beleuchtung: ${S.settings.lighting==='realistic'?'An (Realistisch)':'Aus (Optimiert)'}`);
  });
  syncLightingControl();
  $('toggle-four-moons').addEventListener('click',()=>{
    if(renderer?.cinema?.active)renderer.stopCinema(); // The visible tour set has changed.
    if(S.settings.row)renderer?.beginTransition?.('row');
    S.settings.fourMoons=!S.settings.fourMoons;
    // Enabling all moons must also enable the Moon object category, otherwise
    // the extra moons remain hidden by the independent layer filter.
    if(S.settings.fourMoons===false && !layerEnabled(S.settings.layers,'moon')){
      const view=activeView();
      changeLayers(updateLayerSelection(S.settings.layers,'moon',true,view,
        availableLayerTypes(S.bodies,view,renderer?.planetId)));
    }
    // Turning the toggle off restores the four-moon limit, not the filter.
    refreshRowCameraFrame();
    syncFourMoonsControl();syncLayers();
    notifyToggle(`Alle Monde: ${S.settings.fourMoons?'Aus (max. 4)':'An (alle)'}`);
  });
  syncFourMoonsControl();
  $('hero-size-reference-name').addEventListener('click',()=>toggleDetailSizeReference(S));
  $('hero-body').addEventListener('click',()=>{
    const body=byId(S.selected);
    if(body && renderer && rendererSelectionId(body,byId)!==null)selectBody(body.id,true);
  });
  $('back-to-solar').addEventListener('click',()=>{
    if(!renderer?.planetId)return;
    if(renderer.cinema?.active)renderer.stopCinema();
    // Clear both UI selection and camera follow before exiting the local scene.
    // Otherwise reset() immediately centers the solar camera on the old body.
    clearSelection();
    renderer.reset();
    updateMode();
    // Apply the oblique overview after restoring solar-specific layer/row settings.
    renderer.returnToStandardCamera();
    if(arMode?.active)arMode.alignToPerspective();
    mobileSheets?.close();
  });
  $('reset-camera').addEventListener('click',()=>{
    if(renderer?.cinema?.active)renderer.stopCinema();
    // Perspective selection is local to the active scene, including dwarf
    // systems; returning to the Sun is solely the top-left back action.
    renderer?.cycleCameraPerspective({keepPlanetScene:true});
    if(arMode?.active)arMode.alignToPerspective();
    syncSceneMode(S,renderer,arMode?.active);
    updateDetail();mobileSheets?.close();
  });
  $('planet-view-btn').addEventListener('click',()=>{
    const selected=byId(S.selected);
    // Moons open the parent planet (or dwarf-planet) system, not a moon-only scene.
    const center=selected?.type==='moon'?byId(selected.parentId):selected;
    if(!openPlanetScene(center?.id))return;
    S.selected=center.id;
    renderer.setSelected(center.id);
    updateMode();
    // Isolating a planet resets the orbit preset; in AR the sensor gaze must
    // adopt that view instead of retaining the previous scene's direction.
    if(arMode?.active)arMode.alignToPerspective();
    updateCatalog();updateDetail();mobileSheets?.close();
  });
  const togglePlayback=()=>{S.playing=!S.playing;updateTime();};
  $('layer-play-btn').addEventListener('click',togglePlayback);
  $('layer-speed').addEventListener('input',e=>{
    S.speed=speedAtStep(S.timelineMode,Number(e.target.value));
    S.modeSpeeds[S.timelineMode]=S.speed;
    updateTime(); // Changing speed preserves the pause state.
  });
  const resetToToday=()=>{S.time=Date.now();renderer?.resetGalacticTrails?.();updateTime();updateDetail();};
  $('layer-today-btn').addEventListener('click',resetToToday);
  document.addEventListener('pointerdown',e=>{
    if(!$('layer-popover').hidden && !$('layer-picker-wrap').contains(e.target))setLayerPopover(false);
  });
  $('horizons-btn').addEventListener('click',alignHorizons);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(renderer?.cinema?.active){renderer.stopCinema();$('cinema-btn').focus({preventScroll:true});return;}
      if(!$('layer-popover').hidden){setLayerPopover(false);$('layer-btn').focus({preventScroll:true});return;}
      setLayerPopover(false);mobileSheets?.close();
    }
    if(e.key==='/'&&!(e.target instanceof HTMLInputElement)){
      e.preventDefault();mobileSheets?.open('catalog');requestAnimationFrame(()=>$('search').focus());
    }
  });
}
