import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v36: speed end labels sit to the right of a 50px-longer vertical range',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const sliderMarkup=html.slice(html.indexOf('class="vertical-speed-control"'),html.indexOf('class="time-popover-actions"'));
  assert.match(sliderMarkup,/class="speed-slider-rail"[\s\S]*?id="speed"/);
  assert.match(sliderMarkup,/id="speed"[\s\S]*?class="speed-range-labels"[\s\S]*?id="speed-max-label"[\s\S]*?id="speed-min-label"/);
  assert.match(sliderMarkup,/aria-orientation="vertical"/);
  assert.match(sliderMarkup,/aria-describedby="speed-min-label speed-max-label"/);
  assert.match(css,/\.vertical-speed-control\{\s*height:auto;min-width:0;display:grid;\s*grid-template-columns:44px minmax\(0,1fr\)/);
  assert.match(css,/\.speed-slider-rail\{\s*position:relative;width:44px;height:200px/);
  assert.match(css,/\.vertical-speed-control #speed\{[\s\S]*?width:182px;min-width:182px;max-width:182px/);
  assert.match(css,/\.speed-range-labels\{[\s\S]*?height:182px;align-self:center/);
  assert.match(css,/\.speed-popover\{width:120px;min-width:120px/);
});

test('v36: compact low-height range is also 50px longer',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/@media\(max-height:690px\)\{[\s\S]*?\.speed-slider-rail\{height:166px\}/);
  assert.match(css,/@media\(max-height:690px\)\{[\s\S]*?#speed\{width:148px;min-width:148px;max-width:148px\}/);
  assert.match(css,/@media\(max-height:690px\)\{[\s\S]*?\.speed-range-labels\{height:148px\}/);
});
