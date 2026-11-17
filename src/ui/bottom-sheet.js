const $=id=>document.getElementById(id);
/** Shared catalog/detail tabs on desktop, moving the same panels into the mobile bottom sheet. */
export function initMobileSheets() {
  const mq = window.matchMedia('(max-width: 770px)');
  const sheet = $('mobile-sheet'), header = $('sheet-header'), content = $('sheet-content');
  const scrim = $('mobile-sheet-scrim');
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
  function levels(){
    // The sheet's height follows the visible snap level, so derive the maximum
    // from the viewport rather than the current sheet height.
    const full=window.innerHeight;
    const closed=header.getBoundingClientRect().height;
    return {closed,half:clamp(window.innerHeight*.56,Math.min(closed+105,full),full),full};
  }
  function snapTo(next){
    snap=next;
    sheet.dataset.snap=next;
    const visible=levels()[next];
    sheet.style.setProperty('--sheet-visible',`${visible}px`);
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
      for(const [name,el] of Object.entries(panels)){
        anchors[name].parentNode.insertBefore(el,anchors[name].nextSibling);
        el.classList.remove('sheet-active');
      }
      showPanel(panel);
      scrim.hidden=true;content.inert=false;
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
    }
    if(!isDragging)return;
    e.preventDefault();
    drag.delta=dy;
    const visible=clamp(drag.startVisible-dy,levels().closed,levels().full);
    sheet.style.setProperty('--sheet-visible',`${visible}px`);
  });
  function finishDrag(e){
    if(!drag||e.pointerId!==drag.id)return;
    const moved=isDragging, diff=drag.delta, prior=drag.startSnap;
    drag=null;isDragging=false;
    sheet.classList.remove('dragging');
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
    drag=null;isDragging=false;sheet.classList.remove('dragging');snapTo(snap);
  });
  mq.addEventListener('change',applyLayout);
  window.addEventListener('resize',()=>{if(mobile()&&!isDragging)snapTo(snap);});
  applyLayout();
  return {open,close,expand};
}
