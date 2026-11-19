import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {DETAIL_TAB_STORAGE_KEY,restoreDetailTab,setDetailTab} from '../src/ui/object-details.js';
import {cinemaTrack,cinemaPoseAt,CINEMA_HOLD_MS,CINEMA_PLANET_HOLD_MS,CINEMA_TRAVEL_MS} from '../src/renderer/cinema.js';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

function detailDom(){
  const map=new Map();
  for(const id of ['detail-tab-daten','detail-tab-wissen','detail-daten','detail-wissen']){
    const classes=new Set();
    map.set(id,{
      id,hidden:false,tabIndex:-1,attributes:{},classes,
      classList:{toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name);}},
      setAttribute(name,value){this.attributes[name]=value;}
    });
  }
  return {map,document:{getElementById:id=>map.get(id)}};
}

// Simulate storage surviving a complete view re-creation (new DOM, same browser storage).
test('v91: detail tab defaults to Daten and remembers Wissen across DOM reinitialization',()=>{
  const previousDoc=globalThis.document,previousStorage=globalThis.localStorage;
  const values=new Map();
  globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,value)=>values.set(k,value)};
  try {
    const first=detailDom();globalThis.document=first.document;
    restoreDetailTab();
    assert.equal(first.map.get('detail-daten').hidden,false);
    assert.equal(first.map.get('detail-wissen').hidden,true);
    assert.equal(values.size,0,'default is not written until user changes the tab');
    setDetailTab('wissen');
    assert.equal(values.get(DETAIL_TAB_STORAGE_KEY),'wissen');
    assert.equal(first.map.get('detail-tab-wissen').attributes['aria-selected'],'true');
    assert.equal(first.map.get('detail-tab-wissen').tabIndex,0);
    const reopened=detailDom();globalThis.document=reopened.document;
    restoreDetailTab();
    assert.equal(reopened.map.get('detail-wissen').hidden,false);
    assert.equal(reopened.map.get('detail-tab-wissen').attributes['aria-selected'],'true');
    assert.equal(reopened.map.get('detail-tab-daten').tabIndex,-1);
    setDetailTab('daten');
    assert.equal(values.get(DETAIL_TAB_STORAGE_KEY),'daten');
  } finally {
    if(previousDoc===undefined)delete globalThis.document;else globalThis.document=previousDoc;
    if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage;
  }
});

test('v91: blocked/invalid storage never breaks detail tabs',()=>{
  const prevDoc=globalThis.document,prevStorage=globalThis.localStorage;
  const {map,document}=detailDom();
  globalThis.document=document;
  globalThis.localStorage={getItem(){throw Error('denied');},setItem(){throw Error('denied');}};
  try {
    assert.doesNotThrow(()=>restoreDetailTab());
    assert.equal(map.get('detail-daten').hidden,false);
    assert.doesNotThrow(()=>setDetailTab('wissen'));
    assert.equal(map.get('detail-wissen').hidden,false);
    globalThis.localStorage={getItem:()=> 'unknown',setItem(){}};
    restoreDetailTab();
    assert.equal(map.get('detail-daten').hidden,false);
  } finally {
    if(prevDoc===undefined)delete globalThis.document;else globalThis.document=prevDoc;
    if(prevStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=prevStorage;
  }
});

test('v91: object changes, clear-selection and planet entry do not reset the selected tab',async()=>{
  const camera=await read('src/app/camera-controller.js');
  const controls=await read('src/ui/event-handlers.js');
  assert.doesNotMatch(camera,/setDetailTab/);
  const planet=controls.slice(controls.indexOf("$('planet-view-btn').addEventListener"),controls.indexOf("$('play-btn').addEventListener"));
  assert.doesNotMatch(planet,/setDetailTab/);
  assert.match(controls,/restoreDetailTab\(\)/);
  assert.match(controls,/setDetailTab\(tab\.dataset\.detailTab\)/);
});

test('v91: all types share a 5000ms hold and 2x transport keeps a 2500ms effective hold',()=>{
  const ids=['sun','mercury','moon','pluto','comet'];
  const positions=new Map(ids.map((id,i)=>[id,[i*3,0,0]]));
  const radii=new Map(ids.map((id,i)=>[id,i+1]));
  const types=['star','planet','moon','dwarf','comet'];
  const byId=new Map(ids.map((id,i)=>[id,{id,type:types[i]}]));
  const layout={ids,positions,radii};
  for(const lookup of [byId,undefined]){
    const track=cinemaTrack(layout,1100,720,lookup);
    assert.equal(CINEMA_HOLD_MS,5000);
    assert.equal(CINEMA_PLANET_HOLD_MS,5000);
    assert.equal(track.durationMs,ids.length*5000+(ids.length-1)*CINEMA_TRAVEL_MS);
    for(const frame of track.frames){
      assert.equal(frame.holdEndMs-frame.holdStartMs,5000);
      const halfway=cinemaPoseAt(track,(frame.holdStartMs+2500)/track.durationMs);
      assert.equal(halfway.objectId,frame.id);
      assert.equal(halfway.holding,true);
    }
    // Only playback speed changes wall-clock time, not the track itself.
    assert.equal((track.frames[0].holdEndMs-track.frames[0].holdStartMs)/2,2500);
  }
});
