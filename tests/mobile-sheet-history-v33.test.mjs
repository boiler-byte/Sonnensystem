import assert from 'node:assert/strict';
import {test} from 'node:test';
import {initMobileSheets} from '../src/ui/bottom-sheet.js';

class FakeElement {
  constructor(id='',height=100){
    this.id=id;this.height=height;this.children=[];this.handlers={};this.attrs={};this.dataset={};
    this.hidden=false;this.inert=false;this.style={values:{},setProperty:(k,v)=>this.style.values[k]=v,getPropertyValue:k=>this.style.values[k]||''};
    this.classes=new Set();
    this.classList={toggle:(key,value)=>value?this.classes.add(key):this.classes.delete(key),add:key=>this.classes.add(key),remove:key=>this.classes.delete(key)};
  }
  insertBefore(child,ref){
    if(child.parentNode){const list=child.parentNode.children;list.splice(list.indexOf(child),1);}
    const index=this.children.indexOf(ref);this.children.splice(index<0?this.children.length:index,0,child);child.parentNode=this;
  }
  append(child){this.insertBefore(child,null);}
  get nextSibling(){if(!this.parentNode)return null;return this.parentNode.children[this.parentNode.children.indexOf(this)+1]||null;}
  get parentElement(){return this.parentNode;}
  addEventListener(event,callback){(this.handlers[event]??=[]).push(callback);}
  emit(event,payload={}){for(const handler of this.handlers[event]??[])handler(payload);}
  setAttribute(name,value){this.attrs[name]=value;}
  getAttribute(name){return this.attrs[name];}
  getBoundingClientRect(){return {height:this.height,top:0,bottom:this.height};}
  querySelectorAll(selector){
    if(selector==='[data-sheet-panel]')return this.sheetButtons??[];
    if(selector==='[data-sidebar-panel]')return this.sidebarButtons??[];
    return [];
  }
  setPointerCapture(){}
  hasPointerCapture(){return false;}
  releasePointerCapture(){}
}

function setup({hasHistory=true}={}){
  const originalWindow=globalThis.window,originalDocument=globalThis.document;
  const keys=['mobile-sheet','sheet-header','sheet-content','mobile-sheet-scrim','catalog','detail','reset-camera','speed-popover','speed-btn','layer-popover','layer-btn','sidebar','sidebar-content'];
  const elements=Object.fromEntries(keys.map(id=>[id,new FakeElement(id)]));
  elements['sheet-header'].height=45;
  const tabButtons=['catalog','detail'].map(name=>{
    const button=new FakeElement(`sheet-tab-${name}`);button.dataset.sheetPanel=name;return button;
  });
  const desktopButtons=['catalog','detail'].map(name=>{
    const button=new FakeElement(`sidebar-tab-${name}`);button.dataset.sidebarPanel=name;return button;
  });
  elements['mobile-sheet'].sheetButtons=tabButtons;
  elements.sidebar.sidebarButtons=desktopButtons;
  for(const name of ['catalog','detail'])elements['sidebar-content'].append(elements[name]);
  const actionHolder=new FakeElement('viewport-actions');actionHolder.append(elements['reset-camera']);
  const mq={matches:true,handlers:[],addEventListener(type,handler){if(type==='change')this.handlers.push(handler);}};
  const winHandlers={};
  const win={innerHeight:750,matchMedia:()=>mq,addEventListener:(type,handler)=>(winHandlers[type]??=[]).push(handler)};
  const states=[{route:'start',keep:true}];let currentIndex=0,pushes=0,backs=0;
  if(hasHistory)win.history={
    get state(){return states[currentIndex];},
    pushState(state,title){assert.equal(title,'');states.splice(currentIndex+1);states.push(state);currentIndex++;pushes++;},
    back(){
      backs++;
      if(currentIndex<=0)return;
      currentIndex--;
      queueMicrotask(()=>winHandlers.popstate?.forEach(fn=>fn({state:states[currentIndex]})));
    },
    forward(){
      if(currentIndex>=states.length-1)return;
      currentIndex++;
      queueMicrotask(()=>winHandlers.popstate?.forEach(fn=>fn({state:states[currentIndex]})));
    }
  };
  globalThis.window=win;
  globalThis.document={getElementById:id=>elements[id],createComment:()=>new FakeElement('marker')};
  const controller=initMobileSheets();
  const getSnap=()=>elements['mobile-sheet'].dataset.snap;
  const restore=()=>{globalThis.window=originalWindow;globalThis.document=originalDocument;};
  return {controller,win,mq,elements,tabButtons,desktopButtons,getSnap,restore,
    get historyIndex(){return currentIndex;},get entries(){return states.length;},get pushes(){return pushes;},get backs(){return backs;}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('v33: browser Back closes half/full mobile sheet without leaving the page',async()=>{
  const env=setup();
  try{
    const {controller,win}=env;
    assert.equal(env.getSnap(),'closed');
    assert.equal(env.entries,1);
    controller.open('catalog');
    assert.equal(env.getSnap(),'half');
    assert.equal(env.entries,2);
    assert.equal(env.pushes,1);
    assert.equal(win.history.state.keep,true,'existing browser history state survives');
    controller.open('detail');
    controller.expand();
    assert.equal(env.getSnap(),'full');
    assert.equal(env.pushes,1,'tabs and snap changes never add extra history entries');
    win.history.back();await flush();
    assert.equal(env.getSnap(),'closed','Back from full closes directly, not just half');
    assert.equal(env.historyIndex,0);
    assert.equal(env.elements['sheet-content'].inert,true);
    assert.equal(env.elements['mobile-sheet-scrim'].hidden,true);
    assert.equal(env.elements['sheet-header'].attrs['aria-expanded'],'false');
    win.history.forward();await flush();
    assert.equal(env.getSnap(),'half','Forward can reopen the sheet without pushing a duplicate');
    assert.equal(env.pushes,1);
    win.history.back();await flush();
    assert.equal(env.getSnap(),'closed');
    controller.open('catalog');
    assert.equal(env.pushes,2,'opening again creates exactly one new entry');
    assert.equal(env.entries,2,'the previous forward entry is replaced, not stacked');
    win.history.back();await flush();
    assert.equal(env.getSnap(),'closed');
  }finally{env.restore();}
});

test('v33: manual close consumes the temporary history entry; repeated opens are clean',async()=>{
  const env=setup();
  try{
    env.controller.open('catalog');
    env.controller.close();
    assert.equal(env.getSnap(),'closed');
    assert.equal(env.backs,1,'a manual close removes the sheet state via history.back');
    await flush();
    assert.equal(env.historyIndex,0);
    env.controller.open('catalog');
    env.controller.expand();
    env.elements['mobile-sheet-scrim'].emit('click');
    assert.equal(env.getSnap(),'closed');
    await flush();
    assert.equal(env.backs,2);
    assert.equal(env.historyIndex,0);
    assert.equal(env.entries,2);
    env.elements['sheet-header'].emit('click',{target:{closest:()=>null}});
    assert.equal(env.getSnap(),'half');
    env.elements['sheet-header'].emit('click',{target:{closest:()=>null}});
    assert.equal(env.getSnap(),'full');
    env.elements['sheet-header'].emit('click',{target:{closest:()=>null}});
    assert.equal(env.getSnap(),'closed');
    await flush();
    assert.equal(env.backs,3,'header cycling to closed consumes history too');
    assert.equal(env.historyIndex,0);
  }finally{env.restore();}
});

test('v33: immediate reopen while history.back is pending creates only one fresh entry',async()=>{
  const env=setup();
  try{
    env.controller.open('catalog');
    env.controller.close();
    env.controller.open('detail');
    assert.equal(env.getSnap(),'half');
    assert.equal(env.pushes,1,'do not push while an earlier back traversal is pending');
    await flush();
    assert.equal(env.historyIndex,1);
    assert.equal(env.pushes,2,'the reopen gets its own fresh history entry after popstate');
    assert.equal(env.entries,2);
    env.win.history.back();await flush();
    assert.equal(env.getSnap(),'closed');
    assert.equal(env.historyIndex,0);
  }finally{env.restore();}
});

test('v33: changing from mobile to desktop closes and consumes the entry',async()=>{
  const env=setup();
  try{
    env.controller.open('catalog');env.mq.matches=false;
    env.mq.handlers.forEach(handler=>handler());
    await flush();
    assert.equal(env.getSnap(),'closed');
    assert.equal(env.historyIndex,0);
    assert.equal(env.elements['reset-camera'].parentNode.inert,false);
    env.mq.matches=true;env.mq.handlers.forEach(handler=>handler());
    assert.equal(env.getSnap(),'closed');
  }finally{env.restore();}
});

test('v33: sheet still works when History API is unavailable',()=>{
  const env=setup({hasHistory:false});
  try{
    env.controller.open('detail');
    assert.equal(env.getSnap(),'half');
    env.controller.close();
    assert.equal(env.getSnap(),'closed');
  }finally{env.restore();}
});
