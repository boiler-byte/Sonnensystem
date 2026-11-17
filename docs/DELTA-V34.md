# Delta v34 – Beleuchtung als An/Aus-Schalter

## Änderung

Im Control-Panel / Layer-Dropdown zeigt der Toggle **Beleuchtung** nur noch **Aus** oder **An**:

- **Aus (Standard):** optimierter Beleuchtungsmodus; hellere unbeleuchtete Planetenseite.
- **An:** realistische Beleuchtung wie in v28.

`aria-pressed` und die aktive Schalterdarstellung folgen dem Zustand **An = Realistisch**. Titel und barrierefreier Name sind darauf abgestimmt. Die Standard-Beleuchtung bleibt intern `optimized` und wird weiterhin getrennt für Sonnensystem- und Planetenansicht verwaltet. Keine Änderung an Shader, Lichtberechnung oder den anderen Toggles.

## Geänderte Dateien

`src/app.js`, `index.html`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/DELTA-V34.md` und Regressionstests.

## Installation

**Delta v34** über eine vorhandene **v33**-Installation entpacken und die gleichnamigen Dateien ersetzen. Danach die Seite / PWA neu laden, damit `sonnensystem-shell-v34` aktiv wird.
