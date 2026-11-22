import {$,S,renderer,mobileSheets,arMode,setRenderer,setMobileSheets,setARMode} from './state.js';
import {SolarRenderer} from '../renderer/index.js';
import {loadCatalog} from '../data/catalog.js';
import {fetchJSON} from '../services/api.js';
import {initMobileSheets} from '../ui/bottom-sheet.js';
import {initSceneHistory} from '../ui/scene-history.js';
import {initControls} from '../ui/event-handlers.js';
import {updateOrbitTooltip} from '../ui/orbit-tooltip.js';
import {syncLayers} from '../ui/layer-panel.js';
import {renderStatus} from '../ui/status.js';
import {updateCatalog,updateDetail,updateStatus,connectCatalogSelection} from '../ui/catalog-controller.js';
import {updateMode,updateTime} from './view-mode.js';
import {selectBody,clearSelection,openPlanetScene} from './camera-controller.js';
import {syncSceneMode} from '../ui/scene-mode.js';
import {syncCinemaControl,updateCinemaTimeline} from './animation-controls.js';
import {registerServiceWorker} from './service-worker-registration.js';
import {connectARMode} from './ar-controller.js';
import {loop} from './animation-loop.js';

export async function loadServerStatus(){
  try{const status=await fetchJSON('api/status');
    if(!status.nasaContactConfigured)updateStatus('horizons','offline','Kontakt fehlt');
  }catch{/* Server optional für reinen Offline-Katalog */}
}
/** Keep an intentional empty selection after loading the catalog. */
export function selectionAfterCatalogLoad(current,bodies){
  if(current===null || bodies.some(body=>body.id===current))return current;
  return bodies[0]?.id||null;
}
/** A second tap on empty space dismisses an already unselected mobile sheet. */
export function clearSceneSelection(){
  const wasEmpty=S.selected===null;
  clearSelection();
  if(wasEmpty)mobileSheets?.close();
}
export async function init(){
  connectCatalogSelection(selectBody);
  setMobileSheets(initMobileSheets());initControls();
  initSceneHistory({
    browser:window,
    sceneId:()=>renderer?.planetId??null,
    parentId:id=>{const parent= S.bodies.find(body=>body.id===id)?.parentId;
      return parent&&parent!=='sun'?parent:null;},
    onParentBack:()=>$('back-to-solar').click(),
    onShowScene:id=>{
      if(id===null){
        // Normally Back moves just one level. This also handles a larger
        // history jump (e.g. from the browser's history menu).
        let steps=0;
        while(renderer?.planetId && steps++<32)$('back-to-solar').click();
        return;
      }
      if(!openPlanetScene(id))return;
      S.selected=id;renderer.setSelected(id);updateMode();
      if(arMode?.active)arMode.alignToPerspective();
      updateCatalog();updateDetail();mobileSheets?.close();
    }
  });
  registerServiceWorker();
  syncLayers();renderStatus(S.status);updateTime();
  try{
    const catalog=await loadCatalog();
    const missions=await fetchJSON('./data/catalog/probes.json').catch(error=>{
      console.warn('Missionsdaten nicht verfügbar:',error);return {objects:[]};
    });
    S.bodies=[...catalog.bodies,...(missions.objects||[])];
    S.selected=selectionAfterCatalogLoad(S.selected,S.bodies);
    updateStatus('catalog','ok',`${S.bodies.length} Objekte · v${catalog.version}`);
    syncLayers();updateCatalog();updateDetail();
  }catch(e){
    console.error('Lokaler Katalog:',e);
    updateStatus('catalog','offline','Laden fehlgeschlagen');
    $('canvas-error').hidden=false;
    $('canvas-error').textContent='Der lokale Himmelskörper-Katalog konnte nicht geladen werden: '+e.message;
    return;
  }
  try{
    setRenderer(new SolarRenderer($('space'),$('labels-canvas'),$('space-glow'),{onSelect:id=>selectBody(id,true,{zoom:renderer?.settings?.row===true}),onClearSelect:clearSceneSelection,onCinemaChange:updateCinemaTimeline,
      onCameraChange:()=>syncSceneMode(S,renderer,arMode?.active),onPathHover:updateOrbitTooltip}));
    setARMode(connectARMode(renderer));
    renderer.setBodies(S.bodies);updateMode();updateDetail();requestAnimationFrame(loop);
  }catch(e){
    console.error(e);$('canvas-error').hidden=false;
    $('canvas-error').textContent='WebGL-Initialisierung fehlgeschlagen: '+e.message;
    updateDetail();
  }
  loadServerStatus();
}
