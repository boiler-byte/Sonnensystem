# Delta v52 – Layer-Dropdown und Objektkatalog

## Installation

`Sonnensystem-Delta-v52.zip` über eine **vollständige v51-Installation** direkt im Projektstamm entpacken; vorhandene Dateien überschreiben. Es handelt sich um ein **Delta**, nicht um ein vollständiges Projektarchiv. Danach ggf. eine installierte PWA neu öffnen, damit der Service Worker den neuen Katalog offline übernimmt. App-Version **52.0.0**, Offline-Cache `sonnensystem-shell-v52`, Katalogversion **9.0.0**.

## Änderungen

### Objektkategorien im Layer-Dropdown

**Sterne** steht an erster Stelle. Reihenfolge: Sterne → Planeten → Monde → Zwergplaneten → Transneptunische Objekte → Asteroiden → Satelliten → Kometen → Raumsonden. Die neue Kategorie **Transneptunische Objekte** hat eine eigene Layer-Farbe und kann wie die anderen Kategorien aktiviert werden. Die Popover-Breite bleibt 145 px; die lange Bezeichnung wird bei Bedarf umgebrochen. Der Preset **Standard** bleibt auf Sterne und Planeten beschränkt; **Alle** aktiviert sämtliche Kategorien.

### Neue Katalogobjekte

| Kategorie | Neue Objekte | Anzahl |
| --- | --- | ---: |
| Asteroiden | (16) Psyche, (10) Hygiea, (162173) Ryugu, (25143) Itokawa, (243) Ida | 5 |
| Kometen | 67P/Tschurjumow-Gerassimenko, 9P/Tempel 1, 103P/Hartley 2, 81P/Wild 2 | 4 |
| Transneptunische Objekte | Quaoar, Orcus, Gonggong, Sedna, Arrokoth | 5 |

**Gesamtbestand:** 174 Körper, 174 redaktionelle Einträge. Für alle Neuzugänge sind Namen, Typ, übergeordnetes Objekt (Sonne), physikalischer Radius, Bahnparameter/Epoche, Darstellung/Farbe, Beschreibung und Quellenlinks hinterlegt. Internationale Namen und historische Bezeichnungen sind als optionale `aliases` suchbar. Die neuartigen TNO-Körper und ihre Sonnenbahnen folgen denselben Rendering- und Filterregeln wie die bisherigen solaren Kleinkörper. Auch in der Objektsuche und den Details sind sie auswählbar.

### Datenherkunft und Grenzen

- **Asteroiden und Quaoar, Orcus, Gonggong, Sedna:** katalogisierte oskulierende Bahnelemente aus dem öffentlichen Stellarium-Kleinkörperdatensatz (astronomische Quelle JPL/MPC), einschließlich der dort angegebenen Epochen.
- **Kometen:** veröffentlichte Element- und Periheldaten aus astronomischen Kleinobjektquellen, für den Katalog in Kepler-Elemente mit einer angenäherten Phase umgerechnet.
- **Arrokoth:** gerundete historische Elemente mit grob geschätzter Bahnphase; Darstellung als vereinfachte Kugel, nicht als physikalisches Kontakt-Doppelkörper-3D-Modell.
- Radien sind überwiegend gerundete Literaturwerte. **Alle 14 Sonnenbahnen sind zweikörperbasierte Simulationen**, keine aktuellen präzisen Ephemeriden; Planeteneinflüsse und nichtgravitative Kometeneffekte werden nicht fortgerechnet. Bahnmodelle und Quellen sind in den Detaildaten kenntlich gemacht.

Weiterführende Ursprünge: [Stellarium-Kleinkörperdaten](https://github.com/Stellarium/stellarium/blob/master/data/ssystem_minor.ini), [NASA/JPL Small-Body-Orbits](https://ssd.jpl.nasa.gov/sb/orbits.html). Zusätzliche Herkunftslinks stehen in den jeweiligen `provenance`-Feldern und Artikeln.

### Technische Dateien

- `data/catalog/manifest.json` + drei neue Katalogdateien + `data/editorial/de-objects-v52.json`: Katalog auf v9.0.0 erweitert und getrennt validiert.
- `src/data/{bodies,catalog,layers,orbital-math}.js`: neuer Typ `tno`, Quell-/Alias-Validierung, Category-Layer und schematische Größen.
- `src/ui/{object-list,object-details}.js`: TNO-Suche, Aliase und Modellhinweise.
- `src/renderer/{solar-view,labels}.js`: solare TNO-Bahnen und Objektbeschriftungen.
- `index.html`, `css/styles.css`: Sterne zuerst, TNO-Checkbox mit textlichem Umbruch und App-Version.
- `sw.js`, `package.json`: Version 52 und Manifest-gesteuerter Offline-Katalog.
- Dokumentation und Tests für den neuen Stand.

## Qualitätssicherung

`npm run check` validiert Schema, Quellen-URLs, eindeutige IDs und Elternbeziehungen und führt automatisierte Regressionstests für bestehende und neue Funktionen aus. Zusätzlich zum bestehenden Testumfang deckt `tests/category-delta-v52.test.mjs` die Reihenfolge der Checkboxen, Katalogzählung, alle 14 Namen/Typen, Orbits an mehreren Zeitpunkten, Filter, Suche und neue Datenpfade ab.
