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
  assert.ok(earthPaths.indexOf('/textures/standard/2k_earth_daymap.webp')<earthPaths.indexOf('/textures/standard/earth.jpg'));
  assert.ok(texturePaths('earth').includes('/textures/standard/2k_earth_daymap.jpg'));
  assert.equal(textureSource('../../secret'),null);
  assert.equal(textureSource('earth').url,undefined);
  assert.equal(textureTier({planetId:'earth'},'earth'),'high');
  assert.equal(textureTier({isMobile:true,planetId:'earth'},'earth'),'mobile');
});

test('v12: server serves user-owned texture file, rejects traversals and private files',async()=>{
  const dir=join(root,'textures','standard');
  const file=join(dir,'test-v12.png');
  await mkdir(dir,{recursive:true});
  try{
    await writeFile(file,Buffer.from([137,80,78,71,13,10,26,10]));
    const served=await staticAsset('/textures/standard/test-v12.png');
    assert.equal(served.type,'image/png');
    assert.equal(served.bytes.length,8);
    assert.equal(await staticAsset('/textures/standard/../../package.json'),null);
    assert.equal(await staticAsset('/textures/standard/.secret.jpg'),null);
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

test('v12: three controls, icon-only play, no time heading or external texture fallback',async()=>{
  const html=await read('index.html');
  const panel=html.split('id="time-panel"')[1].split('id="canvas-error"')[0];
  assert.equal((panel.match(/<button\b[^>]*id="(?:speed-btn|play-btn|today-btn)"/g)||[]).length,3);
  assert.match(panel,/<svg id="play-icon"/);
  assert.doesNotMatch(panel,/id="play-label"|ZEITREISE|timeline-heading/);
  assert.match(panel,/id="sim-date-readout"/);
  const client=await read('src/renderer/textures.js');
  assert.doesNotMatch(client,/source\.url|crossOrigin|https:\/\//);
  const server=await read('server/server.mjs');
  assert.doesNotMatch(server,/textureAsset|textureAllowed/);
});
