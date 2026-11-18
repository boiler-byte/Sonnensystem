# Delta v40 – horizontales Control-Panel

## Änderungen gegenüber v39

- Die zwei Auslöser **Objektlayer** und **Zeitsteuerung** stehen oben rechts **horizontal nebeneinander**, beide 58 px breit und 54 px hoch, mit 8 px Abstand. Das schwebende Control-Panel bleibt ohne Rahmen und Hintergrund (Gesamtbreite 124 px).
- Beide Dropdown-Panels öffnen **unterhalb der gesamten Buttonreihe**. Ihre **rechten Kanten liegen exakt an der rechten Viewport-/Bildschirmkante**: Das Layer-Menü bleibt 145 px breit, das Zeit-Menü 120 px. So bleibt ein möglichst großer Bereich der 3D-Ansicht frei.
- Beim Klick auf den anderen Auslöser wird das derzeit geöffnete Dropdown automatisch geschlossen und das andere direkt geöffnet – **kein voriges Schließen erforderlich**. Die bereits vorhandene Ein-Menü-Logik in `src/app.js` bleibt dafür unverändert; durch die horizontale Anordnung verdeckt kein Dropdown mehr den jeweils anderen Auslöser.
- Desktop und Mobil verwenden dieselbe Zeile. Berücksichtigt werden Safe-Area-Abstände der Auslöser, begrenzte Menühöhen und scrollbar bleibende Panelinhalte. Klick außerhalb, `Escape`, Slider-, Layer- und Szenenfunktionen bleiben bestehen.
- Versionswechsel auf **40.0.0** und PWA-Cache `sonnensystem-shell-v40`.

## Geänderte Dateien

- `css/styles.css` – horizontale Trigger und gemeinsame rechte Popover-Kante
- `index.html`, `package.json`, `sw.js` – Version und Cache
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V40.md` – Dokumentation
- `tests/control-panel-v40.test.mjs` – Regressionen für Layout und Menüwechsel
- bestehende Tests mit v39-Versionsannahmen – erwartete Versions-/Cache-Kennungen auf v40 angehoben

## Prüfung

`npm run check`: Katalogvalidierung und **174/174 Node-Tests bestanden**. Die Layoutpositionierung wurde zusätzlich rechnerisch für beide Dropdown-Anker geprüft; eine vollständige visuelle Chromium-Prüfung war in der Ausführungsumgebung nicht möglich.

## Installation

Das **Delta-v40-ZIP** über eine vollständige v39-Installation entpacken, vorhandene Dateien ersetzen und die Anwendung neu laden. Das ZIP enthält ausschließlich neu angelegte oder geänderte Dateien, nicht das vollständige Projekt.
