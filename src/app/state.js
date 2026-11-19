import {createViewSettings} from '../data/layers.js';
import {SPEED_MODES} from '../ui/timeline.js';

export const $ = id => document.getElementById(id);
export const viewSettings = {solar:createViewSettings('solar'),planet:createViewSettings('planet')};
export const S = {
  bodies:[], selected:'earth', search:'', catalogPlanetOnly:false,
  playing:true, speed:SPEED_MODES.solar.defaultSpeed, timelineMode:'solar', modeSpeeds:{solar:SPEED_MODES.solar.defaultSpeed,planet:SPEED_MODES.planet.defaultSpeed}, time:Date.now(),
  viewSettings, settings:viewSettings.solar,
  status:{ catalog:['loading','Lädt ...'],solar:['loading','Verbinde'],sbdb:['idle','Auf Abruf'],celestrak:['loading','Verbinde'],horizons:['idle','Auf Abruf'] }
};
export let renderer=null, mobileSheets=null, arMode=null;
export function setRenderer(value){renderer=value;}
export function setMobileSheets(value){mobileSheets=value;}
export function setARMode(value){arMode=value;}
export const byId=id=>S.bodies.find(x=>x.id===id);
