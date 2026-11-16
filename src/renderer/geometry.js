import { TAU } from './math.js';

export function sphereGeometry(lat=30,lon=42) {
 const vertices=[],inds=[];
 for(let a=0;a<=lat;a++) {let theta=a*Math.PI/lat;
  for(let b=0;b<=lon;b++){const p=b*TAU/lon,x=Math.sin(theta)*Math.cos(p),y=Math.cos(theta),z=Math.sin(theta)*Math.sin(p);vertices.push(x,y,z,x,y,z,b/lon,1-a/lat);}}
 for(let a=0;a<lat;a++)for(let b=0;b<lon;b++){const p=a*(lon+1)+b,q=p+lon+1;inds.push(p,q,p+1,q,q+1,p+1);}
 return {vertices:new Float32Array(vertices),indices:new Uint16Array(inds)};
}
export function ringGeometry() {
 const p=[];const count=200;
 for(let i=0;i<count;i++){const a=i*TAU/count,b=(i+1)*TAU/count;
  for(const [r,t] of [[.68,a],[1.20,a],[.68,b],[1.20,a],[1.20,b],[.68,b]])p.push(r*Math.cos(t),0,r*Math.sin(t));}
 return new Float32Array(p);
}
export function starGeometry(n=2200){const a=[];let seed=19;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<n;i++){const u=rnd()*2-1,t=rnd()*TAU,R=100+rnd()*125,h=Math.sqrt(1-u*u);
  a.push(R*h*Math.cos(t),R*u,R*h*Math.sin(t),.8+rnd()*2.3);}
 return new Float32Array(a);
}
