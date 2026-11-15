# ORBITAL – 3D-Sonnensystematlas

Eine responsive **WebGL-App ohne externe JavaScript-Bibliotheken oder Build-Schritt**. Sie visualisiert Sonne, Planeten, Monde, Zwergplaneten, ausgewählte Asteroiden und künstliche Satelliten. Daten der vier genannten APIs werden **serverseitig** abgerufen und im Browser zusammengeführt.

## Start (Node.js 20 oder neuer)

```bash
cd helio-webgl
node server.mjs
```

Dann **http://localhost:4173** im Browser öffnen. Alternativ: `npm start` (kein `npm install` erforderlich).

Die 3D-Szene ist sofort nutzbar – auch ohne API-Schlüssel. Der kuratierte Startdatensatz enthält unter anderem alle acht Planeten, mehrere große Monde, Zwergplaneten, Asteroiden sowie **illustrative** Umlaufbahnen der ISS und des Hubble-Teleskops.

## API-Einstellungen

Kopiere `.env.example` nach `.env` und ergänze die Konfiguration:

```ini
SOLAR_SYSTEM_API_KEY=DEIN_KOSTENLOSER_TOKEN
NASA_CONTACT_EMAIL=deine-kontaktadresse@example.org
PORT=4173
```

Den kostenlosen Token gibt es unter https://api.le-systeme-solaire.net/generatekey.html. `SOLAR_SYSTEM_API_KEY` ist für Solar OpenData optional. **Für NASA/JPL-Abfragen ist `NASA_CONTACT_EMAIL` erforderlich**, damit die Anwendung eine kontaktierbare Kennung im User-Agent angibt und die Fair-Use-Regeln einhält. Verwende eine eigene gültige Adresse. Die App lädt die `.env`-Datei selbst; der Token bleibt **auf dem Server**.

## Enthaltene Integrationen

| Quelle | Verwendung | Wann wird geladen? |
|---|---|---|
| [Solar System OpenData](https://api.le-systeme-solaire.net/en/) | Planeten, Monde, Zwergplaneten, Kenndaten, Orbitalparameter | Automatisch bei Start, wenn Token gesetzt |
| [NASA/JPL SBDB](https://ssd-api.jpl.nasa.gov/doc/sbdb.html) | Individuelle Bahnelemente und physikalische Angaben für Asteroiden | Beim Auswählen eines Asteroiden oder über „Objekt hinzufügen“ |
| [CelesTrak](https://celestrak.org/NORAD/documentation/gp-data-formats.php) | Aktuelle OMM/GP-Elemente der Gruppe `STATIONS` (inkl. ISS) | Automatisch bei Start, höchstens einmal alle 2 Stunden pro Serverlaufzeit |
| [NASA/JPL Horizons](https://ssd-api.jpl.nasa.gov/doc/horizons.html) | Hochpräzise ekliptikale Ortsvektoren für Planeten, Pluto und Mond | Nur per Button „JPL Horizons abgleichen“ für das ausgewählte Datum |

Alle Datenabrufe laufen über `/api/...` auf dem lokalen Node-Server. Dadurch ist kein unsicherer Browser-Workaround für CORS nötig. JPL-Abfragen laufen **nacheinander** und werden zwischengespeichert, um die [Fair-Use-Regeln](https://ssd-api.jpl.nasa.gov/doc/index.php) zu berücksichtigen. Bei Fehlern oder fehlendem Schlüssel bleibt die Anwendung nutzbar und zeigt den Datenquellenstatus an.

### HTTP-Endpunkte

- `GET /api/status` – Server-/Schlüsselstatus
- `GET /api/bodies` – Solar OpenData-Katalog (API-Key benötigt)
- `GET /api/sbdb?sstr=433%20Eros` – NASA/JPL SBDB-Bahndaten
- `GET /api/satellites` – CelesTrak-Gruppe STATIONS als JSON
- `GET /api/horizons?target=399&date=2026-11-15` – ekliptikaler Positionsvektor der Erde um 00:00 UTC

## Bedienung

- **Maus ziehen / Touch**: Kamera drehen; **Mausrad**: zoomen; **Rechtsklick + ziehen**: verschieben.
- **Klicken** auf einen Körper oder auf einen Eintrag links: auswählen und heranzoomen.
- **Suche und Kategorien**: alle geladenen Objekte durchsuchen, auf Monde, Zwergplaneten, Asteroiden, Satelliten einschränken.
- **Zeitleiste**: Datum wählen, pausieren oder Simulationsgeschwindigkeit ändern.
- **Bahnen / Namen / Übersicht**: 3D-Ansicht anpassen.
- **NASA-Kleinkörper**: einen Asteroiden über seinen Namen oder seine Nummer ergänzen (z. B. `433 Eros`).
- **Horizons**: die dargestellte Position des ausgewählten Planeten, von Pluto oder des Mondes für den gewählten Tag mit NASA/JPL-Daten abgleichen.

## Fachliche Grenzen

**Die Darstellung ist ein didaktischer Atlas, kein präziser Orbit-Simulator.** Körperradien und Bahnabstände werden absichtlich stark und nichtlinear skaliert, um alle Regionen auf einer Leinwand sichtbar zu machen. Standardpositionen folgen einer vereinfachten Zwei-Körper-Kepler-Bewegung mit näherungsweisen Startbahnelementen. Neu geladene SBDB-Daten enthalten oskulierende Bahnelemente, die ebenfalls vereinfacht weitergerechnet werden. Eingeblendete Monde sind ausgewählt, der Katalog kann weitere enthalten.

CelesTrak liefert aktuelle OMM/GP-Daten, die hier zur Illustration **nur mit einer Kepler-Näherung statt SGP4** ausgewertet werden; damit sind die dargestellten Satellitenpositionen **nicht** zur Echtzeit-Ortung geeignet, insbesondere außerhalb der Daten-Epoche. Für eine wissenschaftlich genaue Darstellung kann diese Berechnung später mit SGP4 (z. B. `satellite.js`) ersetzt werden.

Horizons-Vektoren sind präzise Daten für **00:00 UTC des angegebenen Datums**, werden aber beim Rendern auf die schematische Szenenskala transformiert. Der Nutzer sieht die exaktere Richtungsangabe, keine maßstabsgetreue reale Position. Bei erneutem Datumswechsel wird die normale Simulation genutzt.

## Projektdateien

- `index.html` – App-Oberfläche
- `styles.css` – responsive Gestaltung
- `data.js` – eingebaute Beispielobjekte und Objektdefinitionen
- `renderer.js` – eigenständiger WebGL-Renderer (Shader, Licht, Kamera, Bahnen, Labels)
- `app.js` – Suche, Auswahl, Datenintegration, Zeitleiste
- `server.mjs` – Node-HTTP-Server und API-Proxies mit Cache

Keine Frameworks, externen CDNs, Fonts oder Bilder erforderlich. Firefox/Chromium/Edge mit WebGL-Unterstützung empfohlen.
