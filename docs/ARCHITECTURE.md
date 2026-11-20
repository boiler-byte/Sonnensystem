# Architektur – Sonnensystem v98

## Prinzipien

Die Browseranwendung nutzt native ES-Module, WebGL und Canvas-Labels ohne Framework oder Frontend-Buildschritt. Der Node-Server stellt nur die erlaubten statischen Dateien und optionale API-Proxies bereit. Die Datensätze liegen lokal in JSON-Dateien; astronomische und redaktionelle Quellen sind über stabile IDs verknüpft.

## Modulverantwortung

| Modul / Ordner | Verantwortung |
|---|---|
| `src/app.js` | Minimaler ES-Modul-Einstieg (`init()` aus `src/app/runtime.js`) |
| `src/app/runtime.js`, `state.js` | Start, gemeinsam genutzter Zustand und Verdrahtung der Controller |
| `src/app/camera-controller.js`, `view-mode.js` | Kameraaktionen, Perspektiven und Ansichtstransitionen |
| `src/app/ar-controller.js` | AR-Sensorsteuerung, Berechtigung und UI-Verknüpfung |
| `src/app/animation-loop.js`, `animation-controls.js` | Zeitfortschritt, Bildschleife, Wiedergabe und Steuerung |
| `src/app/object-catalog.js` | Kataloginitialisierung und optionaler Live-Datenabgleich |
| `src/ui/*.js` | Katalogsuche, Details, Layer, Popovers, Buttons, Mobile-Sheet und Status |
| `src/data/*.js` | Katalogvalidierung, Normalisierung, Typen und Bahnberechnung |
| `src/renderer/renderer.js` | Szenenkoordination und WebGL-Lebenszyklus |
| `src/renderer/object-orientation.js` | Deterministische Eigenrotation, Achsneigung, gebundene Monde, Saturnringachse, Beleuchtung im lokalen Objektraum |
| `src/renderer/solar-view.js`, `planet-view.js`, `scene.js` | Sonnen- und Planetenansichten |
| `src/renderer/orbits.js`, `orbit-cache.js`, `scene-objects.js` | Orbit-Geometrie, begrenzter Cache, gemeinsame Zeichenpfade |
| `src/renderer/controls.js`, `camera.js`, `ar-mode.js`, `cinema.js` | Kamera- und Eingabemodelle, Sensor-AR, Cinema |
| `src/renderer/row-inspection.js`, `src/ui/row-inspection.js` | Bildschirmprojektion, Hover-Auswahl, 160px-Vergrößerung, HUD-Werte und animierter Parent-Pfeil |
| `src/renderer/textures.js`, `texture-sources.js`, `shaders.js`, `geometry.js`, `labels.js` | Textur- und GPU-Ressourcen, Modelle, Label-Canvas |
| `src/services/*.js`, `server/` | Optionale NASA-, Solar-OpenData- und CelesTrak-Abfragen über den Server |

## Start und Datenfluss

1. `index.html` lädt `src/app.js`, das `init()` in `src/app/runtime.js` aufruft.
2. `src/data/catalog.js` lädt `data/catalog/manifest.json` und die dort gelisteten Daten aus `data/catalog/` sowie `data/editorial/`.
3. Die Parser prüfen IDs, Elternbezüge, Schemata, Bahneinheiten und redaktionelle Quellen; `scripts/validate-catalog.mjs` prüft denselben Bestand im CI-/CLI-Kontext.
4. Adapter wandeln die Datensätze in Renderer-Objekte um; redaktionelle Artikel werden über IDs zugeordnet. Entwürfe bleiben verborgen.
5. `src/app/` verbindet Renderer, UI, Zeitsteuerung und optionale Netzwerkdaten.
6. Der Renderer aktualisiert Positionen, Kamera, Layer und Labels abhängig vom Simulationszustand. Kepler-Stützpunkte sichtbarer Bahnen werden mit begrenztem Cache wiederverwendet.
7. Die API-Routen unter `/api/` werden **nicht** durch den Service Worker gecacht; die App bleibt auch ohne externe Anbindung mit lokalem Katalog nutzbar.

## Darstellung und Ressourcen

- Sonnen- und Planetenansicht verwenden gemeinsame Zeichenwege für sichtbare Körper, Bahnfilter und Status.
- Die Orbitalgeometrie liegt in einem begrenzten Cache; Zeichenpuffer werden wiederverwendet. Ungenutzte Positionen werden in stabilen Frames nicht wiederholt berechnet.
- Texturen kommen aus den strikt freigegebenen Ordnern `textures/mobile/`, `textures/standard/` und `textures/high/`. Der Renderer bevorzugt WebP und weicht bei fehlenden Dateien auf andere Qualitätsstufen aus. Wenn kein Bild vorhanden ist, verbleiben schematische Materialien. Ladevorgänge und GPU-Ressourcen werden aufgeräumt.
- Die 2D-Label-Ebene priorisiert Auswahl und begrenzt gleichzeitige Beschriftungen.
- Im Hintergrundtab pausiert die Animation, ohne Simulationszeit nachzuholen.
- `cycleCameraPerspective()` steuert eine vom Layoutübergang getrennte 1.050-ms-Kamerafahrt (`cameraFlight`) über Blickrichtung, Position und Distanz. `cameraView()` nutzt in dieser Zeit die interpolierte Pose; währenddessen dürfen Layout-/AR-Updates die Fahrt nicht überschreiben. Ein manueller Eingriff kann sie bildsprungfrei beenden. Bei reduzierter Bewegung wird sie übersprungen.
- Freies Umschauen per Zwei-Finger-Wischen verwendet die unveränderte vertikale Touch-Mittelpunktsbewegung für `lookAroundFixedEye()` (Finger nach unten = Blick nach unten), auch ohne Auswahl. Maus-Umschauen, Pinch-Zoom und objektbezogene Gesten bleiben unberührt. Im AR-Modus wird die ursprüngliche, **nicht invertierte** relative Sensorrotation verwendet (Gerät nach oben = Blick nach oben); während eines Kameraflugs wird die Sensorausrichtung laufend neu verankert, ohne den Flug zu überschreiben.

## Cinema-Übergänge und Folgen-Initialisierung (v104)

Der Cinema-Track nutzt während der Haltephasen und zwischen den Objekten die **gleiche** interpolierte Pose aus `cinemaPoseAt()`: geometrisch geglättete Zieldistanz und kontinuierliche Verschiebung des Kameraziels. `cinemaSceneAt()` ergänzt `opacity:0`; der alte `cinemaFadeSceneAt()`-Export verweist aus Kompatibilitätsgründen darauf. Nur die Startneuordnung der **Größenreihe** wird über `cinemaEntryOpacity()` bei vollständiger Dunkelheit geschnitten. Die **Entfernungsreihe** benötigt keine Umordnung und fliegt beim Einstieg kontinuierlich zum ersten Körper. `stopCinema()` verwendet wieder den normalen `cinema`-Layout-/Kameraübergang statt eines schwarzen Endschnitts. Die Scanneraktivierung prüft nach wie vor stabile Haltepositionen; Scrubbing zeigt exakt die interpolierte Timelinepose.

`SolarRenderer` startet mit global aktiviertem `followEnabled`. `setBodies()` erfasst nach dem initialen Katalogladen die echte Position des ausgewählten, darstellbaren Körpers via `followSelectedBody()`. Spätere Katalogupdates aktualisieren nur eine **weiterhin** aktive Nachführung; eine manuell ausgeschaltete Nachführung wird nicht ungefragt wieder aktiviert.

## Objektdrehung und Texturausrichtung (v98)

`src/renderer/object-orientation.js` berechnet `rotationPhase(body, simTime)` ausschließlich aus den Objektparametern und der Simulationszeit in Millisekunden. `bodyModel()` baut eine lokale Rotation mit `T * Ry(axisHeading) * Rx(axialTilt) * Ry(spin) * S` auf; die Rücktransformation `localLightDirection()` hält den Beleuchtungsterminator in Weltkoordinaten. Die WebGL-Schleife nutzt dieses Modell sowohl beim normalen Zeichnen als auch bei ausblendenden Übergangsobjekten. `ringModel()` teilt den Saturn-Achsenwinkel, enthält aber **keine** Eigendrehung, damit die Ringebene nicht von der Kugel abweicht.

Die Equirektangular-UVs in `src/renderer/geometry.js` haben `u=.5` auf der vorderen +Z-Halbkugel, steigende Meridiane von dort nach rechts (+X), und `v=1` am Nordpol. Der unveränderte `UNPACK_FLIP_Y_WEBGL=true`-Upload sorgt dafür, dass die nördliche Bildhälfte tatsächlich auf der nördlichen Kugelhälfte liegt. Mit `appearance.texturePhaseDeg` lässt sich die Phase individueller Bilder anpassen; ein vollständiges astronomisches Längensystem / genaue IAU-Polrichtung werden nicht behauptet.

Optional unterstützte Rohdaten: `physical.rotationPeriodHours` (von null verschiedene Stunden, negative Periode für retrograde Körper), `physical.axialTiltDeg` (0–180°), `physical.synchronousRotation` (für gebundene Monde) sowie `appearance.texturePhaseDeg` / `appearance.axisHeadingDeg` (Grad). Falls die Achse bereits über 90° geneigt ist, wird die negative Periodenrichtung nicht ein zweites Mal angewendet. Gebundene Monde beziehen die Richtung zum Parent aus ihrer **Kepler-Position**, nicht aus den für Reihe/Cinema veränderten Bildschirmkoordinaten. Unbekannte Werte ergeben keine erfundene Eigendrehung. Die Schlüssel sind im Katalogschema 1 vollständig optional.

## Cinema-Verweildauer und gemerkter Detail-Tab (v91)

`src/renderer/cinema.js` verwendet für jeden Stopp unabhängig vom Katalogtyp **`CINEMA_HOLD_MS = 5000`**. Die historische Konstante `CINEMA_PLANET_HOLD_MS` bleibt als gleichwertiger Alias für bestehende Integrationen erhalten. Zwischenfahrten dauern unverändert 1300 ms; die separate Cinema-Abspielgeschwindigkeit (1x/2x) verändert nicht die gespeicherte Zeitachse, nur deren reale Abspielgeschwindigkeit. Seek, Pause, Kamera-Halteprüfung und 2x-Toggle bleiben unverändert.

`src/ui/object-details.js` speichert die manuelle Registerkartenauswahl unter `sonnensystem-detail-tab` in `localStorage`. `restoreDetailTab()` liest den gespeicherten Wert beim Start des Control-Panels, ansonsten wird **Daten** geöffnet. Objektwechsel, Auswahlaufhebung und Öffnen einer Planetenansicht ändern den Tab nicht mehr. Zugriffe auf `localStorage` sind fehlertolerant (deaktivierter Speicher/privater Modus). CSS-Scrollleistenplatz und ARIA-/Tastaturzustände bleiben weiterhin synchron.

## Texturverzeichnisse und Änderungsdetektion (v97)

`src/renderer/texture-sources.js` definiert die zulässigen Stufen `mobile:512`, `standard:2048`, `high:4096` und baut ausschließlich lokale, validierte Bildpfade. Dateipriorität: gewählte Stufe, `.webp` vor `.jpg`/`.jpeg`/`.png`, dann alternative Stufen; nur `standard/` akzeptiert die alten 2K-Dateinamen. `server/static.mjs` bedient dieselben allowlist-konformen Pfade mit `Cache-Control: no-store`.

`server/texture-manifest.mjs` liest den vorhandenen Dateibestand, berechnet SHA-256 und verwendet Dateigröße, Inode, `mtimeNs` und `ctimeNs` zum kostengünstigen Wiederverwenden unveränderter Hashes. `GET /api/textures/manifest` antwortet mit `Cache-Control: no-store`; dessen Hash-Versionen stehen an Bildrequests unter `?v=...`. `TextureManager.refreshManifest()` vergleicht spätestens alle 30 Sekunden bei aktivem Rendering die Signaturen pro Objekt/Qualität. Bei geänderten oder neu verfügbaren Ressourcen entfernt der Renderer die alten GPU-Handles, auch nach früheren Fehlversuchen. Ein laufender Download wird vor der Übernahme gegen die jeweils aktuelle Signatur geprüft; veraltete Ergebnisse werden entsorgt. Ohne Node-Manifest kann die App auf statischem Hosting Bilder weiterhin über bekannte Dateinamen und einen zeitbasierten Query laden; Änderungen werden dort bei Online-Neuladung wirksam.

## Gemeinsamer Bahn-/Kontrast-Toggle (v96)

Im Layer-Panel stehen vier Buttons in einem **2×2-Raster**: oben Beschriftung/Umlaufbahn, darunter Beleuchtung/Monde. Der separate Kontrast-Button entfällt. `src/ui/display-controls.js` übersetzt die drei zugänglichen Umlaufbahn-Modi in die **bestehenden** Rendererflags `orbits` und `orbitContrast`: **normal** (`true/false`) → **contrast** (`true/true`) → **off** (`false/false`) → normal. `data-orbit-mode` steuert das passende SVG und Titel/ARIA nennen den aktuellen und den nächsten Modus. `src/ui/event-handlers.js` verändert die beiden Flags gemeinsam; ein widersprüchlicher alter Zustand (`orbits:false`, `orbitContrast:true`) wird als „aus“ behandelt und beim nächsten Klick normalisiert. `displayPreset('standard')` setzt normal, `displayPreset('all')` kontrastreich. Beide Ansichten behalten ihre getrennten Einstellungen. Renderer und Orbit-Geometrie bleiben unverändert. Regressionen: `tests/orbit-toggle-v96.test.mjs` und angepasste UI-Tests.

## Gruppierte Kategorie-Filter (v90)

`src/data/layers.js` trennt die **wissenschaftlichen Objekttypen** (`LAYER_TYPES`, weiterhin zehn) von den acht **bedienbaren Filtern** (`LAYER_FILTER_TYPES`). `LAYER_FILTER_GROUPS` verknüpft `asteroid` mit `binary` sowie `dwarf` mit `tno`. `updateLayerSelection` schaltet alle Gruppenmitglieder atomar (auch bei Aufrufen mit den früheren Untertyp-Schlüsseln); `layerEnabled` prüft weiterhin die ursprünglichen Objekttypen. So bleiben Katalogschema, Renderer-Orbittypen, Farben, Suche und Objektdetails unverändert.

`src/ui/layer-panel.js` zeigt und synchronisiert die acht sichtbaren Checkboxen. Ist nur einer der zwei wissenschaftlichen Typen in einer isolierten Planetenansicht verfügbar, richtet sich die Checkbox nach diesem sichtbaren Typ. Frühere teilweise aktivierte Gruppen werden als gemischter Zustand dargestellt und beim nächsten Klicken vereinheitlicht. Der `layerSummary` zählt bedienbare Filter statt der wissenschaftlichen Untertypen; Presets `Alle` und `Standard` funktionieren weiterhin.

## Mobile Cinema-Zeitleiste am Sheet-Rand (v89)

Im mobilen Breakpoint bis 770 px übernimmt `.viewport>.cinema-timeline` mit `bottom:var(--sheet-visible,45px)` exakt dieselbe sichtbare Sheet-Höhe wie die Kameraaktionen. `src/ui/bottom-sheet.js` aktualisiert `--sheet-visible` im Timeline-Element bei jedem `snapTo()` und während `pointermove`; das CSS animiert `bottom` mit derselben Kurve und Dauer wie `.mobile-sheet`, während `.sheet-dragging` die Übergänge bei direkter Fingerbewegung deaktiviert. Bei `prefers-reduced-motion` bleibt die Bewegung ohne Transition. Die mobile Ebenenreihenfolge ist **Kameraaktionen z36 → Cinema-Zeitleiste z37 → Sheet-Scrim z38 → Mobile-Sheet z40**. Die Zeitleiste verdeckt damit die unten platzierten AR-/Perspektive-Buttons, bleibt aber hinter dem Sheet. Auf Desktop bleiben Position und z12 erhalten.

## Detail-Starttab und Cinema-Tempo (v88)

Der Detailbereich wird in `index.html` zunächst mit **Daten** als sichtbar/aktivem Tab ausgeliefert; `src/ui/event-handlers.js` stellt denselben Zustand bei der Initialisierung wieder her, einschließlich ARIA-Auswahl und Tastatur-Tabindex. `@media(min-width:771px)` aktiviert `scrollbar-gutter:stable` auf `.detail-scroll`, sodass Wissens- und Dateninhalte unabhängig von der vertikalen Scrollbarkeit die gleiche Breite verwenden.

`src/renderer/cinema.js` ermittelt die Haltezeit für jeden Reihenstopp aus der Body-Typen-Zuordnung: **3000 ms** für `planet` / `dwarf`, ansonsten **1500 ms**. Die Reisestrecken bleiben bei 1300 ms. Die Cinema-Uhr `SolarRenderer.advanceCinema()` multipliziert ausschließlich die aktive Wiedergabezeit mit dem separat geschalteten Tempo (1x/2x); Pause, Scrubbing und Simulationsuhr bleiben eigenständig. `toggleCinemaSpeed()` setzt den Frame-Zeitanker neu und synchronisiert den ARIA-Zustand des Transportbuttons direkt rechts neben Play/Pause.

## Objektphysik und mobiles Sichtfeld (v72)

`src/data/catalog.js` erlaubt optionale physikalische SI-Messwerte und ein optionales `orbit.meanDistance` in der gültigen Orbiteinheit. Es validiert Temperaturintervalle und behält physikalische Quellen getrennt von redaktionellen Artikeln. `src/ui/formatters.js` wandelt Kelvin/Pa für die deutsche Anzeige um; `src/ui/object-details.js` zeigt auch fehlende Daten explizit an. Ohne eigenen mittleren Abstand nimmt der Parser die große Halbachse als gekennzeichneten Modell-Fallback.

`src/ui/bottom-sheet.js` dimensioniert die mittlere Öffnungsstufe mit 39 % der Bildschirmhöhe (Mindesthöhe für kleine Ansichten). Der animierte obere Sheet-Rand bestimmt `visibleCanvasFocusOffset()` in jedem Renderframe. `src/renderer/renderer.js` verschiebt den optischen Mittelpunkt für **jede** Kamerapose (auch freie Perspektive und manuell bewegte Kamera), statt ihn nur bei automatisch fokussierter Auswahl anzupassen. Während des Öffnens synchronisiert die Projektion ohne zusätzliche Verzögerung mit der CSS-Höhenanimation.

## Katalogsortierung und Filter-Standard (v73)

`src/ui/object-list.js` kapselt die drei Sortierungen (`catalogSort`: `default`, `distance`, `size`) und die rechts angezeigten Messwerte. Die Standardliste behält ihre Featured-/Kategorie-/Suchrelevanz-Reihenfolge. Der Distanzvergleich benutzt den mittleren Abstand zum **jeweiligen Elternkörper**, gegebenenfalls die große Halbachse; Orbitangaben in km werden über `AU_KM` auf AE normiert. Die Größenreihenfolge verwendet den **Durchmesser (2 × `radiusKm`)**, nicht den maßstabsvergrößerten Rendererdurchmesser. Ungültige, fehlende und 0-Placeholder-Größen werden zuletzt gezeigt und mit `—` beschriftet. Die Sortierung wirkt nach dem bestehenden Wortfilter und Planetenfilter. Der Modus bleibt bei Szenenwechseln erhalten.

`src/app/state.js` aktiviert den Planetenfilter initial. Jeder erfolgreiche Aufruf von `openPlanetScene()` (`src/app/camera-controller.js`) aktiviert ihn erneut; nach dem Öffnen kann er per `catalog-planet-filter` manuell ausgeschaltet werden. Der Filter ist ausschließlich bei `renderer.planetId` wirksam, außerhalb der Planetenansicht bleiben alle Objekte zugänglich.

## Katalog-Entfernungsanzeige und Mondgruppierung (v75)

`src/ui/object-list.js` benutzt weiter den echten mittleren Parent-Abstand für die Datenbasis (`catalogDistanceAu`) und vergleicht alle Werte intern in AE. `catalogMetric` formatiert Distanzen bis **einschließlich 0,2 AE** als km, größere als AE; die Einheitenumstellung beeinflusst die numerische Reihenfolge nicht. `catalogListingDistance` liefert einen davon unabhängigen **UI-Kontextwert** für Listenanzeige und Entfernungssortierung. Ohne effektiven Suchbegriff und ohne **aktiven** Planetenfilter (auch in der normalen Sonnensystemübersicht) übernehmen ausschließlich Objekte vom Typ `moon` die Entfernung ihres direkt übergeordneten Katalogobjekts. Bei Suche oder eingeschaltetem Planetenfilter wird die eigene Bahnentfernung verwendet. Sortiervergleich und sichtbare Beschriftung nutzen dieselbe Kontextfunktion. Die Katalogdaten und die Werte in den Objektdetails werden nicht verändert; ein nicht auflösbarer Parent führt zur eigenen Distanz zurück, ein vorhandener Parent ohne Distanz liefert einen unbekannten Listenwert (`—`).

## Physikalische Daten und Related-Navigation (v74)

`src/ui/physical-stat-icons.js` definiert SVG-Piktogramme für Radius, Orbit, Periode, Exzentrizität, Abstand, Druck, Gravitation und die ergänzenden Sonderwerte. Drei Thermometer-Stände (Min./Mittel/Max.) nutzen dieselbe Vektorform, aber unterschiedliche Füllhöhen. Das halb gefüllte schwarze Thermometer nutzt eine kontrastierende SVG-Kontur ohne Hintergrundfläche. `src/ui/object-details.js` rendert eine gemeinsame Temperaturkachel; nur vorhandene Min./Max.-Messwerte stehen in einer rechten, vertikalen Spalte. Fehlende Mittelwerte bleiben als Strich sichtbar. `src/ui/formatters.js` wandelt Gravitation aus gespeicherten **m/s²** in **G** um (`1 G = 9,80665 m/s²`); sehr kleine Schwerebeschleunigungen werden mit höherer Präzision ausgegeben.

Der Related-Bereich steht im DOM zu Beginn des Daten-Tabs vor den Physikkarten. Der Overflow-Button ruft einen Callback aus `src/ui/catalog-controller.js` auf; dadurch ist `object-details.js` nicht vom globalen UI-State oder Sheet-Controller abhängig. Der Callback befüllt `S.search` und das Suchfeld, rendert den parent-sensitiven Katalog und öffnet `mobileSheets.open('catalog')` (am Desktop die gleiche Navigation). Ein Planetenfilter, der sonst null Treffer ergeben würde, wird dafür deaktiviert; bei passenden Treffern bleibt er bestehen.

## Mittelpunktmarker im Planetenpunkt-Modus (v92)

`drawScenePoints()` verwendet dieselbe `centerMarkerStyle()`-Größenbedingung wie die normale Beschriftung: Unselektierte Objektzentren werden nur markiert, wenn der auf dem Canvas projizierte Objektradius **kleiner als 2,2 CSS-Pixel** ist. Selektierte Objekte erhalten unabhängig von ihrer projizierten Größe den **2,6-Pixel-Marker** in Selektionsfarbe sowie den bisherigen Auswahlring. Die für Saturn in der Reihenansicht berücksichtigte Ringleinwand wird in beiden Modi gleich einbezogen. Der v87-Sonderweg, mit dem der Punktmodus Marker unabhängig von der Objektgröße erzwang, entfällt. Textlayout, Geschwindigkeitsfilter und die Vierer-Textlabelgrenze werden im reinen Punktmodus weiterhin nicht ausgeführt; `false` blendet wie bisher alle Canvas-Markierungen aus.

## Drei Beschriftungsmodi und separate Planetennavigation (v87)

`S.settings.labels` enthält weiterhin `true` für normale Labels oder `false` für vollständig deaktivierte Beschriftung; der dritte Wert `'points'` bezeichnet den neuen Mittelpunkt-Punkt-Modus. `src/ui/display-controls.js` synchronisiert den dreistufigen Toggle und sein `data-label-mode`; im Layer-Dropdown wechselt das SVG bei `'points'` von Textlabel auf einen einzelnen Punkt. Jede Szene hält diese Einstellung in `viewSettings` unabhängig. Die existierenden Layer-Presets setzen `labels:true` zurück. `src/renderer/labels.js` umgeht in `'points'` den Text-Layoutpfad einschließlich der orbitalen Geschwindigkeitsregel und der Vierer-Textlabelgrenze; in v87 erhielten sämtliche Renderer-Körper unabhängig von ihrer Größe einen Mittelpunkt-Punkt in `CATEGORY_COLORS`. **Seit v92** gilt stattdessen die oben erläuterte Größenschwelle; selektierte Körper erhalten weiterhin Punkt und Ring. Bei `false` wird die Ebene geleert.

`index.html` platziert `#back-to-solar` oben links im Viewport, `syncSceneMode()` blendet ihn nur in isolierten Planeten-/Zwergplanetensystemen ein. `src/ui/event-handlers.js` verwendet `renderer.reset()` mit `updateMode()` ausschließlich für diesen Zurück-Button; der Kamera-Button ruft immer `cycleCameraPerspective({keepPlanetScene:true})` auf, unabhängig vom AR-Status. Bei aktivem AR richtet `alignToPerspective()` den Sensorbezug neu aus. Die Perspective-SVGs und Tooltips zeigen dadurch auch in Planetenansichten die aktuelle Pose bzw. die nächste Perspektive statt einer vermeintlichen Rückkehraktion.

## Smart Labels mit orbitaler Lesbarkeitsgrenze (v86)

`src/renderer/labels.js` speichert pro Frame die **orbitalen Relativvektoren** von Objekten zu ihren Parents und den Simulationszeitpunkt. Zur Ermittlung der simulierten Bildgeschwindigkeit wird die Relativverschiebung zweier Frames mit **derselben aktuellen Kameramatrix** projiziert; reine Kamerabewegung und die Translation des Parents gehen nicht ein. Ab **190 px/s** wird nur der Labeltext ausgeblendet, unter **135 px/s** wieder eingeblendet (Hysterese ohne Verzögerung). Bei pausierter Uhr, größeren manuellen Zeitsprüngen, Layouttransitionen oder Reihendarstellung wird kein neuer Geschwindigkeitsfilter aktiv. Der Mittelpunktmarker sehr kleiner Körper sowie der Zentrumspunkt und Auswahlring des selektierten Körpers bleiben sichtbar, selbst wenn der Labeltext vorübergehend verborgen ist. Die Messung prüft ausschließlich die simulierte, nicht die physikalische Bahn- oder Radialgeschwindigkeit.

In der Sonnensystemübersicht begrenzt `solarOrbiterLabelIds()` die Labels der **direkten Begleiter pro Planet/Zwergplanet** auf die vier größten nach `radiusKm` (Monde und Satelliten gemeinsam). Der vierte Platz kann an eine kleinere aktive Auswahl gehen. Die Begrenzung gilt unabhängig vom `fourMoons`-Render-Schalter, aber nur für Labels, nicht für sichtbare Körper, Picking oder Orbitstriche; in der isolierten Planetenszene sind alle Labels berechtigt. Die bestehende `solarMoonLabelIds()`-Funktion bleibt für ältere Integrationen erhalten. Textkollisionen/Dichteraster bleiben abgeschaltet.

## Smart Labels ohne Bewegungsfilter (v85, historisch)

`src/renderer/labels.js` filtert Labels **nicht mehr nach der Geschwindigkeit ihrer Bildschirmbewegung**. Der bisherige `LABEL_MOTION`-Schwellwert, die `isTooFast`-Hysterese und Bewegungsbeobachtungen pro Frame entfallen. Jeder ansonsten zulässige Körper wird ohne Verzögerung platziert, auch bei sehr schnellen Kameraschwenks, Zoomfahrten, 240-Hz-Frames und schnellen Objektbewegungen. Stabile Seitenanker (nur abhängig von Viewport-Rändern), die 4-Monde-/Layerfilter, das Reihen-Hover-HUD und der manuelle Beschriftungsschalter bleiben erhalten. Die Mittelpunkt-Marker aus v84 bleiben unverändert. Die Regressionstests `tests/label-speed-v85.test.mjs` und angepasste ältere Smart-Label-Suites prüfen diese Regeln.

## Smart Labels mit Mittelpunkt-Markern (v84)

`src/renderer/labels.js` zeichnet Objektlabels weiterhin ohne Kollisions- oder Dichtefilter. Der frühere führende Label-Punkt wird jedoch nicht mehr am Text gezeichnet. Stattdessen erzeugt die Renderlogik einen **Mittelpunkt-Marker direkt auf dem Objekt**, wenn dessen projizierter Radius kleiner als der Standardmarker ist. Die Markerfarbe stammt aus `CATEGORY_COLORS`; für das selektierte Objekt wird immer die Selektionsfarbe verwendet, unabhängig von der projizierten Objektgröße. Das ausgewählte Objekt behält zusätzlich den größeren Selektionsring.

## Smart Labels ohne Kollisionsfilter (v83)

`src/renderer/labels.js` erzeugt je sichtbar projiziertem, für die Anzeige freigegebenem Körper ein Label – ohne Dichte-Raster, Zahlengrenze pro Bildschirmbereich oder Überlappungstests gegen Texte und Planetenscheiben. Die Zeichenreihenfolge bleibt nach Objektpriorität sortiert, aber **nur für die Überlagerungsreihenfolge**, nicht zur Unterdrückung: ausgewählte Labels werden zuletzt gezeichnet. Der Seitenanker ändert sich weiterhin nur zur Einhaltung der Bildschirmgrenzen; ebenso bleiben Geschwindigkeits-Hysterese, Layer-/Vier-Monde-Schalter, Reihen-Hover-HUD und manueller Beschriftungsschalter bestehen. Weitere Darstellungs- und Kataloglogik wird nicht verändert.

## Reduzierte Sonne bei Objekt aus / Bahn an (v93)

`displayBodyRadius()` in `src/data/orbital-math.js` liefert in der **Sonnensystemübersicht** bei `scaleObjects === false` und `scaleOrbits === true` für `body.id === 'sun'` exakt `renderRadius(sun) / 3`. Die Reduktion gilt nur für die Sonnenkugel; andere Körper nutzen weiterhin ihre schematischen Radien. Bei `scaleOrbits === false` bleiben die bekannten schematischen und optimierten Größen, bei `scaleObjects === true` die physikalisch proportionale Sonne erhalten. Die lokale Planetenansicht (`center` gesetzt), ihre Objektgrößen sowie sämtliche Orbitpositionen werden nicht verändert. Renderer, Labels und Objektauswahl verwenden die zentrale Radiusfunktion, sodass die neue Größe überall übereinstimmt. `tests/scale-v93.test.mjs` sichert die vier Maßstabskombinationen und die lokale Ansicht ab.

## Zwei Sonnensystem-Abstandskurven (v82)

`src/data/orbital-math.js` berechnet für **Bahn aus** zwei eigenständige, nicht-physikalische heliocentrische Radiusprofile aus den realen großen Bahnhalbachsen als Index: `sceneRadius(a)` für die **schematische** und `optimizedSolarOrbitRadius(a)` für die **optimierte** Ansicht. Beide interpolieren stetig zwischen acht Planeten-Stützstellen und setzen sich jenseits Neptuns mit einer monotonen logarithmischen Kurve fort. Schematisch liegen die acht Bahnen je 2,25 Szeneneinheiten auseinander; optimiert sind die mittleren Radien 19,5/25/29/33/41/49/58/67 Einheiten. Dadurch weichen die inneren Körper der auf 13,56 Einheiten Radius vergrößerten Sonne, während äußere Abstände gegenüber v81 schrumpfen. Die Merkurbahn hat am Perihel mindestens 1,9 Einheiten Abstand von der Sonnenoberfläche.

`OPTIMIZED_SUN_MAGNIFICATION = 3` wirkt nur auf die Sonne in der normalen Sonnenübersicht bei `Objekt an / Bahn aus` (nicht auf das separate Reihen-/Cinema-Layout). Die früheren optimierten Planetengrößen bleiben an `4 × renderRadius(sun)` kalibriert. Die Kombination `Objekt an / Bahn an` bleibt weiterhin physikalisch proportional; auch lokale Planetenbahnen, Mond-/Satellitenabstände und die Reihe behalten ihre bisherige Berechnung. In `src/renderer/scene.js` skalieren optionale JPL-Heliozentrikvektoren über `displayOrbitRadius(body, parent, settings) / (body.a * AU_KM)`, sodass externe Koordinaten und gerenderte Keplerbahnen denselben Halbachsenmaßstab verwenden. Rendering, Bahndateien und Katalogdaten werden nicht geändert; alle neuen Geometriewerte sind Darstellungskonstanten.

## Radar-Rahmen ohne starre Größenobergrenze (v95)

`rowScannerSize()` entfernt den zuvor verbliebenen Hardcap `560px` sowie die zusätzliche Beschränkung auf 80 % einer Viewport-Abmessung. Die gewünschte Rahmengröße folgt dem tatsächlichen projizierten Kugeldurchmesser (`2 × radiusPx + 26px`, mindestens 160px); begrenzt wird sie ausschließlich durch den Platz zwischen Objektnamen, Gravitation/Temperatur und ggf. dem Parent-Abstandspfeil sowie den für Cinema reservierten unteren Steuerbereich. Damit können große Planeten auf entsprechend großen Viewports Scanner von deutlich mehr als 560px erhalten. Kein Eingriff in WebGL-Kugelgröße oder Pfeilposition. `tests/row-scanner-growth-v95.test.mjs` prüft Größen oberhalb des früheren Caps und weiterhin ausreichenden Abstand zu allen Messwerten.

## Responsiver Radar-Messrahmen der Reiheninspektion (v94)

`rowScannerSize()` in `src/renderer/row-inspection.js` lässt den quadratischen Radar-Rahmen zunächst der projizierten Hover-Kugel folgen (bisherige Grundgröße 160 px und Zielgröße Radius × 2 + 26 px). Sobald die unveränderlichen HUD-Grenzen erreicht sind, begrenzt die Funktion die **Rahmengröße selbst** durch den verfügbaren Raum zwischen dem oben platzierten Objektnamen (minimale Unterkante 45 px), den unten platzierten Gravitations-/Temperaturwerten und der horizontalen Abstandslinie (jeweils 12 px Sicherheitsabstand). Die beiden unteren Messwerte werden zusätzlich vor der Pfeillinie begrenzt (38 px angenommene Zeilenhöhe plus 8 px Abstand), damit sich auch diese Angaben nicht gegenseitig überlagern. Für Cinema ist der reservierte Bereich oberhalb der Zeitleiste maßgeblich. Bei engen Viewports wird die frühere CSS-Mindestgröße von 160 px nicht mehr erzwungen; **nur der Scanner-Rahmen**, nicht die 160-px-Hover-Kugel, kann kleiner werden. Pfeil-Geometrie, Datenwerte, SVGs und das Hover/Cinema-Verhalten bleiben unverändert. `tests/row-scanner-clearance-v94.test.mjs` prüft Wachstum bis zur Obergrenze, gefrorene Rahmengröße, Kanten, Cinema und Abstandspfeil.

## Reiheninspektion und Cinema-Haltephasen (v81)

`rowArrowGeometry()` nutzt den direkten `body.parentId` und projiziert dessen Radius im aktuellen Kameraframe. Der horizontal unter dem Himmelskörper liegende Pfeil hat **69 px Abstand** (statt 23 px) vom vergrößerten Kugelrand und endet auf der zum Kind gerichteten **Parent-Silhouette**, gegebenenfalls am Bildschirmrand; wenn die Silhouette die Pfeilwurzel überdeckt, wird der Vektor ausgeblendet. Der physikalische Abstandswert wird nicht durch den gerenderten Radius verändert. Die 160-px-Hoververgrößerung und der Saturn-Ringmaßstab bleiben erhalten.

Die HUD-Schicht platziert die cyanfarbene Objektüberschrift über dem Scanner, Durchmesser innerhalb des Messrahmens und darunter die beiden ikonbasierten Werte für Gravitation und Mitteltemperatur in zwei Spalten. `src/ui/row-inspection.js` importiert beide SVGs direkt aus `src/ui/physical-stat-icons.js` (keine duplizierten Pfade); die separate Informationskarte wurde entfernt. Der Anzeiger bleibt pointer-transparent; bei Cinema werden die Messwerte oberhalb des unteren Transport-Panels begrenzt.

`cinemaRestingObject()` gibt nur in einer Haltephase nach der Einstiegsfahrt und nach dem Einschwingen der Kameraposition/-distanz eine Objekt-ID zurück, nicht während Flug, Drag-Scrubbing, AR oder Szene-Transition. Diese ID fließt durch `SolarRenderer.advanceRowInspection()` in die bestehende WebGL-Vergrößerung und das HUD; während des Übergangs weicht der Effekt weich zurück. Cinema speichert dafür `paused` unabhängig von der Simulations-Wiedergabe; `toggleCinemaPause()` stoppt ausschließlich die Cinema-Uhr, lässt direkte `seekCinema()`-Eingaben auch bei Pause zu und synchronisiert die ARIA-Play/Pause-Steuerung der Zeitleiste. Bei Resume wird `lastAt` neu gesetzt, damit keine nachgeholte Kamerazeit springt.

## Reihenmessung und AR-Navigation (v80)

Der Reihen-Scanner nutzt weiterhin CSS-Pixel und die Projektion des aktuellen Frames. `rowArrowGeometry` projiziert das Parent-Zentrum in den Bildschirmraum und beschränkt die X-Spitze nur noch auf `[0, viewportWidth]`: Bei sichtbarem Zentrum trifft der Pfeil dessen X-Position, sonst den jeweiligen Bildschirmrand. Die reine Längenbegrenzung der Vorversion wurde entfernt. Das unter dem Objekt platzierte Distanzlabel enthält nur den Zahlenwert. Die SVG-Scannerfläche nutzt verbreiterte Winkelmarkierungen sowie eine animierte horizontale Breitenmessung mit Pfeilspitzen; der Durchmesser aus `rowInspectionMetrics` wird im Hauptscanner angezeigt. Der restliche Messkarteninhalt bleibt unverändert.

Bei aktiver AR-Sensorsteuerung verankern `selectBody(id, true)` im `camera-controller` und der „Planetenansicht“-Handler nach dem Ansichtswechsel die aktuelle Gerätehaltung mit `arMode.alignToPerspective()` neu. So übernimmt die Sensorblickbasis die neue Orbit-Perspektive, ohne AR zu deaktivieren oder erneut Berechtigungen anzufordern. Bei nicht aktiviertem AR und bei Auswahl ohne Fokus erfolgt keine Neuausrichtung. Tests: `tests/row-hover-ar-v80.test.mjs`.

## SVG-Abstandspfeil: Sichtbarkeit (v79)

Das initial verborgene `row-inspection-vector-svg` ist ein SVG-Element, kein `HTMLElement`. Das DOM-Attribut `hidden` muss für den sichtbaren Zustand explizit mit `removeAttribute('hidden')` entfernt und beim Ausblenden mit `setAttribute('hidden', '')` gesetzt werden. `svg.hidden=false` reicht nicht aus, da das SVG sonst weiterhin die CSS-Regel `[hidden]{display:none!important}` erfüllt. Ein Regressionstest nutzt ein SVG-attributgetreues DOM-Mock; die zugehörige Entfernungsanzeige und die Pfeilrichtung bleiben unverändert. Offline-Cache: `sonnensystem-shell-v79`.

## Sci-Fi-Reiheninspektion (v78)

Nur im stabilen Reihenmodus erkennt `src/renderer/controls.js` ungedrückte Maus-/Stiftbewegungen über dem WebGL-Canvas. `src/renderer/row-inspection.js` projiziert die gezeichneten Körper und wählt den getroffenen echten Kugelbereich (mit kleiner Touch-/Zeigertoleranz), **nicht** ein unsichtbares 160px-Hitfeld. `SolarRenderer.advanceRowInspection()` verarbeitet den Zustand bei jedem Renderframe und vergrößert allein den WebGL-Zeichenradius des Körpers bei Hover weich auf mindestens 160 CSS-Pixel Durchmesser; `rowGeometry()` und damit Positionen, Sortierung sowie die Cinema-Ziele bleiben unverändert. Saturns Ring wird beim Hover im gleichen Verhältnis vergrößert. Nach Verlassen des Planeten verkleinert sich die Kugel weich. Während einer Messanzeige übernimmt das HUD den Objektnamen anstelle des normalen Canvas-Labels.

`src/ui/row-inspection.js` verwendet eine **pointer-events:none**-Ebene im Viewport. Ein transparenter SVG-Scanner, eine kompakte Messkarte (Durchmesser/km, Gravitation/G, mittlere Temperatur/°C) und ein SVG-Pfeil mit Richtung zum projizierten Parent werden in Canvas-CSS-Pixeln positioniert. Der Pfeil fährt zeitbasiert **vom Körper zum Parent** aus, sein Entfernungslabel steht unter dem Körper. Die physikalische Distanz stammt unverändert aus dem Katalog (`meanDistanceToParent`, sonst `a`) und wird bis 0,2 AE in km, darüber in AE formatiert; unbekannte Werte werden als `—` dargestellt (kein Pfeil). Bei Cinema, AR, Ziehen, Szenen-/Layoutübergängen und außerhalb der Reihe bleibt das HUD aus. Ein reduzierter-Bewegung-Modus deaktiviert CSS-Dekoration und setzt den Vergrößerungsfaktor ohne Tween. Neue Dateien sind im Service-Worker-SHELL eingetragen; Cache `sonnensystem-shell-v78`.

## Offline-PWA

`sw.js` verwendet `sonnensystem-shell-v97` für App-Shell und manifestbasierte Katalogdaten sowie den separaten `sonnensystem-textures-v1` für Texturen. Bildrequests laufen netzwerkpriorisiert und verwenden für den Offline-Fallback eine einzige Cache-Kopie je kanonischem Texturpfad ohne Hash-Query. Der API-Endpunkt `/api/textures/manifest` wird nicht vom Service Worker zwischengespeichert. Beim Aktivieren werden ältere `sonnensystem-shell-*`-Caches entfernt. Nach Updates online neu laden.

## Server und Sicherheit

Der statische Server erlaubt nur definierte Root-Assets, auflösbare Frontend-ES-Module, gültige Datenpfade und erlaubte lokale Texturen. Serverkonfiguration, `.env` und Testdateien werden nicht als Browserressourcen ausgeliefert. API-Zugangsdaten bleiben serverseitig; Antwortdaten externer Dienste werden nicht für Offline-Betrieb garantiert.

## Tests und Wartung

`npm run check` validiert den vollständigen Katalog und startet die Node-Regressionssuite in `tests/*.test.mjs`. Die historisch benannten Feature-Suites bleiben erhalten, damit Fehler in Kamera, AR, Darstellung, Katalog und mobilem UI weiterhin erkannt werden. Die **Release-Metadaten** (Paketversion, HTML-Meta und Cache), PWA-Assets und aktuelle Dokumentationslinks werden dagegen in `tests/release-contract.test.mjs` zentral geprüft; die Feature-Tests sind von einer fest einkodierten Release-Nummer befreit. Neue Funktionsänderungen erhalten eigenständige Verhaltenstests.

Weitere Informationen: [Datenarchitektur](DATA-ARCHITECTURE.md), [Projektpflege](MAINTENANCE.md), [Versionshistorie](RELEASE-HISTORY.md).
