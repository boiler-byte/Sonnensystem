import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {updateRowInspectionHUD} from '../src/ui/row-inspection.js';

function mockElement(svg=false){
 const attrs=new Map(svg?[['hidden','']]:[]);
 return {
  ...(svg?{}:{hidden:true}),dataset:{},style:{},textContent:'',offsetWidth:100,
  classList:{add(){},remove(){}},
  setAttribute(name,value){attrs.set(name,String(value));},
  removeAttribute(name){attrs.delete(name);},
  hasAttribute(name){return attrs.has(name);},
  getAttribute(name){return attrs.get(name)??null;}
 };
}

const elementIds=[
 'row-inspection','row-inspection-scanner','row-inspection-title','row-inspection-metrics','row-inspection-gravity-icon','row-inspection-temperature-icon','row-inspection-name',
 'row-inspection-gravity','row-inspection-temperature','row-inspection-scan-tag',
 'row-inspection-vector-svg','row-inspection-vector-line',
 'row-inspection-vector-head','row-inspection-vector-origin','row-inspection-distance',
 'row-inspection-distance-value'
];

function makeEnvironment(){
 const nodes=new Map(elementIds.map(id=>[id,mockElement(id==='row-inspection-vector-svg')]));
 const earth={id:'earth',name:'Erde',parentId:'sun',radiusKm:6371,
  meanDistanceToParent:1,meanDistanceUnit:'AU',surfaceGravityMs2:9.80665,temperatureMeanK:287};
 const renderer={
  settings:{row:true},cinema:null,byId:new Map([['earth',earth],['sun',{id:'sun',radiusKm:696000}]]),rowHoveredId:'earth',
  positions:new Map([['earth',[.4,0,0]],['sun',[0,0,0]]]),
  // Identity matrix keeps both bodies in front of the fake camera at depth 1.
  vp:new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),
  width:800,height:600,planetId:null,rowHoverStartedAt:0,rowRenderedRadiusPx(){return 80;}
 };
 return {nodes,renderer,earth};
}

test('v79: real SVG hidden attribute is removed when the arrow is visible, not just a JS .hidden property',()=>{
 const previous=globalThis.document;
 const {nodes,renderer,earth}=makeEnvironment();
 globalThis.document={getElementById:id=>nodes.get(id)};
 const svg=nodes.get('row-inspection-vector-svg');
 try {
  assert.equal(svg.hasAttribute('hidden'),true,'markup initializes the vector hidden');
  updateRowInspectionHUD(renderer,600);
  assert.equal(svg.hasAttribute('hidden'),false,'visible SVG must lose its hidden attribute');
  assert.equal(nodes.get('row-inspection-distance').hidden,false);
  assert.match(nodes.get('row-inspection-vector-line').getAttribute('d'),/^M[\d.]+ [\d.]+H[\d.]+$/);
  assert.match(nodes.get('row-inspection-distance-value').textContent,/AE$/);

  renderer.byId.set('earth',{...earth,meanDistanceToParent:null,a:0});
  updateRowInspectionHUD(renderer,700);
  assert.equal(svg.hasAttribute('hidden'),true,'no reliable distance should hide the arrow');
  assert.equal(nodes.get('row-inspection-distance').hidden,true);

  renderer.byId.set('earth',earth);
  updateRowInspectionHUD(renderer,800);
  assert.equal(svg.hasAttribute('hidden'),false,'the arrow must reappear when a distance becomes available');
 } finally {
  if(previous===undefined)delete globalThis.document;
  else globalThis.document=previous;
 }
});

test('v79: the SVG overlay uses a CSS rule that does not hide SVGs without the attribute',async()=>{
 const css=await readFile(new URL('../css/styles.css',import.meta.url),'utf8');
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/id="row-inspection-vector-svg"[^>]*hidden/);
 assert.match(css,/\.row-inspection-vector-svg\[hidden\][^{]*\{display:none!important\}/);
 assert.match(css,/\.row-inspection-vector-svg\{[^}]*display:block/);
});
