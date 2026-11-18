import { HORIZONS_IDS, CATEGORY_COLORS } from './data/bodies.js';
import { loadCatalog, mergeLiveBodies } from './data/catalog.js';
import { clean, formatAsteroid } from './data/normalization.js';
import { availableLayerTypes, createViewSettings, displayMatchesPreset, displayPreset, ensureAvailableSelection, layerEnabled, layerPreset, layerSummary, updateLayerSelection } from './data/layers.js';
import { SolarRenderer } from './renderer/index.js';
import { cinemaClock } from './renderer/cinema.js';
import { createARMode } from './renderer/ar-mode.js';
import { fetchJSON } from './services/api.js';
import { fetchSolarBodies } from './services/solar-api.js';
import { fetchSatellites } from './services/celestrak-api.js';
import { fetchAsteroid, fetchHorizons } from './services/nasa-api.js';
import { dateISO } from './ui/formatters.js';
import { renderCatalog } from './ui/object-list.js';
import { detailNavigation, renderDetail, setDetailTab } from './ui/object-details.js';
import { syncSceneMode } from './ui/scene-mode.js';
import { syncControls, syncSpeedMode, speedAtStep, SPEED_MODES } from './ui/timeline.js';
import { renderStatus, changeStatus, notify, notifyToggle } from './ui/status.js';
import { initMobileSheets } from './ui/bottom-sheet.js';

const $ = id => document.getElementById(id);
const viewSettings = {solar:createViewSettings('solar'),planet:createViewSettings('planet')};
const S = {
  bodies:[], selected:'earth', search:'', catalogPlanetOnly:false,
  playing:true, speed:SPEED_MODES.solar.defaultSpeed, timelineMode:'solar', modeSpeeds:{solar:SPEED_MODES.solar.defaultSpeed,planet:SPEED_MODES.planet.defaultSpeed}, time:Date.now(),
  viewSettings, settings:viewSettings.solar,
  status:{ catalog:['loading','Lädt ...'],solar:['loading','Verbinde'],sbdb:['idle','Auf Abruf'],celestrak:['loading','Verbinde'],horizons:['idle','Auf Abruf'] }
};
let renderer=null, mobileSheets=null, arMode=null, lastTimeReadoutAt=0;
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
  if(renderer)renderer.settings=S.settings;
  S.settings.layers=ensureAvailableSelection(S.settings.layers,availableLayerTypes(S.bodies,view,renderer?.planetId),view);
  syncSceneMode(S,renderer,arMode?.active);
  if(syncSpeedMode(S,view)) {
    setSpeedPopover(false);
    updateTime();
  }
  // Layer visibility belongs to the renderer; keep catalog selections intact.
  syncLightingControl();syncFourMoonsControl();syncLayers();syncOrbitControls();syncLabelControl();syncScaleControls();syncRowControl();syncCinemaControl();
  if(renderer?.transition?.kind==='view' && !S.settings.row)
    renderer.setCameraAngles?.(.63,renderer.planetId?.84:.99);
  if(renderer?.settings?.row && !renderer.focusedBodyId && !renderer.followEnabled){
    renderer.camera.desiredTarget=renderer.rowFrame().target;renderer.camera.desiredDist=renderer.rowDistance();
    renderer.setCameraAngles?.(0,1.5);
  }
  renderer?.calcPositions(S.time);updateCatalog();updateDetail();
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
  for(const check of document.querySelectorAll('[data-layer-type]')){
    const type=check.dataset.layerType;
    check.parentElement.hidden=!available.has(type);
    check.disabled=!available.has(type);
    check.checked=layerEnabled(selected,type);
    check.parentElement?.style.setProperty('--category-color',CATEGORY_COLORS[type]||'#E6EDF5');
  }
  for(const preset of document.querySelectorAll('[data-layer-preset]')){
    const active=preset.dataset.layerPreset===selected.mode
      && displayMatchesPreset(S.settings,preset.dataset.layerPreset,view);
    preset.classList.toggle('active',active);
    preset.setAttribute('aria-pressed',String(active));
  }
}
function setLayerPopover(open){
  $('layer-popover').hidden=!open;
  $('layer-btn').setAttribute('aria-expanded',String(open));
}
function syncScaleControls(){
  for(const [id,key,label] of [['scale-objects-btn','scaleObjects','Objektgrößen'],['scale-orbits-btn','scaleOrbits','Bahnabstände']]){
    const button=$(id),enabled=S.settings[key]===true;
    button.classList.toggle('active',enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.title=`${label}: ${enabled?'maßstabsgetreu':'schematisch'}`;
  }
}
function updateScale(setting){
  if(renderer?.cinema?.active)renderer.stopCinema();
  // In the isolated planet view, collapsing physical orbit spacing should
  // sweep smoothly from the inner orbits outwards, without spring overshoot.
  const planetOrbitCollapse=setting==='scaleOrbits' && S.settings.scaleOrbits===true
    && Boolean(renderer?.planetId) && S.settings.row!==true;
  renderer?.beginTransition?.(planetOrbitCollapse?'planet-orbits-off':'scale');
  const next=!S.settings[setting];
  // Both scene modes share the same independent scale toggles.
  S.viewSettings.solar[setting]=next;
  S.viewSettings.planet[setting]=next;
  syncScaleControls();syncCinemaControl();
  const optimized=S.settings.scaleObjects && !S.settings.scaleOrbits && !renderer?.planetId;
  notifyToggle(optimized ? 'Maßstab: Optimierte Größenverhältnisse'
    : `${setting==='scaleObjects'?'Objekt':'Bahn'}: ${next?'Maßstabsgetreu':'Schematisch'}`);
  if(renderer){
    renderer._labelState=null;
    renderer.calcPositions(S.time);
    // A scale change always returns home, including after manual pan/zoom,
    // object focus or follow. The existing scale transition animates this move.
    renderer.resetViewCamera();
  }
}
function syncRowControl(){
  const enabled=S.settings.row===true,button=$('orbit-row-btn');
  button.classList.toggle('active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.title=`Reihe: ${enabled?'An – nach Größe sortiert':'Aus – Umlaufbahnen'}`;
}
function updateRow(){
  if(renderer?.cinema?.active)renderer.stopCinema();
  renderer?.beginTransition?.('row');
  const enabled=!S.settings.row;
  // Entry to the lineup always starts with true physical object proportions.
  // Both scenes share these scale toggles; manual changes while in the row
  // remain possible and leaving the row keeps the chosen object scale.
  if(enabled && !S.settings.scaleObjects){
    S.viewSettings.solar.scaleObjects=true;
    S.viewSettings.planet.scaleObjects=true;
    syncScaleControls();
  }
  S.settings.row=enabled;
  syncRowControl();syncCinemaControl();
  notifyToggle(`Reihe: ${enabled?'An (groß nach klein)':'Aus (Umlaufbahnen)'}`);
  if(!renderer)return;
  renderer._labelState=null;
  if(enabled){
    renderer._rowPreviousAngles=[renderer.camera.theta,renderer.camera.phi];
    renderer.setCameraAngles?.(0,1.5);
    renderer.cameraPresetIndex=2;
    renderer.cameraManuallyMoved=false;
  }else{
    const previous=renderer._rowPreviousAngles||[.63,renderer.planetId?.84:.99];
    renderer.setCameraAngles?.(...previous);
    renderer.cameraPresetIndex=0;
    renderer.cameraManuallyMoved=false;
  }
  renderer.callbacks?.onCameraChange?.();
  renderer.calcPositions(S.time);
  if(!renderer.followEnabled && !renderer.focusedBodyId){
    renderer.camera.desiredTarget=enabled?renderer.rowFrame().target:[0,0,0];
    renderer.camera.desiredDist=enabled?renderer.rowDistance()
      : renderer.planetId?renderer.planetFrameDistance():renderer.solarOverviewDistance();
  }else if(renderer.focusedBodyId)renderer.focus(renderer.focusedBodyId);
  if(renderer.followEnabled)renderer.followSelectedBody();
}
/** Cinema is available for the physical-size lineup without scaled orbits. */
function syncCinemaControl(){
  const available=Boolean(renderer && S.settings.row && S.settings.scaleObjects && !S.settings.scaleOrbits);
  const active=Boolean(renderer?.cinema?.active);
  const button=$('cinema-btn');
  button.hidden=!available;
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
  button.setAttribute('aria-label',active?'Cinema-Kamerafahrt stoppen':'Cinema-Kamerafahrt starten');
  button.title=active?'Cinema stoppen und zur Ausgangsansicht zurückkehren':'Cinema-Modus starten: von klein nach groß';
  $('view-mode-status').classList.toggle('cinema-available',available);
  $('cinema-timeline').hidden=!active;
  if(!active)$('cinema-seek').value='0';
}
function updateCinemaTimeline({active,progress=0,durationMs=0,objectId=null}){
  syncCinemaControl();
  if(!active)return;
  const seek=$('cinema-seek');
  if(!renderer?.cinema?.seeking)seek.value=String(Math.round(progress*1000));
  seek.setAttribute('aria-valuetext',`${Math.round(progress*100)} Prozent${objectId?', '+(byId(objectId)?.name||objectId):''}`);
  $('cinema-time').textContent=`${cinemaClock(durationMs*progress)} / ${cinemaClock(durationMs)}`;
  $('cinema-object').textContent=objectId?`Cinema · ${byId(objectId)?.name||objectId}`:'Cinema-Modus';
}
function syncOrbitControls(){
  for(const [id,setting] of [['orbit-visibility-btn','orbits'],['orbit-contrast-btn','orbitContrast']]){
    const enabled=S.settings[setting]!==false,button=$(id);
    button.setAttribute('aria-pressed',String(enabled));
    button.classList.toggle('active',enabled);
    const label={orbits:'Umlaufbahn',orbitContrast:'Kontrast'}[setting];
    button.title=`${label}: ${enabled?'An':'Aus'}`;
  }
}

function syncLabelControl(){
  const enabled=S.settings.labels!==false,button=$('toggle-labels');
  button.classList.toggle('active',enabled);
  button.setAttribute('aria-pressed',String(enabled));
  button.title=`Beschriftung: ${enabled?'An':'Aus'}`;
}

function syncLightingControl(){
  // The on/off switch controls realistic lighting; optimized remains the default when off.
  const realistic=S.settings.lighting==='realistic',button=$('toggle-lighting');
  button.classList.toggle('active',realistic);
  button.setAttribute('aria-pressed',String(realistic));
  button.title=`Beleuchtung: ${realistic?'An (Realistisch)':'Aus (Optimiert)'} (zum Wechseln klicken)`;
}

function syncFourMoonsControl(){
  // Internally fourMoons still means a cap. UI is inverted: OFF = four,
  // ON = all natural moons, preserving prior default scene content.
  const showAll=S.settings.fourMoons===false,button=$('toggle-four-moons');
  button.classList.toggle('active',showAll);
  button.setAttribute('aria-pressed',String(showAll));
  button.title=showAll?'Alle Monde: An (ohne Vierer-Begrenzung)':'Alle Monde: Aus (maximal vier Monde je Planet)';
}

function changeLayers(next){
  if(next===S.settings.layers)return;
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.settings.row)renderer?.beginTransition?.('row');
  S.settings.layers=next; // Presets affect only the current scene, not the other view.
  if(S.settings.row && renderer){renderer.calcPositions(S.time);renderer.camera.desiredTarget=renderer.rowFrame().target;renderer.camera.desiredDist=renderer.rowDistance();}
  syncLayers();updateDetail(); // Catalog entries and selection remain layer-independent.
}
function applyDisplayPreset(name){
  // Only the current scene's five presentation controls are affected.
  Object.assign(S.settings,displayPreset(name,activeView()));
  if(renderer){
    renderer._labelState=null;
    if(S.settings.row){
      renderer.calcPositions(S.time);
      renderer.camera.desiredTarget=renderer.rowFrame().target;
      renderer.camera.desiredDist=renderer.rowDistance();
    }
  }
  syncLabelControl();syncLightingControl();syncFourMoonsControl();syncOrbitControls();
  syncLayers();updateDetail();
}

function mergeBodies(list){
  if(renderer?.cinema?.active)renderer.stopCinema();
  if(S.settings.row)renderer?.beginTransition?.('row');
  S.bodies=mergeLiveBodies(S.bodies,list);
  renderer?.setBodies(S.bodies);
  if(S.settings.row && renderer){renderer.calcPositions(S.time);renderer.camera.desiredTarget=renderer.rowFrame().target;renderer.camera.desiredDist=renderer.rowDistance();}
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
  if(renderer?.cinema?.active)renderer.stopCinema();
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
  updateCatalog();updateDetail();
  if(focus)mobileSheets?.open('detail');
  if(body.type==='asteroid'&&!body.sbdbLoaded)loadAsteroid(body.name,body);
}
function clearSelection(){
  if(renderer?.cinema?.active)renderer.stopCinema();
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
  for(const [id,setting] of [['scale-objects-btn','scaleObjects'],['scale-orbits-btn','scaleOrbits']])
    $(id).addEventListener('click',()=>updateScale(setting));
  syncScaleControls();
  $('orbit-row-btn').addEventListener('click',updateRow);syncRowControl();syncCinemaControl();
  $('cinema-btn').addEventListener('click',()=>{
    if(!renderer)return;
    if(renderer.cinema?.active){renderer.stopCinema();notifyToggle('Cinema: Beendet – Reihe wieder groß nach klein');return;}
    if(arMode?.active||arMode?.pending)arMode.stop(); // Sensor look cannot override the movie camera.
    if(renderer.startCinema())notifyToggle('Cinema: Kamerafahrt von klein nach groß');
  });
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
  for(const [id,setting] of [['orbit-visibility-btn','orbits'],['orbit-contrast-btn','orbitContrast']]){
    $(id).addEventListener('click',()=>{
      S.settings[setting]=!S.settings[setting];
      syncOrbitControls();syncLayers();
      notifyToggle(`${setting==='orbits'?'Umlaufbahn':'Kontrast'}: ${S.settings[setting]?'An':'Aus'}`);
    });
  }
  syncOrbitControls();
  $('toggle-labels').addEventListener('click',()=>{S.settings.labels=!S.settings.labels;syncLabelControl();syncLayers();notifyToggle(`Beschriftung: ${S.settings.labels?'An':'Aus'}`);});
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
    if(S.settings.row && renderer){renderer.calcPositions(S.time);renderer.camera.desiredTarget=renderer.rowFrame().target;renderer.camera.desiredDist=renderer.rowDistance();}
    syncFourMoonsControl();syncLayers();
    notifyToggle(`Alle Monde: ${S.settings.fourMoons?'Aus (max. 4)':'An (alle)'}`);
  });
  syncFourMoonsControl();
  $('center-object-btn').addEventListener('click',()=>{
    const body=byId(S.selected);
    if(!body || body.type==='probe' || !renderer)return;
    // Activating Folgen for an orbiter starts in its parent's (dwarf)planet
    // scene. Keep the child selected so that tracking targets the child,
    // rather than the parent. Switching the toggle off never changes scenes.
    if(!renderer.followEnabled){
      const parent=byId(body.parentId);
      if(['planet','dwarf'].includes(parent?.type) && renderer.planetId!==parent.id && openPlanetScene(parent.id))
        updateMode();
    }
    renderer.follow(body.id); // Global An/Aus: follow stays on across selections.
    updateDetail();
  });
  $('reset-camera').addEventListener('click',()=>{
    if(arMode?.active){
      // Keep the planet scene and the AR sensor session; only change the view.
      renderer?.cycleCameraPerspective({keepPlanetScene:true});
      arMode.alignToPerspective();
      syncSceneMode(S,renderer,true);updateDetail();mobileSheets?.close();
      return;
    }
    if(renderer?.cinema?.active)renderer.stopCinema(); // Normal reset also ends Cinema.
    const leavingPlanet=Boolean(renderer?.planetId);
    renderer?.cycleCameraPerspective();
    if(leavingPlanet)updateMode(); // Only scene exits require a full view refresh.
    else syncSceneMode(S,renderer,false); // Do not overwrite row camera angles.
    updateDetail();mobileSheets?.close();
  });
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
    if(opening)setLayerPopover(false); // Only one popover is open at a time.
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
      if(renderer?.cinema?.active){renderer.stopCinema();$('cinema-btn').focus({preventScroll:true});return;}
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
    renderer=new SolarRenderer($('space'),$('labels-canvas'),$('space-glow'),{onSelect:id=>selectBody(id,true),onClearSelect:clearSelection,onFollowChange:()=>updateDetail(),onCinemaChange:updateCinemaTimeline,
      onCameraChange:()=>syncSceneMode(S,renderer,arMode?.active)});
    arMode=createARMode(renderer,$('ar-mode-btn'),{notify:notifyToggle,onStateChange:active=>{
      if(active && renderer?.cinema?.active)renderer.stopCinema();
      syncSceneMode(S,renderer,active);syncCinemaControl();
    }});
    renderer.setBodies(S.bodies);updateMode();updateDetail();requestAnimationFrame(loop);
  }catch(e){
    console.error(e);$('canvas-error').hidden=false;
    $('canvas-error').textContent='WebGL-Initialisierung fehlgeschlagen: '+e.message;
    updateDetail();
  }
  loadServerStatus();loadSolar();loadSatellites();
}
init();
