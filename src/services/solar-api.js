import { fetchJSON } from './api.js';
import { normalizeSolar } from '../data/normalization.js';

export async function fetchSolarBodies(lookupExisting) {
 const response=await fetchJSON('/api/bodies');
 return response.bodies.map(body=>normalizeSolar(body,lookupExisting)).filter(Boolean);
}
