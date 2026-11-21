const $ = id => document.getElementById(id);
const HOUR = 1 / 24;
const MINUTE = 1 / 1440;
const YEAR = 365.25;

// Speeds are stored as simulated days per real second. Each view has its own
// logarithmic range; the exact default is an integer slider step.
export const SPEED_STEPS = 240;
export const ROW_SIMULATION_SPEED = 30 / 1440; // 30 simulated minutes per real second.

/** Row-only speed override; the saved speed for each scene is never changed. */
export function effectiveSimulationSpeed(state) {
  return state?.settings?.row === true ? ROW_SIMULATION_SPEED : state.speed;
}

export const SPEED_MODES = Object.freeze({
  solar: Object.freeze({min: HOUR, defaultSpeed: 5, max: 10 * YEAR, pivot: 101}),
  planet: Object.freeze({min: MINUTE, defaultSpeed: HOUR, max: YEAR, pivot: 75})
});

export function speedAtStep(mode, step) {
  const range = SPEED_MODES[mode];
  if (!range) throw new RangeError('Unbekannte Zeitansicht');
  const i = Math.max(0, Math.min(SPEED_STEPS, Math.round(Number(step) || 0)));
  if (i <= range.pivot) return range.min * (range.defaultSpeed / range.min) ** (i / range.pivot);
  return range.defaultSpeed * (range.max / range.defaultSpeed) ** ((i - range.pivot) / (SPEED_STEPS - range.pivot));
}

export function stepForSpeed(mode, speed) {
  const range = SPEED_MODES[mode];
  if (!range) throw new RangeError('Unbekannte Zeitansicht');
  if (!(speed > range.min)) return 0;
  if (speed >= range.max) return SPEED_STEPS;
  return Math.round(speed <= range.defaultSpeed
    ? range.pivot * Math.log(speed / range.min) / Math.log(range.defaultSpeed / range.min)
    : range.pivot + (SPEED_STEPS - range.pivot) * Math.log(speed / range.defaultSpeed) / Math.log(range.max / range.defaultSpeed));
}

export function formatSpeed(daysPerSecond) {
  if (!(daysPerSecond > 0)) return '0 · pausiert';
  let value, unit;
  if (daysPerSecond < HOUR) {value = daysPerSecond * 1440; unit = 'Min.';}
  else if (daysPerSecond < 1) {value = daysPerSecond * 24; unit = 'Std.';}
  else if (daysPerSecond < YEAR) {value = daysPerSecond; unit = 'Tage';}
  else {value = daysPerSecond / YEAR; unit = value === 1 ? 'Jahr' : 'Jahre';}
  const digits = value < 10 ? 2 : value < 100 ? 1 : 0;
  return `${new Intl.NumberFormat('de-DE', {maximumFractionDigits: digits}).format(value)} ${unit} / s`;
}

/** Remember user-selected speeds independently for heliocentric/planet views. */
export function syncSpeedMode(state, mode) {
  if (!SPEED_MODES[mode]) throw new RangeError('Unbekannte Zeitansicht');
  if (state.timelineMode === mode) return false;
  state.modeSpeeds ??= {};
  if (state.timelineMode) state.modeSpeeds[state.timelineMode] = state.speed;
  state.timelineMode = mode;
  state.speed = state.modeSpeeds[mode] ?? SPEED_MODES[mode].defaultSpeed;
  return true;
}

/** Browser-local time, never forced to UTC. */
export function formatLocalDateTime(value) {
  const d=new Date(value);
  const two=n=>String(n).padStart(2,'0');
  return `${two(d.getDate())}.${two(d.getMonth()+1)}.${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
}

/** Date-only formatter retained for compatibility with existing callers. */
export function formatLocalDate(value) {
  return formatLocalDateTime(value).slice(0, 10);
}

/** Keep the single time control in Layer Control in sync with the simulation. */
export function syncControls(state) {
  const date=formatLocalDateTime(state.time);
  const mode=state.timelineMode||'solar';
  const speed=formatSpeed(state.speed);
  const layerPlay=$('layer-play-btn');
  layerPlay.setAttribute('aria-label',state.playing?'Simulation pausieren':'Simulation starten');
  layerPlay.setAttribute('aria-pressed',String(state.playing));
  layerPlay.title=state.playing?'Simulation pausieren':'Simulation starten';
  $('layer-play-icon-path').setAttribute('d',state.playing?'M7 5h4v14H7z M14 5h4v14h-4z':'M7 4v16l13-8z');
  $('layer-play-label').textContent=state.playing?'Pause':'Play';
  const layerDate=$('layer-sim-date');
  if(layerDate.textContent!==date)layerDate.textContent=date;
  layerDate.setAttribute('datetime',new Date(state.time).toISOString());
  const step=stepForSpeed(mode,state.speed);
  const slider=$('layer-speed');
  slider.value=String(step);
  slider.setAttribute('style',`--speed-progress:${100*step/SPEED_STEPS}%`);
  slider.setAttribute('aria-valuetext',speed);
  $('layer-speed-value').textContent=speed;
  $('layer-speed-min-label').textContent=formatSpeed(SPEED_MODES[mode].min);
  $('layer-speed-max-label').textContent=formatSpeed(SPEED_MODES[mode].max);
}
