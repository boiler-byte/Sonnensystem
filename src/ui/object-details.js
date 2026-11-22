import { TYPES, HORIZONS_IDS, CATEGORY_COLORS } from '../data/bodies.js';
import { physicalStatIcon, thermometerIcon } from './physical-stat-icons.js';
import {inheritedProbeLocation,rendererSelectionId} from '../data/probe-location.js';
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

/** Compare diameters against either Earth or the Moon, with a type-specific initial default. */
export function detailSizeComparison(body,byId,referenceOverride=null){
  if(!body||body.type==='probe')return null;
  const defaultId=body.id==='earth'?'moon':body.id==='moon'?'earth':
    body.type==='planet'||body.type==='dwarf'?'earth':'moon';
  const referenceId=['earth','moon'].includes(referenceOverride)?referenceOverride:defaultId;
  const reference=byId(referenceId);
  const selectedRadius=body.radiusKm,referenceRadius=reference?.radiusKm;
  const common={referenceId,referenceName:referenceId==='moon'?'Erdmond':(reference?.name||'Erde')};
  // Unknown and placeholder radii must not produce fictitious comparison circles.
  if(typeof selectedRadius!=='number'||!Number.isFinite(selectedRadius)||selectedRadius<=0||
    typeof referenceRadius!=='number'||!Number.isFinite(referenceRadius)||referenceRadius<=0)
    return {...common,valid:false};
  const maxRadius=Math.max(selectedRadius,referenceRadius);
  return {...common,valid:true,ratio:selectedRadius/referenceRadius,
    selectedPercent:100*selectedRadius/maxRadius,referencePercent:100*referenceRadius/maxRadius,
    referenceLarger:referenceRadius>selectedRadius,equal:selectedRadius===referenceRadius};
}

const sizeReferenceLabelClass=referenceId=>`hero-size-label hero-size-label-reference ${referenceId==='moon'?'is-moon':'is-earth'}`;
const genericHeroBodyClasses=body=>{
  if(!body)return 'hero-generic-body rock';
  const classes=['hero-generic-body'];
  if(body.id)classes.push(body.id);
  if(body.style&&body.style!==body.id)classes.push(body.style);
  else if(!body.style)classes.push('rock');
  return classes.join(' ');
};

function renderGenericSizeFigure(body,{message='' }={}){
  const legend=$('hero-size-legend'),genericPlot=$('hero-generic-plot'),plot=$('hero-size-plot');
  const note=$('hero-size-note'),ratioLabel=$('hero-size-ratio');
  const referenceName=$('hero-size-reference-name');
  // The selected-object label belongs to the diagram, not exclusively to
  // the size comparison. Only the reference control needs a valid comparison.
  $('hero-size-selected-name').textContent=body?.name||'';
  legend.hidden=!body;plot.hidden=true;ratioLabel.hidden=true;
  referenceName.hidden=true;referenceName.disabled=true;
  if(!body){
    genericPlot.hidden=true;note.hidden=false;note.textContent='Bitte ein Objekt auswählen.';
    return '';
  }
  $('hero-generic-body').className=genericHeroBodyClasses(body);
  genericPlot.hidden=false;note.hidden=true;note.textContent='';
  return message||`Generisches Schaubild für ${body.name}.`;
}

function renderSizeComparison(body,byId,referenceOverride=null){
  const legend=$('hero-size-legend'),genericPlot=$('hero-generic-plot'),plot=$('hero-size-plot');
  const note=$('hero-size-note'),ratioLabel=$('hero-size-ratio');
  const comparison=detailSizeComparison(body,byId,referenceOverride);
  if(!body)return renderGenericSizeFigure(null);
  if(!comparison)return renderGenericSizeFigure(body,{message:`Für ${body.name} ist kein Größenvergleich verfügbar.`});
  if(!comparison.valid)return renderGenericSizeFigure(body,{message:`Für ${body.name} ist kein Größenvergleich verfügbar, daher wird das generische Schaubild angezeigt.`});
  $('hero-size-selected-name').textContent=body.name;
  const referenceName=$('hero-size-reference-name');
  referenceName.textContent=comparison.referenceName;
  referenceName.className=sizeReferenceLabelClass(comparison.referenceId);
  const nextReference=comparison.referenceId==='moon'?'Erde':'Erdmond';
  referenceName.hidden=false;referenceName.disabled=false;
  referenceName.title=`Mit ${nextReference} vergleichen`;
  referenceName.setAttribute('aria-label',`Vergleichsreferenz: ${comparison.referenceName}. Zu ${nextReference} wechseln`);
  referenceName.setAttribute('aria-pressed',String(comparison.referenceId==='earth'));
  legend.hidden=false;genericPlot.hidden=true;note.hidden=true;ratioLabel.hidden=false;plot.hidden=false;
  plot.className='hero-size-plot is-'+comparison.referenceId+(comparison.referenceLarger?' reference-larger':'')+(comparison.equal?' same-size':'');
  plot.style.setProperty('--size-selected',`${comparison.selectedPercent.toFixed(6)}%`);
  plot.style.setProperty('--size-reference',`${comparison.referencePercent.toFixed(6)}%`);
  const ratio=comparison.ratio;
  const referenceGenitive=comparison.referenceId==='earth'?'der Erde':'des Erdmondes';
  const ratioText=comparison.equal?'Gleicher Durchmesser':ratio>=1?
    `Ø ${formatDecimal(ratio,ratio>=100?0:2)} × ${comparison.referenceName}`:
    `Ø ${formatDecimal(ratio*100,ratio<0.01?4:2)} % ${referenceGenitive}`;
  ratioLabel.textContent=ratioText;
  const microscopic=Math.min(comparison.selectedPercent,comparison.referencePercent)<2;
  ratioLabel.title=microscopic?'Sehr kleine Objekte sind als mindestens 2 Pixel großer Punkt markiert.':ratioText;
  return `Größenvergleich nach Durchmesser: ${body.name} gegen ${comparison.referenceName}. ${ratioText}.`+
    (microscopic?' Ein sehr kleines Objekt ist zur Sichtbarkeit als Punkt markiert.':'');
}

/** The chart is the near/far camera toggle. Expose its current mode to
 * assistive technology and CSS without a duplicate visible status label. */
export function syncDetailZoomAction(body,renderer,byId,description=''){
  const button=$('hero-body');
  const targetId=body ? (renderer?.planetId===body.id?body.id:rendererSelectionId(body,byId)) : null;
  const valid=Boolean(body && renderer && targetId!=null &&
    (!renderer.positions?.has || renderer.positions.has(targetId)));
  button.disabled=!valid;
  const mode=valid ? (renderer.detailZoomCurrentMode?.(targetId)||'far') : 'far';
  button.setAttribute('aria-pressed',String(valid && mode==='near'));
  button.setAttribute('data-detail-zoom',mode);
  if(!body){button.title='Kein Objekt ausgewählt';button.setAttribute('aria-label',button.title);return;}
  if(!valid){
    button.title=body.type==='probe'?'Keine numerischen Positionsdaten vorhanden':'Objekt in dieser Ansicht nicht verfügbar';
  }else{
    const target=targetId===body.id?body:byId(targetId);
    const next=mode==='near'?'Fernansicht – alle Umlaufbahnen':'Nahansicht – Objekt heranzoomen';
    button.title=`${body.name}${target && target.id!==body.id?' – '+target.name:''}: ${next} zeigen`;
  }
  button.setAttribute('aria-label',`${button.title}. Aktuelle Ansicht: ${mode==='near'?'nah':'fern'}. ${description}`);
}

/** Keep the chosen reference for subsequent objects without changing the zoom target. */
export function toggleDetailSizeReference(state){
  const byId=id=>state.bodies.find(body=>body.id===id);
  const body=byId(state.selected);
  const comparison=detailSizeComparison(body,byId,state.sizeReferenceId);
  if(!comparison?.valid)return false;
  state.sizeReferenceId=comparison.referenceId==='earth'?'moon':'earth';
  const description=renderSizeComparison(body,byId,state.sizeReferenceId);
  const hero=$('hero-body');
  hero.setAttribute('aria-label',`${hero.title}. ${description}`);
  return true;
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

/** Views containing an object: solar overview, each existing parent system,
 *  and finally the object's own view. Never invent missing parents or loop on
 *  malformed parent relationships from an imported catalog. */
export function detailSceneViews(body,bodies=[]){
  if(!body)return [];
  const byId=new Map(bodies.map(item=>[item.id,item]));
  const parents=[],seen=new Set([body.id]);
  for(let id=body.parentId;id && id!=='sun' && !seen.has(id);){
    const parent=byId.get(id);
    if(!parent)break;
    parents.unshift(id);
    seen.add(id);
    id=parent.parentId;
  }
  return [null,...parents,body.id];
}

export function nextDetailSceneId(body,bodies,currentSceneId=null){
  const views=detailSceneViews(body,bodies);
  if(!views.length)return undefined;
  const position=views.indexOf(currentSceneId??null);
  // If another object was selected in an unrelated local view, move to the
  // overview first instead of cycling through a system that cannot show it.
  return views[position<0?0:(position+1)%views.length];
}

export function detailSceneLabel(sceneId,bodies=[]){
  if(sceneId===null || sceneId===undefined)return 'Sonnensystem-Ansicht';
  const body=bodies.find(item=>item.id===sceneId);
  return `${body?.name||sceneId}-Ansicht`;
}

/** The details button indicates the CURRENT view; clicking cycles through all
 *  views where the selected object is available, including its own scene. */
export function syncDetailSceneAction(body,renderer,bodies=[]){
  const action=$('planet-view-actions'),button=$('planet-view-btn');
  const enabled=Boolean(body);
  action.hidden=!enabled;
  $('detail-scene-actions').hidden=!enabled;
  if(!enabled)return;
  const sceneId=renderer?.planetId??null;
  const nextId=nextDetailSceneId(body,bodies,sceneId);
  const currentLabel=detailSceneLabel(sceneId,bodies);
  const nextLabel=detailSceneLabel(nextId,bodies);
  const active=sceneId!==null;
  $('planet-view-title').textContent=currentLabel;
  button.setAttribute('aria-label',`${body.name}: aktuelle Ansicht ${currentLabel}. Weiter zu ${nextLabel}`);
  button.title=`Weiter zu ${nextLabel}`;
  button.setAttribute('data-current-scene',sceneId??'solar');
  button.setAttribute('data-next-scene',nextId??'solar');
  button.classList.toggle('active',active);
  button.setAttribute('aria-pressed',String(active));
}

export function renderDetail(state,renderer,selectBody,onShowRelated){const byId=id=>state.bodies.find(x=>x.id===id);const b=byId(state.selected);
  const navigation=detailNavigation(state);
  $('detail-index').textContent=navigation.label;
  $('detail-prev').disabled=!navigation.previousId;
  $('detail-next').disabled=!navigation.nextId;
  syncDetailSceneAction(b,renderer,state.bodies);
  if(!b){
    $('detail-type').textContent='KEINE AUSWAHL';
    $('detail-origin').textContent='SONNENSYSTEM';
    $('type-dot').style.background='transparent';
    $('detail-description').textContent='Wähle einen Himmelskörper in der Szene oder im Katalog aus.';
    $('texture-credit').hidden=true;$('texture-credit').innerHTML='';
    $('hero-body').className='hero-body';renderSizeComparison(null,byId);
    syncDetailZoomAction(null,renderer,byId);
    $('editorial-content').innerHTML='';$('editorial-content').hidden=true;
    $('stats-grid').innerHTML='';$('orbit-facts').innerHTML='';$('related').innerHTML='';
    $('horizons-btn').disabled=true;
    $('horizons-note').textContent='Wähle zunächst einen Himmelskörper aus.';
    return;
  }
  if(b.type==='probe'){
    $('detail-type').textContent='RAUMSONDE';$('type-dot').style.background=CATEGORY_COLORS[b.type]||b.color;
    $('detail-origin').textContent='NASA / MISSIONSDATEN';
    $('detail-description').textContent=b.description;
    $('texture-credit').hidden=true;$('texture-credit').textContent='';
    const location=inheritedProbeLocation(b,byId,state.time);
    const hero=$('hero-body');hero.className='hero-body';
    const description=renderSizeComparison(b,byId);
    syncDetailZoomAction(b,renderer,byId,description);
    const date=b.launchDate.split('-').reverse().join('.');
    $('stats-grid').innerHTML=[['START',date,'launch'],['STATUS',b.missionStatus,'status']].map(renderStat).join('');
    const distance=location?.distanceAu!=null?`${formatDecimal(location.distanceAu,3)} AE`:'—';
    $('orbit-facts').innerHTML=`<div><span>Ziele</span><b>${esc(b.targets)}</b></div>`+
      (location?`<div><span>Position</span><b>Wie ${esc(location.targetName)} (Katalogmodell)</b></div>`+
        `<div><span>Sonnenabstand</span><b id="probe-sun-distance">${esc(distance)} · wie ${esc(location.targetName)}</b></div>`:
        '<div><span>Position</span><b>Nicht dargestellt – keine Ephemeriden</b></div>');
    $('related').innerHTML='';
    $('editorial-content').hidden=false;
    $('editorial-content').innerHTML=`<div class="editorial-references"><strong>MISSION / NASA</strong><a href="${esc(b.sourceUrl)}" target="_blank" rel="noopener noreferrer">Offizielle Missionsdaten ↗</a></div>`;
    $('horizons-btn').disabled=true;
    $('horizons-note').textContent=location?`Die Kamera folgt ${location.targetName}. Die Sondenposition entspricht der Modellposition des Himmelskörpers; keine historische Ephemeride.`:'Kein Positionsmodell vorhanden. Historische und laufende Flugbahnen werden nicht erfunden.';
    return;
  }
  $('detail-type').textContent=(TYPES[b.type]?.label||'Himmelskörper').toUpperCase();
  $('type-dot').style.background=CATEGORY_COLORS[b.type]||b.color;
  $('detail-origin').textContent=b.parentId===null?'ZENTRALGESTIRN':b.type==='satellite'?'KÜNSTLICHES OBJEKT':'SONNENSYSTEM';
  $('detail-description').textContent=b.description||'Astronomischer Himmelskörper.';
  const credit=$('texture-credit');
  credit.hidden=b.type==='probe';
  credit.textContent=b.type==='probe'?'':'TEXTUR · Lokal: textures/mobile · textures/standard · textures/high (falls vorhanden)';
  // Structured editorial articles are independent of the astronomical data feed.
  const article=b.editorial;
  const extra=$('editorial-content');
  const sections=article?.sections||[],refs=article?.references||[];
  extra.hidden=!sections.length&&!refs.length;
  extra.innerHTML=sections.map(s=>`<section class="editorial-section"><h3>${esc(s.heading)}</h3><p>${esc(s.text)}</p></section>`).join('')+
    (refs.length?`<div class="editorial-references"><strong>QUELLEN</strong>${refs.map(r=>`<a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a>`).join('')}</div>`:'');
  const orb=$('hero-body');orb.className='hero-body';
  const sizeDescription=renderSizeComparison(b,byId,state.sizeReferenceId);
  syncDetailZoomAction(b,renderer,byId,sizeDescription);
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
    b.type==='asteroid'?'Asteroiden verwenden lokal katalogisierte Bahnelemente; kein Horizons-Abgleich verfügbar.':
    'Horizons-Abgleich für Planeten, Pluto und den Mond verfügbar.';
  else if(!renderer?.overrides?.has(b.id))$('horizons-note').textContent='NASA/JPL-Position für das gewählte Datum (00:00 UTC) abrufen.';
}

/** Refresh only the time-dependent spacecraft distance, not the entire detail panel. */
export function refreshProbeDistance(state){
  const selected=state.bodies.find(body=>body.id===state.selected);
  if(selected?.type!=='probe')return;
  const el=$('probe-sun-distance');if(!el)return;
  const location=inheritedProbeLocation(selected,id=>state.bodies.find(body=>body.id===id),state.time);
  if(location)el.textContent=`${location.distanceAu==null?'—':formatDecimal(location.distanceAu,3)+' AE'} · wie ${location.targetName}`;
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
