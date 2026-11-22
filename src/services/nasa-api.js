import { fetchJSON } from './api.js';

export const fetchHorizons=(target,date)=>fetchJSON(`api/horizons?target=${encodeURIComponent(target)}&date=${encodeURIComponent(date)}`);
