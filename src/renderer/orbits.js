import { CATEGORY_COLORS, EARTH_ORBIT_COLOR } from '../data/bodies.js';
import { hex } from './math.js';
import { displayOrbitRadius } from '../data/orbital-math.js';
import {OrbitGeometryCache} from './orbit-cache.js';
import {recordedGalacticTrail} from './galactic-trails.js';

const CLIP_IDENTITY = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
const NEUTRAL_ORBIT = '#8394A8';
const SUN_TRAIL_GLOW = '#F2BE58';
const SUN_TRAIL_CORE = '#FFE7A8';

export function orbitAppearance(body, settings = {}, alpha = .2, selected = false) {
  const contrast = settings.orbitContrast !== false;
  const color = body.type === 'planet' && body.id === 'earth'
    ? EARTH_ORBIT_COLOR : CATEGORY_COLORS[body.type] || NEUTRAL_ORBIT;
  return {
    color,
    rgb: hex(color),
    widthPx: contrast ? (selected ? 3.4 : 2.4) : 1,
    alpha: contrast ? Math.max(alpha, selected ? .89 : .54) : alpha,
    contrast
  };
}

function clipPoint(points, i, vp, target) {
  const x=points[i],y=points[i+1],z=points[i+2];
  const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
  if(!Number.isFinite(w)||w<=.01)return false;
  const cx=vp[0]*x+vp[4]*y+vp[8]*z+vp[12];
  const cy=vp[1]*x+vp[5]*y+vp[9]*z+vp[13];
  const cz=vp[2]*x+vp[6]*y+vp[10]*z+vp[14];
  if(cz < -w || cz > w)return false;
  target[0]=cx/w;target[1]=cy/w;target[2]=cz/w;
  return true;
}

export function orbitRibbonVertices(points, vp, viewportWidth, viewportHeight, widthPx, output=null) {
  const capacity=Math.max(0,(points.length/3-1)*18);
  const vertices=output?.length>=capacity ? output : new Float32Array(capacity);
  let count=0;
  const width=Math.max(1,viewportWidth),height=Math.max(1,viewportHeight);
  let previous=[0,0,0],next=[0,0,0],previousValid=false;
  for(let i=0;i<points.length;i+=3) {
    const nextValid=clipPoint(points,i,vp,next);
    if(previousValid && nextValid) {
      const dx=(next[0]-previous[0])*width;
      const dy=(next[1]-previous[1])*height;
      const length=Math.hypot(dx,dy);
      if(length>1e-6 && Number.isFinite(length)) {
        const offsetX=(-dy/length)*(widthPx/width);
        const offsetY=(dx/length)*(widthPx/height);
        vertices[count++]=previous[0]+offsetX; vertices[count++]=previous[1]+offsetY; vertices[count++]=previous[2];
        vertices[count++]=previous[0]-offsetX; vertices[count++]=previous[1]-offsetY; vertices[count++]=previous[2];
        vertices[count++]=next[0]+offsetX; vertices[count++]=next[1]+offsetY; vertices[count++]=next[2];
        vertices[count++]=next[0]+offsetX; vertices[count++]=next[1]+offsetY; vertices[count++]=next[2];
        vertices[count++]=previous[0]-offsetX; vertices[count++]=previous[1]-offsetY; vertices[count++]=previous[2];
        vertices[count++]=next[0]-offsetX; vertices[count++]=next[1]-offsetY; vertices[count++]=next[2];
      }
    }
    const swap=previous;previous=next;next=swap;previousValid=nextValid;
  }
  return count===vertices.length ? vertices : vertices.subarray(0,count);
}

function drawPath(renderer, points, appearance, vp, visibility=1) {
  const gl=renderer.gl;
  if(!points?.length || visibility<=.001)return;
  if(appearance.contrast && !appearance.ribbon)
    appearance.ribbon=new Float32Array((points.length/3-1)*18);
  const vertices=appearance.contrast
    ? orbitRibbonVertices(points,vp,renderer.width,renderer.height,appearance.widthPx,appearance.ribbon)
    : points;
  if(!vertices.length)return;
  const program=renderer.useLineProgram(appearance.contrast?CLIP_IDENTITY:vp);
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
  const colorLocation=typeof renderer.uniform==='function'
    ? renderer.uniform(program,'uColor') : gl.getUniformLocation(program,'uColor');
  gl.uniform4f(colorLocation,...appearance.rgb,appearance.alpha*visibility);
  gl.drawArrays(appearance.contrast?gl.TRIANGLES:gl.LINE_STRIP,0,vertices.length/3);
}

/** A Sun trail is only composed of positions observed after mode entry. */
export function drawSunTrail(renderer, vp, opacity=1, settings=renderer.settings) {
  if(!settings?.galacticMotion || renderer.planetId)return;
  const sun=renderer.byId.get('sun')||{id:'sun',type:'star'};
  const points=recordedGalacticTrail(renderer,sun,vp);
  if(points.length<6)return;
  const ribbonSize=(points.length/3-1)*18;
  const buffers=renderer._sunTrailRibbons ??= {glow:null,core:null};
  if(!buffers.glow || buffers.glow.length<ribbonSize)buffers.glow=new Float32Array(ribbonSize);
  if(!buffers.core || buffers.core.length<ribbonSize)buffers.core=new Float32Array(ribbonSize);
  drawPath(renderer,points,{rgb:hex(SUN_TRAIL_GLOW),widthPx:6.2,alpha:.12,contrast:true,ribbon:buffers.glow},vp,opacity);
  drawPath(renderer,points,{rgb:hex(SUN_TRAIL_CORE),widthPx:2.4,alpha:.45,contrast:true,ribbon:buffers.core},vp,opacity);
}

export function drawOrbitLine(renderer, body, center, vp, alpha, selected, options = {}) {
  if(!body.periodDays||!body.a) return;
  const n=renderer.planetId?100:180;
  const visibility=options.opacity ?? renderer.sceneOrbitOpacity?.(body) ?? renderer.orbitOpacity?.() ?? 1;
  if(visibility<=.001)return;
  const parent=renderer.byId.get(body.parentId);
  const centralBody=renderer.planetId?renderer.byId.get(renderer.planetId):null;
  const displayRadius=options.radius ?? renderer.orbitRadius?.(body,parent) ?? displayOrbitRadius(body,parent,renderer.settings,centralBody);
  const cache=renderer._orbitGeometryCache ??= new OrbitGeometryCache();
  const settings=options.settings ?? renderer.settings;
  const appearance=orbitAppearance(body,settings,alpha,selected);
  if(settings?.galacticMotion && !renderer.planetId){
    const points=recordedGalacticTrail(renderer,body,vp);
    if(points.length>=6)drawPath(renderer,points,appearance,vp,visibility);
    return;
  }
  // Outside the galactic mode these are ordinary closed Kepler ellipses.
  const entry=cache.get(body,parent,displayRadius,n,center);
  drawPath(renderer,entry.world,appearance,vp,visibility);
}
