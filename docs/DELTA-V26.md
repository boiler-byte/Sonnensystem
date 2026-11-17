# Delta v26 – Kamera-Reset, schlankes Control-Panel und erweiterte Planetenansicht

## Änderungen gegenüber v25

### Allgemein

- **Hilfe-Button entfernt und ersetzt:** `#reset-camera` liegt jetzt oben rechts in `.viewport-actions` (statt innerhalb von `.scene-tools`). Er ist 40 × 40 px groß, kreisrund und gerahmt. Das neue SVG zeigt eine Lupe mit Minuszeichen (Zoom-Out). `title` und `aria-label` bleiben dynamisch: im Sonnensystem „Kamera zurücksetzen“, in einer isolierten Ansicht „Zurück zum Sonnensystem“.
- Das bisherige Hilfe-Modal und seine Ereignisbehandler wurden entfernt. Die Anleitung bleibt unter `docs/HILFE.md`.

### Control-Panel

- Das vollständige Control-Panel (`#view-mode-status`) ist einschließlich Padding und Rahmen **100 px** breit, sowohl auf Desktop als auch auf Mobilgeräten.
- Das bisherige `#view-mode-select` samt Label und Change-Handler ist entfernt. Systemwechsel erfolgen ausschließlich über den Button in den Objektdetails sowie Kamera-Reset zur Rückkehr in die Sonnensystemübersicht.
- Der Objektlayer-Auslöser zeigt nur noch das gestapelte SVG-Icon und den Dropdown-Pfeil; `#layer-summary` wurde entfernt. Der zugängliche Name enthält weiterhin die aktuelle Preset-/Layerauswahl. Das eigentliche Layer-Menü behält 152 px Breite.
- Das Zeit-Dropdown, die ansichtsspezifische Geschwindigkeit und beide Layerzustände funktionieren wie zuvor.

### Objektdetails und Rendering

- Der Button „Planetenansicht öffnen“ erscheint bei **Planeten** und **Zwergplaneten**; ein Zwergplanet kann selbst das Zentrum der isolierten Ansicht sein (z. B. Pluto mit Charon, Nix, Hydra, Kerberos und Styx).
- Bei **Monden** erscheint der gleiche Button, wenn deren Parent ein Planet oder Zwergplanet ist. Der Klick öffnet das **Elternsystem** und wählt das Zentralobjekt in der Detailansicht aus; z. B. Mond → Erde oder Charon → Pluto.
- Renderer, Positionsermittlung und verfügbarer Layerkatalog erlauben nun `dwarf` als isolierten Szenenmittelpunkt. Beim Öffnen wird seine zentrale Kategorie für die Planetenansicht aktiviert. Die bestehenden Standardfilter für gewöhnliche Planeten bleiben erhalten.

### Mobile Ansicht

- Der separate Menübutton `#mobile-menu` wurde entfernt. Das bestehende Bottom-Sheet mit „Objekte“ und „Details“ lässt sich weiter über Griff und Tabs öffnen.
- Kamera-Reset und Control-Panel liegen rechts oben übereinander; die Menüs bleiben auch auf kleinen Bildschirmen im sichtbaren Viewport.

## Dateien

- `index.html`, `css/styles.css` – DOM-Änderungen, Zoom-Out-Icon, 100-px-Panel und Responsive-Positionierung
- `src/app.js`, `src/ui/scene-mode.js`, `src/ui/object-details.js` – Ereignisse, ARIA, Parent-Ziele und Detailaktionen
- `src/renderer/renderer.js`, `src/renderer/scene.js`, `src/data/orbital-math.js`, `src/data/layers.js` – lokales Zwergplanetensystem und Layerverfügbarkeit
- `package.json`, `sw.js` – Version und PWA-Cache
- `README.md`, `docs/ARCHITECTURE.md`, `docs/HILFE.md` – Dokumentation
- `tests/` – aktualisierte Regressionstests plus `scene-actions-v26.test.mjs`

## Prüfung

- Gesamter Katalog wird über `npm run check` validiert.
- Node-Regressionstests decken Standardlayer, PWA-Cache, Bedienung, neue Zwergplanetenansicht und den Parent-Wechsel von Monden ab.
- Responsive Layout isoliert im Headless-Browser bei 320, 375, 920 und 1360 px geprüft. Ein vollständiger GPU-/WebGL-End-to-End-Test ist davon zu unterscheiden.

**Installation:** Das v26-Delta direkt über die vollständige v25-Arbeitskopie entpacken und Dateien ersetzen. Kein vollständiges Projekt-ZIP.
