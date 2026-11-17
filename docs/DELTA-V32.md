# Delta v32 – Kategoriepunkte im Objektkatalog

## Änderungen gegenüber v31

- **Kategoriepunkt vor dem Objektnamen:** Jeder Listeneintrag besitzt direkt vor dem Namen einen **7 px großen, vertikal zentrierten Punkt**, dessen Farbe aus `CATEGORY_COLORS` für die Objektkategorie stammt. Der Punkt ist rein dekorativ (`aria-hidden`).
- **Objektsymbol:** Die 28 px große Kugel links verwendet die individuelle `body.color`-Eigenschaft statt der Kategoriefarbe. Für fehlende oder ungültige Farbangaben wird neutrales `#9ba9bc` genutzt. Der bestehende Shader-/Verlaufseffekt bleibt erhalten.
- **Anordnung:** Der neue Punkt bleibt auch bei abgeschnittenen langen Objektnamen sichtbar. Das Layout gilt in der Desktop-Seitenleiste und im mobilen Sheet.
- **Version/PWA:** Anwendung `32.0.0`, Cache `sonnensystem-shell-v32`. Keine Datenmigration.

## Installation

Delta v32 über einer **vollständigen Installation von v31** entpacken und bestehende Dateien ersetzen. Das ZIP ist keine Vollversion. Danach neu laden (bei installierter PWA auf die Übernahme des neuen Service Workers achten).

## Prüfung

`npm run check` validiert den Katalog und führt die Regressionstests aus. Zusätzliche v32-Tests überprüfen die Farben und die HTML-Struktur der Katalogeinträge und den neutralen Fallback. Die Darstellung wird auf Desktop und Mobil geprüft.
