import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {syncLayers} from '../src/ui/layer-panel.js';
import {S,setRenderer} from '../src/app/state.js';
import {createViewSettings,layerEnabled} from '../src/data/layers.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const expectedTypes=['star','planet','dwarf','asteroid','comet','moon','satellite','probe'];

function mockDom(){
  const nodes=new Map();
  const getElementById=id=>{
    if(!nodes.has(id))nodes.set(id,{
      id,hidden:false,disabled:false,title:'',textContent:'',
      classList:{toggle(){}},setAttribute(){},focus(){},
      style:{setProperty(){}}
    });
    return nodes.get(id);
  };
  const checks=expectedTypes.map(type=>({
    dataset:{layerType:type},parentElement:{hidden:false,style:{setProperty(){}}},
    disabled:false,checked:false,indeterminate:false
  }));
  const presets=['all','standard'].map(type=>({dataset:{layerPreset:type},classList:{toggle(){}},setAttribute(){}}));
  return {
    checks,getElementById,
    querySelectorAll(selector){
      if(selector==='[data-layer-type]')return checks;
      if(selector==='[data-layer-preset]')return presets;
      return [];
    },
    visibleTypes(){return checks.filter(check=>!check.parentElement.hidden).map(check=>check.dataset.layerType);}
  };
}

test('v144: visual category order and separator are exactly below Kometen',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const panel=html.split('id="layer-categories"')[1].split('id="layer-speed-panel"')[0];
  const entries=[...panel.matchAll(/data-layer-type="([a-z]+)"/g)].map(match=>match[1]);
  assert.deepEqual(entries,expectedTypes);
  const comet=panel.indexOf('data-layer-type="comet"');
  const divider=panel.indexOf('class="layer-category-separator"');
  const moon=panel.indexOf('data-layer-type="moon"');
  const satellite=panel.indexOf('data-layer-type="satellite"');
  assert.ok(comet<divider && divider<moon && moon<satellite);
  assert.equal((panel.match(/id="layer-category-separator"/g)||[]).length,1);
  assert.match(panel,/class="layer-category-separator" id="layer-category-separator" role="separator" aria-hidden="true"/);
  assert.match(css,/\.layer-options \.layer-option:has\(>input\[data-layer-type="star"\]\).*display:none!important/);
  assert.match(css,/\.layer-options \.layer-option:has\(>input\[data-layer-type="probe"\]\).*display:none!important/);
  assert.match(css,/\.layer-options \.layer-category-separator\{height:1px/);
  assert.match(css,/\.layer-options \.layer-category-separator\[hidden\]\{display:none!important\}/);
});

test('v144: hidden controls do not change scene layer selection; separator follows category availability',()=>{
  const prevDoc=globalThis.document,prevSettings=S.settings,prevBodies=S.bodies;
  const dom=mockDom();
  try{
    globalThis.document=dom;
    S.bodies=INITIAL_BODIES;
    S.settings=createViewSettings('solar');
    setRenderer(null);
    const layers=S.settings.layers;
    syncLayers();
    assert.deepEqual(dom.visibleTypes(),['planet','dwarf','asteroid','comet','moon','satellite']);
    assert.equal(dom.getElementById('layer-category-separator').hidden,false);
    assert.equal(layerEnabled(layers,'star'),true,'Sun stays visible in the standard scene');
    assert.equal(layerEnabled(layers,'probe'),false,'probes keep their stored preset state');
    assert.equal(dom.checks.find(check=>check.dataset.layerType==='star').checked,true);
    assert.equal(S.settings.layers,layers,'hiding a menu entry must not change the filter');

    S.settings.row=true;
    syncLayers();
    assert.deepEqual(dom.visibleTypes(),['planet','dwarf','asteroid','comet']);
    assert.equal(dom.getElementById('layer-category-separator').hidden,true);
    S.settings.row=false;

    S.settings=createViewSettings('planet');
    setRenderer({planetId:'mercury'});
    syncLayers();
    assert.deepEqual(dom.visibleTypes(),['planet']);
    assert.equal(dom.getElementById('layer-category-separator').hidden,true);
    setRenderer({planetId:'earth'});
    syncLayers();
    assert.deepEqual(dom.visibleTypes(),['planet','moon','satellite']);
    assert.equal(dom.getElementById('layer-category-separator').hidden,false);
  }finally{
    if(prevDoc===undefined)delete globalThis.document;else globalThis.document=prevDoc;
    S.settings=prevSettings;
    S.bodies=prevBodies;
    setRenderer(null);
  }
});
