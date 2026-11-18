import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createViewSettings} from '../src/data/layers.js';
import {CATEGORY_COLORS,EARTH_ORBIT_COLOR} from '../src/data/bodies.js';
import {orbitAppearance} from '../src/renderer/orbits.js';
import {notify,notifyToggle} from '../src/ui/status.js';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const segment=(source,start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Expected ordered markers: ${start} / ${end}`);
  return source.slice(a,b);
};

test('v55: three always-visible scale toggles; five compact icon-only Layer tools',async()=>{
 const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
 assert.doesNotMatch(html,/id="scale-popover"|id="scale-btn"/);
 const main=segment(html,'class="scale-main-controls"','id="layer-picker-wrap"');
 const layer=segment(html,'class="layer-display-toggles"','class="layer-options"');
 const mainIds=[...main.matchAll(/<button[^>]*id="([a-z-]+)"/g)].map(x=>x[1]);
 assert.deepEqual(mainIds,['scale-objects-btn','scale-orbits-btn','orbit-row-btn']);
 const appearanceIds=[...layer.matchAll(/<button[^>]*id="([a-z-]+)"/g)].map(x=>x[1]);
 assert.deepEqual(appearanceIds,['toggle-labels','toggle-lighting','toggle-four-moons','orbit-visibility-btn','orbit-contrast-btn']);
 for(const id of [...mainIds,...appearanceIds]){
   const button=html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
   assert.match(button,/aria-pressed="(true|false)"/);assert.match(button,/<svg /);assert.match(button,/title="[^"]+"/);
 }
 assert.match(css,/\.layer-display-toggles\{[\s\S]*?grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.ok(css.includes('.layer-display-toggles .scale-tool-toggle:nth-child(4){grid-column:2 / span 2}'));
});

test('v43: no colors toggle or orbitColors preference remains; palette always applies',async()=>{
  const [html,app,layers,css]=await Promise.all([
    read('index.html'),read('src/app.js'),read('src/data/layers.js'),read('css/styles.css')
  ]);
  assert.doesNotMatch(html,/id="orbit-colors-btn"|class="palette-icon"/);
  assert.doesNotMatch(app,/orbitColors|orbit-colors-btn/);
  assert.doesNotMatch(layers,/orbitColors/);
  assert.doesNotMatch(css,/\.scale-tool-toggle \.palette-icon/);
  for(const view of ['solar','planet'])assert.equal(Object.hasOwn(createViewSettings(view),'orbitColors'),false);
  for(const [type,color] of Object.entries(CATEGORY_COLORS)){
    assert.equal(orbitAppearance({id:type,type}, {orbitContrast:false}).color,color);
    assert.equal(orbitAppearance({id:type,type}, {orbitContrast:true,orbitColors:false}).color,color,
      'obsolete disabled color flag must not override palette');
  }
  assert.equal(orbitAppearance({id:'earth',type:'planet'},{orbitColors:false}).color,EARTH_ORBIT_COLOR);
});

test('v43: right-bottom snackbar is an accessible separate live region',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  assert.match(html,/id="toggle-toast" class="toggle-toast" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(css,/\.toggle-toast\{\s*position:fixed;z-index:85;right:max\(14px,env\(safe-area-inset-right\)\)/);
  assert.match(css,/\.toggle-toast\.show\{opacity:1;transform:translateY\(0\)\}/);
  assert.match(css,/@media\(max-width:770px\)\{\s*\.toggle-toast\{bottom:calc\(113px/);
});

test('v43: repeated snackbar updates replace prior message and reset dismissal timer',()=>{
  const beforeDoc=globalThis.document;
  const beforeSet=globalThis.setTimeout,beforeClear=globalThis.clearTimeout;
  const timerQueue=new Map(),cleared=[],dom=new Map();let next=0;
  const element=id=>{
    if(!dom.has(id)){
      const classes=new Set();
      dom.set(id,{textContent:'',classes,classList:{add:name=>classes.add(name),remove:name=>classes.delete(name),toggle:(name,enabled)=>enabled?classes.add(name):classes.delete(name)}});
    }
    return dom.get(id);
  };
  globalThis.document={getElementById:element};
  globalThis.setTimeout=(cb,delay)=>{timerQueue.set(++next,{cb,delay});return next;};
  globalThis.clearTimeout=id=>{cleared.push(id);timerQueue.delete(id);};
  try{
    notifyToggle('Objekt: Maßstabsgetreu');
    assert.equal(element('toggle-toast').textContent,'Objekt: Maßstabsgetreu');
    assert.equal(element('toggle-toast').classes.has('show'),true);
    assert.equal(timerQueue.get(1).delay,2400);
    notifyToggle('Umlaufbahn: Aus');
    assert.equal(element('toggle-toast').textContent,'Umlaufbahn: Aus');
    assert.equal(timerQueue.has(1),false);
    assert.ok(cleared.includes(1));
    assert.equal(timerQueue.get(2).delay,2400);
    notify('API: Offline');
    assert.equal(element('toast').textContent,'API: Offline');
    assert.equal(element('toggle-toast').textContent,'Umlaufbahn: Aus');
    timerQueue.get(2).cb();
    assert.equal(element('toggle-toast').classes.has('show'),false);
  }finally{
    if(beforeDoc===undefined)delete globalThis.document;else globalThis.document=beforeDoc;
    globalThis.setTimeout=beforeSet;globalThis.clearTimeout=beforeClear;
  }
});

test('v43: all five icon toggles update state, aria-pressed and status snackbar',async()=>{
  const app=await read('src/app.js');
  const controlsSource=segment(app,'function syncOrbitControls(){','function changeLayers(next){');
  const handlerStart=app.indexOf("  for(const [id,setting] of [['orbit-visibility-btn'",app.indexOf('function initControls(){'));
  const handlerEnd=app.indexOf("  $('center-object-btn').addEventListener('click'",handlerStart);
  assert.ok(handlerStart>0&&handlerEnd>handlerStart);
  const handlers=app.slice(handlerStart,handlerEnd);
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      const classNames=new Set();
      elements.set(id,{attrs:{},title:'',handler:null,classNames,
        setAttribute(name,value){this.attrs[name]=value;},
        classList:{toggle:(name,enabled)=>enabled?classNames.add(name):classNames.delete(name)},
        addEventListener(type,handler){assert.equal(type,'click');this.handler=handler;}});
    }
    return elements.get(id);
  };
  const notices=[],solar=createViewSettings('solar'),S={settings:solar};
  const ctx=vm.createContext({S,$:get,syncLayers:()=>{},notifyToggle:msg=>notices.push(msg),renderer:null});
  vm.runInContext(controlsSource+handlers,ctx);
  for(const [id,label,defaultPressed] of [
    ['toggle-labels','Beschriftung',true],['toggle-lighting','Beleuchtung',false],
    ['toggle-four-moons','Alle Monde',false],['orbit-visibility-btn','Umlaufbahn',true],
    ['orbit-contrast-btn','Kontrast',false]
  ]){
    const button=get(id);
    assert.ok(button.handler,`handler for ${id}`);
    assert.equal(button.attrs['aria-pressed'],String(defaultPressed),`${id} default`);
    button.handler();
    assert.equal(button.attrs['aria-pressed'],String(!defaultPressed),`${id} after click`);
    assert.match(notices.at(-1),new RegExp('^'+label+': '),`${id} toast`);
    assert.match(button.title,/(An|Aus)/,`${id} title`);
    button.handler();
    assert.equal(button.attrs['aria-pressed'],String(defaultPressed),`${id} restored`);
  }
  assert.equal(get('orbit-colors-btn').handler,null,'colors toggle cannot be clicked');
  assert.equal(notices.length,10);
  assert.equal(solar.labels,true);
  assert.equal(solar.lighting,'optimized');
  assert.equal(solar.fourMoons,true);
  assert.equal(solar.orbits,true);
  assert.equal(solar.orbitContrast,false);
});
