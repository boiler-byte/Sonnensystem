/** Small inline SVG pictograms for the data cards (no external icon font). */
const shapes=Object.freeze({
  radius:'<circle cx="12" cy="12" r="8"/><path d="M12 12 18 6"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  diameter:'<circle cx="12" cy="12" r="8"/><path d="M4 12h16m-12-3-3 3 3 3m8-6 3 3-3 3"/>',
  orbit:'<ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-23 12 12)"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="20.2" cy="8.1" r="1.5" fill="currentColor" stroke="none"/>',
  period:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4.5 2.5"/>',
  eccentricity:'<ellipse cx="12" cy="12" rx="10" ry="5.5"/><path d="M5 12h14" stroke-dasharray="1.8 2.2"/><circle cx="8" cy="12" r="2" fill="currentColor" stroke="none"/>',
  type:'<path d="m12 2.5 2.4 6.7 7.1 2.8-7.1 2.5-2.4 7-2.4-7-7.1-2.5 7.1-2.8Z"/>',
  photosphere:'<circle cx="12" cy="12" r="4"/><path d="M12 1.5v3m0 15v3M1.5 12h3m15 0h3M4.6 4.6l2.2 2.2m10.4 10.4 2.2 2.2M19.4 4.6l-2.2 2.2M6.8 17.2l-2.2 2.2"/>',
  distance:'<circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="2.5"/><path d="M8.5 12h7m-5-2.5L8 12l2.5 2.5m3-5L16 12l-2.5 2.5"/>',
  pressure:'<path d="M4 17a9 9 0 1 1 16 0"/><path d="M12 13l4.4-5.2"/><circle cx="12" cy="13" r="2"/><path d="M5.5 20h13"/>',
  gravity:'<circle cx="12" cy="12" r="9"/><path d="M12 4v13m-4-4 4 4 4-4"/>',
  launch:'<path d="m6 15 3-6 6-5 5 0-1 5-5 6-6 3zM9 9l6 6"/><circle cx="14.5" cy="9.5" r="1.3"/><path d="M5 19 2.5 21.5M7 21l-1 1"/>',
  status:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3.5 3.5L17.5 8"/>'
});

export function physicalStatIcon(name){
  const shape=shapes[name]||shapes.type;
  return `<svg class="stat-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
}

/** Mercury levels: minimum 15%, mean 50%, maximum 85%. */
const thermometerLevels=Object.freeze({min:{top:14.5,height:1.5},mean:{top:10,height:6},max:{top:5.5,height:10.5}});
export function thermometerIcon(level){
  const {top,height}=thermometerLevels[level]||thermometerLevels.mean;
  return `<svg class="thermometer-icon thermometer-icon--${level in thermometerLevels?level:'mean'}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 14.1V5a3 3 0 0 0-6 0v9.1a5 5 0 1 0 6 0Z" fill="none" stroke="var(--thermometer-outline, currentColor)" stroke-width="1.7" stroke-linejoin="round"/><rect x="11" y="${top}" width="2" height="${height}" rx="1" fill="currentColor"/><circle cx="12" cy="18" r="3.2" fill="currentColor"/></svg>`;
}
