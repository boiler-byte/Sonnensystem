export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{let a=Number(v);return Number.isFinite(a)?a:null;};
export const formatInt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(n);
export const formatDecimal=(n,d=2)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:d}).format(n);
export const formatDate=ms=>new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(ms));
export const dateISO=ms=>new Date(ms).toISOString().slice(0,10);
export const displayPeriod=days => !days?'—':days<1?`${formatDecimal(days*24,1)} Std.`:days>=730?`${formatDecimal(days/365.25,1)} Jahre`:`${formatDecimal(days,1)} Tage`;
export const displayA=b=>!b.a?'—':(b.type==='moon'||b.type==='satellite'||(b.type==='binary'&&b.parentId!=='sun'))?`${b.a<10?formatDecimal(b.a,3):formatInt(b.a)} km`:`${formatDecimal(b.a,3)} AE`;
