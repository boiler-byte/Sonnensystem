import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createViewSettings,layerEnabled,layerPreset,availableLayerTypes,updateLayerSelection} from '../src/data/layers.js';
import {syncControls,stepForSpeed,SPEED_MODES} from '../src/ui/timeline.js';
import {S} from '../src/app/state.js';
import {syncLayers,toggleLayerSpeedPanel} from '../src/ui/layer-panel.js';
import {probeLocationBody,rendererSelectionId} from '../src/data/probe-location.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

async function catalogSelection(body,{view='solar',bodies=[body],settings=createViewSettings(view)}={}){
  const source=await read('src/app/camera-controller.js');
  const first=source.indexOf('export function selectBody(');
  const last=source.indexOf('export function clearSelection()',first);
  assert.ok(first!==-1&&last>first);
  const selectSource=source.slice(first,last).replace('export function selectBody','function selectBody');
  const state={settings,bodies,selected:null,time:Date.now()};
  const operations=[];
  const renderer={planetId:view==='planet'?'earth':null,cinema:null,
    setSelected(...args){operations.push(['render',args]);}};
  const context=vm.createContext({
    S:state,renderer,byId:id=>bodies.find(item=>item.id===id),
    layerEnabled,availableLayerTypes,updateLayerSelection,probeLocationBody,rendererSelectionId,
    changeLayers:next=>{operations.push(['layers',next]);state.settings.layers=next;},
    updateCatalog(){},updateDetail(){},loadAsteroid(){},updateMode(){},
    mobileSheets:{open(){}},arMode:null
  });
  vm.runInContext(selectSource,context);
  return {state,renderer,operations,select:id=>vm.runInContext(`selectBody(${JSON.stringify(id)},true)`,context)};
}

test('v122: catalog selection enables a filtered category before camera focus without resetting other layers',async()=>{
  const moon={id:'luna',name:'Luna',type:'moon',parentId:'earth'};
  const f=await catalogSelection(moon);
  const original=f.state.settings.layers;
  f.select(moon.id);
  assert.equal(layerEnabled(original,'moon'),false);
  assert.equal(layerEnabled(f.state.settings.layers,'moon'),true);
  assert.equal(layerEnabled(f.state.settings.layers,'star'),true);
  assert.equal(layerEnabled(f.state.settings.layers,'planet'),true);
  assert.equal(f.state.settings.layers.mode,'custom');
  assert.deepEqual(f.operations.map(op=>op[0]),['layers','render']);
  f.select(moon.id);
  assert.equal(f.operations.filter(op=>op[0]==='layers').length,1,'repeat selection is idempotent');
});

test('v122: grouped hidden body types restore their shared filters',async()=>{
  for(const [type,group] of [['tno','dwarf'],['binary','asteroid']]){
    const f=await catalogSelection({id:type,name:type,type});
    f.select(type);
    assert.equal(layerEnabled(f.state.settings.layers,type),true);
    assert.equal(layerEnabled(f.state.settings.layers,group),true);
    assert.equal(layerEnabled(f.state.settings.layers,'star'),true);
    assert.equal(layerEnabled(f.state.settings.layers,'planet'),true);
  }
});

test('v122: catalog selection inside a planet scene changes only that view filter',async()=>{
  const moon={id:'luna',name:'Luna',type:'moon',parentId:'earth'};
  const earth={id:'earth',type:'planet'};
  const planet=createViewSettings('planet');
  planet.layers=updateLayerSelection(planet.layers,'moon',false,'planet');
  const solar=layerPreset('standard','solar');
  const f=await catalogSelection(moon,{view:'planet',bodies:[earth,moon],settings:planet});
  f.select('luna');
  assert.equal(layerEnabled(planet.layers,'moon'),true);
  assert.equal(planet.layers.mode,'standard');
  assert.equal(layerEnabled(solar,'moon'),false);
  assert.equal(f.renderer.planetId,'earth');
});

function fakeDOM(){
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{
      id,hidden:false,disabled:false,attrs:{},textContent:'',value:'',title:'',
      classList:{toggle(){}},setAttribute(key,value){this.attrs[key]=String(value);},
      focus(){this.focused=true;}
    });
    return nodes.get(id);
  };
  return {nodes,get,doc:{getElementById:get,querySelectorAll:()=>[]}};
}

test('v122: one toggle swaps category list and speed control; row mode forbids changing fixed speed',()=>{
  const previousDocument=globalThis.document,previousSettings=S.settings;
  const dom=fakeDOM();
  globalThis.document=dom.doc;
  S.settings=createViewSettings('solar');
  try{
    syncLayers();
    assert.equal(dom.get('layer-categories').hidden,false);
    assert.equal(dom.get('layer-speed-panel').hidden,true);
    assert.equal(dom.get('layer-speed-toggle-label').textContent,'Kategorien');
    toggleLayerSpeedPanel();
    assert.equal(dom.get('layer-categories').hidden,true);
    assert.equal(dom.get('layer-speed-panel').hidden,false);
    assert.equal(dom.get('layer-speed-toggle').attrs['aria-pressed'],'true');
    assert.equal(dom.get('layer-speed-toggle-label').textContent,'Tempo');
    assert.equal(dom.get('layer-speed').focused,true);
    toggleLayerSpeedPanel();
    assert.equal(dom.get('layer-categories').hidden,false);
    assert.equal(dom.get('layer-speed-panel').hidden,true);
    toggleLayerSpeedPanel();
    S.settings.row=true;
    syncLayers();
    assert.equal(dom.get('layer-speed-toggle').disabled,true);
    assert.equal(dom.get('layer-speed-panel').hidden,true);
    assert.equal(dom.get('layer-categories').hidden,false);
    toggleLayerSpeedPanel();
    assert.equal(dom.get('layer-speed-panel').hidden,true);
  }finally{
    S.settings=previousSettings;
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});

test('v124: single Layer slider mirrors scene-specific speed, bounds and readable values',()=>{
  const previousDocument=globalThis.document;
  const dom=fakeDOM();globalThis.document=dom.doc;
  try{
    for(const mode of ['solar','planet']){
      const speed=SPEED_MODES[mode].defaultSpeed;
      syncControls({timelineMode:mode,speed,time:Date.UTC(2026,10,21),playing:false});
      assert.equal(dom.get('layer-speed').value,String(stepForSpeed(mode,speed)));
      assert.match(dom.get('layer-speed-value').textContent,/\/ s$/);
      assert.match(dom.get('layer-speed').attrs['aria-valuetext'],/\/ s$/);
      assert.ok(dom.get('layer-speed-min-label').textContent.includes('/ s'));
      assert.ok(dom.get('layer-speed-max-label').textContent.includes('/ s'));
    }
  }finally{
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});

test('v124: Layer holds the only speed slider and there is no second time menu',async()=>{
  const [html,events,css]=await Promise.all([read('index.html'),read('src/ui/event-handlers.js'),read('css/styles.css')]);
  assert.match(html,/id="layer-speed-toggle"[^>]*aria-pressed="false"/);
  assert.match(html,/class="layer-options" id="layer-categories"/);
  assert.match(html,/id="layer-speed-panel"[^>]*hidden/);
  assert.match(html,/id="layer-speed" type="range" min="0" max="240"/);
  assert.equal((html.match(/type="range" min="0" max="240"/g)||[]).length,1);
  assert.doesNotMatch(html,/id="speed"|id="speed-btn"|id="speed-popover"|id="time-panel"/);
  assert.match(events,/\$\('layer-speed-toggle'\)\.addEventListener\('click',toggleLayerSpeedPanel\)/);
  assert.match(events,/\$\('layer-speed'\)\.addEventListener\('input',e=>\{[\s\S]*?S\.modeSpeeds\[S\.timelineMode\]=S\.speed;[\s\S]*?updateTime\(\)/);
  assert.match(css,/\.layer-options\[hidden\],\.layer-speed-panel\[hidden\]\{display:none!important\}/);
});

