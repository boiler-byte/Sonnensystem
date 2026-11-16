import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './config.mjs';

const WEB_ROOT=ROOT;
const SRC=join(ROOT,'src');
const fixed=new Map([
  ['/','index.html'],['/index.html','index.html'],['/favicon.svg','favicon.svg'],
  ['/manifest.webmanifest','manifest.webmanifest'],['/sw.js','sw.js'],
  ['/css/styles.css','css/styles.css'],
  ['/icons/icon-180.png','icons/icon-180.png'],
  ['/icons/icon-192.png','icons/icon-192.png'],
  ['/icons/icon-512.png','icons/icon-512.png']
]);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.webmanifest':'application/manifest+json','.json':'application/json; charset=utf-8'};
/** Only allowlisted root assets and importable ES modules are exposed; config/server/tests stay private. */
export async function staticAsset(pathname){
  let filename,ext;
  if(fixed.has(pathname)){
    const resource=fixed.get(pathname);
    filename=join(WEB_ROOT,resource);
    ext=resource.slice(resource.lastIndexOf('.'));
  }else if(/^\/src\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.js$/.test(pathname)){
    filename=join(SRC,pathname.slice('/src/'.length));ext='.js';
  }else if(/^\/data\/(?:catalog|editorial)\/[a-z0-9-]+\.json$/.test(pathname)){
    filename=join(WEB_ROOT,pathname.slice(1));ext='.json';
  }else if(/^\/textures\/standard\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:jpg|jpeg|png|webp)$/.test(pathname)){
    filename=join(WEB_ROOT,pathname.slice(1));ext=pathname.slice(pathname.lastIndexOf('.'));
  }else return null;
  try{
    const bytes=await readFile(filename);
    return {bytes,type:mime[ext]||'application/octet-stream',cacheControl:pathname==='/sw.js'?'no-store':'no-cache'};
  }catch(error){if(error.code==='ENOENT')return null;throw error;}
}
