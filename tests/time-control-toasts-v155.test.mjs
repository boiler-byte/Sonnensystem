import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {speedAtStep,formatSpeed} from '../src/ui/timeline.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

// Execute the actual registered callbacks with a simulated runtime, without a
// browser dependency. This also catches missing toast or renderer updates.
async function timeActions(state){
  const source=await read('src/ui/event-handlers.js');
  const playback=source.match(/const togglePlayback=\(\)=>\{[^\n]+\};/)?.[0];
  const today=source.match(/const resetToToday=\(\)=>\{[^\n]+\};/)?.[0];
  const slider=source.match(/\$\('layer-speed'\)\.addEventListener\('input',(e=>\{[\s\S]*?\n  \})\);/)?.[1];
  assert.ok(playback && today && slider,'time controls remain bound to the layer panel');
  assert.match(source,/\$\('layer-play-btn'\)\.addEventListener\('click',togglePlayback\)/);
  assert.match(source,/\$\('layer-today-btn'\)\.addEventListener\('click',resetToToday\)/);
  const calls=[];
  const renderer={
    setSimulationPaused:paused=>calls.push(['rendererPause',paused]),
    resetGalacticTrails:()=>calls.push(['resetTrails'])
  };
  const context=vm.createContext({
    S:state,renderer,speedAtStep,formatSpeed,
    notifyToggle:message=>calls.push(['toast',message]),
    updateTime:()=>calls.push(['updateTime']),
    updateDetail:()=>calls.push(['updateDetail']),
    Date:{now:()=>1_800_000_000_000}
  });
  vm.runInContext(`${playback}\nconst sliderInput=${slider};\n${today}\nthis.actions={togglePlayback,sliderInput,resetToToday};`,context);
  return {actions:context.actions,calls};
}

function newState(){
  return {playing:true, time:Date.UTC(2026,10,22,15,0),speed:5,timelineMode:'solar',modeSpeeds:{solar:5,planet:1/24}};
}

test('v155: Pause reveals orbit-selection hint, Play reveals the current playback speed',async()=>{
  const state=newState();
  const {actions,calls}=await timeActions(state);
  actions.togglePlayback();
  assert.equal(state.playing,false);
  assert.deepEqual(calls,[['rendererPause',true],['updateTime'],['toast','Pause: Umlaufbahnen selektieren']]);
  calls.length=0;
  actions.togglePlayback();
  assert.equal(state.playing,true);
  assert.deepEqual(calls,[['rendererPause',false],['updateTime'],['toast','Play: Geschwindigkeit 5 Tage / s']]);
  assert.equal(state.speed,5,'Play and Pause never replace saved speed');
});

test('v155: moving the speed range resumes paused playback, synchronizes renderer and preserves time',async()=>{
  const state=newState();
  state.playing=false;
  const oldTime=state.time;
  const {actions,calls}=await timeActions(state);
  actions.sliderInput({target:{value:'170'}});
  assert.equal(state.speed,speedAtStep('solar',170));
  assert.equal(state.modeSpeeds.solar,state.speed);
  assert.equal(state.playing,true,'a manual slider adjustment resumes a pause');
  assert.equal(state.time,oldTime,'changing speed does not jump the simulation clock');
  assert.deepEqual(calls,[['rendererPause',false],['updateTime']],
    'the renderer immediately disables paused-orbit selection and controls refresh');
  calls.length=0;
  actions.sliderInput({target:{value:'240'}});
  assert.equal(state.speed,speedAtStep('solar',240));
  assert.equal(state.playing,true);
  assert.deepEqual(calls,[['updateTime']],'speed changes while playing do not restart playback');
});

test('v155: slider resumes only active mode and preserves the other mode speed',async()=>{
  const state=newState();
  const {actions,calls}=await timeActions(state);
  state.timelineMode='planet';state.speed=1/24;state.playing=false;
  actions.sliderInput({target:{value:'110'}});
  assert.equal(state.playing,true);
  assert.equal(state.modeSpeeds.planet,speedAtStep('planet',110));
  assert.equal(state.modeSpeeds.solar,5);
  assert.deepEqual(calls,[['rendererPause',false],['updateTime']]);
});

test('v155: Heute shows confirmation without changing paused or playing status or speed',async()=>{
  for(const playing of [false,true]){
    const state=newState();state.playing=playing;
    const speed=state.speed, saved={...state.modeSpeeds};
    const {actions,calls}=await timeActions(state);
    actions.resetToToday();
    assert.equal(state.time,1_800_000_000_000);
    assert.equal(state.playing,playing);
    assert.equal(state.speed,speed);
    assert.deepEqual(state.modeSpeeds,saved);
    assert.deepEqual(calls,[['resetTrails'],['updateTime'],['updateDetail'],['toast','Heute: Datum zurückgesetzt']]);
  }
});

test('v155: existing status toast and versioned offline shell remain integrated',async()=>{
  const [events,html,worker,pkg,readme]=await Promise.all([
    read('src/ui/event-handlers.js'),read('index.html'),read('sw.js'),read('package.json'),read('README.md')]);
  assert.match(events,/import \{notifyToggle\} from '\.\/status\.js'/);
  assert.match(html,/id="toggle-toast" class="toggle-toast" role="status" aria-live="polite"/);
  const version=JSON.parse(pkg).version.split('.')[0];
  assert.match(html,new RegExp(`content="V${version}\\.0"`));
  assert.match(worker,new RegExp(`sonnensystem-shell-v${version}`));
  assert.ok(Number(version)>=155);
  assert.match(readme,/Neu in v155: Toasts/);
});
