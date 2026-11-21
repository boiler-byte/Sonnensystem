import { TYPES, FEATURED_IDS, CATEGORY_COLORS, AU_KM } from '../data/bodies.js';
import { clean } from '../data/normalization.js';
import { esc, formatInt, formatDecimal } from './formatters.js';
const $=id=>document.getElementById(id);
const MAIN_TYPES=['star','planet','moon','dwarf','tno','asteroid','binary','comet','satellite','probe'];
const TYPE_ORDER = new Map(['planet','dwarf','moon','star','tno','asteroid','binary','comet','satellite','probe'].map((type,index)=>[type,index]));

// Distance sorting always uses AU internally. Without a query or planet filter,
// moons, binary-asteroid companions and artificial satellites share the distance
// of their parent system from the Sun, not their short orbit around the parent.
export const CATALOG_SORT_MODES=Object.freeze(['default','distance','size']);
export const nextCatalogSort=mode=>CATALOG_SORT_MODES[(Math.max(0,CATALOG_SORT_MODES.indexOf(mode))+1)%CATALOG_SORT_MODES.length];
export function catalogDistanceAu(body){
  if(!body?.parentId)return null; // The Sun has no parent distance.
  const distance=body.meanDistanceToParent??body.a;
  if(typeof distance!=='number'||!Number.isFinite(distance)||distance<=0)return null;
  const unit=body.meanDistanceUnit||(body.parentId==='sun'?'AU':'km');
  return unit==='AU'?distance:unit==='km'?distance/AU_KM:null;
}
/** Shared sort/display distance. In the unfiltered atlas moons, binary
 * companions and artificial satellites inherit their parent's heliocentric
 * distance. Walk up any nested parent chain to use the solar-system reference;
 * search and isolated views retain each body's own orbital distance.
 * Keep the option name for compatibility with previous catalog callers.
 * Probes and primary Sun-orbiters continue using their own distance.
 */
export function catalogListingDistance(body,{byId=null,useParentForMoons=false}={}){
  const companion=body?.parentId && body.parentId!=='sun'
    && ['moon','binary','satellite'].includes(body.type);
  const parent=useParentForMoons && companion ? byId?.get(body.parentId) : null;
  if(!parent)return {au:catalogDistanceAu(body),fromParent:null};
  let reference=parent;
  const seen=new Set([body.id,parent.id]);
  while(reference.parentId && reference.parentId!=='sun'){
    const ancestor=byId?.get(reference.parentId);
    if(!ancestor||seen.has(ancestor.id))break;
    seen.add(ancestor.id);
    reference=ancestor;
  }
  return {au:catalogDistanceAu(reference),fromParent:parent.name||null};
}
export function catalogDiameterKm(body){
  const radius=body?.radiusKm;
  // 0 is the catalog's placeholder for unknown spacecraft/satellite sizes.
  return typeof radius==='number'&&Number.isFinite(radius)&&radius>0?radius*2:null;
}
export function catalogMetric(body,mode,listedDistance=null){
  if(mode==='distance'){
    const {au,fromParent}=listedDistance||catalogListingDistance(body);
    const description=fromParent?`Mittlere Entfernung wie ${fromParent} (zu dessen Zentralkörper)`
      :'Mittlere Entfernung zum Elternkörper';
    if(au===null)return {value:'—',label:`${description}: unbekannt`};
    // The threshold is inclusive. Above 0.2 AE, preserve the earlier AE display.
    const distanceKm=au*AU_KM;
    const value=au<=0.2
      ?`${distanceKm<0.0001
        ?new Intl.NumberFormat('de-DE',{notation:'scientific',maximumSignificantDigits:3}).format(distanceKm)
        :distanceKm<10?formatDecimal(distanceKm,3):formatInt(distanceKm)} km`
      :`${au<0.0001
        ?new Intl.NumberFormat('de-DE',{notation:'scientific',maximumSignificantDigits:3}).format(au)
        :new Intl.NumberFormat('de-DE',{maximumSignificantDigits:5}).format(au)} AE`;
    return {value,label:`${description}: ${value}`};
  }
  if(mode==='size'){
    const km=catalogDiameterKm(body);
    if(km===null)return {value:'—',label:'Durchmesser: unbekannt'};
    const readable=km>=10?formatInt(km):km>=0.001?formatDecimal(km,4)
      :new Intl.NumberFormat('de-DE',{notation:'scientific',maximumSignificantDigits:3}).format(km);
    const value=`${readable} km`;
    return {value,label:`Durchmesser: ${value}`};
  }
  return null;
}

/** Each whitespace-separated word must match an object's own or its parent's metadata.
 * Thus "uranus c" matches Uranus moons with "c" in their name, irrespective of word order.
 */
export function catalogMatches(body, query, byId) {
  const words=clean(query).split(/\s+/).filter(Boolean);
  if(!words.length)return true;
  const type=TYPES[body.type];
  const parent=body.parentId && byId.get(body.parentId);
  const searchable=[body.name, ...(body.aliases||[]), body.id, body.catalog, type?.label, type?.plural,
    parent?.name, parent?.id, body.parentId]
    .filter(value=>value!=null).map(clean);
  return words.every(word=>searchable.some(field=>field.includes(word)));
}

/** Rank an already matching item by the best match to the complete query.
 * Name/alias/ID and category exact matches always precede prefix and substring
 * matches. Parent metadata remains searchable without outranking the object itself.
 */
export function catalogSearchRank(body, query, byId) {
  const phrase=clean(query).replace(/\s+/g,' ').trim();
  if(!phrase)return 0;
  const parent=body.parentId&&byId.get(body.parentId);
  const own=[body.name,...(body.aliases||[]),body.id,body.catalog].filter(v=>v!=null).map(clean);
  const category=[TYPES[body.type]?.label,TYPES[body.type]?.plural].filter(Boolean).map(clean);
  const related=[parent?.name,parent?.id,body.parentId].filter(Boolean).map(clean);
  if(own.some(field=>field===phrase))return 0;
  if(category.some(field=>field===phrase))return 1;
  if(own.some(field=>field.startsWith(phrase)))return 2;
  if(category.some(field=>field.startsWith(phrase)))return 3;
  if(related.some(field=>field===phrase))return 4;
  if(own.some(field=>field.includes(phrase)))return 5;
  if(category.some(field=>field.includes(phrase)))return 6;
  if(related.some(field=>field.includes(phrase)))return 7;
  return 8; // individual query terms may span different fields
}

/** The catalog is independent of renderer layers. Planet isolation is an optional UI filter. */
export function filteredBodies(state,{planetId=null}={}) {
  const query=clean(state.search);
  const byId=new Map(state.bodies.map(b=>[b.id,b]));
  const planetOnly=Boolean(planetId && state.catalogPlanetOnly);
  const belongsToPlanet=body=>{
    if(!planetOnly)return true;
    if(body.id===planetId)return true;
    // Include nested orbiters if the data later contains children of moons.
    const seen=new Set([body.id]);
    let parentId=body.parentId;
    while(parentId && !seen.has(parentId)){
      if(parentId===planetId)return true;
      seen.add(parentId);
      parentId=byId.get(parentId)?.parentId;
    }
    return false;
  };
  const list=state.bodies.filter(b=>belongsToPlanet(b) && catalogMatches(b,query,byId));
  const mode=CATALOG_SORT_MODES.includes(state.catalogSort)?state.catalogSort:'default';
  if(mode!=='default'){
    // Without search or an active planet filter, moons, binary companions
    // and satellites inherit their system's heliocentric distance.
    const useParentForMoons=!query&&!planetOnly;
    const metric=mode==='distance'
      ?b=>catalogListingDistance(b,{byId,useParentForMoons}).au
      :catalogDiameterKm;
    const direction=mode==='distance'?1:-1;
    list.sort((a,b)=>{
      const ma=metric(a),mb=metric(b);
      if(ma===null||mb===null)return ma===null?(mb===null?0:1):-1; // unknown last
      return direction*(ma-mb)||a.name.localeCompare(b.name,'de')||a.id.localeCompare(b.id);
    });
  }else if(!query){
    list.sort((a,b)=>{const ia=FEATURED_IDS.indexOf(a.id),ib=FEATURED_IDS.indexOf(b.id);
      if(ia!==-1||ib!==-1)return ia===-1?1:ib===-1?-1:ia-ib;
      return MAIN_TYPES.indexOf(a.type)-MAIN_TYPES.indexOf(b.type)||a.name.localeCompare(b.name,'de');});
  }else list.sort((a,b)=>catalogSearchRank(a,query,byId)-catalogSearchRank(b,query,byId)
    || (TYPE_ORDER.get(a.type)??99)-(TYPE_ORDER.get(b.type)??99)
    || a.name.localeCompare(b.name,'de') || a.id.localeCompare(b.id));
  return list;
}
export function renderCatalog(state,onSelect,{planetId=null}={}){
 const byIdMap=new Map(state.bodies.map(body=>[body.id,body]));
 const byId=id=>byIdMap.get(id),list=filteredBodies(state,{planetId}),host=$('object-list');
 const mode=CATALOG_SORT_MODES.includes(state.catalogSort)?state.catalogSort:'default';
 const useParentForMoons=!clean(state.search)&&!(planetId&&state.catalogPlanetOnly);
 host.innerHTML=list.map(b=>{
  const active=b.id===state.selected,desc=b.type==='probe'?(b.targets||'Mission'):b.parentId?byId(b.parentId)?.name||b.parentId:'Zentrum des Systems';
  // The large preview shows the object's own appearance; only the small dot encodes its category.
  const objectColor=/^#[0-9a-f]{6}$/i.test(b.color||'')?b.color:'#9ba9bc';
  const categoryColor=CATEGORY_COLORS[b.type]||'#E6EDF5';
  const metric=catalogMetric(b,mode,mode==='distance'
    ?catalogListingDistance(b,{byId:byIdMap,useParentForMoons}):null);
  const right=metric?`<span class="object-metric" title="${esc(metric.label)}">${esc(metric.value)}</span>`
    :'<span class="row-arrow" aria-hidden="true">↗</span>';
  return `<button class="object-row ${active?'selected':''}" role="option" aria-selected="${active}" data-id="${esc(b.id)}"><span class="object-symbol" aria-hidden="true" style="--orb-color:${objectColor}"></span><span class="object-copy"><span class="object-title"><span class="object-category-dot" aria-hidden="true" style="--category-color:${categoryColor}"></span><span class="object-name">${esc(b.name)}</span></span><span class="object-sub">${esc(TYPES[b.type]?.label||'Objekt')} <i>·</i> ${esc(desc)}</span></span>${right}</button>`;
 }).join('') || '<div class="empty-results">Keine Objekte gefunden.<br>Suche oder Planetenfilter anpassen.</div>';
 $('object-count').textContent=String(list.length).padStart(2,'0');
 const labels={default:'OBJEKTE IM ATLAS',distance:'ENTFERNUNG ↑',size:'GRÖSSE ↓'};
 const names={default:'Standard',distance:'Entfernung (nah bis fern)',size:'Größe (groß bis klein)'};
 const button=$('catalog-sort');
 button.dataset.sort=mode;
 const next=nextCatalogSort(mode);
 button.setAttribute('aria-label',`Sortierung: ${names[mode]}. Nächste Sortierung: ${names[next]}`);
 button.title=`Sortierung: ${names[mode]}. Klicken für ${names[next]}`;
 $('list-label').textContent=labels[mode];
 for(const b of host.querySelectorAll('[data-id]'))b.addEventListener('click',()=>onSelect(b.dataset.id,true));
}
