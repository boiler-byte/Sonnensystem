import {textureSource,texturePaths,textureTier,TEXTURE_FILE_PATH,textureRequestUrl} from './texture-sources.js';

/**
 * Lazy WebGL texture uploader. Images arrive asynchronously from the allowlisted
 * local textures/{mobile,standard,high} files relative to the app base; no third-party requests.
 * Only a small bounded set of maps is kept on the GPU at one time.
 */
const isPowerOfTwo=n=>n>0&&(n&(n-1))===0;
const MANIFEST_REFRESH_MS=30_000;
const MANIFEST_URL=new URL('../../api/textures/manifest',import.meta.url).href;
export function preferredMobileQuality(env=globalThis) {
  const win=env.window||env;
  const nav=env.navigator||{};
  return Boolean((win.matchMedia?.('(max-width: 760px)').matches) ||
    (nav.deviceMemory>0 && nav.deviceMemory<=3) ||
    (nav.maxTouchPoints>0 && win.innerWidth<=900));
}

export class TextureManager {
  constructor(gl,{mobile=preferredMobileQuality()}={}) {
    this.gl=gl;
    this.mobile=mobile;
    this.maxDim=Math.max(256,Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))||2048);
    this.maxBytes=mobile?48*1024*1024:192*1024*1024;
    this.entries=new Map();
    this.queue=[];
    this.active=0;
    this.maxActive=3;
    this.bytes=0;
    this.disposed=false;
    this.manifest=null; // null means the optional local manifest API is unavailable.
    this.manifestRequest=null;
    this.manifestUnavailable=false; // Missing GitHub Pages API: no more probes this session.
    this.nextManifestCheck=0;
    this.failedPaths=new Set(); // Per-file failures are remembered until page reload.
  }
  signature(id,tier,files=this.manifest){
    if(!files)return null;
    return texturePaths(id,tier).filter(path=>files.has(path))
      .map(path=>`${path}@${files.get(path)}`).join('|')||'missing';
  }
  remove(key,record){
    if(record.status==='ready'){
      this.gl.deleteTexture(record.texture);
      this.bytes-=record.bytes;
    }
    this.entries.delete(key);
  }
  /** Update successful textures; failed lookups stay failed until page reload. */
  refreshManifest(force=false){
    if(this.disposed)return Promise.resolve();
    if(this.manifestRequest)return this.manifestRequest;
    if(!force && (this.manifestUnavailable || Date.now()<this.nextManifestCheck))return Promise.resolve();
    this.nextManifestCheck=Date.now()+MANIFEST_REFRESH_MS;
    if(typeof fetch!=='function')return Promise.resolve();
    this.manifestRequest=(async()=>{
      const response=await fetch(MANIFEST_URL,{cache:'no-store'});
      if(!response.ok)throw Error('Local texture manifest unavailable');
      const payload=await response.json();
      if(!payload || !payload.files || typeof payload.files!=='object' || Array.isArray(payload.files))
        throw Error('Invalid local texture manifest');
      const next=new Map();
      for(const [path,hash] of Object.entries(payload.files)){
        if(TEXTURE_FILE_PATH.test(path)&&typeof hash==='string'&&/^[0-9a-f]{64}$/.test(hash))next.set(path,hash);
      }
      if(this.disposed)return;
      this.manifest=next;
      this.manifestUnavailable=false;
      for(const [key,record] of this.entries){
        // In-flight downloads are checked again before GPU adoption.
        // Failed textures are never invalidated by a new manifest mid-session.
        if(record.status!=='ready')continue;
        if(record.signature!==this.signature(record.id,record.tier,next))this.remove(key,record);
      }
    })().catch(()=>{
      // Static GitHub Pages hosting has no Node manifest API.
      if(!this.disposed && this.manifest===null)this.manifestUnavailable=true;
    })
      .finally(()=>{this.manifestRequest=null;});
    return this.manifestRequest;
  }
  setMobile(isMobile){
    if(this.disposed || this.mobile===Boolean(isMobile))return;
    this.mobile=Boolean(isMobile);this.maxBytes=this.mobile?48*1024*1024:192*1024*1024;this.evict();
  }
  get(body,planetId,selectedId){
    if(this.disposed)return null;
    // Catalog-loaded bodies declare available textures. No undeclared image probes.
    // Bare legacy/test bodies without an images array keep their existing behavior.
    if(Array.isArray(body?.images) && !body.images.some(image=>image?.type==='texture'))return null;
    // Check while rendering instead of keeping a background timer alive.
    if(Date.now()>=this.nextManifestCheck)void this.refreshManifest();
    const tier=textureTier({isMobile:this.mobile,planetId,selectedId},body.id);
    if(!textureSource(body.id,tier))return null;
    const key=`${body.id}:${tier}`;
    const cached=this.entries.get(key);
    // The same missing tier is only sought again on a fresh page load.
    if(cached?.status==='ready'){cached.lastUsed=Date.now();return cached.texture;}
    if(!cached){
      this.entries.set(key,{id:body.id,tier,status:'queued',signature:null,lastUsed:Date.now()});
      this.queue.push({id:body.id,tier,key});this.pump();
    }
    // Keep an existing map on screen while switching to the requested quality.
    for(const other of ['standard','mobile','high']){
      if(other===tier)continue;
      const ready=this.entries.get(`${body.id}:${other}`);
      if(ready?.status==='ready'){ready.lastUsed=Date.now();return ready.texture;}
    }
    return null;
  }
  pump(){
    if(this.disposed)return;
    while(this.active<this.maxActive && this.queue.length){
      const job=this.queue.shift();
      const record=this.entries.get(job.key);
      if(!record||record.status!=='queued')continue;
      record.status='loading';this.active++;
      this.load(job).then(texture=>{
        if(this.disposed || this.entries.get(job.key)!==record ||
          (texture.signature!==undefined && texture.signature!==this.signature(job.id,job.tier))){
          this.gl.deleteTexture(texture.handle);
          if(!this.disposed && this.entries.get(job.key)===record)this.entries.delete(job.key);
          return;
        }
        const bytes=texture.width*texture.height*4*(texture.mipmaps?4/3:1);
        Object.assign(record,{status:'ready',texture:texture.handle,bytes,
          signature:texture.signature??this.signature(job.id,job.tier),lastUsed:Date.now()});
        this.bytes+=bytes;this.evict(job.key);
      }).catch(()=>{
        if(!this.disposed && this.entries.get(job.key)===record){
          record.status='failed';record.signature=this.signature(job.id,job.tier);
        }
      }).finally(()=>{this.active--;this.pump();});
    }
  }
  async load({id,tier}){
    const source=textureSource(id,tier);
    if(!source)throw Error('Unknown texture source');
    if(this.manifestRequest)await this.manifestRequest;
    else if(this.manifest===null)await this.refreshManifest();
    if(this.disposed)throw Error('Texture manager disposed');
    const files=this.manifest;
    const signature=this.signature(id,tier,files);
    const paths=texturePaths(id,tier).filter(path=>!files||files.has(path));
    let lastError;
    for(const local of paths){
      // Do not try a failed URL again when switching between texture qualities.
      if(this.failedPaths.has(local))continue;
      try{
        // Hash only when served by the Node manifest; static Pages URLs stay clean.
        const version=files?.get(local);
        const url=textureRequestUrl(local);
        const image=await this.loadImage(version?`${url}?v=${version}`:url);
        if(this.disposed)throw Error('Texture manager disposed');
        return {...this.upload(image,source.width),signature};
      }catch(error){
        lastError=error;
        if(this.disposed)break;
        this.failedPaths.add(local);
      }
    }
    throw lastError||Error('Keine lokale Textur');
  }
  loadImage(url){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      // Same-origin resources only.
      img.onload=()=>img.naturalWidth>0 && img.naturalHeight>0 ? resolve(img) : reject(Error('Empty image'));
      img.onerror=()=>reject(Error('Texture unavailable'));
      img.src=url;
    });
  }
  upload(image,requestedWidth){
    const gl=this.gl;
    const maxWidth=Math.min(requestedWidth,this.maxDim);
    let width=image.naturalWidth,height=image.naturalHeight,bitmap=image;
    if(width>maxWidth || height>this.maxDim){
      const scale=Math.min(1,maxWidth/width,this.maxDim/height);
      width=Math.max(1,Math.floor(width*scale));height=Math.max(1,Math.floor(height*scale));
      const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw Error('Image resize not supported');
      ctx.drawImage(image,0,0,width,height);
      bitmap=canvas;
    }
    const texture=gl.createTexture();
    if(!texture)throw Error('WebGL texture allocation failed');
    const pot=isPowerOfTwo(width)&&isPowerOfTwo(height);
    try{
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,pot?gl.REPEAT:gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,pot?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
      if(pot)gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D,null);
    }catch(err){gl.deleteTexture(texture);throw err;}
    return {handle:texture,width,height,mipmaps:pot};
  }
  evict(preserve=null){
    while(this.bytes>this.maxBytes){
      let oldestKey=null,oldest=null;
      // A single pass replaces an allocated/sorted candidates array per eviction.
      for(const [key,record] of this.entries){
        if(key===preserve || record.status!=='ready')continue;
        if(!oldest || record.lastUsed<oldest.lastUsed){oldest=record;oldestKey=key;}
      }
      if(!oldest)break;
      this.gl.deleteTexture(oldest.texture);
      this.entries.delete(oldestKey);
      this.bytes-=oldest.bytes;
    }
  }
  dispose(){
    if(this.disposed)return;
    this.disposed=true;
    for(const entry of this.entries.values())if(entry.status==='ready')this.gl.deleteTexture(entry.texture);
    this.entries.clear();this.queue.length=0;this.bytes=0;this.failedPaths.clear();
    // In-flight jobs check disposed before uploading and on completion.
  }
}
