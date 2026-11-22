import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,rm,stat,utimes} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {runInNewContext} from 'node:vm';
import {textureSource,texturePaths,textureTier,TEXTURE_TIERS,textureRequestUrl} from '../src/renderer/texture-sources.js';
import {TextureManager} from '../src/renderer/textures.js';
import {staticAsset} from '../server/static.mjs';
import {textureManifest} from '../server/texture-manifest.mjs';
import {handler} from '../server/server.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const H=letter=>letter.repeat(64);
const wait=async predicate=>{
  for(let i=0;i<70;i++){
    if(predicate())return;
    await new Promise(resolve=>setImmediate(resolve));
  }
  assert.fail('Timed out waiting for texture load');
};
const gl=()=>({MAX_TEXTURE_SIZE:1,getParameter:()=>8192,deleteTexture(){}});

test('v97/v108: three folders, WebP-only candidates, tier fallback and safe IDs',()=>{
  assert.deepEqual(TEXTURE_TIERS,{mobile:512,standard:2048,high:4096});
  assert.equal(textureTier({planetId:'earth'}),'standard');
  assert.equal(textureTier({isMobile:true,planetId:'earth'}),'mobile');
  assert.equal(textureSource('earth','detail'),null,'the old detail folder is not a valid tier');
  assert.equal(textureSource('../private'),null);
  const mobile=texturePaths('earth','mobile');
  assert.equal(mobile[0],'/textures/mobile/earth.webp');
  assert.ok(mobile.indexOf('/textures/mobile/earth.webp')<mobile.indexOf('/textures/standard/earth.webp'));
  assert.ok(mobile.indexOf('/textures/standard/earth.webp')<mobile.indexOf('/textures/high/earth.webp'));
  const standard=texturePaths('earth','standard');
  assert.ok(standard.indexOf('/textures/standard/earth.webp')<standard.indexOf('/textures/standard/2k_earth_daymap.webp'));
  assert.ok(standard.indexOf('/textures/standard/2k_earth_daymap.webp')<standard.indexOf('/textures/high/earth.webp'));
  const high=texturePaths('earth','high');
  assert.equal(high[0],'/textures/high/earth.webp');
  assert.ok(high.includes('/textures/standard/earth.webp'));
  assert.ok(!high.some(path=>path.includes('/detail/')));
});

test('v97: manifest tracks changed file contents even after name/size/mtime reuse; HTTP never caches it',async()=>{
  const relative='/textures/mobile/v97-fingerprint.webp';
  const folder=join(ROOT,'textures','mobile');
  const filename=join(folder,'v97-fingerprint.webp');
  await mkdir(folder,{recursive:true});
  const initial=Buffer.from('a fixed size local image A');
  const updated=Buffer.from('a fixed size local image B');
  assert.equal(initial.length,updated.length);
  try{
    await writeFile(filename,initial);
    const {files:before}=await textureManifest();
    assert.equal(before[relative],createHash('sha256').update(initial).digest('hex'));
    const first=await stat(filename);
    await new Promise(resolve=>setTimeout(resolve,14));
    await writeFile(filename,updated);
    await utimes(filename,first.atime,first.mtime);
    const {files:after}=await textureManifest();
    assert.equal(after[relative],createHash('sha256').update(updated).digest('hex'));
    assert.notEqual(before[relative],after[relative]);
    const resource=await staticAsset(relative);
    assert.equal(resource.type,'image/webp');
    assert.equal(resource.cacheControl,'no-store');
    assert.deepEqual(resource.bytes,updated);
    for(const blocked of ['/textures/detail/v97-fingerprint.webp',
      '/textures/mobile/../../package.json','/textures/high/.hidden.webp',
      '/textures/mobile/v97-fingerprint.webp/anything']){
      assert.equal(await staticAsset(blocked),null,blocked);
    }
    const server=createServer(handler);
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const base=`http://127.0.0.1:${server.address().port}`;
      const response=await fetch(`${base}/api/textures/manifest`);
      assert.equal(response.status,200);
      assert.equal(response.headers.get('cache-control'),'no-store');
      assert.equal((await response.json()).files[relative],after[relative]);
      const image=await fetch(`${base}${relative}?v=${after[relative]}`);
      assert.equal(image.status,200);
      assert.equal(image.headers.get('cache-control'),'no-store');
      assert.equal(image.headers.get('content-type'),'image/webp');
    }finally{await new Promise(resolve=>server.close(resolve));}
  }finally{await rm(filename,{force:true});}
});

test('v97: mobile uses standard WebP when mobile is absent, then adopts new mobile file and revisions',async()=>{
  const originalFetch=globalThis.fetch;
  const standard='/textures/standard/earth.webp',mobile='/textures/mobile/earth.webp';
  let files={[standard]:H('a')};
  const seen=[],deleted=[];
  globalThis.fetch=async()=>({ok:true,json:async()=>({files})});
  const context=gl();context.deleteTexture=texture=>deleted.push(texture.url);
  const manager=new TextureManager(context,{mobile:true});
  manager.loadImage=async url=>{seen.push(url);return {url,naturalWidth:1024,naturalHeight:512};};
  manager.upload=(img,requestedWidth)=>({handle:{url:img.url},width:Math.min(img.naturalWidth,requestedWidth),height:256,mipmaps:false});
  try{
    manager.get({id:'earth'},null,'earth');
    await wait(()=>manager.entries.get('earth:mobile')?.status==='ready');
    assert.equal(seen[0],`${textureRequestUrl(standard)}?v=${H('a')}`);
    assert.equal(manager.entries.get('earth:mobile').texture.url,seen[0]);
    files={[standard]:H('a'),[mobile]:H('b')};
    await manager.refreshManifest(true);
    assert.ok(deleted.includes(seen[0]),'GPU fallback is invalidated when a better-quality tier appears');
    manager.get({id:'earth'},null,'earth');
    await wait(()=>manager.entries.get('earth:mobile')?.status==='ready');
    assert.equal(seen.at(-1),`${textureRequestUrl(mobile)}?v=${H('b')}`);
    assert.equal(manager.entries.get('earth:mobile').bytes,512*256*4);
    files={[standard]:H('a'),[mobile]:H('c')};
    await manager.refreshManifest(true);
    manager.get({id:'earth'},null,'earth');
    await wait(()=>manager.entries.get('earth:mobile')?.status==='ready');
    assert.equal(seen.at(-1),`${textureRequestUrl(mobile)}?v=${H('c')}`,'updated filename uses a new content token');
    assert.ok(deleted.includes(`${textureRequestUrl(mobile)}?v=${H('b')}`),'old GPU texture is removed');
  }finally{
    manager.dispose();globalThis.fetch=originalFetch;
  }
});

test('v109: a failed lookup stays failed after manifest changes until an app reload',async()=>{
  const saved=globalThis.fetch;
  let files={};
  globalThis.fetch=async()=>({ok:true,json:async()=>({files})});
  const manager=new TextureManager(gl(),{mobile:true});
  const urls=[];
  manager.loadImage=async url=>{urls.push(url);return {naturalWidth:512,naturalHeight:256};};
  manager.upload=()=>({handle:{},width:512,height:256,mipmaps:false});
  try{
    manager.get({id:'mars'},null,'mars');
    await wait(()=>manager.entries.get('mars:mobile')?.status==='failed');
    assert.deepEqual(urls,[],'manifest avoids trial requests to absent files');
    files={'/textures/mobile/mars.webp':H('1')};
    await manager.refreshManifest(true);
    assert.equal(manager.entries.get('mars:mobile').status,'failed');
    manager.get({id:'mars'},null,'mars');
    assert.deepEqual(urls,[],'manifest changes do not retry a failed lookup');
    const restarted=new TextureManager(gl(),{mobile:true});
    restarted.loadImage=manager.loadImage;
    restarted.upload=manager.upload;
    try{
      restarted.get({id:'mars'},null,'mars');
      await wait(()=>restarted.entries.get('mars:mobile')?.status==='ready');
      assert.equal(urls[0],`${textureRequestUrl('/textures/mobile/mars.webp')}?v=${H('1')}`);
    }finally{restarted.dispose();}
  }finally{manager.dispose();globalThis.fetch=saved;}
});

test('v97: a texture changed mid-download does not overwrite the latest GPU revision',async()=>{
  const saved=globalThis.fetch;
  const url='/textures/standard/mars.webp';
  let files={[url]:H('1')};
  globalThis.fetch=async()=>({ok:true,json:async()=>({files})});
  const removed=[];
  const context=gl();context.deleteTexture=texture=>removed.push(texture.url);
  const manager=new TextureManager(context,{mobile:false});
  let finish;
  const urls=[];
  manager.loadImage=async src=>{
    urls.push(src);
    if(urls.length===1)return new Promise(resolve=>{finish=()=>resolve({url:src,naturalWidth:128,naturalHeight:64});});
    return {url:src,naturalWidth:128,naturalHeight:64};
  };
  manager.upload=img=>({handle:{url:img.url},width:128,height:64,mipmaps:false});
  try{
    manager.get({id:'mars'},null,null);
    await wait(()=>typeof finish==='function');
    files={[url]:H('2')};
    await manager.refreshManifest(true);
    finish();
    await wait(()=>manager.active===0);
    assert.deepEqual(removed,[`${textureRequestUrl(url)}?v=${H('1')}`]);
    assert.equal(manager.entries.has('mars:standard'),false);
    manager.get({id:'mars'},null,null);
    await wait(()=>manager.entries.get('mars:standard')?.status==='ready');
    assert.equal(urls.at(-1),`${textureRequestUrl(url)}?v=${H('2')}`);
  }finally{manager.dispose();globalThis.fetch=saved;}
});

test('v97: the service worker fetches current texture files first, keeps one offline fallback per path',async()=>{
  const code=await readFile(join(ROOT,'sw.js'),'utf8');
  const listeners={},saved=new Map(),writes=[];
  let online=true,received=[];
  const cache={
    match:async request=>saved.get(request.url)?.clone(),
    put:async(request,response)=>{writes.push(request.url);saved.set(request.url,response.clone());}
  };
  const scope={
    self:{location:{origin:'https://example.test'},addEventListener:(type,listener)=>{listeners[type]=listener;}},
    caches:{open:async()=>cache},
    fetch:async(request,options)=>{
      received.push({url:request.url,options});
      if(!online)throw Error('offline');
      return new Response('revision-'+received.length,{status:200,headers:{'Content-Type':'image/webp'}});
    },
    Request,Response,URL,Promise
  };
  runInNewContext(code,scope);
  const issue=async suffix=>{
    let response,wait=[];
    const request=new Request(`https://example.test/textures/mobile/earth.webp?v=${suffix}`);
    listeners.fetch({request,respondWith:promise=>{response=promise;},waitUntil:promise=>wait.push(promise)});
    assert.ok(response,'texture request is intercepted');
    const data=await response;
    await Promise.all(wait);
    return data.text();
  };
  assert.equal(await issue('first'),'revision-1');
  assert.equal(await issue('second'),'revision-2','online mode never returns stale cache first');
  assert.equal(saved.size,1);
  assert.deepEqual(writes,[
    'https://example.test/textures/mobile/earth.webp',
    'https://example.test/textures/mobile/earth.webp'
  ]);
  assert.ok(received.every(call=>call.options.cache==='no-store'));
  online=false;
  assert.equal(await issue('third'),'revision-2','offline mode reuses last good image despite a new query');
  assert.equal(saved.size,1,'old revision keys do not accumulate');
});
