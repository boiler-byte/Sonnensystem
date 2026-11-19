# Sonnensystem – interaktiver 3D-Atlas (v68.0.0)

Browserbasierter Sonnensystematlas mit WebGL, lokalem Katalog, deutschsprachigen Objektartikeln, Planetenansichten, AR-Blicksteuerung und Offline-PWA. Kein Frontend-Buildprozess und keine Laufzeit-Abhängigkeiten aus npm.

## Start und Prüfung

Voraussetzung: **Node.js 20 oder neuer**. Im Projektverzeichnis:

```sh
npm start
```

Anschließend `http://localhost:4173` öffnen. Optional kann `PORT` in `.env` konfiguriert werden; `.env.example` zeigt die unterstützten Variablen. Für optionale externe Datendienste sind Kontaktdaten oder API-Schlüssel erforderlich. Lokale Katalog- und Redaktionsdaten funktionieren ohne diese Dienste.

```sh
npm run check         # Katalogvalidierung und komplette Regressionstests
npm run check:data    # Nur Katalog und redaktionelle Daten prüfen
```

## Aktuelle Funktionen

- **Szenen:** Sonnensystemübersicht und Planeten-/Zwergplanetensysteme; Objektfokus, Nachführung und drei Kameraperspektiven.
- **Kamera:** Maus, Touch und Tastatur; per Smartphone-Orientierungssensor optional AR-Blicksteuerung (nur auf geeigneten Geräten in sicherem Kontext).
- **Darstellung:** getrennte Objektkategorien, Beschriftungen, Beleuchtung, Monde, Umlaufbahnen und Kontrast; unabhängig gespeicherte Ansichtsoptionen.
- **Maßstab:** Objektgrößen, Bahnabstände, Reihenansicht und Cinema-Kamerafahrt bei passender Schalterkombination.
- **Zeit:** Simulationsgeschwindigkeit und Datum; schematische Bahnen sind keine präzisen Ephemeriden.
- **Katalog:** 192 Himmelskörper und 192 deutsche redaktionelle Einträge; getrennte JSON-Dateien mit stabilem ID-Bezug und Quellenangaben.
- **Offline:** App-Shell und Katalogdaten werden vom Service Worker gespeichert; lokale Texturen werden bei Bedarf gecacht. API-Daten sind nicht Bestandteil des Offline-Caches.

## Projektaufbau

| Pfad | Aufgabe |
|---|---|
| `index.html`, `css/`, `icons/` | Oberfläche und PWA-Assets |
| `src/app/` | Start, Laufzeit, Kamera, AR, Animation und Katalog-Workflows |
| `src/renderer/` | WebGL, Szenen, Orbits, Labels, Texturen |
| `src/ui/` | Interaktion, Detailansicht, Katalog, Layer und Zeitleiste |
| `src/data/` | Katalogadapter, Schichtmodell und Bahnberechnungen |
| `data/catalog/`, `data/editorial/` | Astronomische und redaktionelle JSON-Datensätze |
| `server/`, `src/services/` | Lokaler Server und optionale externe API-Aufrufe |
| `scripts/`, `tests/` | Katalogprüfung, Wartungswerkzeuge und Regressionstests |
| `sw.js` | Offline-Cache mit manifestgesteuerten Katalogdaten |

## Dokumentation

- [Bedienungsanleitung](docs/HILFE.md) – aktuelle Bedienoberfläche, Kamera, AR, Layer und Cinema.
- [Architektur](docs/ARCHITECTURE.md) – Modulgrenzen, Datenfluss, WebGL, Service Worker und Teststrategie.
- [Datenarchitektur](docs/DATA-ARCHITECTURE.md) – JSON-Schema, Quellen und Grenzen der Modelle.
- [Texturquellen](docs/TEXTURE-SOURCES.md) – Bild- und Quellenangaben.
- [Versionshistorie](docs/RELEASE-HISTORY.md) – ältere Delta-Dokumente v2–v67 und Hotfix v6.1 in einem Archiv.
- [Projektpflege](docs/MAINTENANCE.md) – Releases, Prüfungen und Änderungen durch v68.

## Update auf v68

Das Paket `Sonnensystem-Delta-v68.zip` ist für **v67** vorgesehen. Entpacken und Dateien überschreiben, dann im Projektverzeichnis **`node apply-v68.mjs`** ausführen. Der Updater entfernt die 67 zuvor ausgelieferten historischen Delta-/Hotfix-Dokumente und die vier durch Umbenennung abgelösten Testdateien, jeweils nur bei unverändertem Inhalt, und anschließend sich selbst. Veränderte Dokumente werden sicherheitshalber **nicht** gelöscht.

Die App-Version ist `68.0.0`, der PWA-Cache heißt `sonnensystem-shell-v68`. Nach der Aktualisierung die App neu laden. Für eine neue Installation ist das vollständige Projektarchiv ausreichend.

## Wissenschaftliche Grenzen

Körperpositionen und Bahnen dienen der anschaulichen Darstellung. Historische, mittlere und vereinfachte Orbitparameter liefern **keine** hochgenauen Echtzeit-Ephemeriden. Fehlende Größen werden nicht erfunden. Weitere Hinweise stehen in der Datenarchitektur und den jeweiligen Objektdetails.
