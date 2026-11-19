import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {rowScannerSize} from '../src/renderer/row-inspection.js';
import {updateRowInspectionHUD} from '../src/ui/row-inspection.js';

// v95 regression: v94 still had the original 560px hard cap. A large enough
// viewport must let the radar follow the sphere until it meets the HUD.
test('v95: large radar exceeds former 560px cap and follows the planet until real HUD boundaries',()=>{
  assert.equal(rowScannerSize(350,600,1600,1200,1160),726);
  assert.equal(rowScannerSize(450,600,1600,1200,1160),926);
  assert.equal(rowScannerSize(700,600,1600,1200,1160),1086);
  assert.equal(rowScannerSize(900,600,1600,1200,1160),1086,
    'frame freezes only when the title or readings are reached');
  assert.equal(rowScannerSize(700,600,1600,1200,1160,875),526,
    'an earlier distance arrow can still limit the frame');
});

const vp=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const at=(x,y,w,h)=>[x/w*2-1,1-y/h*2,0];
function node(svg=false){
  const attrs=new Map(svg?[['hidden','']]:[]);
  return {hidden:true,dataset:{},style:{},textContent:'',innerHTML:'',offsetWidth:100,
    classList:{add(){},remove(){}},setAttribute(k,v){attrs.set(k,String(v));},
    removeAttribute(k){attrs.delete(k);},getAttribute(k){return attrs.get(k);}};
}
function largeHud(radius,cinema=false){
  const width=1920,height=1200;
  const ids=['row-inspection','row-inspection-scanner','row-inspection-title','row-inspection-metrics',
    'row-inspection-name','row-inspection-scan-tag','row-inspection-gravity','row-inspection-temperature',
    'row-inspection-gravity-icon','row-inspection-temperature-icon','row-inspection-vector-svg',
    'row-inspection-vector-line','row-inspection-vector-head','row-inspection-vector-origin',
    'row-inspection-distance','row-inspection-distance-value'];
  const nodes=new Map(ids.map(id=>[id,node(id==='row-inspection-vector-svg')]));
  const sun={id:'sun',name:'Sonne',radiusKm:696000};
  const planet={id:'jupiter',name:'Jupiter',parentId:'sun',radiusKm:69911,
    meanDistanceToParent:5.2,meanDistanceUnit:'AU',surfaceGravityMs2:24.79,temperatureMeanK:165};
  const renderer={settings:{row:true},cinema:{active:cinema},rowHoveredId:'jupiter',
    byId:new Map([[planet.id,planet],[sun.id,sun]]),
    positions:new Map([[planet.id,at(1430,600,width,height)],[sun.id,at(150,600,width,height)]]),
    vp,width,height,rowHoverStartedAt:0,rowRenderedRadiusPx:b=>b.id==='jupiter'?radius:40};
  const original=globalThis.document;
  globalThis.document={getElementById:id=>nodes.get(id)};
  try{updateRowInspectionHUD(renderer,600);}
  finally{if(original===undefined)delete globalThis.document;else globalThis.document=original;}
  const get=id=>nodes.get(id);
  const size=parseFloat(get('row-inspection-scanner').style.width);
  const center=parseFloat(get('row-inspection-scanner').style.top);
  const titleBottom=parseFloat(get('row-inspection-title').style.top);
  const metricsTop=parseFloat(get('row-inspection-metrics').style.top);
  const arrowY=parseFloat(get('row-inspection-vector-line').getAttribute('d')?.split(' ')[1]);
  return {size,center,titleBottom,metricsTop,arrowY,
    distanceTop:parseFloat(get('row-inspection-distance').style.top),
    arrowVisible:get('row-inspection-vector-svg').getAttribute('hidden')===undefined};
}

test('v95: projected hover and Cinema frames really grow beyond 560px without covering the annotations',()=>{
  for(const cinema of [false,true]){
    const sizes=[350,450,800].map(radius=>largeHud(radius,cinema));
    assert.ok(sizes[0].size>560, 'already larger than the previous static maximum');
    assert.ok(sizes[1].size>sizes[0].size,'frame grows for the larger hovered planet');
    assert.ok(sizes[2].size>=sizes[1].size,'frame freezes only at the reserved HUD area');
    for(const hud of sizes){
      assert.equal(hud.arrowVisible,true);
      assert.ok(hud.center-hud.size/2>=hud.titleBottom+5,'title must be clear');
      assert.ok(hud.center+hud.size/2<=hud.metricsTop-8,'readings must be clear');
      assert.ok(hud.center+hud.size/2<=hud.arrowY-12,'distance arrow must be clear');
      assert.ok(hud.metricsTop+46<=hud.arrowY,'readings must stay off the arrow');
      assert.ok(hud.center+hud.size/2<hud.distanceTop,'distance label must remain clear');
    }
  }
});

test('v95: neither the CSS nor the sizing function imposes a fixed large-screen maximum',async()=>{
  const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
  const model=await readFile(new URL('../src/renderer/row-inspection.js',import.meta.url),'utf8');
  assert.doesNotMatch(model,/Math\.min\(560/);
  assert.doesNotMatch(css,/\.row-inspection-scanner\{[^}]*max-(?:width|height):/);
});
