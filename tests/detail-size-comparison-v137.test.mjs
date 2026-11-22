import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../src/data/catalog.js';
import {detailSizeComparison,renderDetail,toggleDetailSizeReference} from '../src/ui/object-details.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const catalogPromise=loadCatalog(async path=>JSON.parse(await read(path))).then(x=>x.bodies);
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);

function documentMock(){
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      const styles=new Map();
      elements.set(id,{id,innerHTML:'',textContent:'',hidden:false,disabled:false,title:'',
        style:{setProperty(k,v){styles.set(k,v);},getPropertyValue(k){return styles.get(k)||'';}},
        className:'',classList:{toggle(){}},attributes:{},dataset:{},
        setAttribute(key,val){this.attributes[key]=val;},querySelectorAll(){return [];},querySelector(){return null;}});
    }
    return elements.get(id);
  };
  return {get,document:{getElementById:get}};
}

test('v137: planets and dwarf planets compare with Earth, all other measured bodies with the Moon',async()=>{
  const bodies=await catalogPromise,byId=id=>bodies.find(b=>b.id===id);
  for(const b of bodies){
    const c=detailSizeComparison(b,byId);
    if(b.type==='probe'){assert.equal(c,null);continue;}
    assert.equal(c.referenceId,b.id==='earth'?'moon':b.id==='moon'?'earth':(['planet','dwarf'].includes(b.type)?'earth':'moon'),b.id);
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
  const titan=detailSizeComparison(byId('titan'),byId);
  assert.equal(titan.referenceId,'moon');
  assert.equal(titan.referenceName,'Erdmond');
  const earth=detailSizeComparison(byId('earth'),byId);
  assert.equal(earth.referenceId,'moon');
  assert.equal(earth.equal,false);
  const moon=detailSizeComparison(byId('moon'),byId);
  assert.equal(moon.referenceId,'earth');
  assert.equal(moon.equal,false);
  assert.equal(detailSizeComparison(null,byId),null);
});

test('v137: detail diagram uses untextured Earth/Moon reference circles and falls back to the generic chart where required',async()=>{
  const bodies=await catalogPromise,oldDoc=globalThis.document;
  const doc=documentMock();globalThis.document=doc.document;
  const show=id=>renderDetail({bodies,selected:id},{planetId:null,followEnabled:false,overrides:new Map()},()=>{},()=>{});
  try{
    show('saturn');
    assert.equal(doc.get('hero-size-selected-name').textContent,'Saturn');
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erde');
    assert.match(doc.get('hero-size-reference-name').className,/is-earth/);
    assert.match(doc.get('hero-size-ratio').textContent,/9,14.*Erde/);
    assert.equal(doc.get('hero-size-plot').style.getPropertyValue('--size-selected'),'100.000000%');
    assert.equal(doc.get('hero-size-plot').style.getPropertyValue('--hero-size-reference-image'),'');
    assert.equal(doc.get('hero-size-plot').hidden,false);
    assert.equal(doc.get('hero-generic-plot').hidden,true);
    assert.equal(doc.get('hero-size-note').hidden,true);
    assert.match(doc.get('hero-body').attributes['aria-label'],/Größenvergleich nach Durchmesser/);

    show('titan');
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erdmond');
    assert.match(doc.get('hero-size-reference-name').className,/is-moon/);
    assert.match(doc.get('hero-size-ratio').textContent,/Erdmond/);
    assert.equal(doc.get('hero-size-plot').style.getPropertyValue('--hero-size-reference-image'),'');

    show('earth');
    assert.equal(doc.get('hero-size-legend').hidden,false);
    assert.equal(doc.get('hero-size-plot').hidden,false);
    assert.equal(doc.get('hero-generic-plot').hidden,true);
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erdmond');
    assert.match(doc.get('hero-body').attributes['aria-label'],/Größenvergleich/);

    show('moon');
    assert.equal(doc.get('hero-generic-plot').hidden,true);
    assert.equal(doc.get('hero-size-reference-name').textContent,'Erde');

    show('elara');
    assert.equal(doc.get('hero-size-plot').hidden,true);
    assert.equal(doc.get('hero-generic-plot').hidden,false);
    assert.equal(doc.get('hero-size-note').hidden,true);
    assert.match(doc.get('hero-body').attributes['aria-label'],/kein Größenvergleich verfügbar/i);

    show(null);
    assert.equal(doc.get('hero-size-legend').hidden,true);
    assert.equal(doc.get('hero-size-plot').hidden,true);
    assert.equal(doc.get('hero-generic-plot').hidden,true);
    assert.equal(doc.get('hero-size-note').hidden,false);
    assert.equal(doc.get('hero-body').disabled,true);
  }finally{globalThis.document=oldDoc;}
});

test('v137: compact hero keeps its size, exposes the generic fallback markup and remains clickable',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),handler=await read('src/ui/event-handlers.js');
  assert.match(html,/<button id="hero-body" class="hero-body" type="button"/);
  assert.match(html,/id="hero-generic-plot"/);
  assert.match(html,/id="hero-generic-body"/);
  assert.match(html,/hero-size-selected-circle/);
  assert.match(html,/hero-size-reference-circle/);
  assert.match(css,/\.detail-hero\{height:209px/);
  assert.match(css,/\.detail-hero\{height:144px\}/);
  assert.match(css,/\.detail-hero\{height:65px/);
  assert.match(css,/\.sheet-content>\.detail \.detail-hero\{height:172px/);
  assert.match(css,/\.hero-size-label-reference\.is-earth/);
  assert.match(css,/\.hero-size-label-reference\.is-moon/);
  assert.match(css,/\.hero-size-plot\.is-moon \.hero-size-reference-circle\{background-color:#c9b395/);
  assert.match(css,/\.hero-generic-body\.saturn:after/);
  assert.doesNotMatch(css,/--hero-size-reference-image/);
  assert.match(css,/\.hero-size-reference-circle\{[^}]*background:#528ccf/);
  assert.doesNotMatch(css,/\.hero-size-reference-circle\{[^}]*background-image:/);
  assert.doesNotMatch(css,/\.hero-size-plot\.is-moon \.hero-size-reference-circle\{[^}]*background-image:/);
  assert.match(css,/\.detail \.detail-hero \.hero-ref\{display:none\}/);
  assert.match(css,/\.sheet-content>\.detail \.hero-ref\{display:flex\}/);
  assert.match(handler,/\$\('hero-body'\)\.addEventListener\('click'/);
});

test('v138: reference label is an accessible independent toggle and keeps the selected reference',async()=>{
  const bodies=await catalogPromise,previous=globalThis.document;
  const mock=documentMock();globalThis.document=mock.document;
  const state={bodies,selected:'saturn',sizeReferenceId:null};
  const show=id=>{state.selected=id;renderDetail(state,{planetId:null,overrides:new Map()},()=>{});};
  try{
    show('saturn');
    assert.equal(mock.get('hero-size-reference-name').textContent,'Erde');
    assert.equal(mock.get('hero-size-reference-name').attributes['aria-pressed'],'true');
    assert.equal(toggleDetailSizeReference(state),true);
    assert.equal(state.sizeReferenceId,'moon');
    assert.equal(mock.get('hero-size-reference-name').textContent,'Erdmond');
    assert.equal(mock.get('hero-size-reference-name').attributes['aria-pressed'],'false');
    assert.match(mock.get('hero-size-plot').className,/is-moon/);
    assert.match(mock.get('hero-size-ratio').textContent,/Erdmond/);
    assert.match(mock.get('hero-body').attributes['aria-label'],/Erdmond/);
    show('titan');
    assert.equal(mock.get('hero-size-reference-name').textContent,'Erdmond');
    assert.equal(toggleDetailSizeReference(state),true);
    assert.equal(mock.get('hero-size-reference-name').textContent,'Erde');
    assert.equal(state.sizeReferenceId,'earth');
    assert.equal(mock.get('hero-size-plot').style.getPropertyValue('--hero-size-reference-image'),'');
    show(null);
    assert.equal(toggleDetailSizeReference(state),false);
    assert.equal(mock.get('hero-size-reference-name').disabled,true);
  }finally{globalThis.document=previous;}
  const html=await read('index.html');
  const heroStart=html.indexOf('<button id="hero-body"');
  const heroEnd=html.indexOf('</button>',heroStart);
  const toggle=html.indexOf('id="hero-size-reference-name"');
  assert.ok(heroStart>=0&&heroEnd>heroStart&&toggle>heroEnd,'two sibling buttons, no nested interactive HTML');
  assert.match(html,/<button class="hero-size-label hero-size-label-reference"[^>]*type="button"[^>]*aria-controls="hero-size-plot hero-size-ratio"/);
  const handler=await read('src/ui/event-handlers.js');
  assert.match(handler,/\$\('hero-size-reference-name'\)\.addEventListener\('click'/);
});
