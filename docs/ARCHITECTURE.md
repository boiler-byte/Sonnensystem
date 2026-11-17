# Architektur – Sonnensystem v27.0

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
8. `src/renderer/labels.js` erzeugt je Frame priorisierte Bildschirm-Labels, misst Bewegung in CSS-Pixeln pro Sekunde und begrenzt normale Beschriftungen auf zwei pro Bildschirmfeld von 160 × 110 CSS-Pixeln, bevor es in ein transparentes 2D-Canvas zeichnet.
9. `sw.js` cached die App-Shell und nach Manifest alle lokalen JSON-Dateien, aber **nicht** `/api/...`.

## Erweiterungen v11: Auswahl, Bildtexturen und Caches

- `SolarRenderer.pick(x, y)` ruft bei einem Treffer `onSelect(id)`, bei leerem Himmel `onClearSelect()` auf. `app.js` setzt anschließend `state.selected=null`, ohne den Kamerastatus oder die aktive Planetenansicht zu verändern; `object-details.js` leert die Detailansicht.
- `labels.js`: ausgewählte Labels werden **nicht** durch Bewegungs-, Disk- oder Rechteckkollisionen verworfen. Ihre bevorzugte Seite bleibt stabil; übrige Labels teilen sich ein Dichtelimit pro Bildschirmfeld.
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

`src/renderer/labels.js` behält Ankerseiten bei und wechselt nur an Viewport-Rändern. Kollisionen zwischen Texten oder mit Himmelskörpern führen nicht mehr zum Ausblenden. Die Dichteschranke beträgt zwei reguläre Labels je 160 × 110 CSS-Pixeln; ausgewählte Labels sind zusätzlich sichtbar. Ein 18-Pixel-Randpuffer stabilisiert die Rasterzuordnung. Der unabhängige Bewegungsfilter bleibt aktiv.

## v10 – Zeitsimulation

Die interne Zeitgeschwindigkeit bleibt in simulierten **Tagen pro realer Sekunde**. `src/ui/timeline.js` definiert getrennte logarithmische Bereiche mit 241 diskreten Schiebereglerpositionen und exakt erreichbaren Standardwerten für beide Szenen. `src/app.js` verwaltet Play/Pause, den v10-Popover-Regler, den Heute-Button sowie die geschwindigkeitsspezifischen Einstellungen pro Ansicht. Das Datum wird in der Zeitzone des Browsers als `DD.MM.YYYY hh:mm` dargestellt. Das responsive `css/styles.css` zeigt den vertikalen Regler auf Desktop neben dem schmalen Control-Panel und im Mobile-Bottom-Sheet inline innerhalb des Tabs „Steuerung“. Siehe [DELTA-V10.md](DELTA-V10.md).

## v13 – Control-Panel und Tabs

`index.html` platziert das Ansicht-Dropdown, die drei Zeitbuttons und die Szene-Schalter in einem semantischen Control-Panel oben rechts. `src/ui/scene-mode.js` synchronisiert den Dropdown-Wert nach jedem Szenenwechsel, `src/app.js` behandelt Wechsel zu heliozentrischer oder Planetensystem-Ansicht und die Tastaturnavigation der Details. Seit v14 wird auf Mobilgeräten **das komplette** Control-Panel in die dritte Registerkarte „Steuerung“ verschoben, nicht dupliziert.

`src/ui/object-details.js` hält die redaktionellen Inhalte und astronomischen Kennzahlen getrennt in `Wissen` und `Daten`. Die `detail-sources`-Anzeige liegt innerhalb von `detail-scroll` und scrollt mit dem Inhalt. Die Kopfzeile trägt den ausgewählten Objektnamen; Objekttyp und Zuordnung erscheinen als Overlay im Hero. Siehe [DELTA-V13.md](DELTA-V13.md).

## v14 – Vertikales Control-Panel und mobile Übersicht

`css/styles.css` begrenzt die Breite des Desktop-Control-Panels auf ungefähr 180 px. Die drei Zeitaktionen sind vertikal gestapelt; Bahnen, Namen und Übersicht werden über SVG-Icons ohne visuelle Beschriftung dargestellt. Titel und ARIA-Namen bleiben für Screenreader und Tastaturbedienung vorhanden. Der Geschwindigkeits-Popover öffnet auf Desktop links vom schmalen Panel und auf Mobilgeräten inline im scrollbaren Tab.

`src/ui/bottom-sheet.js` verschiebt die **unveränderte Instanz** von `#view-mode-status` in den dritten Tab `data-sheet-panel="control"` und zurück an ihren ursprünglichen DOM-Anker. `#reset-camera` wird innerhalb desselben Umbruchs aus der Szenen-Schalterzeile nach `#mobile-overview` auf der Bühne verschoben; alle Ereignisbehandler bleiben durch die DOM-Umsortierung erhalten. Der freie Übersichtsknopf folgt der sichtbaren Bottom-Sheet-Höhe und wird auf Desktop an seinen Originalplatz zurückgesetzt. Die Tabs „Objekte“ und „Details“ bleiben unverändert. Siehe [DELTA-V14.md](DELTA-V14.md).


## Erweiterungen v15: gemeinsame Objektlayer

- `src/data/layers.js` stellt die Presets `standard` (Planet, Mond) und `all` sowie die immutable Mehrfachauswahl bereit. `layerEnabled()` ist die gemeinsame Sichtbarkeitsprüfung ohne Abhängigkeit vom DOM.
- `src/app.js` verwaltet die Layer in `S.settings.layers`, synchronisiert das Dropdown inkl. Checkboxen, Preset-Tastenzustand und Auswahl und schließt es bei Escape/außerhalb sowie beim Wechsel in andere mobile Tabs. Der Geschwindigkeitsregler und das Layer-Dropdown werden nicht gleichzeitig angezeigt.
- `src/ui/object-list.js` nutzt denselben Filter für den Katalog und erweitert `catalogMatches()` um Kategorie und direkte Elternobjekte; die bisherigen Filterchips werden vollständig entfernt.
- `src/renderer/renderer.js`, `solar-view.js` und `planet-view.js` wenden die Layer-Prüfung auf Körper, Bahnen und Labels (über die `rendered`-Liste) an. Eine ausgeblendete Sonne hat keinen Glow. Die Positionen selbst werden weiterhin für alle Himmelskörper berechnet; so bleiben abhängige Mondbahnen korrekt.
- Raumsonden besitzen weiterhin keine berechneten WebGL-Positionen, auch wenn ihre Layer-Kategorie aktiv ist. Der Service Worker cached das neue Modul und verwendet `sonnensystem-shell-v15`.
- Das Control-Panel ist auf Desktop 110 px breit (v14: 184 px). In der mobilen Ansicht ist die Layer-Auswahl in das Bottom-Sheet integriert und erweitert dieses bei Bedarf.

## Erweiterungen v16: Dichte statt Kollisionsunterdrückung

`STANDARD_LAYERS` umfasst `planet`, `moon`, `star`. Die Labels werden priorisiert und je Rasterzelle gezählt; wegen der fehlenden Kollisionsprüfung sind Überlagerungen zugelassen. Ankerseiten wechseln nur, wenn sie außerhalb des Viewports liegen würden. Ausgewählte Labels ignorieren das Dichtelimit.


## Erweiterungen v17: sichtbare Orbits als Layeroptionen

- `src/data/layers.js`: `STANDARD_LAYERS = ['planet','star']`; der Standard besteht aus acht Planeten und der Sonne, Monde sind explizit zuschaltbar.
- `src/data/bodies.js`: kanonische Objektkategorienfarben unter `CATEGORY_COLORS`; `EARTH_ORBIT_COLOR` ist eine gesonderte Akzentfarbe für die Bahn der Erde, nicht für alle Planeten.
- `index.html`, `src/app.js` und `css/styles.css`: das Bahnen-SVG öffnet das Dropdown `#orbit-popover`. `orbits`, `orbitContrast` und `orbitColors` werden separat verwaltet, synchron als `aria-pressed` angezeigt, beim Wechsel zu anderen Popovers geschlossen und mobil innerhalb der dritten Registerkarte mitgeführt.
- `src/renderer/orbits.js`: der renderer verwendet bei `orbitContrast=true` projizierte Quads als `gl.TRIANGLES` mit 2.4 CSS-Pixeln (Auswahl 3.4 px) Breite. Dies umgeht die bei WebGL übliche 1px-Begrenzung von `gl.lineWidth`. Ohne Kontrast wird weiterhin der ursprüngliche `gl.LINE_STRIP` verwendet. Farbe wird für jeden Orbiter aus `CATEGORY_COLORS` gewählt, die Erde hat `#4DA3FF`. Ohne Farben ist der Stroke einheitlich graublau. Keine Veränderung der Sphärenmaterialien.
- `src/ui/object-list.js` und `src/ui/object-details.js`: Kategorieindikatoren verwenden die identische Palette; Oberflächentexturen, Shader-Farbgebung und Sternenhintergrund bleiben unberührt.
- `sw.js`: Shell-Cache `sonnensystem-shell-v17`, kein zusätzliches Netzwerk oder externe Abhängigkeit.

Siehe [DELTA-V17.md](DELTA-V17.md).


## Erweiterungen v18: kompaktes Zeit-Dropdown

- `index.html`: Die Zeitsteuerung besteht aus genau einem sichtbaren Trigger `#speed-btn` mit den Zeilen `#speed-readout` und `#sim-date-label`. Sein Popover `#speed-popover` enthält `#speed`, `#play-btn` (SVG) und `#today-btn`; das vollständige lokale Datum mit Uhrzeit steht in `#sim-date-readout`. Keine doppelten Schalter für Desktop und Mobil.
- `src/ui/timeline.js`: `formatLocalDate()` erzeugt die lokale Anzeige ohne Uhrzeit; `formatLocalDateTime()` bleibt für das Menü erhalten. `syncControls()` synchronisiert Trigger, Popover und accessible Namen in einem Aufruf, ohne die Logarithmik oder den Wiedergabestatus zu verändern.
- `css/styles.css`: Eine einzige kompakte Zeit-Schaltfläche passt in das 110-px-Control-Panel. Das Popover öffnet auf Desktop links, im mobilen dritten Tab inline und scrollt mit dessen Inhalt. Die 241 logarithmischen Stufen sowie beide ansichtsspezifischen Geschwindigkeitsbereiche bleiben erhalten.
- `src/app.js`: Beim Öffnen werden Layer- und Bahnmenü geschlossen; Klick außerhalb und `Escape` schließen das Zeitmenü. `Escape` setzt den Fokus zurück. `Heute` verwendet `Date.now()` ohne UTC-Darstellungszwang.
- `sw.js`: Cache-Version `sonnensystem-shell-v18` für reibungslose PWA-Aktualisierung. Keine neuen Abhängigkeiten oder externen Dateien.

Siehe [DELTA-V18.md](DELTA-V18.md).

## Erweiterungen v19: rechtsbündige Menüs und Orbit-Schalter im Layer-Dropdown

- **Platzierung:** Beide Popovers sind am jeweiligen Trigger (`.layer-picker-wrap` bzw. `.speed-picker-wrap`) verankert und verwenden auf dem Desktop `top:calc(100% + 7px); right:0`. Ihre rechte Kante ist damit exakt an der rechten Kante des Dropdown-Buttons ausgerichtet. Auf Mobilgeräten bleiben sie innerhalb des Tabs „Steuerung“ im normalen Layoutfluss.
- **Objektlayer:** `#layer-popover` enthält die Kategorie-Voreinstellungen, Mehrfachauswahl und den neuen Abschnitt `.layer-orbit-section` mit den bestehenden Schaltern `#orbit-visibility-btn`, `#orbit-contrast-btn`, `#orbit-colors-btn`. Der separate Button `#toggle-orbits`, der `#orbit-popover` und sein Schließzustand wurden entfernt. Die drei Zustände `settings.orbits`, `settings.orbitContrast` und `settings.orbitColors` bleiben unverändert.
- **Zeit:** `#speed-popover` ist 196 CSS-Pixel breit. Sein Header enthält nur die Geschwindigkeit; darunter gibt es das Grid `.time-popover-grid` mit einem vertikalen logarithmischen Slider links und einer rechts gestapelten Aktionsspalte (Play/Pause, Heute, lokale Datums- und Uhrzeit-Anzeige). `syncControls()` erzeugt den Zeilenumbruch zwischen lokalem Datum und lokaler Uhrzeit, `datetime` bleibt ISO für Maschinenlesbarkeit.
- **Mobile Sheet:** Kein dupliziertes Control-Panel. Beim Wechsel aus dem Tab „Steuerung“ werden Zeit- und Layer-Menüs geschlossen. Das Übersicht-SVG bleibt wie zuvor als alleiniger Button direkt über der Szene.
- **PWA:** `sonnensystem-shell-v19` invalidiert veraltete statische Dateien. Die 241 Geschwindigkeitsstufen, Sichtbarkeitslayer, farbcodierte Bahnen, Katalogdaten und lokalen Texturen bleiben erhalten.

Siehe [DELTA-V19.md](DELTA-V19.md).


## Aktueller Aufbau v22 (ersetzt frühere Layoutangaben)

Die Anwendung hat keine Topbar und keine rechte Detailspalte. Die Desktop-Seitenleiste links enthält den Objektkatalog und die Objektdetails als zwei Tabs; `src/ui/bottom-sheet.js` verwaltet **dieselben DOM-Elemente** für Desktop und das mobile Zwei-Tab-Sheet. Das Control-Panel bleibt auf allen Bildschirmgrößen direkt in der WebGL-Ansicht, ebenso die kleine Hilfe- und (mobil) Objekt-Schaltfläche. Der Hilfetext liegt unter [HILFE.md](HILFE.md).

`src/renderer/solar-view.js` wählt **alle** verfügbaren direkten Sonnenbahnen aus den aktiven Layern (Planet, Zwergplanet, Asteroid, Komet) statt einer hartkodierten Teilmenge. Monde und Satelliten behalten ihre planetenzentrierten lokalen Orbits in `planet-view.js`; die Sonnenübersicht zeichnet keine künstlichen Sonnenkreise. `src/renderer/labels.js` begrenzt Mond-Labels in der Sonnenübersicht nach Radius auf vier pro Planet. Ausgewählte kleine Monde ersetzen den viertgrößten Kandidaten. Die planetenzentrierte Detailansicht ist von dieser Beschränkung ausgenommen.

Die Historie der v13–v20-Abschnitte oben dokumentiert deren ursprünglichen Stand; diese v22-Beschreibung hat bei widersprechenden Layoutangaben Vorrang. Siehe [DELTA-V22.md](DELTA-V22.md).


## Stand v23: getrennte Layer- und Zeitvorgaben

`src/data/layers.js` erzeugt mit `createViewSettings(view)` pro Ansicht einen eigenen Satz `layers`, `orbits`, `orbitContrast`, `orbitColors` und `labels`. Das in `src/app.js` gehaltene Objekt `S.viewSettings` enthält `solar` und `planet`; `S.settings` zeigt auf den gerade aktiven Satz. `updateMode()` ermittelt den Modus aus `renderer.planetId`, bindet `S.settings` neu und synchronisiert Checkboxen, Presets, Orbits, Beschriftung sowie den Katalog. Wechsel zwischen zwei Planeten bleiben im selben `planet`-Satz; ein Wechsel zurück zur Sonne stellt `solar` wieder her.

`availableLayerTypes(bodies, 'planet', planetId)` liefert den Zentralplaneten selbst und die tatsächlich mit `parentId === planetId` vorhandenen Kindobjekttypen. Diese Typen werden nicht als eigene Statusmasken neu angelegt, sondern entscheiden ausschließlich, welche Checkboxen aktuell sichtbar sind. Das CSS blendet versteckte Optionen auch dann aus, wenn die Komponentenregel `display:flex` enthält. `updateLayerSelection()` schützt die aktuelle Szene davor, ihren letzten sichtbaren Layer zu verlieren; weitere, an einem anderen Planeten relevante Typen bleiben im gespeicherten Zustand erhalten. Wenn der Katalog neue Kindkategorien bekommt, unterstützt `planetChildrenFor()` diese direkt, soweit sie über Positionen verfügen.

Die damaligen v23/v24-Standardmasken waren `STANDARD_LAYERS = ['planet','moon','satellite','star']` (Sonnensystem) und `PLANET_STANDARD_LAYERS = ['planet','moon','satellite']`. Seit v25 gilt für `STANDARD_LAYERS` stattdessen `['star','planet']`. `SPEED_MODES.solar` verwendet standardmäßig 5 Tage/s bei Pivot 101; die logaritmischen Bereiche beider Ansichten bleiben ansonsten bestehen. Die Planeten-Standardgeschwindigkeit ist weiterhin 1 Stunde/s. Maßgeblich für v23 ist [DELTA-V23.md](DELTA-V23.md); die älteren Abschnitte oben dokumentieren historische Entwicklungsschritte.


## Stand v24: Katalog unabhängig von Renderer-Layern

`src/ui/object-list.js` verwendet keine `layerEnabled()`-Maske mehr: `filteredBodies()` zeigt alle geladenen Objekte, nur Suchbegriffe und ein expliziter Planetenfilter können die Liste einschränken. `catalogMatches()` zerlegt die normalisierte Suchanfrage in Wörter und verlangt für **jedes** Wort einen Treffer in Name, ID, Katalogfeld, Singular/Plural-Typ oder direkt übergeordnetem Objekt. Dadurch findet etwa `uranus c` alle Uranus-Monde, deren Name ein „c“ enthält.

`src/app.js` hält `S.catalogPlanetOnly` (Startwert `false`) getrennt von `S.viewSettings` und Renderer-Status. `updateCatalog()` zeigt den SVG-Planetentoggle nur bei vorhandenem `renderer.planetId` und übergibt diese ID an `renderCatalog()`. Beim Einschalten gehören der Zentralplanet und sämtliche über `parentId` verknüpften Unterobjekte zur Liste; ohne Planetenansicht wird der Filter ignoriert. Kategoriefilter schalten lediglich die WebGL-Darstellung und erhalten die aktuelle Katalogauswahl. Der SVG-Schalter wird zusammen mit dem Suchfeld als ein gemeinsamer responsiver Bereich im Desktop-Katalog und mobilen Bottom-Sheet gerendert.

Diese Version ersetzt die historischen Kopplungen des Katalogs an die Layer aus den v15/v23-Abschnitten. Details: [DELTA-V24.md](DELTA-V24.md).


## Stand v25: kompakter Layer-Popover und modusspezifische Standardmaske

`src/data/layers.js` setzt `STANDARD_LAYERS = ['star','planet']`; `PLANET_STANDARD_LAYERS = ['planet','moon','satellite']` bleibt bestehen. `createViewSettings()` und `layerPreset()` verwenden weiterhin den aktiven Modus, sodass Änderungen am Sonnensystem die Planetenansicht nicht beeinflussen. Die initialen Checkbox-Zustände in `index.html` entsprechen dem Solar-Standard und werden beim Moduswechsel von `syncLayers()` neu gebunden. Der Katalog in `src/ui/object-list.js` bleibt unabhängig davon.

Die Einstellungen befinden sich weiterhin im einzigen `#layer-popover`: 152 px feste Breite statt 227 px (unter Beachtung der Viewport-Maximalbreite), mit einem gemeinsamen segmentierten `.layer-presets`-Element für `all` und `standard`; beide Buttons behalten `data-layer-preset` und `aria-pressed`. Die `.layer-options` haben keine obere Trennlinie mehr. Die textuellen Titel „Objektlayer“, „Umlaufbahnen“ und „Beschriftung“ sind entfernt; Gruppennamen bleiben über `aria-label` erhalten. Die früheren `.orbit-popover-note`-Texte entfallen. `.orbit-suboption` rückt Kontrast- und Farben-Schalter unter der Umlaufbahn ein. Die bestehende scrollbare mobile Variante bleibt. Siehe [DELTA-V25.md](DELTA-V25.md).


## Aktueller Stand v26: Reset-Taste, minimales Control-Panel und Zwergplanetensysteme

- **Oberfläche:** `index.html` enthält keine `#view-mode-select`-Auswahl, keinen `#help-btn`/`#help-modal` und keinen `#mobile-menu`. Die einzige `#reset-camera`-Taste ist als runder, gerahmter Zoom-Out-SVG-Button in `.viewport-actions` oberhalb des Panels platziert. Das Panel (`#view-mode-status`) hat bei Desktop und Mobil eine feste Außenbreite von **100 CSS-Pixeln** und enthält nur den Layer-Trigger (Stapel-SVG ohne sichtbaren Layertext) sowie den Zeit-Trigger. Das Layer-Popover bleibt 152 px breit.
- **Navigation:** `src/app.js` registriert den Kamera-Reset unverändert als `renderer.reset()` gefolgt von `updateMode()` und `updateDetail()`. Da das Ansichtsauswahlmenü entfällt, ist Reset die Rückkehr aus einem isolierten System zur Sonnensystemübersicht. `src/ui/scene-mode.js` setzt Status- und ARIA-Namen ohne ein Select-Element. Das mobile Sheet wird weiterhin über seine Tabs und den Griff geöffnet.
- **Details:** `src/ui/object-details.js` zeigt die isolierte Ansichtsschaltfläche für `planet` und `dwarf` an. Bei `moon` mit einem Elternobjekt vom Typ `planet` oder `dwarf` verweist derselbe Button auf dieses Elterngestirn; Satelliten und andere Kategorien erhalten die Aktion nicht. Der App-Handler nimmt bei einem Mond den Parent und setzt sowohl die Szene als auch die Details-Auswahl auf den Parent.
- **Dwarf-Rendering:** `SolarRenderer.showPlanetSystem(id)` und `setBodies()` akzeptieren `planet` und `dwarf` als Zentralobjekt. `src/renderer/scene.js` berechnet die Positionen eines solchen Zentrums und aller direkten Begleiter im lokalen Koordinatensystem. `planetBodyRadius()` stellt einen Zwergplaneten als zentrales Objekt in der Planetenansicht groß genug dar. `availableLayerTypes()` bietet nur Kategorien des Zentrums und seiner vorhandenen Kinder an, also etwa `Zwergplanet` und `Mond` bei Pluto. `openPlanetScene()` schaltet beim Eintritt in eine Zwergplanetenansicht den zentralen Zwergplanetenlayer sichtbar, ohne die globale Sonnensystem-Einstellung zu verändern. Auf normalen Planeten bleiben die Standardfilter `planet`, `moon`, `satellite` unverändert.
- **PWA:** `sonnensystem-shell-v26` invalidiert die v25-Cachekopien. Die Anleitung steht weiterhin vollständig unter [HILFE.md](HILFE.md); historische Angaben in früheren Abschnitten dokumentieren den jeweiligen Entwicklungsstand, nicht die aktuelle Oberfläche.

Siehe [DELTA-V26.md](DELTA-V26.md).

## Aktueller Stand v27: schwebende Steuerung und vollständig scrollbares Bottom-Sheet

- **Viewport:** `.viewport-actions` positioniert den Zoom-Out-Reset am unteren rechten Viewportrand; auf Mobilgeräten liegt er oberhalb des geschlossenen 52-px-Sheet-Headers. Das `.viewport>.control-panel` ist 58 px breit, ohne Hintergrund, Padding, Border, Schatten oder Blur. Beide Trigger haben ihre Chevron-Elemente verloren; der Layer-Popover bleibt 152 px breit und der Zeit-Popover erhält für Bedienbarkeit unabhängig vom Auslöser 116 px Breite.
- **Details:** `detailNavigation(state)` in `src/ui/object-details.js` bestimmt Position und zyklische Nachbarn innerhalb derselben Objektkategorie. `renderDetail()` synchronisiert Index und deaktivierte Prev/Next-Buttons; `src/app.js` leitet Klicks über `selectBody(target,true)` an Selektion, Renderer und mobilen Details-Tab weiter.
- **Mobile:** `#sheet-handle` und `.sheet-grabber` entfallen. `#sheet-header` übernimmt Zeigergesten, freie Tippflächen und fokussierbare Tastatursteuerung. `src/ui/bottom-sheet.js` misst die volle Höhe aus `window.innerHeight` statt aus der aktuell sichtbaren Sheethöhe. Bei geschlossen/halb/voll wird `--sheet-visible` direkt zur tatsächlichen Höhe des unten fixierten Sheets; dadurch passen `.sheet-content` und die inneren Katalog-/Details-Scrollports zur sichtbaren Fläche. Die zwei Tab-Buttons bleiben eigenständige Eingabeelemente, die keine zusätzliche Snap-Aktion auslösen.
- **PWA:** `sonnensystem-shell-v27` invalidiert den bisherigen Cache, sodass die neue CSS/JS-Logik auch offline verfügbar wird. Dokumentation siehe [DELTA-V27.md](DELTA-V27.md).

## Stand v28: Kamerapresets

`SolarRenderer.cycleCameraPerspective()` schaltet in der Sonnensystemansicht durch die drei voreingestellten Blickwinkel. `markCameraMoved()` unterbricht diese Reihenfolge bei manueller Dreh-, Schwenk- oder Zoombewegung; der nächste Reset setzt dann auf Schräg/oben zurück. Der Button trägt ein SVG mit nach außen weisenden Pfeilen. Innerhalb eines isolierten Planetensystems führt derselbe Button weiterhin zur Sonnensystemübersicht. Details: [DELTA-V28.md](DELTA-V28.md).

## Aktueller Stand v29: Beleuchtung und „4 Monde“

`createViewSettings()` legt zusätzlich `lighting: 'optimized'` für beide Szenentypen und `fourMoons: true` nur für die Sonnensystemansicht an. Die Werte werden, wie Layer/Orbits/Labels, in `S.viewSettings.solar` und `.planet` getrennt verwaltet. `syncLightingControl()` und `syncFourMoonsControl()` synchronisieren den sichtbaren Status sowie `aria-pressed`; die beiden Buttons sitzen unterhalb von `#toggle-labels` im Layer-Popover.

`src/renderer/shaders.js` verwendet `uOptimizedLighting` zur Wahl zwischen der bisherigen Beleuchtung (`.13 + .89 * diffuse`, begrenzt) und einer angehobenen Umgebungshelligkeit (`.50 + .50 * diffuse`). Die Sonne bleibt in beiden Modi selbstleuchtend. `SolarRenderer.drawSphere()` setzt das Uniform für alle Oberflächen, unabhängig von der Texturquelle. Keine neuen Shaderdateien, Imports oder Netzwerkabhängigkeiten wurden eingeführt.

`largestMoonIds(bodies)` in `src/data/layers.js` bestimmt die vier nach `radiusKm` größten natürlichen Monde je `parentId`; bei gleichen Radien entscheidet die ID deterministisch. `SolarRenderer.setBodies()` aktualisiert den Index nach Katalog- und Live-Daten-Änderungen. `shouldDraw()` schließt bei aktiviertem Schalter andere Monde aus der 3D-Szene aus; damit sind sie weder gezeichnet noch anklickbar. `planet-view.js` benutzt dieselbe Sichtbarkeitsprüfung vor Körper- und Orbitzeichnung. `labels.js` wendet die historische Vierer-Beschriftungsgrenze nur noch im eingeschalteten Modus an (für ältere Renderereinstellungen ohne `fourMoons` bleibt das alte Verhalten als Fallback). Bei deaktiviertem Schalter können alle sichtbaren Monde um Labels konkurrieren; Dichte- und Bewegungsregeln greifen weiterhin.

**Unverändert:** Sonnenübersicht „Standard“ enthält weiterhin Sterne und Planeten, die Planetenansicht standardmäßig Planeten, Monde und Satelliten. Der „4 Monde“-Schalter aktiviert keinen ausgeschalteten Mond-Layer. Der Katalog und die Detaildaten bleiben trotz 3D-Filter vollständig. Das Layer-Popover ist nun 188 px breit und auf Desktop nach verfügbarer Höhe bemessen; auf Mobilgeräten hat es einen scrollbaren Bereich oberhalb des Bottom-Sheets. Anwendungsversion und PWA-Cache sind v29. Details: [DELTA-V29.md](DELTA-V29.md).
