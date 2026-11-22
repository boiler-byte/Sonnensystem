import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {FpsMeter} from '../src/ui/fps-meter.js';
import {initDebugControls,recordRenderedFrame} from '../src/ui/debug-controls.js';
const source=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function testDocument(){
  const nodes=new Map(),events=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{
      id,hidden:id==='layer-debug-panel'||id==='debug-fps-hud',textContent:'',title:'',attributes:{},handlers:{},
      addEventListener(name,handler){(this.handlers[name]??=[]).push(handler);},
      click(){for(const handler of this.handlers.click||[])handler();},
      setAttribute(name,value){this.attributes[name]=String(value);},
      focus(){this.focused=true;}
    });
    return nodes.get(id);
  };
  return {getElementById:get,get,hidden:false,addEventListener(name,cb){events.set(name,cb);},emit(name){events.get(name)?.();}};
}

test('v146: date triple-tap replaces tempo content with Debug + FPS and provides a return control',async()=>{
  const [html,css,loop,events,sw]=await Promise.all([
    source('index.html'),source('css/styles.css'),source('src/app/animation-loop.js'),source('src/ui/event-handlers.js'),source('sw.js')
  ]);
  const panel=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  assert.match(panel,/id="layer-time-controls"[^>]*>[\s\S]*?id="layer-debug-entry"/);
  assert.match(panel,/id="layer-debug-panel"[^>]*hidden>[\s\S]*?id="layer-debug-fps"[^>]*aria-pressed="false"/);
  assert.match(panel,/id="layer-debug-back"[^>]*>Zeit<\/button>/);
  assert.match(html,/id="debug-fps-hud"[^>]*hidden>[\s\S]*?id="debug-fps-current"[\s\S]*?id="debug-fps-minute"/);
  assert.match(css,/\.layer-time-controls\[hidden\],\.layer-debug-panel\[hidden\]/);
  assert.match(css,/\.viewport>\.debug-fps-hud\{position:absolute;z-index:\d+;top:/);
  assert.match(loop,/renderer\.draw\([\s\S]*?recordRenderedFrame\(now\)/);
  assert.match(events,/initDebugControls\(\)/);
  assert.match(sw,/sonnensystem-shell-v\d+/);
  assert.match(sw,/src\/ui\/debug-controls\.js/);
  assert.match(sw,/src\/ui\/fps-meter\.js/);
});

test('v146: only three quick taps open debug; return restores time controls',()=>{
  const doc=testDocument();let clock=0;
  initDebugControls(doc,()=>clock);
  const entry=doc.get('layer-debug-entry'),back=doc.get('layer-debug-back');
  entry.click();clock=800;entry.click();clock=1600;entry.click();
  assert.equal(doc.get('layer-debug-panel').hidden,true,'slow taps do not open');
  clock=3000;entry.click();clock=3250;entry.click();
  assert.equal(doc.get('layer-debug-panel').hidden,true,'two taps do not open');
  clock=3550;entry.click();
  assert.equal(doc.get('layer-debug-panel').hidden,false);
  assert.equal(doc.get('layer-time-controls').hidden,true);
  assert.equal(doc.get('layer-debug-fps').focused,true);
  back.click();
  assert.equal(doc.get('layer-debug-panel').hidden,true);
  assert.equal(doc.get('layer-time-controls').hidden,false);
  assert.equal(entry.focused,true);
});

test('v146: FPS toggle controls the HUD; frames use rAF clock; background resets counters',()=>{
  const doc=testDocument();initDebugControls(doc,()=>0);
  const fps=doc.get('layer-debug-fps'),hud=doc.get('debug-fps-hud');
  assert.equal(hud.hidden,true);
  recordRenderedFrame(0); // Disabled: not sampled or displayed.
  assert.equal(doc.get('debug-fps-current').textContent,'');
  fps.click();
  assert.equal(fps.attributes['aria-pressed'],'true');
  assert.equal(hud.hidden,false);
  assert.equal(doc.get('debug-fps-current').textContent,'–');
  for(let i=0;i<=120;i++)recordRenderedFrame(i*1000/60);
  assert.equal(doc.get('debug-fps-current').textContent,'60.0');
  assert.equal(doc.get('debug-fps-minute').textContent,'60.0');
  doc.hidden=true;doc.emit('visibilitychange');
  assert.equal(doc.get('debug-fps-minute').textContent,'–');
  doc.hidden=false;
  recordRenderedFrame(100000);
  assert.equal(doc.get('debug-fps-current').textContent,'–');
  fps.click();
  assert.equal(fps.attributes['aria-pressed'],'false');
  assert.equal(hud.hidden,true);
  recordRenderedFrame(100016);
  assert.equal(doc.get('debug-fps-current').textContent,'–');
});

test('v146: FPS meter computes rolling one-second and 60-second measured averages',()=>{
  const m=new FpsMeter();
  assert.deepEqual(m.read(),{current:null,minute:null});
  // First minute: 60 real frames per second.
  for(let i=0;i<=3600;i++)m.addFrame(i*1000/60);
  let x=m.read();
  assert.ok(x.current>59.9&&x.current<60.1,x.current);
  assert.ok(x.minute>59.9&&x.minute<60.1,x.minute);
  // Following second: 30 fps. One-second figure reacts, 60s avg shifts slightly.
  for(let i=1;i<=30;i++)m.addFrame(60000+i*1000/30);
  x=m.read();
  assert.ok(x.current>29&&x.current<31,x.current);
  assert.ok(x.minute>59.4&&x.minute<60,x.minute);
  m.addFrame(70000); // Paused / background => don't average over idle time.
  assert.deepEqual(m.read(),{current:null,minute:null});
  m.addFrame(70050);
  assert.ok(m.read().current>19.9&&m.read().current<20.1);
});

test('v146: version metadata and help include documented debug control',async()=>{
  const [readme,help,history,html,pkg]=await Promise.all([
    source('README.md'),source('docs/HILFE.md'),source('docs/RELEASE-HISTORY.md'),source('index.html'),source('package.json')
  ]);
  assert.match(readme,/v146/);
  assert.match(help,/dreimal|3-mal|3x/i);
  assert.match(history,/## v146/);
  const major=JSON.parse(pkg).version.split('.')[0];
  assert.ok(Number(major)>=146);
  assert.match(html,new RegExp(`V${major}\\.0`));
});
