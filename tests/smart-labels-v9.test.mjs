import assert from 'node:assert/strict';
import {test} from 'node:test';
import {drawSceneLabels, layoutSceneLabels} from '../src/renderer/labels.js';

// Perspective with a constant positive clip depth: world +/-1 maps to the viewport.
const VP = new Float32Array([
  20, 0, 0, 0,
  0, 20, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 20
]);
const body = (id, type = 'moon', radiusKm = 200) =>
  ({id, name: id, type, radiusKm});
function context() {
  const calls = [];
  return {
    calls, font: '',
    measureText: text => ({width: text.length * 7}),
    setTransform: (...args) => calls.push(['transform', ...args]),
    clearRect: (...args) => calls.push(['clear', ...args]),
    strokeText: (...args) => calls.push(['strokeText', ...args]),
    fillText: (...args) => calls.push(['fillText', ...args]),
    beginPath() {}, arc: (...args) => calls.push(['arc', ...args]),
    fill() {}, stroke() {}
  };
}
function scene(bodies, positions, options = {}) {
  const ctx = context();
  return {
    ctx,
    renderer: {
      width: options.width || 640, height: options.height || 420, dpr: 1.5,
      labels: {getContext: () => ctx}, settings: {labels: true},
      selectedId: options.selectedId || bodies[0].id,
      planetId: options.planetId ?? null, rendered: bodies,
      positions: new Map(bodies.map((b, i) => [b.id, positions[i]]))
    }
  };
}
const overlaps = (a, b) =>
  a.x < b.x + b.w + 5 && a.x + a.w + 5 > b.x &&
  a.y < b.y + b.h + 5 && a.y + a.h + 5 > b.y;

test('v83: dense clusters keep every label in solar and planet views', () => {
  for (const planetId of [null, 'jupiter']) {
    const bodies = Array.from({length: 16}, (_, i) => body(`moon-${i}`, 'moon', 100 + i * 50));
    const {renderer, ctx} = scene(bodies, bodies.map(() => [0, 0, 0]),
      {planetId, selectedId: 'moon-15'});
    renderer.settings.fourMoons=false; // all moons explicitly enabled, including in the solar overview
    const labels = layoutSceneLabels(renderer, VP, ctx, 0);
    assert.equal(labels.length, bodies.length, 'all 16 coincident labels must be retained');
    assert.deepEqual(new Set(labels.map(l => l.body.id)),new Set(bodies.map(b => b.id)));
    assert.equal(labels.at(-1).body.id, 'moon-15', 'selected label is drawn last and stays readable');
    assert.ok(overlaps(labels[0].rect,labels[1].rect), 'text collisions are allowed');
    assert.equal(renderer.rendered.length, 16, 'all bodies still rendered');
  }
});

test('v9: tries alternative sides when near the viewport edge and honors bounds', () => {
  const b = body('edge', 'planet', 6400);
  const {renderer, ctx} = scene([b], [[.94, 0, 0]]);
  const [label] = layoutSceneLabels(renderer, VP, ctx, 0);
  assert.ok(label, 'label can be placed despite a right-side obstruction');
  assert.equal(label.side, 'left');
  assert.ok(label.rect.x >= 8 && label.rect.x + label.rect.w <= renderer.width - 8);
});

test('v16: a passing disk does not move or suppress a neighboring label', () => {
  const objects = [body('earth', 'planet', 6371), body('moon', 'moon', 1700)];
  const {renderer, ctx} = scene(objects, [[.17, 0, 0], [0, 0, 0]], {selectedId: 'moon'});
  const labels = layoutSceneLabels(renderer, VP, ctx, 0);
  assert.ok(labels.some(l => l.body.id === 'moon'));
  const side = labels.find(l=>l.body.id==='moon').side;
  renderer.positions.set('earth',[0,0,0]);
  const later=layoutSceneLabels(renderer,VP,ctx,500);
  assert.equal(later.find(l=>l.body.id==='moon').side,side);
});

test('v85: nonselected labels remain visible during rapid camera/body motion and immediately afterward', () => {
  const b = body('fast', 'moon');
  const {renderer, ctx} = scene([b], [[-.5, 0, 0]], {planetId: 'earth', selectedId: 'earth'});
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 0).length, 1);
  renderer.positions.set('fast', [.5, 0, 0]);
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 16).length, 1,
    'rapid movement no longer hides a nonselected label');
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 32).length, 1,
    'no settling delay before label is visible');
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 170).length, 1);
  assert.ok(renderer._labelState.observations.has('fast'),
    'v86 samples orbital displacement without treating camera motion alone as velocity');
});

test('v85: 240 Hz frame-to-frame movement does not hide labels', () => {
  const b = body('fast-240hz', 'moon');
  const {renderer, ctx} = scene([b], [[0, 0, 0]], {selectedId: 'earth'});
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 0).length, 1);
  renderer.positions.set('fast-240hz', [.25, 0, 0]);
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 4).length, 1,
    'fast motion stays visible on high-refresh-rate monitors');
});

test('v9: stopped objects remain labeled even when the simulated date changes', () => {
  const b = body('stable', 'moon');
  const {renderer, ctx} = scene([b], [[0, 0, 0]]);
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 0).length, 1);
  renderer.simTime = Date.now() + 3.65e13;
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 16).length, 1,
    'time alone does not hide an unmoving screen label');
});

test('v85: scene changes, viewport resize and the manual toggle retain their behavior', () => {
  const b = body('target', 'moon');
  const {renderer, ctx} = scene([b], [[-.5, 0, 0]], {planetId: 'earth', selectedId: 'earth'});
  layoutSceneLabels(renderer, VP, ctx, 0);
  renderer.positions.set('target', [.5, 0, 0]);
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 16).length, 1);
  renderer.planetId = 'mars';
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 32).length, 1);
  renderer.width = 700;
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 48).length, 1);
  renderer.settings.labels = false;
  assert.deepEqual(layoutSceneLabels(renderer, VP, ctx, 64), []);
  assert.equal(renderer._labelState, null);
  renderer.settings.labels = true;
  assert.equal(layoutSceneLabels(renderer, VP, ctx, 80).length, 1);
});

test('v9: all planet-scene moons can compete, not just the first fourteen', () => {
  const bodies = [body('jupiter', 'planet', 69911), ...Array.from({length: 35}, (_, i) =>
    body(`orbiter-${i}`, 'moon', 1 + i))];
  const positions = [[-.65, -.58, 0], ...Array.from({length: 35}, (_, i) =>
    [(-.92 + (i % 7) * .3), (-.65 + Math.floor(i / 7) * .33), 0])];
  const {renderer, ctx} = scene(bodies, positions, {planetId: 'jupiter', selectedId: 'orbiter-34'});
  const labels = layoutSceneLabels(renderer, VP, ctx, 0);
  assert.ok(labels.some(l => l.body.id === 'orbiter-34'), 'selected distant moon is still eligible');
  assert.ok(labels.some(l => l.body.id === 'orbiter-25'), 'moon outside old top-14 cap is eligible');
  assert.ok(labels.some(l => l.body.id === 'jupiter'), 'primary planet has its own label');
});

test('v9: full drawing honors canvas DPR, readable halo, highlight, and toggle off', () => {
  const b = body('sat-25544', 'satellite');
  const {renderer, ctx} = scene([b], [[0, 0, 0]]);
  drawSceneLabels(renderer, VP);
  assert.deepEqual(ctx.calls[0], ['transform', 1.5, 0, 0, 1.5, 0, 0]);
  assert.deepEqual(ctx.calls[1], ['clear', 0, 0, 640, 420]);
  assert.ok(ctx.calls.some(c => c[0] === 'strokeText'), 'text uses a dark outline for readability');
  assert.ok(ctx.calls.some(c => c[0] === 'fillText'), 'label was drawn');
  assert.ok(ctx.calls.some(c => c[0] === 'arc'), 'selection marker remains visible');
  ctx.calls.length = 0;
  renderer.settings.labels = false;
  drawSceneLabels(renderer, VP);
  assert.ok(ctx.calls.some(c => c[0] === 'clear'));
  assert.equal(ctx.calls.some(c => c[0] === 'fillText'), false);
});

test('v9: very long names never render outside the canvas', () => {
  const b = body('extremely-long-object-name-to-be-shortened-over-many-characters', 'moon');
  const {renderer, ctx} = scene([b], [[0, 0, 0]], {width: 320});
  const [label] = layoutSceneLabels(renderer, VP, ctx, 0);
  assert.ok(label, 'long names can be shortened rather than simply omitted');
  assert.ok(label.name.endsWith('\u2026'));
  assert.ok(label.rect.x >= 8 && label.rect.x + label.rect.w <= renderer.width - 8);
});
