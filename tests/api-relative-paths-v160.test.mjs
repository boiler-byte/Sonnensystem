import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appURL,fetchJSON} from '../src/services/api.js';
import {fetchHorizons} from '../src/services/nasa-api.js';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('v160: API and data URLs are rooted at the installation, including nested subdirectories',()=>{
  for(const location of [
    'https://example.com/',
    'https://user.github.io/Sonnensystem/',
    'https://example.com/projects/demo/Sonnensystem/'
  ]){
    const moduleURL=location+'src/services/api.js';
    assert.equal(appURL('api/status',moduleURL).href,location+'api/status');
    assert.equal(appURL('api/horizons?target=399&date=2026-11-22',moduleURL).href,
      location+'api/horizons?target=399&date=2026-11-22');
    assert.equal(appURL('./data/catalog/probes.json',moduleURL).href,location+'data/catalog/probes.json');
  }
});

test('v160: status and Horizons clients pass relative paths to the shared URL helper',async()=>{
  const runtime=await read('src/app/runtime.js');
  const nasa=await read('src/services/nasa-api.js');
  assert.match(runtime,/fetchJSON\('api\/status'\)/);
  assert.match(nasa,/fetchJSON\(`api\/horizons\?/);
  assert.doesNotMatch(runtime,/fetchJSON\(['"`]\/api\//);
  assert.doesNotMatch(nasa,/fetchJSON\(['"`]\/api\//);

  const originalFetch=globalThis.fetch;
  const calls=[];
  globalThis.fetch=async (url,options)=>{
    calls.push({url:String(url),options});
    return new Response(JSON.stringify({online:true}),{
      status:200,headers:{'Content-Type':'application/json'}
    });
  };
  try{
    await fetchJSON('api/status');
    await fetchHorizons('399','2026-11-22');
    await fetchJSON('./data/catalog/probes.json');
    assert.deepEqual(calls.map(call=>call.url),[
      appURL('api/status').href,
      appURL('api/horizons?target=399&date=2026-11-22').href,
      appURL('./data/catalog/probes.json').href
    ]);
    for(const call of calls)assert.equal(call.options.headers.Accept,'application/json');
  }finally{globalThis.fetch=originalFetch;}
});
