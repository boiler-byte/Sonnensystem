# Delta v19 – Rechtsbündige Dropdowns und kompakte Zeitsteuerung

**Basis:** v18. Die im ZIP enthaltenen geänderten Dateien direkt in das v18-Workspace-Root entpacken und überschreiben. Frühere Deltas sind in dieser Datei nicht erneut enthalten. `textures/standard` wird nicht verändert.

## Steuerung und Positionierung

- **Layer-Dropdown:** Direkt unter dem Layer-Button, rechte Kante mit Button ausgerichtet. Auf dem Desktop 227 px breit und bei niedrigem Bildschirm scrollbar. Innerhalb des Layer-Menüs: Alle/Standard, die acht Objektkategorien und darunter **Umlaufbahn**, **Kontrast** und **Farben** als drei unabhängige Ein/Aus-Schalter. Der eigenständige Bahnen-Button und sein Popover entfallen. Bestehende Statuswerte, Farbcodes und Standardvorgaben (alle drei an) bleiben erhalten.
- **Zeit-Dropdown:** Direkt unter dem Zeit-Button, ebenfalls rechtsbündig. Breite 196 px auf Desktop, mobil bis 220 px. Der Header zeigt ausschließlich die aktuelle Geschwindigkeit (ohne „Zeitsteuerung“). Der Body hat zwei Spalten: **links** den 241-stufigen vertikalen Geschwindigkeitsregler; **rechts** Play/Pause, Heute, lokales Datum und lokale Uhrzeit in zwei Zeilen. Die obere zweizeilige Trigger-Beschriftung bleibt Geschwindigkeit plus Datum ohne Uhrzeit.
- **Mobil:** Beide Menüs öffnen im dritten Tab „Steuerung“ und bleiben im normalen Layoutfluss. Das Zeitmenü ist innerhalb seines Triggers rechts ausgerichtet. Das Sheet wird bei Bedarf vollständig ausgeklappt; Wechsel zum Katalog oder zu Details schließt offene Menüs. Der Übersicht-Button bleibt im Bild.

## Unveränderte Semantik

- Logarithmische Geschwindigkeiten, getrennt für Sonnensystem (3 h/s Standard; 1 h/s bis 10 Jahre/s) und Planetenansicht (1 h/s Standard; 1 min/s bis 1 Jahr/s).
- Heute setzt die Simulation auf `Date.now()` in lokaler Browserzeit, ohne Play/Pause, Ansicht oder Kamera zu verändern.
- Objektlayer-Voreinstellung „Standard“: nur Sonne und Planeten.
- Umlaufbahn, Kontrast und Farben sind weiterhin getrennte Optionen. Kein Eingriff in WebGL, Katalogdaten oder lokale Texturen.

## Technische Änderungen

`index.html`, `css/styles.css`, `src/app.js`, `src/ui/timeline.js`, `src/ui/bottom-sheet.js`, `package.json`, `sw.js`. Tests wurden an das Layout angepasst und um `tests/popovers-v19.test.mjs` ergänzt. Cache-Version: `sonnensystem-shell-v19`.

**Validierung:** `npm run check`, mit zusätzlichem Layout- und DOM-Strukturtest. Ein echter interaktiver Browsertest ist getrennt zu beurteilen, da die Headless-Umgebung zeitweise keine lokale Navigation zulässt.
