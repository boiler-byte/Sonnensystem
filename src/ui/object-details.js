import { TYPES, HORIZONS_IDS, CATEGORY_COLORS } from '../data/bodies.js';
import { esc, formatInt, formatDecimal, displayPeriod, displayA } from './formatters.js';
const $=id=>document.getElementById(id);

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

export function renderDetail(state,renderer,selectBody){const byId=id=>state.bodies.find(x=>x.id===id);const b=byId(state.selected);
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
    $('stats-grid').innerHTML=`<div class="stat"><span>START</span><strong>${esc(date)}</strong></div><div class="stat"><span>STATUS</span><strong>${esc(b.missionStatus)}</strong></div>`;
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
  const stats=[ ['RADIUS',b.radiusKm?`${formatInt(b.radiusKm)} km`:'—'],
    [b.type==='satellite'?'HÖHE (ca.)':'GR. HALBACHSE',b.type==='satellite'&&b.a?`${formatInt(Math.max(0,b.a-6371))} km`:displayA(b)],
    ['UMLAUFZEIT',displayPeriod(b.periodDays)],
    ['EXZENTRIZITÄT',Number.isFinite(Number(b.e))?formatDecimal(b.e,4):'—'] ];
  if(b.type==='star'){stats[1]=['TEMPERATUR',b.temperatureK?`${formatInt(b.temperatureK)} K`:'—'];stats[2]=['DURCHMESSER',`${formatInt(b.radiusKm*2)} km`];stats[3]=['OBJEKTTYP','G2V Stern'];}
  $('stats-grid').innerHTML=stats.map(([title,value])=>`<div class="stat"><span>${esc(title)}</span><strong>${esc(value)}</strong></div>`).join('');
  const parent=byId(b.parentId),incl=Number.isFinite(Number(b.i))?formatDecimal(b.i,2)+'°':'—';
  const orbitModelLabel={
    'mean-elements':'Mittlere Elemente · schematisch',
    'osculating-sample':'Historische Beispielbahn',
    'historical-perihelion':'Historische Kometenbahn'
  }[b.orbitModel];
  $('orbit-facts').innerHTML=`<div><span>Umkreist</span><b>${esc(parent?.name||'—')}</b></div><div><span>Bahnneigung</span><b>${esc(incl)}</b></div><div><span>Datenquelle</span><b>${esc(b.source||'Startdatensatz')}</b></div>${orbitModelLabel?`<div><span>Bahnmodell</span><b>${esc(orbitModelLabel)}</b></div>`:''}`;
  const related=state.bodies.filter(x=>x.parentId===b.id).sort((a,c)=>c.radiusKm-a.radiusKm);
  $('related').innerHTML=related.length?`<span class="related-heading">ZU GEHÖRIGE OBJEKTE <small>${related.length}</small></span><div class="related-pills">${related.slice(0,5).map(x=>`<button data-related="${esc(x.id)}">${esc(x.name)} ↗</button>`).join('')}${related.length>5?`<span class="related-overflow">+${related.length-5}</span>`:''}</div>`:'';
  for(const el of $('related').querySelectorAll('[data-related]'))el.addEventListener('click',()=>selectBody(el.dataset.related,true));
  const supported=Boolean(HORIZONS_IDS[b.id]&&b.id!=='sun');
  const button=$('horizons-btn');button.disabled=!supported||!renderer;button.innerHTML='<span>✦</span> JPL Horizons abgleichen <span class="button-arrow">↗</span>';
  if(!supported)$('horizons-note').textContent=b.type==='asteroid'?'Für Asteroiden werden JPL-SBDB-Bahnelemente verwendet.':'Horizons-Abgleich für Planeten, Pluto und den Mond verfügbar.';
  else if(!renderer?.overrides?.has(b.id))$('horizons-note').textContent='NASA/JPL-Position für das gewählte Datum (00:00 UTC) abrufen.';
}

/** Accessible two-tab interface, independent of the selected object. */
export function setDetailTab(tab) {
  const current=tab==='daten'?'daten':'wissen';
  for(const name of ['wissen','daten']) {
    const active=name===current;
    const button=$(`detail-tab-${name}`);
    button.classList.toggle('active',active);
    button.setAttribute('aria-selected',String(active));
    button.tabIndex=active?0:-1;
    $(`detail-${name}`).hidden=!active;
  }
}
