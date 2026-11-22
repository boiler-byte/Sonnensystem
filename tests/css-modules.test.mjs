import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('CSS modules generate the single browser/PWA stylesheet reproducibly',async()=>{
  execFileSync(process.execPath,['scripts/build-css.mjs','--check'],{
    cwd:new URL('../',import.meta.url),stdio:'pipe'
  });
  const output=await read('css/styles.css');
  const html=await read('index.html');
  const modules=[
    'base/variables.css','base/reset.css','base/layout.css',
    'components/catalog.css','components/details.css','components/controls.css',
    'components/timeline.css','components/bottom-sheet.css','responsive.css'
  ];
  for(const file of modules){
    const source=await read('css/'+file);
    assert.match(source,/\/\* @chunk \d{4} \*\//,file);
    assert.match(source,/\/\* @endchunk \d{4} \*\//,file);
  }
  assert.match(await read('css/responsive.css'),/@media\(/);
  assert.match(await read('css/components/bottom-sheet.css'),/\.mobile-sheet/);
  assert.ok(output.startsWith(':root{'));
  assert.doesNotMatch(output,/@chunk|@endchunk/);
  assert.match(html,/href="css\/styles\.css"/);
});
