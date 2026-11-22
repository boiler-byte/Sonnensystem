import {TYPES} from '../data/bodies.js';

/** The overlay cannot intercept mouse input or expose untrusted body names as HTML. */
export function updateOrbitTooltip(hit){
  const tooltip=document.getElementById('orbit-hover-tooltip');
  if(!tooltip)return;
  if(!hit?.body){tooltip.hidden=true;return;}
  const name=tooltip.querySelector('.orbit-hover-name');
  const category=tooltip.querySelector('.orbit-hover-category');
  name.textContent=hit.body.name||hit.body.id;
  category.textContent=TYPES[hit.body.type]?.label||hit.body.type||'Objekt';
  tooltip.hidden=false;
  const viewport=tooltip.parentElement;
  const gap=14,margin=8;
  const width=tooltip.offsetWidth,height=tooltip.offsetHeight;
  const availableWidth=viewport?.clientWidth||0,availableHeight=viewport?.clientHeight||0;
  const x=hit.x+gap+width>availableWidth-margin ? hit.x-gap-width : hit.x+gap;
  const y=hit.y+gap+height>availableHeight-margin ? hit.y-gap-height : hit.y+gap;
  tooltip.style.left=Math.round(Math.max(margin,Math.min(x,availableWidth-width-margin)))+'px';
  tooltip.style.top=Math.round(Math.max(margin,Math.min(y,availableHeight-height-margin)))+'px';
}
