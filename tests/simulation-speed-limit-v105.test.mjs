import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {effectiveSimulationSpeed,SPEED_MODES,speedAtStep,ROW_SIMULATION_SPEED} from '../src/ui/timeline.js';

// The current timeline bounds the slider; the rendering loop also bounds
// real-frame delta time to 0.12 s before advancing the simulation clock.
for(const mode of ['solar','planet']){
  test(`v105: ${mode} slider cannot exceed the configured maximum speed`,()=>{
    const range=SPEED_MODES[mode];
    assert.equal(speedAtStep(mode,240),range.max);
    assert.equal(speedAtStep(mode,1000),range.max);
    assert.equal(speedAtStep(mode,-1000),range.min);
    assert.equal(effectiveSimulationSpeed({timelineMode:mode,speed:range.max,settings:{row:false}}),range.max);
  });
}
test('v105: row overrides normal speed without overwriting either view',()=>{
  const state={timelineMode:'solar',speed:SPEED_MODES.solar.max,settings:{row:true}};
  assert.equal(effectiveSimulationSpeed(state),ROW_SIMULATION_SPEED);
  assert.equal(state.speed,SPEED_MODES.solar.max);
  state.settings.row=false;
  assert.equal(effectiveSimulationSpeed(state),SPEED_MODES.solar.max);
});
test('v105: animation loop bounds long pauses and frame hitches to 120 ms',async()=>{
  const loop=await readFile(new URL('../src/app/animation-loop.js',import.meta.url),'utf8');
  assert.match(loop,/Math\.min\(\.12,Math\.max\(0,\(now-\(loop\.prev\|\|now\)\)\/1000\)\)/);
  assert.match(loop,/if\(S\.playing&&simulationSpeed>0\)S\.time\+=d\*simulationSpeed\*86400000/);
});
