import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {detailSceneViews,nextDetailSceneId,detailSceneLabel,syncDetailSceneAction} from '../src/ui/object-details.js';
import {availableLayerTypes,createViewSettings,layerEnabled,updateLayerSelection} from '../src/data/layers.js';
import {rendererSelectionId} from '../src/data/probe-location.js';

const byId=id=>INITIAL_BODIES.find(body=>body.id===id);
const getViews=id=>detailSceneViews(byId(id),INITIAL_BODIES);
const next=(id,sceneId)=>nextDetailSceneId(byId(id),INITIAL_BODIES,sceneId);

for(const [id,expected] of [
  ['moon',[null,'earth','moon']],
  ['charon',[null,'pluto','charon']],
  ['dimorphos',[null,'didymos','dimorphos']],
  ['earth',[null,'earth']],
  ['sun',[null,'sun']],
  ['sat-25544',[null,'earth','sat-25544']]
]){
  test(`v152: all ancestor/own scenes cycle for ${id}`,()=>{
    assert.deepEqual(getViews(id),expected);
    for(let index=0;index<expected.length;index++){
      assert.equal(next(id,expected[index]),expected[(index+1)%expected.length]);
    }
  });
}

test('v152: unrelated scene switches to solar first; missing or cyclic parents are safe',()=>{
  assert.equal(next('moon','mars'),null);
  assert.equal(nextDetailSceneId(null,INITIAL_BODIES,'earth'),undefined);
  assert.deepEqual(detailSceneViews({id:'orphan',name:'Orphan',parentId:'unavailable'},INITIAL_BODIES),[null,'orphan']);
  const a={id:'a',name:'A',parentId:'b'},b={id:'b',name:'B',parentId:'a'};
  assert.deepEqual(detailSceneViews(a,[a,b]),[null,'b','a']);
  assert.equal(detailSceneLabel(null,INITIAL_BODIES),'Sonnensystem-Ansicht');
  assert.equal(detailSceneLabel('earth',INITIAL_BODIES),'Erde-Ansicht');
  assert.equal(detailSceneLabel('moon',INITIAL_BODIES),'Mond-Ansicht');
});

function mockDom(){
  const nodes=new Map();
  function get(id){
    if(!nodes.has(id)){
      const attributes={};
      nodes.set(id,{hidden:false,textContent:'',title:'',classList:{active:false,toggle(name,on){this[name]=on;}},
        setAttribute(name,value){attributes[name]=value;},getAttribute(name){return attributes[name];}});
    }
    return nodes.get(id);
  }
  return {get,document:{getElementById:get}};
}

test('v152: button displays CURRENT view and announces NEXT view for each click',()=>{
  const previous=globalThis.document,{get,document}=mockDom();
  globalThis.document=document;
  try{
    for(const [id,scene,current,nextTitle,pressed] of [
      ['moon',null,'Sonnensystem-Ansicht','Erde-Ansicht','false'],
      ['moon','earth','Erde-Ansicht','Mond-Ansicht','true'],
      ['moon','moon','Mond-Ansicht','Sonnensystem-Ansicht','true'],
      ['earth','earth','Erde-Ansicht','Sonnensystem-Ansicht','true'],
      ['charon','pluto','Pluto-Ansicht','Charon-Ansicht','true'],
      ['sun',null,'Sonnensystem-Ansicht','Sonne-Ansicht','false']
    ]){
      syncDetailSceneAction(byId(id),{planetId:scene},INITIAL_BODIES);
      const button=get('planet-view-btn');
      assert.equal(get('planet-view-title').textContent,current);
      assert.equal(button.getAttribute('aria-pressed'),pressed);
      assert.ok(button.getAttribute('aria-label').includes(byId(id).name));
      assert.ok(button.getAttribute('aria-label').includes(nextTitle));
      assert.equal(button.title,`Weiter zu ${nextTitle}`);
      assert.equal(get('planet-view-actions').hidden,false);
    }
    syncDetailSceneAction(null,{planetId:'moon'},INITIAL_BODIES);
    assert.equal(get('planet-view-actions').hidden,true);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('v152: click advances through all views without replacing selected object, then resets solar',async()=>{
  const source=await readFile(new URL('../src/ui/event-handlers.js',import.meta.url),'utf8');
  const start=source.indexOf("  $('planet-view-btn').addEventListener('click',()=>{");
  const end=source.indexOf('  const togglePlayback=',start);
  assert.ok(start>0&&end>start);
  const callbacks=new Map(),calls=[];
  const S={selected:'moon',bodies:INITIAL_BODIES,
    viewSettings:{solar:createViewSettings('solar'),planet:createViewSettings('planet')}};
  const renderer={planetId:null,cinema:{active:false},
    setSelected(id){calls.push(['selected',id]);},
    reset(){this.planetId=null;calls.push('solar');}};
  const context=vm.createContext({
    $:id=>({addEventListener(type,callback){if(type==='click')callbacks.set(id,callback)}}),
    S,renderer,byId,layerEnabled,availableLayerTypes,updateLayerSelection,rendererSelectionId,
    nextDetailSceneId,
    openPlanetScene(id){calls.push(['open',id]);renderer.planetId=id;return true;},
    updateMode(){calls.push('mode');},updateDetail(){calls.push('detail');},
    updateCatalog(){calls.push('catalog');},arMode:{active:true,alignToPerspective(){calls.push('align');}},
    mobileSheets:{close(){calls.push('close');}}
  });
  vm.runInContext(source.slice(start,end),context);
  const click=callbacks.get('planet-view-btn');
  const scenes=['earth','moon',null,'earth'];
  for(const scene of scenes){
    click();
    assert.equal(renderer.planetId,scene);
    assert.equal(S.selected,'moon','selected detail body persists at every step');
    assert.deepEqual(calls.slice(-4),['mode','align','catalog','detail']);
    assert.equal(calls.includes('close'),false,'the view toggle must leave the mobile sheet open');
  }
  assert.deepEqual(calls.filter(item=>Array.isArray(item)&&item[0]==='open').map(item=>item[1]),['earth','moon','earth']);
  assert.equal(calls.filter(item=>item==='solar').length,1);
  assert.equal(layerEnabled(S.viewSettings.planet.layers,'moon'),true);
  assert.equal(layerEnabled(S.viewSettings.solar.layers,'moon'),true);
});

test('v152: an unrelated selected object returns first to the overview',async()=>{
  const source=await readFile(new URL('../src/ui/event-handlers.js',import.meta.url),'utf8');
  const start=source.indexOf("  $('planet-view-btn').addEventListener('click',()=>{");
  const end=source.indexOf('  const togglePlayback=',start);
  const callbacks=[],S={selected:'moon',bodies:INITIAL_BODIES,viewSettings:{solar:createViewSettings('solar'),planet:createViewSettings('planet')}};
  const r={planetId:'mars',reset(){this.planetId=null;},setSelected(){}};
  vm.runInNewContext(source.slice(start,end),{$:()=>({addEventListener(_,cb){callbacks.push(cb);}}),
    S,renderer:r,byId,layerEnabled,availableLayerTypes,updateLayerSelection,rendererSelectionId,
    nextDetailSceneId,openPlanetScene:()=>{throw Error('wrong destination');},
    updateMode(){},updateCatalog(){},updateDetail(){},mobileSheets:null,arMode:null});
  callbacks[0]();
  assert.equal(r.planetId,null);
  assert.equal(S.selected,'moon');
});
