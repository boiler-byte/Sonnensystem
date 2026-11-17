# Delta v28 – Drei Kameraperspektiven

## Änderungen gegenüber v27

- Der runde Button `#reset-camera` innerhalb von `.viewport-actions` zeigt nun vier **nach außen gerichtete Pfeile** statt einer Zoom-Out-Lupe. Position, Größe und Zugänglichkeit des Buttons bleiben erhalten.
- Ohne zwischenzeitliche manuelle Kameraänderung wechselt die Taste zyklisch **Schräg/oben (phi 0,99)** → **Von der Seite (phi 1,54)** → **Draufsicht (phi 0,16)** → **Schräg/oben**. Die Blickrichtung (`theta 0,63`), Distanz (47) und Zielposition (Sonne/Ursprung) werden jeweils auf die Preset-Werte gesetzt.
- Nach manueller Bewegung durch Drehen, Schwenken, Zoom, Touchgesten oder Pfeiltasten wird die Perspektivenfolge unterbrochen: Der folgende Klick stellt **Schräg/oben** wieder her, danach darf wieder durchgeschaltet werden. Reine Klicks ohne Bewegung setzen den Zustand nicht zurück.
- Aus einer isolierten Planetenansicht führt die Taste weiterhin unmittelbar zurück zur Sonnensystemübersicht (Schräg/oben). Ein sonstiger programmatischer Reset bleibt ein Reset auf Schräg/oben.
- PWA-Version und Cache-Kennung auf v28 erhöht, damit bestehende Offlineinstallationen die Änderung erhalten.

## Delta-Dateien

`index.html`, `src/app.js`, `src/renderer/renderer.js`, `src/renderer/controls.js`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/DELTA-V28.md` sowie aktualisierte und neue Tests in `tests/`.

**Installation:** Delta v28 auf die vollständige bisherige v27-Arbeitskopie entpacken und gleichnamige Dateien ersetzen. Das ZIP enthält nur veränderte/neue Dateien.
