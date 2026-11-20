import {$,S} from './state.js';
import {createARMode} from '../renderer/ar-mode.js';
import {syncSceneMode} from '../ui/scene-mode.js';
import {syncCinemaControl} from './animation-controls.js';
import {notifyToggle} from '../ui/status.js';

/** Wire device-orientation AR to the active renderer without UI/renderer globals. */
export function connectARMode(renderer) {
  return createARMode(renderer,$('ar-mode-btn'),{notify:notifyToggle,onStateChange:active=>{
    if(active && renderer?.cinema?.active)renderer.stopCinema();
    syncSceneMode(S,renderer,active);syncCinemaControl();
  },motionButton:$('ar-motion-btn')});
}
