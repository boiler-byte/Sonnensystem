import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {layerEnabled,layerPreset,updateLayerSelection} from '../src/data/layers.js';
import {drawSolarSystemScene,solarOrbitBodies} from '../src/renderer/solar-view.js';
import {layoutSceneLabels,solarMoonLabelIds} from '../src/renderer/labels.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const IDENTITY=new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

test('v22: topbar removed; the same catalog and details panels use desktop tabs and mobile sheet',async()=>{
  const html=await read('index.html');
  const css=await read('css/styles.css');
  const sheet=await read('src/ui/bottom-sheet.js');
  const help=await read('docs/HILFE.md');
  assert.doesNotMatch(html,/<header[^>]*class="topbar"/);
  assert.match(html,/<main class="shell">\s*<aside class="sidebar"/);
  assert.deepEqual([...html.matchAll(/data-sidebar-panel="(catalog|detail)"/g)].map(x=>x[1]),['catalog','detail']);
  assert.deepEqual([...html.matchAll(/data-sheet-panel="(catalog|detail)"/g)].map(x=>x[1]),['catalog','detail']);
  assert.equal((html.match(/id="catalog"/g)||[]).length,1);
  assert.equal((html.match(/id="detail"/g)||[]).length,1);
  assert.doesNotMatch(html,/id="help-btn"/,'obsolete help button is gone');
  assert.equal((html.match(/id="reset-camera"/g)||[]).length,1,'camera reset remains reachable without the topbar');
  assert.match(css,/\.sidebar-content>\[hidden\]\{display:none!important\}/);
  assert.match(css,/\.shell>\.sidebar\{display:none!important\}/);
  assert.match(sheet,/const allTabs=\[\.\.\.desktopTabs,\.\.\.mobileTabs\]/);
  assert.match(sheet,/function showPanel\(next\)/);
  assert.match(sheet,/btn\.addEventListener\('keydown'/);
  for(const phrase of ['Navigation','Zeitreise','Live-Daten','Darstellungsoptionen'])assert.match(help,new RegExp(phrase));
});

test('v22: the solar overview draws every enabled Sun-centered orbit, not only selected objects',()=>{
  const standard=solarOrbitBodies(INITIAL_BODIES,layerPreset('standard'));
  assert.equal(standard.length,8);
  assert.ok(standard.every(x=>x.type==='planet'));
  const all=solarOrbitBodies(INITIAL_BODIES,layerPreset('all'));
  const eligible=INITIAL_BODIES.filter(b=>b.parentId==='sun' &&
    ['planet','dwarf','tno','asteroid','binary','comet'].includes(b.type) && b.a>0 && b.periodDays>0);
  assert.deepEqual(all.map(b=>b.id),eligible.map(b=>b.id));
  assert.ok(all.some(b=>b.id==='eris'),'distant nonselected dwarf orbit is included');
  assert.ok(all.some(b=>b.id==='juno'),'unselected asteroid orbit is included');
  assert.ok(all.some(b=>b.id==='halley'),'unselected comet orbit is included');
  assert.ok(!all.some(b=>b.type==='moon'||b.type==='satellite'),'local planet orbits do not become fake solar rings');
  const noComets=updateLayerSelection(layerPreset('all'),'comet',false);
  assert.ok(solarOrbitBodies(INITIAL_BODIES,noComets).every(b=>b.type!=='comet'));

  const calls=[];
  const renderer={
    bodies:INITIAL_BODIES,byId:new Map(INITIAL_BODIES.map(b=>[b.id,b])),
    gl:{depthMask:()=>{}},glow:{style:{}},width:1000,height:640,
    positions:new Map(INITIAL_BODIES.map(b=>[b.id,[0,0,0]])),
    camera:{dist:47},
    shouldDraw(b){return layerEnabled(this.settings.layers,b.type)&&b.type!=='probe';},
    orbitLine(b,center,vp,alpha,selected){calls.push({id:b.id,center,alpha,selected});},
    drawSphere(){},drawRings(){},drawLabels(){}
  };
  renderer.settings={orbits:true,layers:layerPreset('all')};
  drawSolarSystemScene(renderer,'earth',renderer.settings,IDENTITY);
  assert.deepEqual(calls.map(c=>c.id),[...all.map(b=>b.id),'dimorphos']);
  assert.ok(calls.every(c=>c.center.every(n=>n===0)), 'all overview orbit origins are solar');
  assert.ok(calls.find(c=>c.id==='earth').selected);
  calls.length=0;
  renderer.settings.orbits=false;
  drawSolarSystemScene(renderer,'earth',renderer.settings,IDENTITY);
  assert.equal(calls.length,0,'orbit switch hides all orbits');
});

test('v22: per-planet moon labels use the four largest and reserve one slot for selection',()=>{
  const candidates=INITIAL_BODIES.filter(b=>b.type==='moon'&&b.parentId==='jupiter')
    .sort((a,b)=>b.radiusKm-a.radiusKm||a.id.localeCompare(b.id));
  assert.ok(candidates.length>5);
  const normals=solarMoonLabelIds(INITIAL_BODIES,'earth');
  assert.deepEqual(candidates.filter(b=>normals.has(b.id)).map(b=>b.id),candidates.slice(0,4).map(b=>b.id));
  const small=candidates.at(-1);
  const selected=solarMoonLabelIds(INITIAL_BODIES,small.id);
  assert.equal(candidates.filter(b=>selected.has(b.id)).length,4);
  assert.ok(selected.has(small.id));
  assert.ok(selected.has(candidates[0].id));
  assert.ok(!selected.has(candidates[3].id),'smaller selected moon displaces the fourth-largest');
  for(const planet of ['earth','mars','jupiter','saturn','uranus','neptune','pluto']) {
    assert.ok(INITIAL_BODIES.filter(b=>b.type==='moon'&&b.parentId===planet&&selected.has(b.id)).length<=4,planet);
  }
  // The label renderer must consume the cap, not just expose a standalone helper.
  const ctx={font:'',measureText:text=>({width:text.length*7})};
  const renderer={width:1150,height:850,planetId:null,settings:{labels:true},selectedId:'earth',
    rendered:candidates,positions:new Map(candidates.map((b,i)=>[b.id,[i*.1,0,0]]))};
  const labels=layoutSceneLabels(renderer,IDENTITY,ctx,0);
  assert.ok(labels.every(label=>normals.has(label.body.id)));
  assert.ok(labels.length<=4);
});
