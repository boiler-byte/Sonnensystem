# Delta v35 – Sichtbare Höhe des eingeklappten Mobile-Sheets

## Änderung

- **Geschlossenes Mobile-Sheet:** `--sheet-visible` von **52 px** auf **45 px** reduziert.
- **Kopfzeile:** die Tab-Leiste ist 44 px hoch; mit dem 1 px unteren Rahmen beträgt die gemessene Sheet-Höhe **45 px**. Beim Laden und bei erneutem Einklappen verwendet die Sheet-Steuerung diesen Messwert.
- **Kamera-Schaltfläche:** erhält dieselbe neue `--sheet-visible`-Höhe und bleibt unverändert 12 px (mindestens) über dem Sheet.
- **Unverändert:** halb und voll geöffnetes Sheet, Drag-/Wischgesten, Verlauf-Zurück, Desktop.
- CSS-Fallbacks für Sheet und Kamera-Schaltfläche angepasst. PWA-Cache zu `sonnensystem-shell-v35` erhöht.

## Prüfung

`npm run check` und Delta-Overlay über v34.

## Installation

**Delta v35** über eine vorhandene **v34**-Installation entpacken und gleichnamige Dateien ersetzen. Seite/PWA neu laden, damit der neue Cache aktiv wird.
