# Delta v4 – Sonnensystem: Bewegungen in der Umlaufbahnebene

Dieses Paket aktualisiert ein **Sonnensystem-v3-Projekt** auf v4. Es enthält ausschließlich
Dateien, die sich gegenüber der vorherigen `Sonnensystem-Delta-v3.zip` geändert haben,
sowie einen neuen Test und diese Anleitung.

## Installation

1. Vorhandenes Sonnensystem **v3** nicht löschen.
2. Die Dateien aus `Sonnensystem-Delta-v4.zip` im **Stammverzeichnis** des Projekts
   entpacken (neben `renderer.js`, `index.html`, `server.mjs`), bestehende Dateien ersetzen.
3. Falls der Server bereits läuft, Anwendung im Browser neu laden. Bei installierter PWA
   nach Aktualisierung des Service Workers gegebenenfalls **nochmals** neu laden.
   Der Offline-Cache heißt nun `sonnensystem-shell-v4`.
4. Optional: `npm run check` (Node.js 20+).

**Voraussetzung:** v3 ist bereits installiert. Für ein Projekt auf v2 zuerst
`Sonnensystem-Delta-v3.zip`, danach dieses Delta einspielen.

## Steuerung v4

Alle manuellen Verschiebungen laufen **parallel zur Umlaufbahnebene (X/Z)**,
also wie bei einer Draufsicht. Sie richten sich nach der **horizontalen Blickrichtung**
(`theta`), aber **nicht** nach dem Kameraneigungswinkel (`phi`). Die Blickhöhe (Y) bleibt
beim Verschieben konstant, auch bei sehr flachem Blickwinkel.

- **Rechte Maustaste ziehen** oder **Umschalt + links ziehen**: Szene folgt dem Zug;
  keine Verzögerung oder Höhenverschiebung.
- **Pfeiltasten**: Kamera bewegt sich im Feld nach links/rechts/vorn/zurück.
  Gehaltene Tasten bewegen kontinuierlich, diagonal ohne Geschwindigkeitsgewinn.
- **Zwei Finger gemeinsam wischen**: Verschiebung über dasselbe Feld;
  gleichzeitiges Spreizen/Zusammenziehen zoomt weiterhin.
- **Unverändert:** Linke Maustaste/ein Finger zum Umschauen, Mausrad bzw.
  Spreizbewegung zum Zoomen, Auswahl und automatischer Fokus.

## Delta-Dateien

- `renderer.js` – einheitliche X/Z-Bewegungsbasis statt neigungsabhängiger Bildebene
- `index.html` – Versionsanzeige und Bedienhinweise
- `sw.js` – neuer Service-Worker-Cache für PWA-Updates
- `README.md` – aktuelle Steuerungsbeschreibung
- `package.json` – v4 und neuer Testlauf
- `test-v3.mjs` – bestehende Regressionstests an neue Navigation und Version angepasst
- `test-v4.mjs` – neue Tests der Neigungswinkelunabhängigkeit für alle Eingabewege
- `DELTA-V4.md` – dieses Änderungsprotokoll

Keine neuen Abhängigkeiten. Alle übrigen Dateien bleiben unverändert.
