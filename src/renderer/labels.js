import { CAMERA_FOV, TAU, projected } from './math.js';
import { CATEGORY_COLORS } from '../data/bodies.js';
import { displayBodyRadius } from '../data/orbital-math.js';

// Position anchors are retained to avoid unnecessary side changes. No
// label-to-label or label-to-body overlap check may hide an object label.
export const LABEL_STABILITY = Object.freeze({retainMs: 6000});
const VIEW_MARGIN = {left: 8, right: 8, top: 26, bottom: 24};
const HALF_FOV_TANGENT = 2 * Math.tan(CAMERA_FOV / 2);
const LABEL_CENTER_MARKER = Object.freeze({defaultRadius: 2.2, selectedRadius: 2.6});

// A label becomes difficult to read when the body itself orbits too far per
// real second in screen space. These thresholds deliberately ignore camera
// motion, pan/zoom and visual layout transitions.
export const ORBIT_LABEL_SPEED = Object.freeze({
  hideAbove: 190, showBelow: 135, maxFrameMs: 250, maxSimDaysPerSecond: 4000
});

/** Label at most four direct orbiters of each planet (or dwarf) in the solar
 * overview, regardless of the "Alle Monde" body-visibility setting. Natural
 * moons and artificial satellites compete by catalog radius, with the selected
 * orbiter replacing the smallest allowed entry rather than adding a fifth.
 */
export function solarOrbiterLabelIds(bodies, selectedId, maximum=4, byId=null) {
  const groups=new Map();
  for (const body of bodies) {
    if (!isPlanetOrbiter(body,byId)) continue;
    if (!groups.has(body.parentId))groups.set(body.parentId,[]);
    groups.get(body.parentId).push(body);
  }
  const allowed=new Set();
  for (const orbiters of groups.values()) {
    orbiters.sort((a,b)=>Math.max(0,Number(b.radiusKm)||0)-Math.max(0,Number(a.radiusKm)||0) ||
      String(a.id).localeCompare(String(b.id)));
    const biggest=orbiters.slice(0,Math.max(0,maximum));
    const selected=orbiters.find(b=>b.id===selectedId);
    if (selected && biggest.length && !biggest.some(b=>b.id===selected.id))
      biggest[biggest.length-1]=selected;
    for (const body of biggest) allowed.add(body.id);
  }
  return allowed;
}

/** Compatibility helper for the original four-largest-natural-moons API. */
export function solarMoonLabelIds(bodies, selectedId, maximum=4) {
  return solarOrbiterLabelIds(bodies.filter(b=>b.type==='moon'),selectedId,maximum);
}

function isPlanetOrbiter(body,byId) {
  if (!body?.parentId || ['star','planet','probe'].includes(body.type)) return false;
  const parent=byId?.get(body.parentId);
  // Embedder/test contexts may not include all parent records. In that case
  // restrict only known moon/satellite children, never unrelated solar bodies.
  return parent ? (parent.type==='planet'||parent.type==='dwarf')
    : (body.type==='moon'||body.type==='satellite');
}

function orbitalSample(body, position, positions) {
  if (!body.parentId) return null;
  const parent=positions.get(body.parentId);
  if (!parent) return null;
  return [position[0]-parent[0],position[1]-parent[1],position[2]-parent[2]];
}

/** Compare two orbit-relative positions using one CURRENT camera matrix.
 * Reprojecting in the same camera frame removes all camera-only movement;
 * subtracting the parent's displacement excludes inherited parent orbits.
 */
function simulatedOrbitalSpeed(p,position,relative,previous,renderer,vp,w,h,dt,simDelta) {
  if (!relative || !previous?.relative || !(dt>0 && dt<=ORBIT_LABEL_SPEED.maxFrameMs) ||
      !(simDelta>0) || simDelta / 86400000 * 1000 / dt > ORBIT_LABEL_SPEED.maxSimDaysPerSecond ||
      renderer.settings?.row || renderer.transition || renderer.cinema?.active) return 0;
  const before=[
    position[0]-(relative[0]-previous.relative[0]),
    position[1]-(relative[1]-previous.relative[1]),
    position[2]-(relative[2]-previous.relative[2])
  ];
  const prev=projected(before,vp,w,h);
  if (!prev || !Number.isFinite(prev.x) || !Number.isFinite(prev.y)) return 0;
  return Math.hypot(p.x-prev.x,p.y-prev.y)*1000/dt;
}

// Used only for paint order: important names (especially the selected body)
// are drawn last, over lower-priority labels. It never suppresses labels.
function labelPriority(body, renderer) {
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
  return score;
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

function centerMarkerStyle(body, selected, radius) {
  const markerRadius = selected ? LABEL_CENTER_MARKER.selectedRadius : LABEL_CENTER_MARKER.defaultRadius;
  if (!selected && radius >= markerRadius) return null;
  return {
    radius: markerRadius,
    color: selected ? '#e7b979' : (CATEGORY_COLORS[body.type] || body.color || '#c1ccd9')
  };
}

/**
 * Places every eligible, visible object label even if its text rectangles
 * overlap other labels or planet disks. The only automatic filters here are
 * camera visibility, viewport bounds, explicitly configured layer/UI choices,
 * the solar four-largest-orbiters rule, and unreadable simulated orbital speed.
 * Camera-only motion and text/body collisions never suppress labels.
 * Exposed for deterministic layout and orbital-speed regression tests.
 */
export function layoutSceneLabels(renderer, vp, ctx, now = performance.now()) {
  if (!renderer.settings?.labels || renderer.settings?.labels==='points') {
    renderer._labelState = null;
    return [];
  }
  const {width: w, height: h} = renderer;
  const rowActive=renderer.settings?.row===true;
  const sceneKey = `${renderer.planetId || 'solar'}:${rowActive?'row':'orbit'}:${w}x${h}`;
  const old = renderer._labelState?.key === sceneKey ? renderer._labelState : null;
  const dt=old ? now-old.at : NaN;
  const simTime=Number(renderer.simTime);
  const simDelta=old && Number.isFinite(simTime) && Number.isFinite(old.simTime)
    ? simTime-old.simTime : NaN;
  const observations=new Map();
  // Unlike `placements`, anchors survive a few frames without a visible label.
  // This prevents a satellite from alternating left/right every orbit frame.
  const anchors = new Map(old?.anchors
    ? [...old.anchors].filter(([, anchor]) => now - anchor.seenAt < LABEL_STABILITY.retainMs)
    : []);
  const projectedBodies = [];
  // The solar label cap remains in force even if "Alle Monde" displays every
  // sphere. Restrict labels only, never scene objects, orbits or picking.
  const catalog=renderer.byId ?? new Map(renderer.bodies?.map(b=>[b.id,b]) ||
    renderer.rendered.map(b=>[b.id,b]));
  const orbiterLabels=!renderer.planetId
    ? solarOrbiterLabelIds(renderer.rendered,renderer.selectedId,4,catalog) : null;

  for (const body of renderer.rendered) {
    if(rowActive && renderer.rowHoveredId===body.id)continue; // HUD supplies its name and measurements.
    if (orbiterLabels && isPlanetOrbiter(body,catalog) && !orbiterLabels.has(body.id))continue;
    const pos = renderer.positions.get(body.id);
    if (!pos) continue;
    const p = projected(pos, vp, w, h);
    if (!p?.visible || !Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    const relative=orbitalSample(body,pos,renderer.positions);
    const previous=old?.observations?.get(body.id);
    const orbitalSpeed=simulatedOrbitalSpeed(p,pos,relative,previous,renderer,vp,w,h,dt,simDelta);
    const wasFast=previous?.fast===true;
    const fast=orbitalSpeed>=(wasFast?ORBIT_LABEL_SPEED.showBelow:ORBIT_LABEL_SPEED.hideAbove);
    observations.set(body.id,{relative,fast});
    const bodyRadius = renderer.bodyRadius?.(body) ?? displayBodyRadius(body, renderer.settings, renderer.planetId ? renderer.byId?.get(renderer.planetId) : null);
    // Use the Saturn ring silhouette as the label clearance in row mode.
    const visualRadius=rowActive && body.id==='saturn'
      ? Math.max(bodyRadius,1.20*(renderer.ringScale?.()??0)) : bodyRadius;
    const radius = Math.max(0, visualRadius * h / (HALF_FOV_TANGENT * p.depth));
    projectedBodies.push({body, projection: p, radius, fast});
    if (anchors.has(body.id)) anchors.set(body.id, {...anchors.get(body.id), seenAt: now});
  }

  // Every eligible body receives a label, regardless of label collisions or
  // how many objects share a screen area. Draw high-priority labels last.
  projectedBodies.sort((a, b) =>
    labelPriority(a.body, renderer) - labelPriority(b.body, renderer) ||
    a.body.id.localeCompare(b.body.id));

  const placed = [];
  const fastMarkers=[];
  for (const item of projectedBodies) {
    const {body} = item;
    const selected = body.id === renderer.selectedId;
    if (item.fast) {
      // A marker identifies a tiny body independently of its unreadable text.
      if (centerMarkerStyle(body,selected,item.radius))fastMarkers.push(item);
      continue;
    }

    const fontSize = selected ? 12 : 11;
    const font = `${selected ? 700 : 600} ${fontSize}px system-ui, sans-serif`;
    ctx.font = font;
    const name = fitLabel(String(body.name || body.id).toLocaleUpperCase('de-DE'), ctx,
      Math.min(260, w - 48));
    if (!name) continue;
    item.name = name;
    item.font = font;
    item.width = Math.ceil(ctx.measureText(name).width) + 4;
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
      seenAt: now, lastDrawnAt: now
    });
    placed.push({...item, side: chosen.side, rect: chosen.rect});
  }

  renderer._labelState = {key: sceneKey, at: now, simTime, observations, anchors, fastMarkers};
  return placed;
}

function drawCenterMarker(ctx,body,selected,p,radius){
  const marker=centerMarkerStyle(body,selected,radius);
  if(!marker)return;
  ctx.globalAlpha=1;
  ctx.beginPath();
  ctx.arc(p.x,p.y,marker.radius,0,TAU);
  ctx.fillStyle=marker.color;
  ctx.fill();
}

function drawSelectionRing(ctx,p,radius){
  ctx.beginPath();
  ctx.arc(p.x,p.y,Math.max(12,radius*1.18),0,TAU);
  ctx.strokeStyle='rgba(235,184,118,.40)';
  ctx.lineWidth=1;
  ctx.stroke();
}

/** The middle toggle state draws dots only for selected bodies and bodies
 * that project smaller than a dot, using the same size rule as normal labels.
 * Text, label density and simulated orbital speed do not affect these dots.
 */
function drawScenePoints(renderer,vp,ctx){
  const {width:w,height:h}=renderer;
  const bodies=[...renderer.rendered].sort((a,b)=>
    labelPriority(a,renderer)-labelPriority(b,renderer));
  for(const body of bodies){
    const pos=renderer.positions.get(body.id);
    if(!pos)continue;
    const p=projected(pos,vp,w,h);
    if(!p?.visible || !Number.isFinite(p.x) || !Number.isFinite(p.y))continue;
    const selected=body.id===renderer.selectedId;
    const bodyRadius=renderer.bodyRadius?.(body) ?? displayBodyRadius(body,renderer.settings,
      renderer.planetId?renderer.byId?.get(renderer.planetId):null);
    const visualRadius=renderer.settings?.row===true && body.id==='saturn'
      ? Math.max(bodyRadius,1.20*(renderer.ringScale?.()??0)) : bodyRadius;
    const radius=Math.max(0,visualRadius*h/(HALF_FOV_TANGENT*p.depth));
    drawCenterMarker(ctx,body,selected,p,radius);
    if(selected)drawSelectionRing(ctx,p,radius);
  }
}

export function drawSceneLabels(renderer, vp) {
  const ctx = renderer.labels.getContext('2d');
  const {width: w, height: h} = renderer;
  ctx.setTransform(renderer.dpr, 0, 0, renderer.dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if(renderer.settings?.labels==='points'){
    renderer._labelState=null;
    drawScenePoints(renderer,vp,ctx);
    ctx.globalAlpha=1;
    return;
  }
  const placed = layoutSceneLabels(renderer, vp, ctx);
  for (const item of placed) {
    const {body, selected, projection: p, radius, rect, font, name} = item;
    const cy = rect.y + rect.h / 2;
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    drawCenterMarker(ctx,body,selected,p,radius);
    ctx.globalAlpha = selected ? 1 : .88;
    ctx.strokeStyle = 'rgba(5, 11, 24, .94)';
    ctx.strokeText(name, rect.x + 2, cy);
    ctx.fillStyle = selected ? '#f5d5a0' : '#c1ccd9';
    ctx.fillText(name, rect.x + 2, cy);
    if (selected)drawSelectionRing(ctx,p,radius);
    ctx.globalAlpha = 1;
  }
  // Small body markers and the selected center indicator are independent of
  // whether simulated orbital motion makes their TEXT unreadable.
  for (const item of renderer._labelState?.fastMarkers || []) {
    const {body,projection:p,radius}=item;
    const selected=body.id===renderer.selectedId;
    drawCenterMarker(ctx,body,selected,p,radius);
    if(selected)drawSelectionRing(ctx,p,radius);
  }
  ctx.globalAlpha=1;
}
