import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {SolarRenderer} from '../src/renderer/index.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {orbitAppearance} from '../src/renderer/orbits.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const createRenderer=()=>{
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:.63,phi:.99,dist:47,desiredDist:47,target:[0,0,0],desiredTarget:[0,0,0]};
  r.byId=new Map(INITIAL_BODIES.map(b=>[b.id,b]));
  r.positions=new Map([['earth',[1,0,0]],['mars',[4,0,0]],['sun',[0,0,0]],['moon',[1.2,0,0]]]);
  r.selectedId='earth';r.planetId=null;r.simTime=Date.UTC(2026,10,21);
  r.height=700;r.width=1000;r.settings={scaleObjects:false};
  r.followEnabled=false;r.followedBodyId=null;r.followLastPosition=null;r.followLastAtMs=null;
  r.focusedBodyId=null;r.cameraManuallyMoved=false;r.callbacks={};
  r.calcPositions=()=>{};
  return r;
};

test('v114: Reihe immediately precedes Objekt and Bahn, contrast starts second display row',async()=>{
  const html=await read('index.html');
  const control=html.slice(html.indexOf('class="scale-main-controls"'),html.indexOf('id="layer-picker-wrap"'));
  assert.deepEqual([...control.matchAll(/id="(orbit-row-btn|scale-objects-btn|scale-orbits-btn)"/g)].map(x=>x[1]),[
    'orbit-row-btn','scale-objects-btn','scale-orbits-btn'
  ]);
  const layer=html.slice(html.indexOf('class="layer-display-toggles"'),html.indexOf('class="layer-options"'));
  assert.deepEqual([...layer.matchAll(/id="(toggle-labels|orbit-visibility-btn|orbit-contrast-btn|toggle-lighting|toggle-four-moons)"/g)].map(x=>x[1]),[
    'toggle-labels','orbit-visibility-btn','orbit-contrast-btn','toggle-lighting','toggle-four-moons'
  ]);
  assert.match(layer,/id="orbit-contrast-btn"[^>]*aria-pressed="false"/);
  assert.match(html,/<button id="hero-body"[^>]*type="button"/);
});

test('v114: a renderer pick changes only the desired camera target in the solar view',()=>{
  const r=createRenderer();
  r.setSelected('mars',{focus:true,zoom:false});
  assert.deepEqual(r.camera.desiredTarget,[4,0,0]);
  assert.equal(r.camera.desiredDist,47);
  assert.equal(r.focusedBodyId,'mars');
  r.setSelected('earth',{focus:true,zoom:true});
  assert.deepEqual(r.camera.desiredTarget,[1,0,0]);
  assert.equal(r.camera.desiredDist,10.5,'catalog and hero must still zoom in');
});

test('v114: renderer picking a followed body still centers but never zooms',()=>{
  const r=createRenderer();
  r.followEnabled=true;
  r.followedBodyId='earth';
  r.setSelected('mars',{focus:true,zoom:false});
  assert.equal(r.followedBodyId,'mars');
  assert.equal(r.followEnabled,true);
  assert.deepEqual(r.camera.desiredTarget,[4,0,0]);
  assert.equal(r.camera.desiredDist,47);
  r.setSelected('earth',{focus:true,zoom:true});
  assert.equal(r.camera.desiredDist,10.5);
});

test('v114: isolated planet child pick preserves zoom, catalog focus changes it',()=>{
  const r=createRenderer();
  r.planetId='earth';
  r.setSelected('moon',{focus:true,zoom:false});
  assert.deepEqual(r.camera.desiredTarget,[1.2,0,0]);
  assert.equal(r.camera.desiredDist,47);
  r.setSelected('moon',{focus:true,zoom:true});
  assert.equal(r.camera.desiredDist,6.5);
});

test('v114: speed cutoff suspends steering until explicit reselection without toggling Folgen',()=>{
  const r=createRenderer();
  const changes=[];r.callbacks.onFollowChange=v=>changes.push(v);
  assert.equal(r.follow('earth',100),true);
  assert.equal(r.followEnabled,true);
  r.camera.theta=1.3;r.camera.phi=1.4;r.camera.desiredTarget=[1,0,0];
  r.positions.set('earth',[100,0,0]);r.updateFollowTarget(110);
  assert.equal(r.followEnabled,true);
  assert.equal(r.followedBodyId,null);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  assert.deepEqual([r.camera.theta,r.camera.phi],[.63,.99]);
  assert.equal(r.cameraPresetIndex,0);
  r.positions.set('earth',[101,0,0]);r.updateFollowTarget(120);
  assert.equal(r.followedBodyId,null,'do not resume on next render frame');
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  r.setSelected('earth',{focus:true,zoom:false});
  assert.equal(r.followedBodyId,'earth');
  assert.deepEqual(r.camera.desiredTarget,[101,0,0]);
  assert.deepEqual(changes,[]);
  assert.equal(r.follow('earth',200),true,'repeated follow requests cannot disable the mode');
  assert.equal(r.followEnabled,true);
  assert.deepEqual(changes,[]);
});

test('v114: picking, catalog selection and hero invoke the distinct focus/zoom paths',async()=>{
  const runtime=await read('src/app/runtime.js');
  const handlers=await read('src/ui/event-handlers.js');
  const catalog=await read('src/ui/object-list.js');
  const camera=await read('src/app/camera-controller.js');
  assert.match(runtime,/onSelect:id=>selectBody\(id,true,\{zoom:renderer\?\.settings\?\.row===true\}\)/);
  assert.match(catalog,/onSelect\(b\.dataset\.id,true\)/);
  assert.match(handlers,/\$\('hero-body'\)\.addEventListener\('click',\(\)=>\{[\s\S]*?selectBody\(body\.id,true\)/);
  assert.match(camera,/setSelected\(body\.type==='probe'\?null:id,\{focus:focus&&body\.type!=='probe',zoom:zoom&&body\.type!=='probe'\}\)/);
});

test('v114: contrast impacts both circular orbits and galactic trails without modifying mode flags',()=>{
  const earth={id:'earth',type:'planet'};
  for(const galacticMotion of [false,true]){
    const base={orbits:true,galacticMotion,orbitContrast:false};
    const strong={...base,orbitContrast:true};
    const weakLook=orbitAppearance(earth,base);
    const strongLook=orbitAppearance(earth,strong);
    assert.ok(strongLook.widthPx>weakLook.widthPx);
    assert.ok(strongLook.alpha>weakLook.alpha);
    assert.equal(base.galacticMotion,strong.galacticMotion);
  }
});
