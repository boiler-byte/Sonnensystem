# Sonnensystem v6.1 - Workspace-Root / Service Worker

## Behobenes Problem

In v6 lagen `index.html`, `sw.js`, `manifest.webmanifest`, die CSS-Datei und die Icons
unter `public/`. Eine IDE-Vorschau oder ein statischer Dateiserver mit dem Workspace-Root
als Document Root kann dann `./sw.js` nicht finden ("Failed to fetch sw.js").

## Korrekturen

- Alle Dateien und Unterordner aus `public/` liegen jetzt direkt im Workspace-Root.
- `public/` entfällt. Die modularen Ordner `src/`, `server/`, `tests/` und `docs/` bleiben bestehen.
- `server/static.mjs` liest die statischen Webdateien aus dem Root und gibt weiter nur
  explizit erlaubte Pfade frei (keine `.env`, keine Tests/Serverquellen).
- Die relativen Referenzen in HTML, PWA-Manifest und Service Worker bleiben gültig.
- Die Offline-Cache-Version wurde auf `sonnensystem-shell-v6.1` angehoben.
- README, Architektur- und Regressionstests wurden aktualisiert.

## Installation

Das ZIP enthält **keinen zusätzlichen äußeren Projektordner**. Es muss direkt im
gewünschten Workspace-Root entpackt werden: `index.html`, `sw.js` und `package.json`
liegen dort auf derselben Ebene. Bei einer bestehenden v6-Installation muss der alte
Ordner `public/` entfernt werden. Danach Server oder Vorschau neu starten und die
Seite einmal neu laden; falls der alte Service Worker die Seite kontrolliert, erneut
laden oder die bisherige PWA-Installation aktualisieren.

Start mit Node.js 20+: `npm start`; Prüfung: `npm run check`.
Ohne den Node-Server zeigt ein statischer Workspace-Server die eingebauten Objekte,
aber die Endpunkte `/api/...` stehen dann nicht zur Verfügung.
