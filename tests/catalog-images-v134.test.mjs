import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {loadCatalog,parseCategory,mergeLiveBodies} from '../src/data/catalog.js';
import {texturePath,texturePaths,textureTier} from '../src/renderer/texture-sources.js';
import {TextureManager} from '../src/renderer/textures.js';

const readJSON=async path=>JSON.parse(await readFile(new URL('../'+path.slice(2),import.meta.url),'utf8'));
const ids='callisto ceres deimos earth enceladus eris europa ganymede haumea iapetus io jupiter makemake mars mercury mimas moon neptune oberon phobos pluto rhea saturn sun titan titania triton uranus venus'.split(' ');
const sss=new Set('ceres earth eris haumea jupiter makemake mars mercury moon neptune saturn sun uranus venus'.split(' '));
const jpl=new Set(ids.filter(id=>!sss.has(id)));
const catalog=await loadCatalog(readJSON);

const gl=()=>({MAX_TEXTURE_SIZE:1,getParameter:()=>4096,deleteTexture(){}});

test('v134: exactly 29 declared object textures have complete source and license fields',()=>{
  assert.equal(catalog.version,'10.2.0');
  const textured=catalog.bodies.filter(body=>body.images.some(image=>image.type==='texture'));
  assert.deepEqual(textured.map(body=>body.id).sort(),[...ids].sort());
  assert.equal(textured.length,29);
  for(const body of catalog.bodies){
    assert.ok(Array.isArray(body.images),`${body.id} must expose images[]`);
    if(!ids.includes(body.id))assert.deepEqual(body.images,[],`${body.id} has no registered texture`);
  }
  for(const body of textured){
    assert.equal(body.images.length,1,body.id);
    const image=body.images[0];
    assert.deepEqual(Object.keys(image),['type','author','sourceUrl','license','licenseUrl','modifications']);
    assert.equal(image.type,'texture');
    assert.match(image.sourceUrl,/^https:\/\//);
    assert.equal(image.modifications,'Konvertierung nach WebP');
    if(sss.has(body.id)){
      assert.equal(image.author,'Solar System Scope');
      assert.equal(image.license,'CC BY 4.0');
      assert.equal(image.licenseUrl,'https://creativecommons.org/licenses/by/4.0/');
      assert.equal(image.sourceUrl,'https://www.solarsystemscope.com/textures/');
    }else{
      assert.ok(jpl.has(body.id));
      assert.match(image.author,/JPL/);
      assert.equal(image.license,'NASA Media Usage Guidelines');
      assert.equal(image.licenseUrl,'https://www.nasa.gov/nasa-brand-center/images-and-media/');
      assert.match(image.sourceUrl,/^https:\/\/space\.jpl\.nasa\.gov\/tmaps\//);
    }
  }
});

test('v134: canonical desktop and mobile paths derive from object ID, including planet detail views',()=>{
  for(const id of ids){
    assert.equal(texturePath(id,'standard'),`/textures/standard/${id}.webp`);
    assert.equal(texturePath(id,'mobile'),`/textures/mobile/${id}.webp`);
    assert.ok(texturePaths(id,'standard').includes(`/textures/mobile/${id}.webp`));
  }
  assert.equal(textureTier({planetId:'saturn'}),'standard');
  assert.equal(textureTier({isMobile:true,planetId:'saturn'}),'mobile');
});

test('v134: invalid image metadata fail validation without compromising other data',async()=>{
  const planets=await readJSON('./data/catalog/planets.json');
  for(const [mutate,expected] of [
    [image=>{image.sourceUrl='http://invalid.example/';},/sourceUrl/],
    [image=>{image.licenseUrl='javascript:alert(1)';},/licenseUrl/],
    [image=>{image.author='';},/author/],
    [image=>{image.modifications=123;},/modifications/],
    [image=>{delete image.licenseUrl;},/licenseUrl/]
  ]){
    const copy=structuredClone(planets);
    const image=copy.objects.find(object=>object.id==='earth').images[0];
    mutate(image);
    assert.throws(()=>parseCategory(copy,'planet'),expected);
  }
});

test('v134: live orbital updates cannot erase catalog image credits',()=>{
  const body=catalog.bodies.find(body=>body.id==='earth');
  const [updated]=mergeLiveBodies([body],[{id:'earth',a:1.012,images:[],description:'replace'}]);
  assert.equal(updated.a,1.012);
  assert.deepEqual(updated.images,body.images);
});

test('v134: runtime does not request an undeclared texture',async()=>{
  const manager=new TextureManager(gl(),{mobile:false});
  manager.manifestUnavailable=true;
  manager.nextManifestCheck=Infinity;
  let calls=0;
  manager.load=async()=>{calls++;return {handle:{},width:32,height:16,mipmaps:false};};
  try{
    assert.equal(manager.get({id:'ceres',images:[]},null,null),null);
    assert.equal(manager.get({id:'ceres',images:[{type:'image'}]},null,null),null);
    assert.equal(manager.entries.size,0);
    assert.equal(manager.get({id:'ceres',images:[{type:'texture'}]},null,null),null);
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(calls,1);
    assert.equal(manager.entries.get('ceres:standard').status,'ready');
  }finally{manager.dispose();}
});
