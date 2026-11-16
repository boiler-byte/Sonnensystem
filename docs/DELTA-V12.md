# Delta v12 – lokale Texturen, Raumsonden und Zeitleiste

## Installation

Delta v12 über v11 entpacken. Eigene Texturdateien liegen in `textures/standard/` und werden nicht mit diesem Delta überschrieben oder mitgeliefert. Der Server liefert sie direkt vom lokalen Dateisystem. Unterstützt: `.jpg`, `.jpeg`, `.png`, `.webp`; Basisname ist die Objekt-ID (z. B. `earth.jpg`, `moon.png`, `titan.webp`); zusätzlich werden einige bekannte originale 2K-Dateinamen wie `2k_earth_daymap.jpg` erkannt. Die Auflösung wird bei der GPU-Übertragung begrenzt: mobil 512, Sonnensystem 2048, Planetenansicht 4096 Pixel. Die Auflösung einer kleineren Quelldatei wird nicht künstlich erhöht.

**Keine CORS- oder externen Texturzugriffe:** v11-Fallback auf Fremdhosts und v11-Server-Downloadproxy entfallen. Fehlende Karten werden schematisch dargestellt. Die eigenen Bilddateien sind nicht Bestandteil dieses Deltas. Bei anderen Dateinamen müssen Dateien entsprechend umbenannt werden.

## Raumsonden

Die Kategorie **Raumsonden** enthält Voyager 1/2, Pioneer 10/11, New Horizons, Cassini, Galileo und Huygens mit Startdatum, Zielen, Missionsstatus und Link zur NASA-Quellseite. Missionsdaten sind getrennt von künstlichen Erdsatelliten. **Keine erfundenen Positionsdaten oder Keplerbahnen:** Für die Sonden werden keine 3D-Positionen gezeichnet. Missionsstatus sind redaktionelle Momentaufnahmen, keine Live-Telemetrie.

## Zeitleiste

Play/Pause ist ein reiner Icon-Button mit SVG-Pfad. Das Datum wird nach `DD.MM.YYYY hh:mm` in der lokalen Browser-Zeitzone im Heute-Button angezeigt. „Heute“ setzt den Zeitsimulationswert auf `Date.now()`. Die obere Zeile „Zeitreise“ wurde entfernt. Die separat gespeicherten Geschwindigkeitsbereiche aus v10 bleiben bestehen.

### Aufräumen nach dem Update

Die beiden v11-Dateien `server/providers/textures.mjs` und `scripts/cache-textures.mjs` werden in v12 nicht mehr importiert bzw. aufgerufen. Beim Überlagern eines Delta-ZIPs bleiben ältere, nicht mehr benötigte Dateien auf der Festplatte; sie können daher gelöscht werden. Die Anwendung führt unabhängig davon keine externen Texturabrufe aus.
