import assert from 'node:assert/strict';
import { SolarRenderer, panCameraByPixels } from '../src/renderer/index.js';
import { readFile } from 'node:fs/promises';

const EPSILON = 1e-9;
const near = (actual, expected, message) => assert.ok(
  Math.abs(actual - expected) < EPSILON,
  `${message}: expected ${expected}, got ${actual}`
);
const nearVector = (actual, expected, message) => actual.forEach((value, i) =>
  near(value, expected[i], `${message}, axis ${i}`)
);
const delta = (a, b) => a.map((value, i) => value - b[i]);
const camera = (theta, phi) => ({
  theta, phi, dist: 47, desiredDist: 47,
  target: [3, 2.5, -8], desiredTarget: [12, -15, 20]
});
const headingAxes = theta => ({
  right: [Math.cos(theta), 0, -Math.sin(theta)],
  forward: [-Math.sin(theta), 0, -Math.cos(theta)]
});
const expectedDelta = (cam, dx, dy, h) => {
  const units = 2 * cam.dist * Math.tan((Math.PI / 4.35) / 2) / h;
  const { right, forward } = headingAxes(cam.theta);
  return right.map((value, i) => units * (-dx * value + dy * forward[i]));
};

// Ground-plane basis remains exactly the same at every inclination, including
// straight-down and near-horizon views. Dragging also preserves focus height.
for (const theta of [0, .63, Math.PI / 2, -2.3, 2.9]) {
  for (const [dx, dy] of [[110, 0], [0, 90], [-36, -67], [22, -105], [0, 0]]) {
    const responses = [];
    for (const phi of [0, .16, .42, .99, 1.4, 1.55, Math.PI / 2]) {
      const cam = camera(theta, phi);
      const start = cam.target.slice();
      const result = expectedDelta(cam, dx, dy, 600);
      panCameraByPixels(cam, dx, dy, 600);
      nearVector(delta(cam.target, start), result, 'Ground-relative pan is correct');
      near(cam.target[1], start[1], 'Pan never changes vertical coordinate');
      assert.deepEqual(cam.desiredTarget, cam.target, 'Pan cancels focus easing immediately');
      responses.push(cam.target);
    }
    for (const result of responses) nearVector(result, responses[0], 'Same drag independent of inclination');
  }
}

// Test the actual desktop and touch event paths, not only the shared helper.
const docHandlers = new Map(), winHandlers = new Map();
const add = (map, type, callback) => map.set(type, [...(map.get(type) || []), callback]);
const dispatch = (map, type, event) => { for (const callback of map.get(type) || []) callback(event); };
const previousDocument = globalThis.document, previousWindow = globalThis.window;
globalThis.document = {
  hidden: false,
  addEventListener(type, callback) { add(docHandlers, type, callback); },
  getElementById() { return { hidden: true }; }
};
globalThis.window = { addEventListener(type, callback) { add(winHandlers, type, callback); } };

function makeRenderer(phi, theta = .63) {
  const handlers = new Map(), selected = [];
  const canvas = {
    addEventListener(type, callback) { add(handlers, type, callback); },
    setPointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0 }; }
  };
  const renderer = Object.create(SolarRenderer.prototype);
  renderer.canvas = canvas;
  renderer.camera = camera(theta, phi);
  renderer.height = 600;
  renderer.drag = null;
  renderer.pointers = new Map();
  renderer.gesture = null;
  renderer.heldArrows = new Set();
  renderer.lastKeyboardFrameMs = null;
  renderer.pick = (...args) => selected.push(args);
  renderer.attachEvents();
  const emit = (type, props = {}) => dispatch(handlers, type, {
    target: canvas, pointerType: 'mouse', pointerId: 1, button: 0,
    clientX: 100, clientY: 100, shiftKey: false, ...props
  });
  return { renderer, emit, selected };
}

function mouseRun(phi, theta, shift = false) {
  const { renderer, emit, selected } = makeRenderer(phi, theta);
  const initial = renderer.camera.target.slice();
  const button = shift ? 0 : 2;
  emit('pointerdown', { button });
  emit('pointermove', { button, shiftKey: shift, clientX: 137, clientY: 159 });
  emit('pointerup', { button, clientX: 137, clientY: 159 });
  near(renderer.camera.target[1], initial[1], 'Mouse drag remains on orbital plane');
  nearVector(delta(renderer.camera.target, initial), expectedDelta(renderer.camera, 37, 59, 600), 'Mouse drag follows ground');
  assert.equal(selected.length, 0, 'Mouse pan must not select bodies');
  return renderer.camera.target;
}
function touchRun(phi, theta) {
  const { renderer, emit, selected } = makeRenderer(phi, theta);
  const initial = renderer.camera.target.slice();
  const touch = (type, pointerId, clientX, clientY) =>
    emit(type, { pointerType: 'touch', pointerId, clientX, clientY });
  touch('pointerdown', 1, 100, 100);
  touch('pointerdown', 2, 220, 100);
  // Two-finger swipe + pinch; finger events arrive separately on real devices.
  touch('pointermove', 1, 130, 145);
  touch('pointermove', 2, 260, 155);
  touch('pointerup', 1, 130, 145);
  touch('pointerup', 2, 260, 155);
  near(renderer.camera.target[1], initial[1], 'Two-finger pan remains on orbital plane');
  assert.equal(renderer.pointers.size, 0, 'Touch releases pointer capture');
  assert.equal(selected.length, 0, 'Two-finger gesture must not pick objects');
  assert.ok(renderer.camera.dist < 47, 'Finger separation still zooms in');
  near(renderer.camera.dist, renderer.camera.desiredDist, 'Pinch zoom remains immediate');
  return { target: renderer.camera.target, dist: renderer.camera.dist };
}
function keysRun(phi, theta) {
  const { renderer } = makeRenderer(phi, theta);
  const initial = renderer.camera.target.slice();
  const keyboard = (type, key) => dispatch(docHandlers, type, {
    key, target: { closest: () => null }, defaultPrevented: false,
    preventDefault() { this.prevented = true; }
  });
  keyboard('keydown', 'ArrowUp');
  keyboard('keydown', 'ArrowRight');
  renderer.lastKeyboardFrameMs = 1000;
  renderer.updateKeyboard(1016);
  keyboard('keyup', 'ArrowUp');
  keyboard('keyup', 'ArrowRight');
  const actual = delta(renderer.camera.target, initial);
  const speed = 390 * .016 / Math.SQRT2;
  nearVector(actual, expectedDelta(renderer.camera, -speed, speed, 600), 'Arrows move horizontally across orbital plane');
  near(renderer.camera.target[1], initial[1], 'Arrow keys cannot change height');
  return renderer.camera.target;
}
try {
  for (const theta of [0, .63, 1.7, -2.3]) {
    const mouse = [], shifted = [], touch = [], keyboard = [];
    for (const phi of [.16, .8, 1.55]) {
      mouse.push(mouseRun(phi, theta));
      shifted.push(mouseRun(phi, theta, true));
      touch.push(touchRun(phi, theta));
      keyboard.push(keysRun(phi, theta));
    }
    for (let i = 1; i < mouse.length; i++) {
      nearVector(mouse[i], mouse[0], 'Right mouse panning does not change with inclination');
      nearVector(shifted[i], shifted[0], 'Shift-left panning does not change with inclination');
      nearVector(touch[i].target, touch[0].target, 'Two-finger panning does not change with inclination');
      near(touch[i].dist, touch[0].dist, 'Two-finger zoom does not change with inclination');
      nearVector(keyboard[i], keyboard[0], 'Keyboard panning does not change with inclination');
    }
  }
} finally {
  if (previousDocument === undefined) delete globalThis.document;
  else globalThis.document = previousDocument;
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
}
const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.match(sw, /sonnensystem-shell-v(?:[4-9]|1[0-9]|2[0-9])\d*/, 'PWA cache invalidated for v4');
assert.match(html, /V(?:[4-9]|1[0-9]|2[0-9])\d*\.\d+/, 'UI version shown as v4');
const guide=await readFile(new URL('../docs/HILFE.md',import.meta.url),'utf8');
assert.match(guide, /unabhängig vom Neigungswinkel/, 'Documentation describes inclination independence');
console.log('✓ v4 ground-plane invariant at 7 inclinations and 5 headings, mouse, Shift, touch/pinch and arrow input paths');
