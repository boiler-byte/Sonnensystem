import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const read=async filename=>readFile(new URL('../'+filename,import.meta.url),'utf8');
const between=(source,begin,end)=>{
  const a=source.indexOf(begin),b=source.indexOf(end,a+begin.length);
  assert.ok(a>=0&&b>a,`${begin} occurs before ${end}`);
  return source.slice(a,b);
};

test('v20: labels toggle is part of the layer dropdown rather than the scene tools',async()=>{
  const html=await read('index.html');
  const app=await read('src/app.js');
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  const scene=between(html,'id="time-panel"','id="canvas-error"');
  assert.match(layer,/class="layer-label-section" aria-label="Beschriftung-Einstellungen"/);
  assert.match(layer,/id="toggle-labels"[^>]*aria-pressed="true"/);
  assert.match(layer,/id="toggle-labels"[^>]*>[\s\S]*?<span>Beschriftung<\/span>/);
  assert.doesNotMatch(scene,/id="toggle-labels"/);
  assert.doesNotMatch(scene,/id="reset-camera"/);
  assert.match(html,/class="viewport-actions"[\s\S]*?id="reset-camera"/);
  assert.equal((html.match(/id="toggle-labels"/g)||[]).length,1);
  assert.match(app,/\$\('toggle-labels'\)\.addEventListener\('click',\(\)=>\{S\.settings\.labels=!S\.settings\.labels;syncLabelControl\(\);\}\)/);
});

test('v20: default orbit contrast starts disabled while orbit lines, colors and labels remain on',async()=>{
  const html=await read('index.html'),app=await read('src/app.js'),layerModel=await read('src/data/layers.js');
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  assert.match(layerModel,/orbits:true, orbitContrast:false, orbitColors:true, labels:true/);
  assert.match(layer,/class="orbit-option orbit-suboption" id="orbit-contrast-btn"[^>]*aria-pressed="false"[^>]*><span>Kontrast<\/span><span[^>]*>Aus<\/span>/);
  for(const id of ['orbit-visibility-btn','orbit-colors-btn'])
    assert.match(layer,new RegExp(`id="${id}"[^>]*aria-pressed="true"`));
  assert.match(app,/S\.settings\[setting\]=!S\.settings\[setting\];\s*syncOrbitControls\(\)/);
});

test('v20: labels synchronize visible An/Aus and aria-pressed after toggling',async()=>{
  const source=await read('src/app.js');
  const fn=between(source,'function syncLabelControl(){','function changeLayers(next){');
  const indicator={textContent:'An'};
  const attrs={};
  const classes=new Set(['active']);
  const control={
    setAttribute(key,value){attrs[key]=value;},
    classList:{toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);}},
    querySelector(selector){assert.equal(selector,'.orbit-toggle-indicator');return indicator;}
  };
  const state={settings:{labels:true}};
  const context=vm.createContext({S:state,$:()=>control});
  vm.runInContext(fn+'\nthis.syncLabelControl=syncLabelControl;',context);
  state.settings.labels=false;context.syncLabelControl();
  assert.equal(attrs['aria-pressed'],'false');
  assert.equal(indicator.textContent,'Aus');
  assert.equal(classes.has('active'),false);
  state.settings.labels=true;context.syncLabelControl();
  assert.equal(attrs['aria-pressed'],'true');
  assert.equal(indicator.textContent,'An');
  assert.equal(classes.has('active'),true);
});

test('v20: bigger contrasted slider thumb with mobile on-stage control panel and two sheet tabs',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),sheet=await read('src/ui/bottom-sheet.js');
  assert.match(css,/#speed::-webkit-slider-thumb\{[\s\S]*?width:26px;height:26px;[\s\S]*?background:#ffedc7/);
  assert.match(css,/#speed::-moz-range-thumb\{[\s\S]*?width:26px;height:26px;[\s\S]*?background:#ffedc7/);
  assert.match(css,/\.speed-slider-rail\{\s*position:relative;width:44px;height:150px/);
  assert.match(css,/transform:translate\(-50%,-50%\) rotate\(-90deg\)/);
  assert.match(css,/\.viewport>\.control-panel\{\s*display:flex!important/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{[\s\S]*?overflow-y:auto/);
  assert.match(css,/\.sheet-tabs\{[^\n]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.deepEqual([...html.matchAll(/data-sheet-panel="([a-z]+)"/g)].map(m=>m[1]),['catalog','detail']);
  assert.doesNotMatch(sheet,/control:\$\('view-mode-status'\)|mobileOverview|overviewAnchor/);
  assert.match(sheet,/const panels = \{catalog:\$\('catalog'\),detail:\$\('detail'\)\}/);
  assert.match(sheet,/function dismissScenePopovers\(\)/);
  assert.match(sheet,/\$\(popover\)\.hidden=true;\$\(button\)\.setAttribute\('aria-expanded','false'\)/);
  assert.doesNotMatch(html,/id="mobile-overview"/);
});
