import { TYPES, AU_KM, J2000 } from './bodies.js';

const NAME_MAP = { soleil:'sun',sun:'sun',mercure:'mercury',mercury:'mercury',venus:'venus',terre:'earth',earth:'earth',lune:'moon',moon:'moon',
 mars:'mars',jupiter:'jupiter',saturne:'saturn',saturn:'saturn',uranus:'uranus',neptune:'neptune',neptun:'neptune',pluton:'pluto',pluto:'pluto',
 ceres:'ceres',vesta:'vesta',pallas:'pallas',io:'io',europa:'europa',ganymede:'ganymede',ganymed:'ganymede',callisto:'callisto',kallisto:'callisto',
 titan:'titan',mimas:'mimas',enceladus:'enceladus',rhea:'rhea',iapetus:'iapetus',triton:'triton',charon:'charon',oberon:'oberon',titania:'titania',
 makemake:'makemake',haumea:'haumea',eris:'eris',phobos:'phobos',deimos:'deimos' };
const num=v=>{const a=Number(v);return Number.isFinite(a)?a:null;};
export const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const keyFor=s=>NAME_MAP[clean(s)]||clean(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

export function normalizeSolar(body,existing=null){
  const rawType=clean(body.bodyType);
  const type=body.isPlanet?'planet':rawType.includes('moon')||rawType.includes('satellite')?'moon':rawType.includes('dwarf')?'dwarf':rawType.includes('asteroid')?'asteroid':null;
  if(!type)return null;
  const canonical=keyFor(body.englishName||body.id||body.name);if(!canonical)return null;
  const id=NAME_MAP[clean(body.id)]||canonical;
  const old=existing?.(id)||null;
  let parentId=body.aroundPlanet?.planet?(NAME_MAP[clean(body.aroundPlanet.planet)]||keyFor(body.aroundPlanet.planet)):'sun';
  if(id==='sun')parentId=null;
  const aKm=num(body.semimajorAxis),radius=num(body.meanRadius)||num(body.equaRadius)||old?.radiusKm||5;
  const orbitDays=num(body.sideralOrbit),ecc=num(body.eccentricity),incl=num(body.inclination);
  // Solar System OpenData exposes sidereal rotation in hours. Keep curated
  // catalog values when the API does not supply a finite, nonzero value.
  const liveRotation=body.sideralRotation==null?null:num(body.sideralRotation);
  const liveTilt=body.axialTilt==null?null:num(body.axialTilt);
  const displayName=old?.name||body.englishName||body.name||body.id;
  const idHash=id.split('').reduce((s,c)=>s+c.charCodeAt(0),0);
  return {
    ...(old||{}), id,name:displayName,type,parentId, a:aKm&&aKm>0?(parentId==='sun'?aKm/AU_KM:aKm):(old?.a||0),
    periodDays:orbitDays&&orbitDays!==0?Math.abs(orbitDays):(old?.periodDays||28),radiusKm:radius,
    e:ecc??old?.e??0, i:incl??old?.i??0,node:num(body.longAscNode)??old?.node??0,
    peri:num(body.argPeriapsis)??old?.peri??0,M:num(body.mainAnomaly)??old?.M??idHash%360,
    epoch:old?.epoch||J2000,
    ...((liveRotation!==null && liveRotation!==0) ? {rotationPeriodHours:liveRotation}
      : old?.rotationPeriodHours!==undefined ? {rotationPeriodHours:old.rotationPeriodHours} : {}),
    ...((liveTilt!==null && liveTilt>=0 && liveTilt<=180) ? {axialTiltDeg:liveTilt}
      : old?.axialTiltDeg!==undefined ? {axialTiltDeg:old.axialTiltDeg} : {}),
    color:old?.color||(type==='moon'?'#c0b8a8':type==='dwarf'?'#bbb7bb':'#ad9786'),
    style:old?.style||(type==='moon'?'moon':type==='dwarf'?'ice':'rock'),
    description:old?.description||`${TYPES[type]?.label||'Himmelskörper'} im Sonnensystem. Bahn- und Körperdaten aus Solar System OpenData.`,
    temperatureK:num(body.avgTemp)??old?.temperatureK??null,
    source:'Solar System OpenData', solarId:body.id
  };
}

export function normalizeStation(o){const meanMotion=num(o.MEAN_MOTION),ecc=num(o.ECCENTRICITY),catalog=o.NORAD_CAT_ID;
 if(!(meanMotion>0&&meanMotion<30)||catalog==null)return null;
 const n=meanMotion*2*Math.PI/86400,semimajor=Math.cbrt(398600.4418/(n*n));
 const epoch=Date.parse(o.EPOCH+'Z')||Date.parse(o.EPOCH)||Date.now();
 const name=String(o.OBJECT_NAME||`Satellit ${catalog}`).trim();
 return {id:`sat-${catalog}`,name:catalog==25544?'ISS':name,type:'satellite',parentId:'earth',a:semimajor,
  periodDays:1/meanMotion,radiusKm:0,color:'#75d6c6',style:'rock',e:ecc||0,
  i:num(o.INCLINATION)||0,node:num(o.RA_OF_ASC_NODE)||0,peri:num(o.ARG_OF_PERICENTER)||0,M:num(o.MEAN_ANOMALY)||0,
  epoch,source:'CelesTrak',catalog:Number(catalog),description:`Künstlicher Erdsatellit aus den CelesTrak-General-Perturbations-Daten (NORAD ${catalog}). Die Darstellung verwendet eine vereinfachte Kepler-Näherung.`};
}

function sbdbElements(response){const els=response.orbit?.elements||[];const values=Object.fromEntries(els.map(x=>[x.name,num(x.value)]));
  return values;
}
export function formatAsteroid(response,id,name,existing){
  const v=sbdbElements(response);if(!(v.a>0)&&!existing)throw Error('Kein geeigneter elliptischer Orbit für dieses Objekt');
  const epochJD=num(response.orbit?.epoch),ep=epochJD?(epochJD-2440587.5)*86400000:(existing?.epoch||J2000);
  const phys=response.phys_par||[];const diam=num(phys.find(x=>x.name==='diameter')?.value);
  return { ...(existing||{}), id,name: existing?.name||name,type:'asteroid',parentId:'sun',a:v.a||existing?.a||1,
    periodDays:v.per||existing?.periodDays||365.25, radiusKm:diam?diam/2:(existing?.radiusKm||1),
    color:existing?.color||'#bb9e82',style:'rock',e:v.e??existing?.e??0,i:v.i??existing?.i??0,
    node:v.om??existing?.node??0,peri:v.w??existing?.peri??0,M:v.ma??existing?.M??0,
    epoch:ep,source:'NASA/JPL SBDB',sbdbLoaded:true,
    description:existing?.description||`${name} – Kleinkörper mit Bahnelementen der NASA/JPL Small-Body Database.` };
}
