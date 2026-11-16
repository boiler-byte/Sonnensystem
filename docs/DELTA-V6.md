# Version 6 – Vollständige Umstrukturierung

**Ausgangsbasis:** vollständiger Projektstand v5 (mit allen vorherigen v2–v5 Änderungen). **Art:** komplette Ausgabe, **kein Delta-ZIP**.

## Änderungen

* Die ursprüngliche Root-Oberfläche wurde nach `public/` verschoben, die Stilvorlage nach `public/css/`.
* Der einst monolithische 3D-Renderer wurde in separate Module für WebGL, Shader, Geometrie, Kamerasteuerung, Umlaufbahnen, Labels sowie die beiden Darstellungsmodi geteilt.
* Startdaten, Bahnberechnung und Daten-Normalisierung sind jetzt getrennt in `src/data/` organisiert.
* Katalog, Objekt-Details, Mobilmenü, Ansichtsmodus, Zeitleistenformate und Provider-Status sind in `src/ui/` ausgelagert.
* Die Browser-API-Anbindung ist in `src/services/` untergebracht.
* Der Node-Server wurde in `server/` nach HTTP-Routing, externen Providern, Konfiguration und Cache aufgeteilt. Die Startdatei ist `server/server.mjs`.
* Die PWA-Cache-Liste enthält nun **alle** statischen Browser-Module aus `src/`; Cache-Schlüssel `sonnensystem-shell-v6`.
* Tests wurden nach `tests/` verschoben und um Integrations-, Architektur- und Sicherheitsprüfungen ergänzt.
* `.env.example` und eine `.gitignore` sind enthalten.

## Nicht geändert

Das Benutzerverhalten aus v5 bleibt erhalten: Sonnen- und Planetenansicht, natürlicher und künstlicher Satellitenkatalog, rechte Maus, Shift-Maus, Pfeiltasten, Ein-/Zwei-Finger-Gesten, Bodenebenennavigation, Zeitreise, Suchfilter, mobile Menüs, PWA und alle vier externen Datenquellen.

Die Visualisierung bleibt bewusst schematisch und ist kein wissenschaftlicher Orbit-Simulator.

## Installation / Wechsel von v5

**Nicht** einfach auf die alte v5-Dateistruktur überlagern: Die alten Root-Dateien werden in v6 nicht mehr verwendet. Stattdessen:

1. Das vollständige `Sonnensystem-v6.zip` in ein neues Verzeichnis entpacken.
2. Die eigene `.env` bei Bedarf in das neue Projektverzeichnis kopieren. Keine privaten Schlüssel ins ZIP legen.
3. `npm start` aus dem Projektverzeichnis aufrufen.
4. Im Browser `http://localhost:4173` öffnen und bei bereits installierter PWA neu laden.
5. `npm run check` ausführen, um die lokale Runtime zu prüfen.

## Testumfang

* Regressionstests aus v2–v5: 37 Startkörper, Orbitberechnung, Maus-/Touch-/Pfeiltastenbewegung, neigungsunabhängiges Verschieben, Planetenszenen, Mobile-Bottom-Sheet, Offline-PWA.
* Neue Tests: Validierung aller relativen Modul-Imports, vollständige Offline-Dateiliste, HTTP-Auslieferung, API-Status und Fehlerrouten, Schutz privater Serverdateien, Provider-Normalisierung und UI-Ausgabe.
* **Noch offen:** visueller Chromium-End-to-End-Test sowie Prüfung auf echten mobilen Geräten. Der Browserzugriff war in der aktuellen Laufzeitumgebung eingeschränkt; die Tests wurden daher ohne visuelle Behauptungen abgeschlossen.
