import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {CATEGORY_COLORS} from '../src/data/bodies.js';
import {createViewSettings,displayMatchesPreset,displayPreset} from '../src/data/layers.js';
import {drawSceneLabels,layoutSceneLabels} from '../src/renderer/labels.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';

const VP=new Float32Array([20,0,0,0,0,20,0,0,0,0,1,0,0,0,0,20]);
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function canvasCtx(){
  return {
    font:'',ops:[],path:null,globalAlpha:1,
    measureText:s=>({width:s.length*7}),setTransform(){},clearRect(){this.ops=[];},
    strokeText(text){this.ops.push({type:'strokeText',text});},
    fillText(text){this.ops.push({type:'fillText',text});},
    beginPath(){this.path=null;},arc(x,y,r){this.path={x,y,r};},
    fill(){this.ops.push({type:'dot',...this.path,color:this.fillStyle});},
    stroke(){this.ops.push({type:'ring',...this.path});}
  };
}
function scene(mode,selectedId='moon-6'){
  const bodies=[{id:'earth',name:'Erde',type:'planet',radiusKm:6371},
    ...Array.from({length:6},(_,i)=>({id:`moon-${i+1}`,name:`Mond ${i+1}`,type:'moon',parentId:'earth',radiusKm:100+i*30}))];
  const ctx=canvasCtx();
  return {ctx,renderer:{width:640,height:420,dpr:1,
    settings:{labels:mode,fourMoons:false},selectedId,planetId:null,
    bodies,rendered:bodies,byId:new Map(bodies.map(b=>[b.id,b])),
    positions:new Map(bodies.map((b,i)=>[b.id,[i*.012,0,0]])),
    bodyRadius:b=>b.type==='planet'?1:.01,
    simTime:Date.now(),labels:{getContext:()=>ctx}
  }};
}

test('v92: Planetenpunkt draws only tiny objects and selected centers, without text',()=>{
  const {ctx,renderer}=scene('points');
  assert.equal(layoutSceneLabels(renderer,VP,ctx,0).length,0,'point mode has no text placements');
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.ops.filter(op=>op.type==='strokeText'||op.type==='fillText').length,0);
  const dots=ctx.ops.filter(op=>op.type==='dot');
  assert.equal(dots.length,6,'large unselected planet has no point; every tiny orbiter has one');
  assert.ok(dots.every(dot=>dot.x>320),'large unselected planet center is not marked');
  assert.ok(dots.some(dot=>dot.color===CATEGORY_COLORS.moon));
  assert.equal(dots.at(-1).color,'#e7b979','selected center marker is painted last');
  assert.equal(dots.at(-1).r,2.6);
  assert.equal(ctx.ops.filter(op=>op.type==='ring').length,1);
  assert.equal(renderer._labelState,null);
  // A simulated fast orbit cannot suppress a point-only marker.
  renderer.positions.set('moon-1',[.8,0,0]);
  renderer.simTime+=86400000*100;
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.ops.filter(op=>op.type==='dot').length,6);
});

test('v87: standard labels retain the v86 four-largest rule and off draws nothing',()=>{
  const {ctx,renderer}=scene(true);
  assert.equal(layoutSceneLabels(renderer,VP,ctx,0).length,5,
    'planet + four children (selection replaces smallest)');
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.ops.filter(op=>op.type==='fillText').length,5);
  renderer.settings.labels=false;
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.ops.length,0);
  renderer.settings.labels='points';
  drawSceneLabels(renderer,VP);
  assert.equal(ctx.ops.filter(op=>op.type==='dot').length,6);
});

test('v87: label point mode is an independent setting and neither Layer preset matches it',()=>{
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  solar.labels='points';
  assert.equal(planet.labels,true);
  for(const preset of ['all','standard']){
    assert.equal(displayMatchesPreset(solar,preset,'solar'),false);
    assert.equal(displayPreset(preset,'solar').labels,true);
  }
});

test('v87: top-left return button and camera perspective are synced for planet and solar views',()=>{
  const original=globalThis.document;
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      const attrs={};
      elements.set(id,{hidden:true,title:'',attrs,
        setAttribute(k,v){attrs[k]=v;},getAttribute(k){return attrs[k];},
        classList:{toggle(){}},querySelectorAll(){return [];}});
    }
    return elements.get(id);
  };
  globalThis.document={getElementById:get};
  try{
    const state={bodies:[{id:'earth',type:'planet',name:'Erde'}]};
    const camera={camera:{},cameraPresetIndex:0,cameraManuallyMoved:false};
    syncSceneMode(state,{planetId:'earth',...camera});
    assert.equal(get('back-to-solar').hidden,false);
    assert.equal(get('reset-camera').getAttribute('aria-label'),'Nächste Perspektive: Topdown');
    assert.equal(get('reset-camera').getAttribute('data-current-perspective'),'oblique');
    syncSceneMode(state,{planetId:'earth',...camera,cameraPresetIndex:1},true);
    assert.equal(get('reset-camera').getAttribute('aria-label'),'AR: Nächste Perspektive: Seitlich');
    syncSceneMode(state,{planetId:null,...camera});
    assert.equal(get('back-to-solar').hidden,true);
    assert.equal(get('reset-camera').getAttribute('aria-label'),'Nächste Perspektive: Topdown');
  }finally{
    if(original===undefined)delete globalThis.document;
    else globalThis.document=original;
  }
});

test('v87: camera action preserves planet scene, separate back button exits it also in AR',async()=>{
  const source=await read('src/ui/event-handlers.js');
  const begin=source.indexOf("  $('back-to-solar').addEventListener('click',()=>{");
  const end=source.indexOf("  $('planet-view-btn').addEventListener('click',()=>{",begin);
  assert.ok(begin>=0&&end>begin);
  const handlers=source.slice(begin,end);
  const callbacks=new Map(),events=[];
  const buttons=new Map();
  const $=id=>{
    if(!buttons.has(id))buttons.set(id,{addEventListener(type,fn){assert.equal(type,'click');callbacks.set(id,fn);}});
    return buttons.get(id);
  };
  const renderer={planetId:'earth',cinema:null,reset(){events.push('reset');this.planetId=null;},
    cycleCameraPerspective(options){events.push(['camera',options.keepPlanetScene]);}};
  const arMode={active:false,alignToPerspective(){events.push('align');}};
  const mobileSheets={close(){events.push('close');}};
  const context=vm.createContext({$,renderer,arMode,mobileSheets,S:{},
    updateMode:()=>events.push('mode'),syncSceneMode:()=>events.push('sync'),updateDetail:()=>events.push('detail')});
  vm.runInContext(handlers,context);
  callbacks.get('reset-camera')();
  assert.equal(renderer.planetId,'earth');
  assert.deepEqual(events.slice(0,3),[['camera',true],'sync','detail']);
  events.length=0;
  arMode.active=true;
  callbacks.get('reset-camera')();
  assert.equal(renderer.planetId,'earth');
  assert.deepEqual(events.slice(0,3),[['camera',true],'align','sync']);
  events.length=0;
  callbacks.get('back-to-solar')();
  assert.equal(renderer.planetId,null);
  assert.deepEqual(events,['reset','mode','align','close']);
  events.length=0;
  callbacks.get('back-to-solar')();
  assert.deepEqual(events,[],'back action is disabled when solar overview is active');
});

test('v87: label toggle icons and back button remain accessible',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  assert.match(html,/id="back-to-solar"[^>]*aria-label="Zurück zum Sonnensystem"[^>]*hidden/);
  assert.match(html,/id="toggle-labels"[^>]*data-label-mode="labels"/);
  assert.match(html,/class="tab-label-point-icon"[^>]*><circle cx="12" cy="12"/);
  assert.match(css,/#toggle-labels\[data-label-mode="points"\] \.tab-label-icon\{display:none\}/);
  assert.match(css,/#toggle-labels\[data-label-mode="points"\] \.tab-label-point-icon\{display:block\}/);
  assert.match(css,/\.planet-back-button\[hidden\]\{display:none!important\}/);
});
