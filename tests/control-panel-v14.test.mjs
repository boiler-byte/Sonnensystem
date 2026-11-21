import {readAppSource,readProjectSource} from './helpers/app-source.mjs';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=async file=>readProjectSource(file);

const extract=(text,start,end)=>{
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Failed to extract ${start} ... ${end}`);
  return text.slice(a,b);
};

test('v124: reset remains independent from integrated Layer time controls',async()=>{
  const html=await read('index.html');
  const panel=extract(html,'id="view-mode-status"','id="canvas-error"');
  const scenes=extract(html,'class="viewport-actions"','<canvas id="space"');
  const controls=extract(panel,'id="layer-speed-panel"','id="layer-sim-date"');
  const ids=['layer-speed','layer-play-btn','layer-today-btn'];
  assert.ok(ids.map(id=>controls.indexOf(`id="${id}"`)).every((pos,i,all)=>pos>=0&&(i===0||all[i-1]<pos)));
  assert.doesNotMatch(panel,/id="time-panel"|id="speed-popover"|id="speed-btn"/);
  const resetIconMarkup=scenes.slice(scenes.indexOf('id="reset-camera"'),scenes.indexOf('</button>',scenes.indexOf('id="reset-camera"')));
  assert.equal((resetIconMarkup.match(/<svg /g)||[]).length,4);
  assert.equal((html.match(/id="reset-camera"/g)||[]).length,1);
  assert.match(scenes,/<button[^>]*id="reset-camera"[^>]*aria-label="[^"]+"/);
  assert.doesNotMatch(panel,/class="scene-tools"|id="view-mode-select"/);
  assert.doesNotMatch(html,/data-sheet-panel="control"|data-sheet-panel="time"/);
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel,[^\n]*\{[^\n]*width:max-content!important/);
  assert.match(css,/\.layer-speed-caption\{/);
  assert.match(css,/\.viewport-actions \.camera-reset-button svg\{/);
});

test('v20: full control panel stays on the mobile viewport; sheet has only catalog and detail',async()=>{
  const html=await read('index.html');
  const sheet=await read('src/ui/bottom-sheet.js');
  const css=await read('css/styles.css');
  assert.doesNotMatch(html,/id="mobile-overview"|data-sheet-panel="control"/);
  assert.match(sheet,/const panels = \{catalog:\$\('catalog'\),detail:\$\('detail'\)\}/);
  assert.doesNotMatch(sheet,/mobileOverview|overviewAnchor|\.append\(overview\)/);
  assert.match(css,/\.viewport>\.control-panel\{\s*display:flex!important/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\{/);
  assert.match(css,/\.viewport-actions \.camera-reset-button\{/);
  assert.match(html,/id="reset-camera"/);
});

test('v14: renderer and timeline retain existing behavior and cache is invalidated',async()=>{
  const app=await read('src/app.js');
  const sw=await read('sw.js');
  const pkg=JSON.parse(await read('package.json'));
  for(const id of ['toggle-labels','reset-camera','layer-play-btn','layer-today-btn'])
    assert.match(app,new RegExp(`\\$\\('${id}'\\)\\.addEventListener\\(`));
  assert.match(app,/mobileSheets\?\.close\(\)/);
  assert.match(app,/S\.time=Date\.now\(\)/);
  assert.doesNotMatch(app,/mobileSheets\?\.expand\(\)/);
});
