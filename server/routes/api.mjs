import { KEY,NASA_CONTACT_OK } from '../config.mjs';
import {textureManifest} from '../texture-manifest.mjs';
import { solarBodies } from '../providers/solar.mjs';
import { stationSatellites } from '../providers/celestrak.mjs';
import { asteroid,horizons,validAsteroid,validHorizonsDate,ALLOWED_HORIZONS_TARGETS } from '../providers/nasa.mjs';

const error=(status,message)=>({status,body:{status,error:message}});
/** Returns null for paths outside /api; otherwise a { status, body } result. */
export async function apiRoute(url){
  const p=url.pathname;
  if(!p.startsWith('/api/'))return null;
  if(p==='/api/textures/manifest')return {status:200,body:await textureManifest()};
  if(p==='/api/status')return {status:200,body:{online:true,solarKeyConfigured:Boolean(KEY),nasaContactConfigured:NASA_CONTACT_OK,
    providers:['Solar System OpenData','NASA/JPL SBDB','NASA/JPL Horizons','CelesTrak'],date:new Date().toISOString()}};
  if(p==='/api/bodies'){
    if(!KEY)return error(503,'SOLAR_SYSTEM_API_KEY fehlt. Die App verwendet den eingebauten Katalog.');
    return {status:200,body:{bodies:await solarBodies(),provider:'Solar System OpenData',fetchedAt:new Date().toISOString()}};
  }
  if(p==='/api/satellites')return {status:200,body:{satellites:await stationSatellites(),provider:'CelesTrak',fetchedAt:new Date().toISOString()}};
  if(p==='/api/sbdb'){
    if(!NASA_CONTACT_OK)return error(503,'NASA_CONTACT_EMAIL fehlt: Für NASA/JPL-Abfragen eine gültige Kontaktadresse in .env eintragen.');
    const term=(url.searchParams.get('sstr')||'').trim();
    if(!validAsteroid(term))return error(400,'Ungültiger Asteroidenname (1–56 Zeichen)');
    return {status:200,body:{...(await asteroid(term)),provider:'NASA/JPL SBDB'}};
  }
  if(p==='/api/horizons'){
    if(!NASA_CONTACT_OK)return error(503,'NASA_CONTACT_EMAIL fehlt: Für NASA/JPL-Abfragen eine gültige Kontaktadresse in .env eintragen.');
    const target=url.searchParams.get('target')||'',date=url.searchParams.get('date')||'';
    if(!ALLOWED_HORIZONS_TARGETS.has(target))return error(400,'Horizons-Ziel nicht unterstützt');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z')))return error(400,'Ungültiges Datum');
    if(!validHorizonsDate(date))return error(400,'Datum außerhalb des unterstützten Bereichs');
    return {status:200,body:await horizons(target,date)};
  }
  return error(404,'Nicht gefunden');
}
