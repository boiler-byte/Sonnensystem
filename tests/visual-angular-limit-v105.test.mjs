import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VisualAngularClocks, MAX_VISIBLE_TURNS_PER_SECOND} from '../src/renderer/visual-angular-limit.js';

test('v105: limit to five visual revolutions per real second without modifying the timeline',()=>{
 const clocks=new VisualAngularClocks();
 const period=1000,simulationTime=500000;
 clocks.beginFrame(1000);assert.equal(clocks.sample('moon','orbit',simulationTime,period),simulationTime);
 clocks.beginFrame(1100);
 const next=simulationTime+100000;
 assert.equal(clocks.sample('moon','orbit',next,period),simulationTime+500);
 assert.equal(next,600000,'source simulation clock stays intact');
 assert.equal(MAX_VISIBLE_TURNS_PER_SECOND,5);
});
test('v105: reverse movement is limited and normal movement passes through',()=>{
 const clocks=new VisualAngularClocks();clocks.beginFrame(1000);
 assert.equal(clocks.sample('earth','spin',10000,2000),10000);
 clocks.beginFrame(1100);assert.equal(clocks.sample('earth','spin',11000,2000),11000);
 clocks.beginFrame(1200);assert.equal(clocks.sample('earth','spin',-9000,2000),10000);
});
test('v105: orbital and spin clocks of each body stay independent',()=>{
 const c=new VisualAngularClocks();c.beginFrame(1000);
 c.sample('a','orbit',0,1000);c.sample('a','spin',0,2000);c.sample('b','orbit',0,1000);
 c.beginFrame(1100);
 assert.equal(c.sample('a','orbit',100000,1000),500);
 assert.equal(c.sample('a','spin',100000,2000),1000);
 assert.equal(c.sample('b','orbit',200,1000),200);
 assert.equal(c.sample('a','orbit',100000,1000),500,'same-frame samples do not advance twice');
});
