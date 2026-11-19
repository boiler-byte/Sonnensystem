import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {S} from '../src/app/state.js';
import {createViewSettings,displayPreset,displayMatchesPreset} from '../src/data/layers.js';
import {advanceOrbitDisplayMode,orbitDisplayMode,syncOrbitControls} from '../src/ui/display-controls.js';
import {orbitAppearance} from '../src/renderer/orbits.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v96: orbit toggle cycles normal → contrast → off → normal without inconsistent flags',()=>{
  for(const view of ['solar','planet']){
    const settings=createViewSettings(view);
    assert.equal(orbitDisplayMode(settings),'normal');
    const transitions=[
      {mode:'contrast',orbits:true,orbitContrast:true},
      {mode:'off',orbits:false,orbitContrast:false},
      {mode:'normal',orbits:true,orbitContrast:false}
    ];
    for(const want of transitions){
      assert.equal(advanceOrbitDisplayMode(settings),want.mode);
      assert.equal(orbitDisplayMode(settings),want.mode);
      assert.equal(settings.orbits,want.orbits);
      assert.equal(settings.orbitContrast,want.orbitContrast);
    }
  }
  const old={orbits:false,orbitContrast:true};
  assert.equal(orbitDisplayMode(old),'off','a legacy contradictory state is considered off');
  assert.equal(advanceOrbitDisplayMode(old),'normal');
  assert.deepEqual(old,{orbits:true,orbitContrast:false});
});

test('v96: presets and view preferences preserve the combined modes',()=>{
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  advanceOrbitDisplayMode(solar);
  advanceOrbitDisplayMode(solar);
  assert.equal(orbitDisplayMode(solar),'off');
  assert.equal(orbitDisplayMode(planet),'normal');
  Object.assign(planet,displayPreset('all','planet'));
  assert.equal(orbitDisplayMode(planet),'contrast');
  assert.equal(displayMatchesPreset(planet,'all','planet'),true);
  assert.equal(orbitDisplayMode(solar),'off');
  Object.assign(solar,displayPreset('standard','solar'));
  assert.equal(orbitDisplayMode(solar),'normal');
  assert.equal(displayMatchesPreset(solar,'standard','solar'),true);
  assert.equal(orbitDisplayMode(planet),'contrast');
  assert.ok(orbitAppearance({id:'earth',type:'planet'},planet).widthPx>orbitAppearance({id:'earth',type:'planet'},solar).widthPx);
});

test('v96: orbit button reports all three accessible states and the correct next mode',()=>{
  const previousDocument=globalThis.document;
  const previousSettings=S.settings;
  const attrs={};const classes=new Set();const button={title:'',
    setAttribute(k,v){attrs[k]=String(v)},
    classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name)}}
  };
  globalThis.document={getElementById:id=>id==='orbit-visibility-btn'?button:undefined};
  S.settings=createViewSettings('solar');
  try{
    const states=[
      ['normal','true',/Nächster Modus: Umlaufbahn \+ Bahnkontrast/],
      ['contrast','true',/Nächster Modus: Beides aus/],
      ['off','false',/Nächster Modus: Umlaufbahn/]
    ];
    for(const [mode,pressed,title] of states){
      syncOrbitControls();
      assert.equal(attrs['data-orbit-mode'],mode);
      assert.equal(attrs['aria-pressed'],pressed);
      assert.match(attrs['aria-label'],title);
      assert.match(button.title,title);
      assert.equal(classes.has('active'),pressed==='true');
      advanceOrbitDisplayMode(S.settings);
    }
    assert.equal(attrs['data-orbit-mode'],'off');
    assert.equal(orbitDisplayMode(S.settings),'normal');
  }finally{
    S.settings=previousSettings;
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});

test('v96: Layer UI has two paired rows and no standalone contrast control',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const area=html.slice(html.indexOf('class="layer-display-toggles"'),html.indexOf('class="layer-options"'));
  const ids=[...area.matchAll(/<button[^>]*id="([a-z-]+)"/g)].map(match=>match[1]);
  assert.deepEqual(ids,['toggle-labels','orbit-visibility-btn','toggle-lighting','toggle-four-moons']);
  assert.equal((area.match(/<button /g)||[]).length,4);
  assert.doesNotMatch(html,/id="orbit-contrast-btn"/);
  assert.match(area,/data-orbit-mode="normal"/);
  assert.match(area,/class="orbit-contrast-icon"/);
  assert.match(css,/\.viewport>\.control-panel \.layer-display-toggles\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/#orbit-visibility-btn\[data-orbit-mode="contrast"\] \.orbit-contrast-icon\{display:block\}/);
});
