import { HORIZONS_IDS, CATEGORY_COLORS } from './data/bodies.js';
import { loadCatalog, mergeLiveBodies } from './data/catalog.js';
import { clean, formatAsteroid } from './data/normalization.js';
import { availableLayerTypes, createViewSettings, ensureAvailableSelection, layerEnabled, layerPreset, layerSummary, updateLayerSelection } from './data/layers.js';
import { SolarRenderer } from './renderer/index.js';
import { fetchJSON } from './services/api.js';
import { fetchSolarBodies } from './services/solar-api.js';
import { fetchSatellites } from './services/celestrak-api.js';
import { fetchAsteroid, fetchHorizons } from './services/nasa-api.js';
import { dateISO } from './ui/formatters.js';
import { renderCatalog } from './ui/object-list.js';
import { detailNavigation, renderDetail, setDetailTab } from './ui/object-details.js';
import { syncSceneMode } from './ui/scene-mode.js';
import { syncControls, syncSpeedMode, speedAtStep, SPEED_MODES } from './ui/timeline.js';
import { renderStatus, changeStatus, notify } from './ui/status.js';
import { initMobileSheets } from './ui/bottom-sheet.js';

const $ = id => document.getElementById(id);
const viewSettings = {solar:createViewSettings('solar'),planet:createViewSettings('planet')};
const S = {
  bodies:[], selected:'earth', search:'', catalogPlanetOnly:false,
  playing:true, speed:SPEED_MODES.solar.defaultSpeed, timelineMode:'solar', modeSpeeds:{solar:SPEED_MODES.solar.defaultSpeed,planet:SPEED_MODES.planet.defaultSpeed}, time:Date.now(),
  viewSettings, settings:viewSettings.solar,
  status:{ catalog:['loading','Lädt ...'],solar:['loading','Verbinde'],sbdb:['idle','Auf Abruf'],celestrak:['loading','Verbinde'],horizons:['idle','Auf Abruf'] }
};
let renderer=null, mobileSheets=null, lastTimeReadoutAt=0;
const byId=id=>S.bodies.find(x=>x.id===id);
const updateCatalog=()=>{
  const planetId=renderer?.planetId||null;
  const toggle=$('catalog-planet-filter');
  toggle.hidden=!planetId;
  const pressed=Boolean(planetId && S.catalogPlanetOnly);
  toggle.classList.toggle('active',pressed);
  toggle.setAttribute('aria-pressed',String(pressed));
  const name=planetId?byId(planetId)?.name||'aktuellen Planeten':'aktuellen Planeten';
  toggle.setAttribute('aria-label',`Nur ${name} und zugehörige Objekte anzeigen`);
  toggle.title=pressed?`Filter für ${name} ausschalten`:`Nur ${name} und zugehörige Objekte anzeigen`;
  renderCatalog(S,selectBody,{planetId});
};
const updateDetail=()=>renderDetail(S,renderer,selectBody);
const updateStatus=(provider,state,label)=>changeStatus(S.status,provider,state,label);
const activeView = () => renderer?.planetId ? 'planet' : 'solar';
const updateMode=()=>{
  const view=activeView();
  S.settings=S.viewSettings[view]; // Distinct layer, orbit and label preferences per scene.
  S.settings.layers=ensureAvailableSelection(S.settings.layers,availableLayerTypes(S.bodies,view,renderer?.planetId),view);
  syncSceneMode(S,renderer);
  if(syncSpeedMode(S,view)) {
    setSpeedPopover(false);
    updateTime();
  }
  // Layer visibility belongs to the renderer; keep catalog selections intact.
  syncLightingControl();syncFourMoonsControl();syncLayers();syncOrbitControls();syncLabelControl();updateCatalog();updateDetail();
};
const updateTime=()=>syncControls(S);
function syncLayers(){
  const view=activeView(), selected=S.settings.layers;
  const available=new Set(availableLayerTypes(S.bodies,view,renderer?.planetId));
  const summary=layerSummary(selected);
  $('layer-btn').setAttribute('aria-label',`Objektlayer auswählen (${summary})`);
  $('layer-btn').title=selected.mode==='custom'
    ? 'Aktive Objektlayer: '+[...selected.types].join(', ')
    : (selected.mode==='all'?'Alle Objektkategorien':`Standardfilter (${view==='planet'?'Planetenansicht':'Sonnensystem'})`);
  $('layer-popover').setAttribute('aria-label',view==='planet'?'Objektlayer der Planetenansicht':'Objektlayer des Sonnensystems');
  $('layer-note').textContent=view==='planet'
    ? 'Standard: Planeten, Monde und Satelliten.'
    : 'Standard: Sterne und Planeten.';
  for(const check of document.querySelectorAll('[data-layer-type]')){
    const type=check.dataset.layerType;
    check.parentElement.hidden=!available.has(type);
    check.disabled=!available.has(type);
    check.checked=layerEnabled(selected,type);
    check.parentElement?.style.setProperty('--category-color',CATEGORY_COLORS[type]||'#E6EDF5');
  }
  for(const preset of document.querySelectorAll('[data-layer-preset]')){
    const active=preset.dataset.layerPreset===selected.mode;
    preset.classList.toggle('active',active);
    preset.setAttribute('aria-pressed',String(active));
  }
}
function setLayerPopover(open){
  $('layer-popover').hidden=!open;
  $('layer-btn').setAttribute('aria-expanded',String(open));
}
function syncOrbitControls(){
  for(const [id,setting] of [['orbit-visibility-btn','orbits'],['orbit-contrast-btn','orbitContrast'],['orbit-colors-btn','orbitColors']]){
    const enabled=S.settings[setting]!==false,button=$(id);
    button.setAttribute('aria-pressed',String(enabled));
    button.classList.toggle('active',enabled);
    button.querySelector('.orbit-toggle-indicator').textContent=enabled?'An':'Aus';
  }
}

function syncLabelControl(){
  const enabled=S.settings.labels!==false,button=$('toggle-labels');
  button.classList.toggle('active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.querySelector('.orbit-toggle-indicator').textContent=enabled?'An':'Aus';
}

function syncLightingControl(){
  const optimized=S.settings.lighting!=='realistic',button=$('toggle-lighting');
  button.classList.toggle('active',optimized);
  button.setAttribute('aria-pressed',String(optimized));
  button.querySelector('.orbit-toggle-indicator').textContent=optimized?'Optimiert':'Realistisch';
  button.title=`Beleuchtung: ${optimized?'Optimiert':'Realistisch'} (zum Wechseln klicken)`;
}

function syncFourMoonsControl(){
  const enabled=S.settings.fourMoons===true,button=$('toggle-four-moons');
  button.classList.toggle('active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.querySelector('.orbit-toggle-indicator').textContent=enabled?'An':'Aus';
  button.title=enabled?'Nur die vier größten Monde je Planet anzeigen':'Alle Monde je Planet anzeigen';
}

function changeLayers(next){
  if(next===S.settings.layers)return;
  S.settings.layers=next; // S.settings belongs only to the currently active scene.
  syncLayers();updateDetail(); // Catalog entries and selection remain layer-independent.
}

function mergeBodies(list){
  S.bodies=mergeLiveBodies(S.bodies,list);
  renderer?.setBodies(S.bodies);
  syncLayers();updateCatalog();updateDetail();
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
async function loadAsteroid(name,existing=null){
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
/** Planetary isolation also supports dwarf planets that have catalogued moons. */
function openPlanetScene(id){
  const center=byId(id);
  if(!center || !['planet','dwarf'].includes(center.type) || !renderer?.showPlanetSystem(id))return false;
  // When a dwarf system is opened, its central dwarf must be included in the
  // renderer mask even though ordinary planet-view defaults only include planets.
  if(center.type==='dwarf' && !layerEnabled(S.viewSettings.planet.layers,'dwarf')){
    const available=availableLayerTypes(S.bodies,'planet',id);
    S.viewSettings.planet.layers=updateLayerSelection(S.viewSettings.planet.layers,'dwarf',true,'planet',available);
  }
  return true;
}
function selectBody(id,focus=false){
  const body=byId(id);if(!body)return;
  if(renderer?.planetId && id!==renderer.planetId && body.parentId!==renderer.planetId){
    if(body.type==='planet'||body.type==='dwarf')openPlanetScene(body.id);
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
  $('layer-btn').addEventListener('click',()=>{
    const opening=$('layer-popover').hidden;
    if(opening)setSpeedPopover(false);
    setLayerPopover(opening);
  });
  for(const btn of document.querySelectorAll('[data-layer-preset]'))
    btn.addEventListener('click',()=>changeLayers(layerPreset(btn.dataset.layerPreset,activeView())));
  for(const input of document.querySelectorAll('[data-layer-type]'))
    input.addEventListener('change',()=>{
      const available=availableLayerTypes(S.bodies,activeView(),renderer?.planetId);
      const next=updateLayerSelection(S.settings.layers,input.dataset.layerType,input.checked,activeView(),available);
      changeLayers(next);syncLayers(); // Restore the last checkbox if it was the only active layer.
    });
  $('search').addEventListener('input',e=>{S.search=e.target.value;updateCatalog();});
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
      const next=e.key==='Home'?'wissen':e.key==='End'?'daten':tab.dataset.detailTab==='wissen'?'daten':'wissen';
      setDetailTab(next);$('detail-tab-'+next).focus();
    });
  }
  setDetailTab('wissen');
  for(const [id,setting] of [['orbit-visibility-btn','orbits'],['orbit-contrast-btn','orbitContrast'],['orbit-colors-btn','orbitColors']]){
    $(id).addEventListener('click',()=>{
      S.settings[setting]=!S.settings[setting];
      syncOrbitControls();
    });
  }
  syncOrbitControls();
  $('toggle-labels').addEventListener('click',()=>{S.settings.labels=!S.settings.labels;syncLabelControl();});
  syncLabelControl();
  $('toggle-lighting').addEventListener('click',()=>{
    S.settings.lighting=S.settings.lighting==='realistic'?'optimized':'realistic';
    syncLightingControl();
  });
  syncLightingControl();
  $('toggle-four-moons').addEventListener('click',()=>{
    S.settings.fourMoons=!S.settings.fourMoons;
    syncFourMoonsControl();
  });
  syncFourMoonsControl();
  $('reset-camera').addEventListener('click',()=>{renderer?.cycleCameraPerspective();updateMode();updateDetail();mobileSheets?.close();});
  $('planet-view-btn').addEventListener('click',()=>{
    const selected=byId(S.selected);
    // Moons open the parent planet (or dwarf-planet) system, not a moon-only scene.
    const center=selected?.type==='moon'?byId(selected.parentId):selected;
    if(!openPlanetScene(center?.id))return;
    S.selected=center.id;
    renderer.setSelected(center.id);
    setDetailTab('wissen');updateMode();updateCatalog();updateDetail();mobileSheets?.close();
  });
  $('play-btn').addEventListener('click',()=>{S.playing=!S.playing;updateTime();});
  $('speed-btn').addEventListener('click',()=>{
    const opening=$('speed-popover').hidden;
    if(opening)setLayerPopover(false); // One open panel at a time.
    setSpeedPopover(opening);
  });
  $('speed').addEventListener('input',e=>{
    S.speed=speedAtStep(S.timelineMode,Number(e.target.value));
    S.modeSpeeds[S.timelineMode]=S.speed;
    updateTime(); // Changing the speed never unpauses the simulation.
  });
  $('today-btn').addEventListener('click',()=>{S.time=Date.now();updateTime();updateDetail();});
  document.addEventListener('pointerdown',e=>{
    if(!$('speed-popover').hidden && !$('speed-picker-wrap').contains(e.target))setSpeedPopover(false);
    if(!$('layer-popover').hidden && !$('layer-picker-wrap').contains(e.target))setLayerPopover(false);
  });
  $('horizons-btn').addEventListener('click',alignHorizons);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(!$('speed-popover').hidden){setSpeedPopover(false);$('speed-btn').focus({preventScroll:true});return;}
      if(!$('layer-popover').hidden){setLayerPopover(false);$('layer-btn').focus({preventScroll:true});return;}
      setLayerPopover(false);mobileSheets?.close();
    }
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
  try{
    renderer.visibleFocusOffset=mobileSheets?.focusOffsetFor(renderer.canvas)??0;
    renderer.draw(S.time,S.selected,S.settings);
  }
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
    renderer=new SolarRenderer($('space'),$('labels-canvas'),$('space-glow'),{onSelect:id=>selectBody(id,true),onClearSelect:clearSelection});
    renderer.setBodies(S.bodies);updateMode();updateDetail();requestAnimationFrame(loop);
  }catch(e){
    console.error(e);$('canvas-error').hidden=false;
    $('canvas-error').textContent='WebGL-Initialisierung fehlgeschlagen: '+e.message;
    updateDetail();
  }
  loadServerStatus();loadSolar();loadSatellites();
}
init();
