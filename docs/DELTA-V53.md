# Delta v53 – Cinema-Modus für Objekt-Reihen-Darstellung

**Basis:** vollständiger Projektstand v52.0.0. **Ziel:** 53.0.0. **Installation:** `Sonnensystem-Delta-v53.zip` in das Projekt-Root über v52 entpacken und alle Änderungen überschreiben. Das Archiv ist ein **Delta**, keine vollständige Installation.

## Funktionsumfang

- Kontext-Play-Button in der horizontalen Control-Panel-Leiste **nur dann**, wenn `row=true`, `scaleObjects=false` und `scaleOrbits=false`. Vorherige v51-Voreinstellung der Reihe (Objektmaßstab zunächst an) bleibt erhalten.
- Beim Start sortiert Cinema ausschließlich die **aktuell sichtbaren Himmelskörper der aktiven Szene** nach ihrem katalogisierten Radius **aufsteigend**. Die gewöhnliche absteigende Reihe wird nicht dauerhaft geändert. Schematische Objektradien werden fürs Bild beibehalten. Die Sonne bzw. der Zentralplanet und die Layerfilter wirken weiter.
- Von links nach rechts wandernde virtuelle Kamera mit gleichmäßig nach Objektrang getakteter Abfahrt und sichtbarkeitsgerechtem Kameraabstand. 1100 ms Anfahrt, danach etwa 18–150 Sekunden Filmdauer abhängig von der Menge sichtbarer Objekte. Abrupte Tab-Reaktivierung springt nicht zum Ende.
- Native HTML-Range-Zeitleiste unter der Szene. Position, Zeit und aktueller Name sind sichtbar und per Maus, Touch oder Tastatur steuerbar. Scrubbing unterbricht die automatische Bewegung vorübergehend.
- **Stop** setzt die Sortierung zurück auf **groß → klein**, animiert die vorherige Kamera-Zielposition, Distanz und Blickwinkel und blendet die Zeitleiste aus. `Esc`, manuelle Kameraeingriffe, ein Maßstabs-/Ansichts-/Layerwechsel sowie die automatische Fertigstellung stoppen ebenfalls. Normale Zeit-Play/Pause und AR bleiben eigenständige Funktionen.
- Desktop- und mobile Layouts nutzen den bestehenden Toolbar-Stil; die mobile Zeitleiste liegt oberhalb von Reset-Button und Bottom-Sheet.

## Technische Änderungen

- `src/renderer/cinema.js` neu: reine Steuerungs-/Framing- und Zeitformeln.
- `src/renderer/transitions.js`: optionaler `asc`-Layout-Parameter ohne Änderung des bisherigen `desc`-Verhaltens.
- `src/renderer/renderer.js`: Start/Stop/Scrub/Fortschritt, Kamera- und Layoutübergänge, Responsive-Verhalten.
- `src/app.js`, `index.html`, `css/styles.css`: zustandsabhängiger Transport, Timeline, AR-Interlock, Tastatur und Mobile-Position.
- `sw.js`, `package.json`, `README.md`, `docs/{ARCHITECTURE,HILFE}.md`: Release und Offline-Dateiliste aktualisiert.
- `tests/cinema-v53.test.mjs` neu; Versionschecks in bestehenden Tests auf v53 aktualisiert.

## Validierung

`npm run check` führt Katalog-Validierung und die Node-Test-Suite aus. Für UI-Layout wurde das HTML/CSS zusätzlich mit Headless Chromium auf Desktop (1440×900) und Mobilbreite (390×844) hinsichtlich Position und Überlagerung geprüft. Eine vollständige End-to-End-WebGL-Wiedergabe im Browser war in der Testumgebung wegen einer Navigationssperre nicht durchführbar.

**Videoreferenz:** https://www.youtube.com/watch?v=HEheh1BH34Q – nur Inspirationsbasis für die aufsteigende Größe und Kamerarichtung. Weder Video noch Ton werden in die App kopiert oder eingebettet.
