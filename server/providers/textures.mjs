/** Allowlisted image proxy with a persistent private disk cache (no arbitrary URLs). */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {ROOT,userAgent} from '../config.mjs';
import {textureSourceFromPath} from '../../src/renderer/texture-sources.js';

const CACHE_DIR=join(ROOT,'.texture-cache');
const MAX_IMAGE_BYTES=28*1024*1024;
const inflight=new Map();
const allowedHosts=new Set([
  'www.solarsystemscope.com','space.jpl.nasa.gov','maps.jpl.nasa.gov','data.caltech.edu','svs.gsfc.nasa.gov'
]);

function cachePath(source){return join(CACHE_DIR,`${source.id}-${source.tier}.jpg`);}
export function textureAllowed(path){return textureSourceFromPath(path);}

async function download(source){
  const url=new URL(source.url);
  if(url.protocol!=='https:'||!allowedHosts.has(url.hostname))throw Error('Texturquelle nicht zugelassen');
  const response=await fetch(url,{headers:{'User-Agent':userAgent,Accept:'image/jpeg,image/*;q=0.8'},
    signal:AbortSignal.timeout(45000),redirect:'follow'});
  if(!response.ok)throw Error(`Texturdienst: HTTP ${response.status}`);
  const type=response.headers.get('content-type')||'';
  if(!/^(image\/(jpeg|jpg)|application\/octet-stream)(;|$)/i.test(type))throw Error('Texturdienst: JPEG erwartet');
  const contentLength=Number(response.headers.get('content-length')||0);
  if(contentLength>MAX_IMAGE_BYTES)throw Error('Texturdatei zu groß');
  const reader=response.body?.getReader();
  if(!reader)throw Error('Keine Bilddaten empfangen');
  const chunks=[];let length=0;
  try{
    for(;;){
      const {done,value}=await reader.read();if(done)break;
      length+=value.byteLength;
      if(length>MAX_IMAGE_BYTES)throw Error('Texturdatei zu groß');
      chunks.push(value);
    }
  }catch(error){await reader.cancel().catch(()=>{});throw error;}
  const bytes=Buffer.concat(chunks.map(x=>Buffer.from(x)),length);
  // A JPEG must have SOI and EOI markers; avoid caching HTML/error bodies.
  if(length<64||bytes[0]!==0xff||bytes[1]!==0xd8||bytes[length-2]!==0xff||bytes[length-1]!==0xd9)
    throw Error('Ungültiges JPEG');
  await mkdir(CACHE_DIR,{recursive:true}).then(()=>writeFile(cachePath(source),bytes)).catch(()=>{});
  return bytes;
}
export async function textureAsset(pathname){
  const source=textureAllowed(pathname);
  if(!source)return null;
  const filepath=cachePath(source);
  try{return await readFile(filepath);}catch(error){if(error.code!=='ENOENT')throw error;}
  const key=filepath;
  if(!inflight.has(key))inflight.set(key,download(source).finally(()=>inflight.delete(key)));
  return inflight.get(key);
}
