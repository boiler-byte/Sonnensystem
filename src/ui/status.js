import { esc } from './formatters.js';
const $=id=>document.getElementById(id);
const statusLabels = { catalog:'Lokaler Katalog',solar:'Solar OpenData',sbdb:'NASA / SBDB',celestrak:'CelesTrak',horizons:'JPL Horizons' };
function showTimedNotice(element,message,duration,previousTimer){
  element.textContent=message;
  element.classList.add('show');
  clearTimeout(previousTimer);
  return setTimeout(()=>element.classList.remove('show'),duration);
}
let noticeTimer=0;
export function notify(message,isError=false){
  const element=$('toast');
  element.classList.toggle('error',isError);
  noticeTimer=showTimedNotice(element,message,4600,noticeTimer);
}
// The independent toggle snackbar keeps its shorter dismissal interval.
let toggleNoticeTimer=0;
export function notifyToggle(message){
  toggleNoticeTimer=showTimedNotice($('toggle-toast'),message,2400,toggleNoticeTimer);
}
export function changeStatus(status,provider,state,label){status[provider]=[state,label];renderStatus(status);}
export function renderStatus(status){const host=$('source-status');host.innerHTML=Object.entries(statusLabels).map(([id,label])=>{
  const [state,text]=status[id]||['idle','—'];return `<div class="source-row"><span class="source-name"><i class="source-dot ${esc(state)}"></i>${esc(label)}</span><span class="source-value">${esc(text)}</span></div>`;
 }).join('');}
