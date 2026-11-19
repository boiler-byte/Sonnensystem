/** Pointer-transparent, screen-space scanning HUD over the WebGL row. */
import { clamp, projected } from '../renderer/math.js';
import { ROW_INSPECTION_ARROW_MS, rowArrowGeometry, rowInspectionMetrics, rowScannerSize } from '../renderer/row-inspection.js';
import { physicalStatIcon, thermometerIcon } from './physical-stat-icons.js';

const el=id=>document.getElementById(id);
const coords=n=>Number(n).toFixed(1);
const scanEase=t=>1-Math.pow(1-clamp(t,0,1),3);
const radiusOf=(body,renderer,screen)=>renderer.rowRenderedRadiusPx(body,screen);
const ROW_METRIC_ICONS=[['row-inspection-gravity-icon',physicalStatIcon('gravity')],
  ['row-inspection-temperature-icon',thermometerIcon('mean')]];
// The readings occupy <=38 CSS px; keep their baseline clear of the arrow.
const ROW_METRICS_TO_ARROW_PX = 38 + 8;

/** Called once per rendered frame, *after* the camera and body projections update. */
export function updateRowInspectionHUD(renderer,now=performance.now()) {
  const host=el('row-inspection');
  if(!host)return;
  const body=renderer?.settings?.row ?renderer.byId?.get(renderer.rowHoveredId):null;
  const position=body&&renderer.positions?.get(body.id);
  const screen=position&&renderer.vp&&projected(position,renderer.vp,renderer.width,renderer.height);
  if(!body || !screen || screen.x+radiusOf(body,renderer,screen)<0 || screen.x-radiusOf(body,renderer,screen)>renderer.width) {
    host.hidden=true;host.classList.remove('is-visible');host.dataset.bodyId='';return;
  }
  const radiusPx=renderer.rowRenderedRadiusPx(body,screen);
  // A cropped central star/planet has an offscreen center: inspect its visible arc.
  const anchorX=clamp(screen.x,Math.min(80,renderer.width/2),Math.max(80,renderer.width-80));
  const anchorY=clamp(screen.y,Math.min(80,renderer.height/2),Math.max(80,renderer.height-80));
  const metrics=rowInspectionMetrics(body);
  const parent=renderer.byId?.get(body.parentId);
  const parentPosition=parent && renderer.positions.get(parent.id);
  const parentScreen=parentPosition&&projected(parentPosition,renderer.vp,renderer.width,renderer.height);
  const parentRadiusPx=parentScreen?.depth>0 ? renderer.rowRenderedRadiusPx(parent,parentScreen) : 0;
  const geometry=rowArrowGeometry(body,position,parentPosition,renderer.vp,
    renderer.width,renderer.height,Math.max(80,radiusPx),parentRadiusPx);
  const hasDistance=Boolean(geometry && metrics.distance!=='—');
  // Cinema reserves a larger lower area for its transport controls.
  const metricsBottomLimit=renderer.cinema?.active
    ?renderer.height-(renderer.width<=770?270:165):renderer.height-49;
  // On close flyovers the arrow can reach the lower viewport cap before the
  // readings do. Keep the two lower HUD areas separate, then cap the radar.
  const metricsTopLimit=hasDistance
    ?Math.min(metricsBottomLimit,geometry.y-ROW_METRICS_TO_ARROW_PX)
    :metricsBottomLimit;
  const size=rowScannerSize(radiusPx,anchorY,renderer.width,renderer.height,
    metricsTopLimit,hasDistance?geometry.y:null);
  const scanner=el('row-inspection-scanner');
  scanner.style.left=`${anchorX}px`;scanner.style.top=`${anchorY}px`;
  scanner.style.width=`${size}px`;scanner.style.height=`${size}px`;
  // Title and readings still follow the sphere; only the radar frame stops
  // expanding once it would overlap a clamped HUD value.
  const clearance=Math.max(80,radiusPx,size/2-13);
  const title=el('row-inspection-title');
  title.style.left=`${anchorX}px`;
  title.style.top=`${clamp(anchorY-clearance-18,45,renderer.height-70)}px`;
  const metricsHost=el('row-inspection-metrics');
  metricsHost.style.left=`${anchorX}px`;
  metricsHost.style.top=`${clamp(anchorY+clearance+21,72,Math.max(72,metricsTopLimit))}px`;
  metricsHost.style.width=`${Math.min(350,Math.max(180,renderer.width-24))}px`;

  // Reuse the *exact* SVGs from the physical-detail cards, without duplicating shapes.
  for(const [id,svg] of ROW_METRIC_ICONS){
    const icon=el(id);
    if(icon.dataset.ready!=='true'){icon.innerHTML=svg;icon.dataset.ready='true';}
  }

  const signature=JSON.stringify(metrics);
  if(host.dataset.bodyId!==body.id || host.dataset.signature!==signature){
    el('row-inspection-name').textContent=metrics.name;
    el('row-inspection-scan-tag').textContent=`Ø ${metrics.diameter}`;
    el('row-inspection-gravity').textContent=metrics.gravity;
    el('row-inspection-temperature').textContent=metrics.temperature;
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
  if(!hasDistance){
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
