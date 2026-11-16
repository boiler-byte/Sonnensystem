import { CAMERA_FOV, TAU, projected } from './math.js';
import { planetBodyRadius, renderRadius } from '../data/orbital-math.js';

// Motion is measured in CSS pixels per real second, not in simulated days.
// Hysteresis prevents labels flashing on and off near the threshold.
export const LABEL_MOTION = Object.freeze({hideAbove: 220, showBelow: 140, settleMs: 140});
// Keep a chosen label side during short-lived satellite conjunctions. A new
// side needs sustained obstruction and a stable, available alternative.
export const LABEL_STABILITY = Object.freeze({blockedMs: 650, sideHoldMs: 1300, clearMs: 180, retainMs: 6000});
const VIEW_MARGIN = {left: 8, right: 8, top: 26, bottom: 24};
const LABEL_GAP = 5;
const BODY_GAP = 3;
const HALF_FOV_TANGENT = 2 * Math.tan(CAMERA_FOV / 2);

function labelPriority(body, renderer, previouslyVisible) {
  if (body.id === renderer.selectedId) return 10000;
  if (renderer.planetId && body.id === renderer.planetId) return 9000;
  const radius = Math.max(0, Number(body.radiusKm) || 0);
  let score;
  switch (body.type) {
    case 'planet': score = 8000; break;
    case 'star': score = 7000; break;
    case 'dwarf': score = 5700; break;
    case 'moon': score = 4000 + Math.min(450, Math.log10(radius + 1) * 110); break;
    case 'satellite': score = body.catalog === 25544 || Number(body.catalog) === 25544 ? 4800 : 3100; break;
    case 'comet': score = 2600; break;
    default: score = 2300;
  }
  return score + (previouslyVisible ? 120 : 0);
}

function intersects(a, b, gap = LABEL_GAP) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function overlapsBody(rect, obstacle) {
  const x = Math.max(rect.x - BODY_GAP, Math.min(obstacle.x, rect.x + rect.w + BODY_GAP));
  const y = Math.max(rect.y - BODY_GAP, Math.min(obstacle.y, rect.y + rect.h + BODY_GAP));
  return (x - obstacle.x) ** 2 + (y - obstacle.y) ** 2 < obstacle.r ** 2;
}

function visibleInsideViewport(rect, w, h) {
  return rect.x >= VIEW_MARGIN.left && rect.y >= VIEW_MARGIN.top &&
    rect.x + rect.w <= w - VIEW_MARGIN.right && rect.y + rect.h <= h - VIEW_MARGIN.bottom;
}

function fitLabel(name, ctx, maxWidth) {
  if (ctx.measureText(name).width <= maxWidth) return name;
  const ellipsis = '\u2026';
  if (ctx.measureText(ellipsis).width > maxWidth) return '';
  let lo = 0, hi = name.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(name.slice(0, mid) + ellipsis).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return name.slice(0, lo) + ellipsis;
}

function placements(item, previousSide) {
  const {projection: p, radius: r, width: w, height: h} = item;
  const distance = Math.max(10, r) + 8;
  const positions = {
    right: {x: p.x + distance, y: p.y - h / 2, w, h},
    left: {x: p.x - distance - w, y: p.y - h / 2, w, h},
    above: {x: p.x - w / 2, y: p.y - distance - h, w, h},
    below: {x: p.x - w / 2, y: p.y + distance, w, h}
  };
  const order = ['right', 'left', 'above', 'below'];
  if (positions[previousSide]) order.unshift(previousSide);
  return [...new Set(order)].map(side => ({side, rect: positions[side]}));
}

function isTooFast(previous, p, now, dt) {
  if (!previous || dt < 1 || dt > 250) return {fast: false, lastFastAt: -Infinity};
  const speed = Math.hypot(p.x - previous.x, p.y - previous.y) * 1000 / dt;
  const newlyFast = speed > LABEL_MOTION.hideAbove;
  const lastFastAt = newlyFast ? now : previous.lastFastAt;
  const fast = newlyFast || (previous.fast &&
    (speed >= LABEL_MOTION.showBelow || now - lastFastAt < LABEL_MOTION.settleMs));
  return {fast, lastFastAt};
}

/**
 * Calculates a legible, non-overlapping label set for either scene.
 * Every rendered body can compete for a label; high-value labels win.
 * Exposed for deterministic layout / motion regression tests.
 */
export function layoutSceneLabels(renderer, vp, ctx, now = performance.now()) {
  if (!renderer.settings?.labels) {
    renderer._labelState = null;
    return [];
  }
  const {width: w, height: h} = renderer;
  const sceneKey = `${renderer.planetId || 'solar'}:${w}x${h}`;
  const old = renderer._labelState?.key === sceneKey ? renderer._labelState : null;
  const dt = old ? now - old.at : NaN;
  const observations = new Map();
  // Unlike `placements`, anchors survive a few frames without a visible label.
  // This prevents a satellite from alternating left/right every orbit frame.
  const anchors = new Map(old?.anchors
    ? [...old.anchors].filter(([, anchor]) => now - anchor.seenAt < LABEL_STABILITY.retainMs)
    : []);
  const projectedBodies = [];

  for (const body of renderer.rendered) {
    const pos = renderer.positions.get(body.id);
    if (!pos) continue;
    const p = projected(pos, vp, w, h);
    if (!p?.visible || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const oldSample = old?.observations.get(body.id);
    const motion = isTooFast(oldSample, p, now, dt);
    observations.set(body.id, {x: p.x, y: p.y, ...motion});
    const bodyRadius = renderer.planetId ? planetBodyRadius(body) : renderRadius(body);
    const radius = Math.max(0, bodyRadius * h / (HALF_FOV_TANGENT * p.depth));
    projectedBodies.push({body, projection: p, radius, fast: motion.fast});
    if (anchors.has(body.id)) anchors.set(body.id, {...anchors.get(body.id), seenAt: now});
  }

  // Keep every on-screen body as a possible obstruction, including an unlabeled one.
  const obstacles = projectedBodies.filter(item => item.radius >= 4).map(item => ({
    id: item.body.id, x: item.projection.x, y: item.projection.y,
    r: item.radius, depth: item.projection.depth
  }));
  projectedBodies.sort((a, b) =>
    labelPriority(b.body, renderer, old?.placements.has(b.body.id)) -
    labelPriority(a.body, renderer, old?.placements.has(a.body.id)) ||
    a.body.id.localeCompare(b.body.id));

  const placed = [];
  const nextPlacements = new Map();
  for (const item of projectedBodies) {
    const {body, projection: p} = item;
    const selected = body.id === renderer.selectedId;
    // Selection is a user action: motion, passing satellites and collisions
    // must never suppress its caption. The manual Names toggle still applies.
    if (item.fast && !selected) continue;
    // An object hidden behind a larger, closer disk should not get a caption.
    if (!selected && obstacles.some(o => o.id !== body.id && o.depth < p.depth - o.r &&
      Math.hypot(p.x - o.x, p.y - o.y) < o.r)) continue;
    const fontSize = selected ? 12 : 11;
    const font = `${selected ? 700 : 600} ${fontSize}px system-ui, sans-serif`;
    ctx.font = font;
    const name = fitLabel(String(body.name || body.id).toLocaleUpperCase('de-DE'), ctx,
      Math.min(260, w - 48));
    if (!name) continue;
    item.name = name;
    item.font = font;
    item.width = Math.ceil(ctx.measureText(name).width) + 17;
    item.height = fontSize + 9;
    item.selected = selected;

    const prior = anchors.get(body.id);
    const options = placements(item, prior?.side);
    const available = option => visibleInsideViewport(option.rect, w, h) &&
      !placed.some(other => intersects(option.rect, other.rect)) &&
      !obstacles.some(o => o.id !== body.id && overlapsBody(option.rect, o));
    let chosen = null;

    if (selected) {
      // The selected label is an immovable reservation for all lower-priority
      // labels, even when another disk or a fast satellite passes beneath it.
      // Only reposition if its rectangle would leave the visible viewport.
      chosen = options.find(o => o.side === prior?.side && visibleInsideViewport(o.rect,w,h)) ||
        options.find(o => visibleInsideViewport(o.rect,w,h) &&
          !obstacles.some(ob => ob.id !== body.id && overlapsBody(o.rect,ob))) ||
        options.find(o => visibleInsideViewport(o.rect,w,h));
      if (!chosen) {
        const option = options[0];
        const r = option.rect;
        chosen = {side:option.side,rect:{...r,
          x:Math.max(VIEW_MARGIN.left,Math.min(r.x,w-VIEW_MARGIN.right-r.w)),
          y:Math.max(VIEW_MARGIN.top,Math.min(r.y,h-VIEW_MARGIN.bottom-r.h))}};
      }
      anchors.set(body.id,{side:chosen.side,changedAt:prior?.side===chosen.side?prior.changedAt:now,
        seenAt:now,lastDrawnAt:now,blockedSince:null,pendingSide:null,pendingSince:null});
    } else if (!prior) {
      // Initial placement can use any free side immediately.
      chosen = options.find(available);
      if (chosen) anchors.set(body.id, {
        side: chosen.side, changedAt: now, lastDrawnAt: now, seenAt: now,
        blockedSince: null, pendingSide: null, pendingSince: null
      });
    } else {
      const preferred = options.find(o => o.side === prior.side);
      if (preferred && available(preferred)) {
        // A temporarily blocked label always returns to its established side.
        chosen = preferred;
        anchors.set(body.id, {...prior, seenAt: now, lastDrawnAt: now,
          blockedSince: null, pendingSide: null, pendingSince: null});
      } else {
        const blockedSince = prior.blockedSince ?? now;
        let pendingSide = null, pendingSince = null;
        if (now - blockedSince >= LABEL_STABILITY.blockedMs &&
            now - prior.changedAt >= LABEL_STABILITY.sideHoldMs) {
          const alternative = options.find(o => o.side !== prior.side && available(o));
          if (alternative) {
            pendingSide = alternative.side;
            pendingSince = prior.pendingSide === pendingSide ? prior.pendingSince : now;
            if (now - pendingSince >= LABEL_STABILITY.clearMs) {
              chosen = alternative;
              anchors.set(body.id, {
                side: alternative.side, changedAt: now, lastDrawnAt: now,
                seenAt: now, blockedSince: null, pendingSide: null, pendingSince: null
              });
            }
          }
        }
        if (!chosen) anchors.set(body.id, {...prior, seenAt: now,
          blockedSince, pendingSide, pendingSince});
      }
    }
    if (chosen) {
      placed.push({...item, side: chosen.side, rect: chosen.rect});
      nextPlacements.set(body.id, chosen.side);
    }
  }

  renderer._labelState = {key: sceneKey, at: now, observations, placements: nextPlacements, anchors};
  return placed;
}

export function drawSceneLabels(renderer, vp) {
  const ctx = renderer.labels.getContext('2d');
  const {width: w, height: h} = renderer;
  ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const placed = layoutSceneLabels(renderer, vp, ctx);
  for (const item of placed) {
    const {body, selected, projection: p, radius, rect, font, name} = item;
    const cy = rect.y + rect.h / 2;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.globalAlpha = selected ? 1 : .88;
    ctx.strokeStyle = 'rgba(5, 11, 24, .94)';
    ctx.strokeText(name, rect.x + 13, cy);
    ctx.fillStyle = selected ? '#f5d5a0' : '#c1ccd9';
    ctx.fillText(name, rect.x + 13, cy);
    ctx.beginPath();
    ctx.arc(rect.x + 5, cy, selected ? 2.4 : 1.7, 0, TAU);
    ctx.fillStyle = selected ? '#e7b979' : '#93a7bb';
    ctx.fill();
    if (selected) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(12, radius * 1.18), 0, TAU);
      ctx.strokeStyle = 'rgba(235,184,118,.40)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
