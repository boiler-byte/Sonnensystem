import { KEY } from '../config.mjs';
import { cached } from '../cache/memory.mjs';
import { upstream } from './http.mjs';

export async function solarBodies(){
  const result=await cached('bodies',24*60*60_000,()=>upstream(
    'https://api.le-systeme-solaire.net/rest/bodies/',{Authorization:`Bearer ${KEY}`}
  ));
  const bodies=Array.isArray(result)?result:result.bodies;
  if(!Array.isArray(bodies))throw Error('Unbekanntes OpenData-Antwortformat');
  return bodies;
}
