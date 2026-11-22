/* Application shell + manifest-driven offline data set. */
const CACHE_NAME='sonnensystem-shell-v159';
const TEXTURE_CACHE='sonnensystem-textures-v1';
const SHELL=["./","./index.html","./css/styles.css","./favicon.svg","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-180.png","./src/app.js","./src/data/bodies.js","./src/data/layers.js","./src/data/catalog.js","./src/data/orbital-math.js","./src/data/probe-location.js","./data/catalog/probes.json","./src/renderer/ar-mode.js","./src/renderer/camera.js","./src/renderer/cinema.js","./src/renderer/controls.js","./src/renderer/geometry.js","./src/renderer/index.js","./src/renderer/labels.js","./src/renderer/math.js","./src/renderer/galactic-motion.js","./src/renderer/galactic-parallax.js","./src/renderer/galactic-trails.js","./src/renderer/sun-trail-flow.js","./src/renderer/orbits.js","./src/renderer/orbit-cache.js","./src/renderer/object-orientation.js","./src/renderer/planet-view.js","./src/renderer/renderer.js","./src/renderer/detail-zoom.js","./src/renderer/visual-angular-limit.js","./src/renderer/row-inspection.js","./src/renderer/picking.js","./src/renderer/path-picking.js","./src/renderer/transitions.js","./src/renderer/scene.js","./src/renderer/shaders.js","./src/renderer/solar-view.js","./src/renderer/texture-sources.js","./src/renderer/textures.js","./src/services/api.js","./src/services/nasa-api.js","./src/ui/bottom-sheet.js","./src/ui/formatters.js","./src/ui/object-details.js","./src/ui/row-inspection.js","./src/ui/physical-stat-icons.js","./src/ui/object-list.js","./src/ui/scene-mode.js","./src/ui/scene-history.js","./src/ui/status.js","./src/ui/timeline.js","./src/app/animation-controls.js","./src/app/animation-loop.js","./src/app/ar-controller.js","./src/app/camera-controller.js","./src/app/horizons-controller.js","./src/app/runtime.js","./src/app/service-worker-registration.js","./src/app/state.js","./src/app/view-mode.js","./src/ui/catalog-controller.js","./src/ui/display-controls.js","./src/ui/event-handlers.js","./src/ui/layer-panel.js","./src/ui/control-state.js","./src/ui/debug-controls.js","./src/ui/fps-meter.js","./src/ui/orbit-tooltip.js","./src/renderer/scene-objects.js","./src/renderer/lod.js"];
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
  if(/\/textures\/(?:mobile|standard|high)\/[a-zA-Z0-9][a-zA-Z0-9_-]*\.webp$/.test(url.pathname)){
    event.respondWith(caches.open(TEXTURE_CACHE).then(async cache=>{
      // Cache by canonical pathname, not by the version query: one offline
      // copy per image and no accumulation of superseded revisions.
      const key=new Request(url.origin+url.pathname);
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(response.ok){
          event.waitUntil(cache.put(key,response.clone()).catch(()=>{}));
          return response;
        }
        // 404 is not a usable image and must not replace the last good map.
        return (await cache.match(key))||response;
      }catch(error){
        const saved=await cache.match(key);
        if(saved)return saved;
        throw error;
      }
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
