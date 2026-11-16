import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

const get = p => readFile(new URL(p, import.meta.url), 'utf8');
const html=await get('../index.html');
const manifest=JSON.parse(await get('../manifest.webmanifest'));
const app=await get('../src/ui/bottom-sheet.js');
const boot=await get('../src/app.js');
const css=await get('../css/styles.css');
assert.equal(manifest.name,'Sonnensystem');
assert.equal(manifest.display,'standalone');
assert.ok(manifest.icons.length>=2);
assert.match(html, /rel="manifest"/);
assert.match(html, /id="mobile-sheet"/);
assert.match(html, /data-sheet-panel="catalog"/);
assert.match(html, /data-sheet-panel="detail"/);
assert.match(html, /data-sheet-panel="time"/);
assert.doesNotMatch(html, /ORBITAL|LIVE-RENDERING \/ 3D SZENE|Eine Reise durch Raum und Zeit/);
assert.match(boot, /navigator\.serviceWorker\.register/);
assert.match(css, /\.mobile-sheet\.dragging\{transition:none\}/);
for(const i of manifest.icons){assert.ok((await stat(new URL('../'+i.src,import.meta.url))).size>10_000,`${i.src} missing`);}

class MockEl {
  constructor(id='',height=100){this.id=id;this.height=height;this.children=[];this.attrs={};this.handlers={};this.hidden=false;this.inert=false;this.dataset={};this.style={values:{},setProperty:(k,v)=>this.style.values[k]=v,getPropertyValue:k=>this.style.values[k]||''};this._classes=new Set();this.classList={toggle:(name,on)=>on?this._classes.add(name):this._classes.delete(name),add:n=>this._classes.add(n),remove:n=>this._classes.delete(n)};}
  insertBefore(item,other){if(item.parentNode){const prev=item.parentNode.children;prev.splice(prev.indexOf(item),1);}const i=this.children.indexOf(other);this.children.splice(i<0?this.children.length:i,0,item);item.parentNode=this;}
  append(item){if(item.parentNode){const list=item.parentNode.children;list.splice(list.indexOf(item),1);}this.children.push(item);item.parentNode=this;}
  get nextSibling(){if(!this.parentNode)return null;return this.parentNode.children[this.parentNode.children.indexOf(this)+1]||null;}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
  emit(name,event={}){for(const f of this.handlers[name]||[])f(event);}
  getBoundingClientRect(){return {height:this.height};}
  setAttribute(name,value){this.attrs[name]=value;}
  getAttribute(name){return this.attrs[name];}
  querySelectorAll(selector){return selector==='[data-sheet-panel]'?Object.values(buttons):[];}
  setPointerCapture(){this.captured=true;}
  hasPointerCapture(){return this.captured;}
  releasePointerCapture(){this.captured=false;}
}
const nodes=Object.fromEntries(['mobile-sheet','sheet-header','sheet-content','mobile-sheet-scrim','sheet-handle','catalog','detail','time-panel'].map(id=>[id,new MockEl(id)]));
nodes['mobile-sheet'].height=760;nodes['sheet-header'].height=74;
const buttons=Object.fromEntries(['catalog','detail','time'].map(name=>[name,new MockEl('tab-'+name)]));
for(const [name,el] of Object.entries(buttons)){el.dataset.sheetPanel=name;}
const shell=new MockEl('shell'),viewport=new MockEl('viewport');
for(const name of ['catalog','detail'])shell.append(nodes[name]);
viewport.append(nodes['time-panel']);
const mq={matches:true,handlers:[],addEventListener(_,fn){this.handlers.push(fn);}};
const windowMock={innerHeight:844,matchMedia:()=>mq,addEventListener(){}};
const documentMock={getElementById:id=>nodes[id],createComment:()=>new MockEl('anchor')};
const start=app.indexOf('export function initMobileSheets()');
const end=app.length;
assert.ok(start>0&&end>start);
const module=vm.createContext({window:windowMock,document:documentMock,$:id=>nodes[id],performance:{now:()=>1234},console});
vm.runInContext(app.slice(start,end).replace('export function initMobileSheets()','function initMobileSheets()')+'\nthis.controller=initMobileSheets();',module);
const controller=module.controller;
assert.equal(nodes['detail'].parentNode,nodes['sheet-content']);
assert.equal(nodes['catalog'].parentNode,nodes['sheet-content']);
assert.equal(nodes['time-panel'].parentNode,nodes['sheet-content']);
assert.equal(nodes['mobile-sheet'].dataset.snap,'closed');
assert.equal(nodes['sheet-content'].inert,true);
assert.equal(nodes['detail'].hidden,false);
assert.equal(nodes['catalog'].hidden,true);
controller.open('catalog');
assert.equal(nodes['mobile-sheet'].dataset.snap,'half');
assert.equal(nodes['catalog'].hidden,false);
assert.equal(nodes['detail'].hidden,true);
assert.equal(buttons.catalog.getAttribute('aria-pressed'),'true');
controller.close();
assert.equal(nodes['mobile-sheet'].dataset.snap,'closed');
const header=nodes['sheet-header'];
header.emit('pointerdown',{pointerId:7,button:0,clientY:810});
header.emit('pointermove',{pointerId:7,clientY:750,preventDefault(){}});
header.emit('pointerup',{pointerId:7});
assert.equal(nodes['mobile-sheet'].dataset.snap,'half','Swipe upward opens half');
header.emit('pointerdown',{pointerId:8,button:0,clientY:810});
header.emit('pointermove',{pointerId:8,clientY:880,preventDefault(){}});
header.emit('pointerup',{pointerId:8});
assert.equal(nodes['mobile-sheet'].dataset.snap,'closed','Swipe downward closes');
mq.matches=false;mq.handlers.forEach(fn=>fn());
assert.equal(nodes.catalog.parentNode,shell);
assert.equal(nodes.detail.parentNode,shell);
assert.equal(nodes['time-panel'].parentNode,viewport);
assert.equal(nodes.catalog.hidden,false);

const swEvents={};const entries=new Map();
const offlineResponse={ok:true,clone(){return this;}};
const catalogManifest=JSON.parse(await get('../data/catalog/manifest.json'));
const matchEntry=async key=>entries.get(key)||entries.get('./'+new URL(key.url||key,'http://localhost:4173/').pathname.slice(1));
const cache={
  addAll:async files=>files.forEach(file=>entries.set(file,file==='./data/catalog/manifest.json'
    ?{ok:true,json:async()=>catalogManifest}:offlineResponse)),
  match:matchEntry,
  put:async(k,v)=>entries.set(k,v)
};
const cachesMock={open:async()=>cache,keys:async()=>['sonnensystem-shell-v6.1'],delete:async()=>true,match:matchEntry};
const selfMock={location:{origin:'http://localhost:4173'},addEventListener:(type,handler)=>swEvents[type]=handler,skipWaiting:async()=>{},clients:{claim:async()=>{}}};
vm.runInNewContext(await get('../sw.js'),{self:selfMock,caches:cachesMock,URL,fetch:async()=>{throw Error('offline')}});
let installation;swEvents.install({waitUntil:p=>installation=p});await installation;
assert.ok(entries.has('./index.html'));
assert.ok(entries.has('./icons/icon-512.png'));
assert.ok(entries.has('./data/catalog/manifest.json'));
for(const item of [...catalogManifest.categories,...catalogManifest.editorial])assert.ok(entries.has(item.path),`${item.path} offline data missing`);
let navigation;swEvents.fetch({request:{method:'GET',url:'http://localhost:4173/',mode:'navigate'},respondWith:p=>navigation=p});
assert.equal(await navigation,offlineResponse,'Offline navigation uses cached app shell');
let offlineData;
swEvents.fetch({request:{method:'GET',url:'http://localhost:4173/data/catalog/planets.json',mode:'cors'},
  respondWith:p=>offlineData=p,waitUntil(){}});
assert.equal(await offlineData,offlineResponse,'Offline catalog JSON is served from precache');
let wasIntercepted=false;
swEvents.fetch({request:{method:'GET',url:'http://localhost:4173/api/bodies',mode:'cors'},respondWith:()=>wasIntercepted=true});
assert.equal(wasIntercepted,false,'Live APIs are not cached');
console.log('✓ v2 PWA assets, offline shell, mobile sheet snap gestures and responsive DOM relocation validated');
