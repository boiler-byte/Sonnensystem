const $=id=>document.getElementById(id);
/** Screen-space camera-center shift for the area remaining above an overlaid sheet. */
export function visibleCanvasFocusOffset(sceneRect,sheetTop){
  if(!sceneRect || sceneRect.height<=0)return 0;
  const visibleHeight=Math.max(0,Math.min(sceneRect.bottom,sheetTop)-sceneRect.top);
  return Math.max(0,1-Math.min(1,visibleHeight/sceneRect.height));
}
/** Shared catalog/detail tabs on desktop, moving the same panels into the mobile bottom sheet. */
export function initMobileSheets() {
  const mq = window.matchMedia('(max-width: 770px)');
  const sheet = $('mobile-sheet'), header = $('sheet-header'), content = $('sheet-content');
  const scrim = $('mobile-sheet-scrim');
  const cameraActions = $('reset-camera').parentElement;
  const panels = {catalog:$('catalog'),detail:$('detail')};
  const desktopTabs=[...$('sidebar').querySelectorAll('[data-sidebar-panel]')];
  const mobileTabs=[...sheet.querySelectorAll('[data-sheet-panel]')];
  const allTabs=[...desktopTabs,...mobileTabs];
  const anchors = Object.fromEntries(Object.entries(panels).map(([name,el])=>{
    const marker=document.createComment(`${name} desktop position`);
    el.parentNode.insertBefore(marker, el);
    return [name,marker];
  }));
  let panel='catalog', snap='closed', isDragging=false, drag=null, suppressClickUntil=0;
  const mobile=()=>mq.matches;
  const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
  // A temporary history entry makes Android/browser Back dismiss the sheet first.
  // The token prevents unrelated history states from being mistaken for our entry.
  const historyKey='__sonnensystemMobileSheet', historyToken=`${Date.now()}-${Math.random()}`;
  let historyOpen=false,historyBackPending=false,reopenAfterBack=false;
  const isSheetEntry=state=>state!==null&&typeof state==='object'&&state[historyKey]===historyToken;
  function rememberOpen(){
    if(!mobile())return;
    if(historyBackPending){reopenAfterBack=true;return;}
    if(historyOpen&&isSheetEntry(window.history?.state))return;
    const history=window.history;
    if(typeof history?.pushState!=='function')return;
    try{
      const previous=history.state;
      const state=previous&&typeof previous==='object'&&!Array.isArray(previous)?{...previous}:{};
      history.pushState({...state,[historyKey]:historyToken},''); // Same URL, no page load.
      historyOpen=true;
    }catch{historyOpen=false;} // Do not break the sheet if history access is restricted.
  }
  function rememberClose(){
    reopenAfterBack=false;
    if(!historyOpen||historyBackPending)return;
    const history=window.history;
    if(!isSheetEntry(history?.state)){historyOpen=false;return;}
    try{historyBackPending=true;history.back();}
    catch{historyBackPending=false;historyOpen=false;}
  }
  function levels(){
    // The sheet's height follows the visible snap level, so derive the maximum
    // from the viewport rather than the current sheet height.
    const full=window.innerHeight;
    const closed=header.getBoundingClientRect().height;
    return {closed,half:clamp(window.innerHeight*.39,Math.min(closed+105,full),full),full};
  }
  function setVisibleHeight(visible){
    const height=`${visible}px`;
    sheet.style.setProperty('--sheet-visible',height);
    // The camera control is on the viewport, not inside the sheet: mirror its
    // measured height so the button clears the sheet in closed/half positions.
    cameraActions.style.setProperty('--sheet-visible',height);
  }
  function snapTo(next,{fromHistory=false}={}){
    if(!fromHistory&&next!==snap){
      if(snap==='closed'&&next!=='closed')rememberOpen();
      else if(next==='closed')rememberClose();
    }
    snap=next;
    sheet.dataset.snap=next;
    const visible=levels()[next];
    setVisibleHeight(visible);
    // A full-height sheet hides the whole scene. Avoid an offscreen tab stop.
    cameraActions.inert=mobile()&&next==='full';
    const expanded=next!=='closed';
    header.setAttribute('aria-expanded',String(expanded));
    header.setAttribute('aria-label',expanded?'Menüleiste: Ziehen oder mit Eingabe weiter öffnen und schließen':'Menüleiste: Ziehen oder mit Eingabe öffnen');
    // Zum Schließen wieder auf die Bühne tippen: nur bei voller Ansicht abgedunkelt.
    scrim.hidden=!mobile()||next!=='full';
    content.inert=!expanded;
  }
  function showPanel(next){
    if(!panels[next])return;
    panel=next;
    for(const [name,el] of Object.entries(panels)){
      const active=name===next;
      el.hidden=!active;
      el.classList.toggle('sheet-active',active&&mobile());
      el.setAttribute('aria-labelledby',`${mobile()?'sheet':'sidebar'}-tab-${name}`);
    }
    for(const btn of allTabs){
      const name=btn.dataset.sidebarPanel||btn.dataset.sheetPanel;
      const active=name===next;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',String(active));
      btn.setAttribute('aria-pressed',String(active)); // keep the established mobile toggle state.
      btn.tabIndex=active?0:-1;
    }
    content.scrollTop=0;
  }
  function dismissScenePopovers(){
    for(const [popover,button] of [['speed-popover','speed-btn'],['layer-popover','layer-btn']]){
      $(popover).hidden=true;$(button).setAttribute('aria-expanded','false');
    }
  }
  function open(next='detail'){
    if(!panels[next])return;
    showPanel(next);
    if(!mobile())return;
    // Only catalog and detail panels move into the sheet; scene controls stay visible.
    dismissScenePopovers();
    if(snap==='closed')snapTo('half');
  }
  function close(){if(mobile())snapTo('closed');}
  function expand(){if(mobile())snapTo('full');}
  function applyLayout(){
    if(mobile()){
      for(const el of Object.values(panels))content.append(el);
      showPanel(panel);
      snapTo(snap);
    }else{
      // A breakpoint change must not leave a stale sheet entry in browser history.
      snapTo('closed');
      for(const [name,el] of Object.entries(panels)){
        anchors[name].parentNode.insertBefore(el,anchors[name].nextSibling);
        el.classList.remove('sheet-active');
      }
      showPanel(panel);
      scrim.hidden=true;content.inert=false;cameraActions.inert=false;
    }
  }
  function nextTab(current,key){
    const names=['catalog','detail'];
    const index=names.indexOf(current);
    if(key==='Home')return names[0];
    if(key==='End')return names.at(-1);
    if(key==='ArrowRight')return names[(index+1)%names.length];
    if(key==='ArrowLeft')return names[(index+names.length-1)%names.length];
    return null;
  }
  for(const btn of allTabs){
    const name=btn.dataset.sidebarPanel||btn.dataset.sheetPanel;
    btn.addEventListener('click',()=>{
      if(mobile()&&performance.now()<suppressClickUntil)return;
      open(name);
    });
    btn.addEventListener('keydown',event=>{
      const next=nextTab(name,event.key);
      if(!next)return;
      event.preventDefault();open(next);
      const buttons=mobile()?mobileTabs:desktopTabs;
      buttons.find(item=>(item.dataset.sidebarPanel||item.dataset.sheetPanel)===next)?.focus();
    });
  }
  const toggleSnap=()=>snapTo(snap==='closed'?'half':snap==='half'?'full':'closed');
  // A tab selects content; tapping the rest of the header changes the snap level.
  // The entire header, including both tabs, remains a swipe handle.
  header.addEventListener('click',event=>{
    if(!mobile()||performance.now()<suppressClickUntil)return;
    if(event.target.closest?.('[data-sheet-panel]'))return;
    toggleSnap();
  });
  header.addEventListener('keydown',event=>{
    if(!mobile()||event.target!==header||!['Enter',' '].includes(event.key))return;
    event.preventDefault();toggleSnap();
  });
  scrim.addEventListener('click',close);

  // Pointergesten auf dem gesamten Kopfbereich: nach oben öffnen, nach unten schließen.
  header.addEventListener('pointerdown',e=>{
    if(!mobile()||e.button!==0)return;
    drag={id:e.pointerId,startY:e.clientY,startVisible:levels()[snap],startSnap:snap,delta:0,started:performance.now()};
  });
  header.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    const dy=e.clientY-drag.startY;
    if(!isDragging&&Math.abs(dy)>7){
      isDragging=true;
      header.setPointerCapture(e.pointerId);
      sheet.classList.add('dragging');
      cameraActions.classList.add('sheet-dragging');
    }
    if(!isDragging)return;
    e.preventDefault();
    drag.delta=dy;
    const visible=clamp(drag.startVisible-dy,levels().closed,levels().full);
    setVisibleHeight(visible);
  });
  function finishDrag(e){
    if(!drag||e.pointerId!==drag.id)return;
    const moved=isDragging, diff=drag.delta, prior=drag.startSnap;
    drag=null;isDragging=false;
    sheet.classList.remove('dragging');
    cameraActions.classList.remove('sheet-dragging');
    if(!moved)return;
    const order=['closed','half','full'];
    let choice=prior;
    if(Math.abs(diff)>35){choice=order[clamp(order.indexOf(prior)+(diff<0?1:-1),0,2)];}
    else{
      const current=parseFloat(sheet.style.getPropertyValue('--sheet-visible'));
      choice=order.reduce((best,key)=>Math.abs(levels()[key]-current)<Math.abs(levels()[best]-current)?key:best,order[0]);
    }
    snapTo(choice);
    suppressClickUntil=performance.now()+240;
    if(header.hasPointerCapture(e.pointerId))header.releasePointerCapture(e.pointerId);
  }
  header.addEventListener('pointerup',finishDrag);
  header.addEventListener('pointercancel',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    drag=null;isDragging=false;sheet.classList.remove('dragging');
    cameraActions.classList.remove('sheet-dragging');snapTo(snap);
  });
  window.addEventListener('popstate',event=>{
    const onSheetEntry=isSheetEntry(event.state);
    historyBackPending=false;
    historyOpen=onSheetEntry;
    // The user may reopen the sheet before the asynchronous history.back() resolves.
    // In that case, add the new entry only after the previous one has been removed.
    if(reopenAfterBack){
      reopenAfterBack=false;
      if(mobile()&&snap!=='closed'&&!onSheetEntry)rememberOpen();
      return;
    }
    if(onSheetEntry&&mobile()){
      if(snap==='closed')snapTo('half',{fromHistory:true}); // Forward restores the sheet.
    }else if(snap!=='closed')snapTo('closed',{fromHistory:true});
  });
  mq.addEventListener('change',applyLayout);
  window.addEventListener('resize',()=>{if(mobile()&&!isDragging)snapTo(snap);});
  applyLayout();
  // Measure the rendered sheet edge each frame (not just the snap target):
  // this stays correct during opening animations, dragging and screen rotation.
  function focusOffsetFor(canvas){
    if(!mobile() || !canvas)return 0;
    const sceneRect=canvas.getBoundingClientRect();
    const sheetRect=sheet.getBoundingClientRect();
    // Use the *actual* animated/dragged edge, not the snap target. This keeps
    // the current gaze centered in the visible scene even without a selection.
    // Fade out the small correction for the collapsed 45px header.
    const collapsed=levels().closed;
    const visibleSheet=Math.max(0,sceneRect.bottom-sheetRect.top);
    const blend=clamp((visibleSheet-collapsed)/collapsed,0,1);
    return visibleCanvasFocusOffset(sceneRect,sheetRect.top)*blend;
  }
  return {open,close,expand,focusOffsetFor};
}
