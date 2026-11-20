import assert from 'node:assert/strict';
import {test} from 'node:test';
import {boundedSimulationAdvance,MAX_SIMULATION_DAYS_PER_FRAME,MAX_SIMULATION_DAYS_PER_SECOND,SPEED_MODES,speedAtStep,ROW_SIMULATION_SPEED} from '../src/ui/timeline.js';

for(const mode of ['solar','planet']) {
  test(`v105: ${mode} caps speed in UI and underlying clock`,()=>{
    const state={timelineMode:mode,speed:100000,settings:{row:false}};
    assert.equal(SPEED_MODES[mode].max,MAX_SIMULATION_DAYS_PER_SECOND[mode]);
    assert.equal(speedAtStep(mode,240),MAX_SIMULATION_DAYS_PER_SECOND[mode]);
    assert.ok(boundedSimulationAdvance(state,1/60)<=MAX_SIMULATION_DAYS_PER_FRAME[mode]);
    assert.equal(boundedSimulationAdvance(state,2),MAX_SIMULATION_DAYS_PER_FRAME[mode]);
    assert.equal(boundedSimulationAdvance(state,0),0);
    assert.equal(boundedSimulationAdvance(state,-1),0);
  });
}
test('v105: row override remains effective but cannot circumvent frame limit',()=>{
  const state={timelineMode:'solar',speed:99999,settings:{row:true}};
  assert.equal(boundedSimulationAdvance(state,1),ROW_SIMULATION_SPEED);
  assert.equal(boundedSimulationAdvance(state,30),MAX_SIMULATION_DAYS_PER_FRAME.solar);
});
test('v105: normal speeds advance accurately at 60 fps',()=>{
  assert.ok(Math.abs(boundedSimulationAdvance({timelineMode:'solar',speed:5,settings:{}},1/60)-5/60)<1e-12);
  assert.ok(Math.abs(boundedSimulationAdvance({timelineMode:'planet',speed:1/24,settings:{}},1/60)-(1/24)/60)<1e-12);
});
