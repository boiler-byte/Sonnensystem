/** Local, same-origin texture tiers. Paths are resolved in visual-quality order. */
export const TEXTURE_TIERS=Object.freeze({mobile:512,standard:2048,high:4096});
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PRIORITY=Object.freeze({
  mobile:['mobile','standard','high'],
  standard:['standard','high','mobile'],
  high:['high','standard','mobile']
});
export const TEXTURE_FILE_PATH=/^\/textures\/(?:mobile|standard|high)\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.webp$/;
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
/** Search only for WebP files; fall back between mobile/standard/high.
 * Legacy 2K basename aliases are accepted only in standard/ (as .webp).
 */
export function texturePaths(id,tier='standard'){
  if(!textureSource(id,tier))return [];
  const paths=[];
  for(const folder of PRIORITY[tier]){
    paths.push(`/textures/${folder}/${id}.webp`);
    if(folder==='standard')for(const alias of ALIASES[id]||[])paths.push(`/textures/standard/${alias}.webp`);
  }
  return paths;
}
export function texturePath(id,tier='standard'){return texturePaths(id,tier)[0]||null;}
/** Map the server's canonical /textures/ manifest key to this app installation.
 * import.meta.url keeps nested GitHub Pages deployments independent of the
 * page URL, document base, and repository name.
 */
const APP_ROOT=new URL('../../',import.meta.url);
export function textureRequestUrl(path,appRoot=APP_ROOT){
  if(typeof path!=='string'||!TEXTURE_FILE_PATH.test(path))return null;
  return new URL(path.slice(1),appRoot).href;
}
export function textureTier({isMobile=false}={}){
  // Canonical catalog paths: mobile/<id>.webp and standard/<id>.webp.
  // The legacy high/ tier is still available as a fallback for older installs.
  return isMobile?'mobile':'standard';
}
