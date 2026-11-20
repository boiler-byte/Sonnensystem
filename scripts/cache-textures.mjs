/** Local-only inventory: hashes change automatically as image files are replaced. */
import {textureManifest} from '../server/texture-manifest.mjs';
import {TEXTURE_TIERS} from '../src/renderer/texture-sources.js';

const {files}=await textureManifest();
for(const [tier,width] of Object.entries(TEXTURE_TIERS)){
  const paths=Object.keys(files).filter(path=>path.startsWith(`/textures/${tier}/`));
  console.log(`${tier} (${width} px): ${paths.length} Datei(en)`);
  for(const path of paths)console.log(`  ${path}  SHA-256 ${files[path]}`);
}
console.log('Texturen werden nur lokal gelesen. Der Browser aktualisiert den Cache automatisch.');
