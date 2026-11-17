import { J2000, CATEGORY_COLORS, EARTH_ORBIT_COLOR } from '../data/bodies.js';
import { DAY, hex } from './math.js';
import { keplerPosition, planetOrbitRadius } from '../data/orbital-math.js';

const CLIP_IDENTITY = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
const NEUTRAL_ORBIT = '#8394A8';

/** True by default for integrations that still pass only {orbits, labels}. */
export function orbitAppearance(body, settings = {}, alpha = .2, selected = false) {
  const contrast = settings.orbitContrast !== false;
  const colors = settings.orbitColors !== false;
  const color = colors
    ? (body.type === 'planet' && body.id === 'earth' ? EARTH_ORBIT_COLOR : CATEGORY_COLORS[body.type] || NEUTRAL_ORBIT)
    : NEUTRAL_ORBIT;
  return {
    color,
    rgb: hex(color),
    widthPx: contrast ? (selected ? 3.4 : 2.4) : 1,
    alpha: contrast ? Math.max(alpha, selected ? .89 : .54) : alpha,
    contrast
  };
}

function clipPoint(points, i, vp) {
  const x=points[i],y=points[i+1],z=points[i+2];
  const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
  if(!Number.isFinite(w)||w<=.01) return null;
  const cx=vp[0]*x+vp[4]*y+vp[8]*z+vp[12];
  const cy=vp[1]*x+vp[5]*y+vp[9]*z+vp[13];
  const cz=vp[2]*x+vp[6]*y+vp[10]*z+vp[14];
  // Do not draw ribbons behind the camera or across the near/far clip planes.
  if(cz < -w || cz > w) return null;
  return {x:cx/w,y:cy/w,z:cz/w};
}

/** Extrude each projected orbit segment into two triangles in clip space.
 * gl.lineWidth() is limited to 1px on many WebGL implementations; triangles
 * make the "Kontrast" switch visibly thicker on those devices as well.
 */
export function orbitRibbonVertices(points, vp, viewportWidth, viewportHeight, widthPx) {
  const vertices=[];
  const width=Math.max(1,viewportWidth),height=Math.max(1,viewportHeight);
  let previous=null;
  for(let i=0;i<points.length;i+=3) {
    const next=clipPoint(points,i,vp);
    if(previous && next) {
      const dx=(next.x-previous.x)*width;
      const dy=(next.y-previous.y)*height;
      const length=Math.hypot(dx,dy);
      if(length>1e-6 && Number.isFinite(length)) {
        const offsetX=(-dy/length)*(widthPx/width);
        const offsetY=(dx/length)*(widthPx/height);
        const a=previous,b=next;
        vertices.push(
          a.x+offsetX,a.y+offsetY,a.z, a.x-offsetX,a.y-offsetY,a.z, b.x+offsetX,b.y+offsetY,b.z,
          b.x+offsetX,b.y+offsetY,b.z, a.x-offsetX,a.y-offsetY,a.z, b.x-offsetX,b.y-offsetY,b.z
        );
      }
    }
    previous=next;
  }
  return new Float32Array(vertices);
}

export function drawOrbitLine(renderer, body, center, vp, alpha, selected) {
  if(!body.periodDays||!body.a) return;
  const gl=renderer.gl,points=[],n=renderer.planetId?100:180,periodMs=Number(body.periodDays)*DAY;
  const parent=renderer.byId.get(body.parentId);
  const displayRadius=renderer.planetId?planetOrbitRadius(body,parent):null;
  for(let i=0;i<=n;i++) {
    const local=keplerPosition(body,parent,Number(body.epoch||J2000)+i/n*periodMs,null,displayRadius);
    points.push(center[0]+local[0],center[1]+local[1],center[2]+local[2]);
  }
  const appearance=orbitAppearance(body,renderer.settings,alpha,selected);
  const raw=new Float32Array(points);
  const vertices=appearance.contrast
    ? orbitRibbonVertices(raw,vp,renderer.width,renderer.height,appearance.widthPx)
    : raw;
  if(!vertices.length) return;
  const program=renderer.useLineProgram(appearance.contrast?CLIP_IDENTITY:vp);
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);
  gl.uniform4f(gl.getUniformLocation(program,'uColor'),...appearance.rgb,appearance.alpha);
  gl.drawArrays(appearance.contrast?gl.TRIANGLES:gl.LINE_STRIP,0,vertices.length/3);
}
