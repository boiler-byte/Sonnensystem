const $=id=>document.getElementById(id);
export function syncSceneMode(state,renderer){const byId=id=>state.bodies.find(x=>x.id===id);
  const planet=renderer?.planetId?byId(renderer.planetId):null;
  $('view-mode-label').textContent=planet?`PLANETENSYSTEM · ${planet.name.toUpperCase()}`:'HELIOZENTRISCHE ANSICHT';
  $('view-mode-select').value=planet?`planet:${planet.id}`:'solar';
  $('view-mode-status').classList.toggle('planet-active',Boolean(planet));
  $('reset-camera').setAttribute('aria-label',planet?'Zurück zur Sonnensystem-Übersicht':'Kamera zurücksetzen');
  $('reset-camera').title=planet?'Zurück zum Sonnensystem':'Kamera zurücksetzen';
}
