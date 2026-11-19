import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { renderCatalog } from '../src/ui/object-list.js';
import { CATEGORY_COLORS } from '../src/data/bodies.js';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';

const read=relative=>readFile(new URL('../'+relative,import.meta.url),'utf8');

function rowsFor(state){
  const elements=new Map(['object-list','object-count','list-label','catalog-sort'].map(id=>[id,{innerHTML:'',textContent:'',dataset:{},setAttribute(){},querySelectorAll:()=>[]}]));
  const original=globalThis.document;
  globalThis.document={getElementById:id=>elements.get(id)};
  try { renderCatalog(state,()=>{}); }
  finally { if(original===undefined)delete globalThis.document;else globalThis.document=original; }
  const result=new Map();
  for(const match of elements.get('object-list').innerHTML.matchAll(/<button[^>]+data-id="([^"]+)"[^>]*>([\s\S]*?)<\/button>/g)){
    result.set(match[1],match[2]);
  }
  return result;
}

test('v32: every object row uses the category color only for its centered name dot',()=>{
  const rows=rowsFor({bodies:INITIAL_BODIES,search:'',selected:'earth'});
  for(const [id,type] of [['earth','planet'],['mars','planet'],['moon','moon'],['pluto','dwarf'],['sun','star'],['vesta','asteroid']]){
    const body=INITIAL_BODIES.find(b=>b.id===id);
    const html=rows.get(id);
    assert.ok(html,`${id} must be listed`);
    assert.match(html,/<span class="object-title"><span class="object-category-dot" aria-hidden="true"/);
    assert.ok(html.includes(`class="object-category-dot" aria-hidden="true" style="--category-color:${CATEGORY_COLORS[type]}"`),id);
    assert.ok(html.includes(`class="object-symbol" aria-hidden="true" style="--orb-color:${body.color}"`),id);
    assert.ok(html.includes(`<span class="object-name">${body.name}</span>`),id);
  }
  assert.notEqual(INITIAL_BODIES.find(b=>b.id==='earth').color,CATEGORY_COLORS.planet);
  assert.notEqual(INITIAL_BODIES.find(b=>b.id==='pluto').color,CATEGORY_COLORS.dwarf);
});

test('v32: invalid and missing object colors get a neutral value, not a category color',()=>{
  const unsafe={id:'escaped',name:'Probe <test>',type:'probe',color:'#123456;bad:1',targets:'Mars'};
  const missing={id:'no-color',name:'No Color',type:'comet'};
  const rows=rowsFor({bodies:[unsafe,missing],search:'',selected:null});
  for(const id of ['escaped','no-color'])assert.ok(rows.get(id).includes('style="--orb-color:#9ba9bc"'),id);
  assert.ok(rows.get('escaped').includes(`style="--category-color:${CATEGORY_COLORS.probe}"`));
  assert.ok(rows.get('no-color').includes(`style="--category-color:${CATEGORY_COLORS.comet}"`));
  assert.ok(rows.get('escaped').includes('Probe &lt;test&gt;'));
  assert.ok(!rows.get('escaped').includes('bad:1'));
});

test('v32: category dot is centered, remains visible when names are truncated, and applies in mobile sheet',async()=>{
  const css=await read('css/styles.css');
  assert.match(css,/\.object-title\{display:flex;align-items:center;gap:7px;min-width:0\}/);
  assert.match(css,/\.object-category-dot\{display:block;width:7px;height:7px;flex:none;border-radius:50%;background:var\(--category-color,#E6EDF5\)\}/);
  assert.match(css,/\.object-title \.object-name\{min-width:0;flex:1\}/);
  assert.match(css,/\.object-name\{[^}]*text-overflow:ellipsis;overflow:hidden\}/);
  const sheet=await read('src/ui/bottom-sheet.js');
  assert.match(sheet,/panels = \{catalog:\$\('catalog'\),detail:\$\('detail'\)\}/);
});
