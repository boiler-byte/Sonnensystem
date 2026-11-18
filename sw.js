/* Sonnensystem v62: application shell + manifest-driven offline data set. */
const CACHE_NAME='sonnensystem-shell-v62';
const SHELL=["./","./index.html","./css/styles.css","./favicon.svg","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-180.png","./src/app.js","./src/data/bodies.js","./src/data/layers.js","./src/data/catalog.js","./src/data/normalization.js","./src/data/orbital-math.js","./data/catalog/probes.json","./src/renderer/ar-mode.js","./src/renderer/camera.js","./src/renderer/cinema.js","./src/renderer/controls.js","./src/renderer/geometry.js","./src/renderer/index.js","./src/renderer/labels.js","./src/renderer/math.js","./src/renderer/orbits.js","./src/renderer/planet-view.js","./src/renderer/renderer.js","./src/renderer/transitions.js","./src/renderer/scene.js","./src/renderer/shaders.js","./src/renderer/solar-view.js","./src/renderer/texture-sources.js","./src/renderer/textures.js","./src/services/api.js","./src/services/celestrak-api.js","./src/services/nasa-api.js","./src/services/solar-api.js","./src/ui/bottom-sheet.js","./src/ui/formatters.js","./src/ui/object-details.js","./src/ui/object-list.js","./src/ui/scene-mode.js","./src/ui/status.js","./src/ui/timeline.js"];
const DATA_MANIFEST='./data/catalog/manifest.json';
const dataPath=/^\.\/data\/(catalog|editorial)\/[a-z0-9-]+\.json$/;

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll([...SHELL,DATA_MANIFEST]);
    const response=await cache.match(DATA_MANIFEST);
    if(!response?.ok)throw Error('Der Katalog-Manifestcache ist unvollständig');
    const manifest=await response.json();
    if(manifest.schemaVersion!==1 || !Array.isArray(manifest.categories) || !Array.isArray(manifest.editorial))
      throw Error('Ungültiges Katalog-Manifest');
    const files=[...manifest.categories,...manifest.editorial].map(entry=>entry.path);
    if(files.some(file=>typeof file!=='string'||!dataPath.test(file)))
      throw Error('Ungültiger Datenpfad im Manifest');
    await cache.addAll([...new Set(files)]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sonnensystem-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin || url.pathname.includes('/api/'))return;
  // Cache maps lazily rather than on install (4K sources are too large for a
  // mandatory offline precache). Maps already viewed can be used offline.
  if(/\/textures\/standard\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/.test(url.pathname)){
    event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
      const old=await cache.match(request);
      if(old)return old;
      const response=await fetch(request);
      if(response.ok)event.waitUntil(cache.put(request,response.clone()).catch(()=>{}));
      return response;
    }));
    return;
  }
  // During editing, updated catalog/editorial JSON should be visible immediately
  // when online; the precached copy remains a reliable offline fallback.
  if(/^\/data\/(catalog|editorial)\/[a-z0-9-]+\.json$/.test(url.pathname)){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)));}
      return response;
    }).catch(()=>caches.match(request)));
    return;
  }
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
