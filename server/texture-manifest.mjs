/** Version tokens are content hashes, cached until the underlying file changes. */
import {readdir,readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {ROOT} from './config.mjs';
import {TEXTURE_TIERS,TEXTURE_FILE_PATH} from '../src/renderer/texture-sources.js';

const fingerprints=new Map();
async function fingerprint(path){
  for(let attempt=0;attempt<2;attempt++){
    const before=await stat(path,{bigint:true});
    const identity=[before.dev,before.ino,before.size,before.mtimeNs,before.ctimeNs].join(':');
    const prior=fingerprints.get(path);
    if(prior?.identity===identity)return prior.hash;
    const bytes=await readFile(path);
    const after=await stat(path,{bigint:true});
    const afterIdentity=[after.dev,after.ino,after.size,after.mtimeNs,after.ctimeNs].join(':');
    if(afterIdentity!==identity)continue; // File was replaced during hashing.
    const hash=createHash('sha256').update(bytes).digest('hex');
    fingerprints.set(path,{identity,hash});
    return hash;
  }
  throw Error('Textur wird gerade verändert; Manifest bitte erneut abrufen');
}

export async function textureManifest(){
  const files=Object.create(null);
  for(const tier of Object.keys(TEXTURE_TIERS)){
    const directory=join(ROOT,'textures',tier);
    let names;
    try{names=await readdir(directory);}catch(error){
      if(error.code==='ENOENT')continue;
      throw error;
    }
    for(const name of names){
      const webPath=`/textures/${tier}/${name}`;
      if(!TEXTURE_FILE_PATH.test(webPath))continue;
      try{files[webPath]=await fingerprint(join(directory,name));}
      catch(error){if(error.code!=='ENOENT')throw error;}
    }
  }
  return {files};
}
