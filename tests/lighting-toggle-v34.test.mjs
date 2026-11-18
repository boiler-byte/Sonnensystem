import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createViewSettings} from '../src/data/layers.js';

const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('v42: lighting defaults differ by scene; optimized and realistic still toggle',async()=>{
  const [html,source]=await Promise.all([read('index.html'),read('src/app.js')]);
  const start=html.indexOf('<button class="scale-tool-toggle" id="toggle-lighting"');
  assert.ok(start>0,'Lighting icon control is present');
  const lightingMarkup=html.slice(start,html.indexOf('</button>',start)+9);
  assert.match(lightingMarkup,/class="flashlight-icon"/);
  assert.doesNotMatch(lightingMarkup,/<span>Beleuchtung<\/span>/);
  assert.doesNotMatch(lightingMarkup, /class="[^"]*\bactive\b/);
  assert.match(lightingMarkup, /aria-pressed="false"/);
  assert.match(lightingMarkup, /aria-label="Beleuchtung"/);
  assert.doesNotMatch(lightingMarkup, /orbit-toggle-indicator/);

  const listener=source.match(/\$\('toggle-lighting'\)\.addEventListener\('click',\(\)=>\{[\s\S]*?\}\);\s*syncLightingControl\(\);/)?.[0];
  const begin=source.indexOf('function syncLightingControl(){');
  const end=source.indexOf('function syncFourMoonsControl(){',begin);
  assert.ok(begin>0 && end>begin && listener,'Lighting toggle sync and handler exist');
  const button={
    attrs:{}, classes:new Set(), title:'', handler:null,
    setAttribute(name,value){this.attrs[name]=value;},
    classList:{toggle(name,enabled){if(enabled)button.classes.add(name);else button.classes.delete(name);}},
    addEventListener(name,handler){assert.equal(name,'click');this.handler=handler;}
  };
  const solar=createViewSettings('solar'),planet=createViewSettings('planet');
  const S={settings:solar};
  const notices=[];
  const context=vm.createContext({S,$:()=>button,notifyToggle:msg=>notices.push(msg)});
  vm.runInContext(source.slice(begin,end)+listener+'\nthis.refresh=syncLightingControl;',context);
  const check=(mode,state,pressed)=>{
    assert.match(button.title,new RegExp(state));
    assert.equal(button.attrs['aria-pressed'],pressed);
    assert.equal(button.classes.has('active'),pressed==='true');
    assert.match(button.title,mode==='realistic'?/An \(Realistisch\)/:/Aus \(Optimiert\)/);
  };
  assert.equal(solar.lighting,'optimized');
  assert.equal(planet.lighting,'realistic');
  check('optimized','Aus','false');
  button.handler();
  assert.equal(solar.lighting,'realistic');
  check('realistic','An','true');
  assert.deepEqual(notices,['Beleuchtung: An (Realistisch)']);
  S.settings=planet;context.refresh();
  check('realistic','An','true');
  button.handler();
  assert.equal(planet.lighting,'optimized');
  check('optimized','Aus','false');
  button.handler();
  assert.equal(planet.lighting,'realistic');
  check('realistic','An','true');
  S.settings=solar;context.refresh();
  check('realistic','An','true');
  button.handler();
  assert.equal(solar.lighting,'optimized');
  check('optimized','Aus','false');
});
