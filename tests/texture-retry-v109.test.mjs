import assert from 'node:assert/strict';
import {test} from 'node:test';
import {texturePaths,textureRequestUrl} from '../src/renderer/texture-sources.js';
import {TextureManager} from '../src/renderer/textures.js';

const gl=()=>({MAX_TEXTURE_SIZE:1,getParameter:()=>4096,deleteTexture(){}});
const wait=async predicate=>{
  for(let n=0;n<100;n++){
    if(predicate())return;
    await new Promise(resolve=>setImmediate(resolve));
  }
  assert.fail('Texture request did not settle');
};

test('v109: GitHub Pages uses query-free WebP URLs; missing API is checked once per app session',async()=>{
  const originalFetch=globalThis.fetch;
  let manifestCalls=0;
  globalThis.fetch=async()=>{manifestCalls++;throw Error('GitHub Pages: 404 on API');};
  const manager=new TextureManager(gl(),{mobile:true});
  const seen=[];
  manager.loadImage=async url=>{seen.push(url);throw Error('404 on image');};
  try{
    manager.get({id:'mars'},null,'mars');
    await wait(()=>manager.entries.get('mars:mobile')?.status==='failed');
    const expected=texturePaths('mars','mobile').map(path=>textureRequestUrl(path));
    assert.deepEqual(seen,expected,'one initial search across WebP quality fallbacks');
    assert.ok(seen.every(url=>new URL(url).search===''),'no timestamp, hash or other query on static Pages');
    assert.equal(manifestCalls,1);
    assert.equal(manager.manifestUnavailable,true);
    assert.equal(manager.failedPaths.size,expected.length);
    // Even after the 30-second check is due, no missing image or API is retried.
    manager.nextManifestCheck=0;
    for(let n=0;n<50;n++)manager.get({id:'mars'},null,'mars');
    await manager.refreshManifest();
    assert.deepEqual(seen,expected,'failed files are not retried while the app stays open');
    assert.equal(manifestCalls,1,'optional API is not polled after a 404 on static hosting');
    assert.equal(manager.entries.get('mars:mobile').status,'failed');
    // Changing quality must not try the same missing image URLs a second time.
    manager.setMobile(false);
    manager.get({id:'mars'},null,null);
    await wait(()=>manager.entries.get('mars:standard')?.status==='failed');
    assert.deepEqual(seen,expected,'failed files are shared across quality tiers');
  }finally{manager.dispose();globalThis.fetch=originalFetch;}
});

test('v109: a fresh app session retries missing textures after a new page load',async()=>{
  const originalFetch=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error('Static hosting has no manifest');};
  const urls=[];
  const makeManager=()=>{
    const manager=new TextureManager(gl(),{mobile:true});
    manager.loadImage=async url=>{
      urls.push(url);
      if(urls.length<=texturePaths('earth','mobile').length)throw Error('initial 404');
      return {naturalWidth:512,naturalHeight:256};
    };
    manager.upload=(image)=>({handle:{url:image.url},width:512,height:256,mipmaps:false});
    return manager;
  };
  const first=makeManager();
  try{
    first.get({id:'earth'},null,'earth');
    await wait(()=>first.entries.get('earth:mobile')?.status==='failed');
    assert.equal(urls.length,texturePaths('earth','mobile').length);
    first.dispose();
    const restarted=makeManager();
    try{
      restarted.get({id:'earth'},null,'earth');
      await wait(()=>restarted.entries.get('earth:mobile')?.status==='ready');
      assert.equal(urls.length,texturePaths('earth','mobile').length+1);
      assert.equal(urls.at(-1),textureRequestUrl('/textures/mobile/earth.webp'));
    }finally{restarted.dispose();}
  }finally{first.dispose();globalThis.fetch=originalFetch;}
});

test('v109: manifest updates refresh successful images, never relaunch failed searches',async()=>{
  const originalFetch=globalThis.fetch;
  const mobile='/textures/mobile/earth.webp';
  const missing='/textures/mobile/mars.webp';
  let files={[mobile]:'a'.repeat(64)};
  globalThis.fetch=async()=>({ok:true,json:async()=>({files})});
  const manager=new TextureManager(gl(),{mobile:true});
  const seen=[];
  manager.loadImage=async url=>{seen.push(url);return {naturalWidth:512,naturalHeight:256};};
  manager.upload=(image)=>({handle:{},width:512,height:256,mipmaps:false});
  try{
    manager.get({id:'earth'},null,'earth');
    await wait(()=>manager.entries.get('earth:mobile')?.status==='ready');
    manager.get({id:'mars'},null,'mars');
    await wait(()=>manager.entries.get('mars:mobile')?.status==='failed');
    files={[mobile]:'b'.repeat(64),[missing]:'c'.repeat(64)};
    await manager.refreshManifest(true);
    assert.equal(manager.entries.get('mars:mobile').status,'failed','a newly added file does not restart a failed search');
    assert.equal(manager.entries.has('earth:mobile'),false,'successful old revision is invalidated');
    manager.get({id:'earth'},null,'earth');
    await wait(()=>manager.entries.get('earth:mobile')?.status==='ready');
    assert.deepEqual(seen,[
      `${textureRequestUrl(mobile)}?v=${'a'.repeat(64)}`,
      `${textureRequestUrl(mobile)}?v=${'b'.repeat(64)}`
    ]);
    manager.get({id:'mars'},null,'mars');
    assert.equal(manager.entries.get('mars:mobile').status,'failed');
    assert.equal(seen.length,2);
  }finally{manager.dispose();globalThis.fetch=originalFetch;}
});
