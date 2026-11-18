# Delta v45 – Reihe und Übergangsanimationen

## Installation

`Sonnensystem-Delta-v45.zip` über eine **vollständige v44-Installation** in denselben Projektstamm entpacken und vorhandene Dateien überschreiben. Dieses Archiv enthält nur neue bzw. geänderte Dateien. Anschließend Seite/PWA neu laden. Version **45.0.0** und Cache **`sonnensystem-shell-v45`**.

## Neuer Schalter „Reihe“

- Unter den beiden Bahndarstellungs-Schaltern **Umlaufbahn** und **Kontrast** sitzt ein neuer Toggle mit **drei von links nach rechts kleiner werdenden SVG-Punkten**; er belegt die Breite der Bahn-Spalte.
- **Standard Aus**, getrennt in der Sonnensystem- und isolierten Planetenansicht. `aria-pressed`, Aktiv-Stil, Tooltip und Snackbar geben den Zustand wieder.
- **An:** Alle durch den Layerfilter und ggf. die 4-Monde-Regel tatsächlich sichtbaren Körper werden horizontal **nach ihren hinterlegten physikalischen Radien absteigend** gereiht. Bei identischem Radius sortiert die ID deterministisch. Unbekannte Radien werden nicht geschätzt und stehen am Ende.
- Zwischen benachbarten Kugeln bleibt freier Raum. Ihre angezeigten Radien richten sich weiterhin nach **Objekt Aus/An**; die Aufreihung verändert weder reale Radien noch Bahnelemente. Auch der Platzbedarf im Hochformat wird beim Kameraframing berücksichtigt.
- Beim Aktivieren werden die Orbitlinien weich ausgeblendet; bei Deaktivierung erscheinen sie zurück, sofern **Umlaufbahn** weiterhin aktiviert ist. Die Option **Kontrast** und die dauerhafte Kategoriepalette bleiben unverändert. Das Sonnenglühen bleibt an der animierten Sonnenposition.

## Übergangsanimationen

Beim Wechsel der **Objekt-/Bahn-Maßstäbe**, der **Reihenansicht** sowie zwischen der **Sonnensystem-** und **Planetenansicht** wird der gerade gerenderte Zustand eingefroren und ca. **980 ms** in die neue Zielgeometrie überführt:

- **Positionen:** Kepler-/Horizons-Zielpositionen bleiben rechnerisch unverändert; die Grafik interpoliert zu den neuen Koordinaten.
- **Körper und Bahnen:** Kugelradien, Saturnring-Skalierung und gezeichnete Bahnradien verwenden denselben Interpolationsfortschritt. Ein leichter Überschwinger (unter 5 %) sorgt für den Gummiband-Effekt und endet exakt am Ziel.
- **Kamera:** Ziel und Distanz werden wie bisher weich nachgeführt; beim Reihen- und Szenenwechsel wird außerdem der Blickwinkel animiert. Objektfokus und globales Folgen bleiben auch während des Animationswegs nutzbar.
- **Schnelles Zurückschalten:** Neue Übergänge beginnen an der gerade dargestellten Zwischenposition und verhindern harte Sprünge. Benutzerbedienung der Kamera hat Vorrang vor einer laufenden Winkelanimation.
- **Barrierefreiheit:** Bei `prefers-reduced-motion: reduce` werden die Gummiband-Übergänge nicht ausgeführt.

Der Reihenmodus betrifft ausschließlich die 3D-Szenengeometrie. Er sortiert weder den Objektkatalog um noch ändert er die Simulation, Zeitsteuerung, gespeicherte Bahndaten oder den physischen Maßstab.

## Qualitätssicherung

- Bestehende Regressionstests und neue v45-Tests für den neuen Button, geometrische Sortierung, Kugelabstände, Hochformat-Framing, Planetenansicht, Zeit-/Ansichtsinterpolation, Orbit-Fades, Unterbrechbarkeit, Fokus/Folgen und reduzierte Bewegung.
- Isolierte Browserprüfung der Menüausrichtung bei Desktop- und Mobilbreiten sowie des Toggle- und Snackbar-Verhaltens.
- Delta-ZIP wird nach der Erstellung über eine unveränderte v44-Kopie installiert und auf byteidentische Wiederherstellung der v45-Arbeitskopie geprüft.
