import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const read=filename=>readProjectSource(filename);

test('v124: compact toolbar has exactly one aligned Layer popover',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  assert.match(html,/class="control-panel viewport-topright"[^>]*id="view-mode-status"/);
  assert.doesNotMatch(html,/id="speed-btn"|id="speed-popover"|id="time-panel"/);
  const layout=css.match(/\.viewport>\.control-panel, \.viewport>\.control-panel\.ar-available,[^\n]*/)?.[0];
  assert.ok(layout);
  assert.match(layout,/--control-main-scale-width:46px/);
  assert.match(layout,/flex-wrap:wrap/);
  assert.match(layout,/width:max-content!important/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:155px;max-width:calc\(100vw - 20px\)/);
});

test('v124: Layer popover is the only time and category menu',async()=>{
  const app=await read('src/app.js');
  const layerFn=app.slice(app.indexOf('function setLayerPopover(open){'),app.indexOf('function syncScaleControls(){'));
  const layerClick=app.slice(app.indexOf("$('layer-btn').addEventListener('click',()=>{"),app.indexOf('  for(const [id,setting]'));
  const controls=Object.fromEntries(['layer-btn','layer-popover'].map(id=>[id,{
    hidden:true,attrs:{},listeners:{},setAttribute(key,val){this.attrs[key]=val;},
    addEventListener(type,cb){this.listeners[type]=cb;},click(){this.listeners.click();}
  }]));
  const ctx=vm.createContext({$:id=>controls[id]});
  vm.runInContext(layerFn+layerClick,ctx);
  controls['layer-btn'].click();
  assert.equal(controls['layer-popover'].hidden,false);
  assert.equal(controls['layer-btn'].attrs['aria-expanded'],'true');
  controls['layer-btn'].click();
  assert.equal(controls['layer-popover'].hidden,true);
  assert.equal(controls['layer-btn'].attrs['aria-expanded'],'false');
  assert.match(app,/\$\('layer-speed-toggle'\)\.addEventListener\('click',toggleLayerSpeedPanel\)/);
  assert.doesNotMatch(app,/setSpeedPopover|speed-popover|\$\('speed-btn'\)/);
});

