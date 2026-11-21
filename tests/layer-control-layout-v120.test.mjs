import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');
const buttonIds=html=>[...html.matchAll(/<button\b[^>]*\bid="([^"]+)"/g)].map(m=>m[1]);
const button= (html,id)=>html.match(new RegExp(`<button\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?<\\/button>`))?.[0];

// The two existing upper buttons remain direct grid children; the three lower
// buttons share a separate row without altering their ids or event bindings.
test('v120: the first appearance row retains two toggles and the second has three',async()=>{
  const html=await read('index.html');
  const start=html.indexOf('<div class="layer-display-toggles">');
  const secondary=html.indexOf('<div class="layer-display-secondary"',start);
  const categories=html.indexOf('<div class="layer-options"',secondary);
  assert.ok(start>0 && start<secondary && secondary<categories);
  const firstRow=html.slice(start,secondary);
  const endOfControls=html.indexOf('              <button class="layer-speed-toggle"',secondary);
  assert.ok(endOfControls>secondary && endOfControls<categories,'mode switch follows display rows');
  const lowerRow=html.slice(secondary,endOfControls);
  assert.deepEqual(buttonIds(firstRow),['toggle-labels','orbit-visibility-btn']);
  assert.deepEqual(buttonIds(lowerRow),['orbit-contrast-btn','toggle-lighting','toggle-four-moons']);
  assert.match(lowerRow,/^<div class="layer-display-secondary" role="group" aria-label="Kontrast, Beleuchtung und Monde">/);
  assert.match(lowerRow,/<\/div>\s*<\/div>\s*<\/div>\s*$/);
  assert.deepEqual([...html.matchAll(/id="(toggle-labels|orbit-visibility-btn|orbit-contrast-btn|toggle-lighting|toggle-four-moons)"/g)].map(m=>m[1]),
    ['toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-lighting','toggle-four-moons']);
  for(const id of ['orbit-contrast-btn','toggle-lighting','toggle-four-moons']){
    const node=button(lowerRow,id);
    assert.ok(node,id);
    assert.match(node,/aria-pressed="false"/);
    assert.match(node,/title="[^"]+"/);
  }
});

test('v120: first row stays two columns, second is equally three; row mode fills the width',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.viewport>\.control-panel \.layer-display-toggles\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:4px\}/);
  assert.match(css,/\.viewport>\.control-panel \.layer-display-secondary\{grid-column:1\/-1;display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);gap:4px;min-width:0\}/);
  assert.match(css,/\.viewport>\.control-panel \.layer-popover\.row-layer-options \.layer-display-secondary\{grid-template-columns:minmax\(0,1fr\)\}/);
  assert.match(css,/\.viewport>\.control-panel \.layer-display-toggles \.scale-tool-toggle\{width:100%;min-width:0;min-height:40px/);
  const layer=await read('src/ui/layer-panel.js');
  assert.match(layer,/\['toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-four-moons'\]/);
  assert.match(layer,/\$\(id\)\.hidden=row/);
});

test('v120: orbit contrast is a classic half-shaded contrast disk',async()=>{
  const html=await read('index.html');
  const control=button(html,'orbit-contrast-btn');
  const icon=control?.match(/<svg class="orbit-contrast-icon"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  assert.ok(icon,'contrast svg retained inside the existing button');
  assert.match(icon,/<circle cx="12" cy="12" r="8\.5"\/>/);
  assert.match(icon,/<path d="M12 3\.5a8\.5 8\.5 0 0 1 0 17Z" fill="currentColor" stroke="none"\/>/);
  assert.equal((icon.match(/<circle\b/g)||[]).length,1,'no more concentric orbit rings');
  assert.match(control,/aria-label="Bahnkontrast: Aus"/);
});

test('v120: moons glyph distributes nine non-overlapping dots irregularly',async()=>{
  const html=await read('index.html');
  const icon=button(html,'toggle-four-moons')?.match(/<svg class="nine-moons-icon"[^>]*>([\s\S]*?)<\/svg>/)?.[1];
  assert.ok(icon,'moon svg retained inside the existing button');
  const dots=[...icon.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"\/>/g)]
    .map(m=>({x:Number(m[1]),y:Number(m[2]),r:Number(m[3])}));
  assert.equal(dots.length,9,'keep nine symbolic moons');
  assert.equal(new Set(dots.map(({x})=>x)).size,9);
  assert.equal(new Set(dots.map(({y})=>y)).size,9);
  assert.ok(new Set(dots.map(({r})=>r)).size>=4,'vary dot sizes');
  assert.ok(Math.min(...dots.map(d=>d.x))<5 && Math.max(...dots.map(d=>d.x))>19);
  assert.ok(Math.min(...dots.map(d=>d.y))<5 && Math.max(...dots.map(d=>d.y))>20);
  for(let i=0;i<dots.length;i++){
    const a=dots[i];
    assert.ok(a.x-a.r>=0 && a.x+a.r<=24 && a.y-a.r>=0 && a.y+a.r<=24,'inside icon bounds');
    for(const b of dots.slice(i+1))
      assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>a.r+b.r+0.7,'distinct moon dots');
  }
});
