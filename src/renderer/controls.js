import { clamp } from './math.js';

const KEYBOARD_PAN_PX_PER_SECOND = 390;
function twoPointerGesture(pointers) {
  const [a, b] = [...pointers.values()];
  if (!a || !b) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    distance: Math.max(12, Math.hypot(b.x - a.x, b.y - a.y))
  };
}

export function attachCameraControls(renderer) {
  const c=renderer.canvas;
  c.addEventListener('contextmenu',e=>e.preventDefault());
  c.addEventListener('pointerdown',e=>{
    if(e.target!==c || (e.pointerType==='mouse' && e.button!==0 && e.button!==2))return;
    renderer.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});
    c.setPointerCapture(e.pointerId);
    if(renderer.pointers.size===1){
      renderer.drag={id:e.pointerId,button:e.button,startX:e.clientX,startY:e.clientY,moved:false};
      renderer.gesture=null;
    }else{
      // Second finger switches to pinch + ground-plane pan; never select a body.
      if(renderer.drag)renderer.drag.moved=true;
      renderer.gesture=twoPointerGesture(renderer.pointers);
    }
  });
  c.addEventListener('pointermove',e=>{
    const point=renderer.pointers.get(e.pointerId);
    if(!point)return;
    const dx=e.clientX-point.x,dy=e.clientY-point.y;
    point.x=e.clientX;point.y=e.clientY;
    if(renderer.pointers.size>=2){
      const next=twoPointerGesture(renderer.pointers),prev=renderer.gesture;
      if(prev && next){
        // Pinch distance (not vertical finger motion) controls zoom immediately.
        const dist=clamp(renderer.camera.dist*prev.distance/next.distance,2.2,100);
        if(dist!==renderer.camera.dist)renderer.markCameraMoved();
        renderer.camera.dist=dist;
        renderer.camera.desiredDist=dist;
        renderer.panByPixels(next.x-prev.x,next.y-prev.y);
      }
      renderer.gesture=next;
      return;
    }
    if(!renderer.drag || renderer.drag.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-renderer.drag.startX,e.clientY-renderer.drag.startY)>3)renderer.drag.moved=true;
    if(renderer.drag.button===2 || e.shiftKey)renderer.panByPixels(dx,dy);
    else{if(dx || dy)renderer.markCameraMoved();renderer.camera.theta-=dx*.0051;renderer.camera.phi=clamp(renderer.camera.phi+dy*.005,.16,1.55);}
  });
  const finishPointer=(e,cancelled)=>{
    if(!renderer.pointers.has(e.pointerId))return;
    if(!cancelled && renderer.pointers.size===1 && renderer.drag?.id===e.pointerId &&
       !renderer.drag.moved && renderer.drag.button===0){
      const rect=c.getBoundingClientRect();
      renderer.pick(e.clientX-rect.left,e.clientY-rect.top);
    }
    renderer.pointers.delete(e.pointerId);
    renderer.gesture=twoPointerGesture(renderer.pointers);
    if(renderer.pointers.size===1){
      const [id,point]=renderer.pointers.entries().next().value;
      // A remaining finger may rotate again, but must never trigger a tap.
      renderer.drag={id,button:point.button,startX:point.x,startY:point.y,moved:true};
    }else if(renderer.pointers.size===0)renderer.drag=null;
  };
  c.addEventListener('pointerup',e=>finishPointer(e,false));
  c.addEventListener('pointercancel',e=>finishPointer(e,true));
  c.addEventListener('wheel',e=>{
    e.preventDefault();
    const distance=clamp(renderer.camera.desiredDist*Math.exp(e.deltaY*.001),2.2,100);
    if(distance!==renderer.camera.desiredDist)renderer.markCameraMoved();
    renderer.camera.desiredDist=distance;
  },{passive:false});

  const arrows=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown']);
  document.addEventListener('keydown',e=>{
    if(!arrows.has(e.key) || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey)return;
    if(e.target?.closest?.('input,textarea,select,button,a,[contenteditable],[role="slider"],[role="listbox"]'))return;
    if(document.getElementById('help-modal')?.hidden===false)return;
    e.preventDefault();
    renderer.heldArrows.add(e.key);
  });
  document.addEventListener('keyup',e=>{if(arrows.has(e.key))renderer.heldArrows.delete(e.key);});
  window.addEventListener('blur',()=>renderer.heldArrows.clear());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)renderer.heldArrows.clear();});
 }

export function moveCameraWithKeyboard(renderer, now=performance.now()) {
  const dt=renderer.lastKeyboardFrameMs===null?0:Math.min(.05,Math.max(0,(now-renderer.lastKeyboardFrameMs)/1000));
  renderer.lastKeyboardFrameMs=now;
  if(!dt || !renderer.heldArrows.size)return;
  // Arrow keys move across the XZ orbital plane in the indicated map direction.
  const dx=Number(renderer.heldArrows.has('ArrowLeft'))-Number(renderer.heldArrows.has('ArrowRight'));
  const dy=Number(renderer.heldArrows.has('ArrowUp'))-Number(renderer.heldArrows.has('ArrowDown'));
  const length=Math.hypot(dx,dy);
  if(length)renderer.panByPixels(dx/length*KEYBOARD_PAN_PX_PER_SECOND*dt,
                              dy/length*KEYBOARD_PAN_PX_PER_SECOND*dt);
 }
