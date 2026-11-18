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

test('v55: labels button lives above Layer categories, not in scene tools',async()=>{
  const html=await read('index.html'),app=await read('src/app.js');
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  const scene=between(html,'id="time-panel"','id="canvas-error"');
  assert.match(layer,/class="layer-display-controls"/);
  assert.match(layer,/id="toggle-labels"[^>]*aria-pressed="true"/);
  assert.ok(layer.indexOf('id="toggle-labels"')<layer.indexOf('class="layer-options"'));
  assert.match(layer,/class="tab-label-icon"/);
  assert.doesNotMatch(scene,/id="toggle-labels"|id="reset-camera"/);
  assert.match(html,/class="viewport-actions"[\s\S]*?id="reset-camera"/);
  assert.equal((html.match(/id="toggle-labels"/g)||[]).length,1);
  assert.match(app,/\$\('toggle-labels'\)\.addEventListener\('click'/);
});

test('v55: orbit contrast defaults off and orbit visibility on in Layer controls',async()=>{
  const html=await read('index.html'),app=await read('src/app.js'),layerModel=await read('src/data/layers.js');
  const layer=between(html,'id="layer-popover"','id="time-panel"');
  assert.match(layerModel,/orbits:true, orbitContrast:false, labels:true/);
  assert.match(layer,/id="orbit-contrast-btn"[^>]*aria-pressed="false"/);
  assert.match(layer,/class="contrast-icon"/);
  assert.match(layer,/id="orbit-visibility-btn"[^>]*aria-pressed="true"/);
  assert.ok(layer.indexOf('id="orbit-visibility-btn"')<layer.indexOf('class="layer-options"'));
  assert.match(app,/S\.settings\[setting\]=!S\.settings\[setting\];\s*syncOrbitControls\(\)/);
});

test('v43: labels synchronize titles, active styling and aria-pressed after toggling',async()=>{
  const source=await read('src/app.js');
  const fn=between(source,'function syncLabelControl(){','function changeLayers(next){');
  const attrs={};
  const classes=new Set(['active']);
  const control={
    setAttribute(key,value){attrs[key]=value;},
    classList:{toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);}}
  };
  const state={settings:{labels:true}};
  const context=vm.createContext({S:state,$:()=>control});
  vm.runInContext(fn+'\nthis.syncLabelControl=syncLabelControl;',context);
  state.settings.labels=false;context.syncLabelControl();
  assert.equal(attrs['aria-pressed'],'false');
  assert.match(control.title,/Beschriftung: Aus/);
  assert.equal(classes.has('active'),false);
  state.settings.labels=true;context.syncLabelControl();
  assert.equal(attrs['aria-pressed'],'true');
  assert.match(control.title,/Beschriftung: An/);
  assert.equal(classes.has('active'),true);
});

test('v20: bigger contrasted slider thumb with mobile on-stage control panel and two sheet tabs',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),sheet=await read('src/ui/bottom-sheet.js');
  assert.match(css,/#speed::-webkit-slider-thumb\{[\s\S]*?width:26px;height:26px;[\s\S]*?background:#ffedc7/);
  assert.match(css,/#speed::-moz-range-thumb\{[\s\S]*?width:26px;height:26px;[\s\S]*?background:#ffedc7/);
  assert.match(css,/\.speed-slider-rail\{\s*position:relative;width:44px;height:200px/);
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
