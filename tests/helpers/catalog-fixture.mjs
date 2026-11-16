/** v6 regressions now use the real, normalized v7 JSON catalog (no duplicate source of truth). */
import { readFile } from 'node:fs/promises';
import { loadCatalog } from '../../src/data/catalog.js';
const readJSON = async path => JSON.parse(await readFile(new URL('../../'+path.slice(2),import.meta.url),'utf8'));
export const INITIAL_BODIES = (await loadCatalog(readJSON)).bodies;
