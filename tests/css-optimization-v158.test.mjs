import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf8');

test('v158: shared control palette and focus rings are defined and consumed as design tokens',async()=>{
  const css=await read('css/styles.css');
  const root=css.match(/^:root\{([^}]+)\}/)?.[1];
  assert.ok(root);
  for(const name of [
    'accent','control-bg','control-bg-hover','control-border','control-border-hover',
    'control-text','focus-ring','focus-ring-secondary','focus-ring-muted','speed-thumb-shadow'
  ]){
    assert.match(root,new RegExp(`--${name}:`));
    assert.ok(css.includes(`var(--${name})`),`${name} must be used outside :root`);
  }
  assert.match(root,/--focus-ring:2px solid #e8b778/);
  assert.match(root,/--focus-ring-secondary:2px solid #dfb77d/);
  assert.match(root,/--focus-ring-muted:2px solid #d9b587/);
});

test('v158: redundant AR/Cinema styling and the Earth reference duplicate stay consolidated',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel \.ar-mode-button, \.viewport>\.control-panel \.cinema-button\{height:54px/);
  assert.match(css,/\.viewport>\.control-panel \.ar-mode-button\{min-width:0\}/);
  assert.match(css,/\.viewport>\.control-panel \.ar-mode-button\.active\{/);
  assert.match(css,/\.viewport>\.control-panel \.cinema-button\.active\{/);
  assert.match(css,/\.hero-size-label-reference\{background:#528ccf;color:#eff7ff\}/);
  assert.doesNotMatch(css,/\.hero-size-label-reference\.is-earth\{/);
  assert.match(css,/\.hero-size-label-reference\.is-moon\{background:#c9b395/);
});

test('v158: speed sliders share vendor-specific CSS but keep individually variable track fill',async()=>{
  const css=await read('css/styles.css');
  const first='.control-panel .time-panel .vertical-speed-control #speed';
  const second='.layer-speed-rail #layer-speed';
  const inputRule=css.match(/\.control-panel \.time-panel \.vertical-speed-control #speed, \.layer-speed-rail #layer-speed\{([^}]+)\}/)?.[1];
  assert.ok(inputRule,'both inputs share the dynamic track token');
  assert.match(inputRule,/--speed-track-bg:linear-gradient\(to right/);
  assert.match(inputRule,/var\(--speed-fill\) var\(--speed-progress\)/);
  assert.match(inputRule,/var\(--speed-empty\) var\(--speed-progress\)/);
  for(const suffix of ['::-webkit-slider-runnable-track','::-moz-range-track','::-webkit-slider-thumb','::-moz-range-thumb']){
    assert.ok(css.includes(`${first}${suffix}, ${second}${suffix}{`),`${suffix} is shared only with the same vendor`);
  }
  assert.equal((css.match(/background:var\(--speed-track-bg\)/g)||[]).length,2);
  assert.equal((css.match(/box-shadow:var\(--speed-thumb-shadow\)/g)||[]).length,2);
  assert.doesNotMatch(css,/:root\{[^}]*--speed-track-bg:/,'dynamic track property must not resolve at :root');
});
