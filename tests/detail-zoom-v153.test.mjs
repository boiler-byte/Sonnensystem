import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {detailFarDistance,detailNearDistance,detailZoomFrameTangent} from '../src/renderer/detail-zoom.js';
import {cameraView} from '../src/renderer/camera.js';
import {projected,DAY} from '../src/renderer/math.js';
import {keplerPosition} from '../src/data/orbital-math.js';
import {syncDetailZoomAction} from '../src/ui/object-details.js';

const body=id=>INITIAL_BODIES.find(b=>b.id===id);
const frame=()=>{
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=1000;r.height=680;r.focusOffsetY=0;r.visibleFocusOffset=0;
  r.settings={orbits:true,scaleObjects:false,scaleOrbits:false,row:false};
  r.planetId=null;r.cameraManuallyMoved=false;r.focusedBodyId=null;
  r.followEnabled=false;r.followedBodyId=null;r.selectedId='earth';
  r.positions=new Map();r.transition=null;r.callbacks={};r.overrides=new Map();
  r.simTime=Date.UTC(2026,10,22);
  r.setBodies(INITIAL_BODIES.map(b=>({...b})));
  r.calcPositions(r.simTime);
  return r;
};

test('v153: far zoom frames the *full* eccentric ellipse, including apoapsis on portrait mobile',()=>{
  const eccentric={id:'comet',a:12,e:.94,periodDays:400};
  const radius=12,width=360,height=780,offset=.48;
  const far=detailFarDistance([eccentric],()=>radius,width,height,{focusOffset:offset,fallback:8});
  assert.ok(far>150,`eccentric apoapsis must require a genuine wider shot: ${far}`);
  const camera={theta:.63,phi:.99,dist:far,desiredDist:far,target:[0,0,0],desiredTarget:[0,0,0]};
  const {vp}=cameraView(camera,width,height,offset,far*4);
  const parent={id:'sun',radiusKm:696340};
  for(let i=0;i<=360;i++){
    const p=keplerPosition(eccentric,parent,i/360*400*DAY,0,radius);
    const pixel=projected(p,vp,width,height);
    assert.ok(pixel && pixel.x>0 && pixel.x<width,`orbit visible at ${i}/360 horizontally`);
    assert.ok(pixel.y>0 && pixel.y<height*(1-offset),`orbit visible above sheet at ${i}/360 vertically`);
  }
  const ordinary=detailFarDistance([{e:0}],()=>radius,width,height,{focusOffset:offset});
  assert.ok(far>ordinary*1.8,'uses years/apoapsis extent, not extra detail points');
});

test('v153: orientation, mobile sheet and fallback correctly change both camera distances',()=>{
  const desktop=detailZoomFrameTangent(1100,650);
  const portrait=detailZoomFrameTangent(390,844,.35);
  assert.ok(portrait<desktop);
  assert.ok(detailNearDistance(1.28,2.2,390,844,.35)>detailNearDistance(1.28,2.2,1100,650));
  assert.equal(detailNearDistance(0,2.2,1100,650),4.4);
  assert.equal(detailFarDistance([],()=>0,1100,650,{fallback:30}),30);
  assert.equal(detailFarDistance([{e:.99}],()=>10,1000,680,{fallback:30})>
    detailFarDistance([{e:0}],()=>10,1000,680,{fallback:30}),true);
});

test('v153: chart click cycles near/far without changing selected object or active scene',()=>{
  const r=frame(),pos=r.positions.get('earth').slice();
  const original=r.solarOverviewDistance();
  assert.equal(r.detailZoomCurrentMode('earth'),'far');
  assert.equal(r.toggleDetailZoom('earth'),'near');
  assert.deepEqual(r.camera.desiredTarget,pos);
  assert.ok(r.camera.desiredDist<original);
  assert.equal(r.detailZoomCurrentMode('earth'),'near');
  const selected=r.selectedId;
  assert.equal(r.toggleDetailZoom('earth'),'far');
  assert.equal(r.selectedId,selected);
  assert.equal(r.planetId,null);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  assert.ok(r.camera.desiredDist>original,'wide view must fit all rendered orbits');
  assert.ok(r.maxCameraDistance()>r.camera.desiredDist,'wheel zoom must not snap back to legacy limit');
  assert.equal(r.toggleDetailZoom('earth'),'near');
  assert.deepEqual(r.camera.desiredTarget,pos);
  assert.equal(r.toggleDetailZoom('missing-body'),null,'invalid focus is ignored');
});

test('v153: local Earth scene frames Moon/satellites; no-children object has wide fallback',()=>{
  const r=frame();r.showPlanetSystem('earth');r.selectedId='earth';
  assert.ok(r.visibleSceneOrbits().some(b=>b.id==='moon'));
  assert.equal(r.toggleDetailZoom('earth'),'near');
  const close=r.camera.desiredDist;
  assert.equal(r.toggleDetailZoom('earth'),'far');
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  assert.ok(r.camera.desiredDist>close*2);
  assert.ok(r.camera.desiredDist>=r.planetFrameDistance());
  r.showPlanetSystem('moon');r.selectedId='moon';
  assert.equal(r.visibleSceneOrbits().length,0);
  assert.equal(r.toggleDetailZoom('moon'),'near');
  const moonNear=r.camera.desiredDist;
  assert.equal(r.toggleDetailZoom('moon'),'far');
  assert.ok(r.camera.desiredDist>moonNear);
  assert.ok(r.camera.desiredDist>=r.planetFrameDistance());
});

test('v153: long shot suspends following and close shot resumes it without resetting the global switch',()=>{
  const r=frame();r.followEnabled=true;r.setSelected('earth',{focus:true});
  assert.equal(r.detailZoomCurrentMode('earth'),'near');
  assert.equal(r.followedBodyId,'earth');
  assert.equal(r.toggleDetailZoom('earth'),'far');
  assert.equal(r.followedBodyId,null,'system should not chase selected body when far away');
  assert.equal(r.followEnabled,true,'global follow preference is unchanged');
  assert.equal(r.toggleDetailZoom('earth'),'near');
  assert.equal(r.followedBodyId,'earth');
  assert.deepEqual(r.camera.desiredTarget,r.positions.get('earth'));
});

test('v153: active layer visibility and orbit visibility determine wide framing',()=>{
  const r=frame();
  r.settings.layers={mode:'custom',types:new Set(['star','planet'])};
  const planetOnly=r.toggleDetailZoom('earth');assert.equal(planetOnly,'near');
  r.toggleDetailZoom('earth');const planets=r.camera.desiredDist;
  r.settings.layers={mode:'all'};
  r.toggleDetailZoom('earth');r.toggleDetailZoom('earth');
  const all=r.camera.desiredDist;
  assert.ok(all>=planets,'turning on remote object categories cannot shrink the frame');
  r.settings.orbits=false;
  r.toggleDetailZoom('earth');r.toggleDetailZoom('earth');
  assert.equal(r.camera.desiredDist,r.solarOverviewDistance(), 'hidden paths use regular overview');
});

function mockDom(){
 const nodes=new Map();
 const get=id=>{
  if(!nodes.has(id)){
   const attributes={};
   nodes.set(id,{textContent:'',hidden:false,title:'',disabled:false,attributes,
     setAttribute(name,value){attributes[name]=String(value);}});
  }
  return nodes.get(id);
 };
 return {get,document:{getElementById:get}};
}
test('v154: chart provides accessible zoom state without visual NAH/FERN label',()=>{
 const previous=globalThis.document,{get,document}=mockDom();globalThis.document=document;
 try{
  const r={planetId:null,positions:new Map([['earth',[0,0,0]]]),detailZoomCurrentMode:()=> 'far'};
  syncDetailZoomAction(body('earth'),r,body,'Größenvergleich');
  assert.equal(get('hero-body').attributes['data-detail-zoom'],'far');
  assert.equal(get('hero-body').attributes['aria-pressed'],'false');
  assert.match(get('hero-body').title,/Nahansicht/);
  assert.match(get('hero-body').attributes['aria-label'],/Größenvergleich/);
  r.detailZoomCurrentMode=()=> 'near';
  syncDetailZoomAction(body('earth'),r,body);
  assert.equal(get('hero-body').attributes['data-detail-zoom'],'near');
  assert.equal(get('hero-body').attributes['aria-pressed'],'true');
  assert.match(get('hero-body').title,/Fernansicht/);
  syncDetailZoomAction(null,r,body);
  assert.equal(get('hero-body').attributes['data-detail-zoom'],'far');
  assert.equal(get('hero-body').disabled,true);
  syncDetailZoomAction(body('moon'),r,body);
  assert.equal(get('hero-body').disabled,true,'an absent position cannot be fabricated');
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('v153: chart event invokes zoom toggle, keeps object selection and detail reference independent',async()=>{
 const s=await readFile(new URL('../src/ui/event-handlers.js',import.meta.url),'utf8');
 const start=s.indexOf("  $('hero-body').addEventListener('click',()=>{");
 const end=s.indexOf("  $('back-to-solar').addEventListener",start);
 assert.ok(start>0&&end>start);
 const callbacks=new Map(),calls=[];
 const r={planetId:null,toggleDetailZoom(id){calls.push(['zoom',id]);return 'near';}};
 const S={selected:'earth'};
 const context={$:id=>({addEventListener(type,cb){callbacks.set(id,cb);}}),S,renderer:r,byId:body,
  rendererSelectionId:b=>b.id,arMode:null,updateDetail(){calls.push('detail');}};
 vm.runInNewContext(s.slice(start,end),context);
 callbacks.get('hero-body')();
 assert.equal(S.selected,'earth');
 assert.deepEqual(calls,[['zoom','earth'],'detail']);
 assert.equal(callbacks.has('back-to-solar'),false);
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.doesNotMatch(html,/id="hero-zoom-state"/);
 assert.match(html,/id="hero-body"[^>]*aria-pressed="false"[^>]*aria-controls="space"/);
});
