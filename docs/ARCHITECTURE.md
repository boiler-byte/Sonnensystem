# Architektur – Sonnensystem v68

## Prinzipien

Die Browseranwendung nutzt native ES-Module, WebGL und Canvas-Labels ohne Framework oder Frontend-Buildschritt. Der Node-Server stellt nur die erlaubten statischen Dateien und optionale API-Proxies bereit. Die Datensätze liegen lokal in JSON-Dateien; astronomische und redaktionelle Quellen sind über stabile IDs verknüpft.

## Modulverantwortung

| Modul / Ordner | Verantwortung |
|---|---|
| `src/app.js` | Minimaler ES-Modul-Einstieg (`init()` aus `src/app/runtime.js`) |
| `src/app/runtime.js`, `state.js` | Start, gemeinsam genutzter Zustand und Verdrahtung der Controller |
| `src/app/camera-controller.js`, `view-mode.js` | Kameraaktionen, Perspektiven und Ansichtstransitionen |
| `src/app/ar-controller.js` | AR-Sensorsteuerung, Berechtigung und UI-Verknüpfung |
| `src/app/animation-loop.js`, `animation-controls.js` | Zeitfortschritt, Bildschleife, Wiedergabe und Steuerung |
| `src/app/object-catalog.js` | Kataloginitialisierung und optionaler Live-Datenabgleich |
| `src/ui/*.js` | Katalogsuche, Details, Layer, Popovers, Buttons, Mobile-Sheet und Status |
| `src/data/*.js` | Katalogvalidierung, Normalisierung, Typen und Bahnberechnung |
| `src/renderer/renderer.js` | Szenenkoordination und WebGL-Lebenszyklus |
| `src/renderer/solar-view.js`, `planet-view.js`, `scene.js` | Sonnen- und Planetenansichten |
| `src/renderer/orbits.js`, `orbit-cache.js`, `scene-objects.js` | Orbit-Geometrie, begrenzter Cache, gemeinsame Zeichenpfade |
| `src/renderer/controls.js`, `camera.js`, `ar-mode.js`, `cinema.js` | Kamera- und Eingabemodelle, Sensor-AR, Cinema |
| `src/renderer/textures.js`, `texture-sources.js`, `shaders.js`, `geometry.js`, `labels.js` | Textur- und GPU-Ressourcen, Modelle, Label-Canvas |
| `src/services/*.js`, `server/` | Optionale NASA-, Solar-OpenData- und CelesTrak-Abfragen über den Server |

## Start und Datenfluss

1. `index.html` lädt `src/app.js`, das `init()` in `src/app/runtime.js` aufruft.
2. `src/data/catalog.js` lädt `data/catalog/manifest.json` und die dort gelisteten Daten aus `data/catalog/` sowie `data/editorial/`.
3. Die Parser prüfen IDs, Elternbezüge, Schemata, Bahneinheiten und redaktionelle Quellen; `scripts/validate-catalog.mjs` prüft denselben Bestand im CI-/CLI-Kontext.
4. Adapter wandeln die Datensätze in Renderer-Objekte um; redaktionelle Artikel werden über IDs zugeordnet. Entwürfe bleiben verborgen.
5. `src/app/` verbindet Renderer, UI, Zeitsteuerung und optionale Netzwerkdaten.
6. Der Renderer aktualisiert Positionen, Kamera, Layer und Labels abhängig vom Simulationszustand. Kepler-Stützpunkte sichtbarer Bahnen werden mit begrenztem Cache wiederverwendet.
7. Die API-Routen unter `/api/` werden **nicht** durch den Service Worker gecacht; die App bleibt auch ohne externe Anbindung mit lokalem Katalog nutzbar.

## Darstellung und Ressourcen

- Sonnen- und Planetenansicht verwenden gemeinsame Zeichenwege für sichtbare Körper, Bahnfilter und Status.
- Die Orbitalgeometrie liegt in einem begrenzten Cache; Zeichenpuffer werden wiederverwendet. Ungenutzte Positionen werden in stabilen Frames nicht wiederholt berechnet.
- Texturen kommen aus erlaubten lokalen Pfaden unter `textures/standard/`; fehlen diese Dateien, verbleiben schematische Materialien. Ladevorgänge und GPU-Ressourcen werden aufgeräumt.
- Die 2D-Label-Ebene priorisiert Auswahl und begrenzt gleichzeitige Beschriftungen.
- Im Hintergrundtab pausiert die Animation, ohne Simulationszeit nachzuholen.

## Offline-PWA

`sw.js` liegt im Projektstamm und verwendet `sonnensystem-shell-v68`. Bei Installation werden die App-Shell und alle im Katalog-Manifest referenzierten JSON-Dateien gecacht; große Bildtexturen werden nur beim Abruf abgelegt. Beim Aktivieren werden ältere `sonnensystem-shell-*`-Caches entfernt. Da alte Servicer-Worker-Installationen noch frühere Assets enthalten können, nach Updates neu laden.

## Server und Sicherheit

Der statische Server erlaubt nur definierte Root-Assets, auflösbare Frontend-ES-Module, gültige Datenpfade und erlaubte lokale Texturen. Serverkonfiguration, `.env` und Testdateien werden nicht als Browserressourcen ausgeliefert. API-Zugangsdaten bleiben serverseitig; Antwortdaten externer Dienste werden nicht für Offline-Betrieb garantiert.

## Tests und Wartung

`npm run check` validiert den vollständigen Katalog und startet die Node-Regressionssuite in `tests/*.test.mjs`. Die historisch benannten Feature-Suites bleiben erhalten, damit Fehler in Kamera, AR, Darstellung, Katalog und mobilem UI weiterhin erkannt werden. Die **Release-Metadaten** (Paketversion, HTML-Meta und Cache), PWA-Assets und aktuelle Dokumentationslinks werden dagegen in `tests/release-contract.test.mjs` zentral geprüft; die Feature-Tests sind von einer fest einkodierten Release-Nummer befreit. Neue Funktionsänderungen erhalten eigenständige Verhaltenstests.

Weitere Informationen: [Datenarchitektur](DATA-ARCHITECTURE.md), [Projektpflege](MAINTENANCE.md), [Versionshistorie](RELEASE-HISTORY.md).
