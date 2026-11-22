import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf8');

test('v159: detail tabs stick to the top of their own scroll container',async()=>{
  const [moduleCss,generatedCss,html]=await Promise.all([
    read('css/components/details.css'),read('css/styles.css'),read('index.html')
  ]);
  const selector=/\.detail-tabs\{([^}]+)\}/;
  for(const css of [moduleCss,generatedCss]){
    const declaration=css.match(selector)?.[1];
    assert.ok(declaration,'detail tabs have a base rule');
    assert.match(declaration,/(?:^|;)position:sticky(?:;|$)/);
    assert.match(declaration,/(?:^|;)top:0(?:;|$)/);
    assert.match(declaration,/(?:^|;)z-index:[1-9]\d*(?:;|$)/);
    assert.match(declaration,/(?:^|;)background:#[0-9a-f]{6}(?:;|$)/i,'opaque background masks scrolling content');
    assert.doesNotMatch(declaration,/position:(?:fixed|absolute)/);
    assert.match(css,/\.detail-scroll\{overflow:auto;/,'detail-scroll remains a native scroller');
  }
  const scrollStart=html.indexOf('<div class="detail-scroll" id="detail-scroll">');
  const tabsStart=html.indexOf('<div class="detail-tabs" role="tablist"');
  const firstPanel=html.indexOf('<div class="detail-tab-panel"',tabsStart);
  assert.ok(scrollStart!==-1&&scrollStart<tabsStart&&tabsStart<firstPanel,'sticky tabs remain in the scroll container before the tab panels');
  assert.match(html,/<button class="detail-tab active" id="detail-tab-daten"[^>]*role="tab"[^>]*aria-controls="detail-daten"/);
  assert.match(html,/<button class="detail-tab" id="detail-tab-wissen"[^>]*role="tab"[^>]*aria-controls="detail-wissen"/);
});

test('v159: desktop and mobile keep the same scroll container and sticky tabs',async()=>{
  const [sheetCss,sheetJs,generatedCss]=await Promise.all([
    read('css/components/bottom-sheet.css'),read('src/ui/bottom-sheet.js'),read('css/styles.css')
  ]);
  assert.match(sheetCss,/\.sheet-content>\.detail \.detail-scroll\{[^}]*overflow-y:auto/);
  assert.match(sheetJs,/content\.append\(el\)/,'existing detail element is moved into mobile sheet');
  assert.equal((generatedCss.match(/\.detail-tabs\{position:sticky;/g)||[]).length,1,'only one source of sticky tab styling');
});
