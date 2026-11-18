# Delta v56 – Katalogerweiterung und relevanzsortierte Suche

**Basis:** vollständiger Projektstand **v55.0.0**. **Ziel:** **v56.0.0**. Die Datei `Sonnensystem-Delta-v56.zip` enthält ausschließlich neu angelegte und geänderte Dateien. **Kein vollständiges Projekt**: über eine vorhandene v55-Installation entpacken und Dateien ersetzen.

## Objektkatalog (+18)

| Kategorie | Ergänzungen |
|---|---|
| **Doppelasteroiden (2)** | **(65803) Didymos** und sein Begleiter **Dimorphos** |
| **Jupitermonde (3)** | S/2003 J 2, S/2003 J 4, S/2018 J 2 |
| **Saturnmonde (4)** | Loge, Skoll, Greip, Tarqeq |
| **Neptunmonde (2)** | S/2002 N 5, S/2021 N 1 |
| **Künstliche Erdsatelliten (7)** | Tiangong / Tianhe (NORAD 48274); GPS BIIF-6 (39741), GPS BIIF-10 (40730); NOAA-20 (43013), NOAA-21 (54234); GOES-16 (41866), GOES-18 (51850) |

Der neue Typ **Doppelasteroiden** erscheint im Layer-Dropdown und lässt sich unabhängig von anderen Objektkategorien ein- und ausschalten. Beide Objekte haben eine hierarchische Bahn (Didymos um die Sonne, Dimorphos um Didymos). Die neuen natürlichen Monde befinden sich in den bereits vorhandenen Mond-Objektkategorien und sind an ihre jeweiligen Planeten gebunden. Die Erdsatelliten ergänzen den bestehenden Satelliten-Layer. Die Suche zeigt diese Objekte auch dann, wenn ihr Layer ausgeschaltet ist.

Der Katalog umfasst jetzt **192 astronomische Objekte** mit **192 redaktionellen Artikeln**, `catalogVersion: 10.0.0` und 23 Quell-JSON-Dateien für Kategorien. Für alle neuen Einträge wurden Namen/Aliase, Bahndaten, Zuordnung zum Zentralkörper und Quellenbeschreibungen ergänzt.

### Genauigkeit

- **Didymos:** historische oskulierende Sonnenbahn; **Dimorphos:** modellhafte relative Umlaufbahn nach dem DART-Einschlag mit rund 11 Stunden 22 Minuten Umlaufzeit. Die dynamischen Auswirkungen sind vereinfacht.
- **Weitere Monde:** Mittlere Bahnelemente aus einem NASA/JPL-Tabellensatz; keine Echtzeit-Ephemeriden. Für unsichere körperliche Radien steht bewusst `radiusKm: 0` (in der Anzeige `—`).
- **Satelliten:** Die NORAD-IDs und typischen Bahnhöhen/Perioden dienen zur Identifizierung und einer illustrativen Darstellung. Knoten, Anfangsphase und Perizentrum sind schematisch. **Kein Live-TLE, keine reale aktuelle Satellitenposition und keine Bahnvorhersage.**

Quellen: [NASA – Didymos/Dimorphos](https://science.nasa.gov/solar-system/asteroids/didymos/), [JPL – DART Bahnänderung](https://www.jpl.nasa.gov/news/nasa-study-asteroids-orbit-shape-changed-after-dart-impact/), [NASA/JPL – Satelliten-Bahnelemente](https://ssd.jpl.nasa.gov/sats/elem/), [CelesTrak – NORAD-Kataloggruppen](https://celestrak.org/NORAD/elements/).

## Trefferreihenfolge

`src/ui/object-list.js` behält die bestehende UND-Suche über einzelne Wörter und alle Suchfelder bei; bei nichtleerem Suchfeld gilt nun folgende Priorität:

1. **Exakter Objektname, Alias oder ID:** z. B. wird `Saturn` immer als erster Treffer angezeigt.
2. **Exakter Kategoriename** (Singular/Plural): z. B. `Planeten`, `Monde`, `Doppelasteroiden`.
3. **Namenspräfix**, dann **Kategoriepräfix**.
4. **Exakte Elternreferenz**, dann **Teiltreffer in Namen/ID/Alias**, danach Kategorie- oder Elternteiltreffer.
5. **Verteilte Mehrworttreffer** (wie bisher), zuletzt im gemeinsamen Relevanzrang.

Bei gleicher Treffergüte: **Planeten → Zwergplaneten → Monde → andere Objekte**, dann alphabetisch nach Name. Ohne Suchbegriff bleibt die kuratierte Listenanordnung erhalten. Die planetenbezogene Katalogfilterung und die unabhängig von Layern zugängliche Suche bleiben bestehen.

## Umgesetzte technische Änderungen

- Neue Dateien: `data/catalog/binary-asteroids-v56.json`, `data/catalog/moons-additions-v56.json`, `data/catalog/satellites-additions-v56.json`, `data/editorial/de-objects-v56.json`.
- Manifest, Typnamen und Kategorienfarben, Layer-Checkbox, Sonnen- und Begleiterorbit, rekursive Positionierung, Detailstatistik (km/AE und Kleinkörpergrößen), Suchgewichtung und Offline-Cache aktualisiert.
- Version **56.0.0**, Offline-Cache **`sonnensystem-shell-v56`**.
- Integrationstests in `tests/catalog-search-v56.test.mjs` ergänzt, frühere Katalog-Zähltests an die nun vollständige Menge angepasst.

**Installation:** `Sonnensystem-Delta-v56.zip` über das Stammverzeichnis von **v55** entpacken. Bei vorhandenem PWA-Offline-Cache die Seite einmal neu laden, damit der aktualisierte Service Worker die neuen JSON-Dateien vorlädt.
