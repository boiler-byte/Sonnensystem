# Delta v46 – sichtbare Gummiband-Übergänge für Maßstab und Ansichten

## Installation

`Sonnensystem-Delta-v46.zip` **über eine vollständige v45-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Das Archiv enthält ausschließlich gegenüber v45 geänderte oder neue Dateien. Die App bzw. PWA anschließend neu laden. Release **46.0.0**, Service-Worker-Cache **`sonnensystem-shell-v46`**.

## Verhalten

- **Schema ↔ Maßstab:** Positionen und Bahnradien werden stetig interpoliert. Kugelradien und Saturnringe wachsen bzw. schrumpfen weich. Die Zielgeometrie wird nach ungefähr **980 ms** mit leichtem elastischem Überschwingen erreicht.
- **Umlaufbahnen ↔ Reihe:** Die Objekte wandern in bzw. aus der nach Größe sortierten Reihe. Die Bahnlinien verblassen und erscheinen wieder, ohne beim direkten Zurückschalten ihre Helligkeit abrupt zu ändern. Die Orbits bleiben während der Bewegung an der Sonne bzw. am gewählten Zentralplaneten verankert.
- **Sonnensystem ↔ Planetenansicht:** Körper aus der bisherigen Szene bleiben vorübergehend als transparente Darstellung erhalten und verblassen; neue Körper erscheinen nach und nach. Dasselbe gilt für die vorher sichtbaren und neu hinzukommenden Bahnen. Auch die alten Orbitlinien können sich dabei mit der Szene bewegen; ihre historischen Radien werden nicht plötzlich auf den neuen Szenenmaßstab gesetzt.
- **Schneller erneuter Wechsel:** Ausgangspunkt sind die gerade angezeigten Koordinaten, Größen und Deckkräfte. Auch teilweise verblasste Körper und Bahnen werden weiter interpoliert, statt zu blinken oder zu springen.
- **Kamera und Bedienung:** Kameraziel, Abstand und Blickwinkel werden weiter weich nachgeführt. Manuelle Kamerabewegungen haben Vorrang; Objektfokus und Folgen bleiben nutzbar.
- **Barrierefreiheit:** Mit `prefers-reduced-motion: reduce` werden Übergänge weggelassen.

Die Änderung betrifft nur die **Darstellung**; Zeitsteuerung, Orbitalparameter, Katalog, Layer- und Maßstabsschalter sowie die beiden Ansichtsmodi bleiben erhalten. Es werden keine Bahndaten interpoliert oder überschrieben.

## Implementierung

- `src/renderer/renderer.js`: Sichtbarkeits-Snapshots vor Ansichtswechseln, Quell- und Ziel-Szenenüberblendung, Opazitäts-Interruption ohne Sprung, Tiefenpuffer-Schutz für transparente Objekte.
- `src/renderer/shaders.js`: `uOpacity` für Kugeln und Saturnringe.
- `src/renderer/orbits.js`: eigene Quell-Geometrie und Deckkraft für ausblendende Bahnlinien.
- `src/renderer/planet-view.js`, `solar-view.js`: animierte Bahnmittelpunkte.
- `tests/spring-view-transitions-v46.test.mjs`: sieben gezielte Regressionstests für Szenenblenden, unterbrechbare Opazitäten, Orbitzentrierung, Rendering-Fades und reduzierte Bewegung. Zusätzlich bestehen alle bestehenden Projektprüfungen.

## Grenzen der Prüfung

Die Rechenwege und Zeichnungsaufrufe sind durch automatisierte Tests abgedeckt. Ein vollständiger WebGL-Browserstart war in der verfügbaren Headless-Chromium-Umgebung mangels WebGL-Kontext nicht möglich.
