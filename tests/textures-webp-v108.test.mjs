import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {texturePaths,textureRequestUrl,TEXTURE_FILE_PATH} from '../src/renderer/texture-sources.js';
import {TextureManager} from '../src/renderer/textures.js';
import {textureManifest} from '../server/texture-manifest.mjs';
import {staticAsset} from '../server/static.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const gl=()=>({MAX_TEXTURE_SIZE:1,getParameter:()=>4096,deleteTexture(){}});
const hash='a'.repeat(64);

test('v108: lookup lists only WebP for each tier and preserves tier/legacy alias priority',()=>{
  assert.deepEqual(texturePaths('earth','mobile'),[
    '/textures/mobile/earth.webp',
    '/textures/standard/earth.webp',
    '/textures/standard/2k_earth_daymap.webp',
    '/textures/high/earth.webp'
  ]);
  assert.deepEqual(texturePaths('mars','standard'),[
    '/textures/standard/mars.webp',
    '/textures/standard/2k_mars.webp',
    '/textures/high/mars.webp',
    '/textures/mobile/mars.webp'
  ]);
  assert.deepEqual(texturePaths('moon','high'),[
    '/textures/high/moon.webp',
    '/textures/standard/moon.webp',
    '/textures/standard/2k_moon.webp',
    '/textures/mobile/moon.webp'
  ]);
  for(const id of ['sun','earth','mars','titan','phobos','unknown-object']){
    for(const tier of ['mobile','standard','high']){
      const list=texturePaths(id,tier);
      assert.ok(list.length>=3);
      assert.ok(list.every(path=>path.endsWith('.webp')&&TEXTURE_FILE_PATH.test(path)),`${id}/${tier}`);
      assert.equal(new Set(list).size,list.length,'no redundant filename probes');
    }
  }
  for(const ext of ['jpg','jpeg','png']){
    const candidate=`/textures/standard/earth.${ext}`;
    assert.equal(TEXTURE_FILE_PATH.test(candidate),false);
    assert.equal(textureRequestUrl(candidate,'https://user.github.io/Sonnensystem/'),null);
  }
  assert.equal(textureRequestUrl('/textures/standard/earth.webp','https://user.github.io/Sonnensystem/'),
    'https://user.github.io/Sonnensystem/textures/standard/earth.webp');
});

test('v108: optional manifest inventories only WebP; static texture endpoint rejects other formats',async()=>{
  const folder=join(ROOT,'textures','standard');
  const basename='v108-formats-check';
  await mkdir(folder,{recursive:true});
  const files=['webp','jpg','jpeg','png'].map(ext=>join(folder,`${basename}.${ext}`));
  try{
    for(const filename of files)await writeFile(filename,Buffer.from('test-image-data'));
    const {files:manifest}=await textureManifest();
    assert.equal(typeof manifest[`/textures/standard/${basename}.webp`],'string');
    assert.equal(manifest[`/textures/standard/${basename}.webp`].length,64);
    assert.ok(!Object.keys(manifest).some(name=>name.startsWith(`/textures/standard/${basename}.`)&&!name.endsWith('.webp')));
    assert.equal((await staticAsset(`/textures/standard/${basename}.webp`)).type,'image/webp');
    for(const ext of ['jpg','jpeg','png'])
      assert.equal(await staticAsset(`/textures/standard/${basename}.${ext}`),null,`${ext} must not be a texture`);
    assert.equal((await staticAsset('/icons/icon-192.png')).type,'image/png','PWA PNG icons still work');
  }finally{for(const file of files)await rm(file,{force:true});}
});

test('v108: manifest ignores old image formats and never uses their hashes',async()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=async()=>({ok:true,json:async()=>({files:{
    '/textures/standard/earth.jpg':hash,
    '/textures/standard/earth.jpeg':hash,
    '/textures/standard/earth.png':hash,
    '/textures/standard/earth.webp':hash
  }})});
  const manager=new TextureManager(gl());
  try{
    await manager.refreshManifest(true);
    assert.deepEqual([...manager.manifest.keys()],['/textures/standard/earth.webp']);
  }finally{manager.dispose();globalThis.fetch=saved;}
});

test('v108: static GitHub Pages fallback attempts only WebP even when several files are missing',async()=>{
  const saved=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error('No Node texture manifest on GitHub Pages');};
  const manager=new TextureManager(gl(),{mobile:true});
  const seen=[];
  manager.loadImage=async url=>{
    seen.push(new URL(url).pathname);
    if(seen.length<3)throw Error('404');
    return {naturalWidth:512,naturalHeight:256};
  };
  manager.upload=()=>({handle:{},width:512,height:256,mipmaps:false});
  try{
    const image=await manager.load({id:'earth',tier:'mobile'});
    assert.equal(image.width,512);
    assert.deepEqual(seen.map(path=>path.slice(path.indexOf('/textures/'))),[
      '/textures/mobile/earth.webp',
      '/textures/standard/earth.webp',
      '/textures/standard/2k_earth_daymap.webp'
    ]);
  }finally{manager.dispose();globalThis.fetch=saved;}
});

test('v108: service worker caches only WebP as object textures; PWA PNG icons remain assets',async()=>{
  const code=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(code,/sonnensystem-shell-v\d+/);
  assert.match(code,/\*\\\.webp\$/,'WebP-only path matcher');
  assert.doesNotMatch(code,/\(\?:webp\|jpg\|jpeg\|png\)/);
  assert.match(code,/"\.\/icons\/icon-192.png"/);
});
