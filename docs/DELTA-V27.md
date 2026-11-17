# Delta v27 – Viewport, Detailindex und mobiles Sheet

## Änderungen gegenüber v26

### Viewport-Aktionen

- Der einzige gerahmte, kreisrunde Kamera-Reset (`#reset-camera`) bleibt an `.viewport-actions` gebunden, wird aber von oben rechts nach **unten rechts** verschoben.
- Mobil liegt die Taste über dem geschlossenen Sheet-Header, um erreichbar zu bleiben. Beim Öffnen des Sheets wird die entsprechende Szenenfläche wie bisher überdeckt.

### Control-Panel

- `.viewport>.control-panel`: **width: 58px; padding: 0; border: 0; background: none**; auch Schatten und Hintergrundunschärfe des Panel-Containers entfallen.
- Die zwei Auslöser (`#layer-btn`, `#speed-btn`) besitzen **keine Dropdown-Pfeile** mehr. Alle SVG-Hauptsymbole, Texte, ARIA-Informationen und Klickfunktionen bleiben.
- Das Layer-Popover bleibt 152 px breit. Das Zeit-Popover ist bewusst **116 px breit**, unabhängig von der 58-px-Auslösertaste, damit Slider, Play/Pause, Heute und Datum weiterhin nutzbar sind.

### Objektdetails

- Im `detail-top` ergänzt eine Pfeilnavigation (`#detail-prev` / `#detail-next`) den Index (`#detail-index`). Die Elemente sind betitelte Buttons mit SVG-Pfeilen und zugänglichen Namen.
- Vorheriges/nächstes Objekt bezieht sich auf dieselbe **Objektkategorie** wie der angezeigte Index, einschließlich Raumsonden. Die Navigation ist zyklisch. Bei fehlender Auswahl oder nur einem Objekt sind beide Tasten deaktiviert.
- Ein Klick übernimmt das neue Objekt über den bestehenden `selectBody`-Pfad für Details, Katalog, Szene und mobile Anzeige.

### Mobile Ansicht

- Das separate DOM-Element `#sheet-handle` mit dem `.sheet-grabber` ist entfernt.
- Der gesamte Header `#sheet-header` übernimmt Wischgesten; ein Tipp auf freie Flächen oder die Tastatur (Eingabe/Leertaste) schaltet die Snap-Stufen weiter. Die Tabs wählen weiterhin unabhängig Katalog oder Details.
- **Scroll-Fix:** Das unten fixierte Sheet erhält bei `closed`/`half`/`full` die tatsächliche sichtbare Höhe über `--sheet-visible`, statt eine unsichtbare Vollhöhe nur zu verschieben. Für `half` entspricht damit die scrollbare Höhe genau dem sichtbaren Inhaltsbereich. Katalog- und Details-Scrollbereiche erreichen ihre letzten Einträge; Safe-Area-Padding bleibt erhalten.

## Geänderte Dateien

- `index.html`, `css/styles.css`
- `src/app.js`, `src/ui/object-details.js`, `src/ui/bottom-sheet.js`
- `package.json`, `sw.js`
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V27.md`
- Aktualisierte Versions-/Verhaltenstests unter `tests/`, einschließlich `viewport-detail-sheet-v27.test.mjs`

## Prüfung

- `npm run check`: Katalogvalidierung und 122 Node-Tests bestanden.
- Isolierte Chromium-Layoutprüfung bei **320, 375, 920 und 1360 px**: Panel 58 px, transparent und rahmenlos; Reset unten rechts; beide Popover innerhalb des Viewports.
- Bei 320/375 px: das halb geöffnete Sheet kann in Katalog und Details bis zum letzten Eintrag gescrollt werden; Header-Klick wechselt zum Vollbild; geschlossen ist ausschließlich der Header sichtbar.
- Die vollständige GPU-/WebGL-Integration wurde nicht über einen echten Server im Browser ausgeführt.

**Installation:** Das Delta v27 direkt über die bestehende vollständige v26-Arbeitskopie entpacken und Dateien ersetzen. Das ZIP enthält nur neue oder geänderte Dateien, kein vollständiges Projekt.
