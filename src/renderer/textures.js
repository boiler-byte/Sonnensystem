import {textureSource,texturePaths,textureTier} from './texture-sources.js';

/**
 * Lazy WebGL texture uploader. Images arrive asynchronously from the allowlisted
 * local /textures/standard files only; no network access to third-party sites.
 * Only a small bounded set of maps is kept on the GPU at one time.
 */
const isPowerOfTwo=n=>n>0&&(n&(n-1))===0;
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
  }
  setMobile(isMobile){
    if(this.disposed || this.mobile===Boolean(isMobile))return;
    this.mobile=Boolean(isMobile);this.maxBytes=this.mobile?48*1024*1024:192*1024*1024;this.evict();
  }
  get(body,planetId,selectedId){
    if(this.disposed)return null;
    const tier=textureTier({isMobile:this.mobile,planetId,selectedId},body.id);
    const source=textureSource(body.id,tier);
    if(!source)return null; // Procedural fallback for unphotographed objects.
    const effective=tier;
    const key=`${body.id}:${effective}`;
    const cached=this.entries.get(key);
    if(cached?.status==='ready'){cached.lastUsed=Date.now();return cached.texture;}
    if(!cached){this.entries.set(key,{status:'queued',lastUsed:Date.now()});this.queue.push({id:body.id,tier:effective,key});this.pump();}
    // Keep the already loaded 2K texture visible while 4K is loading.
    if(effective==='detail'){
      const regular=this.entries.get(`${body.id}:standard`);
      if(regular?.status==='ready'){regular.lastUsed=Date.now();return regular.texture;}
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
        if(this.disposed || this.entries.get(job.key)!==record){
          this.gl.deleteTexture(texture.handle);return;
        }
        const bytes=texture.width*texture.height*4*(texture.mipmaps?4/3:1);
        Object.assign(record,{status:'ready',texture:texture.handle,bytes,lastUsed:Date.now()});
        this.bytes+=bytes;this.evict(job.key);
      }).catch(()=>{
        if(!this.disposed && this.entries.get(job.key)===record)record.status='failed';
      }).finally(()=>{this.active--;this.pump();});
    }
  }
  async load({id,tier}){
    const source=textureSource(id,tier);
    if(!source)throw Error('Unknown texture source');
    let lastError;
    for(const local of texturePaths(id,tier)){
      try{
        const image=await this.loadImage(local);
        if(this.disposed)throw Error('Texture manager disposed');
        return this.upload(image,source.width);
      }catch(error){lastError=error;if(this.disposed)break;}
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
    this.entries.clear();this.queue.length=0;this.bytes=0;
    // In-flight jobs check disposed before uploading and on completion.
  }
}
