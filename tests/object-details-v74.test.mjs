import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../src/data/catalog.js';
import {S,setMobileSheets,setRenderer} from '../src/app/state.js';
import {showRelatedInCatalog} from '../src/ui/catalog-controller.js';
import {catalogMatches} from '../src/ui/object-list.js';
import {renderDetail} from '../src/ui/object-details.js';
import {physicalStatIcon,thermometerIcon} from '../src/ui/physical-stat-icons.js';
import {displaySurfaceGravity,STANDARD_GRAVITY_MS2} from '../src/ui/formatters.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const readJSON=async path=>JSON.parse(await read(path));
const bodiesPromise=loadCatalog(readJSON).then(result=>result.bodies);
function documentMock(){
  const elements=new Map();
  const get=id=>{
    if(!elements.has(id)){
      const element={id,innerHTML:'',textContent:'',value:'',scrollTop:23,hidden:false,disabled:false,style:{setProperty(){}},dataset:{},attributes:{},events:{},classList:{toggle(){}},setAttribute(key,val){this.attributes[key]=val;},focus(){this.focused=true;},querySelectorAll(){return [];},querySelector(selector){if(selector==='.related-overflow' && this.innerHTML.includes('class="related-overflow"')){
        const target={events:{},addEventListener(type,fn){this.events[type]=fn;}};
        this.overflow=target;return target;
      }return null;}};
      elements.set(id,element);
    }
    return elements.get(id);
  };
  return {get,document:{getElementById:get}};
}

test('v74: every conventional physical value has a semantic SVG pictogram; thermometers have distinct fill levels',()=>{
  for(const kind of ['radius','diameter','orbit','period','eccentricity','type','photosphere','distance','pressure','gravity','launch','status']){
    const markup=physicalStatIcon(kind);
    assert.match(markup,/^<svg class="stat-icon"/);
    assert.match(markup,/aria-hidden="true"/);
    assert.match(markup,/(<path|<circle|<ellipse)/);
  }
  const min=thermometerIcon('min'),mean=thermometerIcon('mean'),max=thermometerIcon('max');
  assert.match(min,/thermometer-icon--min/);
  assert.match(mean,/thermometer-icon--mean/);
  assert.match(max,/thermometer-icon--max/);
  assert.match(min,/y="14.5" width="2" height="1.5"/);
  assert.match(mean,/y="10" width="2" height="6"/);
  assert.match(max,/y="5.5" width="2" height="10.5"/);
});

test('v74: gravity uses Earth G rather than relabeling m/s², including very small values',()=>{
  assert.equal(STANDARD_GRAVITY_MS2,9.80665);
  assert.equal(displaySurfaceGravity(9.80665),'1 G');
  assert.equal(displaySurfaceGravity(19.6133),'2 G');
  assert.equal(displaySurfaceGravity(0),'0 G');
  assert.equal(displaySurfaceGravity(.62),'0,063 G');
  assert.equal(displaySurfaceGravity(23.1),'2,36 G');
  assert.equal(displaySurfaceGravity(.00001),'1,02E-6 G');
  assert.equal(displaySurfaceGravity(undefined),'—');
});

test('v74: temperature appears as one card with prominent mean and small min/max on every body',async()=>{
  const bodies=await bodiesPromise,previous=globalThis.document;
  const mock=documentMock();globalThis.document=mock.document;
  const show=selected=>renderDetail({bodies,selected},{planetId:null,followEnabled:false,overrides:new Map()},()=>{},()=>{});
  try{
    show('mercury');
    const markup=mock.get('stats-grid').innerHTML;
    assert.equal((markup.match(/class="stat stat-temperature"/g)||[]).length,1);
    assert.equal((markup.match(/<span class="stat-label">TEMPERATUR<\/span>/g)||[]).length,1);
    assert.doesNotMatch(markup,/TEMPERATUR MIN\.|TEMPERATUR MAX\.|TEMPERATUR MITTEL/);
    for(const symbol of ['thermometer-icon--min','thermometer-icon--mean','thermometer-icon--max'])assert.match(markup,new RegExp(symbol));
    assert.match(markup,/-180 °C/);
    assert.match(markup,/430 °C/);
    assert.equal((markup.match(/class="stat-icon"/g)||[]).length,7,'4 traditional metrics + 3 extra measures');
    assert.match(markup,/class="stat-value">\s*<svg class="stat-icon"[^]*?<strong title=/);
    show('earth');
    assert.match(mock.get('stats-grid').innerHTML,/1 G/);
    assert.match(mock.get('stats-grid').innerHTML,/15 °C/);
    assert.match(mock.get('stats-grid').innerHTML,/Mittel/);
    show('sun');
    assert.match(mock.get('stats-grid').innerHTML,/PHOTOSPHÄRE/);
    assert.match(mock.get('stats-grid').innerHTML,/DURCHMESSER/);
    show('phobos');
    assert.match(mock.get('stats-grid').innerHTML,/Mittelwert: —/);
    assert.doesNotMatch(mock.get('stats-grid').innerHTML,/Minimum: —|Maximum: —/);
    show(null);
    assert.equal(mock.get('related').innerHTML,'');
  }finally{globalThis.document=previous;}
});

test('v74: related overflow is a keyboard-usable button and passes the current parent name',async()=>{
  const bodies=await bodiesPromise,previous=globalThis.document;
  const mock=documentMock();globalThis.document=mock.document;
  let requested=null;
  try{
    renderDetail({bodies,selected:'jupiter'},{planetId:null,followEnabled:false,overrides:new Map()},()=>{},name=>{requested=name;});
    const related=mock.get('related');
    assert.match(related.innerHTML,/ZUGEHÖRIGE OBJEKTE/);
    assert.match(related.innerHTML,/<button type="button" class="related-overflow"/);
    assert.match(related.innerHTML,/aria-label="Weitere \d+ zugehörige Objekte von Jupiter/);
    assert.equal(typeof related.overflow.events.click,'function');
    related.overflow.events.click();
    assert.equal(requested,'Jupiter');
    const relatedCount=bodies.filter(b=>b.parentId==='jupiter').length;
    assert.ok(relatedCount>5);
    assert.match(related.innerHTML,new RegExp('\\+'+(relatedCount-5)));
  }finally{globalThis.document=previous;}
});

test('v74: +N switches desktop/mobile panel to catalog and searches by current object name',async()=>{
  const bodies=await bodiesPromise,previousDoc=globalThis.document;
  const old={bodies:S.bodies,selected:S.selected,search:S.search,catalogSort:S.catalogSort,catalogPlanetOnly:S.catalogPlanetOnly};
  const mock=documentMock();globalThis.document=mock.document;
  const opened=[];setMobileSheets({open:name=>opened.push(name)});setRenderer({planetId:null});
  try{
    S.bodies=bodies;S.selected='jupiter';S.search='alt';S.catalogSort='default';S.catalogPlanetOnly=true;
    showRelatedInCatalog('Jupiter');
    assert.equal(S.search,'Jupiter');
    assert.equal(mock.get('search').value,'Jupiter');
    assert.equal(mock.get('search').focused,true);
    assert.equal(mock.get('object-list').scrollTop,0);
    assert.deepEqual(opened,['catalog']);
    assert.ok(bodies.filter(b=>catalogMatches(b,S.search,new Map(bodies.map(b=>[b.id,b])))).length>5);
    assert.match(mock.get('object-list').innerHTML,/Jupiter/);
    assert.ok(Number(mock.get('object-count').textContent)>5);
    // Keep a compatible planet filter, but relax one that would hide every match.
    setRenderer({planetId:'jupiter'});S.catalogPlanetOnly=true;
    showRelatedInCatalog('Jupiter');
    assert.equal(S.catalogPlanetOnly,true);
    setRenderer({planetId:'earth'});S.catalogPlanetOnly=true;
    showRelatedInCatalog('Jupiter');
    assert.equal(S.catalogPlanetOnly,false);
    assert.ok(Number(mock.get('object-count').textContent)>5);
  }finally{Object.assign(S,old);setMobileSheets(null);setRenderer(null);globalThis.document=previousDoc;}
});

test('v74: related section precedes physical data in the common desktop/mobile data tab',async()=>{
  const html=await read('index.html'),css=await read('css/styles.css'),worker=await read('sw.js');
  const start=html.indexOf('id="detail-daten"'),rel=html.indexOf('id="related"',start),phys=html.indexOf('PHYSIKALISCHE DATEN',start),orbits=html.indexOf('ORBIT &amp;',start);
  assert.ok(start>0&&start<rel&&rel<phys&&phys<orbits);
  assert.match(css,/\.sheet-content>\.detail \.related\{display:block!important\}/);
  assert.match(css,/\.related:empty\{display:none!important\}/);
  assert.match(css,/\.thermometer-icon--mean\{color:#06090e;--thermometer-outline:#b9c9d9\}/);
  assert.match(css,/\.thermometer-icon--min\{color:#66baff\}/);
  assert.match(css,/\.thermometer-icon--max\{color:#f0756c\}/);
  assert.match(css,/\.temperature-extreme \.stat-value\{gap:1px;min-width:0\}/);
  assert.ok(worker.includes('./src/ui/physical-stat-icons.js'));
});
