# Delta v9.0 – Smarte Labels

Dieses Paket ist ein **inkrementelles Update** auf die vollständige Workspace-Root-Version des Sonnensystems v8.0. Es enthält nur geänderte und hinzugefügte Dateien – **kein** vollständiges Projekt und keinen neuen Objektkatalog.

## Einspielen

1. Das **Delta-v9-ZIP** im Stammverzeichnis der entpackten v8-Version öffnen.
2. Die enthaltenen Pfade (`src/`, `tests/`, `docs/` usw.) **mit derselben Ordnerstruktur** darüberkopieren und vorhandene Dateien ersetzen. **Nicht** den kompletten v8-Bestand löschen.
3. Im Workspace-Root `npm run check` ausführen und mit `npm start` starten.
4. Bei PWA-Installationen die Anwendung nach dem Update neu öffnen bzw. neu laden. `sw.js` schaltet den Offline-App-Cache auf `sonnensystem-shell-v9` um.

## Neu

- **Prioritäten statt starrer Auswahl:** Ausgewähltes Objekt zuerst, in der Planetenansicht danach der Zentralplanet, dann wichtige Objekte und größere Monde. Auch Monde außerhalb der bisherigen 14er-Grenze und mehr als fünf Satelliten dürfen Labels erhalten, **wenn Platz ist**. Die 3D-Objekte bleiben unverändert sichtbar.
- **Überlagerungsfilter:** Der Text wird mit der tatsächlichen Canvas-Textbreite vermessen. Vier Positionen (rechts, links, oberhalb, unterhalb) werden geprüft. Labels überlagern sich nicht, berühren keine größeren projizierten Körper und werden nur innerhalb des Canvas gezeichnet. Bei zu viel Enge gewinnt die höhere Priorität.
- **Geschwindigkeitsfilter:** Beschriftungen werden ausgeblendet, sobald ihre projizierte Bewegung **220 CSS-Pixel/s** überschreitet, auch beim Kamera-Schwenken oder bei beschleunigter Simulation. Beim Abbremsen unter **140 CSS-Pixel/s** werden sie nach **140 ms** wieder eingeblendet; dazwischen verhindert eine Hysterese Flackern.
- **Bessere Erkennbarkeit:** Mindestens 11 px Textgröße (12 px bei Auswahl), hellerer Kontrast und eine dunkle Textkontur. Lange Namen werden sinnvoll gekürzt, nicht abgeschnitten. Der Hervorhebungsring für die Auswahl bleibt erhalten, solange ihr Label angezeigt wird.
- **Beide Modi:** Für heliozentrische und planetenzentrierte Ansicht ist die Logik identisch; bei Szenenwechsel, Viewportänderung und dem Beschriftungs-Schalter wird die Bewegungsmessung neu begonnen.

## Technische Grenzen

- Geschwindigkeiten sind **Darstellungsgeschwindigkeiten in Bildschirm-Pixeln**, keine realen Bahngeschwindigkeiten. Bei sehr großen Zeitsprüngen und kurzen Simulation-Frames können dynamische Positionen unterabgetastet sein.
- Ein ausgewähltes Objekt besitzt die höchste Priorität, kann aber aus Lesbarkeitsgründen dennoch **vorübergehend ohne Label** bleiben (schnelle Bewegung, Abschattung, zu wenig freier Platz).
- Das Label-System vermeidet Beschriftungen über Himmelskörpern und anderen Labels. Es erkennt jedoch nicht sämtliche außerhalb des Canvas gerenderten HTML-Bedienflächen.
- Katalog und Redaktion sind unverändert **v8.0.0 (160 Körper, 160 Artikel)**; die **App/Version des Code-Releases** ist v9.0.0.

## Geänderte / neue Dateien

| Datei | Art |
|---|---|
| `src/renderer/labels.js` | neue Prioritäten, Layout, Bewegungserkennung und Canvas-Styling |
| `src/renderer/renderer.js` | hält zurücksetzbaren Label-Zustand |
| `sw.js` | neuer Offline-Cache `sonnensystem-shell-v9` |
| `server/server.mjs` | Ausgabe der neuen Code-Version am Serverstart |
| `index.html` | Versionsanzeige V9.0 |
| `package.json` | Code-Version 9.0.0 |
| `README.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V9.md` | Dokumentation |
| `tests/smart-labels-v9.test.mjs` | neue Regressionstests für beide Ansichten und Bewegung |
| `tests/structure-and-server.test.mjs`, `tests/catalog-expansion-v8.test.mjs` | Aktualisierung der erwarteten v9-PWA-Version |

## Tests

`npm run check` führt die bisherigen Struktur-, Daten-, Kamera-, Renderer- und PWA-Tests sowie die neuen v9-Labeltests aus. Prüffälle: Label-Kollisionen; Reihenfolge nach Priorität; Ausweichpositionen an Kanten; Hindernisse durch Körper; zu schnelle Bewegung und Wiederaufnahme; Zeit-/Szenenwechsel; Auswahl eines Mondes außerhalb der bisherigen Begrenzung; Canvas-DPR und Lesbarkeit; Umschalten und Kürzung langer Namen.
