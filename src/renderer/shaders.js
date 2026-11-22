// Embedded GLSL: no CDN or external shader assets.
function shader(gl,type,source) {
  const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
    const info=gl.getShaderInfoLog(s);
    gl.deleteShader?.(s);
    throw Error('WebGL Shader: '+info);
  }
  return s;
}
export function program(gl,vertex,fragment) {
  const p=gl.createProgram();
  let vs=null,fs=null;
  try{
    vs=shader(gl,gl.VERTEX_SHADER,vertex);
    fs=shader(gl,gl.FRAGMENT_SHADER,fragment);
    gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('WebGL Program: '+gl.getProgramInfoLog(p));
    return p;
  }catch(error){gl.deleteProgram?.(p);throw error;}
  finally{
    // Once linked, the program retains the compiled code. Shader handles
    // themselves are no longer needed and would otherwise stay on the GPU.
    if(vs)gl.deleteShader?.(vs);
    if(fs)gl.deleteShader?.(fs);
  }
}
export const BODY_VS = `
attribute vec3 aPosition; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uMVP;
varying vec3 vP; varying vec3 vN; varying vec2 vUV;
void main() { vP=aPosition; vN=aNormal; vUV=aUV; gl_Position=uMVP*vec4(aPosition,1.0); }
`;
export const BODY_FS = `
precision highp float;
varying vec3 vP; varying vec3 vN; varying vec2 vUV;
uniform vec3 uBase; uniform vec3 uLight; uniform float uStyle; uniform float uSeed; uniform float uTime; uniform float uOpacity;
uniform float uOptimizedLighting;
uniform sampler2D uDiffuse; uniform float uHasTexture;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yxz+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main() {
 vec3 n=normalize(vN);float y=vP.y;float fine=noise3(vP*19.0+uSeed);float broad=noise3(vP*6.0+uSeed);
 vec3 col=uBase;
 if (uHasTexture > .5) {
  col = texture2D(uDiffuse,vUV).rgb;
 } else if (uStyle < .5) { // Sun
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
 float diffuse=max(dot(n,normalize(uLight)),0.0);
 float light=clamp(.13+.89*diffuse,.08,1.0); // Realistisch: unchanged v28 lighting.
 light=mix(light,.50+.50*diffuse,step(.5,uOptimizedLighting)); // Optimiert: visible night side.
 if (uStyle<.5) light=1.0; // The Sun stays self-luminous in both modes.
 float rim=pow(1.0-abs(dot(n,normalize(vec3(.18,.20,1.0)))),3.0);
 col=col*light + (uStyle<.5 ? vec3(.12,.035,.0) : uBase*.05*rim);
 gl_FragColor=vec4(pow(max(col,0.0),vec3(.92)),clamp(uOpacity,0.0,1.0));
}`;
/** Lightweight, texture-free lighting for 8-32 CSS-pixel spheres. */
export const BODY_SIMPLE_FS = `
precision mediump float;
varying vec3 vN;
uniform vec3 uBase; uniform vec3 uLight;
uniform float uStyle; uniform float uOpacity; uniform float uOptimizedLighting;
void main(){
 float diffuse=max(dot(normalize(vN),normalize(uLight)),0.0);
 float light=clamp(.13+.89*diffuse,.08,1.0);
 light=mix(light,.50+.50*diffuse,step(.5,uOptimizedLighting));
 if(uStyle<.5)light=1.0;
 gl_FragColor=vec4(pow(max(uBase*light,vec3(0.0)),vec3(.92)),clamp(uOpacity,0.0,1.0));
}`;
/** A single point-sprite draw handles all 2-8 px discs and <2 px pixels. */
export const LOD_MARKER_VS = `
attribute vec3 aPosition; attribute vec4 aColor; attribute float aSize; attribute float aPixel;
uniform mat4 uVP;uniform float uPixelRatio;
varying vec4 vColor;varying float vPixel;
void main(){
 gl_Position=uVP*vec4(aPosition,1.0);
 gl_PointSize=max(1.0,aSize*uPixelRatio);
 vColor=aColor;vPixel=aPixel;
}`;
export const LOD_MARKER_FS = `
precision mediump float;
varying vec4 vColor;varying float vPixel;
void main(){
 if(vPixel>.5){gl_FragColor=vColor;return;}
 float r=length(gl_PointCoord-vec2(.5));
 if(r>.5)discard;
 float edge=1.0-smoothstep(.40,.50,r);
 gl_FragColor=vec4(vColor.rgb*(1.04-.30*r),vColor.a*edge);
}`;
export const LINE_VS=`attribute vec3 aPosition;uniform mat4 uVP;void main(){gl_Position=uVP*vec4(aPosition,1.0);}`;
export const LINE_FS=`precision mediump float; uniform vec4 uColor;void main(){gl_FragColor=uColor;}`;
export const STARS_VS=`attribute vec3 aPosition;attribute float aSize;uniform mat4 uVP;uniform float uPixelRatio;uniform vec3 uGalacticStarOffset;varying float vAlpha;void main(){float near=clamp((225.0-length(aPosition))/125.0,0.0,1.0);float depthWeight=.02+.98*near*near;vec3 position=aPosition+uGalacticStarOffset*depthWeight;gl_Position=uVP*vec4(position,1.0);gl_PointSize=aSize*uPixelRatio;vAlpha=clamp(aSize/2.8,.25,1.0);}`;
export const STARS_FS=`precision mediump float;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5);float a=1.0-smoothstep(.14,.48,r);gl_FragColor=vec4(.65,.81,1.0,a*.77*vAlpha);}`;
export const RING_VS=`attribute vec3 aPosition;uniform mat4 uMVP;varying float vR;void main(){vR=length(aPosition.xz);gl_Position=uMVP*vec4(aPosition,1.0);}`;
export const RING_FS=`precision mediump float;uniform float uOpacity;varying float vR;void main(){float bands=sin(vR*135.0)*.13+sin(vR*41.0)*.11;float gap=1.0-smoothstep(.82,.84,vR)+smoothstep(.88,.90,vR);float fade=smoothstep(.70,.78,vR)*(1.0-smoothstep(1.14,1.20,vR));float a=fade*(.41+bands)*gap;gl_FragColor=vec4(.78,.69,.52,a*clamp(uOpacity,0.0,1.0));}`;
export const STYLES = {sun:0,rock:1,mars:1,earth:2,jupiter:3,saturn:3.2,venus:4,uranus:5,neptune:5,moon:6,ice:6,pluto:7,io:7};
