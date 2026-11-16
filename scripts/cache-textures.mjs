/** Optional: pre-download NASA/JPL/USGS + Solar System Scope textures for offline use. */
import {TEXTURE_SOURCES,texturePath} from '../src/renderer/texture-sources.js';
import {textureAsset} from '../server/providers/textures.mjs';

const tier=process.argv.includes('--detail')?'detail':'standard';
let ok=0,failed=0;
for(const id of Object.keys(TEXTURE_SOURCES)){
  try{
    const data=await textureAsset(texturePath(id,tier));
    console.log(`${id}: ${Math.round(data.length/1024)} KiB (${tier})`);ok++;
  }catch(error){console.warn(`${id}: ${error.message}`);failed++;}
}
console.log(`${ok} Texturen gespeichert, ${failed} fehlgeschlagen. Speicherort: .texture-cache/`);
if(failed)process.exitCode=1;
