/** Shared vocabulary and units. Catalog records live in /data/catalog/*.json. */
export const AU_KM = 149597870.7;
export const J2000 = Date.UTC(2000, 0, 1, 12);
/** Category coding in the atlas. Surface materials keep their own physical colours. */
export const CATEGORY_COLORS = Object.freeze({
  planet: '#E6EDF5',
  moon: '#E6EDF5',
  dwarf: '#B68CFF',
  tno: '#7BB6CF',
  asteroid: '#E9B44C',
  comet: '#FF7597',
  satellite: '#A7D86D',
  probe: '#FF8B4A',
  star: '#FFE5A0'
});
/** Earth is the only planet with a different orbit accent. */
export const EARTH_ORBIT_COLOR = '#4DA3FF';
export const TYPES = Object.freeze({
  star: { label: 'Stern', plural: 'Sterne', color: CATEGORY_COLORS.star },
  planet: { label: 'Planet', plural: 'Planeten', color: CATEGORY_COLORS.planet },
  moon: { label: 'Mond', plural: 'Monde', color: CATEGORY_COLORS.moon },
  dwarf: { label: 'Zwergplanet', plural: 'Zwergplaneten', color: CATEGORY_COLORS.dwarf },
  tno: { label: 'Transneptunisches Objekt', plural: 'Transneptunische Objekte', color: CATEGORY_COLORS.tno },
  asteroid: { label: 'Asteroid', plural: 'Asteroiden', color: CATEGORY_COLORS.asteroid },
  comet: { label: 'Komet', plural: 'Kometen', color: CATEGORY_COLORS.comet },
  probe: { label: 'Raumsonde', plural: 'Raumsonden', color: CATEGORY_COLORS.probe },
  satellite: { label: 'Satellit', plural: 'Satelliten', color: CATEGORY_COLORS.satellite }
});
export const PLANET_IDS = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
export const HORIZONS_IDS = { mercury:'199',venus:'299',earth:'399',mars:'499',jupiter:'599',saturn:'699',uranus:'799',neptune:'899',pluto:'999',moon:'301',sun:'10' };
export const FEATURED_IDS = ['sun',...PLANET_IDS,'moon','europa','titan','pluto','ceres','vesta'];
