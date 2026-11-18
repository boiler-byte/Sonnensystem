# Delta v58 – SVG-Perspektivicons und Perspektivwechsel im AR-Modus

**Basis:** v57.0.0. **Ziel:** v58.0.0. Das ZIP enthält nur die neuen oder gegenüber v57 geänderten Dateien.

## Kamera zurücksetzen

- Drei neue, eigenständige SVG-Icons ersetzen das alte Pfeil-/Ecken-Icon. **Schräg/oben:** Videokamera nach rechts unten. **Topdown:** Videokamera nach unten. **Seitlich:** frontal sichtbare Kameralinse.
- Der Button zeigt immer das **Icon für die nächste Ansicht**. Die Reihenfolge ist **Schräg/oben → Topdown → Seitlich → Schräg/oben**. Ist die aktuelle Perspektive Schräg/oben, erscheint Topdown. Nach einem Klick auf Schräg/oben erscheint ebenfalls Topdown als nächstes Icon.
- Bei manueller Kameraverschiebung, Rotation oder Zoom wird der nächste Schritt auf **Schräg/oben** zurückgesetzt und das Icon unmittelbar aktualisiert. Die Kamera-Preset-Winkel werden im Sonnensystem bei `.99` / `.16` / `1.54` Radiant Neigung angesetzt (Schräg/oben, Topdown, Seitlich); Planetenansichten beginnen in der Schrägansicht bei `.84`.
- Die **Planetenansicht ohne AR** behält ihre bisherige Aktion: zurück zur Sonnensystemübersicht. Die drei Perspektivicons bleiben derselbe Button, kein weiterer Trigger.

## Perspektiven im AR-Modus

- Der Kamera-Button wechselt bei aktivem AR jetzt **ebenfalls zwischen Perspektiven**, ohne AR zu deaktivieren oder die Planetenszene zu verlassen.
- Nach jedem Klick wird die **letzte gültige Sensorhaltung** neu am Kamera-Preset verankert. So ist das aktuelle Kamerabild in die neue Richtung ausgerichtet und reagiert anschließend wieder auf das Drehen/Neigen des Geräts. Es wird kein zweites Mal eine Sensorberechtigung angefragt.
- **Nur Umsehen per Geräteausrichtung** ist keine translatorische Kamerabewegung. Der Preset-Zyklus läuft dadurch weiter. Manuelles Schwenken/Zoomen der virtuellen Kamera unterbricht den Zyklus und bietet als Nächstes die Schrägansicht an.
- Die bestehende reine Sensor-Neuausrichtung `recenter()` ist als API-Funktion erhalten, aber nicht mehr auf dem sichtbaren Reset-Button hinterlegt.
- **Einschränkung:** DeviceOrientation liefert nur die Drehung/Neigung, **nicht die 3D-Position** des Smartphones. Physische Translation des Telefons kann ohne AR-Positions-Tracking nicht zuverlässig erkannt werden.

## Umsetzung / Tests

- Geänderte Module: `src/renderer/camera.js`, `src/renderer/renderer.js`, `src/renderer/ar-mode.js`, `src/ui/scene-mode.js`, `src/app.js`.
- Oberfläche: `index.html`, `css/styles.css`. Versionsdaten: `package.json`, `sw.js`.
- Neue Tests: `tests/perspective-icons-ar-v58.test.mjs`; ältere Tests auf die neue Perspektivreihenfolge und neue AR-Buttonaktion aktualisiert. **300 automatisierte Tests bestanden.**
- Katalog, Layer, Cinema und Satellitendaten unverändert. PWA-Cache `sonnensystem-shell-v58`.

**Installation:** ZIP im Projektstamm einer vollständigen **v57-Installation** entpacken und gleichnamige Dateien ersetzen. Eine installierte PWA danach neu laden.
