import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {syncControls} from '../src/ui/timeline.js';
import {S} from '../src/app/state.js';
import {syncLayers,toggleLayerSpeedPanel} from '../src/ui/layer-panel.js';
import {createViewSettings} from '../src/data/layers.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function stubDOM(){
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id))nodes.set(id,{
      id,textContent:'',title:'',hidden:false,disabled:false,attrs:{},value:'',
      classList:{toggle(){}},
      setAttribute(key,value){this.attrs[key]=String(value);},
      focus(){this.focused=true;}
    });
    return nodes.get(id);
  };
  return {get,doc:{getElementById:get,querySelectorAll:()=>[]}};
}

test('v123: Umschalter steht unmittelbar unter der zweiten Darstellungsreihe',async()=>{
  const [html,css]=await Promise.all([read('index.html'),read('css/styles.css')]);
  const layer=html.slice(html.indexOf('id="layer-popover"'),html.indexOf('id="canvas-error"'));
  const pos=id=>layer.indexOf(`id="${id}"`);
  assert.ok(pos('toggle-four-moons')<pos('layer-speed-toggle'));
  assert.ok(pos('layer-speed-toggle')<pos('layer-categories'));
  const between=layer.slice(pos('toggle-four-moons'),pos('layer-speed-toggle'));
  assert.match(between,/<\/div>\s*<\/div>\s*<\/div>/,'Darstellungszeilen werden vor Umschalter geschlossen');
  assert.match(layer,/data-layer-view="categories"/);
  assert.match(layer,/class="layer-category-icon"/);
  assert.match(layer,/class="layer-tempo-icon"/);
  assert.match(layer,/<span id="layer-speed-toggle-label">Kategorien<\/span>/);
  assert.match(css,/\[data-layer-view="tempo"\] \.layer-category-icon\{display:none\}/);
  assert.match(css,/\[data-layer-view="tempo"\] \.layer-tempo-icon\{display:block\}/);
});

test('v123: Umschalter zeigt aktuelle Ansicht, Icon-Zustand und nächsten Klick im Tooltip',()=>{
  const previousDocument=globalThis.document,previousSettings=S.settings;
  const dom=stubDOM();
  globalThis.document=dom.doc;
  S.settings=createViewSettings('solar');
  try{
    syncLayers();
    const button=dom.get('layer-speed-toggle');
    assert.equal(dom.get('layer-speed-toggle-label').textContent,'Kategorien');
    assert.equal(button.attrs['data-layer-view'],'categories');
    assert.match(button.attrs['aria-label'],/Aktuelle Ansicht: Kategorien\. Zu Tempo wechseln/);
    assert.equal(button.attrs['aria-pressed'],'false');
    toggleLayerSpeedPanel();
    assert.equal(dom.get('layer-speed-toggle-label').textContent,'Tempo');
    assert.equal(button.attrs['data-layer-view'],'tempo');
    assert.match(button.title,/Aktuelle Ansicht: Tempo\. Zu Kategorien wechseln/);
    assert.equal(button.attrs['aria-pressed'],'true');
    toggleLayerSpeedPanel();
    assert.equal(button.attrs['data-layer-view'],'categories');
    S.settings.row=true;
    syncLayers();
    assert.equal(button.disabled,true);
    assert.equal(button.attrs['data-layer-view'],'categories');
    assert.match(button.title,/Reihenansicht/);
  }finally{
    S.settings=previousSettings;
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});

test('v125: Tempo has only values and icon actions; text headings are gone',async()=>{
  const [html,events,css]=await Promise.all([read('index.html'),read('src/ui/event-handlers.js'),read('css/styles.css')]);
  const layer=html.slice(html.indexOf('id="layer-speed-panel"'),html.indexOf('id="canvas-error"'));
  const pos=id=>layer.indexOf(`id="${id}"`);
  assert.ok(pos('layer-speed')<pos('layer-play-btn') && pos('layer-play-btn')<pos('layer-today-btn'));
  assert.ok(pos('layer-today-btn')<pos('layer-sim-date'));
  assert.doesNotMatch(layer,/class="layer-speed-caption"|>Geschwindigkeit<\/span>|>Datum<\/span>/);
  assert.doesNotMatch(layer,/id="layer-play-label"|>Pause<\/span>|>Heute<\/span>/);
  assert.match(layer,/class="layer-speed-value-track"[\s\S]*?id="layer-speed-value"/);
  assert.match(layer,/<time class="layer-speed-date" id="layer-sim-date"/);
  assert.match(layer,/id="layer-play-btn"[^>]*aria-pressed="true"/);
  assert.match(layer,/id="layer-today-btn"[^>]*aria-label="Simulation auf aktuelle lokale Zeit zurücksetzen"/);
  assert.match(events,/\$\('layer-play-btn'\)\.addEventListener\('click',togglePlayback\)/);
  assert.match(events,/\$\('layer-today-btn'\)\.addEventListener\('click',resetToToday\)/);
  assert.match(events,/const resetToToday=\(\)=>\{S\.time=Date\.now\(\);renderer\?\.resetGalacticTrails\?\.\(\);updateTime\(\);updateDetail\(\);notifyToggle\('Heute: Datum zurückgesetzt'\);\}/);
  assert.match(css,/\.layer-speed-actions\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('v124: the only playback control and date display track state changes',()=>{
  const previousDocument=globalThis.document,dom=stubDOM();globalThis.document=dom.doc;
  try{
    const state={timelineMode:'solar',playing:true,speed:5,time:new Date(2026,10,21,20,20).getTime()};
    syncControls(state);
    assert.equal(dom.get('layer-play-btn').attrs['aria-pressed'],'true');
    assert.equal(dom.get('layer-play-btn').attrs['aria-label'],'Simulation pausieren');
    assert.match(dom.get('layer-play-icon-path').attrs.d,/M7 5h4/);
    assert.equal(dom.get('layer-sim-date').textContent,'21.11.2026 20:20');
    assert.equal(dom.get('layer-speed-value').textContent,'5 Tage / s');
    state.playing=false;state.time=new Date(2026,10,21,10,5).getTime();
    syncControls(state);
    assert.equal(dom.get('layer-play-btn').attrs['aria-pressed'],'false');
    assert.equal(dom.get('layer-play-btn').attrs['aria-label'],'Simulation starten');
    assert.match(dom.get('layer-play-icon-path').attrs.d,/M7 4v16/);
    assert.match(dom.get('layer-play-btn').attrs['aria-label'],/Simulation starten/);
    assert.equal(dom.get('layer-sim-date').textContent,'21.11.2026 10:05');
    assert.equal(dom.get('layer-sim-date').attrs.datetime,new Date(state.time).toISOString());
  }finally{
    if(previousDocument===undefined)delete globalThis.document;
    else globalThis.document=previousDocument;
  }
});

test('v155: Play/Pause und Heute behalten die Zeitsteuerung bei und zeigen neue Toasts',async()=>{
  const source=await read('src/ui/event-handlers.js');
  const playback=source.match(/const togglePlayback=\(\)=>\{[^\n]+\};/)?.[0];
  const today=source.match(/const resetToToday=\(\)=>\{[^\n]+\};/)?.[0];
  assert.ok(playback&&today,'shared callbacks are implemented');
  const vm=(await import('node:vm')).default;
  const state={playing:true,time:123,speed:5,modeSpeeds:{solar:5}};
  const calls=[];
  const context=vm.createContext({
    S:state,updateTime:()=>calls.push('updateTime'),updateDetail:()=>calls.push('updateDetail'),
    renderer:{setSimulationPaused:paused=>calls.push(`setPaused:${paused}`),resetGalacticTrails:()=>calls.push('resetGalacticTrails')},
    notifyToggle:message=>calls.push(`toast:${message}`),formatSpeed:()=> '5 Tage / s',
    Date:{now:()=>1700000000000}
  });
  vm.runInContext(`${playback}\n${today}\nthis.togglePlayback=togglePlayback;this.resetToToday=resetToToday;`,context);
  context.togglePlayback();
  assert.equal(state.playing,false);
  assert.deepEqual(calls,['setPaused:true','updateTime','toast:Pause: Umlaufbahnen selektieren']);
  context.resetToToday();
  assert.equal(state.time,1700000000000);
  assert.equal(state.playing,false,'today leaves playback pause state unchanged');
  assert.equal(state.speed,5,'today does not alter speed');
  assert.deepEqual(calls,['setPaused:true','updateTime','toast:Pause: Umlaufbahnen selektieren',
    'resetGalacticTrails','updateTime','updateDetail','toast:Heute: Datum zurückgesetzt']);
});
