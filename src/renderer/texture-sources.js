/** V12: exclusively local user-provided textures; no external URLs or proxy. */
export const TEXTURE_TIERS=Object.freeze({mobile:512,standard:2048,detail:4096});
const ID=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function textureSource(id,tier='standard') {
  if(typeof id!=='string'||!ID.test(id)||!Object.hasOwn(TEXTURE_TIERS,tier))return null;
  return Object.freeze({id,tier,width:TEXTURE_TIERS[tier],credit:'Lokale Textur · textures/standard',kind:'local'});
}
const ALIASES=Object.freeze({
  sun:['2k_sun.jpg'],mercury:['2k_mercury.jpg'],venus:['2k_venus_atmosphere.jpg'],
  earth:['2k_earth_daymap.jpg'],mars:['2k_mars.jpg'],jupiter:['2k_jupiter.jpg'],
  saturn:['2k_saturn.jpg'],uranus:['2k_uranus.jpg'],neptune:['2k_neptune.jpg'],
  moon:['2k_moon.jpg'],phobos:['mar1kuu2.jpg'],deimos:['mar2kuu2.jpg'],
  io:['jup1vss2.jpg'],europa:['jup2vss2.jpg'],ganymede:['jup3vss2.jpg'],
  callisto:['jup4vss2.jpg'],enceladus:['sat2vss2.jpg'],titan:['Titan_VIMS-ISS.jpg']
});
/** Basenames use catalog IDs; support jpg/png/webp and keep standard as single source of truth. */
export function texturePaths(id,tier='standard') {
  if(!textureSource(id,tier))return [];
  return [...['jpg','jpeg','png','webp'].map(ext=>`/textures/standard/${id}.${ext}`),...(ALIASES[id]||[]).map(name=>`/textures/standard/${name}`)];
}
export function texturePath(id,tier='standard'){return texturePaths(id,tier)[0]||null;}
export function textureTier({isMobile=false,planetId=null}={},bodyId){
  return isMobile?'mobile':planetId?'detail':'standard';
}
