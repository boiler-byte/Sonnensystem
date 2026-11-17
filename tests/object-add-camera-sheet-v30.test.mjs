import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v30: Objekt hinzufügen is removed from both desktop catalog and mobile sheet',async()=>{
  const html=await read('index.html'),app=await read('src/app.js'),css=await read('css/styles.css');
  for(const removed of ['OBJEKT HINZUFÜGEN','id="asteroid-form"','id="asteroid-name"','class="catalog-bottom"'])
    assert.equal(html.includes(removed),false,`${removed} should be absent`);
  assert.doesNotMatch(app,/\$\('asteroid-form'\)|\$\('asteroid-name'\)/);
  assert.doesNotMatch(css,/\.catalog-bottom\{|\.add-form\{/);
  assert.match(app,/if\(body\.type==='asteroid'&&!body\.sbdbLoaded\)loadAsteroid\(body\.name,body\)/,
    'catalog asteroid auto-enrichment still works');
  assert.match(html,/id="detail-index"/);
  assert.match(html,/id="object-list"/);
});

test('v30: camera control mirrors sheet height at every snap and during pointer drag',async()=>{
  const sheet=await read('src/ui/bottom-sheet.js'),css=await read('css/styles.css');
  assert.match(sheet,/const cameraActions = \$\('reset-camera'\)\.parentElement/);
  assert.match(sheet,/cameraActions\.style\.setProperty\('--sheet-visible',height\)/);
  assert.match(sheet,/cameraActions\.inert=mobile\(\)&&next==='full'/);
  assert.match(sheet,/cameraActions\.classList\.add\('sheet-dragging'\)/);
  assert.match(sheet,/cameraActions\.classList\.remove\('sheet-dragging'\)/);
  assert.match(css,/bottom:calc\(var\(--sheet-visible,52px\) \+ max\(12px,env\(safe-area-inset-bottom\)\)\)/);
  assert.match(css,/\.viewport-actions\.sheet-dragging\{transition:none\}/);
});
