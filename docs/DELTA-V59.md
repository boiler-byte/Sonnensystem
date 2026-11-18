# Delta v59 – Layer-Dropdown: feste Breite 155 px

## Änderung

- Das Dropdown `#layer-popover` erhält **155 px Breite** (`box-sizing: border-box`).
- Die bestehende responsive Maximalbreite `calc(100vw - 20px)` bleibt erhalten.
- Die veralteten Breitenangaben in früheren CSS-Regeln (145, 152 und 232 px) sind auf denselben Wert abgeglichen, damit keine widersprüchlichen Deklarationen mehr existieren.
- Presets, die fünf Darstellungs-Toggles und Objektkategorien behalten ihre Funktion und Reihenfolge.

## Installation

`Sonnensystem-Delta-v59.zip` über einen vollständigen **v58**-Stand entpacken. Projektversion `59.0.0`; PWA-Cache `sonnensystem-shell-v59`.

## Validierung

`npm run check` prüft den Objektkatalog, bestehende Tests und den neuen Regressionstest `tests/layer-popover-width-v59.test.mjs`.
