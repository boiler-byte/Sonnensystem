import {$,S,renderer,byId} from './state.js';
import {mergeLiveBodies} from '../data/catalog.js';
import {clean,formatAsteroid} from '../data/normalization.js';
import {HORIZONS_IDS} from '../data/bodies.js';
import {fetchSolarBodies} from '../services/solar-api.js';
import {fetchSatellites} from '../services/celestrak-api.js';
import {fetchAsteroid,fetchHorizons} from '../services/nasa-api.js';
import {dateISO} from '../ui/formatters.js';
import {updateCatalog,updateDetail,updateStatus} from '../ui/catalog-controller.js';
import {updateTime} from './view-mode.js';
import {syncLayers} from '../ui/layer-panel.js';
import {notify} from '../ui/status.js';
import {refreshRowCameraFrame} from './animation-controls.js';

export function mergeBodies(list){
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.settings.row)renderer?.beginTransition?.('row');
  S.bodies=mergeLiveBodies(S.bodies,list);
  renderer?.setBodies(S.bodies);
  refreshRowCameraFrame();
  syncLayers();updateCatalog();updateDetail();
}

export async function loadSolar(){
  try{
    const bodies=await fetchSolarBodies(byId);
    mergeBodies(bodies);
    updateStatus('solar','ok',`${bodies.length} Objekte`);
    notify(`${bodies.length} Himmelskörper aus Solar OpenData geladen`);
  }catch(e){updateStatus('solar','offline','Startdaten');console.info('Solar OpenData:',e.message);}
}
export async function loadSatellites(){
  try{
    const satellites=await fetchSatellites();
    mergeBodies(satellites);updateStatus('celestrak','ok',`${satellites.length} Satelliten`);
  }catch(e){updateStatus('celestrak','offline','Nicht erreichbar');console.info('CelesTrak:',e.message);}
}
const inFlightAsteroids=new Set();
export async function loadAsteroid(name,existing=null){
  const q=existing?.sbdbQuery||name;
  if(inFlightAsteroids.has(q))return;
  inFlightAsteroids.add(q);updateStatus('sbdb','loading','Lädt ...');
  try{
    const data=await fetchAsteroid(q);
    const foundName=data.object?.shortname||data.object?.fullname||name;
    const id=existing?.id||('sbdb-'+clean(foundName).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
    const body=formatAsteroid(data,id,name,existing);
    mergeBodies([body]);updateStatus('sbdb','ok','Bahndaten geladen');
    if(S.selected===id)updateDetail();
  }catch(e){updateStatus('sbdb','offline','Abfrage fehlgeschlagen');notify('JPL SBDB: '+e.message,true);}
  finally{inFlightAsteroids.delete(q);}
}
export async function alignHorizons(){
  const body=byId(S.selected),target=HORIZONS_IDS[body?.id];
  if(!target||body.id==='sun')return;
  const button=$('horizons-btn');button.disabled=true;button.innerHTML='<span>◌</span> Berechne Position ...';
  updateStatus('horizons','loading','Berechne ...');
  const date=dateISO(S.time);
  try{
    const data=await fetchHorizons(target,date);
    renderer.setOverride(body.id,date,[data.xKm,data.yKm,data.zKm]);
    S.playing=false;S.time=Date.parse(date+'T00:00:00Z');renderer.resetGalacticTrails();updateTime();
    renderer.calcPositions(S.time);renderer.focus(body.id);
    updateStatus('horizons','ok',`${date} · UTC`);
    $('horizons-note').textContent=`JPL-Vektor für ${date}, 00:00 UTC geladen. Position ist auf die schematische Szenenskala übertragen.`;
    notify(`JPL Horizons: ${body.name} abgeglichen`);
  }catch(e){updateStatus('horizons','offline','Nicht verfügbar');notify('JPL Horizons: '+e.message,true);}
  finally{updateDetail();}
}
