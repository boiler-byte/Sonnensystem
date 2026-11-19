import { CAMERA_PERSPECTIVES, nextCameraPerspectiveIndex } from '../renderer/camera.js';

const $=id=>document.getElementById(id);
/** The icon depicts the CURRENT pose; accessible labels describe the NEXT action. */
export function syncSceneMode(state,renderer,arActive=false){
  const center=renderer?.planetId?state.bodies.find(body=>body.id===renderer.planetId):null;
  const panel=$('view-mode-status'),button=$('reset-camera');
  panel.classList.toggle('planet-active',Boolean(center));
  panel.setAttribute('aria-label',center
    ? `Control-Panel · ${center.type==='dwarf'?'Zwergplanet':'Planet'} ${center.name}`
    : 'Control-Panel · Sonnensystem');

  // Outside AR the planet view retains its legacy overview action; AR cycles
  // perspectives in place, including inside a planet view.
  const overview=Boolean(center&&!arActive);
  const nextIndex=overview?0:nextCameraPerspectiveIndex(renderer?.cameraPresetIndex,renderer?.cameraManuallyMoved);
  const next=CAMERA_PERSPECTIVES[nextIndex];
  // The front-facing camera represents the viewer's free position or the
  // overview/reset action. Presets show the direction we are ALREADY viewing,
  // not the perspective that will be chosen by the next click.
  const current=overview||renderer?.cameraManuallyMoved?'free'
    :CAMERA_PERSPECTIVES[renderer?.cameraPresetIndex]?.id||'free';
  for(const icon of button.querySelectorAll?.('svg[data-perspective]')||[]){
    // SVGElement.hidden is not reflected as a DOM attribute in every browser.
    // Toggle the actual attribute so the CSS display rule works reliably.
    if(icon.dataset.perspective===current)icon.removeAttribute('hidden');
    else icon.setAttribute('hidden','');
  }
  button.setAttribute('data-current-perspective',current);
  button.setAttribute('data-next-perspective',next.id);
  if(overview){
    button.setAttribute('aria-label','Zurück zur Sonnensystem-Übersicht');
    button.title='Zurück zum Sonnensystem';
  }else if(renderer?.camera){
    const label=`${arActive?'AR: ':''}Nächste Perspektive: ${next.name}`;
    button.setAttribute('aria-label',label);
    button.title=label;
  }else{
    // Bootstrap before the renderer exists, including older no-WebGL clients.
    button.setAttribute('aria-label','Kamera zurücksetzen');
    button.title='Kamera zurücksetzen';
  }
}
