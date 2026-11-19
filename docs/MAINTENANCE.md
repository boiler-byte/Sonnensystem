# Projektpflege und Releases

## Prüfungen

`npm run check` führt Katalogprüfung und alle Verhaltenstests aus. Neue Regressionen gehören in einen passenden Feature-Test; Versionsnummern dürfen nur an einer Stelle geprüft werden: `tests/release-contract.test.mjs` liest die Paketversion und vergleicht sie dynamisch mit HTML-Metadaten, Service-Worker-Cache und dokumentiertem Release.

Vor Auslieferung zusätzlich prüfen: ES-Module auflösbar, Offline-Shell vollständig, lokale Daten und Quellen validiert, keine toten relativen Dokumentationslinks und Delta-Paket auf Basis des **veröffentlichten** vorherigen Releases reproduzierbar. Ein automatisierter Test ersetzt keine visuelle Prüfung der tatsächlichen Oberfläche.

## Änderung in v71

Nur das **vertikale Zwei-Finger-Umschauen** in der freien Perspektive (`selectedId === null`) wird in `src/renderer/controls.js` gedreht: Wischen nach unten richtet den Blick nach oben. Rechtsklick-Umschauen, Objektorbit, horizontale Gesten und Pinch-Zoom bleiben unverändert. Im **AR-Modus** ist der Sensor-Pitch wieder wie in v69 nicht invertiert (`src/renderer/ar-mode.js`). Die sieben neuen Verhaltenstests in `tests/look-directions-v71.test.mjs` prüfen freie Gesten, unveränderte Nachbarfunktionen und die AR-Neigung in allen vier Bildschirmausrichtungen. Das vollständige v71-Paket verwendet `sonnensystem-shell-v71`.

## Änderung in v70 (historisch; AR-Inversion in v71 zurückgenommen)

Der Button **Kamera zurücksetzen** führt den Perspektivwechsel als 1.050-ms-Kamerafahrt aus (Blickrichtung, Kamerastandort und Zoom). Die reine Kamerafahrt ist von Szene-/Layouttransitions getrennt; erneute Wechsel übernehmen die sichtbare Zwischenpose und manuelle Eingaben beenden die Fahrt. In AR bleibt der Bewegungssensor erhalten, darf jedoch während des Flugs nicht die Kamerabasis überschreiben. Zusätzlich wurde die **vertikale AR-Sensorblickrichtung** für Hoch- und Querformat invertiert. Tests dazu: `tests/camera-flight-ar-v70.test.mjs`. Das vollständige v70-Paket verwendet `sonnensystem-shell-v70`.

## Änderung in v69

Die Bedienung des Kamera-Buttons zeigt nun über vier SVGs die **aktuelle Kamerarichtung** statt des nächsten Perspektiv-Icons: freie Kamera / Rückkehr zur Übersicht frontal, Schräg/oben schräg nach unten, Topdown nach unten, Seitlich nach links. Der Perspektivwechsel und die nächste Aktion in der `aria-label`-Beschriftung bleiben unverändert. Das vollständige Projekt kann aus dem v69-Archiv installiert werden; `sw.js` verwendet `sonnensystem-shell-v69`, damit die neue Oberfläche auch als PWA aktualisiert wird.

## Dokumentationsordnung seit v68

| Datei | Inhalt |
|---|---|
| `README.md` | Einrichten, Funktionen, aktuelle Projektstruktur |
| `docs/ARCHITECTURE.md` | Gültige Modulgrenzen und Laufzeit |
| `docs/DATA-ARCHITECTURE.md` | Datenmodell, Quellen, Grenzen |
| `docs/HILFE.md` | Aktuelle Bedienung |
| `docs/TEXTURE-SOURCES.md` | Bild- und Quellenhinweise |
| `docs/RELEASE-HISTORY.md` | Vollständige historische Delta-Notizen für v2–v67 und v6.1 |

Die 66 Einzeldateien `docs/DELTA-V2.md` bis `docs/DELTA-V67.md` und `docs/HOTFIX-V6.1.md` wurden nach vollständiger Übernahme in `RELEASE-HISTORY.md` entfernt. Alte Versionsabschnitte aus README, Hilfe und Architektur wurden durch gegenwartsbezogene Anleitungen ersetzt. Funktionstests aus frühen Versionen bleiben erhalten, soweit sie noch relevantes Verhalten überprüfen. Vier Testdateien wurden unter neuen, versionsneutralen Namen beibehalten: `modular-v64` → `module-boundaries`, `dedup-v65` → `shared-logic`, `performance-v66` → `render-performance`, `css-cleanup-v67` → `styles-regression` (jeweils mit `.test.mjs`).

## Sicheres Delta-Update v67 → v68

1. `Sonnensystem-Delta-v68.zip` im Projektroot von v67 entpacken und überschreiben.
2. Im Projektroot `node apply-v68.mjs` ausführen. Nur die **71 bekannten veralteten Dateipfade** (67 Dokumente und vier umbenannte Tests) werden bei unverändertem SHA-256-Inhalt gelöscht. Abweichende oder bearbeitete Dateien bleiben bestehen; der Updater meldet sie und kann erneut aufgerufen werden. Nach erfolgreicher Bereinigung entfernt sich die einmalige Update-Datei selbst.
3. `npm run check` ausführen, App neu laden und den aktualisierten PWA-Cache `sonnensystem-shell-v68` aktivieren.

**Hinweis:** Entpacken allein kann bestehende Dateien nicht löschen; daher gehört der zweite Schritt zu diesem Delta. Für komplette Neuinstallationen wird ein bereinigtes vollständiges v68-Projektpaket bereitgestellt.
