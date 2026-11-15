/**
 * Sonnensystem / Zero-dependency development and production server.
 * Node.js >= 20. Calls to all four providers run SERVER-SIDE (no browser CORS issues).
 * Caches and serializes JPL queries to respect NASA/JPL fair-use rules.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
try {
  const env = await readFile(join(ROOT, '.env'), 'utf8');
  for (const line of env.split(/\r?\n/)) {
    const found = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (found && !(found[1] in process.env)) process.env[found[1]] = found[2].replace(/^['"]|['"]$/g, '');
  }
} catch { /* .env is optional */ }
const PORT = Number(process.env.PORT) || 4173;
const KEY = process.env.SOLAR_SYSTEM_API_KEY || '';
const NASA_CONTACT = (process.env.NASA_CONTACT_EMAIL || '').trim();
const NASA_CONTACT_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(NASA_CONTACT);
const userAgent = `Sonnensystem/2.0 (contact: ${NASA_CONTACT || 'not-configured'})`;
const cache = new Map();
let nasaQueue = Promise.resolve();

function json(res, status, data) {
  const output = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(output);
}
const err = (status, message) => ({ status, error: message });
function enqueueNASA(task) {
  const pending = nasaQueue.then(task, task);
  nasaQueue = pending.catch(() => {});
  return pending;
}
async function upstream(url, headers={}) {
  const response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(22000), redirect:'follow' });
  if (!response.ok) throw new Error(`Datenquelle meldet HTTP ${response.status}`);
  const length = Number(response.headers.get('content-length') || '0');
  if (length > 7_000_000) throw new Error('Antwort der Datenquelle zu groß');
  const raw = await response.text();
  if (raw.length > 7_000_000) throw new Error('Antwort der Datenquelle zu groß');
  try { return JSON.parse(raw); } catch { throw new Error('Datenquelle lieferte kein gültiges JSON'); }
}
async function cached(key, ttlMs, load) {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiry > now) {
    if (entry.value) return entry.value;
    if (entry.error) throw entry.error;
    if (entry.pending) return entry.pending;
  }
  const pending = Promise.resolve().then(load);
  cache.set(key, { pending, expiry: now + ttlMs });
  try {
    const value = await pending;
    cache.set(key, { value, expiry: Date.now() + ttlMs });
    return value;
  } catch (error) {
    // Negative caching: do not hammer unavailable services.
    cache.set(key, { error, expiry: Date.now() + 5 * 60_000 });
    throw error;
  }
}
function describeError(error) {
  if (error.name === 'TimeoutError' || error.name === 'AbortError') return 'Zeitüberschreitung bei der Datenquelle';
  return (error.message || 'Unbekannter Verbindungsfehler').slice(0, 180);
}
function validAsteroid(s) { return typeof s === 'string' && s.length >= 1 && s.length <= 56 && /^[\p{L}\p{N} .()\-+\/]+$/u.test(s); }
function parseVector(text) {
  const start = text.indexOf('$$SOE');
  const end = text.indexOf('$$EOE');
  if (start < 0 || end < start) throw new Error('Horizons lieferte keine Ephemeriden für dieses Datum');
  const area = text.slice(start, end);
  const match = area.match(/\bX\s*=\s*([+\-.\deE]+)[\s\S]{0,140}?\bY\s*=\s*([+\-.\deE]+)[\s\S]{0,140}?\bZ\s*=\s*([+\-.\deE]+)/);
  if (!match) throw new Error('Horizons-Vektorformat nicht erkannt');
  const values = match.slice(1, 4).map(Number);
  if (!values.every(Number.isFinite)) throw new Error('Ungültige Horizons-Koordinaten');
  return values;
}
async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method !== 'GET') return json(res, 405, err(405, 'Nur GET ist erlaubt'));
  try {
    if (url.pathname === '/api/status') {
      return json(res, 200, { online:true, solarKeyConfigured: Boolean(KEY), nasaContactConfigured: NASA_CONTACT_OK, providers: ['Solar System OpenData','NASA/JPL SBDB','NASA/JPL Horizons','CelesTrak'], date: new Date().toISOString() });
    }
    if (url.pathname === '/api/bodies') {
      if (!KEY) return json(res, 503, err(503, 'SOLAR_SYSTEM_API_KEY fehlt. Die App verwendet den eingebauten Katalog.'));
      const result = await cached('bodies', 24*60*60_000, () => upstream('https://api.le-systeme-solaire.net/rest/bodies/', { Authorization: `Bearer ${KEY}` }));
      const bodies = Array.isArray(result) ? result : result.bodies;
      if (!Array.isArray(bodies)) throw new Error('Unbekanntes OpenData-Antwortformat');
      return json(res, 200, { bodies, provider:'Solar System OpenData', fetchedAt:new Date().toISOString() });
    }
    if (url.pathname === '/api/sbdb') {
      if (!NASA_CONTACT_OK) return json(res,503,err(503,'NASA_CONTACT_EMAIL fehlt: Für NASA/JPL-Abfragen eine gültige Kontaktadresse in .env eintragen.'));
      const sstr = (url.searchParams.get('sstr') || '').trim();
      if (!validAsteroid(sstr)) return json(res, 400, err(400, 'Ungültiger Asteroidenname (1–56 Zeichen)'));
      const target = new URL('https://ssd-api.jpl.nasa.gov/sbdb.api');
      target.search = new URLSearchParams({ sstr, 'full-prec':'1', 'phys-par':'1' }).toString();
      const result = await cached('sbdb:'+sstr.toLowerCase(), 7*24*60*60_000, () => enqueueNASA(() => upstream(target)));
      return json(res, 200, { ...result, provider:'NASA/JPL SBDB' });
    }
    if (url.pathname === '/api/satellites') {
      // CelesTrak advises fetching GP data no more than once per 2h.
      const result = await cached('celestrak-stations', 2*60*60_000, () => upstream('https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=JSON'));
      if (!Array.isArray(result)) throw new Error('CelesTrak lieferte keine JSON-Liste');
      return json(res, 200, { satellites:result.slice(0,100),provider:'CelesTrak',fetchedAt:new Date().toISOString() });
    }
    if (url.pathname === '/api/horizons') {
      if (!NASA_CONTACT_OK) return json(res,503,err(503,'NASA_CONTACT_EMAIL fehlt: Für NASA/JPL-Abfragen eine gültige Kontaktadresse in .env eintragen.'));
      const target = url.searchParams.get('target') || '';
      const date = url.searchParams.get('date') || '';
      const allowed = new Set(['199','299','399','499','599','699','799','899','999','301']);
      if (!allowed.has(target)) return json(res, 400, err(400,'Horizons-Ziel nicht unterstützt'));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date+'T00:00:00Z'))) return json(res, 400,err(400,'Ungültiges Datum'));
      const dt = new Date(date+'T00:00:00Z');
      if (dt.getUTCFullYear() < 1900 || dt.getUTCFullYear() > 2100) return json(res,400,err(400,'Datum außerhalb des unterstützten Bereichs'));
      const next = new Date(dt.getTime() + 3600_000);
      const fmt = (d) => d.toISOString().slice(0,16).replace('T',' ');
      const params = new URLSearchParams({
        format:'json', COMMAND:`'${target}'`, OBJ_DATA:'NO', MAKE_EPHEM:'YES', EPHEM_TYPE:'VECTORS',
        CENTER: target === '301' ? "'500@399'" : "'500@10'", REF_PLANE:'ECLIPTIC',
        START_TIME:`'${fmt(dt)}'`, STOP_TIME:`'${fmt(next)}'`, STEP_SIZE:"'1 h'", OUT_UNITS:'KM-S',
        VEC_TABLE:'2', CSV_FORMAT:'NO'
      });
      const queryUrl = `https://ssd.jpl.nasa.gov/api/horizons.api?${params}`;
      const result = await cached(`horizons:${target}:${date}`, 7*24*60*60_000, () => enqueueNASA(() => upstream(queryUrl)));
      if (result.error) throw new Error(String(result.error));
      const [xKm,yKm,zKm] = parseVector(result.result || '');
      return json(res, 200, { provider:'NASA/JPL Horizons', target,date, center: target === '301' ? 'earth' : 'sun',frame:'ecliptic',xKm,yKm,zKm });
    }
    // Serve only explicitly allowlisted app assets, including PWA files. No path traversal.
    const files = { '/':'index.html','/index.html':'index.html','/app.js':'app.js','/data.js':'data.js','/renderer.js':'renderer.js','/styles.css':'styles.css','/favicon.svg':'favicon.svg', '/manifest.webmanifest':'manifest.webmanifest', '/sw.js':'sw.js', '/icons/icon-192.png':'icons/icon-192.png', '/icons/icon-512.png':'icons/icon-512.png', '/icons/icon-180.png':'icons/icon-180.png' };
    const file = files[url.pathname];
    if (!file) return json(res,404,err(404,'Nicht gefunden'));
    const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
    const bytes = await readFile(join(ROOT,file));
    res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream','Cache-Control':url.pathname==='/sw.js'?'no-store':'no-cache','X-Content-Type-Options':'nosniff'});
    res.end(bytes);
  } catch (error) {
    console.error('[Sonnensystem]', url.pathname, describeError(error));
    json(res,502,err(502,describeError(error)));
  }
}
createServer(handler).listen(PORT, '0.0.0.0', () => {
  console.log(`\n  Sonnensystem / WebGL & PWA: http://localhost:${PORT}\n`);
  console.log(`  Solar OpenData: ${KEY ? 'API-Key konfiguriert' : 'Ohne Key (integrierte Startdaten)'}\n`);
});
