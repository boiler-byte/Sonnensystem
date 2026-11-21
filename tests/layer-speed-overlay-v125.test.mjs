import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SPEED_MODES,SPEED_STEPS,speedAtStep,syncControls} from '../src/ui/timeline.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function stubDocument(){
  const nodes=new Map();
  return {
    nodes,
    getElementById(id){
      if(!nodes.has(id))nodes.set(id,{
        value:'',textContent:'',title:'',attrs:{},
        setAttribute(key,value){this.attrs[key]=String(value);}
      });
      return nodes.get(id);
    }
  };
}

test('v125: Tempo contains no four visible captions, retaining icon controls and date',async()=>{
  const [html,js]=await Promise.all([read('index.html'),read('src/ui/timeline.js')]);
  const panel=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  assert.doesNotMatch(panel,/>\s*(?:Geschwindigkeit|Pause|Play|Heute|Datum)\s*</);
  assert.doesNotMatch(panel,/id="layer-play-label"|class="layer-speed-caption"/);
  assert.doesNotMatch(js,/\$\('layer-play-label'\)/);
  assert.match(panel,/id="layer-play-btn"[^>]*aria-label="Simulation pausieren"/);
  assert.match(panel,/id="layer-today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.match(panel,/<time class="layer-speed-date" id="layer-sim-date" aria-live="off" title="Simulationsdatum und Uhrzeit"/);
  assert.equal((panel.match(/class="layer-speed-action"/g)||[]).length,2);
});

test('v125: speed value sits beside the thumb and overlaps limits without intercepting drag',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const panel=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  assert.match(panel,/class="layer-speed-rail"[\s\S]*?id="layer-speed"[\s\S]*?class="layer-speed-value-track"[\s\S]*?id="layer-speed-value"/);
  assert.match(panel,/class="layer-speed-bounds"[\s\S]*?id="layer-speed-max-label"[\s\S]*?id="layer-speed-min-label"/);
  assert.match(css,/\.layer-speed-value-track\{[^}]*z-index:2;pointer-events:none\}/);
  assert.match(css,/#layer-speed-value\{[^}]*position:absolute;top:var\(--speed-label-position,[^)]+\);left:calc\(50% \+ 18px\)/);
  assert.match(css,/#layer-speed-value\{[^}]*pointer-events:none\}/);
  assert.match(css,/\.layer-speed-rail\{[^}]*--speed-half-track:87px\}/);
  assert.match(css,/@media\(max-height:640px\)\{\.layer-speed-rail\{height:160px;--speed-half-track:74px\}/);
});

test('v125: floating speed value follows all logarithmic slider steps in both scenes',()=>{
  const old=globalThis.document,doc=stubDocument();
  globalThis.document=doc;
  try{
    const state={timelineMode:'solar',speed:5,playing:true,time:Date.UTC(2026,10,21,19,25)};
    for(const mode of ['solar','planet']){
      state.timelineMode=mode;
      for(const step of [0,1,75,101,120,239,SPEED_STEPS]){
        state.speed=speedAtStep(mode,step);
        syncControls(state);
        const actual=doc.nodes.get('layer-speed-value').attrs.style.match(/--speed-label-position:([\d.]+)%/);
        assert.ok(actual,`floating label at ${mode} ${step}`);
        assert.ok(Math.abs(Number(actual[1])-100*(1-step/SPEED_STEPS))<1e-8,`${mode} ${step}`);
        assert.equal(doc.nodes.get('layer-speed').value,String(step));
        assert.equal(doc.nodes.get('layer-speed').attrs['aria-valuetext'],doc.nodes.get('layer-speed-value').textContent);
      }
    }
    state.playing=false;
    syncControls(state);
    assert.equal(doc.nodes.get('layer-play-btn').attrs['aria-label'],'Simulation starten');
    assert.equal(doc.nodes.get('layer-play-btn').attrs['aria-pressed'],'false');
  }finally{
    if(old===undefined)delete globalThis.document;
    else globalThis.document=old;
  }
});
