import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=async name=>readFile(new URL('../'+name,import.meta.url),'utf8');

test('v59: all layer-popover widths agree on 155px and keep viewport limits',async()=>{
  const css=await read('css/styles.css');
  const widths=[...css.matchAll(/(?:\.viewport>\.control-panel |\.control-panel )?\.layer-popover\{[^}]*?width:(\d+)px/g)].map(m=>Number(m[1]));
  assert.ok(widths.length>=2,'retained styles must agree on one width');
  assert.ok(widths.every(w=>w===155),`conflicting widths: ${widths.join(', ')}`);
  const final=css;
  assert.match(final,/\.viewport>\.control-panel \.layer-popover\{\s*width:155px;max-width:calc\(100vw - 20px\)/);
  assert.match(final,/\.viewport>\.control-panel \.layer-display-toggles\{\s*display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
});
