import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';
import { renderDetail } from '../src/ui/object-details.js';
import { renderCatalog } from '../src/ui/object-list.js';
import { syncSceneMode } from '../src/ui/scene-mode.js';
import { syncControls } from '../src/ui/timeline.js';
import { changeStatus } from '../src/ui/status.js';
import { SolarRenderer } from '../src/renderer/index.js';

class MockEl {
  constructor(){this.events={};this.textContent='';this.innerHTML='';this.hidden=false;this.title='';this.attrs={};this.dataset={};this.value='';this.style={setProperty(){}};
    this.classes=new Set();this.classList={toggle:(c,yes)=>yes?this.classes.add(c):this.classes.delete(c)};}
  addEventListener(event,callback){(this.events[event]??=[]).push(callback);}
  setAttribute(n,v){this.attrs[n]=v;}
  getAttribute(n){return this.attrs[n];}
  querySelectorAll(){return [];}
}
test('local catalog retains curated planets, satellites and asteroid entries',()=>{
  const earth=INITIAL_BODIES.find(body=>body.id==='earth');
  assert.equal(earth.name,'Erde');
  assert.ok(earth.radiusKm>6000);
  assert.ok(INITIAL_BODIES.some(body=>body.type==='satellite'&&body.parentId==='earth'));
  assert.ok(INITIAL_BODIES.some(body=>body.type==='asteroid'&&body.a>0));
});

test('Planet details, overview and timeline retain v5 view semantics',()=>{
  const previous=globalThis.document;
  const el=new Map();const get=id=>{if(!el.has(id))el.set(id,new MockEl());return el.get(id);};
  globalThis.document={getElementById:get,querySelectorAll:()=>[]};
  try{
    const bodies=INITIAL_BODIES.map(b=>({...b}));
    const state={bodies,selected:'earth',filter:'all',search:'',playing:true,time:Date.UTC(2026,10,16),speed:10,status:{catalog:['ok','192 Objekte'],horizons:['idle','Auf Abruf']}};
    const renderer=Object.create(SolarRenderer.prototype);
    renderer.camera={theta:.63,phi:.99,dist:47,target:[0,0,0],desiredTarget:[0,0,0],desiredDist:47};
    renderer.width=1000;renderer.height=680;renderer.positions=new Map();renderer.overrides=new Map();
    renderer.planetId=null;renderer.simTime=state.time;renderer.setBodies(bodies);
    const select=(id)=>{state.selected=id;renderDetail(state,renderer,select);};
    renderCatalog(state,select);renderDetail(state,renderer,select);syncSceneMode(state,renderer);syncControls(state);
    assert.equal(get('planet-view-actions').hidden,false);
    assert.equal(get('planet-view-title').textContent,'Sonnensystem-Ansicht');
    assert.equal(get('planet-view-btn').getAttribute('aria-pressed'),'false');
    assert.equal(get('view-mode-status').getAttribute('aria-label'),'Control-Panel · Sonnensystem');
    assert.match(get('hero-body').getAttribute('aria-label'),/Erde/);
    assert.ok(renderer.showPlanetSystem('earth'));
    syncSceneMode(state,renderer);renderDetail(state,renderer,select);
    assert.equal(get('view-mode-status').getAttribute('aria-label'),'Control-Panel · Planet Erde');
    assert.equal(get('planet-view-btn').getAttribute('aria-pressed'),'true');
    select('moon');assert.equal(get('planet-view-actions').hidden,false);
    assert.equal(get('planet-view-title').textContent,'Erde-Ansicht');
    renderer.reset();syncSceneMode(state,renderer);
    assert.equal(get('view-mode-status').getAttribute('aria-label'),'Control-Panel · Sonnensystem');
    assert.equal(get('reset-camera').title,'Nächste Perspektive: Topdown');
    changeStatus(state.status,'horizons','offline','Kontakt fehlt');
    assert.match(get('source-status').innerHTML,/Kontakt fehlt/);
    assert.match(get('layer-sim-date').textContent,/^\d{2}\.\d{2}\.2026 \d{2}:\d{2}$/);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('App event wiring still exposes planet-view and overview actions',async()=>{
  const app=await readAppSource();
  assert.ok(app.includes("$('planet-view-btn').addEventListener('click'"));
  assert.ok(app.includes('nextDetailSceneId(selected,S.bodies,renderer.planetId)'));
  assert.ok(app.includes('openPlanetScene(parent.id)'));
  assert.ok(app.includes('const parent=center?.parentId'));
  assert.ok(app.includes("$('reset-camera').addEventListener('click'"));
  assert.ok(app.includes('renderer?.cycleCameraPerspective({keepPlanetScene:true});'));
  assert.ok(app.includes("$('back-to-solar').addEventListener('click'")); 
  assert.ok(app.includes('initMobileSheets()'));
});

test('Editorial sections are rendered separately and HTML is escaped',()=>{
  const previous=globalThis.document;
  const elements=new Map();
  const get=id=>{if(!elements.has(id))elements.set(id,new MockEl());return elements.get(id);};
  globalThis.document={getElementById:get,querySelectorAll:()=>[]};
  try{
    const bodies=INITIAL_BODIES.map(b=>({...b}));
    const earth=bodies.find(b=>b.id==='earth');
    earth.editorial={...earth.editorial,sections:[{heading:'Überblick',text:'Text <script>alert(1)</script>'}],
      references:[{title:'NASA <Earth>',url:'https://science.nasa.gov/earth/'}]};
    const state={bodies,selected:'earth'};
    renderDetail(state,null,()=>{});
    assert.equal(get('editorial-content').hidden,false);
    const markup=get('editorial-content').innerHTML;
    assert.match(markup,/Überblick/);
    assert.match(markup,/&lt;script&gt;/);
    assert.doesNotMatch(markup,/<script>/);
    assert.match(markup,/NASA &lt;Earth&gt;/);
    assert.match(markup,/noopener noreferrer/);
    // v8 supplies articles for every body: emulate an explicitly missing article.
    bodies.find(b=>b.id==='mars').editorial=undefined;
    state.selected='mars';
    renderDetail(state,null,()=>{});
    assert.equal(get('editorial-content').hidden,true,'No extra editorial content is hidden');
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
