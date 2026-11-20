import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
const js=await readFile(new URL('../src/ui/bottom-sheet.js',import.meta.url),'utf8');
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');

test('v89: mobile Cinema timeline touches the dynamic sheet edge and overlays both camera actions',()=>{
  assert.match(css,/@media\(max-width:770px\)[\s\S]*?\.viewport>\.cinema-timeline\{left:12px;right:12px;bottom:var\(--sheet-visible,45px\);z-index:37;padding:9px 12px 10px;transition:bottom \.28s cubic-bezier\(\.22,\.82,\.24,1\)\}/,'specific mobile Cinema rule exists');
  assert.doesNotMatch(css,/131px/,'fixed bottom offset must no longer be used');
  assert.match(css,/\.viewport-actions\{z-index:36\}/,'camera controls stay below Cinema');
  assert.match(css,/\.mobile-sheet\{--sheet-visible:45px;[^}]*z-index:40;/,'sheet itself stays above Cinema');
  assert.match(css,/\.viewport>\.cinema-timeline\.sheet-dragging\{transition:none\}/,'timeline tracks finger dragging immediately');
  assert.match(css,/@media\(max-width:770px\) and \(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.viewport>\.cinema-timeline\{transition:none\}/);
});

test('v89: sheet controller mirrors its height and drag state to the timeline',()=>{
  assert.match(js,/const cinemaTimeline = \$\('cinema-timeline'\)/);
  assert.match(js,/cinemaTimeline\?\.style\.setProperty\('--sheet-visible',height\)/);
  assert.match(js,/cinemaTimeline\?\.classList\.add\('sheet-dragging'\)/);
  assert.match(js,/cinemaTimeline\?\.classList\.remove\('sheet-dragging'\)/);
  assert.match(html,/id="cinema-timeline"[\s\S]*id="cinema-play-pause"[\s\S]*id="cinema-speed-toggle"[\s\S]*id="cinema-seek"/);
});
