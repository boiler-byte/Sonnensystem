/** Browser Back follows the same parent hierarchy as the scene's top-left button.
 *  History entries are in-page states (no URL changes or page reloads).
 *  The mobile bottom sheet owns a temporary entry above a scene: never consume
 *  that entry as a scene transition or push a scene entry before it has closed.
 */
const SCENE_KEY='__sonnensystemScene';
const SHEET_KEY='__sonnensystemMobileSheet';
const UNTRACKED=Symbol('untracked scene');
let activeHistory=null;

export function syncSceneHistory(){activeHistory?.sync();}

export function initSceneHistory({browser,sceneId,parentId,onParentBack,onShowScene}){
  const history=browser?.history;
  if(typeof history?.pushState!=='function'||typeof history?.replaceState!=='function'
    ||typeof history?.back!=='function'||typeof browser?.addEventListener!=='function'){
    activeHistory=null;
    return {sync(){},destroy(){}};
  }
  const token=`${Date.now()}-${Math.random()}`;
  let replaying=false,pendingSheet=false;
  const isRecord=state=>state && typeof state==='object' && !Array.isArray(state);
  const isSheet=state=>isRecord(state)&&Object.hasOwn(state,SHEET_KEY);
  const ownScene=state=>{
    const value=isRecord(state)?state[SCENE_KEY]:null;
    return value?.token===token && (value.id===null||typeof value.id==='string')
      ? value.id:UNTRACKED;
  };
  const stateWithScene=(id,previous=history.state)=>{
    const next=isRecord(previous)?{...previous}:{};
    delete next[SHEET_KEY];
    next[SCENE_KEY]={token,id};
    return next;
  };
  // Include the local solar overview as the base entry. A direct Moon view
  // creates Earth and Moon entries so Back traverses Moon -> Earth -> solar.
  function chain(id){
    const route=[],seen=new Set();
    for(let step=id;step!==null&&step!==undefined&&!seen.has(step);step=parentId(step)){
      seen.add(step);route.push(step);
    }
    return [null,...route.reverse()];
  }
  function applyScene(){
    const to=sceneId()??null;
    let from=ownScene(history.state);
    if(from===to)return;
    if(from===UNTRACKED){
      // Other scripts may have replaced the current state; stay on this page.
      history.replaceState(stateWithScene(null),'');
      from=null;
    }
    const route=chain(to);
    const oldRoute=chain(from);
    const ancestor=oldRoute.indexOf(to);
    if(ancestor!==-1){
      const steps=oldRoute.length-ancestor-1;
      if(steps===1)history.back();
      else if(steps>1&&typeof history.go==='function')history.go(-steps);
      else if(steps>1){
        // No multi-step History API: keep the rendered view in sync without
        // risking navigation away from the app.
        history.replaceState(stateWithScene(to),'');
      }
      return;
    }
    const common=route.indexOf(from);
    // Switching between unrelated branches starts a fresh parent hierarchy,
    // while keeping older visited scenes available further back in history.
    for(const id of route.slice(common<0?0:common+1))
      history.pushState(stateWithScene(id),'');
  }
  function sync(){
    if(replaying)return;
    try{
      if(isSheet(history.state)){
        if(ownScene(history.state)!==sceneId())pendingSheet=true;
        return;
      }
      applyScene();
    }catch{/* Restricted History APIs must not interrupt camera navigation. */}
  }
  function popstate(event){
    // A view may have changed while a mobile sheet entry was active. The
    // sheet's popstate listener runs first; only now may scene history change.
    if(pendingSheet && !isSheet(event.state)){
      pendingSheet=false;
      sync();
      return;
    }
    const target=ownScene(event.state),current=sceneId()??null;
    if(target===UNTRACKED||target===current)return;
    replaying=true;
    try{
      if(current!==null && parentId(current)===target)onParentBack();
      else onShowScene(target);
    }finally{replaying=false;}
  }
  try{
    // Preserve unrelated state data, including flags from embedded consumers.
    history.replaceState(stateWithScene(sceneId()??null),'');
  }catch{
    activeHistory=null;
    return {sync(){},destroy(){}};
  }
  browser.addEventListener('popstate',popstate);
  const controller={sync,destroy(){browser.removeEventListener?.('popstate',popstate);
    if(activeHistory===controller)activeHistory=null;}};
  activeHistory=controller;
  return controller;
}
