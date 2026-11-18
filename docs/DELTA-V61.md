# Delta v61 – Kamera-SVG für Schrägansicht nach unten links

Der Kamera-zurücksetzen-Button zeigt für die nächste Perspektive **Schräg/oben** jetzt ein Videokamera-Symbol, dessen Objektiv **diagonal nach links unten** gerichtet ist. Dafür wurde nur das `data-perspective="oblique"`-SVG in `index.html` von einer Drehung um 38° auf 142° geändert. Die übrigen beiden SVG-Symbole (Topdown, Seitlich), die Anzeigefolge und die AR-Steuerung bleiben unverändert.

## Installation

`Sonnensystem-Delta-v61.zip` über einen vollständigen v60-Stand entpacken und vorhandene Dateien ersetzen. App-Version `61.0.0`, Offline-Cache `sonnensystem-shell-v61`.

## Prüfung

`npm run check` führt die vorhandenen Regressionstests und `tests/camera-icon-v61.test.mjs` aus. Die beiden Tests prüfen die Richtung des Objektivs und die unveränderten übrigen SVGs.
