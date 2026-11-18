## Erweiterung v56 – zwei Hierarchieebenen im Doppelasteroiden-System, weitere Kataloggruppen, Trefferpriorität

- **Daten:** `data/catalog/manifest.json` (`catalogVersion: 10.0.0`) integriert `binary-asteroids-v56.json` (2), `moons-additions-v56.json` (9), `satellites-additions-v56.json` (7) sowie `data/editorial/de-objects-v56.json`. Insgesamt **192 Objekte** mit 192 redaktionellen Einträgen. Keiner der vorherigen Katalogdatensätze wird entfernt oder überschrieben.
- **Objekttyp `binary`:** `TYPES.binary`, `CATEGORY_COLORS.binary`, `LAYER_TYPES`, eigenes Checkbox-Element `data-layer-type="binary"`; `solarOrbitBodies` berücksichtigt nur sonnenzentrierte Doppelasteroiden-Bahnen, während die Dimorphos-Relativbahn um Didymos separat gezeichnet wird. `computePositions` berechnet die Hierarchie rekursiv. `displayOrbitRadius` und `displayA` interpretieren die relative Bahn in **km**, die Sonnenbahn in **AE**.
- **Suche:** `catalogSearchRank()` in `src/ui/object-list.js` unterscheidet exakte eigene Felder, exakte Typnamen, Namenspräfixe, Kategoriepräfixe, exakte Elternreferenz, weitere Teiltreffer und Mehrwortkombinationen. `filteredBodies()` sortiert anschließend bei Gleichstand nach Planet, Zwergplanet, Mond und den restlichen Typen, dann nach deutschem Namen. Kategorie- und Elternsuche bleibt auch bei ausgeschalteten Szenen-Layern möglich; ohne Suchtext bleibt die kuratierte Katalogreihenfolge bestehen.
- **Offline:** Service Worker `sonnensystem-shell-v56`; sämtliche referenzierten Katalog-/Redaktionsdateien werden weiterhin aus dem Manifest in den Offline-Cache aufgenommen. Für künstliche Satelliten erfolgt kein automatischer TLE/GP-Abruf.
- **Tests:** `tests/catalog-search-v56.test.mjs` deckt Datenintegrität, Hierarchie, km/AE, NORAD-Kennungen, Ebenenfilter, Sortierprioritäten, Satelliten-Einträge und Service-Worker-Referenzen ab.

# Architektur – Sonnensystem v55.0

## Erweiterung v55 – direkte Maßstab-Schalter und Darstellungsoptionen im Layer-Menü

- `index.html`: Drei Schalter `#scale-objects-btn`, `#scale-orbits-btn`, `#orbit-row-btn` als permanente direkte Kinder der Control-Panel-Leiste in `.scale-main-controls`. `#scale-btn`, `.scale-picker-wrap` und `#scale-popover` wurden entfernt. Cinema-, AR-, Layer- und Zeit-Knöpfe behalten ihren Platz und ihre Verknüpfungen.
- `index.html`: Im bestehenden `#layer-popover` steht `.layer-display-controls` **hinter** den Presets **Alle/Standard**, aber **vor** `.layer-options` (Objektkategorien). Dort sitzen die unveränderten fünf Toggle-IDs `toggle-labels`, `toggle-lighting`, `toggle-four-moons`, `orbit-visibility-btn`, `orbit-contrast-btn` samt SVG, Tooltip und `aria-pressed`.
- `src/app.js`: Öffnungs-/Schließlogik des entfernten Maßstab-Popovers entfällt. Die drei Hauptschalter und fünf Darstellungsschalter bleiben direkt über dieselben Ereignislistener mit den bisherigen Einstellungen verbunden, einschließlich unabhängiger Szenenpräferenzen, Cinema-Gating und der invertierten Alle-Monde-Semantik aus v54.
- `css/styles.css`: Kompakte gruppierte Toolbar, zweizeilig umbrechbar bei kleinen Viewports, rechtsbündiges Layer- und Zeit-Popover; die fünf Layer-Darstellungsschalter bleiben gleichmäßig in einer Reihe über den Kategorien.
- `tests/control-panel-v55.test.mjs`: fünf Regressionstests zu direkter Button-Reihenfolge, Layer-Sektion oberhalb der Kategorien, neun Mondpunkten, entfallener Maßstab-Popover-Logik und Mobile-CSS. Weiterhin laufen alle historischen Tests.
- Release `55.0.0`, PWA-Cache `sonnensystem-shell-v55`. Aktuelle Bedienung: [DELTA-V55.md](DELTA-V55.md) und [HILFE.md](HILFE.md).

## Erweiterung v54 – physischer Cinema-Zoom und neu geordnetes Maßstab-Dropdown (historisch)

- `cinemaEligible(settings)` fordert `row && scaleObjects && !scaleOrbits`. Der App-Button und Renderer verwenden dieselbe Logik.
- `cinemaTrack(layout,width,height)` erzeugt einen Zeitplan aus Halteabschnitten je Körper (1.500 ms) und Überfahrten (1.300 ms) sowie einem eigenen Perspektivabstand pro Körper. Dieser ist proportional zum dargestellten Kugelradius bzw. zum Ring-Footprint und berücksichtigt auch das Bildschirmseitenverhältnis. Zero-Radius-Datensätze erhalten einen positiven Mindestabstand. Ein zusätzlicher Abschluss von 200 ms erlaubt eine abschließende Aktualisierung der Zeitleiste.
- `cinemaPoseAt(track,progress)` liefert aus einer normierten Zeitposition Zielkoordinaten, Entfernung, Körper-ID und Haltestatus. Im Übergang werden Positionen mit monotonem Smoothstep und **Entfernungen logarithmisch** interpoliert. Start, Animationsframe, Drag und Viewport-Resize greifen auf dieselbe Funktion zu, wodurch keine verschiedenen Zoomkurven entstehen. Die Kamerarückkehr setzt weiterhin vor Cinema gespeicherte Winkel, Ziel und Abstand wieder ein.
- `src/app.js`: Der umgekehrte Mond-Button zeigt „Alle Monde“; intern bleibt `fourMoons` aus Kompatibilitätsgründen ein boolescher *Begrenzungs*-Schalter. `fourMoons=true` bedeutet **maximal vier**, während die sichtbare Schalterstellung **Aus** ist. `fourMoons=false` bedeutet **alle Monde**, die sichtbare Stellung **An**. Ein Mond-Moduswechsel beendet eine laufende Cinema-Tour, damit der Zeitplan keine inzwischen ausgeblendeten Objekte enthält.
- `index.html`, `css/styles.css`: Das Maßstab-Popover wurde von zwei auf drei Spalten erweitert, „Reihe“ ist der beschriftete dritte Hauptbutton. Das Mond-Icon zeichnet neun gleichwinklig entlang einer Kreislinie angeordnete SVG-Punkte. Die Breite von 290 px passt sich unter 340 px viewportbreite an.
- `tests/cinema-scale-controls-v54.test.mjs` prüft Gating, 1,5-s-Halten, Größenzoom, monotone Richtung, Portrait-Framing, Seeking/Restore, 3-Spalten-UI, neun Kreispunkte und beide Mondzustände. Versions-, Cache- und ältere Verhaltenstests werden mit ausgeführt.

## Erweiterung v53 (historisch) – Cinema-Transport für die schematische Reihenansicht

- `src/renderer/transitions.js`: `orderedRowBodies` und `rowLayout` akzeptieren eine zusätzliche optionale Größenrichtung (`desc` bleibt die Standardeinstellung). Im normalen Reihenmodus bleiben absteigende Reihenfolge, Abstände, Ring-Außenabstände und Frame-Logik v49/v51 identisch; Cinema wählt `asc` nach tatsächlichen `radiusKm`.
- `src/renderer/cinema.js`: Reine Hilfsfunktionen für Verfügbarkeitsbedingung (`row && !scaleObjects && !scaleOrbits`), Kameraspur aus der sichtbaren Layout-Reihe, gleichmäßig auf Körper verteilte Zeitleistenabschnitte und Zeitformat. Abstand berücksichtigt großen Stern bzw. Saturnring und Hochformat. Eine einstellungsbasierte Dauer von 18–150 s deckt kleine und große Kategorien ab.
- `src/renderer/renderer.js`: `startCinema()` sichert ursprüngliche Kamerazielkoordinaten, Distanz, Winkel, Fokusstatus und Kameramanualflag. Es stoppt optionales Folgen, erfasst den zuletzt angezeigten Layoutzustand und beginnt den sanften Wechsel zur aufsteigenden Reihe. `advanceCinema()` interpoliert die Kamerazielkoordinaten mit Framerate-/Tabwechsel-Begrenzung; `seekCinema()` setzt sie bei Drag sofort. `stopCinema()` stellt die ursprüngliche Reihenrichtung und Kamerapose mit weichem Übergang wieder her. Manuelle Kamerabewegungen und inkompatible Einstellungskombinationen brechen die Tour ab. Reaktion auf Viewport-Resize erhält den Fortschritt.
- `src/app.js`, `index.html`, `css/styles.css`: Context-Button mit SVG Play/Stop nur bei beiden ausgeschalteten Maßstab-Toggles und aktivierter Reihe, individuelle Position in der horizontalen Toolbar. Semantische native `range`-Timeline mit Drag und Keyboard-Seeking am unteren Bildschirmrand, mobilen Safe-Area-Abständen und Live-Objektnamen. Die vorhandene Simulations-Play/Pause-Schaltfläche bleibt unverändert. Bei Wechsel in AR werden Kameraanimationen beendet.
- `sw.js`: Versionswechsel auf `sonnensystem-shell-v53`, neuer Renderer-Helfer im Shell-Precache. `tests/cinema-v53.test.mjs`: Berechtigung der Modi, physikalische Sortierung, Zeitleistenbewegung, Start/Stop/Rückkehr, Drags, Tab-Unterbrechung, Mobile/Layout-Struktur und Overlay-Verhalten. Die vorhandenen Regressionen bleiben aktiv.

## Erweiterung v52 – Layer-Reihenfolge und 14 Kleinkörper

- `index.html` und `src/data/layers.js`: „Sterne“ ist die erste Kategorie der Dropdown-Liste und des gemeinsamen Layer-Modells. Eine separate Kategorie `tno` erlaubt das Anzeigen von Quaoar, Orcus, Gonggong, Sedna und Arrokoth. `Standard` (Sonne + Planeten) und die isolierte Planetenansicht behalten ihre bisherigen Voreinstellungen. Die Bezeichnung wird in der 145-px-Layerliste umbrochen, ohne das Popover zu verbreitern.
- `data/catalog/{asteroids-v52,comets-v52,transneptunian-v52}.json`: Fünf Asteroiden, vier periodische Kometen und fünf transneptunische Objekte als vollständig validierte, sonnenzentrierte Einträge. `data/editorial/de-objects-v52.json` enthält 14 deutsche Artikel mit Links und Modellhinweisen; `data/catalog/manifest.json` verknüpft alle vier Dateien. Katalogversion **9.0.0** mit **174** Himmelskörpern und **174** redaktionellen Einträgen.
- `src/data/catalog.js` und `src/ui/object-list.js`: Optionale geprüfte `aliases` werden übernommen und sind über die Suche auffindbar. `src/data/bodies.js`, `src/data/orbital-math.js`, `src/renderer/solar-view.js`, `src/renderer/labels.js` und `src/ui/object-details.js` berücksichtigen die neue Kategorie bei Typbeschriftung, Farbe, Körpergeometrie, Sonnenbahnen, Labeldichte und Datensatz-Hinweisen.
- Bahnelemente sind Stichproben aus astronomischen Katalogen, für Arrokoth vereinfacht aus historischen Angaben abgeleitet. Die 3D-Simulation propagiert diese als Zweikörper-Keplerbahnen ohne gravitative Störungen oder Kometen-Ausgasung; sehr große TNO-Bahnen werden nicht in einem einzigen optimierten Ausschnitt garantiert. Kein präziser JPL-Horizons-Abgleich für diese neuen Objekte.
- Tests: `tests/category-delta-v52.test.mjs` deckt Dropdown-Reihenfolge, alle Namen und Kategorien, Katalogintegrität, Bahnpositionen, TNO-Filter, Quellendaten, Suche und Versionierung ab. Anwendung `52.0.0`, PWA-Cache `sonnensystem-shell-v52`. Siehe [DELTA-V52.md](DELTA-V52.md).

## Erweiterung v51 – Physische Größen beim Reiheneintritt und Planet-Bahnenwelle

- `src/app.js`: `updateRow()` aktiviert beim **Einschalten** der Reihe `scaleObjects` in beiden Szenen, noch vor der Berechnung des neuen Layouts; die vorherige Geometrie ist zuvor gesichert. Die UI wird sofort inklusive `aria-pressed` aktualisiert. Ausschalten der Reihe belässt den Skalierungszustand unverändert. `updateScale()` wählt ausschließlich für **`scaleOrbits` an → aus bei aktiver Planetenansicht und deaktivierter Reihe** den speziellen `planet-orbits-off`-Übergang.
- `src/renderer/transitions.js`: `gentleEase()` als monotone glatte Kurve ohne Überschwingen; `planetOrbitWaveDelays()` sortiert sichtbare, umkreisende Körper stabil nach realer großer Halbachse und verteilt Startverzögerungen über 0 bis **0,20** der 980-ms-Dauer. `planetOrbitWaveEase()` begrenzt das lokale Fortschrittsfenster und beendet alle Bahnen bis zum gemeinsamen Übergangsende.
- `src/renderer/renderer.js`: Der Übergang erfasst bisher gerenderte Positionen/Radien. Für `planet-orbits-off` erhalten Orbit-Linienradius und zugehörige Kugelposition denselben orbit-spezifischen Fortschritt, sodass sie deckungsgleich bleiben. Ein schneller weiterer Klick übernimmt den aktuellen sichtbaren Zwischenzustand; andere Übergangstypen benutzen die unveränderte `rubberEase`-Kurve. Bewegung-reduzieren deaktiviert den Wave-Modus ebenfalls.
- `tests/row-planet-wave-v51.test.mjs`: Prüfungen für Eintritt/Austritt und UI, weitere manuelle Größenwechsel, Modusgrenzen, monotone Welle/Reihenfolge/Geometriekohärenz, Unterbrechungen und reduzierte Bewegung. Release `51.0.0`, Cache `sonnensystem-shell-v51`. Siehe [DELTA-V51.md](DELTA-V51.md).

## Erweiterung v50 – AR-Kamera neu ausrichten

- `src/renderer/ar-mode.js`: `createARMode()` speichert die letzte gültige Geräteorientierung. Die neue Methode `recenter()` ist nur bei aktivem AR verfügbar, übernimmt den aktuellen Sensorwinkel als Referenz und stellt die Blickbasis auf die aktuelle Orbit-Kamera-Grundausrichtung. `camera.arView` wird ohne Glättungsverzögerung neu gesetzt; Augenposition, Kameradistanz, Szenenmodus und Sensorlistener bleiben unverändert. Ungültige Sensormessungen werden ignoriert. Der AR-Zustand wird über `onStateChange` an die UI gemeldet; `syncSceneMode` erhält daraus die AR-spezifische Reset-Beschriftung und stellt außerhalb von AR die szenenabhängige Beschriftung wieder her.
- `src/app.js`, `src/ui/scene-mode.js`: Der bestehende Reset-Button führt bei aktivem AR `arMode.recenter()` aus und verlässt danach den Handler. Außerhalb des AR-Modus bleibt `cycleCameraPerspective() + updateMode()` mit dem bisherigen Verhalten aktiv. Die UI bestimmt Tooltip und Screenreader-Label passend zu AR-Modus und Planeten-/Sonnensystemansicht.
- `tests/ar-reset-v50.test.mjs`: Prüft wiederholtes Rezentrieren, gesperrte Zustände, Kameraposition, Sensorbewegung nach Reset, zugängliche Beschriftung, Beibehalten der Session und Anwendungseinbindung. Release `50.0.0`, PWA-Cache `sonnensystem-shell-v50`.

## Erweiterung v49 – kompakte Control-Panel-Buttons und ringbewusste Reihenlabels

- CSS `css/styles.css`: `--control-icon-width` = `--control-trigger-width - 9px` (typisch 49 statt 58 px) für AR/Scale/Layer; Zeit 58 px. Die Panelbreite ist für 3/4 Buttons aus einzelnen Flex-Breiten zusammengesetzt. Für das Maßstab-Dropdown wird die gemeinsame rechte Viewportkante durch Neuberechnung des Versatzes erhalten; Layer/Time bleiben unverändert.
- `src/renderer/transitions.js`: `rowLayout` erhält einen optionalen Callback für sichtbare Außenradien. Für Saturn wird die ringführende Außenkante (`1.20 × targetRingScale`) als Abstandshülle verwendet; Körperradien bleiben physikalisch/schematisch wie zuvor. Erste Objektlücke unverändert, danach 30 % mehr radial proportionale Lücke. `rowCameraFrame` verwendet den visuellen Außenradius bei Breiten- und Höhenanpassung.
- `src/renderer/renderer.js`: Die Reihenfolge der Körper wird in `_rowLabelOrder` bei jedem `calcPositions`-Durchlauf stabil hinterlegt; `targetRingScale()` teilt die gleiche Skalierungsformel mit Renderer und Reihenlayout.
- `src/renderer/labels.js`: Feste Reihenlabel-Seiten anhand des stabilen Größenrangs (gerade = oberhalb, ungerade = unterhalb); Saturn verwendet den projizierten Ringaußenradius für die Label-Freiheit. Der Label-Zustand wird beim Reihenwechsel getrennt vom üblichen Orbitlayout geführt.
- Tests: v49 ergänzt Regressionen für gemischte Triggerbreiten, 3/4-Button-Positionierung, ringfreie Nachbarabstände, Labelseiten und Skalierungsmodi.

## Erweiterung v48 – Smartphone-AR-Blicksteuerung

- `src/renderer/ar-mode.js`: Reine Quaternion-Hilfsfunktionen für `DeviceOrientationEvent` (`alpha/beta/gamma` und Bildschirmrotation), kalibrierter Relativblick mit vollständiger Nick-/Gier-/Rollbewegung. `supportsARLook()` zeigt den Button ausschließlich bei sicherem Kontext, Smartphone-Touchprofil und vorhandener Geräteausrichtungs-API. `createARMode()` fordert Berechtigung ausschließlich in der direkten Klickbehandlung an, wartet auf gültige Sensordaten und räumt Listener/Timeouts bei Aus, Abbruch, Hintergrund und Seitenwechsel ab. Keine Kamera- oder Ortsberechtigung und keine Sensor-Datenübertragung.
- `src/renderer/camera.js`: Beim aktiven AR-Blick werden bestehende Augenposition und die durch Sensoren bestimmten Kamera-Forward- und Up-Vektoren in `lookAt()` eingesetzt. Dies ist echtes Umsehen **vom Standort**, keine Rotation des Eye-Punktes um das Zielobjekt. Die Standardprojektion, Picking und die bisherigen Eingabegesten bleiben erhalten. Beim Ausschalten wird der Blick wieder in die Orbit-Kamera umgesetzt, um die letzte Blickrichtung möglichst zu erhalten.
- `index.html`, `css/styles.css`, `src/app.js`: SVG-AR-Button ganz links, standardmäßig versteckt. Wenn die Sensor-API verfügbar ist, wächst die Kopfleiste von drei auf vier Buttons; das Maßstab-, Layer- und Zeit-Dropdown bleiben an der Viewport-Rechtskante ausgerichtet. Zustand per `aria-pressed`, Status per Snackbar.
- Offline: `src/renderer/ar-mode.js` ist in der PWA-Precache-Liste enthalten; Anwendung `48.0.0`, `sonnensystem-shell-v48`.
- Tests: `tests/ar-mode-v48.test.mjs` prüft Feature-Erkennung, Permission/Fehlerfälle, Relative Orientierung, Kalibrierung, Blickprojektion und Sensor-Cleanup. Die übrigen Steuerungs-/Ansichts-/Reihen-Regressionen bleiben aktiv.

## Erweiterung v47 – Navigation und größengewichtetes Reihen-Framing

- `src/renderer/controls.js`: Desktop-Drag **links = bodenparallele Bewegung**, **rechts / Shift+links = Blickrotation**; Touch **ein Finger = Bewegung**, **zwei Finger = Rotation**, Fingerabstand weiterhin Pinch-Zoom. Zwei-Finger-Rotation wird aus gemeinsam gerichteten Fingerbewegungen erkannt, nicht aus dem isolierten Midpoint eines einzelnen Pointer-Events. Klick/Tippen, Keyboard-Pan und Follow-Semantik bleiben erhalten.
- `src/renderer/transitions.js`: `rowLayout()` sortiert weiter nach `radiusKm`, verteilt die Abstände aber relativ zu benachbarten Darstellungsradien (`.14*(r_i+r_(i+1))` bei Kappung). `rowCameraFrame()` liefert sowohl Blickziel als auch Kameraabstand. Der erste Körper wird am linken Rand um 88 % seines Durchmessers beschnitten; die Kamera rahmt bis zu sechs Folgeobjekte in einem näheren Ausschnitt. Weitere Objekte bleiben interaktiv erreichbar. Rahmenberechnung berücksichtigt Quer-/Hochformat und physikalische Maßstäbe. `rowFrameDistance()` bleibt als Kompatibilitätsfunktion bestehen.
- `src/renderer/renderer.js` und `src/app.js`: Ziel **und** Distanz des neuen Kameraframes werden beim Reihen-/Maßstabs-/Szenenwechsel gesetzt. Die bisherige Interpolation der Kamera und der Framerate-unabhängigen Gummiband-Objektanimationen bleibt erhalten. Die minimale Distanz der Reihe kann näher als der Normalmodus liegen.
- Regressionen: `tests/navigation-row-v47.test.mjs`, aktualisierte v3/v4/v38-Gesten- und v45-Reihenprüfungen. Release `47.0.0` und PWA-Shell `sonnensystem-shell-v47`.

## Erweiterung v46 – transparente, unterbrechbare Szenenübergänge

- `src/renderer/renderer.js`: `beginTransition()` erfasst zusätzlich zum geometrischen Zwischenzustand die tatsächlich sichtbaren Körper und Orbitlinien mit ihren aktuellen Opazitäten. Bei schnellen Richtungswechseln werden auch bereits verblassende Elemente erneut in den Snapshot übernommen. `drawDepartingScene()` rendert nur Objekte/Bahnen, die nicht zur neuen Ansicht gehören, während `sceneBodyOpacity()` und `sceneOrbitOpacity()` die neue Szene einblenden. Abgehende Elemente schreiben keinen WebGL-Tiefenpuffer; globale Folgen- und Kamerafunktionen bleiben bestehen.
- `src/renderer/shaders.js`: Kugel- und Saturnring-Fragmentshader erlauben individuelle Deckkraft (`uOpacity`) und damit echte transparente Blenden der 3D-Körper. Der allgemeine Körper-Shader bleibt bei Deckkraft 1 unverändert.
- `src/renderer/solar-view.js`, `planet-view.js`: Bahnmittelpunkte folgen dem **interpolierten** Sonnen- oder Planetenstandort. Dadurch sind die Linien während Reihe-/Ansichtswechseln räumlich an den bewegten Körper gebunden.
- `src/renderer/orbits.js`: historische Bahnen lassen sich mit eingefrorener Radius-, Farb-/Kontrast- und Opazitätskonfiguration zeichnen, bevor die neuen Bahnen eingeblendet werden.
- `orbitOpacity()` blendet beim raschen Zurückschalten aus der Reihenansicht vom **letzten sichtbaren Alphawert** statt direkt bei 0 oder 1 zu beginnen. Interpolationsdauer weiterhin 980 ms; `prefers-reduced-motion` deaktiviert den Übergang.
- Qualitätssicherung: `tests/spring-view-transitions-v46.test.mjs`, Dokumentation [DELTA-V46.md](DELTA-V46.md). Release `46.0.0`, PWA-Cache `sonnensystem-shell-v46`.

## Erweiterung v45 – Reihenansicht und Szeneninterpolation

- `src/data/layers.js`: Jede Szene besitzt den unabhängigen, standardmäßig deaktivierten Schalter `row`.
- `src/renderer/transitions.js`: Reine Funktionen für physikalisch absteigende Reihenfolge, horizontale Positionierung ohne Kugelüberlappung, Hochformat-taugliche Kameradistanz, elastische Interpolation und Positionsmischung. Sortierung basiert auf `radiusKm`, nicht auf dem schematischen Kugelradius.
- `src/renderer/renderer.js`: Beim Wechsel wird der zuletzt **gerenderte** Zustand von Positionen, Körperradien, Saturnring-Größe, Bahnradien und Kamera-Blickwinkel erfasst. Übergänge dauern 980 ms, sind bei wiederholter Betätigung unterbrechbar und respektieren `prefers-reduced-motion`. Die Positionsrechnung liefert weiterhin die echten Kepler-Zielpositionen; erst danach werden Reihenlayout und visuelle Interpolation angewendet. Bei aktivem Fokus wird das Kameraziel während der Animation nachgeführt; eine manuelle Drehung unterbricht nur die animierte Blickwinkelsteuerung. Künstlich schnelle Zwischenpositionen beenden nicht die globale Folgen-Nachführung.
- `src/renderer/orbits.js`, `solar-view.js`, `planet-view.js`, `labels.js`: Orbitgeometrie, Deckkraft, Objekt-/Ringradien, Labelanker und Sonnenglühen folgen den angezeigten Übergangskoordinaten. Reihenmodus blendet Bahnen aus und zurück, ohne die Nutzerpräferenz `orbits` zu verändern.
- `src/app.js`, `index.html`, `css/styles.css`: Neuer zugänglicher `orbit-row-btn` mit drei abgestuften SVG-Punkten unter Umlaufbahn und Kontrast, individuelle Szenenpräferenz, Snackbar sowie kameragestützte Layoutwechsel.
- `sw.js`: neuer Cache-Namespace und vollständiges Precache-Inventar einschließlich `transitions.js`.

Die Reihenansicht ist eine alternative **Visualisierung**, keine Veränderung der astronomischen Bahndaten. Der Zeitverlauf und die Datenquellen bleiben gleich. Siehe `docs/DELTA-V45.md`.

## Historischer Architekturstand v27.0

## Aktueller Stand v44: optimierte Sonnen-/Bahnskalierung

- `src/data/orbital-math.js`: Die Schalterkombination `scaleObjects === true && scaleOrbits === false` verwendet in der **Sonnensystem-Übersicht** einen separaten optimierten Maßstab. Die Sonne ist `4 * renderRadius(sun)` groß. Alle anderen körperlichen Radien werden anhand des Referenz-Sonnenradius aus `data/catalog/stars.json` (696340 km) mit demselben physischen Größenverhältnis skaliert. Die vorhandenen schematischen Heliobahnradien und eingeblendeten Kindbahnen werden mit Faktor 4 multipliziert. Planetenzentrierte Orbits/Radien (mit `center`) bleiben davon unberührt.
- `src/renderer/scene.js`: Auch JPL-/Horizons-Positionsüberschreibungen erhalten diesen Faktor 4 bei schematischen solarzentrischen Koordinaten; Orbitlinien, Kugelpositionen und Labels liegen damit übereinander.
- `src/renderer/renderer.js`, `src/app.js`: Die neue Übersichtsdistanz beträgt `47 * 4 = 188` Szeneneinheiten; maximaler Abstand `100 * 4 = 400`, wenn der Modus in der Sonnenübersicht aktiv ist. Änderungen beider Skalentoggles passen die unmanipulierte Übersicht an. Fokussierte oder nachgeführte Objekte behalten ihre Zielausrichtung. Tooltip und Snackbar nennen den Modus.
- Die anderen drei Kombinationen und die isolierte Planetenansicht behalten die bisherigen Skalen. Die Kataloggeometrie ist nicht mit präziser Ephemeridenphysik gleichzusetzen.
- Release: `44.0.0`, PWA-Cache `sonnensystem-shell-v44`; Qualitätssicherung unter [DELTA-V44.md](DELTA-V44.md).

## Aktueller Stand v43: kompaktes Control-Panel und dauerhafte Bahnfarben

- `index.html`/`css/styles.css`: das Maßstab-Popover ist zweispaltig, ohne Heading, Fußnote oder Text-Statuschips. Die Objekt-Spalte gruppiert Beschriftung/Beleuchtung nebeneinander, 4 Monde darunter; die Bahn-Spalte gruppiert Umlaufbahn/Kontrast nebeneinander. Insgesamt sieben Toggles, jeweils mit `aria-pressed` und Tooltip.
- `src/app.js`/`src/ui/status.js`: alle sieben Toggle-Klicks aktualisieren den Status und rufen `notifyToggle()` auf; die eigene Snackbar `#toggle-toast` ist unten rechts verankert und blendet nach 2,4 Sekunden aus. Die bestehende API-Fehlermeldungs-Toast-Funktion bleibt separat.
- `src/renderer/orbits.js`: die Kategoriepalette und die blaue Erdumlaufbahn sind dauerhaft aktiv; das frühere `orbitColors`-Flag und der Farben-Toggle wurden aus State und UI entfernt. `orbitContrast` beeinflusst nur Linienstärke/Deckkraft.
- Service-Worker-Cache und Versionskennung: v43. Vorherige Layout- und Orbit-Abschnitte dokumentieren historische Zwischenstände, keine aktuellen Menüs.

Siehe [Delta v43](DELTA-V43.md).

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

## Aktueller Stand v40: horizontale Steuerung am Viewportrand

- `#view-mode-status` bleibt ein rahmenloses, absolutes Overlay der 3D-Ansicht. `css/styles.css` überschreibt die historische vertikale Anordnung mit einer horizontalen Flex-Zeile aus zwei 58-px-Triggern und 8 px Abstand. Beide Tasten sind 54 px hoch.
- Die zwei Popovers bleiben in ihren ursprünglichen Wrappers und behalten ihre UI-Logik; sie öffnen 7 px unterhalb der gemeinsamen Tastenzeile. Über gemeinsame CSS-Variablen für Triggerbreite, Zwischenraum und Safe-Area-Rand werden ihre `right`-Offsets so berechnet, dass **beide dieselbe rechte Kante des Viewports** erreichen. Die Menübreiten bleiben 145 und 120 px, die Höhen sind begrenzt und scrollen bei Bedarf.
- `src/app.js` schließt beim Öffnen einer Menüart weiterhin automatisch die andere. Mit nebeneinanderliegenden Triggern kann man direkt umschalten, ohne dass ein offenes Popover einen Trigger überlagert. Die globale `pointerdown`-/`Escape`-Behandlung und `aria-expanded` werden unverändert verwendet. Desktop und Mobil erhalten denselben Aufbau; bis 770 px gilt der kleinere Trigger-Randabstand.
- Anwendungsversion `40.0.0`, Offline-Cache `sonnensystem-shell-v40`. Siehe [DELTA-V40.md](DELTA-V40.md).

## Aktueller Stand v41: getrennte Maßstabs-Schalter

`src/data/orbital-math.js` stellt `displayBodyRadius` und `displayOrbitRadius` bereit. Der Zustand `scaleObjects` bzw. `scaleOrbits` wird in `src/app.js` über beide Szenen hinweg synchronisiert; standardmäßig sind beide `false`. Kugelshader, Picking, Labels und Saturnringe verwenden dieselbe Radiusfunktion. Positionen und gezeichnete Orbitlinien verwenden dieselbe Distanzfunktion.

- Im Sonnensystem wird 1 AE auf 3,4 Szeneneinheiten bezogen. Körperradien in km werden durch `AU_KM` in dieselbe Szeneeinheit umgerechnet; relative Abstände nach `a` sind linear, wenn `scaleOrbits` aktiv ist.
- In isolierten Planetenszenen entspricht der Radius des Planeten 1,28 Szeneneinheiten. Körpergrößen und Satelliten-/Mondabstände in km werden mit diesem Radius in dieselbe Einheit umgerechnet.
- Bei echten Bahnabständen werden Kamera-Zoom- und Clipping-Bereiche erweitert, insbesondere für lange Mondbahnen. Die Orbitmodelle selbst bleiben die vorhandenen vereinfachten Kepler-Daten; fehlende Körperradien (`0`) bleiben unbekannt.
- Die drei Dropdowns sind direkt umschaltbar und enden alle an der rechten Viewportkante; das neue Maßstabs-Dropdown bietet zwei SVG-Toggles nebeneinander.

Version `41.0.0`, Cache `sonnensystem-shell-v41`. Siehe [DELTA-V41.md](DELTA-V41.md).


## Aktueller Stand v42: neu gruppierte Maßstab- und Anzeige-Schalter

- `index.html`: Button-Reihenfolge am oberen rechten Bildschirmrand **Maßstab → Objektlayer → Zeitsteuerung**. Das Maßstab-Dropdown enthält zwei Spalten, links `#scale-objects-btn` über den Icon-Toggles `#toggle-labels`, `#toggle-lighting`, `#toggle-four-moons`; rechts `#scale-orbits-btn` über `#orbit-visibility-btn`, `#orbit-contrast-btn`, `#orbit-colors-btn`. Die sechs Zusatzschalter wurden aus `#layer-popover` entfernt, ohne DOM-IDs, Schaltlogik oder szenenspezifische Einstellungen zu verändern. SVG-Icons, Tooltips, `aria-label`, `aria-pressed` und sichtbarer An/Aus-Status bleiben verfügbar.
- `css/styles.css`: die v42-Overrides ordnen Scale- und Layer-Popover nach der geänderten Buttonreihenfolge wieder an der **gleichen rechten Viewportkante** an, auch bei den mobilen Safe-Area-Werten. Die zwei gleich breiten Spalten minimieren die Menübreite (186 px), die Dropdown-Höhe wird nach Viewport begrenzt.
- `src/data/layers.js`: `createViewSettings('solar')` startet weiterhin mit `lighting:'optimized'`; `createViewSettings('planet')` startet mit `lighting:'realistic'`. Die Szenen behalten ihre unabhängigen Licht-/Labels-/Orbit-Einstellungen, die zwei Maßstabsschalter bleiben synchronisiert. Shader und Rendererlogik bleiben unverändert.
- `src/data/bodies.js`: `CATEGORY_COLORS.moon === '#E6EDF5'` war bereits in v41 korrekt. Die Palette wird unverändert von Bahnen, Katalog und Detailkategorie verwendet.
- `src/app.js`: bestehende Toggle-Handler bleiben bei ihren ursprünglichen IDs; für die zu Icons gewordenen Beschriftungs-/Orbit-Schalter werden die Tooltiptexte beim Zustandswechsel aktualisiert.

Version `42.0.0`, Cache `sonnensystem-shell-v42`. Siehe [DELTA-V42.md](DELTA-V42.md).
