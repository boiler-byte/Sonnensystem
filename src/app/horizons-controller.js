import {$,S,renderer,byId} from './state.js';
import {HORIZONS_IDS} from '../data/bodies.js';
import {fetchHorizons} from '../services/nasa-api.js';
import {dateISO} from '../ui/formatters.js';
import {updateDetail,updateStatus} from '../ui/catalog-controller.js';
import {updateTime} from './view-mode.js';
import {notify} from '../ui/status.js';

export async function alignHorizons(){
  const body=byId(S.selected),target=HORIZONS_IDS[body?.id];
  if(!target||body.id==='sun')return;
  const button=$('horizons-btn');button.disabled=true;button.innerHTML='<span>◌</span> Berechne Position ...';
  updateStatus('horizons','loading','Berechne ...');
  const date=dateISO(S.time);
  try{
    const data=await fetchHorizons(target,date);
    renderer.setOverride(body.id,date,[data.xKm,data.yKm,data.zKm]);
    S.playing=false;S.time=Date.parse(date+'T00:00:00Z');renderer.resetGalacticTrails();updateTime();
    renderer.calcPositions(S.time);renderer.focus(body.id);
    updateStatus('horizons','ok',`${date} · UTC`);
    $('horizons-note').textContent=`JPL-Vektor für ${date}, 00:00 UTC geladen. Position ist auf die schematische Szenenskala übertragen.`;
    notify(`JPL Horizons: ${body.name} abgeglichen`);
  }catch(e){updateStatus('horizons','offline','Nicht verfügbar');notify('JPL Horizons: '+e.message,true);}
  finally{updateDetail();}
}
