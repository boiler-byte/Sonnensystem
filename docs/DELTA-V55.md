# Delta v55 – Control-Panel ohne Maßstab-Dropdown

**Basis:** vollständiger Projektstand **v54.0.0**. **Ziel:** **v55.0.0**. Die Datei `Sonnensystem-Delta-v55.zip` ist ein inkrementelles ZIP (kein Vollprojekt); über das Root einer v54-Installation entpacken und vorhandene Dateien ersetzen.

## Änderungen

1. **Direkte Maßstab-Schalter:** Die drei Toggle-Buttons **Objekt**, **Bahn** und **Reihe** stehen dauerhaft im oberen Control Panel neben **Layer** und **Zeit**. Icons, Beschriftungen und Aktivzustände bleiben vorhanden. Die Maßstab-Schaltfläche, ihre Dropdown-Box und die zugehörige Menü-Öffnungslogik sind entfernt.
2. **Darstellungs-Optionen im Layer-Dropdown:** Nach den Presets **Alle/Standard**, aber **oberhalb** der Objektkategorien, steht die neue Gruppe **Darstellung** mit den fünf bisherigen Schaltern **Beschriftung**, **Beleuchtung**, **Alle Monde** (Icon aus neun Kreis-Punkten), **Umlaufbahn**, **Kontrast**. Die Kategorie-Liste beginnt weiter mit **Sterne** und enthält alle bisherigen Objektkategorien.
3. **Unveränderte Funktion:** Alle Toggles behalten ihre Einstellungen und die bisherigen Zustandsrückmeldungen (Toast, `aria-pressed`, Tooltips). **Alle Monde**: Aus = höchstens vier größte Monde je Planet; An = alle natürlichen Monde des aktiven Mond-Layers. Cinema ist weiterhin nur mit **Reihe An / Objekt An / Bahn Aus** verfügbar; die Kamera-Zooms, Haltephasen und Stop-Rückkehr aus v54 bleiben unverändert.
4. **Responsive Bedienung:** Die Hauptleiste darf auf schmalen Geräten umbrechen. Layer- und Zeit-Popover stehen unterhalb der Leiste, und die fünf Darstellungsschalter bleiben in einer gemeinsamen Zeile, ohne die Objektkategorien zu überlagern.

## Geänderte Komponenten

- `index.html`: Neu angeordnete direkte Maßstab-Schalter und Layer-Darstellungsgruppe.
- `css/styles.css`: Hauptleiste, Layer-Toggles und responsive Popover-Positionen.
- `src/app.js`: Entfernte Listener für das nicht mehr existierende Maßstab-Dropdown; die vorhandenen Toggles bleiben verbunden.
- `package.json`, `sw.js`: Versionswechsel und neuer PWA-Cache.
- `tests/`: Regressionsprüfungen für das v55-Layout, unveränderte Steuerungsfunktionen und bisherige App-Funktionen.
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`: aktualisierte Bedien- und Architekturhinweise.

## Prüfung und Installation

- **277 von 277 automatisierten Tests erfolgreich** (`npm run check`, inklusive Datenvalidierung).
- Statische Chromium-Layoutprüfung für Desktop und mobile Viewports (1440, 390, 320 und 280 Pixel) sowie AR-/Cinema-Leistenvarianten: keine abgeschnittenen Schalter, kein horizontaler Überlauf. Die vollständige WebGL-Interaktion wurde in der Umgebung nicht ausgeführt.
- Nach Installation ggf. die Anwendung neu laden, damit die neue PWA-Cache-Version aktiv wird.
