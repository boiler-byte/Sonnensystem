/**
 * v8 catalog boundary. Astronomical data and editorial copy live in independent,
 * versioned JSON documents. Only this module adapts them to the legacy flat
 * renderer model (a, e, i, node, peri, M, epoch, radiusKm, description).
 */
import { TYPES } from './bodies.js';

export const CATALOG_MANIFEST = './data/catalog/manifest.json';
export const DATA_SCHEMA_VERSION = 1;
const pathPattern = /^\.\/data\/(catalog|editorial)\/[a-z0-9-]+\.json$/;
const idPattern = /^[a-z][a-z0-9-]*$/;
const statusSet = new Set(['draft','imported','published']);
const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const okNumber = n => typeof n === 'number' && Number.isFinite(n);
function ensure(condition, message) { if (!condition) throw new Error(`Katalog: ${message}`); }
function validString(v) { return typeof v === 'string' && v.trim().length > 0; }
function checkVersion(doc, where) { ensure(isObj(doc) && doc.schemaVersion === DATA_SCHEMA_VERSION, `${where}: nicht unterstützte schemaVersion`); }

export function validateManifest(manifest) {
  checkVersion(manifest,'manifest');
  ensure(validString(manifest.catalogVersion),'manifest: catalogVersion fehlt');
  ensure(Array.isArray(manifest.categories) && manifest.categories.length > 0,'manifest: categories fehlt');
  ensure(Array.isArray(manifest.editorial),'manifest: editorial fehlt');
  ensure(validString(manifest.defaultLocale),'manifest: defaultLocale fehlt');
  const paths=new Set();
  for (const entry of manifest.categories) {
    ensure(isObj(entry) && Object.hasOwn(TYPES,entry.type) && typeof entry.path==='string' && pathPattern.test(entry.path) && entry.path.startsWith('./data/catalog/'), 'manifest: ungültige Kategoriedatei');
    ensure(!paths.has(entry.path),`manifest: doppelter Pfad ${entry.path}`);paths.add(entry.path);
  }
  for (const entry of manifest.editorial) {
    ensure(isObj(entry) && validString(entry.locale) && typeof entry.path==='string' && pathPattern.test(entry.path) && entry.path.startsWith('./data/editorial/'),'manifest: ungültige Redaktionsdatei');
    ensure(!paths.has(entry.path),`manifest: doppelter Pfad ${entry.path}`);paths.add(entry.path);
  }
  ensure(manifest.editorial.some(e=>e.locale===manifest.defaultLocale),'manifest: Standard-Sprache fehlt');
  return manifest;
}

export function parseCategory(doc, expectedType, path='') {
  checkVersion(doc, path||expectedType);
  ensure(doc.type===expectedType,`${path}: Kategorie ${expectedType} erwartet`);
  ensure(isObj(doc.provenance) && validString(doc.provenance.source),`${path}: Quelle fehlt`);
  ensure(Array.isArray(doc.objects),`${path}: objects muss ein Array sein`);
  return doc.objects.map((item,index)=>{
    const where=`${path} / Eintrag ${index+1}`;
    ensure(isObj(item) && idPattern.test(item.id||'') && validString(item.name),`${where}: id oder name ungültig`);
    ensure(item.parentId === null || idPattern.test(item.parentId||''),`${where}: parentId ungültig`);
    if(item.aliases!==undefined)ensure(Array.isArray(item.aliases) && item.aliases.every(validString),`${where}: aliases müssen eine Liste von Namen sein`);
    ensure(isObj(item.physical) && okNumber(item.physical.radiusKm) && item.physical.radiusKm>=0,`${where}: radiusKm ungültig`);
    if (item.physical.temperatureK !== undefined) ensure(okNumber(item.physical.temperatureK) && item.physical.temperatureK>0,`${where}: temperatureK ungültig`);
    // Physical properties are optional: never replace an unknown value with zero.
    // Kelvin and Pa are used in the catalog, independent of the UI's display units.
    for(const key of ['temperatureMinK','temperatureMaxK','temperatureMeanK','atmosphericPressurePa','surfaceGravityMs2']){
      const value=item.physical[key];
      if(value!==undefined && value!==null)ensure(okNumber(value) && value>=0,`${where}: ${key} muss eine nichtnegative Zahl oder null sein`);
    }
    const {temperatureMinK:min,temperatureMaxK:max,temperatureMeanK:mean}=item.physical;
    if(min!=null && max!=null)ensure(min<=max,`${where}: Temperatur-Minimum > Maximum`);
    if(mean!=null && min!=null)ensure(mean>=min,`${where}: mittlere Temperatur < Minimum`);
    if(mean!=null && max!=null)ensure(mean<=max,`${where}: mittlere Temperatur > Maximum`);
    for(const key of ['dataSourceUrl','temperatureRangeSourceUrl']){
      const url=item.physical[key];
      if(url!==undefined)ensure(typeof url==='string' && /^https:\/\/[^\s]+$/i.test(url),`${where}: ${key} muss eine HTTPS-URL sein`);
    }
    ensure(isObj(item.orbit),`${where}: orbit fehlt`);
    const o=item.orbit;
    ensure(['AU','km'].includes(o.unit),`${where}: unit muss AU oder km sein`);
    ensure(okNumber(o.semiMajorAxis) && o.semiMajorAxis>=0 && okNumber(o.periodDays) && o.periodDays>=0,`${where}: Bahnradius/Periode ungültig`);
    ensure(item.parentId===null || (o.semiMajorAxis>0 && o.periodDays>0),`${where}: kein gültiger Umlauf um parentId`);
    ensure(o.unit===(item.parentId && item.parentId!=='sun'?'km':'AU'),`${where}: Einheit passt nicht zu parentId`);
    if(o.meanDistance!==undefined && o.meanDistance!==null)
      ensure(okNumber(o.meanDistance) && (item.parentId===null?o.meanDistance===0:o.meanDistance>0),`${where}: meanDistance ungültig`);
    for(const key of ['eccentricity','inclinationDeg','ascendingNodeDeg','periapsisDeg','meanAnomalyDeg'])ensure(okNumber(o[key]),`${where}: ${key} ungültig`);
    if (o.referenceFrame!==undefined) ensure(validString(o.referenceFrame),`${where}: referenceFrame ungültig`);
    if (o.model!==undefined) ensure(validString(o.model),`${where}: orbit model ungültig`);
    ensure(o.eccentricity>=0 && o.eccentricity<1,`${where}: nur gebundene elliptische Bahnen (0 ≤ e < 1) unterstützt`);
    ensure(typeof o.epoch==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(o.epoch) && Number.isFinite(Date.parse(o.epoch)),`${where}: epoch muss ein ISO-UTC-Zeitpunkt sein`);
    ensure(isObj(item.appearance) && /^#[\da-fA-F]{6}$/.test(item.appearance.color||'') && validString(item.appearance.style),`${where}: appearance ungültig`);
    if(item.externalIds?.norad!==undefined)ensure(Number.isInteger(item.externalIds.norad) && item.externalIds.norad>0,`${where}: NORAD-ID ungültig`);
    return {
      id:item.id,name:item.name,type:expectedType,parentId:item.parentId,
      ...(item.aliases===undefined?{}:{aliases:item.aliases}),
      a:o.semiMajorAxis,periodDays:o.periodDays,radiusKm:item.physical.radiusKm,
      // By convention the semimajor axis is the catalog's characteristic mean
      // parent separation; an explicit meanDistance may override it.
      meanDistanceToParent:item.parentId===null?null:(o.meanDistance??o.semiMajorAxis),
      meanDistanceUnit:o.unit,meanDistanceEstimated:o.meanDistance==null,
      color:item.appearance.color,style:item.appearance.style,
      e:o.eccentricity,i:o.inclinationDeg,node:o.ascendingNodeDeg,peri:o.periapsisDeg,
      M:o.meanAnomalyDeg,epoch:Date.parse(o.epoch),source:doc.provenance.source,
      ...(o.referenceFrame===undefined?{}:{orbitFrame:o.referenceFrame}),
      ...(o.model===undefined?{}:{orbitModel:o.model}),
      ...(item.physical.temperatureK===undefined?{}:{temperatureK:item.physical.temperatureK}),
      ...Object.fromEntries(['temperatureMinK','temperatureMaxK','temperatureMeanK','atmosphericPressurePa','surfaceGravityMs2','dataSourceUrl','temperatureRangeSourceUrl']
        .filter(key=>item.physical[key]!==undefined).map(key=>[key,item.physical[key]])),
      ...(item.externalIds?.norad===undefined?{}:{catalog:item.externalIds.norad}),
      description:''
    };
  });
}

export function validateEditorial(doc, locale='de') {
  checkVersion(doc,`redaktion ${locale}`);
  ensure(doc.locale===locale,`redaktion: Sprache ${locale} erwartet`);
  ensure(Number.isInteger(doc.revision) && doc.revision>0,`redaktion ${locale}: revision ungültig`);
  ensure(Array.isArray(doc.articles),`redaktion ${locale}: articles fehlt`);
  const out=new Map();
  for(const article of doc.articles){
    ensure(isObj(article) && idPattern.test(article.id||'') && statusSet.has(article.status),`redaktion ${locale}: id/status ungültig`);
    ensure(!out.has(article.id),`redaktion ${locale}: doppelte ID ${article.id}`);
    ensure(Number.isInteger(article.revision) && article.revision>0 && validString(article.title),`redaktion ${locale}/${article.id}: revision/title ungültig`);
    ensure(typeof article.summary==='string' && Array.isArray(article.sections) && Array.isArray(article.references),`redaktion ${locale}/${article.id}: summary/sections/references ungültig`);
    for(const section of article.sections)ensure(isObj(section) && validString(section.heading) && validString(section.text),`redaktion ${locale}/${article.id}: Abschnitt unvollständig`);
    for(const ref of article.references)ensure(isObj(ref) && validString(ref.title) && typeof ref.url==='string' && /^https:\/\/[^\s]+$/i.test(ref.url),`redaktion ${locale}/${article.id}: Quellenlink muss HTTPS sein`);
    out.set(article.id,article);
  }
  return out;
}

/** Validate referential integrity and combine only visible editorial records. */
export function assembleCatalog(manifest, categoryDocs, editorialDocs) {
  validateManifest(manifest);
  ensure(Array.isArray(categoryDocs) && categoryDocs.length===manifest.categories.length,'Nicht alle Kategorien geladen');
  const bodies=[],byId=new Map();
  manifest.categories.forEach((category,index)=>{
    for(const body of parseCategory(categoryDocs[index],category.type,category.path)){
      ensure(!byId.has(body.id),`doppelte Himmelskörper-ID ${body.id}`);
      byId.set(body.id,body);bodies.push(body);
    }
  });
  for(const body of bodies){
    if(body.parentId!==null)ensure(byId.has(body.parentId),`${body.id}: unbekanntes parentId ${body.parentId}`);
    const visited=new Set();let current=body;
    while(current?.parentId){ensure(!visited.has(current.id),`${body.id}: Zyklus in Objekt-Hierarchie`);visited.add(current.id);current=byId.get(current.parentId);}
  }
  const articles=new Map();
  // One locale may consist of multiple independent editorial packages.
  const docs=Array.isArray(editorialDocs)?editorialDocs:[editorialDocs];
  ensure(docs.length>0,'Mindestens eine redaktionelle Datei erforderlich');
  for (const doc of docs){
    for (const [id,article] of validateEditorial(doc,manifest.defaultLocale)){
      ensure(!articles.has(id),`redaktion: doppelte ID ${id} in mehreren Dateien`);
      articles.set(id,article);
    }
  }
  for(const [id,article] of articles){
    ensure(byId.has(id),`redaktion: Artikel verweist auf unbekannte ID ${id}`);
    if(article.status==='draft')continue;
    const body=byId.get(id);
    body.editorial=article;
    body.description=article.summary;
  }
  return {bodies,articles,version:manifest.catalogVersion};
}

async function browserReadJSON(path) {
  const response=await fetch(path,{cache:'no-cache'});
  if(!response.ok)throw Error(`HTTP ${response.status} für ${path}`);
  return response.json();
}
/** Same reader works for the live browser, local CLI validation and unit tests. */
export async function loadCatalog(readJSON=browserReadJSON) {
  const manifest=validateManifest(await readJSON(CATALOG_MANIFEST));
  const editorialEntries=manifest.editorial.filter(e=>e.locale===manifest.defaultLocale);
  const [categoryDocs,editorialDocs]=await Promise.all([
    Promise.all(manifest.categories.map(entry=>readJSON(entry.path))),
    Promise.all(editorialEntries.map(entry=>readJSON(entry.path)))
  ]);
  return assembleCatalog(manifest,categoryDocs,editorialDocs);
}

/** Combine provider updates with the catalog without replacing editorial content. */
export function mergeLiveBodies(current, updates) {
  const result=current.slice();
  const indexes=new Map(current.map((body,index)=>[body.id,index]));
  for(const fresh of updates){
    if(!fresh?.id)continue;
    const index=indexes.get(fresh.id);
    if(index===undefined){indexes.set(fresh.id,result.length);result.push(fresh);continue;}
    const previous=result[index],merged={...previous,...fresh};
    if(previous.meanDistanceEstimated && typeof fresh.a==='number' && Number.isFinite(fresh.a))
      merged.meanDistanceToParent=fresh.a;
    if(previous.editorial){merged.editorial=previous.editorial;merged.description=previous.editorial.summary;}
    result[index]=merged;
  }
  return result;
}
