import { esc } from './formatters.js';
const $=id=>document.getElementById(id);
const statusLabels = { catalog:'Lokaler Katalog',solar:'Solar OpenData',sbdb:'NASA / SBDB',celestrak:'CelesTrak',horizons:'JPL Horizons' };
let noticeTimer=0;
export function notify(message,isError=false){const t=$('toast');t.textContent=message;t.classList.toggle('error',isError);t.classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>t.classList.remove('show'),4600);}
// Separate bottom-right snackbar for scale and display toggles. Fast successive
// clicks replace the last message and restart its dismissal timer.
let toggleNoticeTimer=0;
export function notifyToggle(message){
  const t=$('toggle-toast');
  t.textContent=message;
  t.classList.add('show');
  clearTimeout(toggleNoticeTimer);
  toggleNoticeTimer=setTimeout(()=>t.classList.remove('show'),2400);
}
export function changeStatus(status,provider,state,label){status[provider]=[state,label];renderStatus(status);}
export function renderStatus(status){const host=$('source-status');host.innerHTML=Object.entries(statusLabels).map(([id,label])=>{
  const [state,text]=status[id]||['idle','—'];return `<div class="source-row"><span class="source-name"><i class="source-dot ${esc(state)}"></i>${esc(label)}</span><span class="source-value">${esc(text)}</span></div>`;
 }).join('');}
