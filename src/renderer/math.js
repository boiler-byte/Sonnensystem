// Geometry and linear algebra shared by the WebGL camera and scene.
export const TAU = Math.PI * 2;
export const RAD = Math.PI / 180;
export const DAY = 86400000;
export const CAMERA_FOV = Math.PI / 4.35;
export const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
export const lerp = (a,b,t) => a + (b-a)*t;
export const vadd = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const vsub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const vlen = (a) => Math.hypot(...a);
export const vnorm = (a) => { const n=vlen(a)||1; return a.map(x=>x/n); };
export const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

export const matMul=(a,b)=>{
  const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) o[c*4+r]+=a[k*4+r]*b[c*4+k];
  return o;
};
export const perspective=(fov,aspect,near,far)=>{
  const f=1/Math.tan(fov/2),q=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*q,-1,0,0,2*far*near*q,0]);
};
export const lookAt=(eye,center,up=[0,1,0])=>{
  const z=vnorm(vsub(eye,center)), x=vnorm(cross(up,z)), y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
};

export const model=(p,s,tilt=0)=>{
  const c=Math.cos(tilt),t=Math.sin(tilt);
  return new Float32Array([s,0,0,0,0,s*c,s*t,0,0,-s*t,s*c,0,p[0],p[1],p[2],1]);
};
export const hex=(h)=>{const n=parseInt(String(h||'#aaa').slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
export const shadeColor=(hexCode,amount=.22) => {const v=hex(hexCode);return v.map(x=>clamp(x*amount,0,1));};

export function projected(p,m,w,h){const x=p[0],y=p[1],z=p[2],cw=m[3]*x+m[7]*y+m[11]*z+m[15];if(cw<.01)return null;
 const cx=(m[0]*x+m[4]*y+m[8]*z+m[12])/cw,cy=(m[1]*x+m[5]*y+m[9]*z+m[13])/cw;
 return {x:(cx*.5+.5)*w,y:(-.5*cy+.5)*h,depth:cw,visible:Math.abs(cx)<1.5&&Math.abs(cy)<1.5};
}
