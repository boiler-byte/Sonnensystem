import { TYPES, FEATURED_IDS } from '../data/bodies.js';
import { clean } from '../data/normalization.js';
import { layerEnabled } from '../data/layers.js';
import { esc } from './formatters.js';
const $=id=>document.getElementById(id);
const MAIN_TYPES=['star','planet','moon','dwarf','asteroid','comet','satellite','probe'];

/** Search is diacritic/case independent, including category and immediate parent name. */
export function catalogMatches(body, query, byId) {
  const q=clean(query);
  if(!q)return true;
  const type=TYPES[body.type];
  const parent=body.parentId && byId.get(body.parentId);
  return [body.name, body.id, body.catalog, type?.label, type?.plural,
    parent?.name, parent?.id, body.parentId].some(value=>value!=null && clean(value).includes(q));
}

export function filteredBodies(state) {
  const query=clean(state.search);
  const byId=new Map(state.bodies.map(b=>[b.id,b]));
  const layers=state.settings?.layers;
  const list=state.bodies.filter(b=>layerEnabled(layers,b.type) && catalogMatches(b,query,byId));
  if(!query){
    list.sort((a,b)=>{const ia=FEATURED_IDS.indexOf(a.id),ib=FEATURED_IDS.indexOf(b.id);
      if(ia!==-1||ib!==-1)return ia===-1?1:ib===-1?-1:ia-ib;
      return MAIN_TYPES.indexOf(a.type)-MAIN_TYPES.indexOf(b.type)||a.name.localeCompare(b.name,'de');});
  }else list.sort((a,b)=>a.name.localeCompare(b.name,'de'));
  return list;
}
export function renderCatalog(state,onSelect){
 const byId=id=>state.bodies.find(x=>x.id===id),list=filteredBodies(state),host=$('object-list');
 host.innerHTML=list.map(b=>{
  const active=b.id===state.selected,desc=b.type==='probe'?(b.targets||'Mission'):b.parentId?byId(b.parentId)?.name||b.parentId:'Zentrum des Systems';
  return `<button class="object-row ${active?'selected':''}" role="option" aria-selected="${active}" data-id="${esc(b.id)}"><span class="object-symbol" style="--orb-color:${esc(b.color)}"></span><span class="object-copy"><span class="object-name">${esc(b.name)}</span><span class="object-sub">${esc(TYPES[b.type]?.label||'Objekt')} <i>·</i> ${esc(desc)}</span></span><span class="row-arrow">↗</span></button>`;
 }).join('') || '<div class="empty-results">Keine Objekte gefunden.<br>Suche oder Layer-Auswahl anpassen.</div>';
 $('object-count').textContent=String(list.length).padStart(2,'0');
 $('list-label').textContent='OBJEKTE IM ATLAS';
 for(const b of host.querySelectorAll('[data-id]'))b.addEventListener('click',()=>onSelect(b.dataset.id,true));
}
