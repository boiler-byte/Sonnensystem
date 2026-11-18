import { TYPES, FEATURED_IDS, CATEGORY_COLORS } from '../data/bodies.js';
import { clean } from '../data/normalization.js';
import { esc } from './formatters.js';
const $=id=>document.getElementById(id);
const MAIN_TYPES=['star','planet','moon','dwarf','tno','asteroid','binary','comet','satellite','probe'];
const TYPE_ORDER = new Map(['planet','dwarf','moon','star','tno','asteroid','binary','comet','satellite','probe'].map((type,index)=>[type,index]));

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
  if(!query){
    list.sort((a,b)=>{const ia=FEATURED_IDS.indexOf(a.id),ib=FEATURED_IDS.indexOf(b.id);
      if(ia!==-1||ib!==-1)return ia===-1?1:ib===-1?-1:ia-ib;
      return MAIN_TYPES.indexOf(a.type)-MAIN_TYPES.indexOf(b.type)||a.name.localeCompare(b.name,'de');});
  }else list.sort((a,b)=>catalogSearchRank(a,query,byId)-catalogSearchRank(b,query,byId)
    || (TYPE_ORDER.get(a.type)??99)-(TYPE_ORDER.get(b.type)??99)
    || a.name.localeCompare(b.name,'de') || a.id.localeCompare(b.id));
  return list;
}
export function renderCatalog(state,onSelect,{planetId=null}={}){
 const byId=id=>state.bodies.find(x=>x.id===id),list=filteredBodies(state,{planetId}),host=$('object-list');
 host.innerHTML=list.map(b=>{
  const active=b.id===state.selected,desc=b.type==='probe'?(b.targets||'Mission'):b.parentId?byId(b.parentId)?.name||b.parentId:'Zentrum des Systems';
  // The large preview shows the object's own appearance; only the small dot encodes its category.
  const objectColor=/^#[0-9a-f]{6}$/i.test(b.color||'')?b.color:'#9ba9bc';
  const categoryColor=CATEGORY_COLORS[b.type]||'#E6EDF5';
  return `<button class="object-row ${active?'selected':''}" role="option" aria-selected="${active}" data-id="${esc(b.id)}"><span class="object-symbol" aria-hidden="true" style="--orb-color:${objectColor}"></span><span class="object-copy"><span class="object-title"><span class="object-category-dot" aria-hidden="true" style="--category-color:${categoryColor}"></span><span class="object-name">${esc(b.name)}</span></span><span class="object-sub">${esc(TYPES[b.type]?.label||'Objekt')} <i>·</i> ${esc(desc)}</span></span><span class="row-arrow" aria-hidden="true">↗</span></button>`;
 }).join('') || '<div class="empty-results">Keine Objekte gefunden.<br>Suche oder Planetenfilter anpassen.</div>';
 $('object-count').textContent=String(list.length).padStart(2,'0');
 $('list-label').textContent='OBJEKTE IM ATLAS';
 for(const b of host.querySelectorAll('[data-id]'))b.addEventListener('click',()=>onSelect(b.dataset.id,true));
}
