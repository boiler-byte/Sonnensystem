# Delta v23 – getrennte Objektlayer und 5 Tage/s

**Basis:** v22. Dieses Delta-ZIP enthält ausschließlich neue oder geänderte Dateien. Direkt über eine v22-Installation im Workspace-Root entpacken und bestehende Dateien ersetzen. Katalogdaten, Texturen und Server-APIs sind unverändert.

## Sonnensystem: Zeitsteuerung

- Die Standardgeschwindigkeit der **Sonnensystemansicht** beträgt jetzt **5 simulierte Tage pro realer Sekunde** (`SPEED_MODES.solar.defaultSpeed = 5`). Der Start- und Dropdownwert im HTML zeigt `5 Tage / s`.
- Der vorhandene 241-Stufen-Regler bleibt logarithmisch. Sein Standardpunkt liegt bei **Stufe 101** (statt 23), damit die Sprünge unterhalb und oberhalb des neuen Standards ähnlich groß sind. Die Grenzen bleiben **1 Stunde/s** bis **10 Jahre/s**.
- Die **Planetenansicht** startet weiterhin mit **1 Stunde/s**, von **1 Minute/s** bis **1 Jahr/s**. Selbst gewählte Geschwindigkeiten bleiben wie bisher je Ansicht getrennt erhalten; Play/Pause und Simulationszeit werden nicht zurückgesetzt.

## Objektlayer: unabhängige Ansichten

- `S.viewSettings.solar` und `S.viewSettings.planet` verwalten jeweils eine eigene Auswahl für **Objektkategorien**, **Umlaufbahn ein/aus**, **Kontrast**, **Farben** und **Beschriftung**. Ein Ansichtswechsel aktiviert die bereits vorhandenen Werte des betreffenden Modus; er überschreibt die Werte des anderen Modus nicht.
- **Standard Sonnensystem:** Planeten, Monde und Satelliten **sowie Sterne**, damit die Sonne als Zentrum weiterhin sichtbar ist.
- **Standard Planetenansicht:** Planeten, Monde und Satelliten. Nicht vorhandene Kategorien erscheinen nicht als Optionen, behalten aber ihren Filterzustand für andere Planeten mit derselben Ansicht.
- Die **Planetenansicht zeigt nur Kategorien, die im Datensatz zum aktuellen Planeten vorkommen:** die Kategorie des Zentralplaneten und die Typen seiner direkten Kindobjekte (`parentId === planetId`). Der lokale Bestandskatalog bietet beispielsweise bei **Erde** Planeten, Monde und Satelliten, bei **Jupiter** Planeten und Monde. Sterne, Asteroiden, Zwergplaneten usw. fehlen in diesen Listen, solange keine passenden direkten Kindobjekte vorhanden sind.
- Änderungen an dynamisch geladenen Katalogdaten aktualisieren diese Verfügbarkeit. Sollte künftig z. B. ein Asteroid mit `parentId: 'earth'` vorkommen, wird dessen Kategorie für Erde angeboten und der Planet-Renderer berücksichtigt diesen direkten Orbiter.
- Die Voreinstellungen **Standard**, **Alle** und **Individuell** werden pro Ansicht getrennt berechnet. **Alle** aktiviert alle bekannten Typen im jeweiligen Ansichtsstatus; im Dropdown bleiben davon nur die vor Ort vorhandenen Typen sichtbar. Es kann nicht versehentlich die letzte in der aktuellen Szene verfügbare Kategorie abgewählt werden.
- Katalog und WebGL verwenden unverändert denselben gerade aktiven Layerstatus. Der Objektkatalog bleibt durchsuchbar; die dynamische Typenverfügbarkeit betrifft die **Checkboxen des Layer-Dropdowns**.

## Technische Änderungen

- `src/data/layers.js`: Standards pro Ansicht, Verfügbarkeit anhand der Eltern-Kind-Daten, unabhängige Zustandserzeugung und Schutz vor einer vollständig leeren lokalen Auswahl.
- `src/app.js`: aktiven Zustand beim Szenenwechsel wechseln; Dropdown-Optionen dynamisch zeigen/ausblenden; Kategorie-/Bahn-/Label-Toggles im jeweils aktuellen Zustand halten.
- `src/renderer/planet-view.js`: lokal gerenderte Begleiter aus allen direkt zugeordneten, positionierbaren Kategorien ableiten (bisher fest auf Monde/Satelliten beschränkt).
- `src/ui/timeline.js`, `index.html`: neuer Sonnensystem-Startwert und Slider-Pivot.
- `css/styles.css`: nicht verfügbare Layer-Optionen zuverlässig per `[hidden]` ausblenden.
- `package.json`, `sw.js`, `index.html`: Versionskennzeichnung v23 und neues PWA-Cache-Präfix `sonnensystem-shell-v23`.
- `tests/view-layers-speed-v23.test.mjs`: neue Regressionstests für die beiden Presets, verfügbare Kategorien, den Filter-/Orbit-/Label-Zustand, Renderbarkeit und 5 Tage/s. Bestehende Tests wurden an die neue Standardwahl angepasst.

## Prüfen

```bash
npm run check
```

Die Testausführung validiert den Katalog und prüft anschließend die Node-Regressionssuite. Offline-PWA-Installationen verwenden mit v23 einen neuen Cache und aktualisieren nach Neuladen der App-Shell die geänderten Module.
