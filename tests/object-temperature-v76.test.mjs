import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog} from '../src/data/catalog.js';
import {renderDetail} from '../src/ui/object-details.js';
import {thermometerIcon} from '../src/ui/physical-stat-icons.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const bodiesPromise=loadCatalog(async path=>JSON.parse(await read(path))).then(data=>data.bodies);

function mockDocument(){
  const elements=new Map();
  const getElementById=id=>{
    if(!elements.has(id))elements.set(id,{
      textContent:'',innerHTML:'',hidden:false,disabled:false,
      style:{setProperty(){}},classList:{toggle(){}},
      setAttribute(){},querySelectorAll(){return [];},querySelector(){return null;}
    });
    return elements.get(id);
  };
  return {document:{getElementById},getElementById};
}

async function withRenderedTemperature(selected,changeBody){
  const bodies=(await bodiesPromise).map(b=>b.id===selected&&changeBody?changeBody(b):b);
  const original=globalThis.document,mock=mockDocument();
  globalThis.document=mock.document;
  try{
    renderDetail({bodies,selected},{planetId:null,followEnabled:false,overrides:new Map()},()=>{},()=>{});
    return mock.getElementById('stats-grid').innerHTML;
  }finally{globalThis.document=original;}
}

test('v76: mean thermometer remains half-filled black, without a light background tile',async()=>{
  const [css,icon]=await Promise.all([read('css/styles.css'),Promise.resolve(thermometerIcon('mean'))]);
  assert.match(icon,/class="thermometer-icon thermometer-icon--mean"/);
  assert.match(icon,/y="10" width="2" height="6"/,'half-filled tube');
  assert.match(icon,/stroke="var\(--thermometer-outline, currentColor\)"/);
  const meanRule=css.match(/\.thermometer-icon--mean\{([^}]+)\}/)?.[1];
  assert.ok(meanRule,'mean icon style exists');
  assert.match(meanRule,/color:#06090e/);
  assert.match(meanRule,/--thermometer-outline:#b9c9d9/);
  assert.doesNotMatch(meanRule,/background|padding|border-radius/,'no background tile or icon padding');
  assert.match(css,/\.thermometer-icon--min\{color:#66baff\}/);
  assert.match(css,/\.thermometer-icon--max\{color:#f0756c\}/);
});

test('v76: known min/max appear as two stacked rows to the right of the mean',async()=>{
  const markup=await withRenderedTemperature('mercury');
  const start=markup.indexOf('class="temperature-values has-extremes"');
  const mean=markup.indexOf('class="stat-value temperature-mean"',start);
  const extremes=markup.indexOf('class="temperature-extremes"',start);
  const min=markup.indexOf('class="temperature-extreme temperature-min"',extremes);
  const max=markup.indexOf('class="temperature-extreme temperature-max"',extremes);
  assert.ok(start>0&&start<mean&&mean<extremes&&extremes<min&&min<max);
  assert.match(markup,/-180 °C/);
  assert.match(markup,/430 °C/);
  const css=await read('css/styles.css');
  assert.match(css,/\.temperature-values\.has-extremes\{display:grid;grid-template-columns:minmax\(0,\.84fr\) minmax\(0,1\.16fr\)/);
  assert.match(css,/\.temperature-extremes\{display:flex;flex-direction:column/);
  assert.match(css,/\.temperature-extreme\{display:flex;align-items:center/);
});

test('v76: no empty extreme placeholders when min/max are unknown',async()=>{
  const missing=await withRenderedTemperature('phobos');
  assert.match(missing,/class="temperature-values"/);
  assert.doesNotMatch(missing,/temperature-extremes|temperature-min|temperature-max/);
  const onlyMin=await withRenderedTemperature('earth',b=>({...b,temperatureMinK:230,temperatureMaxK:undefined}));
  assert.match(onlyMin,/temperature-values has-extremes/);
  assert.match(onlyMin,/temperature-min/);
  assert.doesNotMatch(onlyMin,/temperature-max/);
  const onlyMax=await withRenderedTemperature('earth',b=>({...b,temperatureMinK:undefined,temperatureMaxK:312}));
  assert.doesNotMatch(onlyMax,/temperature-min/);
  assert.match(onlyMax,/temperature-max/);
});
