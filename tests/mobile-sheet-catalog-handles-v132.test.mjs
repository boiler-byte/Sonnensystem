import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {initMobileSheets} from '../src/ui/bottom-sheet.js';

class MockNode {
  constructor(id='',tagName='div'){
    this.id=id;this.tagName=tagName;this.children=[];this.handlers={};this.attrs={};
    this.dataset={};this.hidden=false;this.inert=false;this.scrollTop=0;this.height=100;
    this.classes=new Set();this.classList={add:key=>this.classes.add(key),remove:key=>this.classes.delete(key),
      toggle:(key,on)=>on?this.classes.add(key):this.classes.delete(key)};
    this.style={values:{},setProperty:(key,value)=>this.style.values[key]=value,
      getPropertyValue:key=>this.style.values[key]??''};
  }
  get parentElement(){return this.parentNode;}
  get nextSibling(){
    if(!this.parentNode)return null;
    return this.parentNode.children[this.parentNode.children.indexOf(this)+1]??null;
  }
  append(node){this.insertBefore(node,null);}
  insertBefore(node,reference){
    if(node.parentNode){const siblings=node.parentNode.children;siblings.splice(siblings.indexOf(node),1);}
    const index=this.children.indexOf(reference);
    this.children.splice(index<0?this.children.length:index,0,node);node.parentNode=this;
  }
  getBoundingClientRect(){return {height:this.height,top:0,bottom:this.height};}
  querySelectorAll(selector){
    if(selector==='[data-sheet-panel]')return this.sheetButtons??[];
    if(selector==='[data-sidebar-panel]')return this.sidebarButtons??[];
    return [];
  }
  addEventListener(type,handler,options){(this.handlers[type]??=[]).push({handler,options});}
  emit(type,event={}){for(const {handler} of this.handlers[type]??[])handler(event);}
  setPointerCapture(id){this.capturedId=id;}
  hasPointerCapture(id){return this.capturedId===id;}
  releasePointerCapture(id){if(this.hasPointerCapture(id))this.capturedId=null;}
  setAttribute(key,value){this.attrs[key]=value;}
  closest(selector){
    for(let current=this;current;current=current.parentNode){
      if(selector.split(',').some(part=>{
        const token=part.trim();
        return token.startsWith('.')?current.classes.has(token.slice(1)):current.tagName===token;
      }))return current;
    }
    return null;
  }
}
function setup(){
  const originals={window:globalThis.window,document:globalThis.document};
  const ids=['mobile-sheet','sheet-header','detail-hero','sheet-content','mobile-sheet-scrim','catalog','detail',
    'catalog-search-row','list-header','object-list','detail-scroll','reset-camera','cinema-timeline',
    'layer-popover','layer-btn','sidebar','sidebar-content'];
  const els=Object.fromEntries(ids.map(id=>[id,new MockNode(id)]));
  els['sheet-header'].height=45;
  els['mobile-sheet'].sheetButtons=['catalog','detail'].map(id=>{
    const btn=new MockNode(`sheet-tab-${id}`,'button');btn.dataset.sheetPanel=id;return btn;
  });
  els.sidebar.sidebarButtons=['catalog','detail'].map(id=>{
    const btn=new MockNode(`sidebar-tab-${id}`,'button');btn.dataset.sidebarPanel=id;return btn;
  });
  els.sidebar.append(els['sidebar-content']);
  els['sidebar-content'].append(els.catalog);
  els['sidebar-content'].append(els.detail);
  const searchBox=new MockNode('search-box');searchBox.classes.add('search');
  const input=new MockNode('search','input');searchBox.append(input);
  const filter=new MockNode('catalog-planet-filter','button');
  els['catalog-search-row'].append(searchBox);els['catalog-search-row'].append(filter);
  const sort=new MockNode('catalog-sort','button'),count=new MockNode('object-count','span');
  els['list-header'].append(sort);els['list-header'].append(count);
  els.catalog.append(els['catalog-search-row']);els.catalog.append(els['list-header']);
  els.catalog.append(els['object-list']);els.detail.append(els['detail-scroll']);els['detail-scroll'].append(els['detail-hero']);
  const viewportActions=new MockNode('viewport-actions');viewportActions.append(els['reset-camera']);
  const mq={matches:true,callbacks:[],addEventListener(type,fn){if(type==='change')this.callbacks.push(fn);}};
  globalThis.window={innerHeight:800,matchMedia:()=>mq,addEventListener(){}};
  globalThis.document={getElementById:id=>els[id],createComment:()=>new MockNode('anchor')};
  const control=initMobileSheets();
  const snap=()=>els['mobile-sheet'].dataset.snap;
  const visible=()=>parseFloat(els['mobile-sheet'].style.getPropertyValue('--sheet-visible'));
  const restore=()=>{globalThis.window=originals.window;globalThis.document=originals.document;};
  return {els,input,filter,sort,count,searchBox,mq,control,snap,visible,restore};
}
function pointer(el,type,id,y){
  el.emit(type,{pointerId:id,clientY:y,button:0,isPrimary:true,preventDefault(){}});
}
function tap(handle,target){
  const event={target,prevented:false,stopped:false,
    preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}};
  handle.emit('click',event);
  return event;
}

test('v132: the search row drags half -> full and full -> half with synchronized scene controls',()=>{
  const app=setup();
  try{
    const {els,control,snap,visible}=app;
    control.open('catalog');assert.equal(snap(),'half');assert.equal(visible(),312);
    const row=els['catalog-search-row'];
    pointer(row,'pointerdown',12,550);
    pointer(row,'pointermove',12,480);
    assert.equal(visible(),382);
    assert.equal(els['mobile-sheet'].classes.has('dragging'),true);
    assert.equal(els['reset-camera'].parentElement.style.values['--sheet-visible'],'382px');
    assert.equal(els['cinema-timeline'].style.values['--sheet-visible'],'382px');
    pointer(row,'pointerup',12,480);
    assert.equal(snap(),'full');
    assert.equal(row.capturedId,null);
    assert.equal(els['mobile-sheet'].classes.has('dragging'),false);
    assert.equal(els['cinema-timeline'].classes.has('sheet-dragging'),false);
    pointer(row,'pointerdown',13,150);
    pointer(row,'pointermove',13,230);
    pointer(row,'pointerup',13,230);
    assert.equal(snap(),'half');
  }finally{app.restore();}
});

test('v132: list header drags half -> closed and half -> full',()=>{
  const app=setup();
  try{
    const {els,control,snap}=app,handle=els['list-header'];
    control.open('catalog');
    pointer(handle,'pointerdown',21,520);
    pointer(handle,'pointermove',21,620);
    pointer(handle,'pointerup',21,620);
    assert.equal(snap(),'closed');
    assert.equal(els['sheet-content'].inert,true);
    control.open('catalog');
    pointer(handle,'pointerdown',22,520);
    pointer(handle,'pointermove',22,420);
    pointer(handle,'pointerup',22,420);
    assert.equal(snap(),'full');
    pointer(handle,'pointerdown',23,250);
    pointer(handle,'pointermove',23,335);
    pointer(handle,'pointercancel',23,335);
    assert.equal(snap(),'full','Cancelling the drag restores the previous snap level');
  }finally{app.restore();}
});

test('v132: short taps preserve search input, filter and sort; empty areas advance the snap',()=>{
  const app=setup();
  try{
    const {els,control,input,filter,sort,count,searchBox,snap}=app;
    control.open('catalog');
    const row=els['catalog-search-row'],header=els['list-header'];
    for(const [handle,target] of [[row,input],[row,searchBox],[row,filter],[header,sort]]){
      const click=tap(handle,target);
      assert.equal(click.prevented,false);
      assert.equal(snap(),'half',`${target.id} must not change the sheet position`);
    }
    pointer(row,'pointerdown',31,400);
    pointer(row,'pointermove',31,396); // Under the 7px drag threshold.
    pointer(row,'pointerup',31,396);
    assert.equal(snap(),'half');
    tap(header,count);assert.equal(snap(),'full');
    tap(row,row);assert.equal(snap(),'closed');
  }finally{app.restore();}
});

test('v132: a sheet swipe blocks the synthetic click on search/filter/sort',()=>{
  const app=setup();
  try{
    const {els,control,filter,sort,snap}=app;
    control.open('catalog');
    const row=els['catalog-search-row'];
    pointer(row,'pointerdown',40,470);
    pointer(row,'pointermove',40,400);
    pointer(row,'pointerup',40,400);
    assert.equal(snap(),'full');
    const click=tap(row,filter);
    assert.equal(click.prevented,true);
    assert.equal(click.stopped,true);
    assert.equal(snap(),'full');
    const sortClick=tap(els['list-header'],sort);
    assert.equal(sortClick.prevented,true);
    assert.equal(sortClick.stopped,true);
  }finally{app.restore();}
});

test('v132: catalog gesture handles are mobile-only and do not replace desktop buttons',()=>{
  const app=setup();
  try{
    const {els,mq,control,snap}=app;
    control.open('catalog');
    mq.matches=false;mq.callbacks.forEach(fn=>fn());
    assert.equal(snap(),'closed');
    assert.equal(els.catalog.parentNode,els['sidebar-content']);
    for(const handle of [els['catalog-search-row'],els['list-header']]){
      pointer(handle,'pointerdown',51,300);
      pointer(handle,'pointermove',51,180);
      pointer(handle,'pointerup',51,180);
      tap(handle,handle);
    }
    assert.equal(snap(),'closed');
    assert.equal(els.catalog.parentNode,els['sidebar-content']);
  }finally{app.restore();}
});

test('v132: HTML provides dedicated catalog handles; CSS restricts them to mobile',async()=>{
  const [html,css]=await Promise.all(['index.html','css/styles.css'].map(f=>readFile(new URL('../'+f,import.meta.url),'utf8')));
  assert.match(html,/class="catalog-search-row" id="catalog-search-row"/);
  assert.match(html,/class="list-header" id="list-header"/);
  assert.match(css,/\.sheet-content>\.catalog \.catalog-search-row\{touch-action:pan-x/);
  assert.match(css,/\.sheet-content>\.catalog \.list-header\{touch-action:none/);
  assert.match(css,/\.sheet-content>\.catalog \.catalog-search-row input\{user-select:text/);
});
