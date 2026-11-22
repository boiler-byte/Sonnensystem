import { clamp } from './math.js';
import { lookAroundFixedEye } from './camera.js';

const KEYBOARD_PAN_PX_PER_SECOND = 390;
const LOOK_SENSITIVITY_X = .0051;
const LOOK_SENSITIVITY_Y = .005;

/** Keep the object-specific mouse/touch mapping for the entire selection,
 *  even when a wide chart view or manual camera pan suspends following. */
function selectedObjectControls(renderer) {
  return renderer.selectedId != null;
}

/** Looking around changes the camera heading, never its ground-plane target. */
function lookByPixels(renderer, dx, dy) {
  if(!dx && !dy)return;
  renderer.markCameraMoved();
  if(renderer.selectedId===null){
    lookAroundFixedEye(renderer.camera,dx,dy,LOOK_SENSITIVITY_X,LOOK_SENSITIVITY_Y);
  }else{
    // A selected object retains the established orbit-style look controls.
    renderer.camera.theta-=dx*LOOK_SENSITIVITY_X;
    renderer.camera.phi=clamp(renderer.camera.phi+dy*LOOK_SENSITIVITY_Y,.16,1.55);
  }
}

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
    renderer.clearPathHover?.();
    // A normal click can still select a magnified body. Clear on real drag,
    // touch/pinch or right-button look-around, not on the left-button press.
    if(e.pointerType==='touch' || e.button!==0)renderer.setRowPointer?.(null);
    if(e.target!==c || (e.pointerType==='mouse' && e.button!==0 && e.button!==2))return;
    renderer.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,button:e.button});
    c.setPointerCapture(e.pointerId);
    if(renderer.pointers.size===1){
      renderer.drag={id:e.pointerId,button:e.button,startX:e.clientX,startY:e.clientY,
        moved:false,controlsSwapped:selectedObjectControls(renderer)};
      renderer.gesture=null;
      renderer.gestureControlsSwapped=null;
    }else{
      // Two fingers swipe to look normally, or pan while tracking; pinch always zooms.
      // Latch the mode for the whole gesture, including when the selection
      // or follow target changes during a swipe.
      if(renderer.drag)renderer.drag.moved=true;
      renderer.gestureControlsSwapped=renderer.drag?.controlsSwapped ?? selectedObjectControls(renderer);
      renderer.gesture=twoPointerGesture(renderer.pointers);
      renderer.gestureOrigin=renderer.gesture;
      renderer.gestureSwipeCenter=renderer.gesture;
      renderer.gestureStartPoints=new Map([...renderer.pointers].map(([id,p])=>[id,{x:p.x,y:p.y}]));
      renderer.gestureSwipeActive=false;
    }
  });
  c.addEventListener('pointermove',e=>{
    if((e.pointerType==='mouse'||e.pointerType==='pen') && e.buttons===0 && !renderer.pointers.size){
      const rect=c.getBoundingClientRect();
      const x=e.clientX-rect.left,y=e.clientY-rect.top;
      renderer.setRowPointer?.({x,y});
      if(renderer.simulationPaused)renderer.hoverOrbitPath?.(x,y);
      else renderer.clearPathHover?.();
    }
    const point=renderer.pointers.get(e.pointerId);
    if(!point)return;
    if(renderer.rowPointer && Math.hypot(e.clientX-(renderer.drag?.startX??e.clientX),e.clientY-(renderer.drag?.startY??e.clientY))>3)
      renderer.setRowPointer?.(null);
    const dx=e.clientX-point.x,dy=e.clientY-point.y;
    point.x=e.clientX;point.y=e.clientY;
    if(renderer.pointers.size>=2){
      const next=twoPointerGesture(renderer.pointers),prev=renderer.gesture;
      if(prev && next){
        // Pinch distance (not vertical finger motion) controls zoom immediately.
        const dist=clamp(renderer.camera.dist*prev.distance/next.distance,(renderer.minCameraDistance?.() ?? 2.2),(renderer.maxCameraDistance?.() ?? 100));
        if(dist!==renderer.camera.dist)renderer.markCameraMoved();
        renderer.camera.dist=dist;
        renderer.camera.desiredDist=dist;
        // Distinguish a real two-finger swipe from a pinch. Pointermove events
        // arrive ONE finger at a time; comparing midpoint movement with pinch
        // delta per event misclassifies horizontal two-finger swipes as pinches.
        // Once both fingers travel together, apply the full midpoint movement.
        const [a,b]=[...renderer.pointers.entries()];
        const sa=renderer.gestureStartPoints?.get(a?.[0]);
        const sb=renderer.gestureStartPoints?.get(b?.[0]);
        if(sa && sb){
          const adx=a[1].x-sa.x,ady=a[1].y-sa.y;
          const bdx=b[1].x-sb.x,bdy=b[1].y-sb.y;
          const al=Math.hypot(adx,ady),bl=Math.hypot(bdx,bdy);
          const alignment=al*bl>0?(adx*bdx+ady*bdy)/(al*bl):0;
          if(al>2 && bl>2 && alignment>.7)renderer.gestureSwipeActive=true;
          if(al>2 && bl>2 && alignment<-.7)renderer.gestureSwipeActive=false;
        }
        if(renderer.gestureSwipeActive){
          const last=renderer.gestureSwipeCenter||renderer.gestureOrigin||prev;
          const swipeX=next.x-last.x,swipeY=next.y-last.y;
          if(renderer.gestureControlsSwapped)renderer.panByPixels(swipeX,swipeY);
          else lookByPixels(renderer,swipeX,swipeY);
          renderer.gestureSwipeCenter=next;
        }else if(renderer.gestureSwipeCenter && next.distance!==prev.distance){
          // Maintain the baseline during pinch-only gestures, avoiding a jump
          // when a later two-finger swipe begins.
          renderer.gestureSwipeCenter=next;
        }
      }
      renderer.gesture=next;
      return;
    }
    if(!renderer.drag || renderer.drag.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-renderer.drag.startX,e.clientY-renderer.drag.startY)>3)renderer.drag.moved=true;
    // With no selection, left mouse / one finger pans and right mouse looks.
    // With a selected body, these roles reverse regardless of tracking
    // or the Schaubild zoom; Shift+left mirrors the right mouse button.
    const rightDrag=renderer.drag.button===2 || (e.pointerType==='mouse' && e.shiftKey);
    if(rightDrag !== renderer.drag.controlsSwapped)lookByPixels(renderer,dx,dy);
    else renderer.panByPixels(dx,dy);
  });
  const finishPointer=(e,cancelled)=>{
    if(!renderer.pointers.has(e.pointerId))return;
    if(!cancelled && renderer.pointers.size===1 && renderer.drag?.id===e.pointerId &&
       !renderer.drag.moved && renderer.drag.button===0){
      const rect=c.getBoundingClientRect();
      renderer.pick(e.clientX-rect.left,e.clientY-rect.top);
    }
    const controlsSwapped=renderer.gestureControlsSwapped;
    renderer.pointers.delete(e.pointerId);
    renderer.gesture=twoPointerGesture(renderer.pointers);
    if(renderer.pointers.size<2){
      renderer.gestureOrigin=null;
      renderer.gestureStartPoints=null;
      renderer.gestureSwipeCenter=null;
      renderer.gestureSwipeActive=false;
      renderer.gestureControlsSwapped=null;
    }
    if(renderer.pointers.size===1){
      const [id,point]=renderer.pointers.entries().next().value;
      // A remaining finger may move again, but must never trigger a tap.
      renderer.drag={id,button:point.button,startX:point.x,startY:point.y,moved:true,
        controlsSwapped:controlsSwapped ?? renderer.drag?.controlsSwapped ?? selectedObjectControls(renderer)};
    }else if(renderer.pointers.size===0)renderer.drag=null;
  };
  c.addEventListener('pointerleave',()=>{renderer.setRowPointer?.(null);renderer.clearPathHover?.();});
  c.addEventListener('pointerup',e=>finishPointer(e,false));
  c.addEventListener('pointercancel',e=>finishPointer(e,true));
  c.addEventListener('wheel',e=>{
    renderer.clearPathHover?.();
    e.preventDefault();
    const distance=clamp(renderer.camera.desiredDist*Math.exp(e.deltaY*.001),(renderer.minCameraDistance?.() ?? 2.2),(renderer.maxCameraDistance?.() ?? 100));
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
