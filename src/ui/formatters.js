export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{let a=Number(v);return Number.isFinite(a)?a:null;};
export const formatInt=n=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:0}).format(n);
export const formatDecimal=(n,d=2)=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:d}).format(n);
export const formatDate=ms=>new Intl.DateTimeFormat('de-DE',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(ms));
export const dateISO=ms=>new Date(ms).toISOString().slice(0,10);
export const displayPeriod=days => !days?'—':days<1?`${formatDecimal(days*24,1)} Std.`:days>=730?`${formatDecimal(days/365.25,1)} Jahre`:`${formatDecimal(days,1)} Tage`;
export const displayA=b=>!b.a?'—':(b.type==='moon'||b.type==='satellite'||(b.type==='binary'&&b.parentId!=='sun'))?`${b.a<10?formatDecimal(b.a,3):formatInt(b.a)} km`:`${formatDecimal(b.a,3)} AE`;

// All catalog temperatures are Kelvin; the German detail view uses Celsius.
export const displayTemperatureK=kelvin=>typeof kelvin==='number'&&Number.isFinite(kelvin)
  ?`${formatDecimal(kelvin-273.15,1)} °C`:'—';
export const displayAtmosphericPressure=pascal=>{
  if(typeof pascal!=='number'||!Number.isFinite(pascal))return '—';
  // Microbar / trace atmospheres remain legible without rounding to zero.
  if(pascal===0)return '0 Pa';
  if(pascal<.00001){const [mantissa,exponent]=pascal.toExponential(2).split('e');return `${formatDecimal(Number(mantissa),2)} × 10^${Number(exponent)} Pa`; }
  return pascal>=100?`${formatDecimal(pascal/100000,5)} bar`:`${formatDecimal(pascal,5)} Pa`;
};
// Relative to standard Earth gravity; 1 G = 9.80665 m/s².
export const STANDARD_GRAVITY_MS2=9.80665;
export const displaySurfaceGravity=gravity=>{
  if(typeof gravity!=='number'||!Number.isFinite(gravity))return '—';
  const multiple=gravity/STANDARD_GRAVITY_MS2, magnitude=Math.abs(multiple);
  if(magnitude!==0 && magnitude<.00001)
    return `${new Intl.NumberFormat('de-DE',{notation:'scientific',maximumSignificantDigits:3}).format(multiple)} G`;
  const digits=magnitude>=.1?2:magnitude>=.01?3:magnitude>=.001?4:magnitude>=.0001?5:6;
  return `${formatDecimal(multiple,digits)} G`;
};
export const displayMeanParentDistance=body=>{
  if(!body?.parentId)return '—';
  const distance=body.meanDistanceToParent??body.a;
  if(typeof distance!=='number'||!Number.isFinite(distance)||distance<=0)return '—';
  const unit=body.meanDistanceUnit||(body.parentId==='sun'?'AU':'km');
  if(unit==='AU')return `${formatDecimal(distance,3)} AE`;
  if(unit==='km')return `${distance<10?formatDecimal(distance,3):formatInt(distance)} km`;
  return '—';
};
