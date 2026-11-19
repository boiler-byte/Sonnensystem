import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readdir,readFile} from 'node:fs/promises';
import {join,relative,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {syncToggleState} from '../src/ui/control-state.js';
import {S,renderer,setRenderer} from '../src/app/state.js';
import {refreshRowCameraFrame} from '../src/app/animation-controls.js';
import {planetOrbitIds,drawSceneBodies} from '../src/renderer/scene-objects.js';
import {eclipticVectorToScene,computePositions} from '../src/renderer/scene.js';
import {displayOrbitRadius} from '../src/data/orbital-math.js';
import {notify,notifyToggle} from '../src/ui/status.js';

function element() {
 const attributes=new Map(),classes=new Set();
 return {title:'',hidden:false,textContent:'',attributes,classes,
  setAttribute:(key,value)=>attributes.set(key,value),
  classList:{add:key=>classes.add(key),remove:key=>classes.delete(key),
   toggle:(key,active)=>active?classes.add(key):classes.delete(key)}};
}

test('toggle state updates CSS, aria-pressed and tooltip consistently',()=>{
 const button=element();
 syncToggleState(button,true,'Ein');
 assert.equal(button.attributes.get('aria-pressed'),'true');
 assert.equal(button.classes.has('active'),true);
 assert.equal(button.title,'Ein');
 syncToggleState(button,false,'Aus');
 assert.equal(button.attributes.get('aria-pressed'),'false');
 assert.equal(button.classes.has('active'),false);
 assert.equal(button.title,'Aus');
 syncToggleState(button,true);
 assert.equal(button.title,'Aus','no explicit tooltip retains its previous value');
});

test('one row camera refresh handles updated positions, and is inert outside row',()=>{
 const oldRenderer=renderer,oldSettings=S.settings,oldTime=S.time;
 const calls=[];
 const fake={camera:{desiredTarget:null,desiredDist:0},calcPositions:time=>calls.push(time),
  rowFrame:()=>({target:[4,2,-1]}),rowDistance:()=>73};
 try{
  setRenderer(fake);S.settings={...oldSettings,row:false};S.time=Date.UTC(2026,10,19);
  assert.equal(refreshRowCameraFrame(),false);
  assert.deepEqual(calls,[]);
  S.settings.row=true;
  assert.equal(refreshRowCameraFrame(),true);
  assert.deepEqual(calls,[S.time]);
  assert.deepEqual(fake.camera.desiredTarget,[4,2,-1]);
  assert.equal(fake.camera.desiredDist,73);
  setRenderer(null);
  assert.equal(refreshRowCameraFrame(),false);
 }finally{setRenderer(oldRenderer);S.settings=oldSettings;S.time=oldTime;}
});

test('planet orbit limits are identical for drawing and transition snapshots',()=>{
 const moons=Array.from({length:90},(_,i)=>({id:`moon-${i}`,type:'moon',radiusKm:90-i}));
 const satellites=Array.from({length:40},(_,i)=>({id:`sat-${i}`,type:'satellite',radiusKm:1}));
 const minor={id:'minor',type:'binary',radiusKm:1};
 const ids=planetOrbitIds([...moons,...satellites,minor],moons[89]);
 assert.equal(ids.size,80+1+35+1);
 for(let i=0;i<80;i++)assert.ok(ids.has(`moon-${i}`));
 assert.ok(!ids.has('moon-88'));
 assert.ok(ids.has('moon-89'),'selected moon remains a drawable orbit');
 assert.ok(ids.has('sat-34'));
 assert.ok(!ids.has('sat-35'));
 assert.ok(ids.has('minor'));
});

test('shared scene painter preserves sorting, Saturn ring order and label drawing',()=>{
 const star={id:'sun'},saturn={id:'saturn'},hidden={id:'hidden'},missing={id:'missing'};
 const calls=[];
 const fake={rendered:[],positions:new Map([['sun',[0,0,0]],['saturn',[3,0,0]]]),
  shouldDraw:b=>b.id!=='hidden',
  drawSphere:(b,p)=>calls.push(['sphere',b.id,p[0]]),
  drawRings:p=>calls.push(['ring',p[0]]),drawLabels:()=>calls.push(['labels'])};
 const result=drawSceneBodies(fake,[saturn,missing,star,hidden],'vp',(a,b)=>a.id.localeCompare(b.id));
 assert.deepEqual(result,[saturn,star]);
 assert.equal(result,fake.rendered);
 assert.deepEqual(calls,[['ring',3],['sphere','saturn',3],['sphere','sun',0],['labels']]);
});

test('JPL coordinate order and scaling remain the same in both scene modes',()=>{
 assert.deepEqual(eclipticVectorToScene([2,3,4],10),[20,40,30]);
 const sun={id:'sun',type:'star',parentId:null,radiusKm:696340};
 const earth={id:'earth',type:'planet',parentId:'sun',a:1,periodDays:365,e:0,radiusKm:6371};
 const moon={id:'moon',type:'moon',parentId:'earth',a:384400,periodDays:27,e:0,radiusKm:1737};
 const time=Date.UTC(2026,10,19),date=new Date(time).toISOString().slice(0,10);
 const fake={bodies:[sun,earth,moon],byId:new Map([sun,earth,moon].map(b=>[b.id,b])),
  planetId:null,positions:new Map(),settings:{scaleOrbits:true},
  overrides:new Map([['earth',{date,vector:[2,3,4]}]]),planetChildren:()=>[moon]};
 computePositions(fake,time);
 const auScale=3.4/149597870.7;
 const sunRelative=fake.positions.get('earth');
 sunRelative.forEach((value,index)=>assert.ok(Math.abs(value-[2,4,3][index]*auScale)<1e-12));
 fake.settings={scaleOrbits:false};fake.planetId='earth';
 fake.overrides=new Map([['moon',{date,vector:[2,3,4]}]]);
 computePositions(fake,time);
 const moonRadius=displayOrbitRadius(moon,earth,fake.settings,earth);
 const length=Math.hypot(2,3,4);
 fake.positions.get('moon').forEach((value,index)=>
  assert.ok(Math.abs(value-[2,4,3][index]*moonRadius/length)<1e-12));
 assert.deepEqual(fake.positions.get('earth'),[0,0,0]);
});

test('independent toast timers share one dismissal path',()=>{
 const original={document:globalThis.document,setTimeout:globalThis.setTimeout,clearTimeout:globalThis.clearTimeout};
 const notices=new Map([['toast',element()],['toggle-toast',element()]]);
 const scheduled=new Map(),canceled=[];let nextId=10;
 try{
  globalThis.document={getElementById:id=>notices.get(id)};
  globalThis.setTimeout=(callback,delay)=>{const id=nextId++;scheduled.set(id,{callback,delay});return id;};
  globalThis.clearTimeout=id=>canceled.push(id);
  notify('Fehler',true);
  notifyToggle('Umschalten');
  assert.equal(notices.get('toast').classes.has('error'),true);
  assert.equal(notices.get('toggle-toast').classes.has('show'),true);
  assert.equal(scheduled.get(10).delay,4600);
  assert.equal(scheduled.get(11).delay,2400);
  notifyToggle('Nochmals');
  assert.ok(canceled.includes(11));
  assert.ok(!canceled.includes(10));
  scheduled.get(12).callback();
  assert.equal(notices.get('toggle-toast').classes.has('show'),false);
  assert.equal(notices.get('toast').classes.has('show'),true);
  notify('OK');
  assert.ok(canceled.includes(10));
  assert.equal(notices.get('toast').classes.has('error'),false);
 }finally{Object.assign(globalThis,original);}
});

test('all static ES imports are acyclic and PWA shell contains every frontend module',async()=>{
 const root=resolve(fileURLToPath(new URL('../src',import.meta.url)));
 async function walk(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  const paths=await Promise.all(entries.map(entry=>entry.isDirectory()?walk(join(dir,entry.name)):[join(dir,entry.name)]));
  return paths.flat();
 }
 const paths=(await walk(root)).filter(file=>file.endsWith('.js'));
 const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
 const shell=new Set(JSON.parse(sw.match(/const SHELL=(\[[^;]+\]);/)[1]));
 const dependencies=new Map();
 for(const path of paths){
  const rel='./src/'+relative(root,path).split('\\').join('/');
  assert.ok(shell.has(rel),`${rel} must load offline`);
  const content=await readFile(path,'utf8');
  const imports=[...content.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)].map(match=>resolve(path,'..',match[1]));
  for(const dep of imports)assert.ok(paths.includes(dep),`${rel} imports missing file ${dep}`);
  dependencies.set(path,imports);
 }
 const visiting=new Set(),visited=new Set();
 function visit(path){
  if(visiting.has(path))assert.fail(`cyclic dependency: ${relative(root,path)}`);
  if(visited.has(path))return;
  visiting.add(path);
  for(const dep of dependencies.get(path)||[])visit(dep);
  visiting.delete(path);visited.add(path);
 }
 for(const path of paths)visit(path);
 assert.ok(shell.has('./src/ui/control-state.js'));
 assert.ok(shell.has('./src/renderer/scene-objects.js'));
});
