import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');

// The current DOM no longer contains the obsolete header, floating scene tools,
// old scale chooser or the old help modal. These CSS selectors must not return.
test('obsolete toolbar and modal styles are removed',async()=>{
  const css=await read('css/styles.css');
  const html=await read('index.html');
  for(const name of ['topbar','brandmark','scene-tools','scene-tool','scale-popover',
    'scale-button','scale-picker-wrap','view-mode-select','layer-orbit-section',
    'orbit-option','modal-backdrop','timeline-heading']){
    assert.doesNotMatch(css,new RegExp(`\\.${name}(?![\\w-])`),`stale style: ${name}`);
    assert.doesNotMatch(html,new RegExp(`(?:class|id)="[^"]*\\b${name}\\b`),`stale DOM: ${name}`);
  }
  assert.doesNotMatch(css,/#layer-summary\b|#play-symbol\b/);
});

test('current desktop/mobile controls retain their CSS',async()=>{
  const css=await read('css/styles.css');
  const html=await read('index.html');
  for(const sel of ['.sidebar-tabs{','.sheet-content{','.mobile-sheet{',
    '.viewport-actions .camera-reset-button{','.viewport-actions .ar-mode-button{',
    '.viewport-actions .ar-mode-button[hidden]{','.viewport>.control-panel .layer-popover{',
    '.viewport>.control-panel .layer-display-toggles{',
    '.viewport>.control-panel .scale-main-controls{',
    '.viewport>.control-panel .cinema-button[hidden]']){
    assert.ok(css.includes(sel),`current selector must remain: ${sel}`);
  }
  for(const id of ['layer-popover','layer-speed-panel','ar-mode-btn','cinema-btn','reset-camera']){
    assert.ok(html.includes(`id="${id}"`),id);
  }
  assert.match(css,/\.viewport-actions\{bottom:calc\(var\(--sheet-visible,45px\)/);
  assert.match(css,/@media\(max-width:770px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('CSS variables in the global theme are actually referenced',async()=>{
  const css=await read('css/styles.css');
  const root=css.match(/:root\{([^}]+)\}/)?.[1];
  assert.ok(root,'CSS theme variables exist');
  for(const match of root.matchAll(/(--[\w-]+):/g)){
    const name=match[1];
    assert.ok(css.includes(`var(${name},`) || css.includes(`var(${name})`),`unused global variable ${name}`);
  }
});

test('balanced CSS structure and compact output',async()=>{
  const css=await read('css/styles.css');
  assert.ok(Buffer.byteLength(css)<76000,'the stylesheet remains compact after the Layer speed-control addition');
  // Basic structural check without needing a runtime CSS parsing dependency.
  let braces=0,comment=false,quote=null;
  for(let i=0;i<css.length;i++){
    if(comment){if(css[i]==='*'&&css[i+1]==='/'){comment=false;i++;}continue;}
    if(quote){if(css[i]==='\\'){i++;continue;}if(css[i]===quote)quote=null;continue;}
    if(css[i]==='/'&&css[i+1]==='*'){comment=true;i++;continue;}
    if(css[i]==='"'||css[i]==="'"){quote=css[i];continue;}
    if(css[i]==='{')braces++;
    if(css[i]==='}')braces--;
    assert.ok(braces>=0,'unexpected closing brace');
  }
  assert.equal(braces,0,'all style blocks are closed');
  assert.equal(comment,false,'unterminated comment');
  assert.equal(quote,null,'unterminated string');
});

