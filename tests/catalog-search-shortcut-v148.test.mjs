import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {S,setRenderer,setMobileSheets} from '../src/app/state.js';
import {updateCatalog,clearCatalogSearch,showRelatedInCatalog} from '../src/ui/catalog-controller.js';
import {isSearchShortcut,initSearchHandlers} from '../src/ui/event-handlers.js';
import {INITIAL_BODIES} from './helpers/catalog-fixture.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
function mockCatalog(){
  const oldDocument=globalThis.document;
  const oldState={bodies:S.bodies,selected:S.selected,search:S.search,catalogSort:S.catalogSort,
    catalogPlanetOnly:S.catalogPlanetOnly};
  const nodes=new Map();
  const get=id=>{
    if(!nodes.has(id)){
      nodes.set(id,{
        value:'',hidden:false,innerHTML:'',textContent:'',dataset:{},scrollTop:35,
        events:new Map(),attrs:{},focusOptions:null,classList:{toggle(){}},
        setAttribute(key,val){this.attrs[key]=val;},
        focus(options){this.focusOptions=options;},
        addEventListener(event,handler){this.events.set(event,handler);},
        emit(event){const handler=this.events.get(event);assert.ok(handler,`handler for ${event}`);handler({target:this});},
        querySelectorAll(){return [];},
      });
    }
    return nodes.get(id);
  };
  globalThis.document={getElementById:get};
  S.bodies=[...INITIAL_BODIES];S.search='';S.selected=null;
  S.catalogSort='default';S.catalogPlanetOnly=false;
  setRenderer(null);
  return {get,restore(){Object.assign(S,oldState);setRenderer(null);setMobileSheets(null);globalThis.document=oldDocument;}};
}

test('v148: search suffix is a genuine accessible X button hidden by default, not the shortcut badge',async()=>{
  const [html,css,handlers]=await Promise.all([read('index.html'),read('css/styles.css'),read('src/ui/event-handlers.js')]);
  assert.equal((html.match(/id="search-clear"/g)||[]).length,1);
  assert.match(html,/<button id="search-clear" class="search-clear" type="button" aria-label="Suche leeren"[^>]+ hidden>/);
  assert.match(html,/<button id="search-clear"[^>]*><svg[^>]*><path d="M6 6L18 18M18 6L6 18"\/><\/svg><\/button>/);
  assert.doesNotMatch(html,/class="shortcut"/);
  assert.match(css,/\.search-clear\[hidden\]\{display:none!important\}/);
  assert.match(handlers,/initSearchHandlers\(\);/);
  assert.match(handlers,/if\(isSearchShortcut\(e\)\)/);
  assert.doesNotMatch(handlers,/e\.key==='\/'/);
});

test('v148: Shift+K is accepted only outside editing widgets and without other modifiers',()=>{
  const neutral={closest:()=>null,isContentEditable:false};
  const e={key:'K',shiftKey:true,altKey:false,ctrlKey:false,metaKey:false,repeat:false,target:neutral};
  assert.equal(isSearchShortcut(e),true);
  assert.equal(isSearchShortcut({...e,key:'k'}),true);
  assert.equal(isSearchShortcut({...e,shiftKey:false}),false);
  assert.equal(isSearchShortcut({...e,key:'/'}),false);
  assert.equal(isSearchShortcut({...e,altKey:true}),false);
  assert.equal(isSearchShortcut({...e,ctrlKey:true}),false);
  assert.equal(isSearchShortcut({...e,metaKey:true}),false);
  assert.equal(isSearchShortcut({...e,repeat:true}),false);
  assert.equal(isSearchShortcut({...e,target:{isContentEditable:true,closest:()=>null}}),false);
  for(const control of ['input','textarea','select','[contenteditable]','[role="textbox"]']){
    assert.equal(isSearchShortcut({...e,target:{closest:selector=>selector.includes(control)?{}:null}}),false,control);
  }
});

test('v148: user typing shows X, clicking X clears actual search results and focuses input',()=>{
  const mock=mockCatalog();
  try{
    const input=mock.get('search'),button=mock.get('search-clear');
    initSearchHandlers();
    updateCatalog();
    assert.equal(button.hidden,true,'empty field has no clear button');
    input.value='Neptun';input.emit('input');
    assert.equal(S.search,'Neptun');
    assert.equal(button.hidden,false);
    assert.match(mock.get('object-list').innerHTML,/Neptun/);
    const filteredCount=Number(mock.get('object-count').textContent);
    button.emit('click');
    assert.equal(input.value,'');assert.equal(S.search,'');
    assert.equal(button.hidden,true);
    assert.deepEqual(input.focusOptions,{preventScroll:true});
    assert.equal(Number(mock.get('object-count').textContent),INITIAL_BODIES.length);
    assert.ok(Number(mock.get('object-count').textContent)>filteredCount);
  }finally{mock.restore();}
});

test('v148: clearing also works for a search injected by the related-objects link',()=>{
  const mock=mockCatalog();
  const opened=[];setMobileSheets({open:panel=>opened.push(panel)});
  try{
    const input=mock.get('search'),button=mock.get('search-clear');
    updateCatalog();
    showRelatedInCatalog('Saturn');
    assert.equal(input.value,'Saturn');assert.equal(S.search,'Saturn');
    assert.equal(button.hidden,false);
    assert.deepEqual(opened,['catalog']);
    clearCatalogSearch();
    assert.equal(button.hidden,true);assert.equal(S.search,'');
    assert.equal(Number(mock.get('object-count').textContent),INITIAL_BODIES.length);
  }finally{mock.restore();}
});
