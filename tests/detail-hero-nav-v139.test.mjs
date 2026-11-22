import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=async file=>readFile(new URL('../'+file,import.meta.url),'utf8');

test('v139: the detail index is placed inside the chart and the title header is completely removed',async()=>{
  const [html,details]=await Promise.all([read('index.html'),read('src/ui/object-details.js')]);
  assert.doesNotMatch(html,/class="detail-top"|id="detail-top"|id="detail-name"|class="detail-title"/);
  assert.doesNotMatch(details,/detail-name|detail-top/,'render code must not write into a removed title');
  const heroStart=html.indexOf('<div class="detail-hero" id="detail-hero"');
  const heroEnd=html.indexOf('<div class="detail-scene-actions"',heroStart);
  assert.ok(heroStart>=0&&heroEnd>heroStart);
  const hero=html.slice(heroStart,heroEnd);
  assert.match(hero,/role="group" aria-label="Objektschaubild"/);
  assert.match(hero,/<nav class="detail-index-nav" aria-label="Objekte derselben Kategorie durchschalten">/);
  for(const id of ['detail-prev','detail-index','detail-next','hero-body','hero-size-reference-name']){
    assert.match(hero,new RegExp(`id="${id}"`));
    assert.equal(html.match(new RegExp(`id="${id}"`,'g'))?.length,1,`${id} should occur once`);
  }
  assert.ok(hero.indexOf('id="detail-index"')<hero.indexOf('id="hero-size-legend"'));
  assert.ok(hero.indexOf('</button>')<hero.indexOf('<nav class="detail-index-nav"'),
    'the navigation must be outside the zoom button so pointer and keyboard actions remain independent');
  assert.match(html,/<div class="detail-scroll" id="detail-scroll">\s*<div class="detail-hero"/);
});

test('v139: nav is absolutely positioned at the top right with a reserved legend area',async()=>{
  const [css,js,packageJson,sw]=await Promise.all([read('css/styles.css'),read('src/ui/bottom-sheet.js'),read('package.json'),read('sw.js')]);
  assert.match(css,/\.detail-hero \.detail-index-nav\{[^}]*position:absolute;top:10px;right:12px;z-index:4;/);
  assert.match(css,/\.detail-hero \.hero-size-legend\{right:128px\}/);
  assert.match(css,/\.sheet-content>\.detail \.detail-hero\{touch-action:none;user-select:none\}/);
  assert.doesNotMatch(css,/\.detail-top|\.detail-title/);
  assert.match(js,/const detailHero = \$\('detail-hero'\)/);
  assert.match(js,/\[header,detailHero,catalogSearchRow,listHeader\]/);
  assert.doesNotMatch(js,/detailTop|detail-top/);
  // Preserve the v139 layout contract across subsequent version increments.
  const major=Number(JSON.parse(packageJson).version.split('.')[0]);
  assert.ok(major>=139);
  assert.match(sw,new RegExp(`sonnensystem-shell-v${major}`));
});
