const $=id=>document.getElementById(id);
/** Mobile Google-Maps-style Bottom Sheet; die Desktop-Panels bleiben dieselben DOM-Elemente. */
export function initMobileSheets() {
  const mq = window.matchMedia('(max-width: 770px)');
  const sheet = $('mobile-sheet'), header = $('sheet-header'), content = $('sheet-content');
  const scrim = $('mobile-sheet-scrim'), handle = $('sheet-handle');
  const panels = {catalog:$('catalog'),detail:$('detail'),time:$('time-panel')};
  const anchors = Object.fromEntries(Object.entries(panels).map(([name,el])=>{
    const marker=document.createComment(`${name} desktop position`);
    el.parentNode.insertBefore(marker, el);
    return [name,marker];
  }));
  let panel='detail', snap='closed', isDragging=false, drag=null, suppressClickUntil=0;
  const mobile=()=>mq.matches;
  const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
  function levels(){
    const full=sheet.getBoundingClientRect().height;
    const closed=header.getBoundingClientRect().height;
    return {closed,half:clamp(window.innerHeight*.56,Math.min(closed+105,full),full),full};
  }
  function snapTo(next){
    snap=next;
    sheet.dataset.snap=next;
    sheet.style.setProperty('--sheet-visible',`${levels()[next]}px`);
    const expanded=next!=='closed';
    handle.setAttribute('aria-expanded',String(expanded));
    handle.setAttribute('aria-label',expanded?'Menü schließen oder weiter hochziehen':'Menü hochziehen');
    // Zum Schließen wieder auf die Bühne tippen: nur bei voller Ansicht abgedunkelt.
    scrim.hidden=!mobile()||next!=='full';
    content.inert=!expanded;
  }
  function showPanel(next){
    if(!panels[next])return;
    panel=next;
    for(const [name,el] of Object.entries(panels)){
      el.hidden=mobile()&&name!==next;
      el.classList.toggle('sheet-active',name===next&&mobile());
    }
    for(const btn of sheet.querySelectorAll('[data-sheet-panel]')){
      const selected=btn.dataset.sheetPanel===next;
      btn.classList.toggle('active',selected);
      btn.setAttribute('aria-pressed',String(selected));
    }
    content.scrollTop=0;
  }
  function open(next='detail'){
    if(!mobile())return;
    showPanel(next);
    if(snap==='closed')snapTo('half');
  }
  function close(){if(mobile())snapTo('closed');}
  function applyLayout(){
    if(mobile()){
      for(const el of Object.values(panels))content.append(el);
      showPanel(panel);
      snapTo(snap);
    }else{
      for(const [name,el] of Object.entries(panels)){
        anchors[name].parentNode.insertBefore(el,anchors[name].nextSibling);
        el.hidden=false;el.classList.remove('sheet-active');
      }
      scrim.hidden=true;content.inert=false;
      // Die Ansicht bleibt beim Wechsel zurück auf Desktop unberührt.
    }
  }
  for(const btn of sheet.querySelectorAll('[data-sheet-panel]')){
    btn.addEventListener('click',()=>{
      if(performance.now()<suppressClickUntil)return;
      open(btn.dataset.sheetPanel);
    });
  }
  handle.addEventListener('click',()=>{
    if(performance.now()<suppressClickUntil)return;
    snapTo(snap==='closed'?'half':snap==='half'?'full':'closed');
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
    sheet.style.setProperty('--sheet-visible',`${clamp(drag.startVisible-dy,levels().closed,levels().full)}px`);
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
  return {open,close};
}
