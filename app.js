import { INITIAL_BODIES, TYPES, FEATURED_IDS, HORIZONS_IDS, AU_KM, J2000 } from './data.js';
import { SolarRenderer } from './renderer.js';

const $ = id => document.getElementById(id);
const S = { bodies:INITIAL_BODIES.map(o=>({...o})), selected:'earth', filter:'all', search:'', playing:true, speed:10,
  time:Date.now(), settings:{orbits:true,labels:true}, status:{ solar:['loading','Verbinde'], sbdb:['idle','Auf Abruf'], celestrak:['loading','Verbinde'], horizons:['idle','Auf Abruf'] } };
const MAIN_TYPES=['star','planet','moon','dwarf','asteroid','satellite'];
const SPEEDS=[0,.5,10,30,100,365];
const NAME_MAP = { soleil:'sun',sun:'sun',mercure:'mercury',mercury:'mercury',venus:'venus',terre:'earth',earth:'earth',lune:'moon',moon:'moon',
 mars:'mars',jupiter:'jupiter',saturne:'saturn',saturn:'saturn',uranus:'uranus',neptune:'neptune',neptun:'neptune',pluton:'pluto',pluto:'pluto',
 ceres:'ceres',vesta:'vesta',pallas:'pallas',io:'io',europa:'europa',ganymede:'ganymede',ganymed:'ganymede',callisto:'callisto',kallisto:'callisto',
 titan:'titan',mimas:'mimas',enceladus:'enceladus',rhea:'rhea',iapetus:'iapetus',triton:'triton',charon:'charon',oberon:'oberon',titania:'titania',
 makemake:'makemake',haumea:'haumea',eris:'eris',phobos:'phobos',deimos:'deimos' };
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{let a=Number(v);return Number.isFinite(a)?a:null;};
const byId=id=>S.bodies.find(x=>x.id===id);
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const keyFor=s=>NAME_MAP[clean(s)]||clean(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const formatInt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(n);
const formatDecimal=(n,d=2)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:d}).format(n);
const formatDate=ms=>new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(ms));
const dateISO=ms=>new Date(ms).toISOString().slice(0,10);
const displayPeriod=days => !days?'—':days<1?`${formatDecimal(days*24,1)} Std.`:days>=730?`${formatDecimal(days/365.25,1)} Jahre`:`${formatDecimal(days,1)} Tage`;
const displayA=b=>!b.a?'—':(b.type==='moon'||b.type==='satellite')?`${formatInt(b.a)} km`:`${formatDecimal(b.a,3)} AE`;
const statusLabels = { solar:'Solar OpenData',sbdb:'NASA / SBDB',celestrak:'CelesTrak',horizons:'JPL Horizons' };
let renderer=null,noticeTimer=0,lastRenderedDay='';
function notify(message,isError=false){const t=$('toast');t.textContent=message;t.classList.toggle('error',isError);t.classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>t.classList.remove('show'),4600);}
function changeStatus(provider,state,label){S.status[provider]=[state,label];renderStatus();}
function renderStatus(){const host=$('source-status');host.innerHTML=Object.entries(statusLabels).map(([id,label])=>{
  const [status,text]=S.status[id];return `<div class="source-row"><span class="source-name"><i class="source-dot ${esc(status)}"></i>${esc(label)}</span><span class="source-value">${esc(text)}</span></div>`;
 }).join('');}
function fetchJSON(path){return fetch(path,{headers:{Accept:'application/json'}}).then(async res=>{let data;try{data=await res.json();}catch{throw Error('Serverantwort konnte nicht gelesen werden');}if(!res.ok)throw Error(data.error||`HTTP ${res.status}`);return data;});}
function mergeBodies(list){for(const fresh of list){const ix=S.bodies.findIndex(b=>b.id===fresh.id);if(ix>=0)S.bodies[ix]={...S.bodies[ix],...fresh};else S.bodies.push(fresh);}renderer?.setBodies(S.bodies);renderCatalog();renderDetail();}
function normalizeSolar(body){
  const rawType=clean(body.bodyType);
  const type=body.isPlanet?'planet':rawType.includes('moon')||rawType.includes('satellite')?'moon':rawType.includes('dwarf')?'dwarf':rawType.includes('asteroid')?'asteroid':null;
  if(!type)return null;
  const canonical=keyFor(body.englishName||body.id||body.name);if(!canonical)return null;
  const id=NAME_MAP[clean(body.id)]||canonical;
  const old=byId(id);
  let parentId=body.aroundPlanet?.planet?(NAME_MAP[clean(body.aroundPlanet.planet)]||keyFor(body.aroundPlanet.planet)):'sun';
  if(id==='sun')parentId=null;
  const aKm=num(body.semimajorAxis),radius=num(body.meanRadius)||num(body.equaRadius)||old?.radiusKm||5;
  const orbitDays=num(body.sideralOrbit),ecc=num(body.eccentricity),incl=num(body.inclination);
  const displayName=old?.name||body.englishName||body.name||body.id;
  const idHash=id.split('').reduce((s,c)=>s+c.charCodeAt(0),0);
  return {
    ...(old||{}), id,name:displayName,type,parentId, a:aKm&&aKm>0?(parentId==='sun'?aKm/AU_KM:aKm):(old?.a||0),
    periodDays:orbitDays&&orbitDays!==0?Math.abs(orbitDays):(old?.periodDays||28),radiusKm:radius,
    e:ecc??old?.e??0, i:incl??old?.i??0,node:num(body.longAscNode)??old?.node??0,
    peri:num(body.argPeriapsis)??old?.peri??0,M:num(body.mainAnomaly)??old?.M??idHash%360,
    epoch:old?.epoch||J2000,color:old?.color||(type==='moon'?'#c0b8a8':type==='dwarf'?'#bbb7bb':'#ad9786'),
    style:old?.style||(type==='moon'?'moon':type==='dwarf'?'ice':'rock'),
    description:old?.description||`${TYPES[type]?.label||'Himmelskörper'} im Sonnensystem. Bahn- und Körperdaten aus Solar System OpenData.`,
    temperatureK:num(body.avgTemp)??old?.temperatureK??null,
    source:'Solar System OpenData', solarId:body.id
  };
}
async function loadSolar(){try{const response=await fetchJSON('/api/bodies');const bodies=response.bodies.map(normalizeSolar).filter(Boolean);
  mergeBodies(bodies);changeStatus('solar','ok',`${bodies.length} Objekte`);notify(`${bodies.length} Himmelskörper aus Solar OpenData geladen`);
 }catch(e){changeStatus('solar','offline','Startdaten');console.info('Solar OpenData:',e.message);}}
function normalizeStation(o){const meanMotion=num(o.MEAN_MOTION),ecc=num(o.ECCENTRICITY),catalog=o.NORAD_CAT_ID;
 if(!(meanMotion>0&&meanMotion<30)||catalog==null)return null;
 const n=meanMotion*2*Math.PI/86400,semimajor=Math.cbrt(398600.4418/(n*n));
 const epoch=Date.parse(o.EPOCH+'Z')||Date.parse(o.EPOCH)||Date.now();
 const name=String(o.OBJECT_NAME||`Satellit ${catalog}`).trim();
 return {id:`sat-${catalog}`,name:catalog==25544?'ISS':name,type:'satellite',parentId:'earth',a:semimajor,
  periodDays:1/meanMotion,radiusKm:0,color:'#75d6c6',style:'rock',e:ecc||0,
  i:num(o.INCLINATION)||0,node:num(o.RA_OF_ASC_NODE)||0,peri:num(o.ARG_OF_PERICENTER)||0,M:num(o.MEAN_ANOMALY)||0,
  epoch,source:'CelesTrak',catalog:Number(catalog),description:`Künstlicher Erdsatellit aus den CelesTrak-General-Perturbations-Daten (NORAD ${catalog}). Die Darstellung verwendet eine vereinfachte Kepler-Näherung.`};
}
async function loadSatellites(){try{const response=await fetchJSON('/api/satellites');const satellites=response.satellites.map(normalizeStation).filter(Boolean);
  mergeBodies(satellites);changeStatus('celestrak','ok',`${satellites.length} Satelliten`);
 }catch(e){changeStatus('celestrak','offline','Nicht erreichbar');console.info('CelesTrak:',e.message);}}
function sbdbElements(response){const els=response.orbit?.elements||[];const values=Object.fromEntries(els.map(x=>[x.name,num(x.value)]));
  return values;
}
function formatAsteroid(response,id,name,existing){
  const v=sbdbElements(response);if(!(v.a>0)&&!existing)throw Error('Kein geeigneter elliptischer Orbit für dieses Objekt');
  const epochJD=num(response.orbit?.epoch),ep=epochJD?(epochJD-2440587.5)*86400000:(existing?.epoch||J2000);
  const phys=response.phys_par||[];const diam=num(phys.find(x=>x.name==='diameter')?.value);
  return { ...(existing||{}), id,name: existing?.name||name,type:'asteroid',parentId:'sun',a:v.a||existing?.a||1,
    periodDays:v.per||existing?.periodDays||365.25, radiusKm:diam?diam/2:(existing?.radiusKm||1),
    color:existing?.color||'#bb9e82',style:'rock',e:v.e??existing?.e??0,i:v.i??existing?.i??0,
    node:v.om??existing?.node??0,peri:v.w??existing?.peri??0,M:v.ma??existing?.M??0,
    epoch:ep,source:'NASA/JPL SBDB',sbdbLoaded:true,
    description:existing?.description||`${name} – Kleinkörper mit Bahnelementen der NASA/JPL Small-Body Database.` };
}
const inFlightAsteroids=new Set();
async function loadAsteroid(name,existing=null,addNew=false){const q=existing?.sbdbQuery||name;
  if(inFlightAsteroids.has(q))return;inFlightAsteroids.add(q);changeStatus('sbdb','loading','Lädt ...');
  if(addNew)notify(`Suche NASA/JPL: ${name}`);
  try{
    const data=await fetchJSON('/api/sbdb?sstr='+encodeURIComponent(q));
    const foundName=data.object?.shortname||data.object?.fullname||name;
    const id=existing?.id||('sbdb-'+clean(foundName).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
    const newBody=formatAsteroid(data,id,name,existing);mergeBodies([newBody]);changeStatus('sbdb','ok','Bahndaten geladen');
    if(addNew){selectBody(id,true);S.filter='all';S.search='';$('search').value='';renderFilters();renderCatalog();notify(`${name} wurde zum Atlas hinzugefügt`);}
    else if(S.selected===id)renderDetail();
  }catch(e){changeStatus('sbdb','offline','Abfrage fehlgeschlagen');notify('JPL SBDB: '+e.message,true);}
  finally{inFlightAsteroids.delete(q);}
}
async function alignHorizons(){const b=byId(S.selected),target=HORIZONS_IDS[b?.id];if(!target||b.id==='sun')return;
  const button=$('horizons-btn');button.disabled=true;button.innerHTML='<span>◌</span> Berechne Position ...';
  changeStatus('horizons','loading','Berechne ...');
  const date=dateISO(S.time);
  try{const data=await fetchJSON(`/api/horizons?target=${target}&date=${date}`);
    renderer.setOverride(b.id,date,[data.xKm,data.yKm,data.zKm]);
    S.playing=false;S.time=Date.parse(date+'T00:00:00Z');syncControls();
    renderer.calcPositions(S.time);renderer.focus(b.id);
    changeStatus('horizons','ok',`${date} · UTC`);
    $('horizons-note').textContent=`JPL-Vektor für ${date}, 00:00 UTC geladen. Position ist auf die schematische Szenenskala übertragen.`;
    notify(`JPL Horizons: ${b.name} abgeglichen`);
  }catch(e){changeStatus('horizons','offline','Nicht verfügbar');notify('JPL Horizons: '+e.message,true);}
  finally{renderDetail();}
}
function sortedBodies(){const query=clean(S.search);
  const list=S.bodies.filter(b=>(S.filter==='all'||b.type===S.filter)&&(!query||clean(b.name).includes(query)||clean(b.id).includes(query)||String(b.catalog||'').includes(query)));
  if(S.filter==='all'&&!query){list.sort((a,b)=>{const ia=FEATURED_IDS.indexOf(a.id),ib=FEATURED_IDS.indexOf(b.id);if(ia!==-1||ib!==-1)return ia===-1?1:ib===-1?-1:ia-ib;
      const ga=MAIN_TYPES.indexOf(a.type),gb=MAIN_TYPES.indexOf(b.type);return ga-gb||a.name.localeCompare(b.name,'de');});}
  else list.sort((a,b)=>a.name.localeCompare(b.name,'de'));
  return list;
}
function renderCatalog(){const list=sortedBodies();const host=$('object-list');host.innerHTML=list.map(b=>{
  const active=b.id===S.selected;const desc=b.parentId?byId(b.parentId)?.name||b.parentId:'Zentrum des Systems';
  return `<button class="object-row ${active?'selected':''}" role="option" aria-selected="${active}" data-id="${esc(b.id)}"><span class="object-symbol" style="--orb-color:${esc(b.color)}"></span><span class="object-copy"><span class="object-name">${esc(b.name)}</span><span class="object-sub">${esc(TYPES[b.type]?.label||'Objekt')} <i>·</i> ${esc(desc)}</span></span><span class="row-arrow">↗</span></button>`;
 }).join('') || '<div class="empty-results">Keine Objekte gefunden.<br>Versuche einen anderen Suchbegriff.</div>';
 $('object-count').textContent=String(list.length).padStart(2,'0');
 $('list-label').textContent=S.filter==='all'?'OBJEKTE IM ATLAS':TYPES[S.filter]?.plural.toUpperCase()||'OBJEKTE';
 for(const b of host.querySelectorAll('[data-id]'))b.addEventListener('click',()=>selectBody(b.dataset.id,true));
}
function renderFilters(){for(const b of document.querySelectorAll('[data-filter]'))b.classList.toggle('active',b.dataset.filter===S.filter);}
function selectBody(id,focus=false){const body=byId(id);if(!body)return;
  S.selected=id;renderer?.setSelected(id,{focus});renderCatalog();renderDetail();
  if(focus)mobileSheets?.open('detail');
  if(body.type==='asteroid'&&!body.sbdbLoaded)loadAsteroid(body.name,body);
}
function renderDetail(){const b=byId(S.selected);if(!b)return;
  const counts=S.bodies.filter(x=>x.type===b.type);const ordinal=Math.max(1,counts.findIndex(x=>x.id===b.id)+1);
  $('detail-index').textContent=`${String(ordinal).padStart(2,'0')} / ${String(counts.length).padStart(2,'0')}`;
  $('detail-type').textContent=(TYPES[b.type]?.label||'Himmelskörper').toUpperCase();
  $('type-dot').style.background=b.color;
  $('detail-origin').textContent=b.parentId===null?'ZENTRALGESTIRN':b.type==='satellite'?'KÜNSTLICHES OBJEKT':'SONNENSYSTEM';
  $('detail-name').textContent=b.name;
  $('detail-description').textContent=b.description||'Astronomischer Himmelskörper.';
  $('hero-target').textContent=b.id==='sun'?'SOL–000':b.type==='satellite'?`NORAD–${b.catalog||'?'}`:b.id.toUpperCase().slice(0,12);
  const orb=$('hero-body');orb.className='hero-body '+(b.style||'rock');orb.style.setProperty('--planet-color',b.color);
  const stats=[ ['RADIUS',b.radiusKm?`${formatInt(b.radiusKm)} km`:'—'],
    [b.type==='satellite'?'HÖHE (ca.)':'GR. HALBACHSE',b.type==='satellite'&&b.a?`${formatInt(Math.max(0,b.a-6371))} km`:displayA(b)],
    ['UMLAUFZEIT',displayPeriod(b.periodDays)],
    ['EXZENTRIZITÄT',Number.isFinite(Number(b.e))?formatDecimal(b.e,4):'—'] ];
  if(b.type==='star'){stats[1]=['TEMPERATUR',b.temperatureK?`${formatInt(b.temperatureK)} K`:'—'];stats[2]=['DURCHMESSER',`${formatInt(b.radiusKm*2)} km`];stats[3]=['OBJEKTTYP','G2V Stern'];}
  $('stats-grid').innerHTML=stats.map(([title,value])=>`<div class="stat"><span>${esc(title)}</span><strong>${esc(value)}</strong></div>`).join('');
  const parent=byId(b.parentId),incl=Number.isFinite(Number(b.i))?formatDecimal(b.i,2)+'°':'—';
  $('orbit-facts').innerHTML=`<div><span>Umkreist</span><b>${esc(parent?.name||'—')}</b></div><div><span>Bahnneigung</span><b>${esc(incl)}</b></div><div><span>Datenstand</span><b>${esc(b.source||'Startdatensatz')}</b></div>`;
  const related=S.bodies.filter(x=>x.parentId===b.id).sort((a,c)=>c.radiusKm-a.radiusKm);
  $('related').innerHTML=related.length?`<span class="related-heading">ZU GEHÖRIGE OBJEKTE <small>${related.length}</small></span><div class="related-pills">${related.slice(0,5).map(x=>`<button data-related="${esc(x.id)}">${esc(x.name)} ↗</button>`).join('')}${related.length>5?`<span class="related-overflow">+${related.length-5}</span>`:''}</div>`:'';
  for(const el of $('related').querySelectorAll('[data-related]'))el.addEventListener('click',()=>selectBody(el.dataset.related,true));
  const supported=Boolean(HORIZONS_IDS[b.id]&&b.id!=='sun');
  const button=$('horizons-btn');button.disabled=!supported||!renderer;button.innerHTML='<span>✦</span> JPL Horizons abgleichen <span class="button-arrow">↗</span>';
  if(!supported)$('horizons-note').textContent=b.type==='asteroid'?'Für Asteroiden werden JPL-SBDB-Bahnelemente verwendet.':'Horizons-Abgleich für Planeten, Pluto und den Mond verfügbar.';
  else if(!renderer?.overrides?.has(b.id))$('horizons-note').textContent='NASA/JPL-Position für das gewählte Datum (00:00 UTC) abrufen.';
}
function syncControls(){const iso=dateISO(S.time);$('date-input').value=iso;
  $('sim-date-readout').textContent=formatDate(S.time).toUpperCase();$('play-btn').textContent=S.playing?'Ⅱ':'▶';$('play-btn').setAttribute('aria-label',S.playing?'Simulation pausieren':'Simulation starten');
  $('speed-readout').textContent=S.speed===0?'Stillstand':`${formatDecimal(S.speed,1)} Tage / s`;
}
function initControls(){
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{S.filter=b.dataset.filter;renderFilters();renderCatalog();}));
  $('search').addEventListener('input',e=>{S.search=e.target.value;renderCatalog();});
  $('asteroid-form').addEventListener('submit',e=>{e.preventDefault();const name=$('asteroid-name').value.trim();if(!name)return;
    if(name.length>56){notify('Name ist zu lang',true);return;}loadAsteroid(name,null,true);$('asteroid-name').value='';});
  $('toggle-orbits').addEventListener('click',()=>{S.settings.orbits=!S.settings.orbits;$('toggle-orbits').classList.toggle('active',S.settings.orbits);});
  $('toggle-labels').addEventListener('click',()=>{S.settings.labels=!S.settings.labels;$('toggle-labels').classList.toggle('active',S.settings.labels);});
  $('reset-camera').addEventListener('click',()=>renderer.reset());
  $('play-btn').addEventListener('click',()=>{S.playing=!S.playing;if(S.speed===0&&S.playing){S.speed=10;$('speed').value=2;}syncControls();});
  $('speed').addEventListener('input',e=>{S.speed=SPEEDS[Number(e.target.value)];S.playing=S.speed>0;syncControls();});
  $('date-input').addEventListener('change',e=>{if(!e.target.value)return;const n=Date.parse(e.target.value+'T00:00:00Z');if(Number.isFinite(n)){S.time=n;S.playing=false;syncControls();}});
  $('today-btn').addEventListener('click',()=>{S.time=Date.now();S.playing=false;syncControls();renderer.reset();});
  $('horizons-btn').addEventListener('click',alignHorizons);
  $('help-btn').addEventListener('click',()=>{$('help-modal').hidden=false;});
  $('help-close').addEventListener('click',()=>{$('help-modal').hidden=true;});$('help-confirm').addEventListener('click',()=>{$('help-modal').hidden=true;});
  $('help-modal').addEventListener('click',e=>{if(e.target===$('help-modal'))$('help-modal').hidden=true;});
  $('mobile-menu').addEventListener('click',()=>mobileSheets?.open('catalog'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('help-modal').hidden=true;mobileSheets?.close();}
    if(e.key==='/'&&!(e.target instanceof HTMLInputElement)){e.preventDefault();mobileSheets?.open('catalog');requestAnimationFrame(()=>$('search').focus());}});
}
/** Mobile Google-Maps-style Bottom Sheet; die Desktop-Panels bleiben dieselben DOM-Elemente. */
let mobileSheets = null;
function initMobileSheets() {
  const mq = window.matchMedia('(max-width: 770px)');
  const sheet = $('mobile-sheet'), header = $('sheet-header'), content = $('sheet-content');
  const scrim = $('mobile-sheet-scrim'), handle = $('sheet-handle');
  const panels = {catalog:$('catalog'),detail:$('detail'),time:$('time-panel')};
  const anchors = Object.fromEntries(Object.entries(panels).map(([name,el])=>{
    const marker=document.createComment(`${name} desktop position`);
    el.parentNode.insertBefore(marker, el);
    return [name,marker];
  }));
  let panel='detail', snap='closed', isDragging=false, drag=null, suppressClickUntil=0;
  const mobile=()=>mq.matches;
  const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
  function levels(){
    const full=sheet.getBoundingClientRect().height;
    const closed=header.getBoundingClientRect().height;
    return {closed,half:clamp(window.innerHeight*.56,Math.min(closed+105,full),full),full};
  }
  function snapTo(next){
    snap=next;
    sheet.dataset.snap=next;
    sheet.style.setProperty('--sheet-visible',`${levels()[next]}px`);
    const expanded=next!=='closed';
    handle.setAttribute('aria-expanded',String(expanded));
    handle.setAttribute('aria-label',expanded?'Menü schließen oder weiter hochziehen':'Menü hochziehen');
    // Zum Schließen wieder auf die Bühne tippen: nur bei voller Ansicht abgedunkelt.
    scrim.hidden=!mobile()||next!=='full';
    content.inert=!expanded;
  }
  function showPanel(next){
    if(!panels[next])return;
    panel=next;
    for(const [name,el] of Object.entries(panels)){
      el.hidden=mobile()&&name!==next;
      el.classList.toggle('sheet-active',name===next&&mobile());
    }
    for(const btn of sheet.querySelectorAll('[data-sheet-panel]')){
      const selected=btn.dataset.sheetPanel===next;
      btn.classList.toggle('active',selected);
      btn.setAttribute('aria-pressed',String(selected));
    }
    content.scrollTop=0;
  }
  function open(next='detail'){
    if(!mobile())return;
    showPanel(next);
    if(snap==='closed')snapTo('half');
  }
  function close(){if(mobile())snapTo('closed');}
  function applyLayout(){
    if(mobile()){
      for(const el of Object.values(panels))content.append(el);
      showPanel(panel);
      snapTo(snap);
    }else{
      for(const [name,el] of Object.entries(panels)){
        anchors[name].parentNode.insertBefore(el,anchors[name].nextSibling);
        el.hidden=false;el.classList.remove('sheet-active');
      }
      scrim.hidden=true;content.inert=false;
      // Die Ansicht bleibt beim Wechsel zurück auf Desktop unberührt.
    }
  }
  for(const btn of sheet.querySelectorAll('[data-sheet-panel]')){
    btn.addEventListener('click',()=>{
      if(performance.now()<suppressClickUntil)return;
      open(btn.dataset.sheetPanel);
    });
  }
  handle.addEventListener('click',()=>{
    if(performance.now()<suppressClickUntil)return;
    snapTo(snap==='closed'?'half':snap==='half'?'full':'closed');
  });
  scrim.addEventListener('click',close);

  // Pointergesten auf dem gesamten Kopfbereich: nach oben öffnen, nach unten schließen.
  header.addEventListener('pointerdown',e=>{
    if(!mobile()||e.button!==0)return;
    drag={id:e.pointerId,startY:e.clientY,startVisible:levels()[snap],startSnap:snap,delta:0,started:performance.now()};
  });
  header.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dy=e.clientY-drag.startY;
    if(!isDragging&&Math.abs(dy)>7){
      isDragging=true;
      header.setPointerCapture(e.pointerId);
      sheet.classList.add('dragging');
    }
    if(!isDragging)return;
    e.preventDefault();
    drag.delta=dy;
    sheet.style.setProperty('--sheet-visible',`${clamp(drag.startVisible-dy,levels().closed,levels().full)}px`);
  });
  function finishDrag(e){
    if(!drag||e.pointerId!==drag.id)return;
    const moved=isDragging, diff=drag.delta, prior=drag.startSnap;
    drag=null;isDragging=false;
    sheet.classList.remove('dragging');
    if(!moved)return;
    const order=['closed','half','full'];
    let choice=prior;
    if(Math.abs(diff)>35){choice=order[clamp(order.indexOf(prior)+(diff<0?1:-1),0,2)];}
    else{
      const current=parseFloat(sheet.style.getPropertyValue('--sheet-visible'));
      choice=order.reduce((best,key)=>Math.abs(levels()[key]-current)<Math.abs(levels()[best]-current)?key:best,order[0]);
    }
    snapTo(choice);
    suppressClickUntil=performance.now()+240;
    if(header.hasPointerCapture(e.pointerId))header.releasePointerCapture(e.pointerId);
  }
  header.addEventListener('pointerup',finishDrag);
  header.addEventListener('pointercancel',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    drag=null;isDragging=false;sheet.classList.remove('dragging');snapTo(snap);
  });
  mq.addEventListener('change',applyLayout);
  window.addEventListener('resize',()=>{if(mobile()&&!isDragging)snapTo(snap);});
  applyLayout();
  return {open,close};
}
function registerServiceWorker(){
  if(!('serviceWorker' in navigator))return;
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'})
    .catch(e=>console.info('Offline-Installation nicht verfügbar:',e.message)));
}
function loop(now){const d=Math.min(0.12,Math.max(0,(now-(loop.prev||now))/1000));loop.prev=now;
  if(S.playing&&S.speed>0)S.time+=d*S.speed*86400000;
  try{renderer.draw(S.time,S.selected,S.settings);}catch(e){console.error('Renderfehler:',e);$('canvas-error').hidden=false;return;}
  const day=dateISO(S.time);if(day!==lastRenderedDay){lastRenderedDay=day;syncControls();}
  requestAnimationFrame(loop);
}
async function loadServerStatus(){
  try{const s=await fetchJSON('/api/status');
    if(!s.nasaContactConfigured){changeStatus('sbdb','offline','Kontakt fehlt');changeStatus('horizons','offline','Kontakt fehlt');}
  }catch{/* Server optional fuer reinen Offline-Katalog */}
}
function init(){mobileSheets=initMobileSheets();initControls();registerServiceWorker();renderFilters();renderCatalog();renderStatus();syncControls();
  try{renderer=new SolarRenderer($('space'),$('labels-canvas'),$('space-glow'),{onSelect:id=>selectBody(id,true)});
    renderer.setBodies(S.bodies);renderDetail();requestAnimationFrame(loop);
  }catch(e){console.error(e);$('canvas-error').hidden=false;$('canvas-error').textContent='WebGL-Initialisierung fehlgeschlagen: '+e.message;const label=document.querySelector('.live-pill');if(label)label.textContent='WEBGL NICHT VERFÜGBAR';renderDetail();}
  loadServerStatus();loadSolar();loadSatellites();
}
init();
