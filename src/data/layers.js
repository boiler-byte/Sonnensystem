/** v15: shared layer choices used by the list, rendered objects, labels, and orbits. */
export const LAYER_TYPES = Object.freeze(['planet','moon','dwarf','asteroid','satellite','comet','probe','star']);
export const STANDARD_LAYERS = Object.freeze(['planet','moon','star']);

const equal = (a, values) => a.size === values.length && values.every(v => a.has(v));

export function layerPreset(name = 'standard') {
  const mode = name === 'all' ? 'all' : 'standard';
  return {mode, types: new Set(mode === 'all' ? LAYER_TYPES : STANDARD_LAYERS)};
}

export function layerEnabled(selection, type) {
  // Older renderer tests and embedding contexts may not supply a v15 selection.
  if (!selection) return true;
  if (selection.mode === 'all') return true;
  return selection.types instanceof Set ? selection.types.has(type) :
    Array.isArray(selection.types) ? selection.types.includes(type) : true;
}

export function updateLayerSelection(previous, type, checked) {
  if (!LAYER_TYPES.includes(type)) return previous;
  const chosen = new Set(previous?.types || LAYER_TYPES);
  if (checked) chosen.add(type);
  else chosen.delete(type);
  // Keep at least one category visible; the UI never gets stuck with an empty screen.
  if (!chosen.size) return previous;
  return {
    mode: equal(chosen, LAYER_TYPES) ? 'all' : equal(chosen, STANDARD_LAYERS) ? 'standard' : 'custom',
    types: chosen
  };
}

export function layerSummary(selection) {
  if (!selection || selection.mode === 'all') return 'Alle';
  if (selection.mode === 'standard') return 'Standard';
  const n=selection.types.size;
  return `${n} Layer`;
}
