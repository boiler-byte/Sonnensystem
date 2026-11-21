import {syncToggleState} from '../src/ui/control-state.js';
import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createViewSettings} from '../src/data/layers.js';
import {CATEGORY_COLORS,EARTH_ORBIT_COLOR} from '../src/data/bodies.js';
import {orbitAppearance} from '../src/renderer/orbits.js';
import {notify,notifyToggle} from '../src/ui/status.js';

const read=name=>readProjectSource(name);
const segment=(source,start,end)=>{
  const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Expected ordered markers: ${start} / ${end}`);
  return source.slice(a,b);
};

test('v96: three always-visible scale toggles; five icon-only Layer tools',async()=>{
 const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
 assert.doesNotMatch(html,/id="scale-popover"|id="scale-btn"/);
 const main=segment(html,'class="scale-main-controls"','id="layer-picker-wrap"');
 const layer=segment(html,'class="layer-display-toggles"','class="layer-speed-toggle"');
 const mainIds=[...main.matchAll(/<button[^>]*id="([a-z-]+)"/g)].map(x=>x[1]);
 assert.deepEqual(mainIds,['orbit-row-btn','scale-objects-btn','scale-orbits-btn']);
 const appearanceIds=[...layer.matchAll(/<button[^>]*id="([a-z-]+)"/g)].map(x=>x[1]);
 assert.deepEqual(appearanceIds,['toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-lighting','toggle-four-moons']);
 for(const id of [...mainIds,...appearanceIds]){
   const button=html.match(new RegExp(`<button[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];
   assert.match(button,/aria-pressed="(true|false)"/);assert.match(button,/<svg /);assert.match(button,/title="[^"]+"/);
 }
 assert.match(css,/\.layer-display-toggles\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(css,/\.layer-display-toggles \.scale-tool-toggle:nth-child\(4\)\{grid-column/);
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

test('v100: five icon toggles update state, aria-pressed and status snackbar',()=>{
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
  const syncOrbitControls=()=>{
    const mode=!S.settings.orbits?'off':S.settings.galacticMotion?'galactic':S.settings.orbitContrast?'contrast':'normal';
    const names={normal:'Umlaufbahn',contrast:'Umlaufbahn + Bahnkontrast',galactic:'Galaktische Bewegung',off:'Beides aus'};
    const next={normal:'contrast',contrast:'galactic',galactic:'off',off:'normal'}[mode];
    syncToggleState(get('orbit-visibility-btn'),mode!=='off',`${names[mode]}: ${mode==='off'?'Aus':'An'} (Nächster Modus: ${names[next]})`);
    get('orbit-visibility-btn').setAttribute('data-orbit-mode',mode);
  };
  const syncLabelControl=()=>{
    const mode=S.settings.labels==='points'?'points':S.settings.labels===false?'off':'labels';
    const name={labels:'An',points:'Planetenpunkt',off:'Aus'}[mode];
    const next={labels:'Planetenpunkt',points:'Aus',off:'An'}[mode];
    syncToggleState(get('toggle-labels'),mode!=='off',`Beschriftung: ${name} (nächster Modus: ${next})`);
    get('toggle-labels').setAttribute('data-label-mode',mode);
  };
  const syncLightingControl=()=>{const on=S.settings.lighting==='realistic';syncToggleState(get('toggle-lighting'),on,`Beleuchtung: ${on?'An (Realistisch)':'Aus (Optimiert)'} (zum Wechseln klicken)`);};
  const syncFourMoonsControl=()=>{const showAll=S.settings.fourMoons===false;syncToggleState(get('toggle-four-moons'),showAll,showAll?'Alle Monde: An (ohne Vierer-Begrenzung)':'Alle Monde: Aus (maximal vier Monde je Planet)');};
  const advanceOrbit=()=>{const mode=!S.settings.orbits?'off':S.settings.galacticMotion?'galactic':S.settings.orbitContrast?'contrast':'normal';const next={normal:'contrast',contrast:'galactic',galactic:'off',off:'normal'}[mode];S.settings.orbits=next!=='off';S.settings.orbitContrast=next==='contrast';S.settings.galacticMotion=next==='galactic';return next;};
  const notifyToggle=msg=>notices.push(msg);
  get('toggle-labels').addEventListener('click',()=>{S.settings.labels=S.settings.labels===true?'points':S.settings.labels==='points'?false:true;syncLabelControl();notifyToggle(`Beschriftung: ${S.settings.labels===true?'An':S.settings.labels==='points'?'Planetenpunkt':'Aus'}`);});
  syncLabelControl();
  get('orbit-visibility-btn').addEventListener('click',()=>{const mode=advanceOrbit();syncOrbitControls();notifyToggle({normal:'Umlaufbahn: An',contrast:'Umlaufbahn + Bahnkontrast: An',galactic:'Galaktische Bewegung: An',off:'Umlaufbahn und Bahnkontrast: Aus'}[mode]);});
  syncOrbitControls();
  get('toggle-lighting').addEventListener('click',()=>{S.settings.lighting=S.settings.lighting==='realistic'?'optimized':'realistic';syncLightingControl();notifyToggle(`Beleuchtung: ${S.settings.lighting==='realistic'?'An':'Aus'}`);});
  syncLightingControl();
  get('toggle-four-moons').addEventListener('click',()=>{S.settings.fourMoons=!S.settings.fourMoons;syncFourMoonsControl();notifyToggle(`Alle Monde: ${S.settings.fourMoons===false?'An':'Aus'}`);});
  syncFourMoonsControl();
  for(const [id,label,defaultPressed] of [['toggle-labels','Beschriftung',true],['orbit-visibility-btn','Umlaufbahn',true],['toggle-lighting','Beleuchtung',false],['toggle-four-moons','Alle Monde',false]]){
    const button=get(id);
    assert.ok(button.handler,`handler for ${id}`);
    assert.equal(button.attrs['aria-pressed'],String(defaultPressed),`${id} default`);
    if(id==='toggle-labels'){
      button.handler();
      assert.equal(solar.labels,'points');
      assert.equal(button.attrs['data-label-mode'],'points');
      assert.equal(button.attrs['aria-pressed'],'true');
      assert.match(button.title,/Planetenpunkt/);
      assert.match(notices.at(-1),/^Beschriftung: Planetenpunkt/);
      button.handler();
      assert.equal(solar.labels,false);
      assert.equal(button.attrs['aria-pressed'],'false');
      button.handler();
      assert.equal(solar.labels,true);
      assert.equal(button.attrs['aria-pressed'],'true');
    }else if(id==='orbit-visibility-btn'){
      button.handler();
      assert.equal(button.attrs['data-orbit-mode'],'contrast');
      assert.equal(button.attrs['aria-pressed'],'true');
      assert.equal(solar.orbitContrast,true);
      assert.match(notices.at(-1),/Umlaufbahn \+ Bahnkontrast: An/);
      button.handler();
      assert.equal(button.attrs['data-orbit-mode'],'galactic');
      assert.equal(button.attrs['aria-pressed'],'true');
      assert.equal(solar.galacticMotion,true);
      assert.equal(solar.orbitContrast,false);
      button.handler();
      assert.equal(button.attrs['data-orbit-mode'],'off');
      assert.equal(button.attrs['aria-pressed'],'false');
      assert.equal(solar.orbits,false);
      assert.equal(solar.orbitContrast,false);
      assert.equal(solar.galacticMotion,false);
      button.handler();
      assert.equal(button.attrs['data-orbit-mode'],'normal');
      assert.equal(button.attrs['aria-pressed'],'true');
      assert.equal(solar.orbits,true);
    }else{
      button.handler();
      assert.equal(button.attrs['aria-pressed'],String(!defaultPressed),`${id} after click`);
      assert.match(notices.at(-1),new RegExp('^'+label+': '),`${id} toast`);
      assert.match(button.title,/(An|Aus)/,`${id} title`);
      button.handler();
      assert.equal(button.attrs['aria-pressed'],String(defaultPressed),`${id} restored`);
    }
  }
  assert.equal(notices.length,11);
  assert.equal(solar.labels,true);
  assert.equal(solar.lighting,'optimized');
  assert.equal(solar.fourMoons,true);
  assert.equal(solar.orbits,true);
  assert.equal(solar.orbitContrast,false);
  assert.equal(solar.galacticMotion,false);
});

