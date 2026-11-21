import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {texturePaths,textureRequestUrl} from '../src/renderer/texture-sources.js';
import {TextureManager} from '../src/renderer/textures.js';

const mockGL=()=>({MAX_TEXTURE_SIZE:1,getParameter:()=>2048,deleteTexture(){}});

test('v107: object images resolve under the app directory on GitHub Pages, not the domain root',()=>{
  const canonical=texturePaths('earth','standard')[0];
  assert.equal(canonical,'/textures/standard/earth.webp','server manifest keys remain backwards compatible');
  for(const root of [
    'https://user.github.io/Sonnensystem/',
    'https://user.github.io/project/Sonnensystem/',
    'https://example.com/'
  ]){
    const resolved=textureRequestUrl(canonical,root);
    assert.equal(resolved,root+'textures/standard/earth.webp');
    assert.equal(textureRequestUrl('/textures/high/mars.webp',root),root+'textures/high/mars.webp');
  }
  for(const unsafe of ['https://evil.test/a.webp','/textures/../secret.webp',
    '/textures/standard/.private.png','/textures/standard/mars.jpg','/api/status','/textures/standard/mars.svg']){
    assert.equal(textureRequestUrl(unsafe,'https://user.github.io/Sonnensystem/'),null,unsafe);
  }
});

test('v107: optional manifest is requested from the app root and keeps canonical server keys',async()=>{
  const savedFetch=globalThis.fetch;
  let requested, options;
  globalThis.fetch=async(url,opts)=>{
    requested=String(url);options=opts;
    return {ok:true,json:async()=>({files:{'/textures/standard/earth.webp':'a'.repeat(64)}})};
  };
  const manager=new TextureManager(mockGL());
  try{
    await manager.refreshManifest(true);
    assert.equal(requested,new URL('../api/textures/manifest',import.meta.url).href);
    assert.equal(options.cache,'no-store');
    assert.equal(manager.manifest.get('/textures/standard/earth.webp'),'a'.repeat(64));
  }finally{manager.dispose();globalThis.fetch=savedFetch;}
});

test('v107: static hosting loads a local texture even without Node manifest endpoint',async()=>{
  const savedFetch=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error('GitHub Pages has no Node API');};
  const manager=new TextureManager(mockGL(),{mobile:true});
  const requested=[];
  manager.loadImage=async url=>{requested.push(url);return {naturalWidth:512,naturalHeight:256};};
  manager.upload=()=>({handle:{},width:512,height:256,mipmaps:false});
  try{
    const result=await manager.load({id:'earth',tier:'mobile'});
    assert.equal(result.width,512);
    assert.equal(requested.length,1);
    assert.equal(requested[0],textureRequestUrl('/textures/mobile/earth.webp'),
      'GitHub Pages URLs must have no timestamp or query string');
  }finally{manager.dispose();globalThis.fetch=savedFetch;}
});

test('v107: service worker intercepts and caches texture requests under GitHub Pages subfolders',async()=>{
  const handlers={}, cached=[];
  const appUrl='https://user.github.io/Sonnensystem/textures/standard/earth.webp?v=example';
  runInNewContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),{
    self:{location:{origin:'https://user.github.io'},addEventListener:(name,handler)=>{handlers[name]=handler;}},
    caches:{open:async()=>({match:async()=>null,put:async(request)=>{cached.push(request.url);}})},
    fetch:async()=>new Response('image',{status:200,headers:{'content-type':'image/webp'}}),
    URL,Request,Response,Promise
  });
  let delivered;
  const pending=[];
  handlers.fetch({request:new Request(appUrl),respondWith:promise=>{delivered=promise;},waitUntil:promise=>{pending.push(promise);}});
  assert.ok(delivered,'nested texture request must reach the service worker texture branch');
  assert.equal((await delivered).status,200);
  await Promise.all(pending);
  assert.deepEqual(cached,['https://user.github.io/Sonnensystem/textures/standard/earth.webp']);
});
