import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { SolarRenderer } from '../src/renderer/renderer.js';
import { layoutSceneLabels } from '../src/renderer/labels.js';
import { sphereGeometry } from '../src/renderer/geometry.js';
import { BODY_VS, BODY_FS } from '../src/renderer/shaders.js';
import { textureSource,texturePath,textureTier } from '../src/renderer/texture-sources.js';
import { TextureManager,preferredMobileQuality } from '../src/renderer/textures.js';
import { renderDetail } from '../src/ui/object-details.js';
import { INITIAL_BODIES } from './helpers/catalog-fixture.mjs';

const VP=new Float32Array([20,0,0,0, 0,20,0,0, 0,0,1,0, 0,0,0,20]);
const ctx={font:'',measureText:text=>({width:text.length*7})};
const earth={id:'earth',name:'Erde',type:'planet',radiusKm:6371,style:'earth'};
const sat={id:'sat-25544',name:'ISS',type:'satellite',radiusKm:0};
function labelScene(planetId=null){
  return {width:640,height:420,settings:{labels:true},selectedId:'earth',planetId,
    rendered:[earth,sat],positions:new Map([['earth',[0,0,0]],['sat-25544',[.5,0,0]]])};
}

test('v11: empty-space click clears selection in both scenes; hitting a body still selects',()=>{
  for(const planetId of [null,'earth']){
    const calls=[];
    const r=Object.create(SolarRenderer.prototype);
    r.vp=VP;r.planetId=planetId;r.width=640;r.height=420;
    r.camera={dist:47};r.rendered=[earth];r.positions=new Map([['earth',[0,0,0]]]);
    r.callbacks={onSelect:id=>calls.push(['select',id]),onClearSelect:()=>calls.push(['clear'])};
    assert.equal(r.pick(320,210),'earth');
    assert.equal(r.pick(600,360),null);
    assert.deepEqual(calls,[['select','earth'],['clear']]);
    r.rendered.push({...earth,id:'unavailable'});
    assert.equal(r.pick(600,360),null,'unprojectable dynamic bodies do not break empty-space clicks');
  }
});

test('v11: selected Earth label remains visible and anchored while satellites cross it',()=>{
  for(const planetId of [null,'earth']){
    const scene=labelScene(planetId);
    let side=null;
    let initialPosition=null;
    for(const [index,x] of [0.48,0.25,0.12,0.05,-0.08,0.15,0.52].entries()){
      scene.positions.set('sat-25544',[x,0,0]);
      const labels=layoutSceneLabels(scene,VP,ctx,index*16);
      const selected=labels.find(x=>x.body.id==='earth');
      assert.ok(selected,`Earth label must remain visible in ${planetId||'solar'} frame ${index}`);
      if(side===null){side=selected.side;initialPosition=selected.rect;}
      else{
        assert.equal(selected.side,side,'no side jumps during conjunction');
        assert.deepEqual(selected.rect,initialPosition,'Earth label anchor remains fixed while planet is stationary');
      }
      assert.equal(selected.selected,true);
    }
    scene.positions.set('earth',[.8,0,0]);
    const labels=layoutSceneLabels(scene,VP,ctx,117);
    assert.ok(labels.some(x=>x.body.id==='earth'),'selected fast-moving body is not suppressed');
    scene.settings.labels=false;
    assert.equal(layoutSceneLabels(scene,VP,ctx,132).length,0,'explicit user toggle can still hide labels');
  }
});

test('v11: labels of nonselected moving satellites keep the v9-v10 motion filter',()=>{
  const r=labelScene('earth');
  assert.ok(layoutSceneLabels(r,VP,ctx,0).some(x=>x.body.id==='earth'));
  r.positions.set('sat-25544',[-.5,0,0]);
  assert.ok(!layoutSceneLabels(r,VP,ctx,16).some(x=>x.body.id==='sat-25544'));
  assert.ok(layoutSceneLabels(r,VP,ctx,16).some(x=>x.body.id==='earth'));
});

test('v12: texture sources are local and reject unsafe object IDs',()=>{
  for(const id of ['sun','earth','moon','titan','bennu']){
    const s=textureSource(id);
    assert.ok(s);
    assert.equal(texturePath(id),`/textures/standard/${id}.jpg`);
    assert.equal(s.url,undefined);
  }
  assert.equal(textureSource('../earth'),null);
  assert.equal(textureSource('__proto__'),null);
  assert.equal(textureSource('earth','invalid'),null);
  assert.equal(textureTier({},'earth'),'standard');
  assert.equal(textureTier({planetId:'earth'},'moon'),'detail');
  assert.equal(textureTier({isMobile:true,planetId:'earth'},'earth'),'mobile');
  assert.equal(preferredMobileQuality({window:{innerWidth:900,matchMedia:()=>({matches:true})},navigator:{}}),true);
});

test('v11: sphere geometry contains valid continuous UV map and shader samples loaded images',()=>{
  const {vertices,indices}=sphereGeometry(10,16);
  assert.equal(vertices.length,11*17*8);
  assert.equal(indices.length,10*16*6);
  assert.equal(vertices[6],0);assert.equal(vertices[7],1);
  assert.equal(vertices[(16*8)+6],1);assert.equal(vertices[(10*17*8)+7],0);
  assert.match(BODY_VS,/attribute vec2 aUV/);
  assert.match(BODY_FS,/texture2D\(uDiffuse,vUV\)/);
  assert.match(BODY_FS,/uHasTexture/);
});

test('v11: GPU uploads downscale to requested tier and do not upscale low-res mosaics',()=>{
  const saved=globalThis.document;
  const uploads=[];const resized=[];
  globalThis.document={createElement:tag=>{
    assert.equal(tag,'canvas');
    const can={width:0,height:0,getContext:()=>({drawImage:(image,x,y,w,h)=>resized.push([w,h])})};
    return can;
  }};
  const gl={MAX_TEXTURE_SIZE:1,TEXTURE0:2,TEXTURE_2D:3,UNPACK_FLIP_Y_WEBGL:4,RGBA:5,UNSIGNED_BYTE:6,
    TEXTURE_WRAP_S:7,TEXTURE_WRAP_T:8,TEXTURE_MAG_FILTER:9,TEXTURE_MIN_FILTER:10,REPEAT:11,
    CLAMP_TO_EDGE:12,LINEAR:13,LINEAR_MIPMAP_LINEAR:14,getParameter:()=>8192,
    createTexture:()=>({}),deleteTexture:()=>{},activeTexture:()=>{},bindTexture:()=>{},pixelStorei:()=>{},
    texImage2D:(...args)=>uploads.push(args[5]),texParameteri:()=>{},generateMipmap:()=>{}};
  try{
    const manager=new TextureManager(gl,{mobile:false});
    assert.equal(manager.upload({naturalWidth:8192,naturalHeight:4096},2048).width,2048);
    assert.deepEqual(resized.at(-1),[2048,1024]);
    assert.equal(manager.upload({naturalWidth:8192,naturalHeight:4096},4096).width,4096);
    assert.deepEqual(resized.at(-1),[4096,2048]);
    assert.equal(manager.upload({naturalWidth:8192,naturalHeight:4096},512).width,512);
    assert.deepEqual(resized.at(-1),[512,256]);
    assert.equal(manager.upload({naturalWidth:1024,naturalHeight:512},2048).width,1024);
    assert.equal(uploads.length,4);
    assert.equal(uploads.at(-1).naturalWidth,1024);
  }finally{if(saved===undefined)delete globalThis.document;else globalThis.document=saved;}
});

test('v11: object detail attribution is visible for mapped bodies and cleared on deselect',()=>{
  const saved=globalThis.document;
  const els=new Map();const get=id=>{
    if(!els.has(id))els.set(id,{textContent:'',innerHTML:'',hidden:false,style:{setProperty(){}},
      className:'',classList:{toggle(){}},setAttribute(){},querySelectorAll(){return[];}});
    return els.get(id);
  };
  globalThis.document={getElementById:get};
  try{
    const state={bodies:INITIAL_BODIES.map(x=>({...x})),selected:'earth'};
    renderDetail(state,null,()=>{});
    assert.equal(get('texture-credit').hidden,false);
    assert.match(get('texture-credit').textContent,/textures\/standard/);
    state.selected=null;
    renderDetail(state,null,()=>{});
    assert.equal(get('texture-credit').hidden,true);
    assert.equal(get('texture-credit').innerHTML,'');
    assert.equal(get('detail-name').textContent,'Kein Objekt ausgewählt');
    assert.equal(get('horizons-btn').disabled,true);
  }finally{if(saved===undefined)delete globalThis.document;else globalThis.document=saved;}
});

test('v11: browser PWA preloads the texture modules and caches maps only on demand',async()=>{
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const app=await readFile(new URL('../src/app.js',import.meta.url),'utf8');
  const server=await readFile(new URL('../server/server.mjs',import.meta.url),'utf8');
  assert.match(sw,/sonnensystem-shell-v49/);
  assert.match(sw,/\.\/src\/renderer\/textures\.js/);
  assert.match(sw,/textures\\\//);
  assert.match(html,/id="texture-credit"/);
  assert.match(app,/onClearSelect:clearSelection/);
  assert.doesNotMatch(server,/textureAsset\(url\.pathname\)/);
});
