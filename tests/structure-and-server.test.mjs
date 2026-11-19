import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, stat, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { handler } from '../server/server.mjs';
import { staticAsset } from '../server/static.mjs';
import { apiRoute } from '../server/routes/api.mjs';
import { loadCatalog } from '../src/data/catalog.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const src=join(root,'src');
const file=async p=>readFile(join(root,p),'utf8');

test('PWA entry files live directly in the workspace root (without public/)',async()=>{
  for(const filename of ['index.html','sw.js','manifest.webmanifest','favicon.svg','css/styles.css',
    'icons/icon-180.png','icons/icon-192.png','icons/icon-512.png']){
    const content=await readFile(join(root,filename));
    assert.ok(content.length>100,`${filename}: absent from workspace root`);
  }
  await assert.rejects(access(join(root,'public','index.html')));
  const html=await file('index.html');
  assert.match(html,/src="src\/app\.js"/);
  assert.match(html,/href="css\/styles\.css"/);
  assert.match(html,/href="manifest\.webmanifest"/);
  const app=await file('src/app.js');
  assert.match(app,/import \{init\} from '\.\/app\/runtime\.js'/);
  const registration=await file('src/app/service-worker-registration.js');
  assert.match(registration,/serviceWorker\.register\('\.\/sw\.js'/);
});

// The browser graph must be fully served and fully cached for PWA offline operation.
test('All ES module imports are local, resolvable and precached', async()=>{
  const modules=[];
  async function scan(dir){
    for(const dirent of await import('node:fs/promises').then(m=>m.readdir(dir,{withFileTypes:true}))){
      if(dirent.isDirectory())await scan(join(dir,dirent.name));
      else if(dirent.name.endsWith('.js'))modules.push(join(dir,dirent.name));
    }
  }
  await scan(src);
  assert.ok(modules.length>=20,'Modularized frontend has multiple components');
  const sw=await file('sw.js');
  const shell=JSON.parse(sw.match(/const SHELL=(\[[^;]+\]);/)[1]);
  assert.equal(new Set(shell).size,shell.length,'No duplicate precached files');
  for(const m of modules){
    const browserPath='./'+m.slice(root.length).replaceAll('\\','/');
    assert.ok(shell.includes(browserPath),`${browserPath}: missing offline module`);
    const source=await readFile(m,'utf8');
    for(const match of source.matchAll(/\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g)){
      const imported=resolve(dirname(m),match[1]);
      assert.ok(imported.startsWith(src+'/'),`Import escapes src: ${match[1]}`);
      assert.ok((await stat(imported)).isFile(),`Missing imported module ${imported}`);
    }
    const served=await staticAsset('/'+m.slice(root.length));
    assert.ok(served?.bytes.length>0,`Module cannot be loaded over HTTP: ${browserPath}`);
    assert.match(served.type,/javascript/);
  }
  for(const relative of shell){
    const requested=relative==='./'?'/' : '/'+relative.slice(2);
    assert.ok((await staticAsset(requested))?.bytes.length>0,`${relative}: precached URL cannot be served`);
  }
  const html=await file('index.html');
  assert.match(html,/src="src\/app\.js"/);
  assert.match(html,/href="css\/styles\.css"/);
  const manifest=JSON.parse(await file('manifest.webmanifest'));
  for(const item of manifest.icons)assert.ok((await stat(join(root,item.src))).size>10000);
});

test('Server only serves allowlisted root files, browser modules and same-origin APIs',async()=>{
  for(const blocked of ['/.env','/server/config.mjs','/tests/structure-and-server.test.mjs',
    '/src/../server/config.mjs','/src/%2e%2e/server/config.mjs','/src/.hidden.js','/src/private.txt','/data/catalog/../../.env','/data/catalog/.hidden.json','/data/editorial/private.mjs','/data/../server/config.json']){
    assert.equal(await staticAsset(blocked),null,`Unsafe path exposed: ${blocked}`);
  }
  const status=await apiRoute(new URL('http://localhost/api/status'));
  assert.equal(status.status,200);assert.equal(status.body.online,true);
  const notfound=await apiRoute(new URL('http://localhost/api/missing'));
  assert.equal(notfound.status,404);

  // Exercise HTTP listener without launching upstream API requests.
  const server=createServer(handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address();
  const base=`http://127.0.0.1:${address.port}`;
  try{
    for(const [url,mime] of [['/','text/html'],['/src/app.js','text/javascript'],['/src/renderer/camera.js','text/javascript'],
      ['/css/styles.css','text/css'],['/manifest.webmanifest','application/manifest+json'],['/sw.js','text/javascript'],
      ['/data/catalog/manifest.json','application/json'],['/data/catalog/planets.json','application/json'],
      ['/data/editorial/de.json','application/json']]){
      const response=await fetch(base+url);
      assert.equal(response.status,200,url);
      assert.ok(response.headers.get('content-type').startsWith(mime),`${url}: ${response.headers.get('content-type')}`);
      assert.ok((await response.arrayBuffer()).byteLength>0,url);
    }
    const webCatalog=await loadCatalog(async path=>{
      const response=await fetch(base+'/'+path.slice(2));
      assert.equal(response.status,200,path);
      assert.match(response.headers.get('content-type'),/application\/json/,path);
      return response.json();
    });
    assert.equal(webCatalog.bodies.length,192,'Browser JSON catalog loads from the real HTTP server');
    assert.equal((await fetch(base+'/api/status')).status,200);
    assert.equal((await fetch(base+'/api/missing')).status,404);
    assert.equal((await fetch(base+'/server/config.mjs')).status,404);
    assert.equal((await fetch(base+'/.env')).status,404);
    assert.equal((await fetch(base+'/data/catalog/../../.env')).status,404);
    assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
    assert.equal((await fetch(base+'/api/bodies')).status,503,'Missing key falls back to start catalog');
    assert.equal((await fetch(base+'/sw.js')).headers.get('cache-control'),'no-store');
  }finally{await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});
