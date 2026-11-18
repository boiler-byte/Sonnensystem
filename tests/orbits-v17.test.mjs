import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { CATEGORY_COLORS, EARTH_ORBIT_COLOR, TYPES } from '../src/data/bodies.js';
import { layerPreset, STANDARD_LAYERS, layerEnabled } from '../src/data/layers.js';
import { orbitAppearance, orbitRibbonVertices, drawOrbitLine } from '../src/renderer/orbits.js';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';

const read = path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const IDENTITY=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

test('v25: solar Standard includes only Sun and planets',()=>{
  const standard=layerPreset('standard');
  assert.deepEqual([...STANDARD_LAYERS],['star','planet']);
  assert.equal(standard.mode,'standard');
  assert.equal(layerEnabled(standard,'star'),true);
  assert.equal(layerEnabled(standard,'planet'),true);
  for(const type of ['moon','satellite']) assert.equal(layerEnabled(standard,type),false,type);
  for(const type of ['dwarf','asteroid','comet','probe']) assert.equal(layerEnabled(standard,type),false,type);
  const visible=INITIAL_BODIES.filter(b=>layerEnabled(standard,b.type));
  assert.equal(visible.filter(b=>b.type==='planet').length,8);
  assert.deepEqual(visible.filter(b=>b.type==='star').map(b=>b.id),['sun']);
  assert.ok(!visible.some(b=>b.type==='moon'));
  assert.ok(!visible.some(b=>b.type==='satellite'));
  assert.equal(visible.length,INITIAL_BODIES.filter(b=>['planet','star'].includes(b.type)).length);
});

test('v17: all category colors and the Earth-orbit exception are exact',()=>{
  assert.deepEqual(CATEGORY_COLORS,{
    planet:'#E6EDF5', moon:'#E6EDF5', dwarf:'#B68CFF', tno:'#7BB6CF', asteroid:'#E9B44C', binary:'#CEAB78',
    comet:'#FF7597', satellite:'#A7D86D', probe:'#FF8B4A', star:'#FFE5A0'
  });
  assert.equal(EARTH_ORBIT_COLOR,'#4DA3FF');
  for(const [type,color] of Object.entries(CATEGORY_COLORS)){
    assert.equal(TYPES[type].color,color,`UI color for ${type}`);
    assert.equal(orbitAppearance({type,id:type},{}).color,color,`Orbit color for ${type}`);
  }
  assert.equal(orbitAppearance({type:'planet',id:'earth'},{}).color,'#4DA3FF');
  assert.equal(orbitAppearance({type:'moon',id:'moon'},{}).color,'#E6EDF5');
  assert.notEqual(orbitAppearance({type:'planet',id:'mars'},{}).color,EARTH_ORBIT_COLOR);
});

test('v43: category colors are permanent; contrast still controls stroke width and opacity',()=>{
  const earth={type:'planet',id:'earth'};
  const defaults=orbitAppearance(earth,{},.2,false);
  assert.equal(defaults.color,EARTH_ORBIT_COLOR);
  assert.ok(defaults.widthPx>=2.0);
  assert.ok(defaults.alpha>=.5);
  const noContrast=orbitAppearance(earth,{orbitContrast:false},.2,false);
  assert.equal(noContrast.color,EARTH_ORBIT_COLOR);
  assert.equal(noContrast.widthPx,1);
  assert.equal(noContrast.alpha,.2);
  const legacy=orbitAppearance(earth,{orbitColors:false},.2,false);
  assert.equal(legacy.color,EARTH_ORBIT_COLOR,'obsolete orbitColors flag cannot disable category palette');
  assert.equal(legacy.widthPx,defaults.widthPx);
  assert.equal(orbitAppearance({type:'asteroid',id:'ceres'},{orbitColors:false}).color,CATEGORY_COLORS.asteroid);
  const selected=orbitAppearance(earth,{},.7,true);
  assert.ok(selected.widthPx>defaults.widthPx);
  assert.ok(selected.alpha>.7);
});

test('v17: screen-space ribbon forms correctly sized triangles independent of WebGL lineWidth limits',()=>{
  const path=new Float32Array([-.5,0,0,.5,0,0]);
  const vertices=orbitRibbonVertices(path,IDENTITY,800,600,2.4);
  assert.equal(vertices.length,18,'two triangles form a single segment');
  assert.ok([...vertices].every(Number.isFinite));
  // First vertex is offset by half 2.4px = 1.2px upwards in CSS pixel space.
  assert.ok(Math.abs(vertices[1]-(2.4/600))<1e-7);
  assert.ok(Math.abs(vertices[4]+(2.4/600))<1e-7);
  assert.equal(orbitRibbonVertices(path,IDENTITY,800,600,0).length,18);
  const behind=new Float32Array([-.5,0,-2,.5,0,-2]);
  assert.equal(orbitRibbonVertices(behind,IDENTITY,800,600,2.4).length,0);
  const cameraBehind=new Float32Array([-.5,0,0,.5,0,0]);
  const flipW=IDENTITY.slice();flipW[15]=-1;
  assert.equal(orbitRibbonVertices(cameraBehind,flipW,800,600,2.4).length,0);
});

test('v17: orbital draw switches GL_TRIANGLES/GL_LINE_STRIP without touching object surfaces',()=>{
  const body=INITIAL_BODIES.find(b=>b.id==='earth');
  const sun=INITIAL_BODIES.find(b=>b.id==='sun');
  const captured=[];
  const gl={ARRAY_BUFFER:34962,DYNAMIC_DRAW:35048,TRIANGLES:4,LINE_STRIP:3,
    bufferData(...args){captured.push(['upload',args]);},
    getUniformLocation(){return {};},
    uniform4f(_loc,r,g,b,a){captured.push(['rgba',[r,g,b,a]]);},
    drawArrays(mode,start,n){captured.push(['draw',{mode,start,n}]);}
  };
  const renderer={gl,planetId:null,byId:new Map([['sun',sun]]),width:960,height:540,
    settings:{orbitContrast:true,orbitColors:true},
    useLineProgram(matrix){captured.push(['vp',matrix]);return {};}}
  const vp=new Float32Array([.1,0,0,0,0,.1,0,0,0,0,.1,0,0,0,0,1]);
  drawOrbitLine(renderer,body,[0,0,0],vp,.2,false);
  let draw=captured.find(x=>x[0]==='draw')?.[1];
  assert.ok(draw?.n>180,'Contrast uses real triangles');
  assert.equal(draw.mode,gl.TRIANGLES);
  assert.deepEqual([...captured.find(x=>x[0]==='vp')[1]],[...IDENTITY]);
  captured.length=0;
  renderer.settings.orbitContrast=false;
  drawOrbitLine(renderer,body,[0,0,0],vp,.2,false);
  draw=captured.find(x=>x[0]==='draw')?.[1];
  assert.equal(draw.mode,gl.LINE_STRIP);
  assert.equal(draw.n,181);
  assert.equal(captured.find(x=>x[0]==='vp')[1],vp);
});

test('v55: orbit switches are in Layer appearance controls without a separate menu',async()=>{
 const html=await read('index.html'),app=await read('src/app.js'),mobile=await read('src/ui/bottom-sheet.js');
 const layer=html.slice(html.indexOf('id="layer-popover"'),html.indexOf('id="time-panel"'));
 assert.match(layer,/class="layer-display-toggles"/);
 for(const id of ['orbit-visibility-btn','orbit-contrast-btn']){
   assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
   assert.match(layer,new RegExp(`id="${id}"[^>]*aria-pressed="${id==='orbit-contrast-btn'?'false':'true'}"`));
   assert.match(app,/\$\(id\)\.addEventListener\('click'/);
 }
 assert.doesNotMatch(html,/id="orbit-popover"|id="toggle-orbits"|id="orbit-picker-wrap"/);
 assert.doesNotMatch(app,/setOrbitPopover|toggle-orbits|orbit-popover/);
 assert.doesNotMatch(mobile,/orbit-popover|toggle-orbits/);
 assert.match(html,/Standard: Sterne und Planeten/);
});

