import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

test('v131 disables browser double-tap page zoom across the touch UI', async () => {
  const css = await read('../css/styles.css');
  // Apply manipulation to every hit target, including controls in scroll containers;
  // targeting only html/body would not cover nested scrollable touch surfaces.
  assert.match(css, /\*\s*\{[^}]*touch-action\s*:\s*manipulation\s*;?[^}]*\}/);
  assert.match(css, /#space\s*\{[^}]*touch-action\s*:\s*none\s*;/);
  assert.match(css, /\.sheet-header\s*\{[^}]*touch-action\s*:\s*none\s*;/);
  assert.match(css, /\.sheet-content\s*>\s*\.detail\s+\.detail-hero\s*\{[^}]*touch-action\s*:\s*none\s*;/);
});

test('v131 keeps browser and app pinch gestures without disabling page accessibility', async () => {
  const html = await read('../index.html');
  const controls = await read('../src/renderer/controls.js');
  assert.doesNotMatch(html, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i);
  assert.match(controls, /renderer\.camera\.dist\*prev\.distance\/next\.distance/);
  assert.match(controls, /renderer\.camera\.desiredDist=dist/);
});
