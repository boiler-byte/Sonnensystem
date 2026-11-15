import { J2000, AU_KM } from './data.js';

const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const DAY = 86400000;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const lerp = (a,b,t) => a + (b-a)*t;
const vadd = (a,b) => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const vsub = (a,b) => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const vlen = (a) => Math.hypot(...a);
const vnorm = (a) => { const n=vlen(a)||1; return a.map(x=>x/n); };
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];

export const sceneRadius = (aAU) => 3.4 * Math.sqrt(Math.max(0.01,aAU) + 0.22);
export function renderRadius(body) {
  if (!body) return 0;
  if (body.id === 'sun' || body.type === 'star') return 1.13;
  if (body.type === 'satellite') return .060;
  if (body.type === 'asteroid') return .11;
  if (body.type === 'moon') return clamp(.115+Math.log10(Math.max(1,body.radiusKm)/1000)*.055, .075,.235);
  if (body.type === 'dwarf') return .18;
  return clamp(.19+.48*Math.pow(Math.max(0,body.radiusKm)/69911,.39),.19,.67);
}
export function orbitalRadius(body, parent) {
  if (body.type === 'moon') {
    return renderRadius(parent)+.68+clamp(Math.log10(Math.max(10,body.a)/384400)*.36,-.26,.9);
  }
  if (body.type === 'satellite') {
    const rKm = Math.max(6300,body.a);
    return renderRadius(parent)+.28+clamp((rKm-6700)/35000*.35,0,1.0);
  }
  return sceneRadius(body.a);
}
export function keplerPosition(body, parent, timeMs, phase = null) {
  const a = orbitalRadius(body,parent);
  const ecc = clamp(Number(body.e)||0,0,.98);
  const period = Math.abs(Number(body.periodDays)) || 365.25;
  const t = ((timeMs - (Number(body.epoch)||J2000))/DAY) / period;
  let M = (phase == null ? (Number(body.M)||0)*RAD : phase) + t*TAU;
  M = ((M + Math.PI) % TAU + TAU) % TAU - Math.PI;
  let E = M;
  for (let j=0;j<7;j++) E -= (E - ecc*Math.sin(E) - M) / (1 - ecc*Math.cos(E));
  const f = Math.atan2(Math.sqrt(1-ecc*ecc)*Math.sin(E), Math.cos(E)-ecc);
  const r = a*(1-ecc*Math.cos(E));
  const i = (Number(body.i)||0)*RAD;
  const N = (Number(body.node)||0)*RAD;
  const w = (Number(body.peri)||0)*RAD;
  const u = f+w;
  const X = r*(Math.cos(N)*Math.cos(u)-Math.sin(N)*Math.sin(u)*Math.cos(i));
  const Y = r*Math.sin(u)*Math.sin(i);
  const Z = r*(Math.sin(N)*Math.cos(u)+Math.cos(N)*Math.sin(u)*Math.cos(i));
  return [X,Y,Z];
}
const matMul=(a,b)=>{
  const o=new Float32Array(16);
  for(let c=0;c<4;c++) for(let r=0;r<4;r++) for(let k=0;k<4;k++) o[c*4+r]+=a[k*4+r]*b[c*4+k];
  return o;
};
const perspective=(fov,aspect,near,far)=>{
  const f=1/Math.tan(fov/2),q=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*q,-1,0,0,2*far*near*q,0]);
};
const lookAt=(eye,center,up=[0,1,0])=>{
  const z=vnorm(vsub(eye,center)), x=vnorm(cross(up,z)), y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
};
const model=(p,s,tilt=0)=>{
  const c=Math.cos(tilt),t=Math.sin(tilt);
  return new Float32Array([s,0,0,0,0,s*c,s*t,0,0,-s*t,s*c,0,p[0],p[1],p[2],1]);
};
const hex=(h)=>{const n=parseInt(String(h||'#aaa').slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const shadeColor=(hexCode,amount=.22) => {const v=hex(hexCode);return v.map(x=>clamp(x*amount,0,1));};
function shader(gl,type,source) {
  const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error('WebGL Shader: '+gl.getShaderInfoLog(s));
  return s;
}
function program(gl,vertex,fragment) {
  const p=gl.createProgram(); gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vertex)); gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fragment)); gl.linkProgram(p);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw Error('WebGL Program: '+gl.getProgramInfoLog(p));
  return p;
}
const BODY_VS = `
attribute vec3 aPosition; attribute vec3 aNormal;
uniform mat4 uMVP;
varying vec3 vP; varying vec3 vN;
void main() { vP=aPosition; vN=aNormal; gl_Position=uMVP*vec4(aPosition,1.0); }
`;
const BODY_FS = `
precision highp float;
varying vec3 vP; varying vec3 vN;
uniform vec3 uBase; uniform vec3 uLight; uniform float uStyle; uniform float uSeed; uniform float uTime;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main() {
 vec3 n=normalize(vN);float y=vP.y;float fine=noise3(vP*19.0+uSeed);float broad=noise3(vP*6.0+uSeed);
 vec3 col=uBase;
 if (uStyle < .5) { // Sun
  float flow=sin(y*19.0+noise3(vP*8.0+uTime*.015)*5.0)+sin(vP.x*23.0-vP.z*14.0+uTime*.05);
  col=mix(vec3(1.0,.42,.10),vec3(1.0,.88,.43),clamp(.40+.18*flow+.22*fine,0.0,1.0));
 } else if (uStyle < 1.5) { // Rocky
  col*=mix(.63,1.36,broad*.7+fine*.3);
  float pit=smoothstep(.82,.91,noise3(vP*39.0+uSeed));col*=1.0-pit*.30;
 } else if (uStyle < 2.5) { // Earth
  float continents=noise3(vP*5.9+uSeed)+.30*noise3(vP*18.0+uSeed);
  float land=smoothstep(.51,.67,continents);
  col=mix(vec3(.045,.24,.49),mix(vec3(.10,.32,.17),vec3(.43,.43,.23),broad),land);
  col+=.035*fine;
  float clouds=smoothstep(.78,.90,noise3(vP*14.0+vec3(3.1)+uTime*.001));col=mix(col,vec3(.92,.96,1.0),clouds*.68);
  float polar=smoothstep(.79,.92,abs(y));col=mix(col,vec3(.85,.95,.99),polar);
 } else if (uStyle < 3.5) { // Gas bands
  float stripe=sin(y*48.0+sin(vP.x*9.0+uSeed)*1.1+2.1*broad);
  float belts=sin(y*18.0+fine*3.0);
  col=mix(uBase*.58,uBase*1.24,clamp(.52+.22*stripe+.25*belts,0.0,1.0));
  float spot=(1.0-smoothstep(.15,.24,length(vec2((vP.x-.64)*.80,(y+.22)*2.3))));
  if (uStyle<3.1) col=mix(col,vec3(.62,.24,.16),spot*.78);
 } else if (uStyle < 4.5) { // Venus, Titan
  float sw=sin(y*26.0+noise3(vP*10.0+uSeed)*5.0+vP.x*7.0);
  col=mix(uBase*.83,vec3(1.0,.90,.70),.45+.18*sw+.18*fine);
 } else if (uStyle < 5.5) { // Ice giants
  float z=sin(y*17.0+vP.x*3.0);col=mix(uBase*.75,uBase*1.12,.50+.12*z+.16*broad);
 } else if (uStyle < 6.5) { // Moon and ice
  col=mix(uBase*.65,uBase*1.18,broad*.64+fine*.36);
  float craters=smoothstep(.78,.91,noise3(vP*34.0+uSeed));col*=1.0-craters*.21;
 } else { // Pluto / Io
  col=mix(uBase*.74,vec3(.89,.77,.62),.38+.23*sin(vP.y*25.0+fine*7.0));
 }
 float light=clamp(.13+.89*max(dot(n,normalize(uLight)),0.0),.08,1.0);
 if (uStyle<.5) light=1.0;
 float rim=pow(1.0-abs(dot(n,normalize(vec3(.18,.20,1.0)))),3.0);
 col=col*light + (uStyle<.5 ? vec3(.12,.035,.0) : uBase*.05*rim);
 gl_FragColor=vec4(pow(max(col,0.0),vec3(.92)),1.0);
}`;
const LINE_VS=`attribute vec3 aPosition;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aPosition,1.0);}`;
const LINE_FS=`precision mediump float; uniform vec4 uColor;void main(){gl_FragColor=uColor;}`;
const STARS_VS=`attribute vec3 aPosition;attribute float aSize;uniform mat4 uVP;uniform float uPixelRatio;varying float vAlpha;void main(){gl_Position=uVP*vec4(aPosition,1.0);gl_PointSize=aSize*uPixelRatio;vAlpha=clamp(aSize/2.8,.25,1.0);}`;
const STARS_FS=`precision mediump float;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5);float a=1.0-smoothstep(.14,.48,r);gl_FragColor=vec4(.65,.81,1.0,a*.77*vAlpha);}`;
const RING_VS=`attribute vec3 aPosition;uniform mat4 uMVP;varying float vR;void main(){vR=length(aPosition.xz);gl_Position=uMVP*vec4(aPosition,1.0);}`;
const RING_FS=`precision mediump float;varying float vR;void main(){float bands=sin(vR*135.0)*.13+sin(vR*41.0)*.11;float gap=1.0-smoothstep(.82,.84,vR)+smoothstep(.88,.90,vR);float fade=smoothstep(.70,.78,vR)*(1.0-smoothstep(1.14,1.20,vR));float a=fade*(.41+bands)*gap;gl_FragColor=vec4(.78,.69,.52,a);}`;
const STYLES = {sun:0,rock:1,mars:1,earth:2,jupiter:3,saturn:3.2,venus:4,uranus:5,neptune:5,moon:6,ice:6,pluto:7,io:7};
function sphereGeometry(lat=30,lon=42) {
 const vertices=[],inds=[];
 for(let a=0;a<=lat;a++) {let theta=a*Math.PI/lat;
  for(let b=0;b<=lon;b++){const p=b*TAU/lon,x=Math.sin(theta)*Math.cos(p),y=Math.cos(theta),z=Math.sin(theta)*Math.sin(p);vertices.push(x,y,z,x,y,z);}}
 for(let a=0;a<lat;a++)for(let b=0;b<lon;b++){const p=a*(lon+1)+b,q=p+lon+1;inds.push(p,q,p+1,q,q+1,p+1);}
 return {vertices:new Float32Array(vertices),indices:new Uint16Array(inds)};
}
function ringGeometry() {
 const p=[];const count=200;
 for(let i=0;i<count;i++){const a=i*TAU/count,b=(i+1)*TAU/count;
  for(const [r,t] of [[.68,a],[1.20,a],[.68,b],[1.20,a],[1.20,b],[.68,b]])p.push(r*Math.cos(t),0,r*Math.sin(t));}
 return new Float32Array(p);
}
function starGeometry(n=2200){const a=[];let seed=19;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<n;i++){const u=rnd()*2-1,t=rnd()*TAU,R=100+rnd()*125,h=Math.sqrt(1-u*u);
  a.push(R*h*Math.cos(t),R*u,R*h*Math.sin(t),.8+rnd()*2.3);}
 return new Float32Array(a);
}
function projected(p,m,w,h){const x=p[0],y=p[1],z=p[2],cw=m[3]*x+m[7]*y+m[11]*z+m[15];if(cw<.01)return null;
 const cx=(m[0]*x+m[4]*y+m[8]*z+m[12])/cw,cy=(m[1]*x+m[5]*y+m[9]*z+m[13])/cw;
 return {x:(cx*.5+.5)*w,y:(-.5*cy+.5)*h,depth:cw,visible:Math.abs(cx)<1.5&&Math.abs(cy)<1.5};
}

export class SolarRenderer {
 constructor(canvas, labelCanvas, glow, callbacks={}) {
  this.canvas=canvas;this.labels=labelCanvas;this.glow=glow;this.callbacks=callbacks;
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false})||canvas.getContext('webgl',{antialias:true,alpha:false});
  if(!gl)throw Error('WebGL nicht verfügbar');this.gl=gl;
  this.bodyProgram=program(gl,BODY_VS,BODY_FS);this.lineProgram=program(gl,LINE_VS,LINE_FS);
  this.starsProgram=program(gl,STARS_VS,STARS_FS);this.ringProgram=program(gl,RING_VS,RING_FS);
  const geom=sphereGeometry();this.sphereVB=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.sphereVB);gl.bufferData(gl.ARRAY_BUFFER,geom.vertices,gl.STATIC_DRAW);
  this.sphereIB=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphereIB);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,geom.indices,gl.STATIC_DRAW);this.sphereCount=geom.indices.length;
  this.ringVB=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.ringVB);gl.bufferData(gl.ARRAY_BUFFER,ringGeometry(),gl.STATIC_DRAW);
  this.lineVB=gl.createBuffer();this.starVB=gl.createBuffer();this.starCount=2200;gl.bindBuffer(gl.ARRAY_BUFFER,this.starVB);gl.bufferData(gl.ARRAY_BUFFER,starGeometry(this.starCount),gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearColor(.013,.025,.058,1);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  this.camera={theta:.63,phi:.99,dist:47,target:[0,0,0],desiredTarget:[0,0,0],desiredDist:47};
  this.bodies=[];this.byId=new Map();this.positions=new Map();this.rendered=[];this.selectedId='earth';this.settings={orbits:true,labels:true};this.overrides=new Map();this.simTime=Date.now();
  this.dpr=1;this.width=0;this.height=0;this.viewportWidth=0;this.viewportHeight=0;
  this.drag=null;this.pointers=new Map();this.lastTap=0;
  this.attachEvents();this.resize();
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
 }
 attachEvents(){
  const c=this.canvas;
  c.addEventListener('contextmenu',e=>e.preventDefault());
  c.addEventListener('pointerdown',e=>{
    if(e.target!==c)return;
    this.pointers.set(e.pointerId,[e.clientX,e.clientY]);c.setPointerCapture(e.pointerId);
    this.drag={x:e.clientX,y:e.clientY,button:e.button,moved:false};
  });
  c.addEventListener('pointermove',e=>{
    if(!this.pointers.has(e.pointerId)||!this.drag)return;
    const prev=this.pointers.get(e.pointerId);this.pointers.set(e.pointerId,[e.clientX,e.clientY]);
    const dx=e.clientX-prev[0],dy=e.clientY-prev[1];if(Math.abs(dx)+Math.abs(dy)>1)this.drag.moved=true;
    const cam=this.camera;
    if(this.pointers.size>=2){cam.desiredDist=clamp(cam.desiredDist*(1+dy*.009),3,95);return;}
    if(this.drag.button===2||e.shiftKey){const k=cam.dist*.0019;cam.desiredTarget[0]-=dx*k;cam.desiredTarget[2]+=dy*k;}
    else{cam.theta-=dx*.0051;cam.phi=clamp(cam.phi+dy*.005, .16,1.55);}
  });
  c.addEventListener('pointerup',e=>{
    const rect=c.getBoundingClientRect();
    if(this.drag&&!this.drag.moved&&this.drag.button===0){this.pick(e.clientX-rect.left,e.clientY-rect.top);}
    this.pointers.delete(e.pointerId);this.drag=null;
  });
  c.addEventListener('pointercancel',e=>{this.pointers.delete(e.pointerId);this.drag=null;});
  c.addEventListener('wheel',e=>{e.preventDefault();this.camera.desiredDist=clamp(this.camera.desiredDist*Math.exp(e.deltaY*.001),2.2,100);},{passive:false});
 }
 resize(){const r=this.canvas.parentElement.getBoundingClientRect();const w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));this.dpr=Math.min(window.devicePixelRatio||1,1.8);
  this.width=w;this.height=h;this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);
  this.labels.width=this.canvas.width;this.labels.height=this.canvas.height;
  this.canvas.style.width=w+'px';this.canvas.style.height=h+'px';this.labels.style.width=w+'px';this.labels.style.height=h+'px';
  this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
 }
 setBodies(list){this.bodies=list;this.byId=new Map(list.map(o=>[o.id,o]));}
 setSelected(id,{focus=false}={}){this.selectedId=id;if(focus)this.focus(id);}
 focus(id){const b=this.byId.get(id);if(!b)return;
  const pos=this.positions.get(id);if(pos)this.camera.desiredTarget=pos.slice();
  const dist=b.type==='star'?24:b.type==='planet'?10.5:b.type==='moon'?3.8:b.type==='satellite'?3.6:b.type==='dwarf'?8.7:7.5;
  this.camera.desiredDist=dist;
 }
 reset(){this.camera.desiredTarget=[0,0,0];this.camera.desiredDist=47;this.camera.theta=.63;this.camera.phi=.99;}
 setOverride(id,date,vector){this.overrides.set(id,{date,vector});}
 calcPositions(timeMs){this.positions.clear();const inProgress=new Set();
  const calc=id=>{if(this.positions.has(id))return this.positions.get(id);
    const b=this.byId.get(id);if(!b)return[0,0,0];
    if(inProgress.has(id))return[0,0,0];inProgress.add(id);
    if(!b.parentId){this.positions.set(id,[0,0,0]);inProgress.delete(id);return[0,0,0];}
    const parent=this.byId.get(b.parentId);const center=calc(b.parentId);
    let rel=keplerPosition(b,parent,timeMs);
    const date=new Date(timeMs).toISOString().slice(0,10),ov=this.overrides.get(id);
    if(ov&&ov.date===date){const [x,y,z]=ov.vector;const length=Math.hypot(x,y,z)||1;
      const scale=b.type==='moon'?orbitalRadius(b,parent)/length:sceneRadius(length/AU_KM)/length;
      // JPL reference ECLIPTIC: x,y are ecliptic plane; z is latitude.
      rel=[x*scale,z*scale,y*scale];
    }
    const out=vadd(center,rel);this.positions.set(id,out);inProgress.delete(id);return out;
  };
  this.bodies.forEach(b=>calc(b.id));
 }
 shouldDraw(b){if(b.type==='star'||b.type==='planet'||b.type==='dwarf')return true;
  if(b.type==='asteroid')return true;
  const s=this.byId.get(this.selectedId);
  if(b.type==='satellite')return this.selectedId===b.id || this.selectedId==='earth' || (s?.type==='satellite' && b.id.startsWith('sat-'));
  if(b.type==='moon') return b.id===this.selectedId || (s && (s.id===b.parentId || s.parentId===b.parentId)) || (this.camera.dist<21 && ['moon','europa','ganymede','titan','triton','charon'].includes(b.id));
  return false;
 }
 start(time,selected,settings){this.simTime=time;this.selectedId=selected;this.settings=settings;this.calcPositions(time);}
 makeVP(){const cam=this.camera;cam.dist=lerp(cam.dist,cam.desiredDist,.075);
  for(let i=0;i<3;i++)cam.target[i]=lerp(cam.target[i],cam.desiredTarget[i],.075);
  const r=cam.dist,phi=cam.phi,th=cam.theta;
  const eye=[cam.target[0]+r*Math.sin(phi)*Math.sin(th),cam.target[1]+r*Math.cos(phi),cam.target[2]+r*Math.sin(phi)*Math.cos(th)];
  const vp=matMul(perspective(Math.PI/4.35,this.width/this.height,.1,350),lookAt(eye,cam.target));
  return {vp,eye};
 }
 useLineProgram(vp){const gl=this.gl,p=this.lineProgram;gl.useProgram(p);
  gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,vp);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.lineVB);
  const a=gl.getAttribLocation(p,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  return p;
 }
 orbitLine(b,center,vp,alpha,selected){
  if(!b.periodDays||!b.a)return;
  const gl=this.gl,points=[],n=180,periodMs=Number(b.periodDays)*DAY;
  for(let i=0;i<=n;i++){const local=keplerPosition(b,this.byId.get(b.parentId),Number(b.epoch||J2000)+i/n*periodMs);
    points.push(center[0]+local[0],center[1]+local[1],center[2]+local[2]);}
  const p=this.useLineProgram(vp);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.DYNAMIC_DRAW);
  const rgb=selected?[.97,.78,.48]:[.37,.48,.66];
  gl.uniform4f(gl.getUniformLocation(p,'uColor'),...rgb,alpha);
  gl.drawArrays(gl.LINE_STRIP,0,n+1);
 }
 drawStars(vp){const gl=this.gl,p=this.starsProgram;gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uVP'),false,vp);
  gl.uniform1f(gl.getUniformLocation(p,'uPixelRatio'),this.dpr);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.starVB);
  const pos=gl.getAttribLocation(p,'aPosition'),size=gl.getAttribLocation(p,'aSize');gl.enableVertexAttribArray(pos);gl.enableVertexAttribArray(size);
  gl.vertexAttribPointer(pos,3,gl.FLOAT,false,16,0);gl.vertexAttribPointer(size,1,gl.FLOAT,false,16,12);
  gl.depthMask(false);gl.drawArrays(gl.POINTS,0,this.starCount);gl.depthMask(true);
 }
 drawSphere(body,p,vp){const gl=this.gl,program=this.bodyProgram;gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.sphereVB);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.sphereIB);
  const a=gl.getAttribLocation(program,'aPosition'),n=gl.getAttribLocation(program,'aNormal');gl.enableVertexAttribArray(a);gl.enableVertexAttribArray(n);
  gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(n,3,gl.FLOAT,false,24,12);
  const r=renderRadius(body)*(this.selectedId===body.id?1.045:1);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,matMul(vp,model(p,r)));
  const color=hex(body.color);gl.uniform3f(gl.getUniformLocation(program,'uBase'),...color);
  const light=vnorm(vsub([0,0,0],p));gl.uniform3f(gl.getUniformLocation(program,'uLight'),...light);
  gl.uniform1f(gl.getUniformLocation(program,'uStyle'),STYLES[body.style]??1);
  let seed=0;for(let i=0;i<body.id.length;i++)seed+=body.id.charCodeAt(i)*.11;
  gl.uniform1f(gl.getUniformLocation(program,'uSeed'),seed);
  gl.uniform1f(gl.getUniformLocation(program,'uTime'),this.simTime/DAY);
  gl.drawElements(gl.TRIANGLES,this.sphereCount,gl.UNSIGNED_SHORT,0);
 }
 drawRings(p,vp){const gl=this.gl,program=this.ringProgram;gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,this.ringVB);const a=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(gl.getUniformLocation(program,'uMVP'),false,matMul(vp,model(p,1,.41)));
  gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,200*6);gl.depthMask(true);
 }
 drawLabels(vp){const ctx=this.labels.getContext('2d');const w=this.width,h=this.height;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.clearRect(0,0,w,h);
  if(!this.settings.labels)return;
  const labelBodies=this.rendered.filter(b=>b.type==='star'||b.type==='planet'||b.id===this.selectedId||(['pluto','ceres','moon'].includes(b.id)&&this.camera.dist<35));
  for(const b of labelBodies){const pos=this.positions.get(b.id),pr=projected(pos,vp,w,h);if(!pr?.visible)continue;
    const selected=b.id===this.selectedId;
    const name=b.name.toUpperCase();const px=pr.x+Math.max(11,renderRadius(b)*h/(this.camera.dist*.77))+8,py=pr.y+4;
    if(px>w-30||py<20||py>h-18)continue;
    const fs=selected?11:9.5;ctx.font=`${selected?'700':'600'} ${fs}px system-ui, sans-serif`;
    ctx.fillStyle=selected?'#f5d5a0':'#9eaaba';ctx.globalAlpha=selected?1:.82;
    ctx.fillText(name,px,py);
    ctx.beginPath();ctx.arc(px-8,py-3,selected?2.4:1.7,0,TAU);ctx.fillStyle=selected?'#e7b979':'#8394a8';ctx.fill();
    if(selected){ctx.beginPath();ctx.arc(pr.x,pr.y,Math.max(12,renderRadius(b)*h/(this.camera.dist*.5)),0,TAU);ctx.strokeStyle='rgba(235,184,118,.40)';ctx.lineWidth=1;ctx.stroke();}
    ctx.globalAlpha=1;
  }
 }
 draw(timeMs,selectedId,settings){const gl=this.gl;if(this.width<2||this.height<2)return;
  this.start(timeMs,selectedId,settings);
  const {vp}=this.makeVP();this.vp=vp;
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  this.drawStars(vp);
  const selected=this.byId.get(selectedId);
  if(settings.orbits){gl.depthMask(false);
   const primary=this.bodies.filter(b=>b.parentId==='sun'&&b.type==='planet');
   for(const b of primary)this.orbitLine(b,[0,0,0],vp,b.id===selectedId?.65:.20,b.id===selectedId);
   for(const b of this.bodies.filter(b=>b.parentId==='sun'&&b.type==='dwarf'&&(['pluto','ceres'].includes(b.id)||b.id===selectedId)))this.orbitLine(b,[0,0,0],vp,b.id===selectedId?.63:.12,b.id===selectedId);
   if(selected?.type==='asteroid')this.orbitLine(selected,[0,0,0],vp,.71,true);
   const moons=this.bodies.filter(b=>b.type==='moon'&&b.parentId&&(b.id===selectedId||b.parentId===selectedId||(selected?.parentId===b.parentId&&b.radiusKm>180)));
   for(const b of moons.slice(0,24))this.orbitLine(b,this.positions.get(b.parentId)||[0,0,0],vp,b.id===selectedId?.64:.2,b.id===selectedId);
   gl.depthMask(true);
  }
  this.rendered=this.bodies.filter(b=>this.shouldDraw(b)&&this.positions.has(b.id));
  this.rendered.sort((a,b)=>{
    const order={star:0,planet:1,dwarf:2,asteroid:3,moon:4,satellite:5};return order[a.type]-order[b.type];
  });
  for(const b of this.rendered){const p=this.positions.get(b.id);if(b.id==='saturn')this.drawRings(p,vp);this.drawSphere(b,p,vp);}
  this.drawLabels(vp);
  const sun=projected([0,0,0],vp,this.width,this.height);
  if(sun){this.glow.style.left=sun.x+'px';this.glow.style.top=sun.y+'px';this.glow.style.opacity=clamp(.98-(this.camera.dist-15)/90,.25,.9).toFixed(2);}
 }
 pick(x,y){if(!this.vp)return;let best=null,dist=Infinity;
  for(const b of this.rendered){const p=projected(this.positions.get(b.id),this.vp,this.width,this.height);if(!p?.visible)continue;
   const radius=renderRadius(b)*this.height/(this.camera.dist*.6);
   const d=Math.hypot(x-p.x,y-p.y);const threshold=Math.max(12,Math.min(radius+5,40));
   if(d<threshold&&d<dist){best=b;dist=d;}
  }
  if(best&&this.callbacks.onSelect)this.callbacks.onSelect(best.id);
 }
}
