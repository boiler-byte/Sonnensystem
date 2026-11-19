/** Layer presets and scene-specific availability; no DOM or renderer dependencies. */
// Scientific object types remain distinct. Only the *filter interface* groups
// overlapping categories; a body keeps its original type, details and color.
export const LAYER_TYPES = Object.freeze(['star','planet','moon','dwarf','tno','asteroid','binary','satellite','comet','probe']);
export const LAYER_FILTER_TYPES = Object.freeze(LAYER_TYPES.filter(type => type !== 'tno' && type !== 'binary'));
export const LAYER_FILTER_GROUPS = Object.freeze({
  dwarf: Object.freeze(['dwarf','tno']),
  asteroid: Object.freeze(['asteroid','binary'])
});
export const layerFilterMembers = type => LAYER_FILTER_GROUPS[type] || [type];
// The solar overview starts with only Sun and planets. Planet view has
// its own default mask for the central planet, natural moons and satellites.
export const STANDARD_LAYERS = Object.freeze(['star','planet']);
export const PLANET_STANDARD_LAYERS = Object.freeze(['planet','moon','satellite']);

const equal = (a, values) => a.size === values.length && values.every(v => a.has(v));
const defaultTypes = view => view === 'planet' ? PLANET_STANDARD_LAYERS : STANDARD_LAYERS;

/** Independent filter and display settings for each scene. */
export function createViewSettings(view = 'solar') {
  return {
    orbits:true, orbitContrast:false, labels:true,
    lighting:view === 'planet' ? 'realistic' : 'optimized', fourMoons:view !== 'planet',
    scaleObjects:false, scaleOrbits:false, row:false, rowOrder:'size',
    layers:layerPreset('standard',view)
  };
}

/** Four Layer presentation buttons manage five settings; Objekt/Bahn/Reihe are separate. */
export const DISPLAY_SETTING_KEYS = Object.freeze(['labels','lighting','fourMoons','orbits','orbitContrast']);

/** ON means realistic lighting, unrestricted moons and visible high-contrast orbits. */
export function displayPreset(name = 'standard', view = 'solar') {
  if(name === 'all')return {labels:true,lighting:'realistic',fourMoons:false,orbits:true,orbitContrast:true};
  const defaults=createViewSettings(view);
  return Object.fromEntries(DISPLAY_SETTING_KEYS.map(key=>[key,defaults[key]]));
}

/** A highlighted preset must match both its categories and its presentation. */
export function displayMatchesPreset(settings, name = 'standard', view = 'solar') {
  const preset=displayPreset(name,view);
  return DISPLAY_SETTING_KEYS.every(key=>settings?.[key]===preset[key]);
}

/** Four largest natural moons *per parent* by catalog radius, not by distance or name. */
export function largestMoonIds(bodies, maximum = 4) {
  const groups = new Map();
  for (const body of bodies) {
    if (body.type !== 'moon') continue;
    const parentId = body.parentId;
    if (!groups.has(parentId)) groups.set(parentId, []);
    groups.get(parentId).push(body);
  }
  const ids = new Set();
  for (const moons of groups.values()) {
    moons.sort((a,b) => (Number(b.radiusKm) || 0) - (Number(a.radiusKm) || 0)
      || String(a.id).localeCompare(String(b.id)));
    for (const moon of moons.slice(0, Math.max(0, maximum))) ids.add(moon.id);
  }
  return ids;
}

/** Presets apply to the view's full state, even when a selected planet has no satellites. */
export function layerPreset(name = 'standard', view = 'solar') {
  const mode = name === 'all' ? 'all' : 'standard';
  return {mode, types: new Set(mode === 'all' ? LAYER_TYPES : defaultTypes(view))};
}

/** Only show types present in this isolated planet or dwarf-planet scene. */
export function availableLayerTypes(bodies, view = 'solar', planetId = null) {
  if (view !== 'planet') return LAYER_TYPES;
  const center = bodies.find(body => body.id === planetId && (body.type === 'planet' || body.type === 'dwarf'));
  if (!center) return ['planet'];
  const present = new Set([center.type]);
  for (const body of bodies) {
    if (body.parentId === planetId && LAYER_TYPES.includes(body.type)) present.add(body.type);
  }
  return LAYER_TYPES.filter(type => present.has(type));
}

export function layerEnabled(selection, type) {
  // Older renderer tests and embedding contexts may not supply a selection.
  if (!selection) return true;
  if (selection.mode === 'all') return true;
  return selection.types instanceof Set ? selection.types.has(type) :
    Array.isArray(selection.types) ? selection.types.includes(type) : true;
}

/** Restore a visible category if a different planet has no matching child types. */
export function ensureAvailableSelection(selection, available, view = 'solar') {
  if (!available.length || available.some(type => layerEnabled(selection,type))) return selection;
  return updateLayerSelection(selection,available.includes('planet') ? 'planet' : available[0],true,view,available);
}

/** Immutable changes; a preset is recognised relative to the active view. */
export function updateLayerSelection(previous, type, checked, view = 'solar', available = LAYER_TYPES) {
  if (!LAYER_TYPES.includes(type)) return previous;
  const chosen = new Set(previous?.types || LAYER_TYPES);
  // Also handle calls using the old, now hidden member ids. They operate
  // on the same complete filter group rather than producing split states.
  const filter = type === 'tno' ? 'dwarf' : type === 'binary' ? 'asteroid' : type;
  for (const member of layerFilterMembers(filter)) {
    if (checked) chosen.add(member);
    else chosen.delete(member);
  }
  // Keep at least one category visible in this scene, even if a hidden
  // category (e.g. satellites at Jupiter) stays enabled for other planets.
  if (!chosen.size || !available.some(category => chosen.has(category))) return previous;
  return {
    mode: equal(chosen, LAYER_TYPES) ? 'all' : equal(chosen, defaultTypes(view)) ? 'standard' : 'custom',
    types: chosen
  };
}

export function layerSummary(selection) {
  if (!selection || selection.mode === 'all') return 'Alle';
  if (selection.mode === 'standard') return 'Standard';
  // Report the number of checkboxes, not the number of scientific type ids.
  const types = new Set(selection.types || []);
  const count = LAYER_FILTER_TYPES.filter(filter => layerFilterMembers(filter).some(type => types.has(type))).length;
  return `${count} Layer`;
}
