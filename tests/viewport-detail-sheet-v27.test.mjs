import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {detailNavigation,renderDetail} from '../src/ui/object-details.js';

const read=path=>readProjectSource(path);

test('v124: viewport reset is bottom-right and toolbar has one Layer dropdown',async()=>{
  const [css,html]=await Promise.all([read('css/styles.css'),read('index.html')]);
  assert.match(css,/\.viewport>\.control-panel,[^\n]*\{[^\n]*width:max-content!important/);
  assert.match(css,/padding:0!important;border:0!important;background:none!important/);
  assert.match(css,/box-shadow:none!important;backdrop-filter:none!important/);
  assert.match(css,/\.viewport-actions\{\s*top:auto!important;bottom:max\(16px/);
  assert.match(css,/\.viewport-actions\{\s*bottom:calc\(var\(--sheet-visible,45px\)/);
  const layer=html.split('class="layer-button"')[1].split('</button>')[0];
  assert.match(layer,/<svg[^>]+viewBox=/);
  assert.doesNotMatch(layer,/layer-chevron|⌄/);
  assert.doesNotMatch(html,/time-trigger-chevron|id="speed-btn"|id="time-panel"/);
  assert.match(html,/id="layer-speed-value" for="layer-speed"/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{width:155px/);
});

test('v27: detail index cycles across objects of the same category and wraps around',()=>{
  const planets=INITIAL_BODIES.filter(b=>b.type==='planet');
  assert.ok(planets.length>=8);
  const first=detailNavigation({bodies:INITIAL_BODIES,selected:planets[0].id});
  assert.equal(first.label,`01 / ${String(planets.length).padStart(2,'0')}`);
  assert.equal(first.nextId,planets[1].id);
  assert.equal(first.previousId,planets.at(-1).id);
  const last=detailNavigation({bodies:INITIAL_BODIES,selected:planets.at(-1).id});
  assert.equal(last.nextId,planets[0].id);
  assert.equal(last.previousId,planets.at(-2).id);
  const moons=INITIAL_BODIES.filter(b=>b.type==='moon');
  const moonNav=detailNavigation({bodies:INITIAL_BODIES,selected:moons[0].id});
  assert.equal(moonNav.nextId,moons[1].id);
  assert.equal(moonNav.label,`01 / ${String(moons.length).padStart(2,'0')}`);
  assert.notEqual(moonNav.nextId,planets[0].id);
  const star=detailNavigation({bodies:INITIAL_BODIES,selected:'sun'});
  assert.equal(star.label,'01 / 01');
  assert.equal(star.nextId,null);
  assert.equal(star.previousId,null);
  assert.deepEqual(detailNavigation({bodies:INITIAL_BODIES,selected:null}),{label:'— / —',previousId:null,nextId:null});
});

test('v27: rendering the detail index synchronizes the navigation buttons, including no selection',async()=>{
  const original=globalThis.document;
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id))elements.set(id,{
      disabled:false,innerHTML:'',textContent:'',style:{setProperty(){}},
      classList:{toggle(){}},setAttribute(){},querySelectorAll(){return []}
    });
    return elements.get(id);
  };
  globalThis.document={getElementById:get};
  const render=selected=>renderDetail({bodies:INITIAL_BODIES,selected},{planetId:null,overrides:new Map()},()=>{});
  try{
    render('earth');
    assert.equal(get('detail-prev').disabled,false);
    assert.equal(get('detail-next').disabled,false);
    assert.match(get('detail-index').textContent,/\d+ \/ \d+/);
    render('sun');
    assert.equal(get('detail-index').textContent,'01 / 01');
    assert.equal(get('detail-prev').disabled,true);
    assert.equal(get('detail-next').disabled,true);
    render(null);
    assert.equal(get('detail-index').textContent,'— / —');
    assert.equal(get('detail-prev').disabled,true);
    assert.equal(get('detail-next').disabled,true);
  }finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
  const app=await read('src/app.js');
  const html=await read('index.html');
  assert.match(app,/\['detail-prev','previousId'\],\['detail-next','nextId'\]/);
  assert.match(app,/if\(target\)selectBody\(target,true\)/);
  assert.match(html,/id="detail-prev"[^>]+aria-label="Vorheriges Objekt derselben Kategorie"/);
  assert.match(html,/id="detail-next"[^>]+aria-label="Nächstes Objekt derselben Kategorie"/);
});

test('v27: mobile header replaces the handle and half-snap sizes its scrollport',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),sheet=await read('src/ui/bottom-sheet.js');
  assert.doesNotMatch(html,/class="sheet-handle"|id="sheet-handle"|class="sheet-grabber"/);
  assert.match(html,/class="sheet-header" id="sheet-header" role="group" tabindex="0"/);
  assert.match(sheet,/header\.addEventListener\('pointerdown'/);
  assert.match(sheet,/header\.addEventListener\('pointermove'/);
  assert.match(sheet,/header\.addEventListener\('click'/);
  assert.match(sheet,/header\.addEventListener\('keydown'/);
  assert.match(sheet,/const full=window\.innerHeight/);
  assert.doesNotMatch(sheet,/const full=sheet\.getBoundingClientRect\(\)\.height/);
  assert.match(css,/height:var\(--sheet-visible,45px\)!important;transform:none!important/);
  assert.match(css,/\.sheet-content\{flex:1;min-height:0;overflow:hidden\}/);
  assert.match(css,/\.sheet-content>\.catalog \.object-list,\s*\.sheet-content>\.detail \.detail-scroll\{/);
});
