import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import * as ar from '../src/renderer/ar-mode.js';

const root=new URL('../',import.meta.url);

test('v110 supersedes v106: no four-direction AR movement toggle or device-motion listener',async()=>{
  const files=await Promise.all(['index.html','css/styles.css','src/app/ar-controller.js',
    'src/renderer/ar-mode.js'].map(file=>readFile(new URL(file,root),'utf8')));
  for(const content of files){
    assert.doesNotMatch(content,/ar-motion-btn|ar-motion-button|devicemotion|motionButton/);
  }
  assert.match(files[0],/id="ar-mode-btn"/,'the original AR orientation button remains');
  for(const method of ['activateMotion','toggleMotion','stopMotion','motionPanStep','deviceMotionInScene'])
    assert.equal(ar[method],undefined,`removed AR movement API: ${method}`);
});

test('v110: AR look uses orientation sensor only, and does not translate camera',async()=>{
  const listeners=new Map();
  const win={isSecureContext:true,screen:{width:390,height:844,orientation:{angle:0}},
    DeviceOrientationEvent:class {},DeviceMotionEvent:class {},
    matchMedia:()=>({matches:true}),
    addEventListener:(name,fn)=>listeners.set(name,fn),
    removeEventListener:name=>listeners.delete(name)};
  const button={hidden:true,parentElement:{classList:{toggle(){}}},classList:{toggle(){}},
    setAttribute(){},addEventListener(){},removeEventListener(){}};
  const camera={theta:.6,phi:1,dist:47,target:[0,0,0],desiredTarget:[0,0,0],desiredDist:47};
  const renderer={camera,panByPixels(){assert.fail('AR must not move the camera');}};
  const mode=ar.createARMode(renderer,button,{win,nav:{maxTouchPoints:5},
    doc:{addEventListener(){},removeEventListener(){}},
    schedule:()=>({unref(){}}),cancel(){}});
  assert.equal(await mode.activate(),true);
  assert.equal(listeners.has('deviceorientation'),true);
  assert.equal(listeners.has('devicemotion'),false);
  listeners.get('deviceorientation')({alpha:0,beta:70,gamma:0});
  assert.equal(mode.active,true);
  listeners.get('deviceorientation')({alpha:25,beta:72,gamma:0});
  assert.ok(renderer.camera.arView);
  assert.equal(listeners.has('devicemotion'),false);
  mode.dispose();
  assert.equal(listeners.has('deviceorientation'),false);
});
