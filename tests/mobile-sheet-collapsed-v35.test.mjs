import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v35: collapsed mobile sheet exposes 45 px and camera follows its edge',async()=>{
  const [css,js]=await Promise.all([read('css/styles.css'),read('src/ui/bottom-sheet.js')]);
  assert.match(css,/\.sheet-tabs\{height:44px;/);
  assert.match(css,/\.sheet-header\{[^}]*border-bottom:1px solid/);
  assert.match(css,/\.mobile-sheet\{--sheet-visible:45px/);
  assert.match(css,/height:var\(--sheet-visible,45px\)!important/);
  assert.match(css,/bottom:calc\(var\(--sheet-visible,45px\) \+ max\(12px,env\(safe-area-inset-bottom\)\)\)/);
  assert.match(js,/const closed=header\.getBoundingClientRect\(\)\.height/);
  assert.match(js,/setVisibleHeight\(visible\)/);
  assert.match(js,/cameraActions\.style\.setProperty\('--sheet-visible',height\)/);
  assert.match(js,/const visible=levels\(\)\[next\]/);
});
