# Sonnensystem v8.0 – echter Katalogbestand und Redaktion

## Inhalt gegenüber v7

- **123 reale neue Objekte**: 120 Planetenmonde, `(3) Juno`, `1P/Halley`, `2P/Encke`.
- **160 Objekte insgesamt**: Stern 1, Planeten 8, Monde 136, Zwergplaneten 5, Asteroiden 6, Kometen 2, künstliche Satelliten 2.
- **160 deutsche Artikel**: alle 37 bisherigen Texte erhalten und erweitert, 123 neue Texte, für 69 Objekte zusätzlicher wissenschaftlicher Hintergrund.
- **Neue Datenpakete**: neun Mond-Kategoriedateien und je eine Asteroiden- und Kometendatei; zwei zusätzliche Redaktionsdateien.
- **Loader**: Unterstützt mehrere redaktionelle Dateien pro Sprache mit globaler Duplikatprüfung; Datenherkunft und Bahnmodell werden an das UI weitergegeben.
- **Detailansicht**: Zeigt bei JPL-Importen die Einschränkungen des verwendeten Bahnmodells.
- **Offline-PWA**: Neuer Cache `sonnensystem-shell-v8`; manifestgesteuert werden alle JSON-Dateien offline gespeichert.
- **Bestehende Funktionen**: Kamera, Gesten, Pfeiltasten, Planetensystemansicht, API-Proxies und Workspace-Root bleiben erhalten.

## Quellen

- NASA/JPL – [Planetary Satellite Mean Elements](https://ssd.jpl.nasa.gov/sats/elem/sep.html)
- NASA/JPL – [Physical Parameters of Natural Satellites](https://ssd.jpl.nasa.gov/sats/phys_par/)
- NASA/JPL – [Small-Body Element Tables](https://ssd.jpl.nasa.gov/sb/elem_tables.html)
- NASA Science – Direktverweise in den einzelnen Redaktionsartikeln

### Einschränkungen

- Schematische Darstellung **keine aktuelle Ephemeride**. Bezugsrahmen der Mond-Tabellen wurden nicht vollständig transformiert. Historische Kometenbahnen unterliegen nicht der dynamischen Störungsrechnung.
- Fehlende Radien wurden nicht erfunden (`radiusKm: 0` ist ein technisches Fehlwert-Sentinel).
- Artikelstatus `imported` statt ungeprüftem `published`.
- Bei sehr vielen weiteren Objekten sind Performance-/Renderer-Optimierungen notwendig.

## Prüfschritte

`npm run check:data` validiert Katalog und redaktionelle Verweise. `npm run check` prüft auch Schemafehler, Duplikate, Loader, Layout-Logik, Bedienung, planetenzentrierte Ansicht, PWA-Offline-Dateiliste und HTTP-Auslieferung.

Das Projekt wird als **vollständiges ZIP ohne übergeordneten Ordner** geliefert und wird direkt in das Workspace-Root entpackt. Eine v7-Installation kann durch Überlagern der neuen Dateien aktualisiert werden; nicht mehr benötigte Dateien bleiben dann aber liegen. Sauberer ist ein frischer Workspace-Ordner, in den bei Bedarf die `.env` übernommen wird.
