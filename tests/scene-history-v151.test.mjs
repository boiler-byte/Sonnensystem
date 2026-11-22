import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {initSceneHistory} from '../src/ui/scene-history.js';

function browserHistory(){
  const listeners=new Map(),states=[{other:'preserved'}];
  let index=0;
  const browser={
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
    removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
    history:{
      get state(){return states[index];},
      replaceState(state){states[index]=structuredClone(state);},
      pushState(state){states.splice(index+1);states.push(structuredClone(state));index++;},
      go(delta){
        const target=index+delta;
        if(target<0||target>=states.length)return;
        index=target;
        queueMicrotask(()=>{for(const fn of listeners.get('popstate')??[])fn({state:states[index]});});
      },
      back(){this.go(-1);},
      forward(){this.go(1);}
    }
  };
  return {browser,states,get index(){return index;}};
}

const parents={moon:'earth',phobos:'mars',earth:null,mars:null,charon:'pluto',pluto:null,sun:null};
function fixture(){
  const history=browserHistory(),calls=[];
  let id=null,controller;
  controller=initSceneHistory({
    browser:history.browser,sceneId:()=>id,parentId:body=>parents[body]??null,
    onParentBack(){calls.push(['top-left',id]);id=parents[id]??null;controller.sync();},
    onShowScene(target){calls.push(['restore',target]);id=target;controller.sync();}
  });
  return {
    ...history,calls,controller,
    get index(){return history.index;},
    get id(){return id;},
    open(target){id=target;controller.sync();},
    clickBack(){id=parents[id]??null;calls.push(['manual',id]);controller.sync();},
    stop(){controller.destroy();}
  };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('v151: direct Moon scene creates Earth + Moon entries; two Back actions reach solar',async()=>{
  const env=fixture();
  try{
    env.open('moon');
    assert.equal(env.states.length,3);
    assert.equal(env.index,2);
    assert.equal(env.states[0].other,'preserved');
    env.browser.history.back();await flush();
    assert.equal(env.id,'earth');
    assert.deepEqual(env.calls,[['top-left','moon']]);
    env.browser.history.back();await flush();
    assert.equal(env.id,null);
    assert.deepEqual(env.calls.at(-1),['top-left','earth']);
    assert.equal(env.index,0);
  }finally{env.stop();}
});

test('v151: browser Forward restores Earth and Moon without adding entries',async()=>{
  const env=fixture();
  try{
    env.open('moon');env.browser.history.go(-2);await flush();
    assert.equal(env.id,null);
    env.browser.history.forward();await flush();
    assert.equal(env.id,'earth');
    env.browser.history.forward();await flush();
    assert.equal(env.id,'moon');
    assert.deepEqual(env.calls.slice(-2),[['restore','earth'],['restore','moon']]);
    assert.equal(env.states.length,3);
  }finally{env.stop();}
});

test('v151: top-left Back consumes exactly its scene entry, without a double Back',async()=>{
  const env=fixture();
  try{
    env.open('moon');env.clickBack();
    assert.equal(env.id,'earth','the on-screen button updates immediately');
    await flush();
    assert.equal(env.index,1);
    assert.equal(env.id,'earth','the matching popstate does not trigger a second return');
    env.clickBack();await flush();
    assert.equal(env.id,null);
    assert.equal(env.index,0);
    assert.deepEqual(env.calls,[['manual','earth'],['manual',null]]);
  }finally{env.stop();}
});

test('v151: different branches have independent parent chains',async()=>{
  const env=fixture();
  try{
    env.open('moon');env.open('charon');
    assert.equal(env.states.length,6,'solar + Earth + Moon + solar + Pluto + Charon');
    env.browser.history.back();await flush();
    assert.equal(env.id,'pluto');
    env.browser.history.back();await flush();
    assert.equal(env.id,null);
    env.browser.history.back();await flush();
    assert.equal(env.id,'moon','earlier navigation history is still available');
  }finally{env.stop();}
});

test('v151: entering a parent with the view action consumes history, not a duplicate scene',async()=>{
  const env=fixture();
  try{
    env.open('moon');env.open('earth');await flush();
    assert.equal(env.index,1);
    assert.equal(env.id,'earth');
    assert.equal(env.states.length,3);
    env.browser.history.back();await flush();
    assert.equal(env.id,null);
  }finally{env.stop();}
});

test('v151: mobile sheet closes before history records a new planet view',async()=>{
  const env=fixture();
  try{
    env.browser.history.pushState({...env.browser.history.state,__sonnensystemMobileSheet:'sheet-token'},'');
    env.open('moon');
    assert.equal(env.states.length,2,'do not place a planet entry above an open sheet');
    env.browser.history.back();await flush();
    assert.equal(env.id,'moon');
    assert.equal(env.states.length,3);
    assert.equal(env.index,2);
    assert.ok(env.states.every(state=>!('__sonnensystemMobileSheet' in state)));
    env.browser.history.back();await flush();
    assert.equal(env.id,'earth');
  }finally{env.stop();}
});

test('v151: sheet Back alone does not leave the current planet scene',async()=>{
  const env=fixture();
  try{
    env.open('earth');
    env.browser.history.pushState({...env.browser.history.state,__sonnensystemMobileSheet:'sheet-token'},'');
    env.browser.history.back();await flush();
    assert.equal(env.id,'earth');
    assert.equal(env.calls.length,0);
    assert.equal(env.index,1);
    env.browser.history.back();await flush();
    assert.equal(env.id,null);
  }finally{env.stop();}
});

test('v151: direct return with open sheet consumes sheet then parent entry',async()=>{
  const env=fixture();
  try{
    env.open('moon');
    env.browser.history.pushState({...env.browser.history.state,__sonnensystemMobileSheet:'sheet-token'},'');
    env.clickBack();
    assert.equal(env.id,'earth');
    env.browser.history.back();await flush();
    assert.equal(env.index,1);
    assert.equal(env.id,'earth');
    assert.deepEqual(env.calls,[['manual','earth']]);
  }finally{env.stop();}
});

test('v151: no history API keeps the direct scene controls usable',()=>{
  const env=initSceneHistory({browser:{addEventListener(){}},sceneId:()=>null,
    parentId:()=>null,onParentBack(){},onShowScene(){}});
  env.sync();env.destroy();
});

test('v151: browser glue and offline shell contain the navigation module',async()=>{
  const [runtime,mode,sw]=await Promise.all([
    readFile(new URL('../src/app/runtime.js',import.meta.url),'utf8'),
    readFile(new URL('../src/app/view-mode.js',import.meta.url),'utf8'),
    readFile(new URL('../sw.js',import.meta.url),'utf8')
  ]);
  assert.match(runtime,/initSceneHistory\(/);
  assert.match(runtime,/onParentBack:\(\)=>\$\('back-to-solar'\)\.click\(\)/);
  assert.match(mode,/syncSceneHistory\(\)/);
  assert.match(sw,/\.\/src\/ui\/scene-history\.js/);
});
