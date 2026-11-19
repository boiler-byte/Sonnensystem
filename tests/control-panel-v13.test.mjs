import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {setDetailTab} from '../src/ui/object-details.js';
import {syncSceneMode} from '../src/ui/scene-mode.js';
const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function area(html, start, end) {
  const a=html.indexOf(start);assert.ok(a>=0,`${start} missing`);
  const b=html.indexOf(end,a+start.length);assert.ok(b>a,`${end} missing after ${start}`);
  return html.slice(a,b);
}

test('v26: control panel has no view selector; the camera reset is separate and time controls remain in their dropdown',async()=>{
  const html=await read('index.html');
  assert.doesNotMatch(html,/class="camera-hints"|class="catalog-intro"/);
  const controls=area(html,'id="view-mode-status"','id="canvas-error"');
  assert.doesNotMatch(html,/id="view-mode-select"|for="view-mode-select"/);
  assert.doesNotMatch(controls,/id="reset-camera"/);
  assert.match(html,/<div class="viewport-actions"[\s\S]*?<button class="icon-button camera-reset-button" id="reset-camera"/);
  assert.match(html,/data-perspective="oblique"/);
  assert.match(html,/data-perspective="topdown"/);
  assert.match(html,/data-perspective="side"/);
  for(const id of ['play-btn','speed-btn','today-btn','orbit-visibility-btn','orbit-contrast-btn','toggle-labels'])
    assert.match(controls,new RegExp(`id="${id}"`));
  const timeline=area(html,'id="time-panel"','id="canvas-error"');
  assert.equal((timeline.match(/<button\b[^>]*id="(?:speed-btn|play-btn|today-btn)"/g)||[]).length,3);
  const trigger=timeline.slice(0,timeline.indexOf('id="speed-popover"'));
  assert.equal((trigger.match(/<button\b/g)||[]).length,1,'one closed control');
  assert.doesNotMatch(trigger,/>Heute\s*</);
  assert.doesNotMatch(trigger,/>Geschwindigkeit\s*</);
  assert.match(timeline,/id="sim-date-label"/);
  assert.match(timeline,/id="sim-date-readout"/);
  assert.match(timeline,/id="today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.doesNotMatch(timeline,/<span>Heute<\/span>/);
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel\{position:absolute/);
  assert.match(css,/\.viewport>\.control-panel\{\s*width:58px!important/);
});

test('v13: detail name replaces section label, hero shows object type and origin, tabs separate knowledge/data',async()=>{
  const html=await read('index.html');
  const header=area(html,'<aside class="detail"','<div class="detail-scroll">');
  assert.match(header,/<h2 id="detail-name"/);
  assert.doesNotMatch(header,/02 \/ OBJEKTDETAILS/);
  const hero=area(html,'<div class="detail-hero">','<div id="planet-view-actions"');
  for(const id of ['detail-type','detail-origin','type-dot']) assert.match(hero,new RegExp(`id="${id}"`));
  assert.doesNotMatch(html,/class="object-type"/);
  const knowledge=area(html,'id="detail-wissen"','id="detail-daten"');
  assert.match(knowledge,/id="detail-description"/);
  assert.match(knowledge,/id="editorial-content"/);
  assert.doesNotMatch(knowledge,/id="stats-grid"/);
  const data=area(html,'id="detail-daten"','<\/aside>');
  assert.match(data,/id="stats-grid"/);
  assert.match(data,/id="orbit-facts"/);
  assert.match(data,/id="horizons-btn"/);
  assert.match(data,/class="detail-sources"/);
  const scroll=area(html,'class="detail-scroll"','<\/aside>');
  assert.match(scroll,/class="detail-sources"/,'sources must scroll with body');
  assert.match(html,/role="tablist"/);
  const css=await read('css/styles.css');
  assert.match(css,/\.detail-tab-panel\[hidden\]\{display:none!important\}/);
  assert.match(css,/\.detail-tab-panel \.detail-sources\{position:static/);
});

test('v13: detail tabs switch panels with correct ARIA selection and keyboard focus',()=>{
  const before=globalThis.document;
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:false,tabIndex:0,attributes:{},classes:new Set(),
      setAttribute(key,value){this.attributes[key]=value;},
      classList:{toggle(name,value){this.owner?.classes.add(name);}},
    });
    const node=nodes.get(id);
    node.classList.toggle=(name,value)=>{if(value)node.classes.add(name);else node.classes.delete(name);};
    return node;
  };
  globalThis.document={getElementById:get};
  try{
    setDetailTab('daten');
    assert.equal(get('detail-daten').hidden,false);
    assert.equal(get('detail-wissen').hidden,true);
    assert.equal(get('detail-tab-daten').attributes['aria-selected'],'true');
    assert.equal(get('detail-tab-wissen').tabIndex,-1);
    setDetailTab('wissen');
    assert.equal(get('detail-daten').hidden,true);
    assert.equal(get('detail-wissen').hidden,false);
    assert.equal(get('detail-tab-daten').attributes['aria-selected'],'false');
    assert.equal(get('detail-tab-wissen').tabIndex,0);
  }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});

test('v26: scene mode synchronizes accessible panel and reset controls without a select',()=>{
  const before=globalThis.document;
  const elements=new Map();
  globalThis.document={getElementById:id=>{
    if(!elements.has(id))elements.set(id,{textContent:'',value:'',attributes:{},classList:{toggle(){}},setAttribute(name,value){this.attributes[name]=value;}});
    return elements.get(id);
  }};
  try{
    const bodies=[{id:'earth',type:'planet',name:'Erde'}], state={bodies};
    syncSceneMode(state,{planetId:'earth'});
    assert.equal(elements.get('view-mode-status').attributes['aria-label'],'Control-Panel · Planet Erde');
    assert.equal(elements.get('reset-camera').attributes['aria-label'],'Kamera zurücksetzen');
    assert.equal(elements.get('back-to-solar').hidden,false);
    syncSceneMode(state,{planetId:null});
    assert.equal(elements.get('view-mode-status').attributes['aria-label'],'Control-Panel · Sonnensystem');
    assert.equal(elements.get('back-to-solar').hidden,true);
    assert.equal(elements.get('reset-camera').attributes['aria-label'],'Kamera zurücksetzen');
    assert.equal(elements.has('view-mode-select'),false);
  }finally{if(before===undefined)delete globalThis.document;else globalThis.document=before;}
});
