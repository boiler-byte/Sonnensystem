import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {DAY} from '../src/renderer/math.js';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {galacticStarParallaxTarget,starParallaxDepthWeight,
  easeGalacticStarOffset,STAR_PARALLAX_MAX_WORLD_OFFSET} from '../src/renderer/galactic-parallax.js';

const start=Date.UTC(2026,0,1);
const approx=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('v111: stars move against the straight galactic flight direction, not sideways',()=>{
  const ahead=galacticStarParallaxTarget(start+365.25*DAY,start);
  assert.equal(ahead[0],0);
  assert.ok(ahead[1]<0 && ahead[2]<0);
  approx(ahead[2],ahead[1]*.16);
  const twice=galacticStarParallaxTarget(start+2*365.25*DAY,start);
  approx(twice[1],ahead[1]*2);
  const reverse=galacticStarParallaxTarget(start-365.25*DAY,start);
  approx(reverse[1],-ahead[1]);
  assert.deepEqual(galacticStarParallaxTarget(start,start),[0,0,0]);
});

test('v111: near stars move considerably more than far stars, without star streaks',()=>{
  const near=starParallaxDepthWeight(100);
  const mid=starParallaxDepthWeight(162.5);
  const far=starParallaxDepthWeight(225);
  approx(near,1);approx(far,.02);
  assert.ok(mid<near && mid>far);
  assert.ok(near/far>=40);
  const capped=galacticStarParallaxTarget(start+100000*DAY,start);
  assert.ok(Math.hypot(...capped)<=STAR_PARALLAX_MAX_WORLD_OFFSET+1e-8);
});

test('v111: parallax respects paused time, off state and interpolated mode exit',()=>{
  assert.deepEqual(galacticStarParallaxTarget(start+DAY,start,false),[0,0,0]);
  assert.deepEqual(galacticStarParallaxTarget(start+DAY,null),[0,0,0]);
  assert.deepEqual(galacticStarParallaxTarget(NaN,start),[0,0,0]);
  const playing=galacticStarParallaxTarget(start+365.25*DAY,start);
  assert.deepEqual(playing,galacticStarParallaxTarget(start+365.25*DAY,start));
  const leaving=easeGalacticStarOffset(playing,[0,0,0],16);
  assert.ok(Math.abs(leaving[1])<Math.abs(playing[1]));
  assert.ok(Math.abs(leaving[1])>0);
  assert.deepEqual(easeGalacticStarOffset([0,0,0],[0,0,0],32),[0,0,0]);
});

test('v111: renderer anchors parallax when mode starts and resets after leaving or time reset',()=>{
  const r=Object.create(SolarRenderer.prototype);
  r.settings={};r.planetId=null;r.positions=new Map();r.cinema=null;
  r.calcPositions=()=>{};r.resetGalacticTrails();
  r.start(start,'sun',{galacticMotion:true,orbits:true,row:false});
  assert.equal(r._galacticStarReferenceTime,start);
  r.start(start+365.25*DAY,'sun',{galacticMotion:true,orbits:true,row:false});
  const next=r.advanceGalacticStarParallax(1000);
  assert.ok(next[1]<0);
  r.start(start+365.25*DAY,'sun',{galacticMotion:false,orbits:true,row:false});
  assert.equal(r._galacticStarReferenceTime,null);
  const exiting=r.advanceGalacticStarParallax(1016);
  assert.ok(exiting[1]<0 && exiting[1]>next[1]);
  r.start(start+2*365.25*DAY,'sun',{galacticMotion:true,orbits:true,row:false});
  assert.equal(r._galacticStarReferenceTime,start+2*365.25*DAY);
  r.resetGalacticTrails();
  assert.equal(r._galacticStarReferenceTime,null);
  r.start(start+3*365.25*DAY,'sun',{galacticMotion:true,orbits:true,row:false});
  assert.equal(r._galacticStarReferenceTime,start+3*365.25*DAY);
});

test('v111: WebGL offsets existing star geometry in the vertex shader only',async()=>{
  const [shaders,geometry,renderer,worker]=await Promise.all([
    readFile(new URL('../src/renderer/shaders.js',import.meta.url),'utf8'),
    readFile(new URL('../src/renderer/geometry.js',import.meta.url),'utf8'),
    readFile(new URL('../src/renderer/renderer.js',import.meta.url),'utf8'),
    readFile(new URL('../sw.js',import.meta.url),'utf8')]);
  assert.match(shaders,/uniform vec3 uGalacticStarOffset/);
  assert.match(shaders,/aPosition\+uGalacticStarOffset\*depthWeight/);
  assert.match(renderer,/gl\.uniform3f\(this\.uniform\(p,'uGalacticStarOffset'\)/);
  assert.match(renderer,/this\.drawStars\(vp\)/);
  assert.match(geometry,/R=100\+rnd\(\)\*125/);
  assert.match(worker,/\.\/src\/renderer\/galactic-parallax\.js/);
});
