import { userAgent } from '../config.mjs';
/** Upstream API calls only happen on the server. */
export async function upstream(url,headers={}){
  const response=await fetch(url,{
    headers:{'User-Agent':userAgent,Accept:'application/json',...headers},
    signal:AbortSignal.timeout(22000),redirect:'follow'
  });
  if(!response.ok)throw new Error(`Datenquelle meldet HTTP ${response.status}`);
  const length=Number(response.headers.get('content-length')||'0');
  if(length>7_000_000)throw new Error('Antwort der Datenquelle zu groß');
  const raw=await response.text();
  if(raw.length>7_000_000)throw new Error('Antwort der Datenquelle zu groß');
  try{return JSON.parse(raw);}catch{throw new Error('Datenquelle lieferte kein gültiges JSON');}
}
export function describeError(error){
  if(error.name==='TimeoutError'||error.name==='AbortError')return 'Zeitüberschreitung bei der Datenquelle';
  return(error.message||'Unbekannter Verbindungsfehler').slice(0,180);
}
