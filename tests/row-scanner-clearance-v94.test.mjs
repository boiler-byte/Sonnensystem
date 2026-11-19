import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {rowScannerSize} from '../src/renderer/row-inspection.js';
import {updateRowInspectionHUD} from '../src/ui/row-inspection.js';

const vp=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const at=(x,y,w=800,h=600)=>[x/w*2-1,1-y/h*2,0];
const sun={id:'sun',name:'Sonne',radiusKm:696000};
const body={id:'earth',name:'Erde',parentId:'sun',radiusKm:6371,
  meanDistanceToParent:1,meanDistanceUnit:'AU',surfaceGravityMs2:9.81,temperatureMeanK:288};

function element(svg=false){
  const attrs=new Map(svg?[['hidden','']]:[]);
  return {hidden:true,dataset:{},style:{},textContent:'',innerHTML:'',offsetWidth:100,
    classList:{add(){},remove(){}},setAttribute(k,v){attrs.set(k,String(v));},
    removeAttribute(k){attrs.delete(k);},getAttribute(k){return attrs.get(k);}};
}
function fixture(radius,options={}){
  const names=['row-inspection','row-inspection-scanner','row-inspection-title','row-inspection-metrics',
    'row-inspection-name','row-inspection-scan-tag','row-inspection-gravity','row-inspection-temperature',
    'row-inspection-gravity-icon','row-inspection-temperature-icon','row-inspection-vector-svg',
    'row-inspection-vector-line','row-inspection-vector-head','row-inspection-vector-origin',
    'row-inspection-distance','row-inspection-distance-value'];
  const nodes=new Map(names.map(id=>[id,element(id==='row-inspection-vector-svg')]));
  const renderer={settings:{row:true},cinema:{active:!!options.cinema},rowHoveredId:'earth',
    byId:new Map([[body.id,body],[sun.id,sun]]),
    positions:new Map([[body.id,at(options.x??600,options.y??300,options.width??800,options.height??600)],
      [sun.id,at(options.parentX??100,options.y??300,options.width??800,options.height??600)]]),
    vp,width:options.width??800,height:options.height??600,rowHoverStartedAt:0,
    rowRenderedRadiusPx:b=>b.id==='earth'?radius:35};
  return {nodes,renderer};
}
function measure(fixture){
  const old=globalThis.document;
  globalThis.document={getElementById:id=>fixture.nodes.get(id)};
  try{updateRowInspectionHUD(fixture.renderer,600);}
  finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
  const get=id=>fixture.nodes.get(id);
  const frame=get('row-inspection-scanner');
  return {size:parseFloat(frame.style.width), top:parseFloat(frame.style.top)-parseFloat(frame.style.height)/2,
    bottom:parseFloat(frame.style.top)+parseFloat(frame.style.height)/2,
    titleBottom:parseFloat(get('row-inspection-title').style.top),
    metricsTop:parseFloat(get('row-inspection-metrics').style.top),
    arrowY:parseFloat(get('row-inspection-vector-line').getAttribute('d')?.split(' ')[1]??'NaN'),
    arrowVisible:get('row-inspection-vector-svg').getAttribute('hidden')===undefined,
    distanceTop:parseFloat(get('row-inspection-distance').style.top)};
}

test('v94: radar follows body size and then freezes when text bands are reached',()=>{
  assert.equal(rowScannerSize(70,300,800,600,551),166);
  assert.equal(rowScannerSize(150,300,800,600,551),326);
  assert.equal(rowScannerSize(230,300,800,600,551),478);
  assert.equal(rowScannerSize(600,300,800,600,551),478,
    'a giant object must not push the radar over its captions');
});

test('v94: Cinema reserves space for bottom readings and a nearby distance arrow',()=>{
  assert.equal(rowScannerSize(400,300,800,600,435),246);
  assert.equal(rowScannerSize(400,300,800,600,551,430),236);
  assert.equal(rowScannerSize(400,300,800,600,435,430),236);
  assert.equal(rowScannerSize(400,80,800,600,551),46,
    'when the object touches the top edge even the 160px base scanner must shrink');
});

test('v94: actual Hover HUD keeps name, both measurements and arrow free of the radar',()=>{
  const tiny=measure(fixture(80));
  const medium=measure(fixture(170));
  const large=measure(fixture(500));
  assert.ok(tiny.size < medium.size && medium.size < large.size);
  assert.equal(large.size,418,'radar stops when the metrics need room ahead of the distance arrow');
  for(const hud of [tiny,medium,large]){
    assert.ok(hud.top >= hud.titleBottom+5, 'the ring stays below the name');
    assert.ok(hud.bottom <= hud.metricsTop-8, 'the ring stays above gravitation and temperature');
    assert.equal(hud.arrowVisible,true);
    assert.ok(hud.bottom <= hud.arrowY-12, 'the arrow line remains below the ring');
    assert.ok(hud.bottom < hud.distanceTop, 'the parent-distance text remains visible');
    assert.ok(hud.metricsTop+38+8 <= hud.arrowY, 'the readings also stay separate from the distance arrow');
  }
});

test('v94: Cinema and short viewports also keep the radar clear of the readings',()=>{
  const cinema=measure(fixture(500,{cinema:true}));
  assert.equal(cinema.size,246);
  assert.ok(cinema.bottom <= cinema.metricsTop-12);
  const mobile=measure(fixture(500,{width:390,height:780,cinema:true,x:260,y:240,parentX:65}));
  assert.equal(mobile.size,366,'a tall mobile viewport can fit a larger radar despite Cinema');
  assert.ok(mobile.top>=mobile.titleBottom+5);
  assert.ok(mobile.bottom<=mobile.metricsTop-12);
});

test('v94: no arrow for central bodies, while the scanner still caps at the HUD margins',()=>{
  const {nodes,renderer}=fixture(600);
  renderer.rowHoveredId='sun';
  renderer.positions.set('sun',at(400,300));
  renderer.rowRenderedRadiusPx=()=>600;
  const old=globalThis.document;
  globalThis.document={getElementById:id=>nodes.get(id)};
  try{updateRowInspectionHUD(renderer,0);}
  finally{if(old===undefined)delete globalThis.document;else globalThis.document=old;}
  assert.equal(nodes.get('row-inspection-scanner').style.width,'478px');
  assert.equal(nodes.get('row-inspection-vector-svg').getAttribute('hidden'),'');
});

test('v94: CSS does not override smaller HUD-constrained scanner dimensions',async()=>{
  const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
  assert.match(css,/\.row-inspection-scanner\{[^}]*min-width:0;min-height:0/);
  assert.doesNotMatch(css,/\.row-inspection-scanner\{[^}]*min-width:160px/);
});
