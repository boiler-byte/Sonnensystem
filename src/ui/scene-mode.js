const $=id=>document.getElementById(id);
/** The active scene is reflected in accessible control names, without a mode select. */
export function syncSceneMode(state,renderer){
  const center=renderer?.planetId?state.bodies.find(body=>body.id===renderer.planetId):null;
  const panel=$('view-mode-status'),button=$('reset-camera');
  panel.classList.toggle('planet-active',Boolean(center));
  panel.setAttribute('aria-label',center
    ? `Control-Panel · ${center.type==='dwarf'?'Zwergplanet':'Planet'} ${center.name}`
    : 'Control-Panel · Sonnensystem');
  // This is also the route back to the solar overview when a planet is open.
  button.setAttribute('aria-label',center?'Zurück zur Sonnensystem-Übersicht':'Kamera zurücksetzen');
  button.title=center?'Zurück zum Sonnensystem':'Kamera zurücksetzen';
}
