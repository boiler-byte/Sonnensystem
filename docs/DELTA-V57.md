# Delta v57 – Layer-Dropdown-Presets und Kamera zur Ansicht zurücksetzen

**Basis:** Projektstand **v56.0.0**. **Ziel:** **v57.0.0**. Das Archiv `Sonnensystem-Delta-v57.zip` enthält nur neue und geänderte Dateien. Den Inhalt über eine vollständige v56-Installation entpacken und gleichnamige Dateien ersetzen.

## Layer-Dropdown

- Die sichtbare Überschrift **„Darstellung“** oberhalb der Darstellungsschalter und der Absatz `p.layer-note` mit den Standardwerten unter den Objektkategorien wurden entfernt. Der unsichtbare ARIA-Gruppenname bleibt bestehen.
- Die drei Buttons **Beschriftung**, **Beleuchtung** und **Alle Monde** belegen die obere Reihe, die Buttons **Umlaufbahn** und **Kontrast** stehen zentriert in einer zweiten Reihe darunter. Die Objektkategorien folgen wie bisher.
- **Alle** aktiviert **alle Objektlayer und alle fünf Darstellungsschalter**. Das entspricht `labels:true`, `lighting:'realistic'`, `fourMoons:false` (UI „Alle Monde“ ist somit **An**), `orbits:true`, `orbitContrast:true`.
- **Standard** setzt Kategorien **und** Darstellungsschalter für die **aktuelle Ansicht** auf die von `createViewSettings(view)` definierten Vorgaben zurück. Sonnensystem: Beleuchtung optimiert, vier Monde je Planet, Beschriftung an, Bahnen an, Kontrast aus. Planetenansicht: Beleuchtung realistisch, alle Monde, Beschriftung an, Bahnen an, Kontrast aus. Eine manuelle Änderung hebt die Preset-Auswahl-Markierung auf. **Objekt**, **Bahn** und **Reihe** bleiben bei Presets unverändert; die andere Ansicht behält ihre eigenen Einstellungen.

## Kamera bei Maßstabswechsel

- Ein Klick auf **Objekt** oder **Bahn** führt auch nach manueller Kameraänderung die Kamera zur **Ausgangsperspektive der aktiven Szene** zurück. Dazu werden der manuelle Bewegungstatus und ein Fokus aufgehoben sowie eine aktive Folgen-Nachführung beendet.
- **Sonnensystem:** Ziel `[0,0,0]`, Startwinkel `.63/.99`, Abstand aus `solarOverviewDistance()` gemäß neuem Maßstab.
- **Planetenansicht:** Ziel `[0,0,0]`, Startwinkel `.63/.84`, Abstand aus `planetFrameDistance()`.
- **Objekt-Reihe:** Ziel und Abstand des Anfangsframes `rowFrame()` / `rowDistance()`, Blickwinkel `0/1.5`.
- Die bisherige Maßstab-Transition bleibt für Kamera und Objekte erhalten; die sanfte zeitversetzte Bahnwelle beim Ausschalten der Bahnabstände in der Planetenansicht wird nicht ersetzt.

## Technische Umsetzung und Prüfung

- `src/app.js`: `applyDisplayPreset` synchronisiert die fünf Darstellungszustände und den Preset-Status; `updateScale` ruft `renderer.resetViewCamera()` auf.
- `src/data/layers.js`: reine Hilfsfunktionen `displayPreset` und `displayMatchesPreset`, explizite Liste der Darstellungseinstellungen.
- `src/renderer/renderer.js`: `resetViewCamera` als szenenabhängige Startkamerasteuerung. `index.html`/`css/styles.css`: reduzierte Texte und 3+2-Raster.
- `tests/layer-presets-camera-v57.test.mjs`: Regressionstests für beide Presets, Darstellungsschalter, Markierung, Schalter-/Szenenunabhängigkeit und animierte Kamera-Rückführung. Desktop-/Mobil-Layoutkontrolle in Headless Chromium.
- Service-Worker-Cache **`sonnensystem-shell-v57`**, Projektversion **57.0.0**. Katalogdaten, Modellbahnen und API-Strukturen bleiben unverändert.

**Installation:** `Sonnensystem-Delta-v57.zip` im Stammverzeichnis eines vollständigen v56-Standes entpacken und Dateien ersetzen. Bei installierter PWA nach dem Update die Seite erneut laden, damit der neue Offline-Cache wirksam wird.
