import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile,access} from 'node:fs/promises';
import {apiRoute} from '../server/routes/api.mjs';
import {validHorizonsDate,ALLOWED_HORIZONS_TARGETS} from '../server/providers/nasa.mjs';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('v138: removed providers have no reachable HTTP routes or live client modules',async()=>{
  for(const endpoint of ['/api/bodies','/api/satellites','/api/sbdb?sstr=Ceres']){
    const result=await apiRoute(new URL(endpoint,'http://localhost'));
    assert.equal(result.status,404,endpoint);
  }
  for(const file of [
    'server/providers/solar.mjs','server/providers/celestrak.mjs',
    'src/services/solar-api.js','src/services/celestrak-api.js',
    'src/data/normalization.js','src/app/object-catalog.js'
  ])await assert.rejects(access(new URL(file,root)),undefined,file+' should be removed');
  for(const file of ['src/app/runtime.js','src/app/camera-controller.js',
    'src/ui/status.js','src/services/nasa-api.js','server/routes/api.mjs',
    'server/providers/nasa.mjs']){
    const source=await read(file);
    assert.doesNotMatch(source,/fetchAsteroid|fetchSolarBodies|fetchSatellites|Solar OpenData|CelesTrak|SBDB|solarKeyConfigured/,
      file+' should not reference retired services');
  }
});

test('v138: Horizons stays configured and PWA uses only active service modules',async()=>{
  const status=await apiRoute(new URL('http://localhost/api/status'));
  assert.equal(status.status,200);
  assert.deepEqual(status.body.providers,['NASA/JPL Horizons']);
  assert.equal(typeof status.body.nasaContactConfigured,'boolean');
  assert.ok(ALLOWED_HORIZONS_TARGETS.has('399'));
  assert.equal(validHorizonsDate('2026-11-22'),true);
  const invalid=await apiRoute(new URL('http://localhost/api/horizons?target=invalid&date=2026-11-22'));
  assert.ok([400,503].includes(invalid.status),'Horizons route is preserved');
  const service=await read('src/services/nasa-api.js');
  assert.match(service,/export const fetchHorizons/);
  assert.doesNotMatch(service,/sbdb/);
  const worker=await read('sw.js');
  const shell=JSON.parse(worker.match(/const SHELL=(\[[^;]+\]);/)[1]);
  assert.ok(shell.includes('./src/app/horizons-controller.js'));
  for(const removed of ['solar-api.js','celestrak-api.js','normalization.js','object-catalog.js'])
    assert.equal(shell.some(file=>file.endsWith('/'+removed)),false,removed);
  const html=await read('index.html');
  assert.match(html,/id="horizons-btn"/);
});
