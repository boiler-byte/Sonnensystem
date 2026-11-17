# Delta v25 – Objektlayer-Standards und kompaktes Dropdown

**Basis:** v24. Dieses Delta wird in das vorhandene Projektverzeichnis über v24 entpackt; andere Projektdateien bleiben unverändert.

## Neue Standardfilter

| Ansicht | Standardmäßig aktiv | Standardmäßig inaktiv |
| --- | --- | --- |
| Sonnensystem | **Sterne, Planeten** | Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen, Raumsonden |
| Planetenansicht | **Planeten, Monde, Satelliten** | alle übrigen, sofern sie beim aktuellen Planeten überhaupt vorkommen |

`STANDARD_LAYERS` ist jetzt `['star','planet']`; `PLANET_STANDARD_LAYERS` bleibt `['planet','moon','satellite']`. Beide Ansichten besitzen weiter unabhängige gespeicherte Renderlayer- und Bahneinstellungen. Die Anzeige im Objektkatalog bleibt unabhängig von den Renderfiltern.

## Layer-Dropdown

- **Breite:** 152 px statt 227 px (−33 %); auf Mobilgeräten weiterhin an die Viewport-Breite begrenzt und bei Bedarf scrollbar.
- **Presets:** „Alle“ und „Standard“ erscheinen als zwei zusammenhängende Segmente eines Schalters mit gemeinsamem Hintergrund und aktiver Hervorhebung. Die Trennlinie unter den Presets entfällt; Checkboxen bleiben einzeln wählbar. Bei individuellen Kombinationen ist kein Preset-Segment aktiviert.
- **Überschriften:** die sichtbaren Texte „Objektlayer“, „Umlaufbahnen“ und „Beschriftung“ wurden entfernt. Zugängliche Gruppenbeschriftungen bleiben erhalten.
- **Orbit-Steuerung:** „Umlaufbahn“ bleibt der Hauptschalter; „Kontrast“ und „Farben“ sind leicht eingerückt. Der zusätzliche Hinweisabsatz `.orbit-popover-note` wurde entfernt.
- **Beschriftungen:** Der ursprüngliche Toggle bleibt unverändert, nur die darüberliegende Zwischenüberschrift entfällt.
- **Hinweistext:** `#layer-note` zeigt die modusspezifische Standardauswahl kompakt an.

## Betroffene Dateien

- `src/data/layers.js` – modusspezifische Standardliste
- `index.html` – segmentierter Umschalter, reduzierte Überschriften, eingerückte Unteroptionen, Solar-Checkbox-Startwerte
- `css/styles.css` – schmaleres Dropdown und kompakter Umschalter
- `src/app.js` – knapper modusspezifischer Standardhinweis
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md` – Dokumentation
- `sw.js`, `package.json` – PWA-Cache und Paketversion v25
- `tests/` – aktualisierte Bestandsprüfungen und v25-Regressionstests

Prüfung mit `npm run check`.
