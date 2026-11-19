import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile,readdir,stat} from 'node:fs/promises';
import {join,dirname,resolve,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const read=path=>readFile(join(ROOT,path),'utf8');

// Runtime is pinned once in package.json; tests must never embed a stale major version.
test('release contract: package, app meta, PWA and README describe the same version',async()=>{
 const [pkgText,html,worker,readme]=await Promise.all([
  read('package.json'),read('index.html'),read('sw.js'),read('README.md')]);
 const {version}=JSON.parse(pkgText);
 assert.match(version,/^\d+\.\d+\.\d+$/);
 const [major,minor]=version.split('.');
 const htmlVersion=html.match(/<meta name="app-version" content="V([\d.]+)"/);
 assert.ok(htmlVersion,'HTML app-version meta exists');
 assert.equal(htmlVersion[1],`${major}.${minor}`);
 const workerVersion=worker.match(/const CACHE_NAME='sonnensystem-shell-v(\d+)'/);
 assert.ok(workerVersion,'PWA cache version exists');
 assert.equal(workerVersion[1],major);
 assert.match(readme,new RegExp(`^# Sonnensystem.*\\(v${major}\\.${minor}\\.`, 'm'));
 assert.match(worker,/"\.\/css\/styles\.css"/);
});

test('release contract: no retired delta files remain and complete notes are archived',async()=>{
 const dirs=await readdir(join(ROOT,'docs'));
 assert.ok(!dirs.some(name=>/^DELTA-V\d+\.md$/.test(name)||name==='HOTFIX-V6.1.md'));
 const archive=await read('docs/RELEASE-HISTORY.md');
 for(let n=2;n<=67;n++)assert.ok(archive.includes(`<a id="release-v${n}"></a>`),`missing v${n} archive`);
 assert.ok(archive.includes('<a id="hotfix-v61"></a>'));
});

test('release contract: documentation has no broken local markdown links',async()=>{
 const docs=['README.md',...(await readdir(join(ROOT,'docs'))).filter(n=>n.endsWith('.md')).map(n=>'docs/'+n)];
 for(const file of docs){
  const text=await read(file);
  for(const link of text.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)){
   const target=link[1].split('#')[0].trim();
   if(!target || /^(https?:|mailto:)/.test(target))continue;
   assert.ok(!isAbsolute(target),'absolute local link in '+file);
   const dest=resolve(ROOT,dirname(file),target);
   assert.ok(dest.startsWith(ROOT),'link escapes project: '+file+' -> '+target);
   await stat(dest).catch(()=>assert.fail(`broken link: ${file} -> ${target}`));
  }
 }
});

test('release contract: legacy behavior suites, app modules and manifest stay available',async()=>{
 const suites=await readdir(join(ROOT,'tests'));
 const required=['module-boundaries.test.mjs','shared-logic.test.mjs','render-performance.test.mjs',
  'styles-regression.test.mjs','ar-mode-v48.test.mjs','catalog-search-v56.test.mjs'];
 for(const path of required)assert.ok(suites.includes(path),path);
 const [worker,html]=await Promise.all([read('sw.js'),read('index.html')]);
 const shell=JSON.parse(worker.match(/const SHELL=(\[[^;]+\]);/)[1]);
 assert.ok(shell.includes('./src/app.js'));
 assert.ok(shell.includes('./css/styles.css'));
 assert.match(html,/href="css\/styles\.css"/);
 const manifest=JSON.parse(await read('data/catalog/manifest.json'));
 assert.equal(manifest.catalogVersion,'10.1.0');
 assert.equal(manifest.categories.length,23);
 assert.equal(manifest.editorial.length,5);
});
