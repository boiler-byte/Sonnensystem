import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const read=filename=>readFile(new URL('../'+filename,import.meta.url),'utf8');

test('v40: horizontal triggers keep the viewport-right dropdown alignment',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const v40=css.split('/* v40: two top-edge triggers')[1];
  assert.ok(v40,'Versioned CSS rules are present after legacy overrides');
  assert.match(html,/class="control-panel viewport-topright"[^>]*id="view-mode-status"/);
  assert.ok(html.indexOf('id="layer-btn"')<html.indexOf('id="speed-btn"'));
  assert.match(v40,/display:flex!important;flex-direction:row;flex-wrap:nowrap/);
  assert.match(v40,/--control-trigger-width:58px/);
  assert.match(v40,/--control-trigger-gap:8px/);
  assert.match(v40,/width:calc\(var\(--control-trigger-width\) \+ var\(--control-trigger-gap\) \+ var\(--control-trigger-width\)\)!important/);
  assert.match(v40,/\.viewport>\.control-panel \.layer-picker-wrap,\s*\.viewport>\.control-panel \.time-panel\{/);
  assert.match(v40,/\.viewport>\.control-panel \.layer-button,\s*\.viewport>\.control-panel \.time-panel \.time-trigger\{\s*width:100%;height:54px;min-height:54px/);
  assert.match(v40,/\.viewport>\.control-panel \.layer-popover\{[\s\S]*?top:calc\(100% \+ 7px\);[\s\S]*?right:calc\(0px - var\(--control-trigger-width\) - var\(--control-trigger-gap\) - var\(--control-right-inset\)\)/);
  assert.match(v40,/\.viewport>\.control-panel \.time-panel \.speed-popover\{[\s\S]*?top:calc\(100% \+ 7px\);[\s\S]*?right:calc\(0px - var\(--control-right-inset\)\)/);
  assert.match(v40,/@media\(max-width:770px\)\{[\s\S]*?--control-right-inset:max\(10px,env\(safe-area-inset-right\)\)/);
  assert.match(v40,/max-height:calc\(100dvh/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:155px/);
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

test('v41: version and offline cache move together',async()=>{
  const [html,pkg,sw]=await Promise.all([read('index.html'),read('package.json'),read('sw.js')]);
  assert.match(html,/<meta name="app-version" content="V63\.0"/);
  assert.equal(JSON.parse(pkg).version,'63.0.0');
  assert.match(sw,/const CACHE_NAME='sonnensystem-shell-v63'/);
  assert.doesNotMatch(sw,/sonnensystem-shell-v39/);
});
