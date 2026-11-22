import { cached,enqueueNASA } from '../cache/memory.mjs';
import { upstream } from './http.mjs';

export const ALLOWED_HORIZONS_TARGETS=new Set(['199','299','399','499','599','699','799','899','999','301']);
export function validHorizonsDate(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const parsed=new Date(date+'T00:00:00Z');
  return Number.isFinite(parsed.getTime())&&parsed.getUTCFullYear()>=1900&&parsed.getUTCFullYear()<=2100;
}
export function parseVector(text){
  const start=text.indexOf('$$SOE'),end=text.indexOf('$$EOE');
  if(start<0||end<start)throw Error('Horizons lieferte keine Ephemeriden für dieses Datum');
  const match=text.slice(start,end).match(/\bX\s*=\s*([+\-.\deE]+)[\s\S]{0,140}?\bY\s*=\s*([+\-.\deE]+)[\s\S]{0,140}?\bZ\s*=\s*([+\-.\deE]+)/);
  if(!match)throw Error('Horizons-Vektorformat nicht erkannt');
  const numbers=match.slice(1,4).map(Number);
  if(!numbers.every(Number.isFinite))throw Error('Ungültige Horizons-Koordinaten');
  return numbers;
}
export async function horizons(target,date){
  const dt=new Date(date+'T00:00:00Z');
  const next=new Date(dt.getTime()+3600_000);
  const fmt=d=>d.toISOString().slice(0,16).replace('T',' ');
  const params=new URLSearchParams({
    format:'json',COMMAND:`'${target}'`,OBJ_DATA:'NO',MAKE_EPHEM:'YES',EPHEM_TYPE:'VECTORS',
    CENTER:target==='301'?"'500@399'":"'500@10'",REF_PLANE:'ECLIPTIC',
    START_TIME:`'${fmt(dt)}'`,STOP_TIME:`'${fmt(next)}'`,STEP_SIZE:"'1 h'",OUT_UNITS:'KM-S',
    VEC_TABLE:'2',CSV_FORMAT:'NO'
  });
  const response=await cached(`horizons:${target}:${date}`,7*24*60*60_000,
    ()=>enqueueNASA(()=>upstream(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`)));
  if(response.error)throw Error(String(response.error));
  const [xKm,yKm,zKm]=parseVector(response.result||'');
  return {provider:'NASA/JPL Horizons',target,date,center:target==='301'?'earth':'sun',frame:'ecliptic',xKm,yKm,zKm};
}
