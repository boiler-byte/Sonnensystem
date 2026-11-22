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
  const detailHero = $('detail-hero');
  const catalogSearchRow = $('catalog-search-row'), listHeader = $('list-header');
  const scrim = $('mobile-sheet-scrim');
  const cameraActions = $('reset-camera').parentElement;
  const cinemaTimeline = $('cinema-timeline');
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
    // Cinema sits flush against the same animated sheet edge as the camera controls.
    cinemaTimeline?.style.setProperty('--sheet-visible',height);
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
    for(const [popover,button] of [['layer-popover','layer-btn']]){
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
  // Die freien Flächen der Katalogzeilen funktionieren wie die Kopfleiste.
  // Eingabefeld, Planetenfilter und Sortiertaste behalten ihre eigene Klickaktion.
  for(const handle of [catalogSearchRow,listHeader].filter(Boolean)){
    handle.addEventListener('click',event=>{
      if(!mobile()||performance.now()<suppressClickUntil)return;
      if(event.target.closest?.('.search, input, button, select, textarea, a, label, [contenteditable], [role="button"]'))return;
      toggleSnap();
    });
  }
  scrim.addEventListener('click',close);

  // Kopfleiste, Detailschaubild und beide Katalogzeilen verwenden dieselbe Snap-Geste
  // und dieselben animierten Abstände der Szene. Capture erst nach 7px:
  // Sucheingabe und Buttons bleiben bei kurzen Tipps normal bedienbar.
  function startDrag(id,y,captureTarget=null){
    if(!mobile()||drag)return false;
    drag={id,startY:y,startVisible:levels()[snap],startSnap:snap,delta:0,captureTarget};
    return true;
  }
  function moveDrag(id,y,preventDefault){
    if(!drag||drag.id!==id)return false;
    const dy=y-drag.startY;
    if(!isDragging&&Math.abs(dy)>7){
      isDragging=true;
      drag.captureTarget?.setPointerCapture(id);
      sheet.classList.add('dragging');
      cameraActions.classList.add('sheet-dragging');
      cinemaTimeline?.classList.add('sheet-dragging');
    }
    if(!isDragging)return false;
    preventDefault?.();
    drag.delta=dy;
    setVisibleHeight(clamp(drag.startVisible-dy,levels().closed,levels().full));
    return true;
  }
  function clearDrag(){
    drag=null;isDragging=false;
    sheet.classList.remove('dragging');
    cameraActions.classList.remove('sheet-dragging');
    cinemaTimeline?.classList.remove('sheet-dragging');
  }
  function finishDrag(id){
    if(!drag||drag.id!==id)return;
    const {delta,startSnap,captureTarget}=drag,moved=isDragging;
    if(captureTarget?.hasPointerCapture(id))captureTarget.releasePointerCapture(id);
    clearDrag();
    if(!moved)return;
    const order=['closed','half','full'];
    let choice=startSnap;
    if(Math.abs(delta)>35)choice=order[clamp(order.indexOf(startSnap)+(delta<0?1:-1),0,2)];
    else{
      const current=parseFloat(sheet.style.getPropertyValue('--sheet-visible'));
      choice=order.reduce((best,key)=>Math.abs(levels()[key]-current)<Math.abs(levels()[best]-current)?key:best,order[0]);
    }
    snapTo(choice);
    suppressClickUntil=performance.now()+240;
  }
  function cancelDrag(id){
    if(!drag||drag.id!==id)return;
    clearDrag();snapTo(snap);
  }
  for(const handle of [header,detailHero,catalogSearchRow,listHeader].filter(Boolean)){
    handle.addEventListener('pointerdown',e=>{
      if(!mobile()||e.button!==0 || !e.isPrimary && e.isPrimary!==undefined)return;
      startDrag(e.pointerId,e.clientY,handle);
    });
    handle.addEventListener('pointermove',e=>{
      if(drag?.captureTarget!==handle)return;
      moveDrag(e.pointerId,e.clientY,()=>e.preventDefault());
    });
    handle.addEventListener('pointerup',e=>finishDrag(e.pointerId));
    handle.addEventListener('pointercancel',e=>cancelDrag(e.pointerId));
    // Nach einem Swipe darf z. B. die Nächstes-Objekt-Taste nicht auslösen.
    handle.addEventListener('click',event=>{
      if(mobile()&&performance.now()<suppressClickUntil){
        event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
  }

  // Der Katalog und die Details dürfen normal scrollen. Erst wenn der Scrollbereich
  // oben steht und der Finger weiter nach unten wandert, übernimmt das Sheet die
  // Geste. touchmove (nicht pointermove) ist nötig, weil natives Scrollen sonst
  // bereits pointercancel auslösen kann. Mehrfinger-Gesten werden nicht übernommen.
  for(const scroller of [$('object-list'),$('detail-scroll')].filter(Boolean)){
    let touch=null;
    const touchById=(list,id)=>Array.from(list).find(item=>item.identifier===id);
    scroller.addEventListener('touchstart',e=>{
      touch=null;
      if(!mobile()||snap==='closed'||e.touches.length!==1)return;
      const finger=e.touches[0];
      touch={id:finger.identifier,lastY:finger.clientY,dragging:false};
    },{passive:true});
    scroller.addEventListener('touchmove',e=>{
      if(!touch||!mobile())return;
      if(e.touches.length!==1){cancelDrag(`touch-${touch.id}`);touch=null;return;}
      const finger=touchById(e.touches,touch.id);
      if(!finger)return;
      const step=finger.clientY-touch.lastY;
      const previousY=touch.lastY;
      touch.lastY=finger.clientY;
      if(!touch.dragging){
        if(step<=0||scroller.scrollTop>1||drag)return;
        // Übergabe am Scrollanfang ohne Sprung durch den zuvor gescrollten Weg.
        touch.dragging=startDrag(`touch-${touch.id}`,previousY);
      }
      if(touch.dragging){
        // Bei Touch-Swipes das native Scrollen nur während des Sheet-Drags sperren.
        // Auch unterhalb der 7px-Schwelle darf der Browser nicht erneut scrollen.
        if(e.cancelable)e.preventDefault();
        moveDrag(`touch-${touch.id}`,finger.clientY);
      }
    },{passive:false});
    const endTouch=e=>{
      if(!touch)return;
      const finger=touchById(e.changedTouches,touch.id);
      if(!finger)return;
      if(touch.dragging){
        if(e.type==='touchcancel')cancelDrag(`touch-${touch.id}`);
        else finishDrag(`touch-${touch.id}`);
      }
      touch=null;
    };
    scroller.addEventListener('touchend',endTouch);
    scroller.addEventListener('touchcancel',endTouch);
    scroller.addEventListener('click',event=>{
      if(mobile()&&performance.now()<suppressClickUntil){
        event.preventDefault();event.stopImmediatePropagation();
      }
    },true);
  }
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
  // Switch the active sidebar tab without expanding a collapsed mobile sheet.
  // Used when the scene clears its selection; both tab bars stay synchronized.
  return {open,close,expand,selectPanel:showPanel,focusOffsetFor};
}
