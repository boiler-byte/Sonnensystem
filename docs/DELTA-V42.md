# Delta v42 – maßstabsbezogene Darstellungsoptionen

## Änderungen gegenüber v41

1. **Control Panel:** Die drei 58×54-px-Auslöser stehen oben rechts in der Reihenfolge **Maßstab → Objektlayer → Zeitsteuerung** (8 px Abstand). Alle drei Dropdowns liegen wie zuvor mit ihrer rechten Kante direkt am rechten Viewportrand, ohne die Buttonreihe zu verdecken. Die Breiten bleiben 186/145/120 px.
2. **Maßstab-Dropdown:** Zwei Spalten. Links steht der große Toggle **Objekt** über drei eigenständigen Schaltern für **Beschriftung** (SVG: Tab-Label), **Beleuchtung** (SVG: Taschenlampe) und **4 Monde** (SVG: vier Punkte). Rechts steht der große Toggle **Bahn** über **Umlaufbahn** (SVG: konzentrische Kreise), **Kontrast** (SVG: schwarz-weißer Kreis) und **Farben** (SVG: Farbpalette). Die sechs Zusatzschalter sind aus dem Layer-Dropdown entfernt. Jede Taste behält ihre ID und Funktion, den aktiven An/Aus-Zustand, `aria-pressed`, Tooltip und einen zugänglichen Namen.
3. **Beleuchtungs-Standard:** Sonnensystemansicht weiterhin **Aus / Optimiert**; Planetenansicht nun **An / Realistisch**. Beide Ansichten behalten ihre voneinander unabhängigen Beleuchtungszustände, auch beim Umschalten. Andere Defaults bleiben unverändert (Objekt-/Bahn-Maßstab beide Aus; 4 Monde im Sonnensystem An, in der Planetenansicht Aus).
4. **Mond-Kategoriefarbe:** `#E6EDF5`. Der Wert war bereits im v41-Quellcode unter `CATEGORY_COLORS.moon` hinterlegt und wird weiterhin konsistent in Kategorieindikatoren und orbitbezogener Färbung verwendet; keine Material-/Texturfarben wurden geändert.
5. **Versionierung:** Anwendung `42.0.0`, PWA-Shell-Cache `sonnensystem-shell-v42`.

## Dateien und Test

Geändert: `index.html`, `css/styles.css`, `src/app.js`, `src/data/layers.js`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md` sowie ältere Tests mit versionsbezogenen oder veralteten DOM-Annahmen. Neu: `docs/DELTA-V42.md`, `tests/control-panel-v42.test.mjs`.

**187/187** automatisierte Tests bestanden. Browser-Layoutkontrolle mit Chromium bei **1280×800, 375×812, 320×480 und 245×640**: Die drei Popovers sind rechtsbündig, liegen unter den Triggern und die horizontale Reihenfolge bleibt erhalten.

## Installation

Das Archiv **Sonnensystem-Delta-v42.zip** über eine **vollständige v41-Installation** entpacken und die geänderten Dateien überschreiben. Danach App/PWA neu laden; der neue PWA-Cache ersetzt den vorherigen.
