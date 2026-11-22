import { CAMERA_FOV } from './math.js';

/** LOD thresholds are diameters in CSS pixels, independent of devicePixelRatio. */
export const OBJECT_LOD = Object.freeze({ FULL:0, SIMPLE:1, MARKER:2, PIXEL:3 });
export const LOD_DIAMETERS = Object.freeze({ full:32, simple:8, marker:2 });
export const MARKER_FLOATS = 9; // world XYZ, RGB, alpha, CSS size, circle/square

/** Projected diameter of the sphere's visible silhouette (not its radius).
 * The camera's perspective w is also its positive view-space depth.  Using
 * the tangent depth keeps close objects consistent with the picking radius.
 */
export function projectedSphereDiameter(position, vp, height, radiusWorld) {
  if(!position || !vp || !(height>0) || !Number.isFinite(radiusWorld) || radiusWorld<0)return NaN;
  const [x,y,z]=position;
  if(![x,y,z].every(Number.isFinite))return NaN;
  const depth=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
  if(!Number.isFinite(depth))return NaN;
  // A sphere containing the eye, or cutting the near plane, needs full geometry.
  if(depth<=radiusWorld)return Infinity;
  const tangentDepth=Math.sqrt(depth*depth-radiusWorld*radiusWorld);
  if(!(tangentDepth>0))return Infinity;
  return 2*radiusWorld*height/(2*Math.tan(CAMERA_FOV/2)*tangentDepth);
}

/** Invalid projections conservatively retain the current full sphere. */
export function objectLOD(diameterPx) {
  if(Number.isNaN(diameterPx) || diameterPx<0)return OBJECT_LOD.FULL;
  if(diameterPx>=LOD_DIAMETERS.full)return OBJECT_LOD.FULL;
  if(diameterPx>=LOD_DIAMETERS.simple)return OBJECT_LOD.SIMPLE;
  if(diameterPx>=LOD_DIAMETERS.marker)return OBJECT_LOD.MARKER;
  return OBJECT_LOD.PIXEL;
}

/** Reuse growing typed arrays instead of allocating one WebGL vertex per body.
 * Opaque points are depth-writing; transition ghosts are drawn separately.
 */
export class LODMarkerBatch {
  constructor(capacity=64){
    const floats=Math.max(1,capacity)*MARKER_FLOATS;
    this.opaque=new Float32Array(floats);
    this.translucent=new Float32Array(floats);
    this.opaqueCount=0;this.translucentCount=0;
  }
  reset(){this.opaqueCount=0;this.translucentCount=0;}
  push(position,color,alpha,sizePx,lod){
    if(!(alpha>0) || !position || !color)return;
    const faded=alpha<.999, key=faded?'translucent':'opaque';
    let data=this[key];const count=this[key+'Count'],offset=count*MARKER_FLOATS;
    if(offset+MARKER_FLOATS>data.length){
      const larger=new Float32Array(data.length*2);
      larger.set(data);this[key]=data=larger;
    }
    data[offset]=position[0];data[offset+1]=position[1];data[offset+2]=position[2];
    data[offset+3]=color[0];data[offset+4]=color[1];data[offset+5]=color[2];
    data[offset+6]=alpha;
    data[offset+7]=lod===OBJECT_LOD.PIXEL?1:sizePx;
    data[offset+8]=lod===OBJECT_LOD.PIXEL?1:0;
    this[key+'Count']=count+1;
  }
  vertices(key){return this[key].subarray(0,this[key+'Count']*MARKER_FLOATS);}
}
