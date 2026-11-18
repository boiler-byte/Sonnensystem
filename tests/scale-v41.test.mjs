import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {createViewSettings} from '../src/data/layers.js';
import {AU_KM} from '../src/data/bodies.js';
import {displayBodyRadius,displayOrbitRadius,renderRadius,orbitalRadius,planetBodyRadius,planetOrbitRadius,SOLAR_UNITS_PER_AU,keplerPosition} from '../src/data/orbital-math.js';
import {SolarRenderer} from '../src/renderer/index.js';
import {cameraView} from '../src/renderer/camera.js';

const byId=id=>INITIAL_BODIES.find(body=>body.id===id);
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const close=(got,want,label)=>assert.ok(Math.abs(got-want)<1e-10*Math.max(1,Math.abs(want)),`${label}: ${got} != ${want}`);

test('v41: both toggles default off and preserve the v40 schematic geometry',()=>{
  for(const view of ['solar','planet']){
    const settings=createViewSettings(view);
    assert.equal(settings.scaleObjects,false);
    assert.equal(settings.scaleOrbits,false);
    const earth=byId('earth'),moon=byId('moon');
    if(view==='solar'){
      close(displayBodyRadius(earth,settings),renderRadius(earth),'schematic solar radius');
      close(displayOrbitRadius(earth,byId('sun'),settings),orbitalRadius(earth,byId('sun')),'schematic solar orbit');
    }else{
      close(displayBodyRadius(moon,settings,earth),planetBodyRadius(moon),'schematic moon radius');
      close(displayOrbitRadius(moon,earth,settings,earth),planetOrbitRadius(moon,earth),'schematic moon orbit');
    }
  }
});

test('v41: Object toggle scales body radii proportionally while orbits stay schematic',()=>{
  const settings={scaleObjects:true,scaleOrbits:false};
  const earth=byId('earth'),jupiter=byId('jupiter'),sun=byId('sun'),moon=byId('moon');
  close(displayBodyRadius(jupiter,settings)/displayBodyRadius(earth,settings),jupiter.radiusKm/earth.radiusKm,'solar physical radius ratios');
  close(displayBodyRadius(sun,settings),4*renderRadius(sun),'optimized solar sun size');
  close(displayOrbitRadius(earth,sun,settings),4*orbitalRadius(earth,sun),'expanded schematic solar distance');
  close(displayBodyRadius(moon,settings,earth),moon.radiusKm/earth.radiusKm*1.28,'planet physical moon size');
  close(displayBodyRadius(earth,settings,earth),1.28,'planet central radius');
  close(displayOrbitRadius(moon,earth,settings,earth),planetOrbitRadius(moon,earth),'local orbit unaffected');
});

test('v41: Bahn toggle scales only distances linearly with a, not body sizes',()=>{
  const settings={scaleObjects:false,scaleOrbits:true};
  const sun=byId('sun'),earth=byId('earth'),mars=byId('mars'),moon=byId('moon');
  close(displayOrbitRadius(mars,sun,settings)/displayOrbitRadius(earth,sun,settings),mars.a/earth.a,'solar a ratio');
  close(displayOrbitRadius(earth,sun,settings),earth.a*SOLAR_UNITS_PER_AU,'physical solar distance');
  close(displayOrbitRadius(moon,earth,settings),moon.a/AU_KM*SOLAR_UNITS_PER_AU,'physical moon distance in solar view');
  close(displayOrbitRadius(moon,earth,settings,earth),moon.a/earth.radiusKm*1.28,'physical local moon distance');
  close(displayBodyRadius(earth,settings),renderRadius(earth),'schematic radius unchanged');
});

test('v41: when both toggles are on, size-to-orbit ratios match catalog kilometers',()=>{
  const settings={scaleObjects:true,scaleOrbits:true};
  const sun=byId('sun'),earth=byId('earth'),moon=byId('moon');
  close(displayOrbitRadius(earth,sun,settings)/displayBodyRadius(sun,settings),earth.a*AU_KM/sun.radiusKm,'solar AU / sun radius');
  close(displayOrbitRadius(moon,earth,settings,earth)/displayBodyRadius(earth,settings,earth),moon.a/earth.radiusKm,'moon orbit / earth radius');
  close(displayBodyRadius(moon,settings,earth)/displayBodyRadius(earth,settings,earth),moon.radiusKm/earth.radiusKm,'moon / earth radius');
  assert.equal(displayBodyRadius({radiusKm:0},settings),0,'missing radius is not fabricated');
});

test('v41: renderer position and orbit use the same physical radius in isolated planet view',()=>{
  const earth=byId('earth'),moon=byId('moon'),t=Date.UTC(2026,10,16);
  const r=Object.create(SolarRenderer.prototype);
  r.planetId='earth';r.width=1000;r.height=680;r.bodies=[earth,moon];r.byId=new Map(r.bodies.map(b=>[b.id,b]));
  r.positions=new Map();r.overrides=new Map();r.settings={scaleObjects:true,scaleOrbits:true};
  r.planetChildren=()=>[moon];r.calcPositions(t);
  const expected=keplerPosition(moon,earth,t,null,displayOrbitRadius(moon,earth,r.settings,earth));
  r.positions.get('moon').forEach((v,i)=>close(v,expected[i],`moon local position ${i}`));
  assert.ok(r.planetFrameDistance()>95,'real local distances can be framed beyond the old 95-unit cap');
});

test('v41: three icon triggers and right-anchored popovers, with accessible independent toggles',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css');
  const controls=html.slice(html.indexOf('id="view-mode-status"'),html.indexOf('id="canvas-error"'));
  assert.ok(controls.indexOf('id="scale-btn"')<controls.indexOf('id="layer-btn"'));
  assert.ok(controls.indexOf('id="layer-btn"')<controls.indexOf('id="speed-btn"'));
  assert.match(controls,/id="scale-btn"[^>]*aria-expanded="false"[^>]*aria-haspopup="true"[^>]*aria-controls="scale-popover"/);
  assert.match(controls,/id="scale-popover"[^>]*aria-label="Maßstab" hidden/);
  for(const id of ['scale-objects-btn','scale-orbits-btn'])
    assert.match(controls,new RegExp(`id="${id}"[^>]*aria-pressed="false"`));
  assert.match(controls,/scale-option-label">Objekt/);
  assert.match(controls,/scale-option-label">Bahn/);
  assert.doesNotMatch(controls,/scale-popover-note|scale-popover-heading/);
  const v41=css.slice(css.indexOf('/* v41: three independent top-edge menus'));
  assert.match(v41,/width:calc\(var\(--control-trigger-width\) \+ var\(--control-trigger-width\) \+ var\(--control-trigger-width\) \+ var\(--control-trigger-gap\) \+ var\(--control-trigger-gap\)\)!important/);
  const v42=css.slice(css.indexOf('/* v42: Maßstab is first'));
  assert.match(v42,/\.viewport>\.control-panel \.scale-popover\{[\s\S]*?right:calc\(0px - var\(--control-trigger-width\) - var\(--control-trigger-width\) - var\(--control-trigger-gap\) - var\(--control-trigger-gap\) - var\(--control-right-inset\)\)/);
  assert.match(v42,/\.viewport>\.control-panel \.layer-popover\{[\s\S]*?right:calc\(0px - var\(--control-trigger-width\) - var\(--control-trigger-gap\) - var\(--control-right-inset\)\)/);
  assert.match(css,/\.viewport>\.control-panel \.time-panel \.speed-popover\{[\s\S]*?right:calc\(0px - var\(--control-right-inset\)\)/);
});

test('v41: scale toggles update both scene views and pressed states independently',async()=>{
  const app=await read('src/app.js');
  const section=app.slice(app.indexOf('function setScalePopover(open){'),app.indexOf('function syncOrbitControls(){'));
  const settings={solar:createViewSettings('solar'),planet:createViewSettings('planet')};
  const fake=new Map();
  const get=id=>{
    if(!fake.has(id))fake.set(id,{
      attrs:{},classes:{},status:{textContent:''},setAttribute(k,v){this.attrs[k]=v;},
      classList:{toggle(k,v){this._parent.classes[k]=v},_parent:null},
      querySelector(){return this.status;},title:''
    });
    const element=fake.get(id);element.classList._parent=element;return element;
  };
  const r={settings:settings.solar,_labelState:{},camera:{desiredDist:47,desiredTarget:[0,0,0]},planetId:null,focusedBodyId:null,cameraManuallyMoved:false,
    count:0,calcPositions(){this.count++;},planetFrameDistance(){return 180;}};
  const state={settings:settings.solar,viewSettings:settings,time:123};
  const notices=[];
  const context=vm.createContext({$:get,S:state,renderer:r,notifyToggle:msg=>notices.push(msg)});
  vm.runInContext(section,context);
  vm.runInContext('syncScaleControls();updateScale("scaleObjects");',context);
  assert.equal(settings.solar.scaleObjects,true);
  assert.equal(settings.planet.scaleObjects,true);
  assert.equal(settings.solar.scaleOrbits,false);
  assert.equal(get('scale-objects-btn').attrs['aria-pressed'],'true');
  assert.match(get('scale-objects-btn').title,/maßstabsgetreu/);
  assert.equal(get('scale-orbits-btn').attrs['aria-pressed'],'false');
  vm.runInContext('updateScale("scaleOrbits");',context);
  assert.equal(settings.solar.scaleOrbits,true);
  assert.equal(settings.planet.scaleOrbits,true);
  assert.equal(get('scale-orbits-btn').attrs['aria-pressed'],'true');
  assert.equal(r.camera.desiredDist,160,'solar camera reframes the enlarged system');
  vm.runInContext('updateScale("scaleObjects");',context);
  assert.equal(settings.solar.scaleObjects,false);
  assert.equal(settings.solar.scaleOrbits,true,'the Bahn toggle stays on');
  assert.equal(r.count,3,'each change recalculates positions immediately');
  assert.deepEqual(notices,['Maßstab: Optimierte Größenverhältnisse','Bahn: Maßstabsgetreu','Objekt: Schematisch']);
  assert.equal(r._labelState,null,'label anchors are reset after scale change');
});


test('v41: physically sized planets can be focused and zoomed in below schematic limits',()=>{
  const earth=byId('earth'),moon=byId('moon'),sun=byId('sun');
  const r=Object.create(SolarRenderer.prototype);
  r.settings={scaleObjects:true,scaleOrbits:true};
  r.planetId=null;r.byId=new Map([sun,earth,moon].map(b=>[b.id,b]));
  r.positions=new Map([['earth',[3.4,0,0]],['moon',[3.4,0,.008]],['sun',[0,0,0]]]);
  r.camera={dist:47,desiredDist:47,theta:.63,phi:.99,target:[0,0,0],desiredTarget:[0,0,0]};
  r.followEnabled=false;r.focusedBodyId=null;
  assert.equal(r.minCameraDistance(),0.000005);
  r.focus('earth');
  assert.deepEqual(r.camera.desiredTarget,[3.4,0,0]);
  close(r.camera.desiredDist,displayBodyRadius(earth,r.settings)*10,'focused Earth size');
  assert.ok(r.camera.desiredDist<2.2,'physical Earth needs close zoom');
  r.camera.dist=r.camera.desiredDist;r.camera.target=[3.4,0,0];
  const projected=cameraView(r.camera,1000,600,0,350);
  assert.ok(projected.vp.every(Number.isFinite),'dynamically clipped camera has finite projection');
  r.settings={scaleObjects:false,scaleOrbits:false};
  assert.equal(r.minCameraDistance(),2.2,'old zoom limit retained in schematic mode');
  r.focus('earth');
  assert.equal(r.camera.desiredDist,10.5,'old focus distance retained in schematic mode');
});
