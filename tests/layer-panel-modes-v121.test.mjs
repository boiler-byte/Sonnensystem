import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {
  LAYER_TYPES,availableLayerTypes,layerEnabled,layerPreset,updateLayerSelection
} from '../src/data/layers.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const handlerStart="  $('toggle-four-moons').addEventListener('click',()=>{";

async function moonClick(view='solar',options={}){
  const src=await read('src/ui/event-handlers.js');
  const first=src.indexOf(handlerStart);
  assert.ok(first!==-1,'existing Moon button event must remain');
  const last=src.indexOf('\n  });',first);
  assert.ok(last>first,'Moon callback must end before the following control');
  const body=src.slice(first+handlerStart.length,last);
  const settings={
    labels:true,orbits:true,orbitContrast:false,galacticMotion:false,
    lighting:'optimized',fourMoons:true,scaleObjects:false,row:false,
    layers:options.layers??layerPreset('standard',view)
  };
  const S={settings,bodies:options.bodies??[{id:'earth',type:'planet'},{id:'luna',type:'moon',parentId:'earth'}]};
  const renderer={planetId:view==='planet'?'earth':null,cinema:null};
  const events={layers:0,refresh:0,ui:0,toasts:[],calls:[]};
  const ctx={
    S,renderer,availableLayerTypes,layerEnabled,updateLayerSelection,
    activeView:()=>view,
    changeLayers:next=>{
      events.calls.push(next);
      if(next!==S.settings.layers){S.settings.layers=next;events.layers++;}
    },
    refreshRowCameraFrame:()=>events.refresh++,
    syncFourMoonsControl:()=>events.ui++,
    syncLayers:()=>events.ui++,
    notifyToggle:message=>events.toasts.push(message)
  };
  const click=()=>vm.runInNewContext(`(()=>{${body}\n})()`,ctx);
  return {click,S,events,renderer};
}

test('v121: activating all moons selects the Moon category and preserves other categories',async()=>{
  const {click,S,events}=await moonClick();
  const previous=S.settings.layers;
  const untouchedSettings=Object.fromEntries(Object.entries(S.settings)
    .filter(([key])=>!['layers','fourMoons'].includes(key)));
  assert.equal(layerEnabled(previous,'moon'),false,'the solar default has Moon category off');
  click();
  assert.equal(S.settings.fourMoons,false,'all moons mode enabled');
  assert.equal(layerEnabled(S.settings.layers,'moon'),true,'the Moon category is now enabled');
  assert.equal(S.settings.layers.mode,'custom','switch to custom filter, not all objects');
  assert.deepEqual([...S.settings.layers.types],['star','planet','moon']);
  assert.equal(layerEnabled(previous,'moon'),false,'the previous selection remains immutable');
  assert.deepEqual(Object.fromEntries(Object.entries(S.settings)
    .filter(([key])=>!['layers','fourMoons'].includes(key))),untouchedSettings);
  assert.equal(events.layers,1,'new selection applied through the existing changeLayers path');
  assert.deepEqual(events.toasts,['Alle Monde: An (alle)']);
  assert.ok(events.ui>=2,'update Moon button and category checkbox');
  assert.ok(events.refresh>=1,'camera row is refreshed');
});

test('v121: disabling all moons keeps the Moon category; reactivation does not replace existing selection',async()=>{
  const {click,S,events}=await moonClick();
  click();
  const withMoon=S.settings.layers;
  click();
  assert.equal(S.settings.fourMoons,true,'four-moon cap restored');
  assert.equal(layerEnabled(S.settings.layers,'moon'),true,'category remains enabled');
  assert.equal(S.settings.layers,withMoon,'disabling does not touch category filters');
  click();
  assert.equal(S.settings.fourMoons,false);
  assert.equal(S.settings.layers,withMoon,'existing Moon selection stays untouched on reactivation');
  assert.equal(events.layers,1,'category was changed only during first activation');
  assert.deepEqual(events.toasts,[
    'Alle Monde: An (alle)','Alle Monde: Aus (max. 4)','Alle Monde: An (alle)'
  ]);
});

test('v121: enabling all moons in a planet scene respects and restores existing filter groups',async()=>{
  const start=updateLayerSelection(layerPreset('standard','planet'),'moon',false,'planet');
  assert.equal(layerEnabled(start,'moon'),false);
  const {click,S}=await moonClick('planet',{layers:start});
  click();
  assert.equal(layerEnabled(S.settings.layers,'moon'),true);
  assert.equal(layerEnabled(S.settings.layers,'planet'),true);
  assert.equal(layerEnabled(S.settings.layers,'satellite'),true);
  assert.equal(S.settings.layers.mode,'standard','planet standard set recovered');
  for(const type of LAYER_TYPES.filter(t=>!['planet','moon','satellite'].includes(t)))
    assert.equal(layerEnabled(S.settings.layers,type),false,`${type} is not accidentally enabled`);
});

test('v121: point labels and galactic movement alone get blue active and hover colors',async()=>{
  const [css,ui]=await Promise.all([read('css/styles.css'),read('src/ui/display-controls.js')]);
  // The ID + attribute selectors outrank the generic hover rule, so the
  // blue styling persists on hover without another pair of CSS rules.
  assert.match(css,
    /:is\(#toggle-labels\[data-label-mode=points\],#orbit-visibility-btn\[data-orbit-mode=galactic\]\)\.active\{background:#153654;border-color:#428ecf;color:#cae9ff\}/);
  assert.match(css,/\.scale-tool-toggle\.active\{color:#ffe0b2;background:#293344;border-color:#967b54\}/,
    'other toggles keep their existing golden active state');
  assert.match(ui,/button\.setAttribute\('data-label-mode',mode\)/);
  assert.match(ui,/button\.setAttribute\('data-orbit-mode',mode\)/);
  assert.match(ui,/syncToggleState\(button,mode!=='off'/);
  assert.doesNotMatch(css,/#toggle-lighting\[data-/);
  assert.doesNotMatch(css,/#toggle-four-moons\[data-/);
  assert.doesNotMatch(css,/#orbit-contrast-btn\[data-/);
});
