import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {S,renderer,setRenderer,setARMode,setMobileSheets} from '../src/app/state.js';
import {initControls} from '../src/ui/event-handlers.js';
import {updateScale,updateRow} from '../src/app/animation-controls.js';
import {syncLayers} from '../src/ui/layer-panel.js';
import {connectARMode} from '../src/app/ar-controller.js';
import {loadCatalog} from '../src/data/catalog.js';
import {loadSolar,loadAsteroid,mergeBodies} from '../src/app/object-catalog.js';
import {selectBody,openPlanetScene} from '../src/app/camera-controller.js';
import {loop} from '../src/app/animation-loop.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function fakeDocument(){
 const elements=new Map(),listeners=new Map();
 const node=id=>{
  if(!elements.has(id)){
   const attrs=new Map(),events=new Map(),classes=new Set();
   elements.set(id,{
    id,hidden:true,value:'0',title:'',style:{setProperty(){}},dataset:{},textContent:'',innerHTML:'',
    tabIndex:0,parentElement:{hidden:false,style:{setProperty(){}}},
    classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),toggle:(name,yes)=>yes?classes.add(name):classes.delete(name),contains:name=>classes.has(name)},
    setAttribute:(name,value)=>attrs.set(name,value),getAttribute:name=>attrs.get(name),
    querySelectorAll:()=>[],addEventListener:(name,fn)=>events.set(name,fn),
    click(){events.get('click')?.({target:this});},change(){events.get('input')?.({target:this});},
    focus(){this.focused=true},contains(){return false}
   });
  }
  return elements.get(id);
 };
 return {node,document:{getElementById:node,querySelectorAll:()=>[],addEventListener:(type,cb)=>listeners.set(type,cb)}};
}

test('app entry is minimal, and each concern has a dedicated importable module',async()=>{
 const boot=await read('src/app.js');
 assert.ok(boot.split('\n').length<=7,'bootstrap should not contain view logic');
 assert.match(boot,/import \{init\} from '\.\/app\/runtime\.js'/);
 const modules=[
  ['Kamera','src/app/camera-controller.js','selectBody'],
  ['AR','src/app/ar-controller.js','connectARMode'],
  ['Animation','src/app/animation-controls.js','updateRow'],
  ['Rendering loop','src/app/animation-loop.js','loop'],
  ['UI','src/ui/event-handlers.js','initControls'],
  ['Catalog','src/app/object-catalog.js','mergeBodies'],
 ];
 for(const [concern,path,name] of modules){
  const source=await read(path);
  assert.match(source,new RegExp(`export (?:async )?function ${name}\\(`),concern);
 }
 for(const exported of [initControls,updateScale,updateRow,syncLayers,connectARMode,
   loadCatalog,loadSolar,loadAsteroid,mergeBodies,selectBody,openPlanetScene,loop])
   assert.equal(typeof exported,'function');
});

test('real ES module UI handlers still change the shared view settings',()=>{
 const originalDocument=globalThis.document;
 const original={solar:{...S.viewSettings.solar},planet:{...S.viewSettings.planet}};
 const {node,document}=fakeDocument();
 globalThis.document=document;
 setRenderer(null);setARMode(null);setMobileSheets(null);
 try{
  initControls();
  node('toggle-lighting').click();
  assert.equal(S.settings.lighting,'realistic');
  assert.equal(node('toggle-lighting').getAttribute('aria-pressed'),'true');
  node('toggle-labels').click();
  assert.equal(S.settings.labels,'points');
  assert.equal(node('toggle-labels').getAttribute('data-label-mode'),'points');
  node('toggle-labels').click();
  assert.equal(S.settings.labels,false);
  node('toggle-labels').click();
  assert.equal(S.settings.labels,true);
  node('orbit-visibility-btn').click();
  assert.equal(S.settings.orbits,false);
  node('scale-objects-btn').click();
  assert.equal(S.settings.scaleObjects,true);
  assert.equal(S.viewSettings.planet.scaleObjects,true,'scale setting shared by both scenes');
  node('layer-btn').click();
  assert.equal(node('layer-popover').hidden,false);
  node('speed-btn').click();
  assert.equal(node('layer-popover').hidden,true,'popovers remain mutually exclusive');
  assert.equal(node('speed-popover').hidden,false);
 }finally{
  Object.assign(S.viewSettings.solar,original.solar);
  Object.assign(S.viewSettings.planet,original.planet);
  if(originalDocument===undefined)delete globalThis.document;
  else globalThis.document=originalDocument;
 }
});

test('service worker precaches every ES module and is versioned',async()=>{
 const sw=await read('sw.js');
 const shell=JSON.parse(sw.match(/const SHELL=(\[[^;]+\]);/)[1]);
 for(const path of [
  './src/app.js','./src/app/runtime.js','./src/app/ar-controller.js',
  './src/app/camera-controller.js','./src/app/animation-loop.js',
  './src/app/animation-controls.js','./src/app/object-catalog.js',
  './src/ui/event-handlers.js','./src/ui/layer-panel.js',
 ])assert.ok(shell.includes(path),path);
});
