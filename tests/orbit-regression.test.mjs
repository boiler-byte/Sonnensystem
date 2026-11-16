import assert from 'node:assert/strict';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';
import { sceneRadius, renderRadius, orbitalRadius, keplerPosition } from '../src/renderer/index.js';
const byId = Object.fromEntries(INITIAL_BODIES.map(b => [b.id,b]));
assert.equal(INITIAL_BODIES.filter(x=>x.type==='planet').length, 8);
for (const b of INITIAL_BODIES) {
  if (b.type==='star') continue;
  assert.ok(byId[b.parentId], `${b.id}: missing parent`);
  assert.ok(b.a>0 && b.periodDays>0, `${b.id}: bad orbit`);
  const p=keplerPosition(b,byId[b.parentId],Date.UTC(2026,10,15));
  assert.ok(p.length===3&&p.every(Number.isFinite), `${b.id}: invalid position`);
  assert.ok(orbitalRadius(b,byId[b.parentId])>renderRadius(byId[b.parentId])*.2, `${b.id}: orbit too small`);
}
assert.ok(sceneRadius(30)>sceneRadius(1));
console.log(`✓ ${INITIAL_BODIES.length} start objects and orbit propagation validated`);
