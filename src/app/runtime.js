import {$,S,renderer,arMode,setRenderer,setMobileSheets,setARMode} from './state.js';
import {SolarRenderer} from '../renderer/index.js';
import {loadCatalog} from '../data/catalog.js';
import {fetchJSON} from '../services/api.js';
import {initMobileSheets} from '../ui/bottom-sheet.js';
import {initControls} from '../ui/event-handlers.js';
import {syncLayers} from '../ui/layer-panel.js';
import {renderStatus} from '../ui/status.js';
import {updateCatalog,updateDetail,updateStatus,connectCatalogSelection} from '../ui/catalog-controller.js';
import {updateMode,updateTime} from './view-mode.js';
import {selectBody,clearSelection} from './camera-controller.js';
import {syncSceneMode} from '../ui/scene-mode.js';
import {syncCinemaControl,updateCinemaTimeline} from './animation-controls.js';
import {registerServiceWorker} from './service-worker-registration.js';
import {connectARMode} from './ar-controller.js';
import {loop} from './animation-loop.js';
import {loadSolar,loadSatellites} from './object-catalog.js';

export async function loadServerStatus(){
  try{const status=await fetchJSON('/api/status');
    if(!status.nasaContactConfigured){updateStatus('sbdb','offline','Kontakt fehlt');updateStatus('horizons','offline','Kontakt fehlt');}
  }catch{/* Server optional für reinen Offline-Katalog */}
}
export async function init(){
  connectCatalogSelection(selectBody);
  setMobileSheets(initMobileSheets());initControls();registerServiceWorker();
  syncLayers();renderStatus(S.status);updateTime();
  try{
    const catalog=await loadCatalog();
    const missions=await fetchJSON('./data/catalog/probes.json').catch(error=>{
      console.warn('Missionsdaten nicht verfügbar:',error);return {objects:[]};
    });
    S.bodies=[...catalog.bodies,...(missions.objects||[])];
    if(!S.bodies.some(b=>b.id===S.selected))S.selected=S.bodies[0]?.id||null;
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
    setRenderer(new SolarRenderer($('space'),$('labels-canvas'),$('space-glow'),{onSelect:id=>selectBody(id,true),onClearSelect:clearSelection,onFollowChange:()=>updateDetail(),onCinemaChange:updateCinemaTimeline,
      onCameraChange:()=>syncSceneMode(S,renderer,arMode?.active)}));
    setARMode(connectARMode(renderer));
    renderer.setBodies(S.bodies);updateMode();updateDetail();requestAnimationFrame(loop);
  }catch(e){
    console.error(e);$('canvas-error').hidden=false;
    $('canvas-error').textContent='WebGL-Initialisierung fehlgeschlagen: '+e.message;
    updateDetail();
  }
  loadServerStatus();loadSolar();loadSatellites();
}
