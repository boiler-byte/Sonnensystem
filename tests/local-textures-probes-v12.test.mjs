import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {texturePaths,textureTier,textureSource} from '../src/renderer/texture-sources.js';
import {staticAsset} from '../server/static.mjs';
import {formatLocalDateTime} from '../src/ui/timeline.js';
import {TYPES} from '../src/data/bodies.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=async file=>readFile(join(root,file),'utf8');

test('v12: only safe same-origin local texture paths, with 2K filename aliases',()=>{
  const earthPaths=texturePaths('earth');
  assert.equal(earthPaths[0],'/textures/standard/earth.webp');
  assert.ok(earthPaths.indexOf('/textures/standard/earth.webp')<earthPaths.indexOf('/textures/standard/2k_earth_daymap.webp'));
  assert.ok(!earthPaths.some(path=>/\.(?:jpg|jpeg|png)$/.test(path)));
  assert.equal(textureSource('../../secret'),null);
  assert.equal(textureSource('earth').url,undefined);
  assert.equal(textureTier({planetId:'earth'},'earth'),'high');
  assert.equal(textureTier({isMobile:true,planetId:'earth'},'earth'),'mobile');
});

test('v12/v108: server serves user-owned WebP only, rejects traversals and other extensions',async()=>{
  const dir=join(root,'textures','standard');
  const file=join(dir,'test-v12.webp');
  await mkdir(dir,{recursive:true});
  try{
    await writeFile(file,Buffer.from('RIFFtestWEBP'));
    const served=await staticAsset('/textures/standard/test-v12.webp');
    assert.equal(served.type,'image/webp');
    assert.equal(served.bytes.length,12);
    for(const ext of ['jpg','jpeg','png'])assert.equal(await staticAsset(`/textures/standard/test-v12.${ext}`),null);
    assert.equal(await staticAsset('/textures/standard/../../package.json'),null);
    assert.equal(await staticAsset('/textures/standard/.secret.webp'),null);
  }finally{await rm(file,{force:true});}
});

test('v12: probes list contains verifiable, source-linked missions with no invented orbit',async()=>{
  const file=JSON.parse(await read('data/catalog/probes.json'));
  assert.equal(file.objects.length,8);
  for(const id of ['voyager-1','voyager-2','pioneer-10','pioneer-11','new-horizons','cassini','galileo','huygens']){
    const mission=file.objects.find(o=>o.id===id);
    assert.ok(mission);
    assert.equal(mission.type,'probe');
    assert.match(mission.launchDate,/^\d{4}-\d{2}-\d{2}$/);
    assert.match(mission.sourceUrl,/^https:\/\/science\.nasa\.gov\/mission\//);
    assert.equal(mission.orbit,undefined);
  }
  assert.equal(TYPES.probe.plural,'Raumsonden');
  assert.match(await read('src/renderer/scene.js'),/b\.type!=='probe'/);
});

test('v12: local time format uses process/browser timezone, not UTC',()=>{
  assert.match(formatLocalDateTime(new Date(2026,10,16,22,7)),/^16\.11\.2026 22:07$/);
});

test('v124: Layer holds the only time controls; no external texture fallback',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const layer=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  for(const id of ['layer-speed','layer-play-btn','layer-today-btn','layer-sim-date'])assert.match(layer,new RegExp(`id="${id}"`));
  assert.doesNotMatch(layer,/>Geschwindigkeit<\/span>|>Datum<\/span>/);
  assert.doesNotMatch(html,/id="time-panel"|id="speed-btn"|id="speed-popover"/);
  const script=await readFile(new URL('../src/renderer/textures.js',import.meta.url),'utf8');
  assert.doesNotMatch(script,/images\.unsplash\.com/);
});

