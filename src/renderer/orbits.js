import { J2000 } from '../data/bodies.js';
import { DAY } from './math.js';
import { keplerPosition, planetOrbitRadius } from '../data/orbital-math.js';

export function drawOrbitLine(renderer, b, center, vp, alpha, selected) {
  if(!b.periodDays||!b.a)return;
  const gl=renderer.gl,points=[],n=renderer.planetId?100:180,periodMs=Number(b.periodDays)*DAY;
  const parent=renderer.byId.get(b.parentId);
  const displayRadius=renderer.planetId?planetOrbitRadius(b,parent):null;
  for(let i=0;i<=n;i++){const local=keplerPosition(b,parent,Number(b.epoch||J2000)+i/n*periodMs,null,displayRadius);
    points.push(center[0]+local[0],center[1]+local[1],center[2]+local[2]);}
  const p=renderer.useLineProgram(vp);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.DYNAMIC_DRAW);
  const rgb=selected?[.97,.78,.48]:[.37,.48,.66];
  gl.uniform4f(gl.getUniformLocation(p,'uColor'),...rgb,alpha);
  gl.drawArrays(gl.LINE_STRIP,0,n+1);
 }
