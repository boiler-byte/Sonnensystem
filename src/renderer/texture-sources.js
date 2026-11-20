/** Local, same-origin texture tiers. Paths are resolved in visual-quality order. */
export const TEXTURE_TIERS=Object.freeze({mobile:512,standard:2048,high:4096});
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EXTENSIONS=Object.freeze(['webp','jpg','jpeg','png']);
const PRIORITY=Object.freeze({
  mobile:['mobile','standard','high'],
  standard:['standard','high','mobile'],
  high:['high','standard','mobile']
});
export const TEXTURE_FILE_PATH=/^\/textures\/(?:mobile|standard|high)\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.(?:webp|jpg|jpeg|png)$/;
export function textureSource(id,tier='standard'){
  if(typeof id!=='string'||!ID.test(id)||!Object.hasOwn(TEXTURE_TIERS,tier))return null;
  return Object.freeze({id,tier,width:TEXTURE_TIERS[tier],credit:`Lokale Textur · textures/${tier}`,kind:'local'});
}
const ALIASES=Object.freeze({
  sun:['2k_sun'],mercury:['2k_mercury'],venus:['2k_venus_atmosphere'],
  earth:['2k_earth_daymap'],mars:['2k_mars'],jupiter:['2k_jupiter'],
  saturn:['2k_saturn'],uranus:['2k_uranus'],neptune:['2k_neptune'],
  moon:['2k_moon'],phobos:['mar1kuu2'],deimos:['mar2kuu2'],
  io:['jup1vss2'],europa:['jup2vss2'],ganymede:['jup3vss2'],
  callisto:['jup4vss2'],enceladus:['sat2vss2'],titan:['Titan_VIMS-ISS']
});
/** Prefer WebP in the requested directory, then lower/other tiers as fallback.
 * Legacy 2K source names are accepted only in standard/.
 */
export function texturePaths(id,tier='standard'){
  if(!textureSource(id,tier))return [];
  const paths=[];
  for(const folder of PRIORITY[tier]){
    for(const ext of EXTENSIONS){
      paths.push(`/textures/${folder}/${id}.${ext}`);
      if(folder==='standard')for(const alias of ALIASES[id]||[])paths.push(`/textures/standard/${alias}.${ext}`);
    }
  }
  return paths;
}
export function texturePath(id,tier='standard'){return texturePaths(id,tier)[0]||null;}
export function textureTier({isMobile=false,planetId=null}={}){
  return isMobile?'mobile':planetId?'high':'standard';
}
