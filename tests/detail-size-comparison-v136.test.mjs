import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../src/data/catalog.js';
import {detailSizeComparison,renderDetail} from '../src/ui/object-details.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const catalogPromise=loadCatalog(async path=>JSON.parse(await read(path))).then(x=>x.bodies);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

function documentMock(){
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      const styles=new Map();
      elements.set(id,{id,innerHTML:'',textContent:'',hidden:false,disabled:false,
        style:{setProperty(k,v){styles.set(k,v);},getPropertyValue(k){return styles.get(k)||'';}},
        className:'',classList:{toggle(){}},attributes:{},dataset:{},
        setAttribute(key,val){this.attributes[key]=val;},querySelectorAll(){return [];},querySelector(){return null;}});
    }
    return elements.get(id);
  };
  return {get,document:{getElementById:get}};
}

test('v136: planets and dwarf planets compare only with Earth, all other measured bodies with the Moon',async()=>{
  const bodies=await catalogPromise,byId=id=>bodies.find(b=>b.id===id);
  for(const b of bodies){
    const c=detailSizeComparison(b,byId);
    if(b.type==='probe'){assert.equal(c,null);continue;}
    assert.equal(c.referenceId,['planet','dwarf'].includes(b.type)?'earth':'moon',b.id);
    const valid=typeof b.radiusKm==='number'&&b.radiusKm>0;
    assert.equal(c.valid,valid,b.id);
    if(valid){
      near(c.selectedPercent/c.referencePercent,b.radiusKm/byId(c.referenceId).radiusKm);
      near(Math.max(c.selectedPercent,c.referencePercent),100);
      assert.ok(c.selectedPercent>0&&c.referencePercent>0);
    }
  }
  const saturn=detailSizeComparison(byId('saturn'),byId);
  assert.equal(saturn.referenceName,'Erde');
  assert.equal(saturn.referenceLarger,false);
  near(saturn.ratio,58232/6371);
  const pluto=detailSizeComparison(byId('pluto'),byId);
  assert.equal(pluto.referenceLarger,true);
  near(pluto.selectedPercent,100*1188.3/6371);
  const titan=detailSizeComparison(byId('titan'),byId);
  assert.equal(titan.referenceId,'moon');
  assert.equal(titan.referenceName,'Erdmond');
  assert.equal(titan.referenceLarger,false);
  const earth=detailSizeComparison(byId('earth'),byId);
  assert.equal(earth.equal,true);
  const moon=detailSizeComparison(byId('moon'),byId);
  assert.equal(moon.equal,true);
  assert.equal(detailSizeComparison(null,byId),null);
});

test('v136: detail diagram switches both size circles and legend with the selection; no radius produces no circles',async()=>{
  const bodies=await catalogPromise,oldDoc=globalThis.document;
  const doc=documentMock();globalThis.document=doc.document;
  const show=id=>renderDetail({bodies,selected:id},{planetId:null,followEnabled:false,overrides:new Map()},()=>{},()=>{});
  try{
    show('saturn');
    assert.equal(doc.get('hero-size-selected-name').textContent,'Saturn');
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erde');
    assert.match(doc.get('hero-size-ratio').textContent,/9,14.*Erde/);
    assert.equal(doc.get('hero-size-plot').style.getPropertyValue('--size-selected'),'100.000000%');
    assert.ok(parseFloat(doc.get('hero-size-plot').style.getPropertyValue('--size-reference'))<11);
    assert.equal(doc.get('hero-size-plot').hidden,false);
    assert.equal(doc.get('hero-size-note').hidden,true);
    assert.match(doc.get('hero-body').attributes['aria-label'],/Gr\u00f6\u00dfenvergleich nach Durchmesser/);
    show('pluto');
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erde');
    assert.match(doc.get('hero-size-plot').className,/reference-larger/);
    assert.ok(parseFloat(doc.get('hero-size-plot').style.getPropertyValue('--size-selected'))<20);
    show('titan');
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erdmond');
    assert.match(doc.get('hero-size-ratio').textContent,/Erdmond/);
    show('moon');
    assert.match(doc.get('hero-size-plot').className,/same-size/);
    assert.equal(doc.get('hero-size-ratio').textContent,'Gleicher Durchmesser');
    show('phobos');
    assert.match(doc.get('hero-size-ratio').title,/mindestens 2 Pixel/);
    show(bodies.find(b=>b.type==='satellite').id);
    assert.equal(doc.get('hero-size-plot').hidden,true);
    assert.equal(doc.get('hero-size-note').hidden,false);
    assert.match(doc.get('hero-size-note').textContent,/Kein verl/);
    show('sun');
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erdmond');
    show(null);
    assert.equal(doc.get('hero-size-legend').hidden,true);
    assert.equal(doc.get('hero-size-plot').hidden,true);
    assert.equal(doc.get('hero-body').disabled,true);
    show('voyager-1');
    assert.equal(doc.get('hero-size-plot').hidden,true);
  }finally{globalThis.document=oldDoc;}
});

test('v136: original compact hero heights and focusable zoom action remain in desktop and mobile views',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),handler=await read('src/ui/event-handlers.js');
  assert.match(html,/<button id="hero-body" class="hero-body" type="button"/);
  assert.match(html,/hero-size-selected-circle/);
  assert.match(html,/hero-size-reference-circle/);
  assert.match(html,/id="hero-size-selected-name"/);
  assert.match(html,/id="hero-size-reference-name"/);
  assert.match(css,/\.detail-hero\{height:209px/);
  assert.match(css,/\.detail-hero\{height:144px\}/);
  assert.match(css,/\.detail-hero\{height:65px/);
  assert.match(css,/\.sheet-content>\.detail \.detail-hero\{height:172px/);
  assert.match(css,/\.hero-size-plot\.reference-larger/);
  assert.match(css,/\.hero-size-plot\.same-size/);
  assert.match(css,/\.detail \.detail-hero \.hero-ref\{display:none\}/);
  assert.match(css,/\.sheet-content>\.detail \.hero-ref\{display:flex\}/);
  assert.match(handler,/\$\('hero-body'\)\.addEventListener\('click'/);
  assert.doesNotMatch(css,/\.hero-body\.saturn:after/);
});
