import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const read=filename=>readProjectSource(filename);

test('the active toolbar layout keeps popovers aligned below the row',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  assert.match(html,/class="control-panel viewport-topright"[^>]*id="view-mode-status"/);
  assert.ok(html.indexOf('id="layer-btn"')<html.indexOf('id="speed-btn"'));
  // The former two-trigger width and intermediate v40 offsets were superseded
  // by the current responsive five-control toolbar, including AR and Cinema.
  const layout=css.match(/\.viewport>\.control-panel, \.viewport>\.control-panel\.ar-available,[^\n]*/)?.[0];
  assert.ok(layout,'current base and conditional toolbar configurations');
  assert.match(layout,/--control-trigger-width:55px/);
  assert.match(layout,/--control-main-scale-width:46px/);
  assert.match(layout,/flex-wrap:wrap/);
  assert.match(layout,/width:max-content!important/);
  assert.match(css,/\.viewport>\.control-panel \.layer-picker-wrap, \.viewport>\.control-panel \.time-panel\{/);
  assert.match(css,/\.viewport>\.control-panel \.layer-button, \.viewport>\.control-panel \.time-panel \.time-trigger\{width:100%;height:54px;min-height:54px/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover, \.viewport>\.control-panel \.time-panel \.speed-popover\{position:absolute;top:calc\(100% \+ 7px\);right:0/);
  assert.match(css,/@media\(max-width:770px\)\{[\s\S]*?--control-right-inset:max\(10px,env\(safe-area-inset-right\)\)/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:155px;max-width:calc\(100vw - 20px\)/);
  assert.match(css,/\.viewport>\.control-panel \.time-panel \.speed-popover\{width:120px/);
});

test('v55: Layers and Time popovers switch directly while scale toggles stay in toolbar',async()=>{
  const app=await read('src/app.js');
  const extract=(start,end)=>{
    const a=app.indexOf(start),b=app.indexOf(end,a+start.length);
    assert.ok(a>=0&&b>a,`${start} precedes ${end}`);
    return app.slice(a,b);
  };
  const layerFn=extract('function setLayerPopover(open){','function syncScaleControls(){');
  const speedFn=extract('function setSpeedPopover(open) {','function initControls(){');
  const layerClick=extract("$('layer-btn').addEventListener('click',()=>{","  for(const [id,setting]");
  const speedClick=extract("$('speed-btn').addEventListener('click',()=>{","  $('speed').addEventListener('input'");
  const controls=Object.fromEntries(['layer-btn','layer-popover','speed-btn','speed-popover','speed'].map(id=>[id,{
    id,hidden:true,attrs:{},listeners:{},setAttribute(key,val){this.attrs[key]=val;},
    addEventListener(type,cb){this.listeners[type]=cb;},focus(){this.focused=true;},click(){this.listeners.click();}
  }]));
  const ctx=vm.createContext({$:id=>controls[id]});
  vm.runInContext(layerFn+speedFn+layerClick+speedClick,ctx);
  controls['layer-btn'].click();
  assert.equal(controls['layer-popover'].hidden,false);
  assert.equal(controls['speed-popover'].hidden,true);
  assert.equal(controls['layer-btn'].attrs['aria-expanded'],'true');
  controls['speed-btn'].click();
  assert.equal(controls['layer-popover'].hidden,true);
  assert.equal(controls['speed-popover'].hidden,false);
  assert.equal(controls['speed-btn'].attrs['aria-expanded'],'true');
  assert.equal(controls.speed.focused,true);
  controls['layer-btn'].click();
  assert.equal(controls['layer-popover'].hidden,false);
  assert.equal(controls['speed-popover'].hidden,true);
  controls['layer-btn'].click();
  assert.equal(controls['layer-popover'].hidden,true);
  assert.equal(controls['layer-btn'].attrs['aria-expanded'],'false');
  assert.doesNotMatch(app,/setScalePopover|\$\('scale-btn'\)/);
});

