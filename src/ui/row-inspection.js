/** Pointer-transparent, screen-space scanning HUD over the WebGL row. */
import { clamp, projected } from '../renderer/math.js';
import { ROW_INSPECTION_ARROW_MS, rowArrowGeometry, rowInspectionMetrics } from '../renderer/row-inspection.js';

const el=id=>document.getElementById(id);
const coords=n=>Number(n).toFixed(1);
const scanEase=t=>1-Math.pow(1-clamp(t,0,1),3);
const radiusOf=(body,renderer,screen)=>renderer.rowRenderedRadiusPx(body,screen);

/** Called once per rendered frame, *after* the camera and body projections update. */
export function updateRowInspectionHUD(renderer,now=performance.now()) {
  const host=el('row-inspection');
  if(!host)return;
  const body=renderer?.settings?.row&&!renderer.cinema?.active
    ?renderer.byId?.get(renderer.rowHoveredId):null;
  const position=body&&renderer.positions?.get(body.id);
  const screen=position&&renderer.vp&&projected(position,renderer.vp,renderer.width,renderer.height);
  if(!body || !screen || screen.x+radiusOf(body,renderer,screen)<0 || screen.x-radiusOf(body,renderer,screen)>renderer.width) {
    host.hidden=true;host.classList.remove('is-visible');host.dataset.bodyId='';return;
  }
  const radiusPx=renderer.rowRenderedRadiusPx(body,screen);
  const size=clamp(radiusPx*2+26,160,310);
  // A cropped central star/planet has an offscreen center: inspect its visible arc.
  const anchorX=clamp(screen.x,Math.min(80,renderer.width/2),Math.max(80,renderer.width-80));
  const anchorY=clamp(screen.y,Math.min(80,renderer.height/2),Math.max(80,renderer.height-80));
  const scanner=el('row-inspection-scanner');
  scanner.style.left=`${anchorX}px`;scanner.style.top=`${anchorY}px`;
  scanner.style.width=`${size}px`;scanner.style.height=`${size}px`;
  const panel=el('row-inspection-panel');
  const paneWidth=Math.min(225,Math.max(175,renderer.width-20));
  const margin=12;
  // Prefer the right side; fall back to left or to an edge-clamped position.
  const right=anchorX+size/2+17;
  const left=anchorX-size/2-paneWidth-17;
  const px=right+paneWidth+margin<=renderer.width?right:left>=margin?left:clamp(right,margin,Math.max(margin,renderer.width-paneWidth-margin));
  const py=clamp(anchorY-size*.46,margin,Math.max(margin,renderer.height-175-margin));
  panel.style.left=`${px}px`;panel.style.top=`${py}px`;panel.style.width=`${paneWidth}px`;

  const metrics=rowInspectionMetrics(body);
  const signature=JSON.stringify(metrics);
  if(host.dataset.bodyId!==body.id || host.dataset.signature!==signature){
    el('row-inspection-name').textContent=metrics.name;
    el('row-inspection-diameter').textContent=metrics.diameter;
    el('row-inspection-scan-tag').textContent=`Ø ${metrics.diameter}`;
    el('row-inspection-gravity').textContent=metrics.gravity;
    el('row-inspection-temperature').textContent=metrics.temperature;
    el('row-inspection-id').textContent=body.id.toUpperCase().slice(0,32);
    host.dataset.signature=signature;
    if(host.dataset.bodyId!==body.id){
      host.dataset.bodyId=body.id;
      host.hidden=false;
      host.classList.remove('is-visible');
      // Restart the optical scan on every newly hovered body.
      void host.offsetWidth;
      host.classList.add('is-visible');
    }
  }
  host.hidden=false;

  const svg=el('row-inspection-vector-svg'),line=el('row-inspection-vector-line');
  const arrowhead=el('row-inspection-vector-head'),origin=el('row-inspection-vector-origin');
  const distance=el('row-inspection-distance');
  const centerPosition=renderer.positions.get(renderer.planetId||'sun');
  const geometry=rowArrowGeometry(body,position,centerPosition,renderer.vp,
    renderer.width,renderer.height,Math.max(80,radiusPx));
  if(!geometry || metrics.distance==='—'){
    // SVGElement.hidden is not HTMLElement.hidden: setting the JS property does
    // not reliably remove an SVG's hidden attribute. CSS would hide it forever.
    svg.setAttribute('hidden','');distance.hidden=true;return;
  }
  svg.removeAttribute('hidden');distance.hidden=false;
  svg.setAttribute('viewBox',`0 0 ${renderer.width} ${renderer.height}`);
  const elapsed=Math.max(0,now-(renderer.rowHoverStartedAt??now));
  const reducedMotion=typeof window!=='undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const progress=reducedMotion?1:scanEase(elapsed/ROW_INSPECTION_ARROW_MS);
  const tip=geometry.x+(geometry.tipX-geometry.x)*progress;
  line.setAttribute('d',`M${coords(geometry.x)} ${coords(geometry.y)}H${coords(tip)}`);
  const end=geometry.direction;
  const head=progress>.03 ? `M${coords(tip-end*8)} ${coords(geometry.y-4)}L${coords(tip)} ${coords(geometry.y)}L${coords(tip-end*8)} ${coords(geometry.y+4)}` : '';
  arrowhead.setAttribute('d',head);
  origin.setAttribute('cx',coords(geometry.x));origin.setAttribute('cy',coords(geometry.y));
  distance.style.left=`${geometry.labelX}px`;distance.style.top=`${geometry.labelY}px`;
  el('row-inspection-distance-value').textContent=metrics.distance;
}
