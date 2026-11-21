import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {S} from '../src/app/state.js';
import {createViewSettings,displayPreset,displayMatchesPreset} from '../src/data/layers.js';
import {advanceOrbitDisplayMode,orbitDisplayMode,nextOrbitDisplayMode,syncOrbitControls,syncContrastControl} from '../src/ui/display-controls.js';
import {orbitAppearance} from '../src/renderer/orbits.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v114: orbit modes cycle without changing contrast, in solar and planet views',()=>{
  for(const view of ['solar','planet']){
    const settings=createViewSettings(view);
    const modes=view==='solar'?['galactic','off','normal']:['off','normal'];
    for(const contrast of [false,true]){
      settings.orbitContrast=contrast;
      for(const mode of modes){
        assert.equal(advanceOrbitDisplayMode(settings,view),mode);
        assert.equal(orbitDisplayMode(settings,view),mode);
        assert.equal(settings.orbits,mode!=='off');
        assert.equal(settings.galacticMotion,mode==='galactic');
        assert.equal(settings.orbitContrast,contrast,'contrast remains independent');
      }
    }
  }
  const legacy={orbits:false,orbitContrast:true};
  assert.equal(orbitDisplayMode(legacy,'solar'),'off');
  assert.equal(advanceOrbitDisplayMode(legacy,'solar'),'normal');
  assert.deepEqual(legacy,{orbits:true,orbitContrast:true,galacticMotion:false});
});

test('v114: presets and per-view preferences preserve their own contrast states',()=>{
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  advanceOrbitDisplayMode(solar,'solar');
  advanceOrbitDisplayMode(solar,'solar');
  assert.equal(orbitDisplayMode(solar,'solar'),'off');
  assert.equal(orbitDisplayMode(planet,'planet'),'normal');
  Object.assign(planet,displayPreset('all','planet'));
  assert.equal(orbitDisplayMode(planet,'planet'),'normal');
  assert.equal(planet.orbitContrast,true);
  assert.equal(displayMatchesPreset(planet,'all','planet'),true);
  Object.assign(solar,displayPreset('standard','solar'));
  assert.equal(orbitDisplayMode(solar,'solar'),'normal');
  assert.equal(displayMatchesPreset(solar,'standard','solar'),true);
  assert.ok(orbitAppearance({id:'earth',type:'planet'},planet).widthPx>orbitAppearance({id:'earth',type:'planet'},solar).widthPx);
});

test('v114: two controls expose independent accessible pressed states',()=>{
  const previousDocument=globalThis.document,previousSettings=S.settings;
  const elements=new Map();
  const node=id=>{
    if(!elements.has(id)){
      const attrs={},classes=new Set();
      elements.set(id,{attrs,classes,title:'',setAttribute(k,v){attrs[k]=String(v)},
        classList:{toggle(name,on){if(on)classes.add(name);else classes.delete(name)}}});
    }
    return elements.get(id);
  };
  globalThis.document={getElementById:node};
  S.settings=createViewSettings('solar');
  try{
    for(const [mode,next] of [['normal','Galaktische Bewegung'],['galactic','Aus'],['off','Umlaufbahn']]){
      syncOrbitControls();syncContrastControl();
      assert.equal(node('orbit-visibility-btn').attrs['data-orbit-mode'],mode);
      assert.match(node('orbit-visibility-btn').attrs['aria-label'],new RegExp(`Nächster Modus: ${next}`));
      assert.equal(node('orbit-contrast-btn').attrs['aria-pressed'],'false');
      advanceOrbitDisplayMode(S.settings,'solar');
    }
    S.settings.orbitContrast=true;
    syncContrastControl();
    assert.equal(node('orbit-contrast-btn').attrs['aria-pressed'],'true');
    assert.equal(node('orbit-contrast-btn').classes.has('active'),true);
    S.settings.galacticMotion=true;
    syncOrbitControls();syncContrastControl();
    assert.equal(node('orbit-visibility-btn').attrs['data-orbit-mode'],'galactic');
    assert.equal(node('orbit-contrast-btn').attrs['aria-pressed'],'true');
  }finally{
    S.settings=previousSettings;
    if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;
  }
});

test('v114: Layer popover contains standalone contrast in row two, and galactic icon stays in orbit button',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const area=html.slice(html.indexOf('class="layer-display-toggles"'),html.indexOf('              <button class="layer-speed-toggle"'));
  const ids=[...area.matchAll(/<button[^>]*id="([a-z-]+)"/g)].map(match=>match[1]);
  assert.deepEqual(ids,['toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-lighting','toggle-four-moons']);
  assert.equal((area.match(/<button /g)||[]).length,5);
  assert.match(area,/data-orbit-mode="normal"/);
  assert.match(area,/class="orbit-galactic-icon"/);
  assert.match(area,/id="orbit-contrast-btn"[^>]*aria-pressed="false"/);
  assert.match(css,/\.viewport>\.control-panel \.layer-display-toggles\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/#orbit-visibility-btn\[data-orbit-mode="galactic"\] \.orbit-galactic-icon\{display:block\}/);
  assert.doesNotMatch(css,/#orbit-visibility-btn\[data-orbit-mode="contrast"\]/);
});
