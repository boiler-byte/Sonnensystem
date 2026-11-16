# Delta v16 – Standard-Sterne und stabile Label-Dichte

Basis: v15. Installieren: ZIP direkt über v15 entpacken und gleichnamige Dateien ersetzen. Lokale Texturen bleiben unverändert.

## Layer

- `Standard`: Planeten + Monde + Sterne (einschließlich Sonne).
- `Alle` und individuelle Kategorien bleiben unverändert.
- Katalog, Szene, Labels und Orbitlayer verwenden weiterhin dieselbe Layer-Auswahl.

## Beschriftungen

- Entfernt die automatische Unterdrückung wegen Überlappung von Texten oder Planetenscheiben.
- Pro Zelle von 160 × 110 CSS-Pixeln maximal zwei nicht ausgewählte Beschriftungen; ausgewählte Objekte sind zusätzlich immer zulässig.
- Prioritätsreihenfolge und Bonus für bislang sichtbare Labels bleiben erhalten.
- Die Rasterzelle bleibt bei kleinen Bewegungen über Zellgrenzen durch 18 px Randpuffer stabil.
- Die bisherige Label-Seite bleibt erhalten und ändert sich nur, um den sichtbaren Bildschirm nicht zu verlassen.
- Der unabhängige Geschwindigkeitsfilter und der manuelle Namen-Schalter bleiben erhalten.

## Validierung

- `npm run check`: 71 automatische Prüfungen einschließlich vier neuer v16-Tests.
- Das Delta enthält keine Texturdateien und ändert keine Katalogdaten.
