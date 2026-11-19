import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';

function setup(planetId=null){
 const r=Object.create(SolarRenderer.prototype);
 r.camera={theta:.63,phi:planetId?.84:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
 r.cameraPresetIndex=0;r.cameraManuallyMoved=false;r.planetId=planetId;
 r.settings={row:false};r.callbacks={};r.height=760;r.width=390;
 r.cinema=null;r.transition=null;r.followEnabled=false;
 r.stopFollowing=()=>{};r.solarOverviewDistance=()=>47;r.planetFrameDistance=()=>18;
 r.calcPositions=()=>{};r.simTime=0;
 const icons=['free','oblique','topdown','side'].map(id=>({dataset:{perspective:id},hidden:true,
  removeAttribute(key){if(key==='hidden')this.hidden=false;},
  setAttribute(key){if(key==='hidden')this.hidden=true;}}));
 const attrs={};
 const button={title:'',setAttribute:(key,val)=>{attrs[key]=val;},querySelectorAll:()=>icons};
 const panel={classList:{toggle(){}},setAttribute(){}};
 const oldDocument=globalThis.document;
 globalThis.document={getElementById:id=>id==='reset-camera'?button:panel};
 const state={bodies:[{id:'saturn',type:'planet',name:'Saturn'}]};
 const sync=(arActive=false)=>syncSceneMode(state,r,arActive);
 const icon=()=>icons.filter(node=>!node.hidden).map(node=>node.dataset.perspective);
 r.callbacks.onCameraChange=()=>sync();
 const restore=()=>{if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;};
 return {r,button,attrs,icons,icon,sync,restore};
}

test('v69: camera icon describes the CURRENT preset, next action remains accessible',()=>{
 const ui=setup();
 try{
  ui.sync();
  assert.deepEqual(ui.icon(),['oblique']);
  assert.equal(ui.attrs['data-current-perspective'],'oblique');
  assert.equal(ui.attrs['data-next-perspective'],'topdown');
  assert.equal(ui.attrs['aria-label'],'Nächste Perspektive: Topdown');
  ui.r.cycleCameraPerspective();
  assert.deepEqual(ui.icon(),['topdown']);
  assert.equal(ui.attrs['data-next-perspective'],'side');
  ui.r.cycleCameraPerspective();
  assert.deepEqual(ui.icon(),['side']);
  assert.equal(ui.attrs['data-next-perspective'],'oblique');
  ui.r.cycleCameraPerspective();
  assert.deepEqual(ui.icon(),['oblique']);
  assert.equal(ui.attrs['data-next-perspective'],'topdown');
 }finally{ui.restore();}
});

test('v69: after free-look or manual motion, reset faces the viewer until clicked',()=>{
 const ui=setup();
 try{
  ui.sync();ui.r.cycleCameraPerspective();
  ui.r.markCameraMoved();
  assert.deepEqual(ui.icon(),['free']);
  assert.equal(ui.attrs['data-current-perspective'],'free');
  assert.equal(ui.attrs['data-next-perspective'],'oblique');
  assert.equal(ui.attrs['aria-label'],'Nächste Perspektive: Schräg/oben');
  ui.r.cycleCameraPerspective();
  assert.equal(ui.r.cameraManuallyMoved,false);
  assert.equal(ui.r.cameraPresetIndex,0);
  assert.deepEqual(ui.icon(),['oblique']);
  assert.equal(ui.attrs['data-next-perspective'],'topdown');
 }finally{ui.restore();}
});

test('v69: planet overview shows front-facing reset, AR shows actual perspective',()=>{
 const ui=setup('saturn');
 try{
  ui.sync(false);
  assert.deepEqual(ui.icon(),['free']);
  assert.equal(ui.attrs['aria-label'],'Zurück zur Sonnensystem-Übersicht');
  ui.sync(true);
  assert.deepEqual(ui.icon(),['oblique']);
  assert.equal(ui.attrs['aria-label'],'AR: Nächste Perspektive: Topdown');
  ui.r.callbacks.onCameraChange=()=>ui.sync(true);
  ui.r.cycleCameraPerspective({keepPlanetScene:true});
  assert.equal(ui.r.planetId,'saturn');
  assert.deepEqual(ui.icon(),['topdown']);
  ui.r.markCameraMoved();
  assert.deepEqual(ui.icon(),['free']);
  ui.r.cycleCameraPerspective({keepPlanetScene:true});
  assert.deepEqual(ui.icon(),['oblique']);
 }finally{ui.restore();}
});

test('v69: SVG directions match the camera pose and only the initial icon is shown',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const markup=html.slice(html.indexOf('id="reset-camera"'),html.indexOf('</button>',html.indexOf('id="reset-camera"')));
 assert.match(markup,/data-current-perspective="oblique" data-next-perspective="topdown"/);
 assert.match(markup,/data-perspective="free"[^>]*hidden><rect x="3\.5"[^>]*><circle cx="12" cy="12" r="5\.1"/);
 assert.match(markup,/data-perspective="oblique"[^>]*><g transform="rotate\(142 12 12\)"/);
 assert.match(markup,/data-perspective="topdown"[^>]*hidden><g transform="rotate\(90 12 12\)"/);
 assert.match(markup,/data-perspective="side"[^>]*hidden><g transform="rotate\(180 12 12\)"/);
 assert.equal((markup.match(/class="camera-perspective-icon"/g)||[]).length,4);
});
