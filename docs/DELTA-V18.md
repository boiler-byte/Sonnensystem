# Delta v18 – Kompakte Zeitsteuerung

**Basis:** v17. ZIP direkt in das installierte v17-Workspace-Root entpacken und die gleichnamigen Dateien überschreiben. Dieses Delta enthält ausschließlich geänderte oder neue Dateien; lokale Texturen (`textures/standard`) und Katalogdaten werden nicht verändert.

## UI

- **Eingeklappt:** Ein einziger, zweizeiliger Knopf im vertikalen Desktop-Control-Panel: oben `3 Std. / s` (bei neuer Ansicht entsprechend dynamisch), darunter das lokale Datum `DD.MM.YYYY`. **Keine Uhrzeit im Knopf**, kein separater Play- oder Heute-Button außerhalb des Menüs.
- **Ausgeklappt:** Kompaktes Zeitmenü mit Geschwindigkeitsanzeige, lokalem Datum einschließlich Uhrzeit (`DD.MM.YYYY hh:mm`), vertikalem 241-Stufen-Regler, Play/Pause als SVG-Symbol und dem Button **Heute**. Auf Desktop liegt es links vom schmalen Panel. Der vertikale Regler bietet die bestehenden logarithmischen Bereiche und unabhängige Geschwindigkeiten je Ansicht.
- **Mobil:** Dasselbe DOM-Element befindet sich im dritten Bottom-Sheet-Tab **Steuerung**; das Menü wird inline geöffnet und das Sheet vergrößert. Der Übersicht-Button bleibt wie bisher über der Szene.
- **Bedienung:** Außenklick schließt das Menü. `Escape` schließt es und stellt den Fokus auf den Zeitknopf zurück. Das Öffnen von Layer-/Umlaufbahn-Menüs schließt das Zeitmenü. Play/Pause schaltet den Laufzustand um; „Heute“ setzt `Date.now()` ohne Zeitumrechnung auf UTC zurück.

## Beibehaltener Geschwindigkeitsbereich

| Ansicht | Minimum | Standard | Maximum |
|---|---:|---:|---:|
| Sonnensystem | 1 h/s | 3 h/s | 10 Jahre/s |
| Planetensystem | 1 min/s | 1 h/s | 1 Jahr/s |

## Technische Umsetzung

- `index.html`, `css/styles.css`, `src/ui/timeline.js`, `src/app.js` – kompakter Trigger, Menü und synchronisierte lokale Datumsformate.
- `package.json`: Version `18.0.0`.
- `sw.js`: Offline-Cache `sonnensystem-shell-v18`.
- Angepasste Legacy-Regressionstests und neue Tests in `tests/time-dropdown-v18.test.mjs` prüfen Struktur, Datumsformat inkl. Mitternachtswechsel in verschiedenen Zeitzonen, Geschwindigkeitsgrenzen und PWA-Cache.

## Prüfung und Grenzen

`npm run check` validiert den Katalog und führt alle Tests aus. Eine vollständige grafische Interaktionsprüfung per Chromium war in dieser Umgebung bislang nicht möglich; automatisierte Logik- und DOM-Strukturprüfungen sowie die saubere Delta-Installation werden stattdessen verwendet. Der bestehende WebGL-Renderer, die planetaren Daten und lokale Texturdateien bleiben unverändert.
