import { HORIZONS_IDS } from './data/bodies.js';
import { loadCatalog, mergeLiveBodies } from './data/catalog.js';
import { clean, formatAsteroid } from './data/normalization.js';
import { SolarRenderer } from './renderer/index.js';
import { fetchJSON } from './services/api.js';
import { fetchSolarBodies } from './services/solar-api.js';
import { fetchSatellites } from './services/celestrak-api.js';
import { fetchAsteroid, fetchHorizons } from './services/nasa-api.js';
import { dateISO } from './ui/formatters.js';
import { renderCatalog, renderFilters } from './ui/object-list.js';
import { renderDetail, setDetailTab } from './ui/object-details.js';
import { syncSceneMode } from './ui/scene-mode.js';
import { syncControls, syncSpeedMode, speedAtStep, SPEED_MODES } from './ui/timeline.js';
import { renderStatus, changeStatus, notify } from './ui/status.js';
import { initMobileSheets } from './ui/bottom-sheet.js';

const $ = id => document.getElementById(id);
const S = {
  bodies:[], selected:'earth', filter:'all', search:'',
  playing:true, speed:SPEED_MODES.solar.defaultSpeed, timelineMode:'solar', modeSpeeds:{solar:SPEED_MODES.solar.defaultSpeed,planet:SPEED_MODES.planet.defaultSpeed}, time:Date.now(), settings:{orbits:true,labels:true},
  status:{ catalog:['loading','Lädt ...'],solar:['loading','Verbinde'],sbdb:['idle','Auf Abruf'],celestrak:['loading','Verbinde'],horizons:['idle','Auf Abruf'] }
};
let renderer=null, mobileSheets=null, lastTimeReadoutAt=0;
const byId=id=>S.bodies.find(x=>x.id===id);
const updateCatalog=()=>renderCatalog(S,selectBody);
const updateDetail=()=>renderDetail(S,renderer,selectBody);
const updateStatus=(provider,state,label)=>changeStatus(S.status,provider,state,label);
const updateMode=()=>{
  syncSceneMode(S,renderer);
  if(syncSpeedMode(S,renderer?.planetId?'planet':'solar')) {
    setSpeedPopover(false);
    updateTime();
  }
};
const updateTime=()=>syncControls(S);

function mergeBodies(list){
  S.bodies=mergeLiveBodies(S.bodies,list);
  renderer?.setBodies(S.bodies);
  updateCatalog();updateDetail();
}

async function loadSolar(){
  try{
    const bodies=await fetchSolarBodies(byId);
    mergeBodies(bodies);
    updateStatus('solar','ok',`${bodies.length} Objekte`);
    notify(`${bodies.length} Himmelskörper aus Solar OpenData geladen`);
  }catch(e){updateStatus('solar','offline','Startdaten');console.info('Solar OpenData:',e.message);}
}
async function loadSatellites(){
  try{
    const satellites=await fetchSatellites();
    mergeBodies(satellites);updateStatus('celestrak','ok',`${satellites.length} Satelliten`);
  }catch(e){updateStatus('celestrak','offline','Nicht erreichbar');console.info('CelesTrak:',e.message);}
}
const inFlightAsteroids=new Set();
async function loadAsteroid(name,existing=null,addNew=false){
  const q=existing?.sbdbQuery||name;
  if(inFlightAsteroids.has(q))return;
  inFlightAsteroids.add(q);updateStatus('sbdb','loading','Lädt ...');
  if(addNew)notify(`Suche NASA/JPL: ${name}`);
  try{
    const data=await fetchAsteroid(q);
    const foundName=data.object?.shortname||data.object?.fullname||name;
    const id=existing?.id||('sbdb-'+clean(foundName).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
    const body=formatAsteroid(data,id,name,existing);
    mergeBodies([body]);updateStatus('sbdb','ok','Bahndaten geladen');
    if(addNew){
      selectBody(id,true);S.filter='all';S.search='';$('search').value='';
      renderFilters(S);updateCatalog();notify(`${name} wurde zum Atlas hinzugefügt`);
    }else if(S.selected===id)updateDetail();
  }catch(e){updateStatus('sbdb','offline','Abfrage fehlgeschlagen');notify('JPL SBDB: '+e.message,true);}
  finally{inFlightAsteroids.delete(q);}
}
async function alignHorizons(){
  const body=byId(S.selected),target=HORIZONS_IDS[body?.id];
  if(!target||body.id==='sun')return;
  const button=$('horizons-btn');button.disabled=true;button.innerHTML='<span>◌</span> Berechne Position ...';
  updateStatus('horizons','loading','Berechne ...');
  const date=dateISO(S.time);
  try{
    const data=await fetchHorizons(target,date);
    renderer.setOverride(body.id,date,[data.xKm,data.yKm,data.zKm]);
    S.playing=false;S.time=Date.parse(date+'T00:00:00Z');updateTime();
    renderer.calcPositions(S.time);renderer.focus(body.id);
    updateStatus('horizons','ok',`${date} · UTC`);
    $('horizons-note').textContent=`JPL-Vektor für ${date}, 00:00 UTC geladen. Position ist auf die schematische Szenenskala übertragen.`;
    notify(`JPL Horizons: ${body.name} abgeglichen`);
  }catch(e){updateStatus('horizons','offline','Nicht verfügbar');notify('JPL Horizons: '+e.message,true);}
  finally{updateDetail();}
}
function selectBody(id,focus=false){
  const body=byId(id);if(!body)return;
  if(renderer?.planetId && id!==renderer.planetId && body.parentId!==renderer.planetId){
    if(body.type==='planet')renderer.showPlanetSystem(body.id);
    else{renderer.reset();renderer.calcPositions(S.time);}
    updateMode();
  }
  if(S.selected!==id)setDetailTab('wissen');
  S.selected=id;
  renderer?.setSelected(body.type==='probe'?null:id,{focus:focus&&body.type!=='probe'});
  updateCatalog();updateDetail();
  if(focus)mobileSheets?.open('detail');
  if(body.type==='asteroid'&&!body.sbdbLoaded)loadAsteroid(body.name,body);
}
function clearSelection(){
  if(S.selected===null)return;
  S.selected=null;
  setDetailTab('wissen');
  renderer?.setSelected(null);
  updateCatalog();updateDetail();
}
function setSpeedPopover(open) {
  $('speed-popover').hidden = !open;
  $('speed-btn').setAttribute('aria-expanded', String(open));
  if(open) $('speed').focus({preventScroll:true});
}
function initControls(){
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    S.filter=b.dataset.filter;renderFilters(S);updateCatalog();
  }));
  $('search').addEventListener('input',e=>{S.search=e.target.value;updateCatalog();});
  $('asteroid-form').addEventListener('submit',e=>{
    e.preventDefault();const name=$('asteroid-name').value.trim();if(!name)return;
    if(name.length>56){notify('Name ist zu lang',true);return;}
    loadAsteroid(name,null,true);$('asteroid-name').value='';
  });
  $('view-mode-select').addEventListener('change',e=>{
    const value=e.target.value;
    if(value==='solar'){renderer?.reset();updateMode();updateDetail();return;}
    if(!value.startsWith('planet:')){updateMode();return;}
    const id=value.slice(7), planet=byId(id);
    if(!renderer||planet?.type!=='planet'||!renderer.showPlanetSystem(id)){updateMode();return;}
    S.selected=id;renderer.setSelected(id);
    setDetailTab('wissen');updateMode();updateCatalog();updateDetail();
  });
  for(const tab of document.querySelectorAll('[data-detail-tab]')){
    tab.addEventListener('click',()=>setDetailTab(tab.dataset.detailTab));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();
      const next=e.key==='Home'?'wissen':e.key==='End'?'daten':tab.dataset.detailTab==='wissen'?'daten':'wissen';
      setDetailTab(next);$('detail-tab-'+next).focus();
    });
  }
  setDetailTab('wissen');
  $('toggle-orbits').addEventListener('click',()=>{S.settings.orbits=!S.settings.orbits;$('toggle-orbits').classList.toggle('active',S.settings.orbits);$('toggle-orbits').setAttribute('aria-pressed',String(S.settings.orbits));});
  $('toggle-labels').addEventListener('click',()=>{S.settings.labels=!S.settings.labels;$('toggle-labels').classList.toggle('active',S.settings.labels);$('toggle-labels').setAttribute('aria-pressed',String(S.settings.labels));});
  $('reset-camera').addEventListener('click',()=>{renderer?.reset();updateMode();updateDetail();mobileSheets?.close();});
  $('planet-view-btn').addEventListener('click',()=>{
    const planet=byId(S.selected);
    if(planet?.type!=='planet'||!renderer?.showPlanetSystem(planet.id))return;
    renderer.setSelected(planet.id);updateMode();updateDetail();mobileSheets?.close();
  });
  $('play-btn').addEventListener('click',()=>{S.playing=!S.playing;updateTime();});
  $('speed-btn').addEventListener('click',()=>setSpeedPopover($('speed-popover').hidden));
  $('speed').addEventListener('input',e=>{
    S.speed=speedAtStep(S.timelineMode,Number(e.target.value));
    S.modeSpeeds[S.timelineMode]=S.speed;
    updateTime(); // Changing the speed never unpauses the simulation.
  });
  $('today-btn').addEventListener('click',()=>{S.time=Date.now();updateTime();updateDetail();});
  document.addEventListener('pointerdown',e=>{
    if(!$('speed-popover').hidden && !$('speed-picker-wrap').contains(e.target))setSpeedPopover(false);
  });
  $('horizons-btn').addEventListener('click',alignHorizons);
  $('help-btn').addEventListener('click',()=>{$('help-modal').hidden=false;});
  $('help-close').addEventListener('click',()=>{$('help-modal').hidden=true;});
  $('help-confirm').addEventListener('click',()=>{$('help-modal').hidden=true;});
  $('help-modal').addEventListener('click',e=>{if(e.target===$('help-modal'))$('help-modal').hidden=true;});
  $('mobile-menu').addEventListener('click',()=>mobileSheets?.open('catalog'));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){setSpeedPopover(false);$('help-modal').hidden=true;mobileSheets?.close();}
    if(e.key==='/'&&!(e.target instanceof HTMLInputElement)){
      e.preventDefault();mobileSheets?.open('catalog');requestAnimationFrame(()=>$('search').focus());
    }
  });
}
function registerServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'})
    .catch(e=>console.info('Offline-Installation nicht verfügbar:',e.message)));
}
function loop(now){
  const d=Math.min(.12,Math.max(0,(now-(loop.prev||now))/1000));loop.prev=now;
  if(S.playing&&S.speed>0)S.time+=d*S.speed*86400000;
  try{renderer.draw(S.time,S.selected,S.settings);}
  catch(e){console.error('Renderfehler:',e);$('canvas-error').hidden=false;return;}
  if(now-lastTimeReadoutAt>=250){lastTimeReadoutAt=now;updateTime();}
  requestAnimationFrame(loop);
}
async function loadServerStatus(){
  try{const status=await fetchJSON('/api/status');
    if(!status.nasaContactConfigured){updateStatus('sbdb','offline','Kontakt fehlt');updateStatus('horizons','offline','Kontakt fehlt');}
  }catch{/* Server optional für reinen Offline-Katalog */}
}
async function init(){
  mobileSheets=initMobileSheets();initControls();registerServiceWorker();
  renderFilters(S);renderStatus(S.status);updateTime();
  try{
    const catalog=await loadCatalog();
    const missions=await fetchJSON('./data/catalog/probes.json').catch(error=>{
      console.warn('Missionsdaten nicht verfügbar:',error);return {objects:[]};
    });
    S.bodies=[...catalog.bodies,...(missions.objects||[])];
    if(!S.bodies.some(b=>b.id===S.selected))S.selected=S.bodies[0]?.id||null;
    updateStatus('catalog','ok',`${S.bodies.length} Objekte · v${catalog.version}`);
    updateCatalog();updateDetail();
  }catch(e){
    console.error('Lokaler Katalog:',e);
    updateStatus('catalog','offline','Laden fehlgeschlagen');
    $('canvas-error').hidden=false;
    $('canvas-error').textContent='Der lokale Himmelskörper-Katalog konnte nicht geladen werden: '+e.message;
    return;
  }
  try{
    renderer=new SolarRenderer($('space'),$('labels-canvas'),$('space-glow'),{onSelect:id=>selectBody(id,true),onClearSelect:clearSelection});
    renderer.setBodies(S.bodies);updateMode();updateDetail();requestAnimationFrame(loop);
  }catch(e){
    console.error(e);$('canvas-error').hidden=false;
    $('canvas-error').textContent='WebGL-Initialisierung fehlgeschlagen: '+e.message;
    const label=document.querySelector('.live-pill');if(label)label.textContent='WEBGL NICHT VERFÜGBAR';
    updateDetail();
  }
  loadServerStatus();loadSolar();loadSatellites();
}
init();
