import { TYPES, FEATURED_IDS } from '../data/bodies.js';
import { clean } from '../data/normalization.js';
import { esc } from './formatters.js';
const $=id=>document.getElementById(id);
const MAIN_TYPES=['star','planet','moon','dwarf','asteroid','comet','satellite','probe'];

function sortedBodies(state){const query=clean(state.search);
  const list=state.bodies.filter(b=>(state.filter==='all'||b.type===state.filter)&&(!query||clean(b.name).includes(query)||clean(b.id).includes(query)||String(b.catalog||'').includes(query)));
  if(state.filter==='all'&&!query){list.sort((a,b)=>{const ia=FEATURED_IDS.indexOf(a.id),ib=FEATURED_IDS.indexOf(b.id);if(ia!==-1||ib!==-1)return ia===-1?1:ib===-1?-1:ia-ib;
      const ga=MAIN_TYPES.indexOf(a.type),gb=MAIN_TYPES.indexOf(b.type);return ga-gb||a.name.localeCompare(b.name,'de');});}
  else list.sort((a,b)=>a.name.localeCompare(b.name,'de'));
  return list;
}
export function renderCatalog(state,onSelect){const byId=id=>state.bodies.find(x=>x.id===id);const list=sortedBodies(state);const host=$('object-list');host.innerHTML=list.map(b=>{
  const active=b.id===state.selected;const desc=b.type==='probe'?(b.targets||'Mission'):b.parentId?byId(b.parentId)?.name||b.parentId:'Zentrum des Systems';
  return `<button class="object-row ${active?'selected':''}" role="option" aria-selected="${active}" data-id="${esc(b.id)}"><span class="object-symbol" style="--orb-color:${esc(b.color)}"></span><span class="object-copy"><span class="object-name">${esc(b.name)}</span><span class="object-sub">${esc(TYPES[b.type]?.label||'Objekt')} <i>·</i> ${esc(desc)}</span></span><span class="row-arrow">↗</span></button>`;
 }).join('') || '<div class="empty-results">Keine Objekte gefunden.<br>Versuche einen anderen Suchbegriff.</div>';
 $('object-count').textContent=String(list.length).padStart(2,'0');
 $('list-label').textContent=state.filter==='all'?'OBJEKTE IM ATLAS':TYPES[state.filter]?.plural.toUpperCase()||'OBJEKTE';
 for(const b of host.querySelectorAll('[data-id]'))b.addEventListener('click',()=>onSelect(b.dataset.id,true));
}
export function renderFilters(state){for(const b of document.querySelectorAll('[data-filter]'))b.classList.toggle('active',b.dataset.filter===state.filter);}
