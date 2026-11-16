# Version 7.0 – Datenarchitektur und Redaktionsschicht

**Basis:** Vollständiges v6.1 Workspace-Root-Projekt. **Auslieferung:** vollständiges Projekt, kein Delta.

## Neu

- Die 37 v6.1-Himmelskörper wurden ohne hinzugefügte Fantasiedaten in kategorisierte JSON-Dateien migriert (`data/catalog/`). Kometen sind als leere Kategorie vorbereitet.
- Ein versioniertes Manifest organisiert die astronomischen Dateien und den Sprachbestand.
- Sämtliche 37 alten Beschreibungen wurden unter `data/editorial/de.json` als `imported` übernommen. Redaktionelle Felder sind von physikalischen Daten getrennt; längere Artikelabschnitte und Quellenlinks werden unterstützt.
- Der Schema-Validator prüft Typen, Datenfelder, Einheiten, Orbitbedingungen, Parent-IDs, Zyklen, doppelte IDs und Redaktionsreferenzen; `npm run check:data` stellt ein CLI bereit.
- `src/data/catalog.js` kapselt den neuen Ladeweg, den Renderer-Adapter und das Merge-Verhalten, sodass externe API-Antworten redaktionelle Texte nicht überschreiben.
- Der Root-Node-Server liefert ausschließlich erlaubte JSON-Dateien aus `data/catalog/` und `data/editorial/` mit korrektem MIME-Typ.
- Der Service Worker verwendet `sonnensystem-shell-v7` und lädt Daten-Dateien dynamisch aus dem Manifest in den Offline-Cache.
- Die UI bietet einen vorbereiteten Kometenfilter und zeigt veröffentlichte redaktionelle Abschnitte und Quellen in den Objekt-Details.

## Unverändert

- 3D-Ansicht, Planetenansicht und „Übersicht“;
- bodenparallele Maus-, Touch- und Pfeiltastenbewegung;
- WebGL-Shader, Anzeige vorhandener Körper, Simulation und Zusatzdaten-APIs;
- Start über `npm start`, weiterhin ohne npm-Abhängigkeiten und ohne Frontend-Bundler;
- Einstiegspunkte direkt im Workspace-Root (kein `public/`).

## Noch nicht Bestandteil von v7

- Zusätzliche echte Himmelskörper und eigenständig recherchierte redaktionelle Artikel;
- automatischer Batch-Import aus externen Datenbanken bzw. ein CMS-Backend;
- Renderoptimierung für sehr große Kataloge oder hyperbolische Kometenbahnen.

Hinweise für Datenimporte und Quellennachweise: `docs/DATA-ARCHITECTURE.md`.
