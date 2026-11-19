import {$} from '../app/state.js';

export function setSpeedPopover(open) {
  $('speed-popover').hidden = !open;
  $('speed-btn').setAttribute('aria-expanded', String(open));
  if(open) $('speed').focus({preventScroll:true});
}
