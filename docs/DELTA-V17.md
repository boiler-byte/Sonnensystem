# Delta v17 – Standardansicht und Umlaufbahn-Optionen

**Basis:** v16. Das ZIP enthält nur geänderte und neue Dateien. Über das vollständige v16-Workspace-Root entpacken; `textures/standard` bleibt erhalten.

## Standardansicht

- Voreinstellung **Standard**: Sonne und acht Planeten (`star`, `planet`), **keine Monde**.
- „Alle“ und die freie Kategoriemehrfachauswahl bleiben unverändert. Mond-/Satellitenbahnen erscheinen erst, wenn der entsprechende Layer eingeschaltet ist.
- Die Auswahl wirkt weiterhin auf Katalog, Objekte, Orbits, Labels und Anklickbarkeit. Die Planetenansicht folgt derselben Layer-Auswahl.

## Umlaufbahn-Dropdown

- Das bestehende Bahnen-SVG ist jetzt ein Menüknopf. Das Dropdown enthält exakt drei unabhängige Umschalter: **Umlaufbahn**, **Kontrast**, **Farben**; alle sind standardmäßig **An**.
- **Umlaufbahn**: Ein/Aus ohne Verlust der beiden Darstellungsoptionen. **Kontrast**: gut sichtbare, gegenüber v16 breitere Linien mit höherer Deckkraft. Echte projizierte 2D-Dreiecke (2,4 px normal / 3,4 px ausgewählt) statt browserabhängiger `gl.lineWidth`-Werte. Wenn Kontrast aus ist, werden die dünnen früheren Linien verwendet.
- **Farben**: Kategorienpalette an/aus; bei Aus werden alle Bahnen einheitlich graublau angezeigt. Die ausgewählte Bahn bleibt durch zusätzliche Breite/Helligkeit unterscheidbar.
- Das Menü öffnet auf Desktop **links** vom 110-px-Panel und auf Mobilgeräten **innerhalb** des dritten Tabs „Steuerung“. Layer-Menü, Geschwindigkeitsregler und Umlaufbahn-Menü schließen einander.
- Die Bahnfarben ändern nicht die lokalen Oberflächentexturen oder die natürlichen Planetenfarben.

## Farbpalette

| Kategorie | Bezeichnung | Hex-Code |
|---|---|---|
| Planeten | Weiß | `#E6EDF5` |
| Erdumlaufbahn | Klares Blau | `#4DA3FF` |
| Zwergplaneten | Violett | `#B68CFF` |
| Monde | Weiß | `#E6EDF5` |
| Asteroiden | Bernstein | `#E9B44C` |
| Kometen | Korallrosa | `#FF7597` |
| Künstliche Satelliten | Limettengrün | `#A7D86D` |
| Raumsonden | Orange | `#FF8B4A` |
| Sterne | Warmgelb | `#FFE5A0` |

Die blaue Farbe gilt für die Sonnenumlaufbahn **der Erde**, während alle übrigen Planetenbahnen weiß sind. Raumsonden sind weiterhin katalogbasiert, bis reale Ephemeriden vorhanden sind.

## Version, Validierung und Grenzen

- Version `17.0.0`; PWA-Cache `sonnensystem-shell-v17`.
- `npm run check` enthält bestehende Regressionstests plus v17-Prüfungen für Palette, Layer, Orbit-Liniengeometrie und die Oberfläche.
- Die Darstellung wurde nicht in einem vollständigen interaktiven Browserlauf verifiziert, weil die lokale Chromium-Navigation in der Testumgebung blockiert war. Die automatisierten Modell- und Komponententests sind separat ausgeführt.
