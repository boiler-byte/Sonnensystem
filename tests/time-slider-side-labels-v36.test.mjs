import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v124: Layer speed range shows min/max labels beside vertical control',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const markup=html.slice(html.indexOf('class="layer-speed-layout"'),html.indexOf('class="layer-speed-actions"'));
  assert.match(markup,/class="layer-speed-rail"[\s\S]*?id="layer-speed"/);
  assert.match(markup,/id="layer-speed"[\s\S]*?class="layer-speed-bounds"[\s\S]*?id="layer-speed-max-label"[\s\S]*?id="layer-speed-min-label"/);
  assert.match(markup,/aria-orientation="vertical"/);
  assert.match(markup,/aria-describedby="layer-speed-min-label layer-speed-max-label"/);
  assert.match(css,/\.layer-speed-layout\{display:grid;grid-template-columns:42px minmax\(0,1fr\)/);
  assert.match(css,/\.layer-speed-rail\{position:relative;width:42px;height:190px/);
  assert.match(css,/\.layer-speed-bounds\{[^}]*height:174px/);
});

test('v124: speed control remains vertically scrollable inside Layer popover at low heights',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel \.layer-popover, \.viewport>\.control-panel \.time-panel \.speed-popover\{position:absolute;top:calc\(100% \+ 7px\)/);
  assert.match(css,/max-height:min\(75dvh,calc\(100dvh - 140px\)\);overflow-y:auto/);
});

