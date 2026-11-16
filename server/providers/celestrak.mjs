import { cached } from '../cache/memory.mjs';
import { upstream } from './http.mjs';

export async function stationSatellites(){
  // CelesTrak asks to fetch GP data no more than once every two hours.
  const result=await cached('celestrak-stations',2*60*60_000,()=>upstream(
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=STATIONS&FORMAT=JSON'
  ));
  if(!Array.isArray(result))throw Error('CelesTrak lieferte keine JSON-Liste');
  return result.slice(0,100);
}
