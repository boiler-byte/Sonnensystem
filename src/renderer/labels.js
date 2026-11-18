import { CAMERA_FOV, TAU, projected } from './math.js';
import { displayBodyRadius } from '../data/orbital-math.js';

// Motion is measured in CSS pixels per real second, not in simulated days.
// Hysteresis prevents labels flashing on and off near the threshold.
export const LABEL_MOTION = Object.freeze({hideAbove: 220, showBelow: 140, settleMs: 140});
// Retained compatibility values for previous integrations; v16 placements
// no longer change sides because of collisions.
export const LABEL_STABILITY = Object.freeze({blockedMs: 650, sideHoldMs: 1300, clearMs: 180, retainMs: 6000});
const VIEW_MARGIN = {left: 8, right: 8, top: 26, bottom: 24};
export const LABEL_DENSITY = Object.freeze({cellWidth: 160, cellHeight: 110, maxPerCell: 2, edgeHoldPx: 18});
const HALF_FOV_TANGENT = 2 * Math.tan(CAMERA_FOV / 2);

/** The four largest moons of each planet can claim labels in the solar overview.
 * Preserve the selected label by displacing the fourth-largest if necessary.
 */
export function solarMoonLabelIds(bodies, selectedId, maximum=4) {
  const groups=new Map();
  for(const body of bodies){
    if(body.type!=='moon')continue;
    const key=body.parentId||'_unassigned';
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(body);
  }
  const allowed=new Set();
  for(const moons of groups.values()){
    moons.sort((a,b)=>Math.max(0,Number(b.radiusKm)||0)-Math.max(0,Number(a.radiusKm)||0) ||
      a.id.localeCompare(b.id));
    const largest=moons.slice(0,maximum);
    const selected=moons.find(m=>m.id===selectedId);
    if(selected && !largest.some(m=>m.id===selected.id) && largest.length){
      largest[largest.length-1]=selected;
    }
    for(const moon of largest)allowed.add(moon.id);
  }
  return allowed;
}

function labelPriority(body, renderer, previouslyVisible) {
  if (body.id === renderer.selectedId) return 10000;
  if (renderer.planetId && body.id === renderer.planetId) return 9000;
  const radius = Math.max(0, Number(body.radiusKm) || 0);
  let score;
  switch (body.type) {
    case 'planet': score = 8000; break;
    case 'star': score = 7000; break;
    case 'dwarf': score = 5700; break;
    case 'tno': score = 4900; break;
    case 'moon': score = 4000 + Math.min(450, Math.log10(radius + 1) * 110); break;
    case 'satellite': score = body.catalog === 25544 || Number(body.catalog) === 25544 ? 4800 : 3100; break;
    case 'binary': score = 2750; break;
    case 'comet': score = 2600; break;
    default: score = 2300;
  }
  return score + (previouslyVisible ? 120 : 0);
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

/** Fixed alternating orientation by physical row rank; never by label priority. */
export function rowLabelSide(index) {
  return Number.isInteger(index)&&index>=0 ? (index%2===0?'above':'below') : null;
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
 * Calculates a priority-ranked, screen-space density-limited label set.
 * Every rendered body can compete for a label; high-value labels win.
 * Exposed for deterministic layout / motion regression tests.
 */
export function layoutSceneLabels(renderer, vp, ctx, now = performance.now()) {
  if (!renderer.settings?.labels) {
    renderer._labelState = null;
    return [];
  }
  const {width: w, height: h} = renderer;
  const rowActive=renderer.settings?.row===true;
  const sceneKey = `${renderer.planetId || 'solar'}:${rowActive?'row':'orbit'}:${w}x${h}`;
  const old = renderer._labelState?.key === sceneKey ? renderer._labelState : null;
  const dt = old ? now - old.at : NaN;
  const observations = new Map();
  // Unlike `placements`, anchors survive a few frames without a visible label.
  // This prevents a satellite from alternating left/right every orbit frame.
  const anchors = new Map(old?.anchors
    ? [...old.anchors].filter(([, anchor]) => now - anchor.seenAt < LABEL_STABILITY.retainMs)
    : []);
  const projectedBodies = [];
  // The display switch limits actual moon bodies upstream; when off, do not
  // retain the old unconditional four-label restriction.
  const moonLabels = !renderer.planetId && renderer.settings?.fourMoons !== false
    ? solarMoonLabelIds(renderer.rendered,renderer.settings?.fourMoons===true?null:renderer.selectedId) : null;

  for (const body of renderer.rendered) {
    if (moonLabels && body.type==='moon' && !moonLabels.has(body.id)) continue;
    const pos = renderer.positions.get(body.id);
    if (!pos) continue;
    const p = projected(pos, vp, w, h);
    if (!p?.visible || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const oldSample = old?.observations.get(body.id);
    const motion = isTooFast(oldSample, p, now, dt);
    observations.set(body.id, {x: p.x, y: p.y, ...motion});
    const bodyRadius = renderer.bodyRadius?.(body) ?? displayBodyRadius(body, renderer.settings, renderer.planetId ? renderer.byId?.get(renderer.planetId) : null);
    // Use the Saturn ring silhouette as the label clearance in row mode.
    const visualRadius=rowActive && body.id==='saturn'
      ? Math.max(bodyRadius,1.20*(renderer.ringScale?.()??0)) : bodyRadius;
    const radius = Math.max(0, visualRadius * h / (HALF_FOV_TANGENT * p.depth));
    projectedBodies.push({body, projection: p, radius, fast: motion.fast});
    if (anchors.has(body.id)) anchors.set(body.id, {...anchors.get(body.id), seenAt: now});
  }

  // v16: fixed screen-space density budget, not frame-by-frame text collisions.
  // Allow a little overlap. Priority and a previously-visible bonus provide
  // predictable labels even when multiple satellites share the same screen area.
  projectedBodies.sort((a, b) =>
    labelPriority(b.body, renderer, old?.placements.has(b.body.id)) -
    labelPriority(a.body, renderer, old?.placements.has(a.body.id)) ||
    a.body.id.localeCompare(b.body.id));

  const placed = [];
  const nextPlacements = new Map();
  const cellCounts = new Map();
  for (const item of projectedBodies) {
    const {body, projection: p} = item;
    const selected = body.id === renderer.selectedId;
    if (item.fast && !selected) continue;
    const defaultCol = Math.floor(p.x / LABEL_DENSITY.cellWidth);
    const defaultRow = Math.floor(p.y / LABEL_DENSITY.cellHeight);
    const previousCell = anchors.get(body.id)?.cell;
    // A small margin around the previous tile avoids thrashing at grid edges.
    const retained = previousCell &&
      p.x >= previousCell.col * LABEL_DENSITY.cellWidth - LABEL_DENSITY.edgeHoldPx &&
      p.x < (previousCell.col + 1) * LABEL_DENSITY.cellWidth + LABEL_DENSITY.edgeHoldPx &&
      p.y >= previousCell.row * LABEL_DENSITY.cellHeight - LABEL_DENSITY.edgeHoldPx &&
      p.y < (previousCell.row + 1) * LABEL_DENSITY.cellHeight + LABEL_DENSITY.edgeHoldPx;
    const gridCell = retained ? previousCell : {col:defaultCol, row:defaultRow};
    const cell = `${gridCell.col}:${gridCell.row}`;
    // The selected object is never hidden by the density budget.
    if (!selected && (cellCounts.get(cell) || 0) >= LABEL_DENSITY.maxPerCell) continue;

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
    const rowSide=rowActive ? rowLabelSide(renderer._rowLabelOrder?.get(body.id)) : null;
    // In a row, labels alternate above/below by their physical body order;
    // priority and previous orbit-view anchors must never flip this side.
    const options = rowSide ? placements(item,rowSide).filter(o=>o.side===rowSide)
      : placements(item,prior?.side);
    // Ordinary views retain their stable side; row mode uses only its assigned side.
    let chosen = options.find(o => o.side === (rowSide||prior?.side) && visibleInsideViewport(o.rect, w, h)) ||
      options.find(o => visibleInsideViewport(o.rect, w, h));
    if (!chosen && selected) {
      const option = options[0];
      const r = option.rect;
      chosen = {side: option.side, rect: {...r,
        x: Math.max(VIEW_MARGIN.left, Math.min(r.x, w - VIEW_MARGIN.right - r.w)),
        y: Math.max(VIEW_MARGIN.top, Math.min(r.y, h - VIEW_MARGIN.bottom - r.h))}};
    }
    if (!chosen) continue;
    anchors.set(body.id, {
      side: chosen.side, changedAt: prior?.side === chosen.side ? prior.changedAt : now,
      seenAt: now, lastDrawnAt: now, cell: gridCell
    });
    placed.push({...item, side: chosen.side, rect: chosen.rect});
    nextPlacements.set(body.id, chosen.side);
    if (!selected) cellCounts.set(cell, (cellCounts.get(cell) || 0) + 1);
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
