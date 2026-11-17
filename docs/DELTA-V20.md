# Delta v20 – Zeitregler, Beschriftung und mobiles Control-Panel

**Basis:** v19. Dieses ZIP enthält ausschließlich die neuen oder geänderten Dateien. Für die Installation direkt im vorhandenen v19-Workspace-Root entpacken und die gleichnamigen Dateien überschreiben. `textures/standard/`, Katalog-JSON und Server-APIs bleiben unverändert.

## Änderungen

1. **Zeitsteuerung:** Der vertikale 241-Stufen-Range-Slider hat in Chromium/WebKit und Firefox einen **26 × 26 px großen, hellen Griff** mit dunklem Rand und farblichem Außenring. Die Spur bleibt dunkel, der Touch-Bereich ist 44 px breit. Geschwindigkeit, Grenzen und Play/Pause-/Heute-Verhalten bleiben unverändert.
2. **Objektlayer:** Der **Beschriftung**-Schalter (An/Aus) wurde mit seiner bestehenden `toggle-labels`-ID und Renderer-Anbindung in das Layer-Dropdown versetzt. Ein zugänglicher gedrückter Zustand und die sichtbare Anzeige werden bei jedem Umschalten aktualisiert. „Übersicht“ bleibt als eigener Button im Control-Panel.
3. **Standardansicht:** Der Startwert für **Umlaufbahn-Kontrast ist aus** (`orbitContrast:false`). Umlaufbahn und Farben bleiben aktiviert; Beschriftungen ebenfalls. Der Kontrastschalter zeigt von Beginn an „Aus“ und lässt sich unabhängig einschalten.
4. **Mobil bis 770 px:** Das Sheet besitzt nur noch **Objekte** und **Details**; der Tab „Steuerung“ entfällt. Das **vollständige Control-Panel** mit Ansicht, Objektlayer, Zeit und Übersicht bleibt im Viewport oben rechts und wird nicht mehr in das Sheet verschoben. Dropdowns öffnen wie auf Desktop rechtsbündig unter ihren Auslösern. Die Layerliste kann auf kleinen Geräten intern gescrollt werden. Bei Öffnen eines Sheet-Tabs werden offene Menüs geschlossen.

## Technische Änderungen

- Markup: `index.html`; responsive Styles und Range-Slider-Pseudoelemente: `css/styles.css`.
- Zustand und Schalter-Synchronisation: `src/app.js`; nur noch zwei mobile Sheet-Panels und kein DOM-Verschieben des Übersicht-Buttons: `src/ui/bottom-sheet.js`.
- Version: `package.json` = `20.0.0`, Header `V20.0`, Service-Worker-Cache `sonnensystem-shell-v20`.
- Aktualisierte Regressionstests und zusätzliche v20-Prüfungen; `README.md` beschreibt die neue Steuerung.

## Verifikation

`npm run check` prüft Katalog, Anwendungsmodule, PWA und UI-/Steuerungs-Regressionen. Der Renderer und die logarithmischen Bereiche werden nicht verändert. Die visuellen Browserprüfungen sind von der Ausführungsumgebung abhängig.
