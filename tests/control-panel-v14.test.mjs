import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8');

const extract=(text,start,end)=>{
  const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,`Failed to extract ${start} ... ${end}`);
  return text.slice(a,b);
};

test('v14: desktop toolbar uses the original control IDs, vertically ordered time actions and SVG-only scene tools',async()=>{
  const html=await read('index.html');
  const panel=extract(html,'id="view-mode-status"','id="mobile-overview"');
  const controls=extract(panel,'id="time-panel"','class="scene-tools"');
  const scenes=extract(panel,'class="scene-tools"','</div>');
  const ids=['play-btn','speed-btn','today-btn'];
  assert.ok(ids.map(id=>controls.indexOf(`id="${id}"`)).every((pos,i,all)=>pos>=0&&(i===0||all[i-1]<pos)), 'Time controls are ordered play, speed, today');
  assert.equal((scenes.match(/<svg /g)||[]).length,3,'All three scene buttons have SVG illustrations');
  for(const id of ['toggle-orbits','toggle-labels','reset-camera']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} must not be duplicated`);
    assert.match(scenes,new RegExp(`<button[^>]*id="${id}"[^>]*aria-label="[^"]+"`));
  }
  assert.doesNotMatch(scenes,/<span>Bahnen|<span>Namen|<span>Übersicht/,'No scene text labels');
  assert.match(html,/data-sheet-panel="control" aria-controls="view-mode-status"/);
  assert.doesNotMatch(html,/data-sheet-panel="time"/);
  const css=await read('css/styles.css');
  assert.match(css,/width:110px;max-width:calc\(100% - 24px\)/);
  assert.match(css,/\.control-panel \.time-panel \.timeline-controls\{\s*display:grid;grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.scene-tool svg\{/);
});

test('v14: mobile tab receives all controls, while only a single floating overview button remains on stage',async()=>{
  const html=await read('index.html');
  const sheet=await read('src/ui/bottom-sheet.js');
  const css=await read('css/styles.css');
  assert.match(html,/id="mobile-overview"/);
  assert.match(sheet,/control:\$\('view-mode-status'\)/);
  assert.match(sheet,/mobileOverview\.append\(overview\)/);
  assert.match(sheet,/overviewAnchor\.parentNode\.insertBefore\(overview,overviewAnchor\.nextSibling\)/);
  assert.match(sheet,/mobileOverview\.style\.setProperty\('--sheet-overlay-visible'/);
  assert.match(sheet,/mobileOverview\.classList\.add\('dragging'\)/);
  assert.match(sheet,/if\(next!=='control'\)/);
  assert.match(sheet,/function expand\(\)\{if\(mobile\(\)\)snapTo\('full'\)/);
  assert.match(css,/\.viewport>\.control-panel\{display:none!important\}/);
  assert.match(css,/\.sheet-content>\.control-panel\{/);
  assert.match(css,/\.mobile-overview\{/);
  assert.match(css,/bottom:calc\(var\(--sheet-overlay-visible,72px\) \+ 14px\)/);
  assert.match(css,/\.sheet-content>\.control-panel \.timeline-controls\{\s*display:grid;grid-template-columns:minmax\(0,1fr\)/);
  assert.doesNotMatch(html,/id="time-panel"[\s\S]*?data-sheet-panel="time"/);
});

test('v14: renderer and timeline retain existing behavior and cache is invalidated',async()=>{
  const app=await read('src/app.js');
  const sw=await read('sw.js');
  const pkg=JSON.parse(await read('package.json'));
  assert.equal(pkg.version,'16.0.0');
  assert.match(sw,/sonnensystem-shell-v16/);
  for(const id of ['toggle-orbits','toggle-labels','reset-camera','play-btn','speed-btn','today-btn','view-mode-select'])
    assert.match(app,new RegExp(`\\$\\('${id}'\\)\\.addEventListener\\(`));
  assert.match(app,/mobileSheets\?\.close\(\)/);
  assert.match(app,/S\.time=Date\.now\(\)/);
  assert.match(app,/mobileSheets\?\.expand\(\)/);
});
