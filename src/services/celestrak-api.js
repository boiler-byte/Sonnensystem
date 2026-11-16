import { fetchJSON } from './api.js';
import { normalizeStation } from '../data/normalization.js';

export async function fetchSatellites() {
 const response=await fetchJSON('/api/satellites');
 return response.satellites.map(normalizeStation).filter(Boolean);
}
