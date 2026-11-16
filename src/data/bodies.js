/** Shared vocabulary and units. Catalog records live in /data/catalog/*.json. */
export const AU_KM = 149597870.7;
export const J2000 = Date.UTC(2000, 0, 1, 12);
export const TYPES = Object.freeze({
  star: { label: 'Stern', plural: 'Sterne', color: '#ffca72' },
  planet: { label: 'Planet', plural: 'Planeten', color: '#7db5ef' },
  moon: { label: 'Mond', plural: 'Monde', color: '#b8bacb' },
  dwarf: { label: 'Zwergplanet', plural: 'Zwergplaneten', color: '#d5a5e8' },
  asteroid: { label: 'Asteroid', plural: 'Asteroiden', color: '#d8ab78' },
  comet: { label: 'Komet', plural: 'Kometen', color: '#a8cdd1' },
  probe: { label: 'Raumsonde', plural: 'Raumsonden', color: '#d4ad7d' },
  satellite: { label: 'Satellit', plural: 'Satelliten', color: '#7bd3c2' }
});
export const PLANET_IDS = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
export const HORIZONS_IDS = { mercury:'199',venus:'299',earth:'399',mars:'499',jupiter:'599',saturn:'699',uranus:'799',neptune:'899',pluto:'999',moon:'301',sun:'10' };
export const FEATURED_IDS = ['sun',...PLANET_IDS,'moon','europa','titan','pluto','ceres','vesta'];
