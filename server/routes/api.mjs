import {NASA_CONTACT_OK} from '../config.mjs';
import {textureManifest} from '../texture-manifest.mjs';
import {horizons,validHorizonsDate,ALLOWED_HORIZONS_TARGETS} from '../providers/nasa.mjs';

const error=(status,message)=>({status,body:{status,error:message}});
/** Returns null for paths outside /api; otherwise a { status, body } result. */
export async function apiRoute(url){
  const p=url.pathname;
  if(!p.startsWith('/api/'))return null;
  if(p==='/api/textures/manifest')return {status:200,body:await textureManifest()};
  if(p==='/api/status')return {status:200,body:{online:true,nasaContactConfigured:NASA_CONTACT_OK,
    providers:['NASA/JPL Horizons'],date:new Date().toISOString()}};
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
