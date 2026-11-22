import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT=fileURLToPath(new URL('../',import.meta.url));
try{
  const env=await readFile(join(ROOT,'.env'),'utf8');
  for(const line of env.split(/\r?\n/)){
    const found=line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if(found&&!(found[1] in process.env))process.env[found[1]]=found[2].replace(/^['"]|['"]$/g,'');
  }
}catch{/* .env is optional */}

export const PORT=Number(process.env.PORT)||4173;
export const NASA_CONTACT=(process.env.NASA_CONTACT_EMAIL||'').trim();
export const NASA_CONTACT_OK=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(NASA_CONTACT);
// Keep the server-side API user agent in sync with the released package.
const release=JSON.parse(await readFile(join(ROOT,'package.json'),'utf8')).version;
export const userAgent=`Sonnensystem/${release} (contact: ${NASA_CONTACT||'not-configured'})`;
