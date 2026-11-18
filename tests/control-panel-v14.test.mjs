import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8');

const extract=(text,start,end)=>{
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Failed to extract ${start} ... ${end}`);
  return text.slice(a,b);
};

test('v27: reset is separate from the compact control panel, with time controls in the dropdown',async()=>{
  const html=await read('index.html');
  const panel=extract(html,'id="view-mode-status"','id="canvas-error"');
  const controls=panel.slice(panel.indexOf('id="time-panel"'));
  const scenes=extract(html,'class="viewport-actions"','<canvas id="space"');
  const ids=['speed-btn','play-btn','today-btn'];
  assert.ok(ids.map(id=>controls.indexOf(`id="${id}"`)).every((pos,i,all)=>pos>=0&&(i===0||all[i-1]<pos)), 'A time trigger opens the playback and today actions');
  assert.equal((controls.slice(0,controls.indexOf('id="speed-popover"')).match(/<button\b/g)||[]).length,1);
  assert.equal((scenes.match(/<svg /g)||[]).length,1,'A zoom-out SVG is the separate reset action');
  for(const id of ['reset-camera']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} must not be duplicated`);
    assert.match(scenes,new RegExp(`<button[^>]*id="${id}"[^>]*aria-label="[^"]+"`));
  }
  assert.doesNotMatch(panel,/class="scene-tools"|id="view-mode-select"/,'No redundant panel tools or view dropdown');
  assert.doesNotMatch(html,/data-sheet-panel="control"/);
  assert.doesNotMatch(html,/data-sheet-panel="time"/);
  const css=await read('css/styles.css');
  assert.match(css,/width:58px!important;max-width:calc\(100% - 20px\)/);
  assert.match(css,/\.control-panel \.time-panel \.time-trigger\{/);
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
  assert.equal(pkg.version,'50.0.0');
  assert.match(sw,/sonnensystem-shell-v50/);
  for(const id of ['toggle-labels','reset-camera','play-btn','speed-btn','today-btn'])
    assert.match(app,new RegExp(`\\$\\('${id}'\\)\\.addEventListener\\(`));
  assert.match(app,/mobileSheets\?\.close\(\)/);
  assert.match(app,/S\.time=Date\.now\(\)/);
  assert.doesNotMatch(app,/mobileSheets\?\.expand\(\)/);
});
