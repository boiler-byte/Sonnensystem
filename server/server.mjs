/** Dependency-free static server with a NASA/JPL Horizons gateway. */
import { createServer } from 'node:http';
import { PORT,NASA_CONTACT_OK } from './config.mjs';
import { apiRoute } from './routes/api.mjs';
import { staticAsset } from './static.mjs';
import { describeError } from './providers/http.mjs';

function json(res,status,body){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(JSON.stringify(body));
}
export async function handler(req,res){
  const url=new URL(req.url||'/','http://localhost');
  if(req.method!=='GET')return json(res,405,{status:405,error:'Nur GET ist erlaubt'});
  try{
    const api=await apiRoute(url);
    if(api)return json(res,api.status,api.body);

    const asset=await staticAsset(url.pathname);
    if(!asset)return json(res,404,{status:404,error:'Nicht gefunden'});
    res.writeHead(200,{'Content-Type':asset.type,'Cache-Control':asset.cacheControl,'X-Content-Type-Options':'nosniff'});
    res.end(asset.bytes);
  }catch(error){
    console.error('[Sonnensystem]',url.pathname,describeError(error));
    json(res,502,{status:502,error:describeError(error)});
  }
}
// Importing the module for tests must not start a listener.
if(process.argv[1]&&new URL(`file://${process.argv[1]}`).pathname===new URL(import.meta.url).pathname){
  createServer(handler).listen(PORT,'0.0.0.0',()=>{
    console.log(`\n  Sonnensystem v140: http://localhost:${PORT}\n`);
    console.log(`  NASA/JPL Horizons: ${NASA_CONTACT_OK?'Kontakt konfiguriert':'Kontaktadresse fehlt'}\n`);
  });
}
