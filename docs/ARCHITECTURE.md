# Architektur – Sonnensystem v13.0

## Grundprinzip

Die Anwendung nutzt weiterhin native ES-Module, WebGL, Node.js 20+ und **kein Frontend-Framework/Buildsystem**. `index.html`, `sw.js`, `css/`, `icons/` und `data/` liegen direkt im **Workspace-Root**, nicht unter `public/`. Geheimnisse gehören ausschließlich in die serverseitige `.env`.

Die **neue Datenarchitektur** ist in [DATA-ARCHITECTURE.md](DATA-ARCHITECTURE.md) beschrieben.

## Laufzeit-Datenfluss

1. Der Browser lädt `index.html` und das Modul `src/app.js`.
2. `src/data/catalog.js` ruft `data/catalog/manifest.json`, alle beschriebenen astronomischen JSON-Dateien und sämtliche Redaktionsdateien der gewählten Sprache ab.
3. Der Validator prüft schemaVersion, Dateikategorien, Typen, Orbitparameter, doppelte IDs, Elternbeziehungen, Schleifen sowie redaktionelle IDs, Status und Quellenlinks.
4. Ein **Adapter** wandelt die JSON-Einträge in die bisherigen Felder des Renderers um. Durch ID-Verknüpfung werden sichtbare Artikel angehängt; Entwürfe bleiben verborgen.
5. `src/app.js` startet Katalog, Details, Zeitsteuerung, WebGL und (optional) Serveranfragen unter `/api/...`.
6. `src/data/normalization.js` interpretiert Live-Daten von Solar OpenData, CelesTrak und JPL. `mergeLiveBodies` ergänzt physikalische Felder und bewahrt redaktionelle Einträge.
7. `src/renderer/scene.js`, `solar-view.js` und `planet-view.js` stellen die gewählten Körper dar; `controls.js` und `camera.js` erhalten ihre bisherigen Mouse-/Touch-/Pfeiltastenfunktionen.
8. `src/renderer/labels.js` erzeugt je Frame priorisierte Bildschirm-Labels, misst Bewegung in CSS-Pixeln pro Sekunde und prüft Rechteck- und Kreiskollisionen, bevor es in ein transparentes 2D-Canvas zeichnet.
9. `sw.js` cached die App-Shell und nach Manifest alle lokalen JSON-Dateien, aber **nicht** `/api/...`.

## Erweiterungen v11: Auswahl, Bildtexturen und Caches

- `SolarRenderer.pick(x, y)` ruft bei einem Treffer `onSelect(id)`, bei leerem Himmel `onClearSelect()` auf. `app.js` setzt anschließend `state.selected=null`, ohne den Kamerastatus oder die aktive Planetenansicht zu verändern; `object-details.js` leert die Detailansicht.
- `labels.js`: ausgewählte Labels werden **nicht** durch Bewegungs-, Disk- oder Rechteckkollisionen verworfen. Ihre bevorzugte Seite bleibt stabil; übrige Labels belegen nur unbesetzte Plätze.
- `geometry.js` liefert UV-Koordinaten zusätzlich zu Position und Normalen (8 Float-Werte pro Kugelvertex). `shaders.js` liest mit `texture2D` das Bild, wenn ein geladenes WebGL-Texture-Handle vorliegt. Ansonsten bleibt der bisherige prozedurale Körper-Shader aktiv.
- `texture-sources.js` enthält lokale Dateipfade unter `textures/standard/` und die Stufen mobile/standard/detail (512/2048/4096 px). `textures.js` lädt Karten nur vom selben Origin, begrenzt gleichzeitige Abrufe und den GPU-Speicher und skaliert beim Canvas-Upload herunter.
- Seit v12 gibt es keinen externen Texturdownload und keinen Texturproxy. Der statische Server liefert erlaubte lokale Bilddateien unter `textures/standard/`. Fehlende Dateien werden durch schematische Materialien ersetzt.
- `sw.js` cached lokale Module sofort; Bildantworten nur **nach** erfolgreichem Abruf. Die reinen Katalogdaten bleiben ohne Netzwerk lesbar, externe Bilder sind nicht Teil der App-Shell.
- `object-details.js` weist auf lokal hinterlegte Texturen hin. Nicht kartierte Körper zeigen nur die schematische Textur.

Siehe [TEXTURE-SOURCES.md](TEXTURE-SOURCES.md) für Verfügbarkeit, Rechte, Qualitätsgrenzen und Ausfallverhalten.

## Modulübersicht

| Pfad | Verantwortung |
|---|---|
| `data/catalog/` | Physikalische Daten, Orbitparameter und Quellprovenienz je Kategorie |
| `data/editorial/` | Mehrere Redaktionsdateien je Sprache, Revision, Quellenlinks und Sichtbarkeitsstatus |
| `src/data/catalog.js` | Laden, Validieren, Querverweise, Renderer-Adapter und Live-Merge |
| `src/data/bodies.js` | Statische Kategorie-Definitionen, Konstanten, JPL-IDs und Favoriten |
| `src/data/normalization.js` | Datenkonverter für externe Provider |
| `src/data/orbital-math.js` | Kepler-Berechnung und szenische Skalierung |
| `src/renderer/` | WebGL-Renderer, Planeten-/Sonnensystem-Ansicht, Kamera, Gesten sowie smarte Label-Platzierung und Geschwindigkeitsfilter |
| `src/ui/` | Katalogansicht, Filter, Detailtexte, Quellen, Zeitsteuerung und mobile Menüs |
| `src/services/` | Browser-API-Anfragen zum lokalen Server |
| `server/routes/` und `server/providers/` | API-Routen, Provider, Cache und Konfiguration |
| `server/static.mjs` | Nur bekannte Rootdateien, JavaScript-Module und Katalog-JSON ausliefern |
| `scripts/validate-catalog.mjs` | CLI-Prüfung des echten Dateibestands ohne Drittanbieterpakete |
| `tests/` | Regression, Schema-Tests, HTTP-Sicherheit und Offline-Verhalten |

## API- und Sicherheitsgrenzen

Der Node-Server erlaubt `/api/status`, `/api/bodies`, `/api/satellites`, `/api/sbdb` und `/api/horizons`. Alle externen Abfragen laufen serverseitig. Der statische Server gibt ausschließlich bekannte Root-Dateien, `src/**/*.js` und **JSON unter `data/catalog/` oder `data/editorial/`** aus. `.env`, `server/`, `scripts/` und `tests/` sind nicht über diesen Server erreichbar.

Eine beliebige Workspace-Dateivorschau hat eventuell **keine solche Server-Allowlist**. Deshalb keinesfalls Schlüssel oder private Dateien in öffentlich ausgelieferte Workspace-Verzeichnisse legen.

## Veröffentlichungen

Bei neuen Browsermodulen die Liste `SHELL` in `sw.js` erweitern. Bei zusätzlichen astronomischen JSON-Dateien genügt der Eintrag in `data/catalog/manifest.json` – die PWA liest die Dateiliste beim Installieren. Bei jedem Release den Cache-Namen ändern, damit bereits installierte PWAs aktualisiert werden.

## v8-Datenumfang (in v10 unverändert)

Der Katalog umfasst 160 Körper und 160 redaktionelle Datensätze. Die zusätzlichen 120 Monde und 3 Kleinkörper stammen aus JPL-Tabellen bzw. historischen Beispieldaten. Der Loader erlaubt mehrere Dateien für dieselbe Kategorie/Locale. Die Anzeige nennt die neuen mittleren oder historischen Bahnmodelle ausdrücklich schematisch. Sie ist keine präzise Ephemeridenberechnung. Siehe [DELTA-V8.md](DELTA-V8.md).

## v9-Label-Pipeline

`drawSceneLabels()` ruft `layoutSceneLabels()` auf. Dabei werden projizierte Positionen pro Szene/Viewport im Renderer gespeichert; bei Szenenwechsel, Resize oder ausgeschalteten Labels startet die Messung neu. Labels über 220 CSS-Pixel/s werden ausgeblendet und erscheinen bei unter 140 CSS-Pixel/s nach 140 ms Erholungszeit wieder. Die Platzierung sortiert Objekte nach Bedeutung, prüft vier Positionen und vermeidet sowohl andere Label-Rechtecke als auch projizierte Körperflächen. Für Details siehe [DELTA-V9.md](DELTA-V9.md).

## v10 – Anker für ruhige Labels

`src/renderer/labels.js` speichert zusätzlich zur zuletzt gezeichneten Seite einen kurzzeitig persistenten Anker je Körper. Wenn die bevorzugte Seite kurz blockiert ist, zeichnet es zunächst kein Label, statt zwischen vier Alternativen zu springen. Ein Seitenwechsel benötigt mindestens 650 ms anhaltende Blockierung, mindestens 1300 ms seit dem vorherigen Wechsel und 180 ms eine freie Alternative. Nicht mehr gesehene Anker werden nach 6 Sekunden entfernt. Die priorisierte Kollisionsprüfung und die geschwindigkeitsbasierte Hysterese aus v9 bleiben bestehen.

## v10 – Zeitsimulation

Die interne Zeitgeschwindigkeit bleibt in simulierten **Tagen pro realer Sekunde**. `src/ui/timeline.js` definiert getrennte logarithmische Bereiche mit 241 diskreten Schiebereglerpositionen und exakt erreichbaren Standardwerten für beide Szenen. `src/app.js` verwaltet Play/Pause, den v10-Popover-Regler, den Heute-Button sowie die geschwindigkeitsspezifischen Einstellungen pro Ansicht. Das Datum wird in der Zeitzone des Browsers als `DD.MM.YYYY hh:mm` dargestellt. Das responsive `css/styles.css` zeigt den vertikalen Regler auf Desktop oberhalb des Auslöser-Buttons und im Mobile-Bottom-Sheet innerhalb des Zeitmenüs. Siehe [DELTA-V10.md](DELTA-V10.md).

## v13 – Control-Panel und Tabs

`index.html` platziert das Ansicht-Dropdown, die drei Zeitbuttons und die Szene-Schalter in einem semantischen Control-Panel oben rechts. `src/ui/scene-mode.js` synchronisiert den Dropdown-Wert nach jedem Szenenwechsel, `src/app.js` behandelt Wechsel zu heliozentrischer oder Planetensystem-Ansicht und die Tastaturnavigation der Details. In der mobilen Bottom-Sheet-Ansicht werden die **gleichen** Zeitbuttons in die Registerkarte „Zeit“ verschoben, nicht dupliziert.

`src/ui/object-details.js` hält die redaktionellen Inhalte und astronomischen Kennzahlen getrennt in `Wissen` und `Daten`. Die `detail-sources`-Anzeige liegt innerhalb von `detail-scroll` und scrollt mit dem Inhalt. Die Kopfzeile trägt den ausgewählten Objektnamen; Objekttyp und Zuordnung erscheinen als Overlay im Hero. Siehe [DELTA-V13.md](DELTA-V13.md).
