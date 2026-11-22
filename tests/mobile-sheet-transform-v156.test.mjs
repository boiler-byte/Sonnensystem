import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v156: sheet position animates independently of chart and scrollport geometry',async()=>{
  const [css,logic]=await Promise.all([read('css/styles.css'),read('src/ui/bottom-sheet.js')]);
  assert.match(css,/\.mobile-sheet\{height:100dvh!important;transform:translate3d\(0,calc\(100% - var\(--sheet-visible,45px\)\),0\)!important;transition:transform/);
  assert.match(css,/will-change:transform/);
  assert.match(css,/\.mobile-sheet\.dragging\{transition:none\}/);
  assert.doesNotMatch(css,/height:var\(--sheet-visible,45px\)!important/);
  assert.match(css,/\.sheet-content\{flex:0 0 var\(--sheet-content-height,0px\);min-height:0;overflow:hidden\}/);
  assert.match(logic,/sheet\.style\.setProperty\('--sheet-content-height',/);
  const move=logic.split('function moveDrag(id,y,preventDefault){')[1]?.split('function clearDrag(){')[0];
  assert.ok(move,'drag implementation found');
  assert.match(move,/setVisibleHeight\(clamp\(drag\.startVisible-dy,levels\(\)\.closed,levels\(\)\.full\)\)/);
  assert.doesNotMatch(move,/--sheet-content-height|renderDetail|showPanel|innerHTML|replaceChildren|\.append\(/,
    'Pointer movement updates sheet position, not its content/layout');
  const snap=logic.split('function snapTo(next,')[1]?.split('function showPanel(next){')[0];
  assert.match(snap,/--sheet-content-height/,'final snap may adapt the scrollport for the available visible area');
});

test('v156: size comparison reference circles do not load Earth/Moon background textures',async()=>{
  const [css,details]=await Promise.all([read('css/styles.css'),read('src/ui/object-details.js')]);
  assert.match(css,/\.hero-size-reference-circle\{[^}]*background-color:#528ccf;background-image:none/);
  assert.match(css,/\.hero-size-plot\.is-moon \.hero-size-reference-circle\{background-color:#c9b395\}/);
  assert.doesNotMatch(css,/--hero-size-reference-image|linear-gradient\(#c9b39580,#c9b39580\)/);
  assert.doesNotMatch(details,/--hero-size-reference-image|sizeReferenceTexturePath|textures\/mobile\/(?:earth|moon)\.webp/);
});
