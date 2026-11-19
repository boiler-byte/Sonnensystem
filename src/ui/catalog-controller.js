import {S,renderer,byId,$} from '../app/state.js';
import {renderCatalog} from './object-list.js';
import {renderDetail} from './object-details.js';
import {changeStatus} from './status.js';
import {syncToggleState} from './control-state.js';

// The bootstrap registers the catalog's selection callback once at startup.
// The UI does not import camera internals, so rendering and navigation stay independent.
let selectBody=()=>{};
export function connectCatalogSelection(callback){
  if(typeof callback!=='function')throw TypeError('Ein Auswahl-Handler ist erforderlich');
  selectBody=callback;
}

export const updateCatalog=()=>{
  const planetId=renderer?.planetId||null;
  const toggle=$('catalog-planet-filter');
  toggle.hidden=!planetId;
  const pressed=Boolean(planetId && S.catalogPlanetOnly);
  syncToggleState(toggle,pressed);
  const name=planetId?byId(planetId)?.name||'aktuellen Planeten':'aktuellen Planeten';
  toggle.setAttribute('aria-label',`Nur ${name} und zugehörige Objekte anzeigen`);
  toggle.title=pressed?`Filter für ${name} ausschalten`:`Nur ${name} und zugehörige Objekte anzeigen`;
  renderCatalog(S,selectBody,{planetId});
};
export const updateDetail=()=>renderDetail(S,renderer,selectBody);
export const updateStatus=(provider,state,label)=>changeStatus(S.status,provider,state,label);
export const activeView = () => renderer?.planetId ? 'planet' : 'solar';
