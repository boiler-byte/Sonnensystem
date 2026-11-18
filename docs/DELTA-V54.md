# Delta v54 – Cinema-Zoom und neues Maßstab-Panel

**Basis:** vollständiger Projektstand **v53.0.0**. **Ziel:** **v54.0.0**. `Sonnensystem-Delta-v54.zip` ist ein inkrementelles ZIP, keine vollständige Anwendung. Über das Projekt-Root von v53 entpacken und vorhandene Dateien ersetzen.

## Funktionsänderungen

1. **Cinema-Play:** Sichtbar bei `row=true`, `scaleObjects=true` und `scaleOrbits=false`. Beim Aktivieren der Reihe wird der Objektgrößenmaßstab weiterhin automatisch aktiviert. Die bisherige Freigabe bei *beiden* ausgeschalteten Maßstäben entfällt.
2. **Kamerafahrt:** Aufsteigende Reihenfolge nach physikalischem Katalogradius, passender Zoom pro sichtbarem Objekt einschließlich Saturns Ringen. Die Kamera hält **1.500 ms** pro Objekt und benötigt rund **1.300 ms** für einen sanften horizontalen Übergang mit logarithmischem Zoom. Hinzu kommt die bisherige 1.100-ms-Anfahrt; ein Film mit N Objekten hat daher etwa **N × 1,5 s + (N−1) × 1,3 s** reine Fahr-/Haltezeit (plus Anfahrt und kurzer Abschluss). Die angezeigten Größen bleiben physikalisch proportional; es ist keine Videowiedergabe.
3. **Zeitleiste:** Ermittelt Ziel und Zoom aus derselben kontinuierlichen Filmposition und bleibt per Drag, Touch und Tastatur steuerbar. Stop und Ende stellen absteigende Größenreihenfolge und ursprüngliche Kamerapose wieder her. Ein Mondfilter-Wechsel während Cinema beendet die Tour ebenfalls.
4. **Maßstab-Dropdown:** Drei Hauptbuttons in einer oberen Reihe: **Objekt**, **Bahn**, **Reihe**. Reihe besitzt eine sichtbare Beschriftung. Unter Objekt und Bahn bleiben die sekundären Icon-Schalter.
5. **Mond-Toggle:** Das Icon besteht aus **neun im Kreis angeordneten Punkten**. Neuer Sinn: **Aus = maximal vier größte natürliche Monde pro Planet**, **An = alle natürlichen Monde** (sofern der entsprechende Objekt-Layer sichtbar ist). Die bisherige Begrenzungsvariable `fourMoons` wird intern unverändert verwendet, das sichtbare Schalterverhalten wird invertiert. Die Standardsichten behalten ihre alte tatsächliche Mondanzahl.

## Änderungen und Tests

- Geändert: `src/renderer/{cinema,renderer}.js`, `src/app.js`, `index.html`, `css/styles.css`, Release- und Dokumentationsdateien.
- Neu: `tests/cinema-scale-controls-v54.test.mjs`. Historische Tests wurden dort aktualisiert, wo ihre ehemaligen UI-Erwartungen den nun ausdrücklich geänderten Anforderungen widersprechen.
- `npm run check`: Katalogvalidierung und Node-Tests. Der Dropdown-Aufbau wurde zusätzlich mit Headless Chromium in 1440, 390, 320 und 280 Pixel Breite geprüft. Die vollständige WebGL-End-to-End-Interaktion ließ sich aufgrund einer Browser-Navigationssperre nicht ausführen.

## Hinweise

Die Gesamtdauer richtet sich nach der Anzahl **sichtbarer** Körper. Bei aktivierten zusätzlichen Mond- oder Asteroiden-Layern kann die Tour deutlich länger dauern als in v53, weil jeder Körper eine eigene Haltephase hat. Die Berechnung ist eine lokale WebGL-Animation; die Videoreferenz https://www.youtube.com/watch?v=HEheh1BH34Q wird nicht eingebettet.
