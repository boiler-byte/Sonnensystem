import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';
import { clean, normalizeSolar, normalizeStation, formatAsteroid } from '../src/data/normalization.js';
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
test('Data normalization is isolated from the DOM and preserves existing metadata',()=>{
  assert.equal(clean('Érde'),'erde');
  const old=INITIAL_BODIES.find(b=>b.id==='earth');
  const fresh=normalizeSolar({bodyType:'Planet',isPlanet:true,id:'terre',englishName:'Earth',
    semimajorAxis:149597870.7,meanRadius:6371,sideralOrbit:365.25},id=>id==='earth'?old:null);
  assert.equal(fresh.id,'earth');assert.equal(fresh.name,'Erde');assert.equal(fresh.description,old.description);
  assert.equal(fresh.a,1);assert.equal(fresh.style,'earth');
  const satellite=normalizeStation({MEAN_MOTION:15.5,ECCENTRICITY:.0002,NORAD_CAT_ID:25544,EPOCH:'2026-11-16T12:00:00',OBJECT_NAME:'ISS'});
  assert.equal(satellite.type,'satellite');assert.equal(satellite.parentId,'earth');
  assert.ok(satellite.a>6371);
  const rock=formatAsteroid({orbit:{elements:[{name:'a',value:'1.5'},{name:'e',value:'.21'}]},phys_par:[]},'sbdb-rock','Rock',null);
  assert.equal(rock.a,1.5);assert.equal(rock.e,.21);assert.equal(rock.type,'asteroid');
});

test('Planet details, overview and timeline retain v5 view semantics',()=>{
  const previous=globalThis.document;
  const el=new Map();const get=id=>{if(!el.has(id))el.set(id,new MockEl());return el.get(id);};
  globalThis.document={getElementById:get,querySelectorAll:()=>[]};
  try{
    const bodies=INITIAL_BODIES.map(b=>({...b}));
    const state={bodies,selected:'earth',filter:'all',search:'',playing:true,time:Date.UTC(2026,10,16),speed:10,status:{solar:['ok','37 Objekte'],sbdb:['idle','Auf Abruf'],celestrak:['idle','Auf Abruf'],horizons:['idle','Auf Abruf']}};
    const renderer=Object.create(SolarRenderer.prototype);
    renderer.camera={theta:.63,phi:.99,dist:47,target:[0,0,0],desiredTarget:[0,0,0],desiredDist:47};
    renderer.width=1000;renderer.height=680;renderer.positions=new Map();renderer.overrides=new Map();
    renderer.planetId=null;renderer.simTime=state.time;renderer.setBodies(bodies);
    const select=(id)=>{state.selected=id;renderDetail(state,renderer,select);};
    renderCatalog(state,select);renderDetail(state,renderer,select);syncSceneMode(state,renderer);syncControls(state);
    assert.equal(get('planet-view-actions').hidden,false);
    assert.match(get('planet-view-subtitle').textContent,/1 Monde · 2 Satelliten/);
    assert.equal(get('planet-view-btn').getAttribute('aria-pressed'),'false');
    assert.equal(get('view-mode-status').getAttribute('aria-label'),'Control-Panel · Sonnensystem');
    assert.equal(get('detail-name').textContent,'Erde');
    assert.ok(renderer.showPlanetSystem('earth'));
    syncSceneMode(state,renderer);renderDetail(state,renderer,select);
    assert.equal(get('view-mode-status').getAttribute('aria-label'),'Control-Panel · Planet Erde');
    assert.equal(get('planet-view-btn').getAttribute('aria-pressed'),'true');
    select('moon');assert.equal(get('planet-view-actions').hidden,false);
    assert.match(get('planet-view-subtitle').textContent,/Erde · 1 Monde · 2 Satelliten/);
    renderer.reset();syncSceneMode(state,renderer);
    assert.equal(get('view-mode-status').getAttribute('aria-label'),'Control-Panel · Sonnensystem');
    assert.equal(get('reset-camera').title,'Kamera zurücksetzen');
    changeStatus(state.status,'solar','offline','Startdaten');
    assert.match(get('source-status').innerHTML,/Startdaten/);
    assert.match(get('sim-date-readout').textContent,/^\d{2}\.\d{2}\.2026\n\d{2}:\d{2}$/);
  }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('App event wiring still exposes planet-view and overview actions',async()=>{
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  assert.ok(app.includes("$('planet-view-btn').addEventListener('click'"));
  assert.ok(app.includes('openPlanetScene(center?.id)'));
  assert.ok(app.includes("selected?.type==='moon'?byId(selected.parentId):selected"));
  assert.ok(app.includes("$('reset-camera').addEventListener('click'"));
  assert.ok(app.includes('renderer?.cycleCameraPerspective();updateMode();updateDetail()'));
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
