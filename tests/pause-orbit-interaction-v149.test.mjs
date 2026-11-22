import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {attachCameraControls} from '../src/renderer/controls.js';
import {drawOrbitLine,drawSunTrail} from '../src/renderer/orbits.js';
import {hitTestProjectedPath,pickVisiblePath} from '../src/renderer/path-picking.js';
import {updateOrbitTooltip} from '../src/ui/orbit-tooltip.js';
import {GalacticTrailHistory} from '../src/renderer/galactic-trails.js';

const VP=new Float32Array([.5,0,0,0,0,.5,0,0,0,0,.5,0,0,0,0,1]);
const path=new Float32Array([-1,0,0,0,0,0,1,0,0]);
const earth={id:'earth',type:'planet',name:'Erde',parentId:'sun',a:1,periodDays:365.25,e:0,i:0,node:0,peri:0,M:0};
const sun={id:'sun',type:'star',name:'Sonne'};
const moon={id:'moon',type:'moon',name:'Mond'};
const centered={id:'jupiter',type:'planet',name:'Jupiter'};

function makeRenderer({paused=true}={}){
  const events=[],selected=[],cleared=[];
  const classes=new Set();
  const r=Object.create(SolarRenderer.prototype);
  Object.assign(r,{width:800,height:600,vp:VP,rendered:[],positions:new Map(),selectedId:null,
    settings:{row:false},simulationPaused:paused,selectablePaths:[],pathPointer:null,hoveredPathId:null,
    canvas:{classList:{add:key=>classes.add(key),remove:key=>classes.delete(key),toggle:(key,on)=>on?classes.add(key):classes.delete(key)}},
    callbacks:{onPathHover:hit=>events.push(hit),onSelect:id=>selected.push(id),onClearSelect:()=>cleared.push(true)}});
  return {r,events,selected,cleared,classes};
}

test('v149: projected polyline hit testing follows the visible stroke in CSS pixels',()=>{
  const center=hitTestProjectedPath(path,VP,800,600,400,301);
  assert.ok(center);
  assert.equal(center.distSq,1);
  assert.equal(hitTestProjectedPath(path,VP,800,600,400,309)!=null,true);
  assert.equal(hitTestProjectedPath(path,VP,800,600,400,310),null,'more than 9px misses');
  assert.equal(hitTestProjectedPath(path,VP,800,600,50,300),null,'line is finite, not an infinite ray');
  assert.equal(hitTestProjectedPath(path,VP,800,600,400,300,0),null);
  const outsideFrustum=new Float32Array([-1,0,4,0,0,4,1,0,4]);
  assert.equal(hitTestProjectedPath(outsideFrustum,VP,800,600,400,300),null,'depth-clipped segments cannot be selected');
  assert.equal(hitTestProjectedPath(path,new Float32Array(16),800,600,400,300),null,'points behind the near plane cannot be hit');
});

test('v149: nearest path wins; overlapping segments prefer foreground depth',()=>{
  const back=new Float32Array([-1,0,.6,1,0,.6]);
  const front=new Float32Array([-1,0,-.6,1,0,-.6]);
  const hit=pickVisiblePath([{body:moon,points:back},{body:earth,points:front}],VP,800,600,400,300);
  assert.equal(hit.body.id,'earth');
  assert.equal(pickVisiblePath([{body:earth,points:path}],VP,800,600,-12,300),null);
  assert.equal(pickVisiblePath([{body:earth,points:path}],VP,800,600,400,400),null);
});

test('v149: hover and click on a paused path select the owning object, clearing hover on click',()=>{
  const {r,events,selected,cleared,classes}=makeRenderer();
  r.registerSelectablePath(earth,path);
  assert.equal(r.selectablePaths.length,1);
  assert.equal(r.hoverOrbitPath(405,303),'earth');
  assert.equal(events.at(-1).body.name,'Erde');
  assert.deepEqual([events.at(-1).x,events.at(-1).y],[405,303]);
  assert.ok(classes.has('path-hover'));
  assert.equal(r.pick(405,303),'earth');
  assert.deepEqual(selected,['earth']);
  assert.equal(cleared.length,0);
  assert.equal(events.at(-1),null,'tooltip hidden after selection');
  assert.ok(!classes.has('path-hover'));
  assert.equal(r.pick(100,100),null);
  assert.equal(cleared.length,1);
});

test('v149: normal playback and invisible paths cannot be hovered or selected',()=>{
  const {r,events,selected,cleared}=makeRenderer({paused:false});
  r.registerSelectablePath(earth,path);
  assert.equal(r.selectablePaths.length,0);
  assert.equal(r.hoverOrbitPath(400,300),null);
  assert.equal(r.pick(400,300),null);
  r.setSimulationPaused(true);
  r.registerSelectablePath(earth,path);
  assert.equal(r.hoverOrbitPath(400,300),'earth');
  r.setSimulationPaused(false);
  assert.equal(events.at(-1),null,'switching back to Play immediately hides hover');
  assert.equal(r.selectablePaths.length,0);
  assert.equal(r.pick(400,300),null);
  assert.deepEqual(selected,[]);
  assert.equal(cleared.length,2);
});

test('v149: a rendered sphere takes priority over a line at its center',()=>{
  const {r,events,selected}=makeRenderer();
  r.bodyRadius=()=>.005;
  r.rendered=[centered];
  r.positions.set('jupiter',[0,0,0]);
  r.registerSelectablePath(earth,path);
  assert.equal(r.hoverOrbitPath(400,300),null,'sphere center should not show a path tooltip');
  assert.equal(r.pick(400,300),'jupiter','existing sphere selection must take priority');
  assert.deepEqual(selected,['jupiter']);
  assert.equal(events.length,0);
  assert.equal(r.hoverOrbitPath(445,302),'earth','outside sphere hit area, nearby orbit is hittable');
});

test('v149: only actually drawn ordinary orbits register; transition ghosts stay inactive',()=>{
  const registrations=[];
  const gl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,TRIANGLES:3,LINE_STRIP:4,bufferData(){},
    uniform4f(){},drawArrays(){},getUniformLocation:()=>({})};
  const r={gl,planetId:null,width:800,height:600,byId:new Map([['sun',sun]]),
    settings:{orbitContrast:false,scaleOrbits:false},useLineProgram:()=>({}),
    sceneOrbitOpacity:()=>0,registerSelectablePath:(b,p)=>registrations.push({b,p})};
  drawOrbitLine(r,earth,[0,0,0],VP,.2,false);
  assert.equal(registrations.length,0,'fully invisible line is not registered');
  r.sceneOrbitOpacity=()=>1;
  drawOrbitLine(r,earth,[0,0,0],VP,.2,false);
  assert.equal(registrations.length,1);
  assert.equal(registrations[0].b,earth);
  assert.equal(registrations[0].p.length,543,'same 181 Kepler points rendered and hit tested');
  drawOrbitLine(r,earth,[0,0,0],VP,.2,false,{pickable:false});
  assert.equal(registrations.length,1,'fading orbits from an old scene are excluded');
});

test('v149: the galactic Sun trail uses recorded points and is also selectable',()=>{
  const registrations=[];
  const gl={ARRAY_BUFFER:1,DYNAMIC_DRAW:2,TRIANGLES:3,LINE_STRIP:4,bufferData(){},
    uniform4f(){},drawArrays(){},getUniformLocation:()=>({})};
  const history=new GalacticTrailHistory();
  const time=Date.UTC(2026,10,22);
  history.record(sun,time-60_000,[0,0,0],'false|0');
  const r={gl,planetId:null,width:800,height:600,simTime:time,
    byId:new Map([['sun',sun]]),positions:new Map([['sun',[.4,0,0]]]),
    settings:{galacticMotion:true,orbits:true,layers:{mode:'all'}},
    _galacticTrails:history,galacticTrailExtendedHistory:false,
    shouldDraw:()=>true,useLineProgram:()=>({}),
    registerSelectablePath:(b,p)=>registrations.push({b,p})};
  drawSunTrail(r,VP);
  assert.equal(registrations.length,1);
  assert.equal(registrations[0].b,sun);
  assert.ok(registrations[0].p.length>=6);
  r.settings.layers={mode:'custom',types:new Set(['planet'])};
  drawSunTrail(r,VP);
  assert.equal(registrations.length,1,'hidden Sun has no drawable/selectable trail');
});

test('v149: pointer events enable hover without a press, touch tap picks, drag does not',()=>{
  const {r,selected,events}=makeRenderer();
  const handlers=new Map();
  r.canvas.addEventListener=(name,fn)=>handlers.set(name,fn);
  r.canvas.setPointerCapture=()=>{};
  r.canvas.getBoundingClientRect=()=>({left:50,top:20});
  r.pointers=new Map();r.drag=null;r.gesture=null;r.gestureOrigin=null;
  r.heldArrows=new Set();r.followEnabled=false;r.followedBodyId=null;
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.cameraManuallyMoved=false;r.settings={};
  r.registerSelectablePath(earth,path);
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  globalThis.document={addEventListener(){},getElementById:()=>null};
  globalThis.window={addEventListener(){}};
  try{
    attachCameraControls(r);
    const emit=(type,id,x,y,pointerType='mouse',extra={})=>handlers.get(type)?.({
      target:r.canvas,pointerId:id,clientX:x,clientY:y,pointerType,button:0,buttons:0,
      preventDefault(){},...extra});
    emit('pointermove',1,450,320);
    assert.equal(r.hoveredPathId,'earth');
    assert.deepEqual([events.at(-1).x,events.at(-1).y],[400,300]);
    emit('pointerleave',1,450,320);
    assert.equal(r.hoveredPathId,null);
    emit('pointerdown',2,450,320,'touch');
    emit('pointerup',2,450,320,'touch');
    assert.deepEqual(selected,['earth'],'a touch tap opens the object detail selection');
    emit('pointerdown',3,450,320);
    emit('pointermove',3,460,330,'mouse',{buttons:1});
    emit('pointerup',3,460,330);
    assert.deepEqual(selected,['earth'],'drag does not become a click');
  }finally{
    if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;
    if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  }
});

test('v149: tooltip shows name/category near pointer, clamps edges and hides safely',()=>{
  const oldDocument=globalThis.document;
  const name={textContent:''},category={textContent:''};
  const tooltip={hidden:true,offsetWidth:130,offsetHeight:46,style:{},
    parentElement:{clientWidth:800,clientHeight:600},
    querySelector:selector=>selector==='.orbit-hover-name'?name:category};
  globalThis.document={getElementById:id=>id==='orbit-hover-tooltip'?tooltip:null};
  try{
    updateOrbitTooltip({body:{...earth,name:'Erde <Test>'},x:400,y:300});
    assert.equal(name.textContent,'Erde <Test>','name is inserted as text, not HTML');
    assert.equal(category.textContent,'Planet');
    assert.equal(tooltip.hidden,false);
    assert.equal(tooltip.style.left,'414px');
    updateOrbitTooltip({body:{...moon,name:'Mond'},x:796,y:596});
    assert.equal(category.textContent,'Mond');
    assert.ok(parseInt(tooltip.style.left)<=662 && parseInt(tooltip.style.left)>=8);
    assert.ok(parseInt(tooltip.style.top)<=546 && parseInt(tooltip.style.top)>=8);
    updateOrbitTooltip(null);
    assert.equal(tooltip.hidden,true);
  }finally{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}
});

test('v149: DOM, docs and PWA include the tooltip and new picking module',async()=>{
  const files=await Promise.all(['index.html','css/styles.css','src/app/runtime.js','src/app/animation-loop.js','src/ui/event-handlers.js','sw.js','docs/HILFE.md'].map(file=>
    readFile(new URL('../'+file,import.meta.url),'utf8')));
  const [html,css,runtime,loop,handlers,worker,help]=files;
  assert.match(html,/id="orbit-hover-tooltip" role="tooltip" hidden/);
  assert.match(css,/\.orbit-hover-tooltip\{[^}]*pointer-events:none/);
  assert.match(css,/#space\.path-hover/);
  assert.match(runtime,/onPathHover:updateOrbitTooltip/);
  assert.match(loop,/setSimulationPaused\?\.\(!S\.playing\)/);
  assert.match(handlers,/setSimulationPaused\?\.\(!S\.playing\)/);
  const shell=JSON.parse(worker.match(/const SHELL=(\[[^;]+\]);/)[1]);
  assert.ok(shell.includes('./src/renderer/path-picking.js'));
  assert.ok(shell.includes('./src/ui/orbit-tooltip.js'));
  assert.match(help,/Pause-Modus.*Bahnen.*Schweife/i);
});
