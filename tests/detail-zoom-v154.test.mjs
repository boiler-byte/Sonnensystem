import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../src/data/catalog.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';
import {SolarRenderer} from '../src/renderer/renderer.js';
import {renderDetail,detailSizeComparison} from '../src/ui/object-details.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const catalog=loadCatalog(async path=>JSON.parse(await read(path))).then(data=>data.bodies);

function domMock(){
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      elements.set(id,{id,innerHTML:'',textContent:'',hidden:false,disabled:false,
        className:'',title:'',attributes:{},
        style:{setProperty(){}},classList:{toggle(){}},dataset:{},
        setAttribute(name,value){this.attributes[name]=String(value);},
        querySelectorAll(){return [];},querySelector(){return null;}});
    }
    return elements.get(id);
  };
  return {get,document:{getElementById:get}};
}

function makeRenderer(){
  const r=Object.create(SolarRenderer.prototype);
  r.camera={theta:2.2,phi:.24,dist:47,desiredDist:47,
    target:[0,0,0],desiredTarget:[0,0,0]};
  r.width=1000;r.height=680;r.focusOffsetY=0;r.visibleFocusOffset=0;
  r.settings={orbits:true,scaleObjects:false,scaleOrbits:false,row:false};
  r.planetId=null;r.cameraManuallyMoved=true;r.cameraPresetIndex=1;r.focusedBodyId=null;
  r.followEnabled=false;r.followedBodyId=null;r.selectedId='earth';
  r.positions=new Map();r.transition=null;r.callbacks={};r.overrides=new Map();
  r.simTime=Date.UTC(2026,10,22);
  r.setBodies(INITIAL_BODIES.map(b=>({...b})));
  r.calcPositions(r.simTime);
  return r;
}

test('v154: selected object label survives missing sizes and probe-specific generic illustrations',async()=>{
  const bodies=await catalog,old=globalThis.document;
  // The spacecraft feed is schema v2 and loaded separately at runtime.
  const probe=(JSON.parse(await read('data/catalog/probes.json'))).objects[0];
  const mock=domMock();globalThis.document=mock.document;
  const state={bodies:[...bodies,probe],selected:null,sizeReferenceId:null};
  const show=id=>{state.selected=id;
    renderDetail(state,{planetId:null,followEnabled:false,overrides:new Map()},()=>{},()=>{});};
  try{
    show('earth');
    assert.equal(mock.get('hero-size-selected-name').textContent,'Erde');
    assert.equal(mock.get('hero-size-legend').hidden,false);
    assert.equal(mock.get('hero-size-reference-name').hidden,false);
    assert.equal(mock.get('hero-size-reference-name').disabled,false);

    const unmeasured=bodies.find(body=>body.id==='elara');
    assert.equal(detailSizeComparison(unmeasured,id=>bodies.find(body=>body.id===id)).valid,false);
    show('elara');
    assert.equal(mock.get('hero-size-selected-name').textContent,unmeasured.name);
    assert.equal(mock.get('hero-size-legend').hidden,false);
    assert.equal(mock.get('hero-generic-plot').hidden,false);
    assert.equal(mock.get('hero-size-plot').hidden,true);
    assert.equal(mock.get('hero-size-reference-name').hidden,true);
    assert.equal(mock.get('hero-size-reference-name').disabled,true);

    assert.equal(probe.type,'probe');
    show(probe.id);
    assert.equal(mock.get('hero-size-selected-name').textContent,probe.name);
    assert.equal(mock.get('hero-size-legend').hidden,false);
    assert.equal(mock.get('hero-size-reference-name').hidden,true);
    assert.equal(mock.get('hero-generic-plot').hidden,false);

    show(null);
    assert.equal(mock.get('hero-size-selected-name').textContent,'');
    assert.equal(mock.get('hero-size-legend').hidden,true);
    assert.equal(mock.get('hero-size-reference-name').hidden,true);
  }finally{
    if(old===undefined)delete globalThis.document;else globalThis.document=old;
  }
});

test('v154: chart zoom restores the standard solar perspective on both transitions without changing framing',()=>{
  const r=makeRenderer();
  const id='earth',position=r.positions.get(id).slice();
  const first=r.toggleDetailZoom(id);
  assert.equal(first,'near');
  assert.equal(r.camera.theta,.63);
  assert.equal(r.camera.phi,.99);
  assert.equal(r.cameraPresetIndex,0);
  assert.equal(r.cameraManuallyMoved,false);
  assert.deepEqual(r.camera.desiredTarget,position);
  const nearDistance=r.camera.desiredDist;
  r.camera.theta=3.2;r.camera.phi=1.52;r.cameraManuallyMoved=true;
  const second=r.toggleDetailZoom(id);
  assert.equal(second,'far');
  assert.equal(r.camera.theta,.63);
  assert.equal(r.camera.phi,.99);
  assert.equal(r.cameraPresetIndex,0);
  assert.equal(r.cameraManuallyMoved,false);
  assert.deepEqual(r.camera.desiredTarget,[0,0,0]);
  assert.ok(r.camera.desiredDist>nearDistance);
  assert.equal(r.selectedId,id);
  assert.equal(r.planetId,null);
});

test('v154: local-scene and row perspectives reset independently of near/far distances',()=>{
  const r=makeRenderer();
  r.showPlanetSystem('earth');
  r.camera.theta=1.9;r.camera.phi=.18;r.cameraManuallyMoved=true;
  r.toggleDetailZoom('earth');
  assert.equal(r.camera.theta,.63);
  assert.equal(r.camera.phi,.84);
  assert.equal(r.planetId,'earth');
  r.settings.row=true;
  r.camera.theta=.9;r.camera.phi=.16;
  const originalDistance=r.camera.desiredDist;
  r.realignDetailZoomPerspective();
  assert.equal(r.camera.theta,0);
  assert.equal(r.camera.phi,1.5);
  assert.equal(r.cameraPresetIndex,2);
  assert.equal(r.camera.desiredDist,originalDistance);
});

test('v154: far chart art scales to 50 percent with a transition; labels are independent and no status chip remains',async()=>{
  const [html,css,js]=await Promise.all([read('index.html'),read('css/styles.css'),read('src/ui/object-details.js')]);
  assert.match(html,/id="hero-size-selected-name"/);
  assert.match(html,/id="hero-size-reference-name"[^>]*disabled hidden/);
  assert.doesNotMatch(html,/hero-zoom-state/i);
  assert.doesNotMatch(js,/hero-zoom-state/i);
  assert.doesNotMatch(css,/hero-zoom-state/i);
  assert.match(css,/\.hero-size-label-reference\[hidden\]\{display:none!important\}/);
  assert.match(css,/\.detail-hero \.hero-size-art\{[^}]*transform:scale\(1\)[^}]*transition:transform 360ms/);
  assert.match(css,/\.hero-body\[data-detail-zoom="far"\] \.hero-size-art\{transform:scale\(\.5\)\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.detail-hero \.hero-size-art\{transition:none\}\}/);
});
