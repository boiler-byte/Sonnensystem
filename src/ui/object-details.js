import { TYPES, HORIZONS_IDS, CATEGORY_COLORS } from '../data/bodies.js';
import { physicalStatIcon, thermometerIcon } from './physical-stat-icons.js';
import { esc, formatInt, formatDecimal, displayPeriod, displayA,
  displayTemperatureK, displayAtmosphericPressure, displaySurfaceGravity, displayMeanParentDistance } from './formatters.js';
const $=id=>document.getElementById(id);

function renderStat([title,value,icon]){
  return `<div class="stat"><span class="stat-label">${esc(title)}</span><div class="stat-value">${physicalStatIcon(icon)}<strong title="${esc(value)}">${esc(value)}</strong></div></div>`;
}
function renderTemperature(body){
  const mean=displayTemperatureK(body.temperatureMeanK===undefined?body.temperatureK:body.temperatureMeanK);
  const minimum=displayTemperatureK(body.temperatureMinK);
  const maximum=displayTemperatureK(body.temperatureMaxK);
  // Show only known extrema; missing measurements must not consume horizontal space.
  const extremes=[
    minimum==='—'?'':`<div class="temperature-extreme temperature-min"><small>Min.</small><div class="stat-value">${thermometerIcon('min')}<strong title="Minimum: ${esc(minimum)}">${esc(minimum)}</strong></div></div>`,
    maximum==='—'?'':`<div class="temperature-extreme temperature-max"><small>Max.</small><div class="stat-value">${thermometerIcon('max')}<strong title="Maximum: ${esc(maximum)}">${esc(maximum)}</strong></div></div>`
  ].filter(Boolean).join('');
  return `<div class="stat stat-temperature"><span class="stat-label">TEMPERATUR</span>
    <div class="temperature-values${extremes?' has-extremes':''}">
      <div class="stat-value temperature-mean">${thermometerIcon('mean')}<div class="temperature-mean-metric"><strong title="Mittelwert: ${esc(mean)}">${esc(mean)}</strong><small>Mittel</small></div></div>
      ${extremes?`<div class="temperature-extremes">${extremes}</div>`:''}
    </div></div>`;
}

/** Sequence used by the visible detail index and its previous/next buttons. */
export function detailNavigation(state){
  const current=state.bodies.find(body=>body.id===state.selected);
  if(!current)return {label:'— / —',previousId:null,nextId:null};
  const peers=state.bodies.filter(body=>body.type===current.type);
  const index=peers.findIndex(body=>body.id===current.id);
  if(index<0)return {label:'— / —',previousId:null,nextId:null};
  const enabled=peers.length>1;
  return {
    label:`${String(index+1).padStart(2,'0')} / ${String(peers.length).padStart(2,'0')}`,
    previousId:enabled?peers[(index+peers.length-1)%peers.length].id:null,
    nextId:enabled?peers[(index+1)%peers.length].id:null
  };
}

export function renderDetail(state,renderer,selectBody,onShowRelated){const byId=id=>state.bodies.find(x=>x.id===id);const b=byId(state.selected);
  const navigation=detailNavigation(state);
  $('detail-index').textContent=navigation.label;
  $('detail-prev').disabled=!navigation.previousId;
  $('detail-next').disabled=!navigation.nextId;
  if(!b){
    $('detail-type').textContent='KEINE AUSWAHL';
    $('detail-origin').textContent='SONNENSYSTEM';
    $('type-dot').style.background='transparent';
    $('detail-name').textContent='Kein Objekt ausgewählt';
    $('detail-description').textContent='Wähle einen Himmelskörper in der Szene oder im Katalog aus.';
    $('texture-credit').hidden=true;$('texture-credit').innerHTML='';
    $('hero-body').className='hero-body';
    $('editorial-content').innerHTML='';$('editorial-content').hidden=true;
    $('planet-view-actions').hidden=true;
    $('detail-scene-actions').hidden=true;
    $('stats-grid').innerHTML='';$('orbit-facts').innerHTML='';$('related').innerHTML='';
    $('horizons-btn').disabled=true;
    $('horizons-note').textContent='Wähle zunächst einen Himmelskörper aus.';
    return;
  }
  if(b.type==='probe'){
    $('detail-type').textContent='RAUMSONDE';$('type-dot').style.background=CATEGORY_COLORS[b.type]||b.color;
    $('detail-origin').textContent='NASA / MISSIONSDATEN';
    $('detail-name').textContent=b.name;
    $('detail-description').textContent=b.description;
    $('texture-credit').hidden=true;$('texture-credit').textContent='';
    $('planet-view-actions').hidden=true;
    $('detail-scene-actions').hidden=true;
    $('hero-body').className='hero-body rock';
    const date=b.launchDate.split('-').reverse().join('.');
    $('stats-grid').innerHTML=[['START',date,'launch'],['STATUS',b.missionStatus,'status']].map(renderStat).join('');
    $('orbit-facts').innerHTML=`<div><span>Ziele</span><b>${esc(b.targets)}</b></div><div><span>Position</span><b>Nicht dargestellt – keine Ephemeriden</b></div>`;
    $('related').innerHTML='';
    $('editorial-content').hidden=false;
    $('editorial-content').innerHTML=`<div class="editorial-references"><strong>MISSION / NASA</strong><a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener noreferrer">Offizielle Missionsdaten ↗</a></div>`;
    $('horizons-btn').disabled=true;
    $('horizons-note').textContent='Kein Positionsmodell vorhanden. Historische und laufende Flugbahnen werden nicht erfunden.';
    return;
  }
  $('detail-type').textContent=(TYPES[b.type]?.label||'Himmelskörper').toUpperCase();
  $('type-dot').style.background=CATEGORY_COLORS[b.type]||b.color;
  $('detail-origin').textContent=b.parentId===null?'ZENTRALGESTIRN':b.type==='satellite'?'KÜNSTLICHES OBJEKT':'SONNENSYSTEM';
  $('detail-name').textContent=b.name;
  $('detail-description').textContent=b.description||'Astronomischer Himmelskörper.';
  const credit=$('texture-credit');
  credit.hidden=b.type==='probe';
  credit.textContent=b.type==='probe'?'':'TEXTUR · Lokal: textures/standard (falls vorhanden)';
  // Structured editorial articles are independent of the astronomical data feed.
  const article=b.editorial;
  const extra=$('editorial-content');
  const sections=article?.sections||[],refs=article?.references||[];
  extra.hidden=!sections.length&&!refs.length;
  extra.innerHTML=sections.map(s=>`<section class="editorial-section"><h3>${esc(s.heading)}</h3><p>${esc(s.text)}</p></section>`).join('')+
    (refs.length?`<div class="editorial-references"><strong>QUELLEN</strong>${refs.map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>`).join('')}</div>`:'');
  $('detail-scene-actions').hidden=false;
  const centerButton=$('center-object-btn');
  // Follow is a single global toggle, not a property of the current selection.
  const following=renderer?.followEnabled===true;
  centerButton.disabled=!renderer;
  centerButton.classList.toggle('active',following);
  centerButton.setAttribute('aria-pressed',String(following));
  centerButton.setAttribute('aria-label',following?'Folgen ausschalten':'Ausgewähltem Objekt folgen');
  centerButton.title=following
    ? 'Folgen ausschalten (für alle Objekte)'
    : 'Folgen einschalten (auch bei Objektwechsel, Drehung und Zoom)';
  const planetActions=$('planet-view-actions'),planetButton=$('planet-view-btn');
  // An orbital moon opens its parent system; dwarfs can themselves be the
  // center of the isolated scene (e.g. Pluto with Charon and smaller moons).
  const systemCenter=b.type==='moon'?byId(b.parentId):b;
  const canOpenSystem=['planet','dwarf'].includes(systemCenter?.type);
  planetActions.hidden=!canOpenSystem;
  if(canOpenSystem){
    const active=renderer?.planetId===systemCenter.id;
    $('planet-view-title').textContent='Planetenansicht';
    planetButton.setAttribute('aria-label',`Planetenansicht · ${systemCenter.name}${active?' zentrieren':''}`);
    planetButton.classList.toggle('active',active);
    planetButton.setAttribute('aria-pressed',String(active));
  }
  const orb=$('hero-body');orb.className='hero-body '+(b.style||'rock');orb.style.setProperty('--planet-color',b.color);
  const stats=[ ['RADIUS',b.radiusKm?(b.radiusKm<1?`${formatInt(b.radiusKm*1000)} m`:`${formatInt(b.radiusKm)} km`):'—','radius'],
    [b.type==='satellite'?'HÖHE (ca.)':'GR. HALBACHSE',b.type==='satellite'&&b.a?`${formatInt(Math.max(0,b.a-6371))} km`:displayA(b),'orbit'],
    ['UMLAUFZEIT',displayPeriod(b.periodDays),'period'],
    ['EXZENTRIZITÄT',Number.isFinite(Number(b.e))?formatDecimal(b.e,4):'—','eccentricity'] ];
  if(b.type==='star'){
    stats[1]=['DURCHMESSER',`${formatInt(b.radiusKm*2)} km`,'diameter'];
    stats[2]=['OBJEKTTYP','G2V Stern','type'];
    stats[3]=['PHOTOSPHÄRE',b.temperatureK?`${formatInt(b.temperatureK)} K`:'—','photosphere'];
  }
  const physicalStats=[
    ['MITTL. ABSTAND',displayMeanParentDistance(b),'distance'],
    ['ATMOSPHÄRENDRUCK',displayAtmosphericPressure(b.atmosphericPressurePa),'pressure'],
    [b.type==='planet'&&['jupiter','saturn','uranus','neptune'].includes(b.id)?'GRAVITATION (1 BAR)':'OBERFLÄCHENGRAV.',displaySurfaceGravity(b.surfaceGravityMs2),'gravity']
  ];
  $('stats-grid').innerHTML=stats.map(renderStat).join('')+renderTemperature(b)+physicalStats.map(renderStat).join('');
  const parent=byId(b.parentId),incl=Number.isFinite(Number(b.i))?formatDecimal(b.i,2)+'°':'—';
  const orbitModelLabel={
    'mean-elements':'Mittlere Elemente · schematisch',
    'illustrative-catalog-orbit':'Katalogreferenz · Modellbahn',
    'schematic-binary-postdart':'Post-DART · schematische Begleiterbahn',
    'osculating-sample':'Historische Beispielbahn',
    'osculating-snapshot':'Oskulierende Elemente · schematische Bahn',
    'historical-perihelion':b.type==='comet'?'Historische Kometenbahn':'Historische Bahnelemente · schematisch'
  }[b.orbitModel];
  const physicalSource=b.dataSourceUrl?`<div><span>Physikdaten</span><b><a href="${esc(b.dataSourceUrl)}" target="_blank" rel="noopener noreferrer">NASA / NSSDCA ↗</a></b></div>`:'';
  const rangeSource=b.temperatureRangeSourceUrl?`<div><span>Temperaturbereich</span><b><a href="${esc(b.temperatureRangeSourceUrl)}" target="_blank" rel="noopener noreferrer">NASA – Extrema ↗</a></b></div>`:'';
  const distanceBasis=b.parentId && b.meanDistanceEstimated?`<div><span>Mittlerer Abstand</span><b>aus großer Halbachse (Modell)</b></div>`:'';
  $('orbit-facts').innerHTML=`<div><span>Umkreist</span><b>${esc(parent?.name||'—')}</b></div><div><span>Bahnneigung</span><b>${esc(incl)}</b></div><div><span>Datenquelle</span><b>${esc(b.source||'Startdatensatz')}</b></div>${distanceBasis}${physicalSource}${rangeSource}${orbitModelLabel?`<div><span>Bahnmodell</span><b>${esc(orbitModelLabel)}</b></div>`:''}`;
  const related=state.bodies.filter(x=>x.parentId===b.id).sort((a,c)=>c.radiusKm-a.radiusKm);
  $('related').innerHTML=related.length?`<span class="related-heading">ZUGEHÖRIGE OBJEKTE <small>${related.length}</small></span><div class="related-pills">${related.slice(0,5).map(x=>`<button type="button" data-related="${esc(x.id)}">${esc(x.name)} ↗</button>`).join('')}${related.length>5?`<button type="button" class="related-overflow" aria-label="Weitere ${related.length-5} zugehörige Objekte von ${esc(b.name)} im Katalog anzeigen" title="Alle Objekte von ${esc(b.name)} im Katalog ansehen">+${related.length-5} ↗</button>`:''}</div>`:'';
  for(const el of $('related').querySelectorAll('[data-related]'))el.addEventListener('click',()=>selectBody(el.dataset.related,true));
  const overflow=$('related').querySelector?.('.related-overflow');
  if(overflow && typeof onShowRelated==='function')overflow.addEventListener('click',()=>onShowRelated(b.name));
  const supported=Boolean(HORIZONS_IDS[b.id]&&b.id!=='sun');
  const button=$('horizons-btn');button.disabled=!supported||!renderer;button.innerHTML='<span>✦</span> JPL Horizons abgleichen <span class="button-arrow">↗</span>';
  if(!supported)$('horizons-note').textContent=b.orbitModel==='osculating-snapshot' || b.type==='tno'?
    'Schematische Keplerbahn aus katalogisierten Elementen; kein genauer Ephemeriden-Abgleich.':
    b.type==='asteroid'?'Für Asteroiden werden JPL-SBDB-Bahnelemente verwendet.':
    'Horizons-Abgleich für Planeten, Pluto und den Mond verfügbar.';
  else if(!renderer?.overrides?.has(b.id))$('horizons-note').textContent='NASA/JPL-Position für das gewählte Datum (00:00 UTC) abrufen.';
}

/** Persist the user's detail-tab preference across objects, scenes and reloads. */
export const DETAIL_TAB_STORAGE_KEY='sonnensystem-detail-tab';

export function restoreDetailTab(){
  let saved='daten'; // Fresh installations still open the Data tab by default.
  try {
    if(globalThis.localStorage?.getItem(DETAIL_TAB_STORAGE_KEY)==='wissen')saved='wissen';
  } catch { /* Storage may be unavailable or blocked; keep the default. */ }
  setDetailTab(saved,{persist:false});
}

/** Accessible two-tab interface, independent of the selected object. */
export function setDetailTab(tab,{persist=true}={}) {
  const current=tab==='wissen'?'wissen':'daten';
  for(const name of ['wissen','daten']) {
    const active=name===current;
    const button=$(`detail-tab-${name}`);
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
    $(`detail-${name}`).hidden=!active;
  }
  if(persist){
    try { globalThis.localStorage?.setItem(DETAIL_TAB_STORAGE_KEY,current); }
    catch { /* Tab switching must still work when local storage is blocked. */ }
  }
}
