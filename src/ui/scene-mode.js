const $=id=>document.getElementById(id);
/** The active scene is reflected in accessible control names, without a mode select. */
export function syncSceneMode(state,renderer,arActive=false){
  const center=renderer?.planetId?state.bodies.find(body=>body.id===renderer.planetId):null;
  const panel=$('view-mode-status'),button=$('reset-camera');
  panel.classList.toggle('planet-active',Boolean(center));
  panel.setAttribute('aria-label',center
    ? `Control-Panel · ${center.type==='dwarf'?'Zwergplanet':'Planet'} ${center.name}`
    : 'Control-Panel · Sonnensystem');
  // The action changes while motion look-around is active: recenter the
  // current phone posture instead of changing scenes or orbit presets.
  button.setAttribute('aria-label',arActive?'Kamera zurücksetzen: AR-Perspektive neu ausrichten'
    :center?'Zurück zur Sonnensystem-Übersicht':'Kamera zurücksetzen');
  button.title=arActive?'AR-Perspektive neu ausrichten'
    :center?'Zurück zum Sonnensystem':'Kamera zurücksetzen';
}
