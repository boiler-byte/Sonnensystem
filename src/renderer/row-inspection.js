/** Screen-space row inspection. No DOM or WebGL calls: shared by hover input and the HUD. */
import { AU_KM } from '../data/bodies.js';
import { displaySurfaceGravity, displayTemperatureK, formatDecimal, formatInt } from '../ui/formatters.js';
import { CAMERA_FOV, clamp, projected } from './math.js';

export const ROW_INSPECTION_DIAMETER_PX = 160;
export const ROW_INSPECTION_ANIMATION_MS = 260;
export const ROW_INSPECTION_ARROW_MS = 520;
// v81: the former 23px clearance between the enlarged sphere and vector is tripled.
export const ROW_INSPECTION_ARROW_GAP_PX = 23 * 3;
const HALF_FOV_SCALE = 2 * Math.tan(CAMERA_FOV / 2);

// The title's lower edge is clamped to y=45. Both the title and readings
// must stay clear of the scanner, including its glow and measurement marks.
const SCANNER_CLEARANCE_PX = 12;
const SCANNER_TITLE_MIN_Y = 45;

/** Keep growing the radar with the sphere until its frame reaches the HUD.
 * The 160px minimum applies only where there is room for it. On a cropped
 * object or a short Cinema viewport the readings take precedence instead.
 * The arrow's y is a separate boundary so even the distance rule stays clear.
 */
export function rowScannerSize(radiusPx, anchorY, width, height, metricsTopLimit, arrowY=null) {
  if(!(width>0 && height>0) || !Number.isFinite(anchorY))return 0;
  // No fixed 560px/viewport-percentage cap: the frame must follow a large
  // planet until the *actual* nearby title, measurement or arrow space ends.
  const desired=Math.max(160,Math.max(0,Number(radiusPx)||0)*2+26);
  const topRoom=Math.max(0,anchorY-SCANNER_TITLE_MIN_Y-SCANNER_CLEARANCE_PX);
  const lowerLimit=Math.max(72,metricsTopLimit);
  const metricsRoom=Math.max(0,lowerLimit-anchorY-SCANNER_CLEARANCE_PX);
  // The distance line starts at arrowY; its text is even farther below.
  const arrowRoom=Number.isFinite(arrowY)?Math.max(0,arrowY-anchorY-SCANNER_CLEARANCE_PX):Infinity;
  return Math.min(desired,2*Math.min(topRoom,metricsRoom,arrowRoom));
}

export function rowProjectedBody(body, position, vp, width, height, radiusWorld) {
  if(!body || !position || !vp || width<=0 || height<=0)return null;
  const screen=projected(position,vp,width,height);
  if(!screen || !Number.isFinite(screen.x) || !Number.isFinite(screen.y))return null;
  const radius=Math.max(0,Number(radiusWorld)||0)*height/(HALF_FOV_SCALE*screen.depth);
  // Row framing deliberately crops the leading giant: its *center* can be
  // offscreen even while a large part of the actual sphere is under the mouse.
  if(screen.x+radius<0 || screen.x-radius>width || screen.y+radius<0 || screen.y-radius>height)return null;
  return {...screen,radius};
}

/** Only inspect the real, visible footprint; a tiny body still has a usable 12px hit area. */
export function rowHoveredBody(renderer, pointer) {
  if(!pointer || !renderer?.settings?.row || renderer.cinema?.active || renderer.camera?.arView || renderer.transition)return null;
  const {width,height,vp}=renderer;
  if(!(pointer.x>=0 && pointer.x<=width && pointer.y>=0 && pointer.y<=height))return null;
  let winner=null,score=Infinity;
  for(const body of renderer.bodies||[]) {
    if(!renderer.shouldDraw(body))continue;
    const screen=rowProjectedBody(body,renderer.positions.get(body.id),vp,width,height,renderer.bodyRadius(body));
    if(!screen)continue;
    // Honor the true visible arc of a cropped giant, instead of requiring
    // a hit near its offscreen center. Small dots keep a usable 12px target.
    const ownRadius=Math.max(12,screen.radius+6);
    // Hover remains stable across the entire temporarily enlarged disc.
    const held=body.id===renderer.rowHoveredId ? Math.max(ownRadius,renderer.rowRenderedRadiusPx?.(body,screen)??0) : ownRadius;
    const d=Math.hypot(pointer.x-screen.x,pointer.y-screen.y);
    if(d>held)continue;
    // Prefer a genuinely hit sphere to an enlarged neighboring hover footprint.
    const rank=d/ownRadius + (d>ownRadius ? .85 : 0);
    if(rank<score){winner=body;score=rank;}
  }
  return winner;
}

/** 3-D sphere grows to at least 160 CSS pixels, independently of the row layout. */
export function rowInspectionRadius(worldRadius, depth, height, amount=1) {
  if(!(worldRadius>0) || !(depth>0) || !(height>0))return worldRadius;
  const minWorldRadius=ROW_INSPECTION_DIAMETER_PX/2*HALF_FOV_SCALE*depth/height;
  return worldRadius+Math.max(0,minWorldRadius-worldRadius)*clamp(amount,0,1);
}

export function rowParentDistance(body) {
  if(!body?.parentId)return null;
  const value=body.meanDistanceToParent??body.a;
  if(typeof value!=='number' || !Number.isFinite(value) || value<=0)return null;
  const unit=body.meanDistanceUnit || (body.parentId==='sun'?'AU':'km');
  const km=unit==='AU'?value*AU_KM:unit==='km'?value:null;
  return Number.isFinite(km) && km>0 ? km : null;
}

export function formatRowParentDistance(body){
  const km=rowParentDistance(body);
  if(km===null)return '—';
  const au=km/AU_KM;
  return au<=.2 ? `${km<10?formatDecimal(km,2):formatInt(km)} km` : `${formatDecimal(au,3)} AE`;
}

/** A parent-facing arrow starts below the sphere and ends at the parent's outer edge. */
export function rowArrowGeometry(body,position,parentPosition,vp,width,height,sphereRadiusPx,parentRadiusPx=0) {
  if(!body?.parentId || !parentPosition || !position)return null;
  const screen=rowProjectedBody(body,position,vp,width,height,0);
  const parent=projected(parentPosition,vp,width,height);
  if(!screen || !parent || !Number.isFinite(parent.x))return null;
  const x=clamp(screen.x,12,width-12);
  const direction=Math.sign(parent.x-screen.x);
  if(!direction)return null;
  // The near silhouette faces the arrow: the parent's right side when it is
  // left of the child, and its left side when it is to the right. An entirely
  // offscreen sphere is clipped at the viewport edge instead of its center.
  const parentEdge=parent.x-direction*Math.max(0,Number(parentRadiusPx)||0);
  const tipX=clamp(parentEdge,0,width);
  if((tipX-x)*direction<=1)return null;
  const y=clamp(screen.y+Math.max(80,sphereRadiusPx)+ROW_INSPECTION_ARROW_GAP_PX,22,height-33);
  return {x,y,tipX,direction,labelX:clamp(screen.x,72,width-72),labelY:clamp(y+13,20,height-10)};
}

export function rowInspectionMetrics(body) {
  return {
    name:String(body?.name||body?.id||''),
    diameter:Number.isFinite(body?.radiusKm)&&body.radiusKm>0?`${formatInt(body.radiusKm*2)} km`:'—',
    gravity:displaySurfaceGravity(body?.surfaceGravityMs2),
    temperature:displayTemperatureK(body?.temperatureMeanK??body?.temperatureK),
    distance:formatRowParentDistance(body)
  };
}
