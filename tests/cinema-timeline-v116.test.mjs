import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('v116: Cinema label and clock sit directly above the slider, after Play/Pause and 2x',async()=>{
  const html=await read('index.html');
  const timeline=html.slice(html.indexOf('<div class="cinema-timeline"'),html.indexOf('<div id="canvas-error"'));
  assert.match(timeline, /<div class="cinema-timeline-transport">[\s\S]*?id="cinema-play-pause"[\s\S]*?id="cinema-speed-toggle"[\s\S]*?<div class="cinema-timeline-track">\s*<div class="cinema-timeline-header"><span id="cinema-object">Cinema-Modus<\/span><output id="cinema-time" for="cinema-seek">00:00 \/ 00:00<\/output><\/div>\s*<input id="cinema-seek"[^>]*type="range"[^>]*\/>\s*<\/div>\s*<\/div>/);
  assert.doesNotMatch(timeline,/cinema-timeline-ends|cinema-start-label|cinema-end-label/);
  assert.match(timeline,/id="cinema-seek"[^>]*aria-label="Cinema-Zeitleiste – Position der Kamerafahrt"/);
});

test('v116: button tops align with header; slider bottom aligns with button bottoms',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.cinema-timeline-transport\{display:flex;align-items:stretch;gap:12px;min-width:0\}/);
  assert.match(css,/\.cinema-timeline-track\{[^}]*height:36px;display:flex;flex-direction:column;justify-content:space-between\}/);
  assert.match(css,/\.cinema-timeline-header\{[^}]*height:14px;line-height:14px;/);
  assert.match(css,/\.viewport>\.cinema-timeline \.cinema-timeline-track input\[type="range"\]\{[^}]*height:18px;margin:0;/);
  assert.match(css,/\.cinema-play-pause\{[^}]*height:36px;/);
  assert.doesNotMatch(css,/\.cinema-timeline-ends\{/);
  // The mobile position is still tied to the dynamic bottom-sheet edge.
  assert.match(css,/\.viewport>\.cinema-timeline\{left:12px;right:12px;bottom:var\(--sheet-visible,45px\);z-index:37;/);
});

test('v116: removed lower labels cannot be accessed during Cinema playback',async()=>{
  const [controls,handlers]=await Promise.all([read('src/app/animation-controls.js'),read('src/ui/event-handlers.js')]);
  assert.doesNotMatch(controls,/cinema-(start-label|end-label)/);
  assert.match(controls,/\$\('cinema-time'\)\.textContent=/);
  assert.match(controls,/\$\('cinema-object'\)\.textContent=/);
  assert.match(handlers,/seek\.addEventListener\('input',\(\)=>renderer\?\.seekCinema/);
});
