# Delta v22 – linke Tab-Seitenleiste und vollständige Sonnenbahnen

**Basis:** v21. Dieses ZIP enthält nur neue und geänderte Dateien; über das Workspace-Root einer v21-Installation entpacken und vorhandene Dateien ersetzen. Die Katalog-JSON, Texturen, lokalen API-Endpunkte und der Zeitregler sind unverändert.

## Allgemein

- Die globale **Topbar entfällt vollständig**. Die 3D-Ansicht und linke Seitenleiste beginnen am oberen Fensterrand.
- Der bestehende Hilfetext liegt zusätzlich als lesbare Dokumentation unter **`docs/HILFE.md`**, ergänzt um die neue Tab-Anordnung und die Bahndarstellung.
- Damit die Bedienung zugänglich bleibt, stehen der **Hilfe-Button** und mobil der **Objekte-Button** als kleine Schaltflächen oben links über der 3D-Ansicht. Es gibt keine neue horizontale Leiste.

## Linke Sidebar

- Der Objektkatalog und die Objektdetails teilen sich auf Desktop eine **einzige linke Seitenleiste** mit den Tabs **„Objekte“** und **„Details“**. Die gesonderte rechte Detailspalte entfällt.
- Die Tabs nutzen dieselben, unvervielfältigten `#catalog`- und `#detail`-Elemente wie das mobile Bottom-Sheet. Beim Wechsel der Bildschirmbreite werden beide Elemente zwischen Sidebar und Sheet verschoben, ohne den aktuellen Tab zu verlieren.
- Beim Start ist **Objekte** aktiv. Eine gezielte Objektwahl aus dem Katalog oder der Szene öffnet **Details**. Suche und Tastenkürzel `/` öffnen den Katalog.
- Beide Tab-Gruppen lassen sich mit Pfeiltasten links/rechts sowie Home/End bedienen. `aria-selected`, Tastaturfokus und Sichtbarkeit bleiben synchron.

## 3D-Sonnensystem

- Wenn **Umlaufbahn** aktiviert ist, werden **alle** verfügbaren sonnenzentrierten Bahnen aktiver Layer gezeichnet: Planeten, Zwergplaneten, Asteroiden und Kometen. Die bisherige Beschränkung auf ausgewählte Asteroiden/Kometen bzw. einzelne Zwergplaneten ist entfernt.
- Bahnen werden durch `solarOrbitBodies()` anhand von `parentId === 'sun'`, Layerstatus und vorhandenen gültigen Bahndaten bestimmt. Ihre Linien verwenden den Ursprung `[0,0,0]` (Sonne). Das Bahnen-Toggle schaltet sie gemeinsam ab.
- Monde und künstliche Satelliten haben stattdessen **planetenbezogene** Bahnen. In der Sonnenübersicht werden deshalb keine falschen Sonnenkreise für sie gezeichnet; ihre lokalen Umlaufbahnen bleiben in der jeweiligen Planetenansicht erhalten. Für Raumsonden werden ohne echte Ephemeriden weiterhin keine Bahnen erfunden.
- In der Sonnenübersicht werden je Planet **höchstens vier Mondnamen** zur Beschriftung zugelassen, nach physikalischem Radius (größte zuerst). Ein explizit ausgewählter kleinerer Mond erhält weiterhin ein Label, ersetzt aber den viertgrößten der Gruppe. In der isolierten Planetenansicht gilt diese neue Beschränkung nicht. Die bestehenden Bewegungs- und Bildschirmdichtefilter bleiben zusätzlich aktiv.

## Dateien und Tests

- `index.html`, `css/styles.css`: zweispaltiger Seitenaufbau, gemeinsame Sidebar-Tabs und Ansicht ohne Topbar.
- `src/ui/bottom-sheet.js`, `src/app.js`: Tab-Synchronisation und responsive DOM-Übernahme, keine Topbar-Abhängigkeit.
- `src/renderer/solar-view.js`: alle aktiven, verfügbaren Sonnenbahnen statt Auswahl-/Listenlimit.
- `src/renderer/labels.js`: pro Planet maximal vier Mondbeschriftungen in der Übersicht.
- `docs/HILFE.md`: Hilfetext; `README.md` und `docs/ARCHITECTURE.md`: aktuelle Beschreibung.
- `package.json`: `22.0.0`; `sw.js`: Cache `sonnensystem-shell-v22`.
- Neue Regressionen in `tests/desktop-tabs-orbits-v22.test.mjs`; Versions- und Sidebar-Tests aktualisiert.

## Prüfung

`npm run check` validiert Daten und führt die Node-Regressionssuite aus. Das Layout wurde mit isoliert geladenem HTML/CSS und Tab-Steuerung in Chromium bei 320, 375, 920 und 1360 px geprüft. Ein direkter lokaler HTTP-Aufruf in Chromium wird in dieser Umgebung von der Browsersicherheitsrichtlinie blockiert; deshalb ist dies keine vollständige WebGL-End-to-End-Prüfung.
