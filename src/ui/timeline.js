const $ = id => document.getElementById(id);
const HOUR = 1 / 24;
const MINUTE = 1 / 1440;
const YEAR = 365.25;

// Speeds are stored as simulated days per real second. Each view has its own
// logarithmic range; the exact default is an integer slider step.
export const SPEED_STEPS = 240;
export const SPEED_MODES = Object.freeze({
  solar: Object.freeze({min: HOUR, defaultSpeed: 3 * HOUR, max: 10 * YEAR, pivot: 23}),
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

export function syncControls(state) {
  const date=formatLocalDateTime(state.time);
  if($('sim-date-readout').textContent!==date)$('sim-date-readout').textContent=date;
  $('sim-date-readout').setAttribute('datetime',new Date(state.time).toISOString());
  $('play-icon-path').setAttribute('d',state.playing?'M7 5h4v14H7z M14 5h4v14h-4z':'M7 4v16l13-8z');
  $('play-btn').setAttribute('aria-label',state.playing?'Simulation pausieren':'Simulation starten');
  $('play-btn').setAttribute('aria-pressed',String(state.playing));
  const mode=state.timelineMode||'solar';
  const speed=formatSpeed(state.speed);
  $('speed-readout').textContent=speed;
  $('speed-popover-value').textContent=speed;
  $('speed').value=String(stepForSpeed(mode,state.speed));
  $('speed').setAttribute('aria-valuetext',speed);
  $('speed-min-label').textContent=formatSpeed(SPEED_MODES[mode].min);
  $('speed-max-label').textContent=formatSpeed(SPEED_MODES[mode].max);
  $('speed-btn').setAttribute('aria-label',`Geschwindigkeit: ${speed}. Regler öffnen`);
}
