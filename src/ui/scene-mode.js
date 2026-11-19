import { CAMERA_PERSPECTIVES, nextCameraPerspectiveIndex } from '../renderer/camera.js';

const $=id=>document.getElementById(id);
/** The icon depicts the CURRENT pose; accessible labels describe the NEXT action. */
export function syncSceneMode(state,renderer,arActive=false){
  const center=renderer?.planetId?state.bodies.find(body=>body.id===renderer.planetId):null;
  const panel=$('view-mode-status'),button=$('reset-camera'),back=$('back-to-solar');
  back.hidden=!center;
  panel.classList.toggle('planet-active',Boolean(center));
  panel.setAttribute('aria-label',center
    ? `Control-Panel · ${center.type==='dwarf'?'Zwergplanet':'Planet'} ${center.name}`
    : 'Control-Panel · Sonnensystem');

  // This button only cycles perspectives; the separate back button is the
  // only way to leave an isolated planet scene using the viewport controls.
  const nextIndex=nextCameraPerspectiveIndex(renderer?.cameraPresetIndex,renderer?.cameraManuallyMoved);
  const next=CAMERA_PERSPECTIVES[nextIndex];
  const current=renderer?.cameraManuallyMoved?'free'
    :CAMERA_PERSPECTIVES[renderer?.cameraPresetIndex]?.id||'free';
  for(const icon of button.querySelectorAll?.('svg[data-perspective]')||[]){
    // SVGElement.hidden is not reflected as a DOM attribute in every browser.
    // Toggle the actual attribute so the CSS display rule works reliably.
    if(icon.dataset.perspective===current)icon.removeAttribute('hidden');
    else icon.setAttribute('hidden','');
  }
  button.setAttribute('data-current-perspective',current);
  button.setAttribute('data-next-perspective',next.id);
  if(renderer?.camera){
    const label=`${arActive?'AR: ':''}Nächste Perspektive: ${next.name}`;
    button.setAttribute('aria-label',label);
    button.title=label;
  }else{
    // Bootstrap before the renderer exists, including older no-WebGL clients.
    button.setAttribute('aria-label','Kamera zurücksetzen');
    button.title='Kamera zurücksetzen';
  }
}
