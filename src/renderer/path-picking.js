/** Hit-test the *world-space vertices actually rendered* for a paused orbit or
 * galactic trail. Match WebGL's clip test and use CSS pixels, not framebuffer
 * pixels, so devicePixelRatio and canvas scaling cannot shift hit locations. */
function clippedScreenPoint(points,index,vp,width,height){
  const x=points[index],y=points[index+1],z=points[index+2];
  const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
  if(!Number.isFinite(w)||w<=.01)return null;
  const cx=vp[0]*x+vp[4]*y+vp[8]*z+vp[12];
  const cy=vp[1]*x+vp[5]*y+vp[9]*z+vp[13];
  const cz=vp[2]*x+vp[6]*y+vp[10]*z+vp[14];
  if(cz < -w || cz > w)return null;
  return {x:(cx/w*.5+.5)*width,y:(.5-cy/w*.5)*height,depth:cz/w};
}

export const PATH_PICK_RADIUS_PX=9;

/** Return the nearest visible line segment, or null outside its hit radius. */
export function hitTestProjectedPath(points,vp,width,height,x,y,radiusPx=PATH_PICK_RADIUS_PX){
  if(!points || points.length<6 || !vp || width<=0 || height<=0 ||
    !Number.isFinite(x) || !Number.isFinite(y) || radiusPx<=0)return null;
  let previous=null,best=null;
  const limitSq=radiusPx*radiusPx;
  for(let i=0;i<points.length;i+=3){
    const next=clippedScreenPoint(points,i,vp,width,height);
    if(previous && next){
      const dx=next.x-previous.x,dy=next.y-previous.y;
      const lengthSq=dx*dx+dy*dy;
      if(lengthSq>1e-10 && Number.isFinite(lengthSq)){
        const t=Math.max(0,Math.min(1,((x-previous.x)*dx+(y-previous.y)*dy)/lengthSq));
        const hitX=previous.x+t*dx,hitY=previous.y+t*dy;
        const distSq=(x-hitX)**2+(y-hitY)**2;
        if(distSq<=limitSq && (!best || distSq<best.distSq))
          best={distSq,depth:previous.depth+(next.depth-previous.depth)*t,x:hitX,y:hitY};
      }
    }
    previous=next;
  }
  return best;
}

/** Only paths registered by the live draw pass are eligible for selection. */
export function pickVisiblePath(paths,vp,width,height,x,y,radiusPx=PATH_PICK_RADIUS_PX){
  if(!Array.isArray(paths) || x<0 || x>width || y<0 || y>height)return null;
  let best=null;
  for(const path of paths){
    if(!path?.body?.id)continue;
    const hit=hitTestProjectedPath(path.points,vp,width,height,x,y,radiusPx);
    if(!hit)continue;
    // Prefer the front-most trace at crossings with essentially equal pixel distance.
    if(!best || hit.distSq<best.distSq-.25 ||
      (Math.abs(hit.distSq-best.distSq)<=.25 && hit.depth<best.depth))
      best={...hit,body:path.body};
  }
  return best;
}
