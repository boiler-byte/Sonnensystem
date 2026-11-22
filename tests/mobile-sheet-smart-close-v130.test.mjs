import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {initMobileSheets} from '../src/ui/bottom-sheet.js';

class Node {
  constructor(id='',height=100){
    this.id=id;this.height=height;this.children=[];this.attrs={};this.handlers={};
    this.dataset={};this.scrollTop=0;this.hidden=false;this.inert=false;
    this.style={values:{},setProperty:(key,value)=>this.style.values[key]=value,
      getPropertyValue:key=>this.style.values[key]??''};
    this.classes=new Set();this.classList={add:key=>this.classes.add(key),remove:key=>this.classes.delete(key),
      toggle:(key,on)=>on?this.classes.add(key):this.classes.delete(key)};
  }
  get parentElement(){return this.parentNode;}
  get nextSibling(){
    if(!this.parentNode)return null;
    return this.parentNode.children[this.parentNode.children.indexOf(this)+1]??null;
  }
  insertBefore(child,reference){
    if(child.parentNode){const siblings=child.parentNode.children;siblings.splice(siblings.indexOf(child),1);}
    const index=this.children.indexOf(reference);
    this.children.splice(index<0?this.children.length:index,0,child);child.parentNode=this;
  }
  append(child){this.insertBefore(child,null);}
  getBoundingClientRect(){return {height:this.height,top:0,bottom:this.height};}
  querySelectorAll(selector){
    if(selector==='[data-sheet-panel]')return this.sheetButtons??[];
    if(selector==='[data-sidebar-panel]')return this.sidebarButtons??[];
    return [];
  }
  addEventListener(type,fn,opts){(this.handlers[type]??=[]).push({fn,opts});}
  emit(type,payload={}){for(const {fn} of this.handlers[type]??[])fn(payload);}
  setPointerCapture(id){this.capturedId=id;}
  hasPointerCapture(id){return this.capturedId===id;}
  releasePointerCapture(id){if(this.hasPointerCapture(id))this.capturedId=null;}
  setAttribute(name,value){this.attrs[name]=value;}
}
function setup(){
  const originals={window:globalThis.window,document:globalThis.document};
  const ids=['mobile-sheet','sheet-header','detail-hero','sheet-content','mobile-sheet-scrim','catalog','detail',
    'object-list','detail-scroll','reset-camera','cinema-timeline','layer-popover','layer-btn','sidebar','sidebar-content'];
  const els=Object.fromEntries(ids.map(id=>[id,new Node(id)]));
  els['sheet-header'].height=45;
  els['mobile-sheet'].sheetButtons=['catalog','detail'].map(id=>{
    const btn=new Node(id);btn.dataset.sheetPanel=id;return btn;
  });
  els.sidebar.sidebarButtons=['catalog','detail'].map(id=>{
    const btn=new Node(id);btn.dataset.sidebarPanel=id;return btn;
  });
  els.sidebar.append(els['sidebar-content']);
  els['sidebar-content'].append(els.catalog);els['sidebar-content'].append(els.detail);
  els.catalog.append(els['object-list']);els.detail.append(els['detail-scroll']);els['detail-scroll'].append(els['detail-hero']);
  const viewportActions=new Node('viewport-actions');viewportActions.append(els['reset-camera']);
  const mq={matches:true,addEventListener(){}};
  globalThis.window={innerHeight:800,matchMedia:()=>mq,addEventListener(){}};
  globalThis.document={getElementById:id=>els[id],createComment:()=>new Node('anchor')};
  const control=initMobileSheets();
  const snap=()=>els['mobile-sheet'].dataset.snap;
  const visible=()=>parseFloat(els['mobile-sheet'].style.values['--sheet-visible']);
  const restore=()=>{globalThis.window=originals.window;globalThis.document=originals.document;};
  return {els,control,mq,snap,visible,restore};
}
function pointer(el,type,id,y){
  el.emit(type,{pointerId:id,clientY:y,button:0,isPrimary:true,preventDefault(){}});
}
function sendTouch(el,type,id,y,count=1){
  const fingers=Array.from({length:count},(_,i)=>({identifier:id+i,clientY:y}));
  const evt={touches:type==='touchend'||type==='touchcancel'?[]:fingers,
    changedTouches:fingers,cancelable:true,prevented:false,preventDefault(){this.prevented=true;}};
  el.emit(type,evt);return evt;
}

test('v139: detail-hero is a swipe handle in both directions; normal buttons remain clickable',()=>{
  const app=setup();
  try{
    const {els,control,snap,visible}=app;
    control.open('detail');assert.equal(snap(),'half');
    pointer(els['detail-hero'],'pointerdown',11,600);
    pointer(els['detail-hero'],'pointermove',11,530);
    assert.ok(visible()>312,'Upward swipe increases sheet height');
    assert.equal(els['mobile-sheet'].classes.has('dragging'),true);
    assert.equal(els['cinema-timeline'].classes.has('sheet-dragging'),true);
    pointer(els['detail-hero'],'pointerup',11,530);
    assert.equal(snap(),'full');
    assert.equal(els['mobile-sheet'].classes.has('dragging'),false);
    assert.equal(els['cinema-timeline'].classes.has('sheet-dragging'),false);
    pointer(els['detail-hero'],'pointerdown',12,250);
    pointer(els['detail-hero'],'pointermove',12,330);
    pointer(els['detail-hero'],'pointerup',12,330);
    assert.equal(snap(),'half');
    // A new tap with no swipe must not change the snap level.
    pointer(els['detail-hero'],'pointerdown',13,220);
    pointer(els['detail-hero'],'pointerup',13,220);
    assert.equal(snap(),'half');
  }finally{app.restore();}
});

test('v130: catalog scroll retains native motion, then pulls the sheet down at the top',()=>{
  const app=setup();
  try{
    const {els,control,snap,visible}=app;
    control.open('catalog');assert.equal(snap(),'half');
    const list=els['object-list'];list.scrollTop=180;
    sendTouch(list,'touchstart',20,180);
    const ordinary=sendTouch(list,'touchmove',20,250);
    assert.equal(ordinary.prevented,false,'Scrolling within content remains native');
    assert.equal(visible(),312);
    list.scrollTop=0; // The native list has reached its upper scroll limit.
    const overscroll=sendTouch(list,'touchmove',20,270);
    assert.equal(overscroll.prevented,true,'Further downward motion is routed to the sheet');
    assert.equal(els['mobile-sheet'].classes.has('dragging'),true);
    assert.equal(visible(),292,'The drag starts from the last touch position, not the whole scroll');
    sendTouch(list,'touchmove',20,340);
    sendTouch(list,'touchend',20,340);
    assert.equal(snap(),'closed');
    assert.equal(els['sheet-content'].inert,true);
    assert.equal(els['cinema-timeline'].classes.has('sheet-dragging'),false);
  }finally{app.restore();}
});

test('v130: fully open detail panel pulls back to half when its scroller is already at the top',()=>{
  const app=setup();
  try{
    const {els,control,snap}=app;
    control.open('detail');control.expand();assert.equal(snap(),'full');
    const scroller=els['detail-scroll'];
    sendTouch(scroller,'touchstart',31,200);
    sendTouch(scroller,'touchmove',31,330);
    sendTouch(scroller,'touchend',31,330);
    assert.equal(snap(),'half');
    assert.equal(els['reset-camera'].parentElement.inert,false);
  }finally{app.restore();}
});

test('v130: upward list scroll and multitouch never count as sheet drags',()=>{
  const app=setup();
  try{
    const {els,control,snap,visible}=app;
    control.open('catalog');
    const list=els['object-list'];
    sendTouch(list,'touchstart',40,220);
    assert.equal(sendTouch(list,'touchmove',40,110).prevented,false);
    sendTouch(list,'touchend',40,110);
    assert.equal(snap(),'half');assert.equal(visible(),312);
    sendTouch(list,'touchstart',41,210);
    sendTouch(list,'touchmove',41,280,2);
    sendTouch(list,'touchend',41,280);
    assert.equal(snap(),'half');assert.equal(visible(),312);
  }finally{app.restore();}
});

test('v130: a completed scroll drag suppresses a synthetic list click',()=>{
  const app=setup();
  try{
    const {els,control}=app;
    control.open('catalog');
    sendTouch(els['object-list'],'touchstart',5,120);
    sendTouch(els['object-list'],'touchmove',5,180);
    sendTouch(els['object-list'],'touchend',5,180);
    let prevented=false,stopped=false;
    els['object-list'].emit('click',{preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
    assert.equal(prevented,true);assert.equal(stopped,true);
  }finally{app.restore();}
});

test('v130: empty scene selection closes only when there was no selection before the tap',async()=>{
  const source=await readFile(new URL('../src/app/runtime.js',import.meta.url),'utf8');
  assert.match(source,/onClearSelect:clearSceneSelection/);
  const fn=source.match(/export function clearSceneSelection\(\)\{[\s\S]*?\n\}/)?.[0];
  assert.ok(fn);
  for(const initial of ['earth',null]){
    const calls=[],S={selected:initial};
    const ctx=vm.createContext({S,clearSelection(){calls.push('clear');S.selected=null;},
      mobileSheets:{close(){calls.push('close');}}});
    const clearScene=vm.runInContext(fn.replace('export function','function')+'\nclearSceneSelection',ctx);
    clearScene();
    assert.deepEqual(calls,initial===null?['clear','close']:['clear']);
  }
});

test('v130: HTML/CSS expose drag handles without disabling scrolling or desktop layout',async()=>{
  const [html,css]=await Promise.all(['index.html','css/styles.css'].map(f=>readFile(new URL('../'+f,import.meta.url),'utf8')));
  assert.match(html,/class="detail-hero" id="detail-hero"/);
  assert.match(html,/class="detail-scroll" id="detail-scroll"/);
  assert.match(css,/\.sheet-content>\.detail \.detail-hero\{touch-action:none/);
  assert.match(css,/\.sheet-content>\.catalog \.object-list, \.sheet-content>\.detail \.detail-scroll\{min-height:0;overflow-y:auto/);
});
