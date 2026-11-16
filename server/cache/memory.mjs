/** TTL + in-flight de-duplication; unsuccessful requests are negatively cached for five minutes. */
const cache=new Map();
let nasaQueue=Promise.resolve();
export function enqueueNASA(task){
  const pending=nasaQueue.then(task,task);
  nasaQueue=pending.catch(()=>{});
  return pending;
}
export async function cached(key,ttlMs,load){
  const now=Date.now(),entry=cache.get(key);
  if(entry&&entry.expiry>now){
    if(entry.value)return entry.value;
    if(entry.error)throw entry.error;
    if(entry.pending)return entry.pending;
  }
  const pending=Promise.resolve().then(load);
  cache.set(key,{pending,expiry:now+ttlMs});
  try{
    const value=await pending;
    cache.set(key,{value,expiry:Date.now()+ttlMs});return value;
  }catch(error){
    cache.set(key,{error,expiry:Date.now()+5*60_000});throw error;
  }
}
