import { fetchJSON } from './api.js';

export const fetchAsteroid=term=>fetchJSON('/api/sbdb?sstr='+encodeURIComponent(term));
export const fetchHorizons=(target,date)=>fetchJSON(`/api/horizons?target=${encodeURIComponent(target)}&date=${encodeURIComponent(date)}`);
