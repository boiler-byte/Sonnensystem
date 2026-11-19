import { CATEGORY_COLORS, EARTH_ORBIT_COLOR } from '../data/bodies.js';
import { hex } from './math.js';
import { displayOrbitRadius } from '../data/orbital-math.js';
import {OrbitGeometryCache} from './orbit-cache.js';

const CLIP_IDENTITY = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
const NEUTRAL_ORBIT = '#8394A8';

/** True by default for integrations that still pass only {orbits, labels}. */
export function orbitAppearance(body, settings = {}, alpha = .2, selected = false) {
  const contrast = settings.orbitContrast !== false;
  // Orbit category colors are permanent; contrast changes only stroke and opacity.
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

/** Extrude each projected orbit segment into two triangles in clip space.
 * gl.lineWidth() is limited to 1px on many WebGL implementations; triangles
 * make the "Kontrast" switch visibly thicker on those devices as well.
 */
export function orbitRibbonVertices(points, vp, viewportWidth, viewportHeight, widthPx, output=null) {
  const capacity=Math.max(0,(points.length/3-1)*18);
  const vertices=output?.length>=capacity ? output : new Float32Array(capacity);
  let count=0;
  const width=Math.max(1,viewportWidth),height=Math.max(1,viewportHeight);
  // Two reusable clip points avoid allocating one object per orbit sample.
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

export function drawOrbitLine(renderer, body, center, vp, alpha, selected, options = {}) {
  if(!body.periodDays||!body.a) return;
  const gl=renderer.gl,n=renderer.planetId?100:180;
  const visibility=options.opacity ?? renderer.sceneOrbitOpacity?.(body) ?? renderer.orbitOpacity?.() ?? 1;
  if(visibility<=.001)return; // Invisible orbits require neither sampling nor GPU uploads.
  const parent=renderer.byId.get(body.parentId);
  const centralBody=renderer.planetId?renderer.byId.get(renderer.planetId):null;
  const displayRadius=options.radius ?? renderer.orbitRadius?.(body,parent) ?? displayOrbitRadius(body,parent,renderer.settings,centralBody);
  const cache=renderer._orbitGeometryCache ??= new OrbitGeometryCache();
  const entry=cache.get(body,parent,displayRadius,n,center);
  const appearance=orbitAppearance(body,options.settings ?? renderer.settings,alpha,selected);
  if(appearance.contrast && !entry.ribbon){
    entry.ribbon=new Float32Array((entry.world.length/3-1)*18);
  }
  const vertices=appearance.contrast
    ? orbitRibbonVertices(entry.world,vp,renderer.width,renderer.height,appearance.widthPx,entry.ribbon)
    : entry.world;
  if(!vertices.length)return;
  const program=renderer.useLineProgram(appearance.contrast?CLIP_IDENTITY:vp);
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
  const colorLocation=typeof renderer.uniform==='function'
    ? renderer.uniform(program,'uColor') : gl.getUniformLocation(program,'uColor');
  gl.uniform4f(colorLocation,...appearance.rgb,appearance.alpha*visibility);
  gl.drawArrays(appearance.contrast?gl.TRIANGLES:gl.LINE_STRIP,0,vertices.length/3);
}
