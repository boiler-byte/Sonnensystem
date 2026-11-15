// Kuratierte Startdaten. Wo Live-APIs verfuegbar sind, werden sie ersetzt/ergaenzt.
export const AU_KM = 149597870.7;
export const J2000 = Date.UTC(2000, 0, 1, 12);
export const TYPES = {
  star: { label: 'Stern', plural: 'Sterne', color: '#ffca72' },
  planet: { label: 'Planet', plural: 'Planeten', color: '#7db5ef' },
  moon: { label: 'Mond', plural: 'Monde', color: '#b8bacb' },
  dwarf: { label: 'Zwergplanet', plural: 'Zwergplaneten', color: '#d5a5e8' },
  asteroid: { label: 'Asteroid', plural: 'Asteroiden', color: '#d8ab78' },
  satellite: { label: 'Satellit', plural: 'Satelliten', color: '#7bd3c2' }
};
function body(id, name, type, parentId, a, periodDays, radiusKm, color, extra = {}) {
  return { id, name, type, parentId, a: a || 0, periodDays: periodDays || 0, radiusKm: radiusKm || 0, color,
    epoch: J2000, e: 0, i: 0, node: 0, peri: 0, M: 0, source: 'Startdatensatz', ...extra };
}
export const INITIAL_BODIES = [
  body('sun','Sonne','star',null,0,0,696340,'#ffca71',{temperatureK:5772, description:'Der Stern im Zentrum unseres Sonnensystems. Seine Schwerkraft bindet Planeten, Monde und Kleinkörper.',style:'sun'}),
  body('mercury','Merkur','planet','sun',.387098,87.969,2439.7,'#b7aba0',{e:.20563,i:7.005,node:48.33,peri:29.12,M:174.80,style:'rock',description:'Der kleinste Planet kreist in nur 88 Tagen um die Sonne.'}),
  body('venus','Venus','planet','sun',.723332,224.701,6051.8,'#e8c78f',{e:.00677,i:3.395,node:76.68,peri:54.88,M:50.12,style:'venus',description:'Eine dichte Atmosphäre und extreme Temperaturen prägen die Venus.'}),
  body('earth','Erde','planet','sun',1,365.256,6371,'#4e95db',{e:.01671,i:0,node:0,peri:102.94,M:357.52,style:'earth',temperatureK:288,description:'Unsere Heimatwelt – der einzige bekannte Planet mit flüssigen Ozeanen und Leben.'}),
  body('mars','Mars','planet','sun',1.523679,686.98,3389.5,'#d66c4d',{e:.0934,i:1.85,node:49.56,peri:286.5,M:19.37,style:'mars',description:'Der Rote Planet besitzt eisige Polkappen, gewaltige Vulkane und zwei kleine Monde.'}),
  body('jupiter','Jupiter','planet','sun',5.2044,4332.59,69911,'#d6a27c',{e:.0489,i:1.304,node:100.46,peri:273.87,M:20.02,style:'jupiter',description:'Der größte Planet ist ein Gasriese mit auffälligen Wolkenbändern und vielen Monden.'}),
  body('saturn','Saturn','planet','sun',9.5826,10759.2,58232,'#e7c991',{e:.0565,i:2.485,node:113.67,peri:339.39,M:317.02,style:'saturn',description:'Der Gasriese ist für sein ausgedehntes Ringsystem aus Eis und Gestein bekannt.'}),
  body('uranus','Uranus','planet','sun',19.2184,30688.5,25362,'#99d8dd',{e:.0463,i:.773,node:74.01,peri:96.99,M:142.24,style:'uranus',description:'Ein Eisriese mit ungewöhnlich stark geneigter Rotationsachse.'}),
  body('neptune','Neptun','planet','sun',30.11,60182,24622,'#4c74d8',{e:.009,i:1.77,node:131.78,peri:273.19,M:256.23,style:'neptune',description:'Der äußerste der acht Planeten – kalt, windig und tiefblau.'}),
  body('ceres','Ceres','dwarf','sun',2.768,1681.63,473,'#bebbb5',{e:.0758,i:10.59,node:80.3,peri:73.6,M:77,style:'rock',description:'Ceres ist der größte Himmelskörper des Asteroidengürtels.'}),
  body('pluto','Pluto','dwarf','sun',39.482,90560,1188.3,'#cbb5a5',{e:.2488,i:17.16,node:110.30,peri:113.83,M:14.53,style:'pluto',description:'Ein eisiger Zwergplanet im Kuipergürtel mit dem großen Mond Charon.'}),
  body('eris','Eris','dwarf','sun',67.8,203600,1163,'#d0d7dc',{e:.44,i:44.0,node:35.9,peri:151.4,M:210,style:'ice',description:'Ein weit entfernter Zwergplanet jenseits der Neptunbahn.'}),
  body('haumea','Haumea','dwarf','sun',43.2,103774,816,'#bdc8cf',{e:.19,i:28.2,node:122.1,peri:239.3,M:90,style:'ice',description:'Schnell rotierender, stark länglicher Zwergplanet im Kuipergürtel.'}),
  body('makemake','Makemake','dwarf','sun',45.7,112900,715,'#c79a80',{e:.16,i:29,node:79.6,peri:296.2,M:150,style:'rock',description:'Ein heller Zwergplanet der äußeren Sonnensystemregion.'}),
  body('moon','Mond','moon','earth',384400,27.32166,1737.4,'#bcbab5',{e:.0549,i:5.145,node:125.1,peri:318.15,M:115.4,style:'moon',description:'Der einzige natürliche Satellit der Erde; seine Schwerkraft beeinflusst die Gezeiten.'}),
  body('phobos','Phobos','moon','mars',9376,.319,11.3,'#958a80',{e:.015,i:1.1,M:145,style:'rock',description:'Der größere und innere Mond des Mars.'}),
  body('deimos','Deimos','moon','mars',23463,1.263,6.2,'#aca193',{e:.0003,i:.9,M:265,style:'rock',description:'Der kleine äußere Mond des Mars.'}),
  body('io','Io','moon','jupiter',421700,1.769,1821.6,'#efd18b',{e:.0041,i:.04,M:90,style:'io',description:'Der vulkanisch aktivste Mond des Sonnensystems.'}),
  body('europa','Europa','moon','jupiter',671100,3.551,1560.8,'#dacbbb',{e:.009,i:.47,M:155,style:'ice',description:'Unter ihrer Eiskruste wird ein globaler Ozean vermutet.'}),
  body('ganymede','Ganymed','moon','jupiter',1070400,7.155,2634.1,'#b7a18f',{e:.0013,i:.18,M:242,style:'rock',description:'Der größte Mond des Sonnensystems ist sogar größer als Merkur.'}),
  body('callisto','Kallisto','moon','jupiter',1882700,16.689,2410.3,'#827b79',{e:.0074,i:.19,M:28,style:'moon',description:'Ein stark verkrateter äußerer Galileischer Mond Jupiters.'}),
  body('mimas','Mimas','moon','saturn',185540,.942,198.2,'#c6c6bf',{e:.0196,i:1.57,M:45,style:'moon',description:'Eismond mit einem charakteristischen großen Einschlagskrater.'}),
  body('enceladus','Enceladus','moon','saturn',237950,1.37,252.1,'#e3edf2',{e:.0047,i:.01,M:85,style:'ice',description:'Ein eisiger Saturnmond mit Wasserfontänen nahe dem Südpol.'}),
  body('rhea','Rhea','moon','saturn',527040,4.518,763.8,'#c6bfb5',{e:.001,i:.35,M:310,style:'ice',description:'Zweitgrößter Mond des Saturn.'}),
  body('titan','Titan','moon','saturn',1221870,15.945,2574.7,'#ddb477',{e:.0288,i:.35,M:20,style:'venus',description:'Ein großer Mond mit dichter Atmosphäre und Seen aus flüssigen Kohlenwasserstoffen.'}),
  body('iapetus','Iapetus','moon','saturn',3561300,79.321,734.5,'#a89c8f',{e:.0286,i:15.47,M:210,style:'moon',description:'Saturnmond mit auffälligem Hell-Dunkel-Kontrast.'}),
  body('titania','Titania','moon','uranus',436300,8.706,788.9,'#bdc1c4',{e:.0011,i:.08,M:135,style:'ice',description:'Größter Mond des Uranus.'}),
  body('oberon','Oberon','moon','uranus',583500,13.463,761.4,'#b5b1a6',{e:.0014,i:.07,M:60,style:'rock',description:'Ein großer, stark verkraterter Uranusmond.'}),
  body('triton','Triton','moon','neptune',354760,5.877,1353.4,'#c8b5b4',{e:0,i:157,M:20,style:'ice',description:'Der große Neptunmond bewegt sich auf einer rückläufigen Umlaufbahn.'}),
  body('charon','Charon','moon','pluto',19596,6.387,606,'#a7a5a8',{e:0,i:0,M:55,style:'moon',description:'Plutos größter Mond; beide bilden nahezu ein Doppelsystem.'}),
  body('vesta','Vesta','asteroid','sun',2.361,1325.3,262.7,'#b39b87',{e:.0887,i:7.14,node:103.85,peri:151.2,M:50,style:'rock',description:'Einer der größten Asteroiden des Hauptgürtels.'}),
  body('pallas','Pallas','asteroid','sun',2.773,1686.1,256,'#aaa49c',{e:.231,i:34.8,node:173.1,peri:310,M:70,style:'rock',description:'Ein großer Asteroid auf stark geneigter Umlaufbahn.'}),
  body('eros','Eros','asteroid','sun',1.458,643.2,8.4,'#c69d7a',{e:.222,i:10.83,node:304.3,peri:178.7,M:300,style:'rock',description:'Der erdnahe Asteroid wurde von der Raumsonde NEAR Shoemaker untersucht.'}),
  body('bennu','Bennu','asteroid','sun',1.126,436.6,.245,'#8f8a80',{e:.2037,i:6.03,node:2.06,peri:66.2,M:101,style:'rock',description:'Der erdnahe Asteroid wurde von OSIRIS-REx beprobt.'}),
  body('apophis','Apophis','asteroid','sun',.922,323.6,.17,'#b89f91',{e:.191,i:3.34,node:203,peri:127,M:42,style:'rock',description:'Ein erdnaher Asteroid, dessen nahe Erdpassagen intensiv untersucht werden.'}),
  body('sat-25544','ISS','satellite','earth',6795,.0646,0,'#79d6c8',{e:.0007,i:51.6,node:180,peri:15,M:85,style:'rock',catalog:25544,description:'Internationale Raumstation. Ohne CelesTrak-Anbindung nur illustrative Umlaufbahn; keine aktuelle Ortung.'}),
  body('sat-20580','Hubble Space Telescope','satellite','earth',6910,.0661,0,'#83d3c3',{e:.0003,i:28.5,node:110,peri:41,M:210,style:'rock',catalog:20580,description:'Weltraumteleskop in einer niedrigen Erdumlaufbahn. Ohne Live-Daten wird nur eine illustrative Bahn gezeigt.'})
];
export const PLANET_IDS = ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'];
export const HORIZONS_IDS = { mercury:'199',venus:'299',earth:'399',mars:'499',jupiter:'599',saturn:'699',uranus:'799',neptune:'899',pluto:'999',moon:'301',sun:'10' };
export const FEATURED_IDS = ['sun',...PLANET_IDS,'moon','europa','titan','pluto','ceres','vesta'];
