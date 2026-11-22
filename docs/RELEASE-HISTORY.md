## v159 – Daten/Wissen-Reiter bleiben beim Scrollen oben (22.11.2026)

- `.detail-tabs` bleibt im nativen Scrollcontainer `.detail-scroll`, haftet beim Scrollen mit `position: sticky; top: 0` am oberen Rand und überlagert Inhalte mit deckendem Hintergrund sowie `z-index`. Gilt auf Desktop und im mobilen Bottom-Sheet.
- Keine Änderungen an Tab-Wechsel, Fokus-Reihenfolge, Scrollcontainern oder Objektdaten. Regressionstest `tests/detail-sticky-tabs-v159.test.mjs`.
- Paket `159.0.0`, HTML `V159.0`, PWA-Shell `sonnensystem-shell-v159`. Basis v158.

## v158 – CSS-Design-Tokens und historische Doppelungen konsolidiert (22.11.2026)

- Design-Tokens für gemeinsame Steuerelement-Farben und drei historisch unterschiedliche Fokuslinien in `css/base/variables.css` eingeführt. Vorhandenen `--accent` an weiteren Stellen wiederverwendet; die tatsächlichen Farbwerte bleiben gleich.
- AR-/Cinema-Button-Basis, Hover, Fokus und SVG-Gemeinsamkeiten zusammengefasst; identische Erde-Referenzregel im Größenvergleich entfernt; weitere gleiche Deklarationen konsolidiert.
- Gemeinsame Slider-Track-/Thumb-Regeln für Zeit- und Layer-Geschwindigkeit, WebKit und Firefox bewusst getrennt gruppiert. Variabler Trackverlauf `--speed-track-bg` ist auf beiden Inputs definiert und reagiert weiterhin auf `--speed-progress`.
- Unveränderte CSS-Chunks/Kaskadenreihenfolge und identisches Layout. Generiertes CSS **79.620 → 79.002 Byte**. Regressionen inklusive `tests/css-optimization-v158.test.mjs` und vergleichender Browser-Stil-/Screenshot-Prüfung für Desktop/Tablet/Mobil.
- Paket `158.0.0`, HTML `V158.0` und PWA-Shell `sonnensystem-shell-v158` (Cache-Aktualisierung für Bestandsinstallationen).

## v157 – Objektansicht lässt mobiles Detail-Sheet geöffnet (22.11.2026)

- Der `{Objekt}-Ansicht`-Toggle wechselt weiterhin zwischen den Objektansichten, ohne dabei das Mobile-Sheet zu schließen oder dessen Snap-Stufe zu verändern.
- Die übrigen Schließaktionen bleiben unverändert; Regressionstest für das Weiterbestehen des geöffneten Sheets aktualisiert.
- Paket `157.0.0`, HTML `V157.0` und PWA-Shell `sonnensystem-shell-v157`.

## v156 – Referenzkreise ohne Hintergrundbilder (22.11.2026)

- Das CSS-`background-image` aus `.hero-size-reference-circle` entfernt; die Mond-Variante setzt ebenfalls kein Hintergrundbild mehr. Die Farbflächen für Erde (blau) und Mond (beige) bleiben unverändert.
- Die überflüssige CSS-Variable `--hero-size-reference-image` im Detailrenderer entfernt, die zugehörigen Tests angepasst.
- Paket `156.0.0`, HTML `V156.0` und PWA-Shell `sonnensystem-shell-v156`.

## v155 – Toasts für Zeitaktionen und Slider-Fortsetzen (22.11.2026)

- Der Play/Pause-Button meldet über den bereits vorhandenen Status-Toast **„Pause: Umlaufbahnen selektieren“** oder **„Play: Geschwindigkeit …“** samt aktueller Tempoanzeige. Die Auswahl sichtbarer Bahnen und Schweife bleibt auf den Pause-Modus beschränkt.
- **Heute** meldet **„Heute: Datum zurückgesetzt“**, setzt nur die Simulationszeit zurück und verändert weder die Wiedergabe noch die gespeicherte Geschwindigkeit.
- Jede Änderung des Range-Sliders speichert weiterhin die Geschwindigkeit pro Ansicht und setzt eine pausierte Simulation sofort wieder in Play. Der Renderer deaktiviert dabei die pausierte Bahninteraktion. Ohne vorherige Pause wird kein zweiter Start ausgelöst.
- Regressionen: `tests/time-control-toasts-v155.test.mjs`. Paket `155.0.0`, HTML `V155.0`, PWA-Shell `sonnensystem-shell-v155`.

## v154 – Schaubild-Label und Perspektive, Fernansicht halbiert (22.11.2026)

- Der Name des ausgewählten Objekts bleibt im Schaubild auch ohne verfügbaren Größenvergleich sichtbar. Die Referenzschaltfläche erscheint ausschließlich bei einem gültigen Größenvergleich.
- Ein Klick auf das Schaubild stellt zusätzlich die neutrale Perspektive der aktuellen Szene wieder her. Der Nah-/Fern-Kameraabstand und die aktive Auswahl bleiben erhalten, auch in lokalen Szenen und der Reihenansicht.
- In der Fernansicht wird die eigentliche Illustration auf 50 % skaliert; beim Zurückschalten auf Nahansicht kehrt sie mit einer CSS-Transition auf 100 % zurück. Die Einstellung für reduzierte Bewegung wird berücksichtigt.
- Das eingeblendete Nah/Fern-Label unten links wird entfernt. Der Zustand bleibt für Screenreader und CSS über die zugänglichen Button-Attribute erhalten.
- Regressionen: `tests/detail-zoom-v154.test.mjs`; Paket `154.0.0`, HTML `V154.0`, PWA-Shell `sonnensystem-shell-v154`.

## v153 – Schaubild-Zoom zwischen Nah- und Fernansicht (22.11.2026)

- Das Objektschaubild schaltet die Kameraperspektive mit jedem Klick zwischen **NAH** (große Ansicht des ausgewählten Objekts) und **FERN** (Bildausschnitt mit allen aktuell angezeigten Umlaufbahnen) um. Der Zustand erscheint als Kennzeichnung im Schaubild sowie als zugänglicher Toggle-Status.
- Fernaufnahme: Die Szene wird auf ihr Zentrum ausgerichtet. Der Bildausschnitt berücksichtigt die vollständigen elliptischen Bahnen einschließlich Aphel, die dargestellten Objektkategorien und das Bildseitenverhältnis samt mobilem Detail-Sheet; keine bloße feste Zoomstufe. Ohne angezeigte Bahnen gilt die reguläre Systemübersicht.
- Die Nahaufnahme fokussiert das ausgewählte Objekt, die Fernaufnahme pausiert dessen Kameraverfolgung. Ausgewähltes Objekt, Vergleichsschaubild, Größenreferenz, Objektansichtswechsel und Browser-History bleiben unverändert. Kein Erfinden von Sondenbahnen.
- Regressionen `tests/detail-zoom-v153.test.mjs`; Paket `153.0.0`, HTML `V153.0`, PWA-Shell `sonnensystem-shell-v153`.

## v152 – Umschalter für alle Objektansichten (22.11.2026)

- Der bisherige Button „Planetenansicht“ in den Objektdetails wird zum zyklischen **Ansichtsumschalter**. Er nennt stets die aktuelle Ansicht (`Sonnensystem-Ansicht`, `Erde-Ansicht`, `Mond-Ansicht` usw.); Tooltip und Screenreader-Beschriftung nennen auch das nächste Ziel.
- Klicks führen durch die verfügbare Kataloghierarchie eines ausgewählten Objekts bis zu dessen eigener Ansicht und dann zur Sonnensystemübersicht zurück (Mond: Sonnensystem → Erde → Mond → Sonnensystem). Die Objektselektion geht dabei nicht verloren. Unvollständige oder zyklische Parent-Daten führen nicht zu Endlosschleifen.
- In der Zielszene wird die Kategorie des ausgewählten Objekts bei Bedarf eingeblendet. Die bisherige Zurück-Navigation, Browser-History und vorhandenen Layer-Einstellungen bleiben erhalten. Regressionen in `tests/detail-scene-cycle-v152.test.mjs` und aktualisierte ältere UI-Tests.
- Paket `152.0.0`, HTML `V152.0`, Offline-PWA-Cache `sonnensystem-shell-v152`.

## v151 – Browser-History für die Rücknavigation in Planetenansichten (22.11.2026)

- „Zurück“ des Browsers führt wie der linke Button vom lokalen Objekt zum Parent-System (Mond → Erde → Sonnensystem, Charon → Pluto → Sonnensystem). Der UI-Zurück-Button nutzt die gleiche History, ohne doppelte Navigation.
- Beim Öffnen einer isolierten Ansicht werden für noch nicht besuchte Elternansichten eigene History-Einträge vorbereitet, so dass direkte Einstiege in Monde korrekt zurücknavigieren. Browser-Vorwärts stellt Objektansichten ohne Seiten-Reload wieder her.
- Im mobilen Layout hat das bereits vorhandene Bottom-Sheet weiterhin Priorität: Erst schließt Back das Sheet, danach die Planetenszene. Neuer Modul `src/ui/scene-history.js`, Regressionen `tests/scene-history-v151.test.mjs`.
- Paket `151.0.0`, HTML `V151.0`, PWA-Shell `sonnensystem-shell-v151`.

## v150 – Planetenansicht für jedes Objekt und Rücksprung entlang der Elternhierarchie (22.11.2026)

- Der Button „Planetenansicht“ steht für alle katalogisierten Objekte zur Verfügung und öffnet jeweils das aktuell ausgewählte Objekt als Mittelpunkt. Lokale Ansichten zeigen nur seine modellierten direkten Kinder.
- Der Zurück-Button zeigt nun das Ziel an und führt vom Mond zur Erde, von der Erde zum Sonnensystem, von Charon zu Pluto und von Pluto zum Sonnensystem. Elternwechsel behält eine Auswahl des Parent-Objekts; die Sonnensystemübersicht setzt die Auswahl zurück.
- Auch Sonne, Sterne, Asteroiden, Monde, Kometen, Satelliten und Raumsonden bekommen isolierte Ansichten. Raumsonden ohne fortlaufende Ephemeriden werden dort ausschließlich als schematische Objekte dargestellt und erhalten keine erfundenen Bahnen. Sonnenobjekte werden nach AU-Orbitalabständen skaliert.
- Regressionen: `tests/parent-scene-navigation-v150.test.mjs`, bestehende Szenen- und UI-Tests aktualisiert. Paket 150.0.0, HTML V150.0, PWA-Shell `sonnensystem-shell-v150`.

## v149 – Pausierte Umlaufbahnen und galaktische Schweife auswählen (22.11.2026)

- Bei angehaltener Simulation dienen die tatsächlich sichtbaren Bahnen und in der galaktischen Ansicht aufgezeichneten Schweife als Trefferflächen für Hover und Klick/Touch-Tipp. Die Auswahl zeigt die bestehenden Objektdetails, die Kugelauswahl bleibt vorrangig.
- Ein Tooltip nahe dem Mauszeiger zeigt beim Hover **Name** und **Objektkategorie**. Er blockiert keine Eingaben, wird am Bildrand positioniert und verschwindet bei Pointer-Leave, Mausklick oder erneutem Start der Simulation.
- Nicht gerenderte oder ausgeblendete Linien werden nicht aufgenommen; ausblendende Geisterbahnen während Ansichtswechseln werden nicht auswählbar gemacht. Die Kamera-/Touch-Navigation und normale Auswahl bei laufender Wiedergabe bleiben unverändert.
- Neu: `src/renderer/path-picking.js`, `src/ui/orbit-tooltip.js`; Regressionen in `tests/pause-orbit-interaction-v149.test.mjs`. Paket `149.0.0`, HTML `V149.0`, Offline-PWA-Cache `sonnensystem-shell-v149`.

## v148 – Suche mit Shift+K und bedingter X-Löschtaste (22.11.2026)

- `Shift+K` öffnet den Katalog bzw. das mobile Katalog-Sheet und fokussiert das Suchfeld; `/` als bisherige Such-Taste entfällt. Editierbare Eingabefelder, Textbereiche sowie Strg-/Alt-/Meta-Kombinationen bleiben unangetastet.
- Das permanente Shortcut-Badge wurde durch einen barrierefrei beschrifteten X-Button ersetzt. Er erscheint nur bei Suchinhalt und löscht bei Aktivierung den Eingabewert sowie `S.search`, aktualisiert sofort die Ergebnisse und fokussiert das Suchfeld erneut.
- Auch programmatisch aus den Objektdetails eingesetzte Suchbegriffe synchronisieren die X-Sichtbarkeit. Desktop und mobiles Sheet nutzen dasselbe Suchfeld.
- Tests `tests/catalog-search-shortcut-v148.test.mjs`; Paket `148.0.0`, HTML `V148.0`, PWA-Cache `sonnensystem-shell-v148`.

## v147 – Galaktische Bewegung: verlängerte historische Zeitfenster ab über 59 FPS (22.11.2026)

- **Über 59 FPS** werden die Zeitfenster der galaktischen Objekt-Schweife auf die gewünschten Werte erweitert: Sterne/Sonne **50 → 300 Jahre**, innere Objekte **30 → 100 Jahre**, äußere Objekte **100 → 500 Jahre**. Bei **59 FPS oder weniger** gelten unverändert 50/30/100 Jahre. Die FPS-Schwelle verwendet tatsächlich gerenderte Frames und ist unabhängig vom optionalen Debug-Overlay; die erste Sekunde dient als Messphase.
- Die Obergrenze von **1.000 Stützpunkten pro Schweif** bleibt unverändert; es wird nicht nur die Punktzahl erhöht. Ausschließlich durchlaufene Simulationspositionen werden aufgezeichnet. Bei einem Rückfall auf niedrige FPS wird die Darstellung auf das kurze Fenster beschnitten, während bereits aufgezeichnete längere Verläufe für einen späteren FPS-Anstieg erhalten bleiben.
- Regressionen `tests/galactic-history-fps-v147.test.mjs`; Paketversion `147.0.0`, HTML `V147.0`, Offline-PWA-Cache `sonnensystem-shell-v147`.

## v146 – Layer Control: Debug-Steuerung und FPS-Messung (22.11.2026)

- Dreifach-Tipp bzw. -Klick auf Datum/Uhrzeit in **Layer Control → Tempo** ersetzt die Zeitsteuerung durch die Debug-Steuerung. **Zeit** stellt den ursprünglichen Zeitregler samt Play/Pause und Heute wieder her; Zustand und Zeitsteuerung bleiben unverändert. Der Triple-Tipp nutzt eine begrenzte Zeitspanne statt browserabhängiger `click.detail`-Zählung.
- Erster Debug-Toggle **FPS** blendet oben links im Viewport aktuelle FPS (letzte Sekunde) und den rollenden Durchschnitt über 60 Sekunden ein. Gemessen werden erfolgreiche Renderer-Zeichnungen aus `requestAnimationFrame`, nicht die Simulationsgeschwindigkeit. Inaktive/verborgene Tabs setzen die Messfenster zurück. Beim Ausschalten entfällt die Datensammlung.
- Ergänzte Module `src/ui/debug-controls.js` und `src/ui/fps-meter.js`, Offline-PWA-Shell um diese Dateien erweitert. Regressionen in `tests/debug-fps-v146.test.mjs`; Paket `146.0.0`, HTML `V146.0`, Cache `sonnensystem-shell-v146`.

## v145 – Kamerasteuerung bei aktiver Objektverfolgung (22.11.2026)

- Bei aktiv verfolgtem Körper sind **ein Finger / linke Maustaste** jetzt für das Umschauen zuständig und **zwei Finger / rechte Maustaste** für das Verschieben der Kamera. `Shift` + linke Maustaste spiegelt weiterhin die rechte Maustaste (während Verfolgung also Verschieben).
- Das gilt nur für das wirklich aktive Nachführungsziel (`followedBodyId`); eine bloße Objektselektion oder die dauerhaft aktivierte Folgen-Funktion bewirken noch keine Umkehrung. Normaler Maus-/Touchmodus ohne Nachführung bleibt unverändert.
- Manuelles Verschieben setzt weiterhin nur die laufende Nachführung aus, während Umschauen und Zoom sie nicht aussetzen. Die bei Beginn einer Geste gewählte Belegung bleibt bis zum Loslassen erhalten (auch bei Follow-Abbruch mitten im Drag/Swipe). Die Pinch-Gestenerkennung, Mausradzoom, Klickauswahl und Pfeiltasten ändern sich nicht.
- Regression `tests/follow-controls-v145.test.mjs` sowie aktualisierte bestehende Follow-Tests; Versionsangaben `145.0.0` / `V145.0`, PWA-Cache `sonnensystem-shell-v145`.

## v144 – Layer Control: Kategorien und Trennlinie (22.11.2026)

- Die Kategorien **Sterne** und **Raumsonden** werden nur im Objektkategorien-Menü ausgeblendet; der tatsächliche Layerzustand, die Voreinstellungen und die zugrunde liegenden Objekte bleiben unverändert.
- Die Einträge **Monde** und **Satelliten** stehen direkt unter **Kometen**, optisch durch eine schmale Linie getrennt. Die Trennlinie wird bei nicht verfügbaren Kategorien verborgen.
- Regression `tests/layer-categories-v144.test.mjs`; Paketversion `144.0.0`, HTML `V144.0`, PWA-Shell `sonnensystem-shell-v144`.

## v143 – Fehlerbehebung: mobileSheets beim Schließen der Szene (22.11.2026)

- `clearSceneSelection()` in `src/app/runtime.js` importiert nun `mobileSheets` aus dem zentralen Modul `src/app/state.js`, statt eine undefinierte Variable zu lesen. Damit wird das mobile Bottom-Sheet nach erneutem Tippen auf eine leere Szenenstelle ohne `ReferenceError` geschlossen.
- Regressionstest `tests/mobile-sheets-runtime-v143.test.mjs` prüft das tatsächliche Laufzeitverhalten bei bereits leerer Auswahl.
- Paketversion `143.0.0`, HTML-Metadaten `V143.0`, Offline-Cache `sonnensystem-shell-v143`.

## v142 – Endpositionen von Cassini, Galileo und Huygens (22.11.2026)

- Cassini verweist auf Saturn, Galileo auf Jupiter, Huygens auf Titan. JSON-Felder `focusBodyId`, `terminalLocation`, `lastKnownPosition.sourceBodyId` und `distanceToSun.sourceBodyId` definieren die Zielkörperreferenz.
- Auswahl im Katalog und Klick im Details-Schaubild fokussieren den Zielkörper; die Sonde bleibt als ausgewähltes Katalogobjekt sichtbar. Die Zeichenpipeline verwendet weiterhin nur tatsächliche Himmelskörper. Sonnenabstände in den Details werden aus den Zielkörper-Katalogbahnen berechnet, nicht als gemessene aktuelle Sondenkoordinaten ausgegeben.
- Neue Tests, Offline-Shell `sonnensystem-shell-v142`, Versionsmetadaten auf v142 aktualisiert.

## v140 – Leistungsoptimierung durch vier Objekt-LOD-Stufen (22.11.2026)

- **LOD 0 ab 32 px:** Bestehende texturierte 30×42-Segment-Kugel und ursprünglicher Oberflächenshader.
- **LOD 1 von 8 bis unter 32 px:** 12×16-Segment-Kugel mit vereinfachter Beleuchtung ohne Texturabrufe; Saturn-Ringe mit 40 statt 200 Segmenten.
- **LOD 2 von 2 bis unter 8 px:** GPU-seitiger runder Point-Sprite in Objektfarbe; **LOD 3 unter 2 px:** ein CSS-Pixel großer Punkt. Die Stufengrenzen verwenden den projizierten Durchmesser in CSS-Pixeln, unabhängig von DPR.
- **Performance und Bildreihenfolge:** Die kleinen Objekte werden als opaque/transparent getrennte GPU-Batches gerendert; fester Körper, Punktmarker, Umlaufbahnen bleiben tiefenkorrekt. Sichtbarkeit, Label-/Picking-Listen, Positionsberechnung und Szenenwechsel bleiben bestehen.
- Paketversion `140.0.0`, Meta `V140.0`, Offline-Cache `sonnensystem-shell-v140` einschließlich `src/renderer/lod.js`. Regressionen in `tests/object-lod-v140.test.mjs`. NASA/JPL Horizons unverändert.

## v139 – Objektnavigation oben rechts im Schaubild

- `detail-index-nav` mit Vor/Zurück-Pfeilen und Kategorieindex befindet sich direkt in `detail-hero` oben rechts; die Titelleiste `detail-top` einschließlich sichtbarem Objekttitel entfällt vollständig.
- Die Legende lässt auf Desktop und Mobil Platz für die Pfeile; die Objektnavigation bleibt unabhängig von der Schaubild-Zoomtaste, dem Erdmond/Erde-Toggle und den Daten-/Wissen-Tabs.
- Mobiles Bottom-Sheet: `detail-hero` übernimmt von `detail-top` die vertikale Drag-Geste einschließlich Klickunterdrückung nach dem Ziehen. Normale Navigationstastendrücke und Schaubild-Klicks bleiben erhalten.
- Version `139.0.0`, PWA-Shell `sonnensystem-shell-v139`, Regression `tests/detail-hero-nav-v139.test.mjs` und aktualisierte Alt-Tests.

## v138 – Erdmondfarbe, Referenz-Toggle und Abschaltung entbehrlicher APIs

- Das Referenz-Label in den Objektdetails ist jetzt ein eigenständiger, fokussierbarer Toggle-Button (Erdmond/Erde). Es aktualisiert Beschriftung, Größenkreise, Texturbild und Verhältnis und löst kein Objektzoom aus. Die manuelle Wahl gilt auch beim Wechsel auf ein anderes Objekt. Erde und Mond können mit der jeweils anderen Referenz angezeigt werden. Der Erdmond-Referenzkreis wird beige getönt.
- Solar System OpenData, CelesTrak und NASA/JPL SBDB wurden vollständig aus Frontend-Services, Laufzeit-Initialisierung, Statusanzeige, Server-Routen und Providern entfernt. Der lokale Katalog bleibt erhalten.
- NASA/JPL Horizons, Kontaktkonfiguration, Validierung, Position-Override und der Textur-Manifest-Endpunkt bleiben wie gehabt. PWA-Shell und Anwendungsmetadaten auf v138 aktualisiert.
- Tests: aktualisierte Altsuiten sowie `tests/api-removal-v138.test.mjs` und erweiterte Größenvergleichs-Regressionen.

## v137 – Größenvergleich mit Textur-Referenzen und generischem Fallback

- Objektdetails: Das Schaubild zeigt für Planeten und Zwergplaneten weiterhin den Vergleich mit der Erde sowie für Monde und sonstige Körper den Vergleich mit dem Erdmond.
- Fallback: Wenn kein belastbarer Größenvergleich möglich ist oder das ausgewählte Objekt selbst Erde bzw. Mond ist, erscheint wieder das generische Schaubild statt eines Vergleichsdiagramms.
- Referenzdarstellung: Der Vergleichskörper nutzt die zentrierte Mobile-Textur `textures/mobile/earth.webp` bzw. `textures/mobile/moon.webp`.
- Beschriftungen: `hero-size-reference-name` ist farblich an die Referenz gekoppelt – blau für die Erde und beige für den Erdmond.
- Tests: `tests/detail-size-comparison-v137.test.mjs`; App `137.0.0`, HTML `V137.0`, PWA `sonnensystem-shell-v137`.

## v136 – Kreisbasierter Größenvergleich in Objektdetails

- Ersetzt die dekorative Objektkugel **nur** im Schaubild der Objektdetails durch konzentrische Kreise im gleichen kompakten Bereich. Größenverhältnisse nach Katalogradius (gleiche Einheit), lesbare Objekt-/Referenznamen sowie prozentuale bzw. vielfache Durchmesserangabe.
- Planeten/Zwergplaneten: Vergleich mit der Erde; Monde/sonstige Himmelskörper: Vergleich mit dem Erdmond. Ohne verwertbaren Radius bleibt die Grafik leer mit Hinweis. Gleiche Radien werden als zwei Halbkreise dargestellt; sehr kleine Punkte (unter 2 px) werden sichtbar markiert, während die Zahl das exakte Verhältnis nennt.
- Hero-Button bleibt für Kamera-Zentrierung und Tastatur bedienbar; Desktop, responsive Overlay und Mobile Sheet behalten ihre bisherigen Höhen. Keine Änderung an Rendering, Katalog, Suche oder Szene.
- Tests: `tests/detail-size-comparison-v136.test.mjs`; App `136.0.0`, HTML `V136.0`, PWA `sonnensystem-shell-v136`.

## v135 – Tiefenkorrekte Render-Reihenfolge der Bahnlinien

- WebGL zeichnet in Planeten- und Sonnensystemansicht die sichtbaren Himmelskörper vor den Orbit-Linien. Der Tiefentest (`LEQUAL`) bleibt für die Bahnen aktiv, während `depthMask(false)` verhindert, dass transparente Linien den Tiefenpuffer verändern. Vordergrund-Orbits bleiben sichtbar; verdeckte Bahnabschnitte werden korrekt von Körpern überdeckt.
- Ausblendende Szenenobjekte werden beim Ansichtswechsel ebenfalls vor den (normalen und ausblendenden) Bahnlinien gerendert. Die Beschriftungsüberlagerung bleibt unangetastet.
- Regressionstest: `tests/orbit-depth-order-v135.test.mjs`; App `135.0.0`, HTML `V135.0`, PWA-Shell `sonnensystem-shell-v135`. Katalogversion weiterhin `10.2.0`.

## v134 – Textur- und Bildquellen im Objektkatalog

- **29** vorhandene Textur-IDs als `images: [{type, author, sourceUrl, license, licenseUrl, modifications}]` direkt in `stars.json`, `planets.json`, `moons.json` und `dwarf-planets.json` ergänzt. Texturpfade werden aus der Objekt-ID abgeleitet (`textures/standard/{id}.webp` Desktop, `textures/mobile/{id}.webp` Mobil); Bilddateien selbst nicht verändert.
- Solar System Scope: **CC BY 4.0** und Quellenlink. NASA/JPL/USGS: offizielle JPL-Kartensammlungen und NASA-Nutzungsrichtlinien verlinkt. **Achtung:** Im ausgelieferten v133-Archiv waren keine WebP-Dateien vorhanden; die Zuordnung konnte nicht mit den konkreten Bilddateien abgeglichen werden.
- `parseCategory()` validiert Metadaten und gibt sie an die Runtime weiter; Live-Updates erhalten das lokale `images`-Inventar. Ohne Katalog-Deklaration kein Texturprobeversuch. Desktop priorisiert auch in der Planetenansicht `standard/`; vorhandene Qualitäts-Fallbacks bleiben erhalten.
- App `134.0.0`, Katalog `10.2.0` (Schema `1`), HTML `V134.0`, PWA-Shell `sonnensystem-shell-v134`. Regressionstests in `tests/catalog-images-v134.test.mjs`.

## v133 – Sternenhintergrund unabhängig vom Bahn-Maßstab

- **Fehler behoben:** In isolierten Planetenansichten (u. a. Jupiter, Saturn, Uranus und Neptun) schrumpfte der an den Szenenursprung gebundene Sternenhintergrund bei aktiviertem **Bahn-Maßstab** zur Planetenmitte.
- Sterne werden jetzt mit eigener, von Kameraposition und -abstand unabhängiger Projektionsmatrix gezeichnet. Kameradrehung/AR, der mobile Bildausschnitt und die galaktische Parallaxenanimation bleiben wirksam; Planeten, Monde und Orbits behalten ihre bestehende Kamera.
- Regressionstest: `tests/starfield-camera-v133.test.mjs`; Paketversion `133.0.0`, HTML `V133.0`, PWA-Shell `sonnensystem-shell-v133`.

## v132 – Erweiterte Drag-Flächen für das Mobile-Sheet

- Die Katalog-Suchzeile (`catalog-search-row`) und die Kopfzeile der Objektliste (`list-header`) dienen mobil ebenfalls als Ziehflächen: nach oben von halb auf vollständig geöffnet, nach unten wieder auf halb bzw. geschlossen. Die Größe des Sheets und der Abstand der Kamera-Bedienelemente folgen der Fingerbewegung.
- Ein Tipp auf freie Bereiche dieser Zeilen schaltet die Öffnungsstufe weiter. Suchfeld, Planetenfilter und Sortierbutton behalten ihre bisherige Bedienung; ein Wisch unterdrückt den anschließenden unbeabsichtigten Klick.
- Regressionen: `tests/mobile-sheet-catalog-handles-v132.test.mjs`; Paketversion `132.0.0`, HTML `V132.0`, PWA-Shell `sonnensystem-shell-v132`. Desktop-Layout und scrollbare Objektliste unverändert.

## v131 – Browser-Zoom per Doppeltipp entfernen

- Die gesamte Touchoberfläche verwendet `touch-action: manipulation`, sodass der Browser nach einem Doppeltipp keinen Seitenzoom und keine zugehörige Zoom-Steuerung öffnet.
- Gezielte Touchgesten behalten ihre spezifischen Regeln: `#space` verwendet weiter `touch-action: none` für Ein-Finger-Bewegung, Zwei-Finger-Blicksteuerung und die anwendungsinterne Spreizgeste. Scrollflächen und native Pinch-Vergrößerung bleiben verwendbar.
- Regressionen: `tests/touch-double-tap-v131.test.mjs`; Paketversion `131.0.0`, HTML `V131.0`, PWA-Shell `sonnensystem-shell-v131`. Katalog und 3D-Kameralogik unverändert.

## v130 – Intelligentes Schließen und Ziehen des Mobile-Sheets

- Der Katalog- und Detail-Scrollbereich übergibt nach Erreichen von `scrollTop = 0` eine weitere Abwärtswischgeste an den bestehenden dreistufigen Bottom-Sheet-Snap (geschlossen/halb/voll), ohne die normale Scrollfunktion zu ersetzen.
- `detail-top` übernimmt dieselbe vertikale Pointer-Drag-Steuerung wie der Sheet-Header. Drags unterdrücken versehentliche Klicks auf Navigationspfeile bzw. Katalogeinträge.
- Ein Klick auf freien Raum der Szene schließt das Sheet nur dann sofort, wenn **schon zuvor** kein Objekt ausgewählt war; andernfalls wird nur die Auswahl aufgehoben und der Tab „Objekte“ gewählt.
- Regressionen: `tests/mobile-sheet-smart-close-v130.test.mjs`; Version `130.0.0`, HTML `V130.0`, PWA-Shell `sonnensystem-shell-v130`, Basis v129.

## v129 – Objekte-Tab bei aufgehobener Auswahl und Parent-Distanz für Satelliten

- `clearSelection()` aktiviert nun **Objekte** in beiden Seitenleisten-Tabs (Desktop und mobiles Bottom-Sheet), selbst wenn bereits keine Auswahl besteht. Die neue Methode `selectPanel()` öffnet ein eingeklapptes mobiles Sheet nicht und verändert den Browser-Verlauf nicht.
- Die ungefilterte Sortierung **Entfernung ↑** behandelt nun auch `satellite` wie `moon` und nicht-sonnenbezogene `binary`-Begleiter: Der Sonnenabstand des Parent-Systems wird für Sortierung und Listenwert übernommen, bei verschachtelten Elternbeziehungen bis zum sonnenzentrierten Körper. Alle neun Erdsatelliten erscheinen bei der Erde (ca. 1 AE).
- Suche und aktiver Planetenfilter zeigen weiterhin die tatsächlichen lokalen Bahndistanzen; `probe` bleibt unverändert. Katalogdaten und Objektdetails werden nicht überschrieben.
- Regressionen: `tests/selection-satellite-v129.test.mjs`, angepasste Katalogtests und erweiterte Sheet-Tests. Version `129.0.0`, HTML `V129.0`, PWA-Shell `sonnensystem-shell-v129`, Basis v128.

## v128 – Permanentes Folgen, Rückkehr zum Überblick und klare Planetennavigation

- Entfernt: `#center-object-btn` samt Label, CSS, Eventhandler und Zustandsanzeige in den Details. `followEnabled` bleibt permanent an; `follow()` dient nur noch zum gezielten Wiederaufnehmen nach einer Unterbrechung und schaltet nicht mehr aus.
- Überschreitet `updateFollowTarget()` die bestehende bildschirmbezogene Bewegungsgrenze, verwirft `returnToStandardCamera()` das Nachführungsziel und setzt Kamerazentrum, Abstand, Preset sowie die Standardwinkel **Schräg/oben** zurück. Die ausgewählte Objekt-ID bleibt für den nächsten Klick erhalten. Auch im Reihenmodus bleibt der Bildausschnitt sinnvoll gerahmt.
- Der obere **Sonnensystem**-Button aus der isolierten Planetenansicht ruft zuerst `clearSelection()`, dann `renderer.reset()` und `updateMode()` auf; nach dem Szenenwechsel folgt die endgültige Standardkamera. Das verhindert das erneute Zentrieren auf den zuvor verfolgten Körper. AR-Richtung wird anschließend neu ausgerichtet.
- In den Objektdetails bleibt die Aktionenzeile nur sichtbar, wenn das gewählte Objekt eine Planetenansicht öffnen kann. Tests: `tests/follow-overview-v128.test.mjs` und angepasste historische Regressionen. Version `128.0.0`, HTML `V128.0`, PWA-Shell `sonnensystem-shell-v128`, Basis v127.

## v127 – Natürliche Begleiter mit gemeinsamer Entfernung im Objektkatalog

- **Entfernung ↑** ohne Suche und ohne eingeschalteten Planetenfilter: Monde und natürliche Doppelasteroid-Begleiter verwenden für Sortierung und sichtbaren Abstand die mittlere Sonnenentfernung ihres Parent-Systems. Bei verschachtelten Elternbeziehungen wird zum heliozentrischen Ursprung aufgelöst.
- Beispiel: **Dimorphos** ist als Typ `binary` katalogisiert und wurde daher von der bisherigen Mondregel übersehen. Er steht jetzt mit **(65803) Didymos** bei ca. **1,6444 AE**, statt mit 1,152 km vor den Sonnenorbitern zu erscheinen.
- Bei Suche oder aktivem Planetenfilter bleibt die eigene Entfernung zum Elternkörper maßgeblich. Künstliche Satelliten, Sonden und heliosolarsystemische Primärkörper sind ausgenommen; die gespeicherten Bahndaten bleiben unverändert.
- Regressionen: `tests/catalog-parent-distance-v127.test.mjs`. Version `127.0.0`, HTML `V127.0`, PWA-Shell `sonnensystem-shell-v127`, Basis v126.

## v126 – Schmales Layer-Panel, Objektfokus in der Reihe, dynamische Klick-Zonen

- Layer Control Panel in Desktop-/Mobilansicht einheitlich 140 px breit; andere Layoutbreiten bleiben unverändert.
- Ein Canvas-Klick in der Größen- oder Entfernungsreihe fokussiert und zoomt auf die normale Kugelgröße des ausgewählten Himmelskörpers. Kein automatischer Kamera-Zoom durch Canvas-Klick in der gewöhnlichen Orbitalansicht; Katalog/Hero behalten ihr bisheriges Verhalten.
- Die Klicktrefferzone basiert auf dem projizierten Kugelradius einschließlich vorübergehender Reihen-Vergrößerung und ausgewählter Kugel-Skalierung. Entfernt wurden die festen Trefferobergrenzen von 40/90 px. Angeschnittene Kugeln bleiben auswählbar; kleine Objekte erhalten mindestens 12 px Trefferradius. Die Hoverzone einer bereits vergrößerten Kugel folgt deren sichtbarer Größe.
- Relevante Module: `src/renderer/picking.js`, `src/renderer/renderer.js`, `src/renderer/row-inspection.js`, `src/renderer/transitions.js`, `src/app/runtime.js`, `css/styles.css`. Version `126.0.0`, HTML `V126.0`, PWA-Shell `sonnensystem-shell-v126`, Basis v125.

## v125 – Reduzierte Tempo-Ansicht mit Griffwert

- Die sichtbaren Beschriftungen „Geschwindigkeit“, „Pause“, „Heute“ und „Datum“ entfallen; die beiden Aktionen bleiben als Icons mit unveränderten ARIA-Bezeichnungen und Titeln erhalten.
- Die Geschwindigkeitsanzeige wandert in einen nicht-interaktiven Overlay-Bereich rechts des vertikalen Slider-Griffs. Die Position wird passend zu den logarithmischen Schritten aktualisiert und liegt bei Überlappung vor den Minimum-/Maximum-Angaben. Die lokale Datums-/Uhrzeitanzeige bleibt sichtbar.
- Version `125.0.0`, HTML `V125.0`, PWA-Cache `sonnensystem-shell-v125`, Basis v124.

## v124 – Zeitsteuerung vollständig im Layer Control Panel

- Eigenständiges Zeitsteuerungs-Dropdown samt Auslöser entfernt. Es gibt nur noch einen Geschwindigkeitsschieber, einen Play/Pause- und einen Heute-Button im Layer Control.
- Die Tempo-Ansicht zeigt die Überschriften **Geschwindigkeit** und **Datum** über Wert/Regler bzw. der lokalen Simulationszeit.
- Unverändert: logarithmischer Geschwindigkeitsbereich je Ansicht, Pausieren und Rücksetzen auf heute sowie Beschränkung des Tempo-Panels im Reihenmodus.
- Paketversion `124.0.0`, HTML `V124.0`, PWA-Shell `sonnensystem-shell-v124`.

## v123 – Layer-Umschalter zeigt aktive Ansicht, Zeitsteuerung mit Aktionen

- Umschalter **Kategorien / Tempo** direkt unter der zweiten Darstellungs-Buttonreihe (**Kontrast, Beleuchtung, Monde**). Text, Icon und ARIA-Beschriftung kennzeichnen die **aktuell sichtbare** Ansicht; **Kategorien** hat ein Raster-Icon. Die Beschriftung für den nächsten Klick bleibt in Tooltip und barrierefreier Beschreibung erhalten.
- Die Layer-Tempoansicht enthält zusätzlich zwei Buttons: **Play/Pause** und **Heute** mit lokaler Datums-/Uhrzeitanzeige. Beide sind mit der bisherigen Zeitsteuerung gekoppelt; die Simulationsgeschwindigkeit und der Pausezustand bleiben bei einem Wechsel der Ansicht erhalten. Im Reihenmodus bleibt der Umschalter deaktiviert.
- Version `123.0.0`, HTML `V123.0`, PWA-Cache `sonnensystem-shell-v123`, Basis v122. Regressionen: `tests/layer-time-controls-v123.test.mjs`.

## v122 – Katalogauswahl aktiviert Layer und Layer-Tempoansicht

- Die Objektauswahl schaltet eine zuvor ausgeschaltete Kategorie in der aktuellen Szene ein, bevor der Renderer die Auswahl fokussiert. Gruppierte Filter (Zwergplanet/TNO, Asteroid/Doppelasteroid) werden über die bestehende Layerlogik konsistent aktiviert; andere Kategorien und Ansichten bleiben unverändert.
- Im Layer Control Panel wechselt ein neuer Toggle **Tempo / Kategorien** zwischen der Kategorieliste und einem Regler für die Simulationsgeschwindigkeit. Regler und bisherige Zeitsteuerung bleiben synchron und erhalten Pause sowie getrennte Geschwindigkeitseinstellungen je Ansicht. In der Reihe ist der neue Tempo-Toggle aufgrund der festen Simulationsgeschwindigkeit deaktiviert.
- Version `122.0.0`, HTML `V122.0`, PWA-Cache `sonnensystem-shell-v122`, Basis v121. Regressionstests in `tests/layer-selection-speed-v122.test.mjs`.

## v121 – Layer Control Panel: Mondkategorie und blaue Modusfarben

- Aktiviert man **Alle Monde** im Layer-Panel, wird die Objektkategorie **Monde** bei Bedarf ebenfalls eingeschaltet (`updateLayerSelection` → `changeLayers`). Andere Kategorie-Filter bleiben unverändert. Beim Deaktivieren des Monde-Toggles bleibt die Kategorie ausgewählt; die Vierer-Begrenzung gilt wieder.
- **Beschriftung/Planetenpunkt** und **Umlaufbahn/Galaktische Bewegung** erhalten jeweils eine blaue, gut sichtbare Buttonfläche, blauen Rand und blaues Icon. Andere Modi behalten ihre bestehenden Farben und Funktionen.
- Version `121.0.0`, HTML `V121.0`, PWA-Cache `sonnensystem-shell-v121`, Delta-Basis v120. Regressionen: `tests/layer-panel-modes-v121.test.mjs`.

## v120 – Layer Control Panel mit Kontrast-Halbmond und frei verteilten Monden

- Obere Zeile **Beschriftung / Umlaufbahn** bleibt im bisherigen zweispaltigen Raster. Die drei Schalter **Kontrast / Beleuchtung / Monde** belegen die zweite Zeile mit je einem Drittel Breite. In der Reihen-Darstellung bleiben bisherige Sichtbarkeitsregeln bestehen und der Beleuchtungsschalter nutzt wieder die gesamte Breite.
- Kontrast-Icon: klassischer halb gefüllter Kreis (Halbmond). Monde-Icon: neun unregelmäßig verteilte Punkte mit unterschiedlichen Größen. Schaltzustände und Funktionen unverändert.
- Version `120.0.0`, HTML `V120.0`, Cache `sonnensystem-shell-v120`, Delta-Basis v119. Test: `tests/layer-control-layout-v120.test.mjs`.

## v119 – Cinema-Kamera entlang einer natürlichen Kurve

- Zwischen benachbarten Stopps in beiden Reihenmodi führt der Cinema-Modus die Kamera über eine kubische 3D-Bezierkurve. Die Kamera steigt dezent an, zieht sich etwas zurück und erreicht das nächste Objekt ohne Versatz.
- Die Bogenhöhe ist von Abstand und Zoom abhängig und bleibt begrenzt. Objektzentren, 5-Sekunden-Haltezeiten, Fahrtzeit, 1x/2x, Pause/Scrubbing, Einstieg und Rückkehr bleiben unverändert.
- Paket `119.0.0`, HTML `V119.0`, Cache `sonnensystem-shell-v119`, Delta-Basis v118; Tests in `tests/cinema-curve-v119.test.mjs`.

## v118 – Reihendarstellung mit Farbmodi und unabhängigem Cinema-Play

- Der **Bahn**-Maßstab-Toggle wird in beiden Reihenmodi verborgen und erscheint nach Verlassen der Reihe mit dem zuvor gespeicherten Wert. Solange die Reihe läuft, ist `scaleOrbits` für die sichtbare Geometrie ohne Wirkung.
- Der Cinema-Startbutton erscheint bei jeder aktiven Reihe, auch mit ausgeschaltetem Objektmaßstab oder zuvor aktiviertem Bahnmaßstab. Die Tour ist in jeder dieser Konstellationen startbar; Play/Pause und 2x der Timeline erscheinen weiterhin erst im Film.
- Der Reihen-Button ist bei **groß nach klein** grün und bei **nah bis fern** blau; außerhalb der Reihe bleibt der bisherige neutrale Zustand. Paket `118.0.0`, HTML `V118.0`, Shell `sonnensystem-shell-v118`, Delta-Basis v117. Regressionstests: `tests/row-controls-v118.test.mjs` plus aktualisierte Cinema-Regressionen.

## v117 – Start ohne Objektauswahl, Katalog und Schrägperspektive

- Beim Start sind weder im App-Zustand noch im Renderer Objekte ausgewählt (`null`). Das Laden des Katalogs behält `null` bei; erst die explizite Auswahl setzt ein Objekt. Die Detail-HTML-Platzhalter beginnen neutral.
- Die bereits bestehenden Starts **Objekte** (Desktop-Sidebar sowie Tab-Auswahl im Mobile-Sheet) und **Schräg/oben** (Kamerapreset 0) werden beibehalten und durch neue Regressionstests abgesichert.
- Alle anderen Startwerte und Einstellungen unverändert, einschließlich standardmäßig aktiviertem globalen Folgen ohne anfängliches Ziel. Paket `117.0.0`, HTML `V117.0`, PWA-Shell `sonnensystem-shell-v117`, Delta-Basis v116. Tests in `tests/start-defaults-v117.test.mjs`.

## v116 – Kompakte Cinema-Zeitleiste in der Reihendarstellung

- Untere Textzeile „Klein/Groß“ beziehungsweise „Nah/Fern“ aus der Cinema-Zeitleiste und deren UI-Aktualisierung entfernt.
- Cinema-Objekt und Laufzeit direkt über den Range-Slider in dieselbe rechte Spalte gesetzt; die obere Kopfzeile liegt an der Oberkante der 36-px-Play/2x-Buttons, die Unterkante des Sliders auf deren Unterkante. Das HUD wird dadurch deutlich flacher.
- Desktop und Mobile behalten ihre jeweiligen Einblendpositionen, und der mobile Abstand zum Sheet bleibt dynamisch. Cinema-Fahrten, Abspieloptionen und Barrierefreiheitsbezeichnungen unverändert. Paket `116.0.0`, HTML `V116.0`, PWA-Shell `sonnensystem-shell-v116`, Delta-Basis v115. Regressionen in `tests/cinema-timeline-v116.test.mjs`.

## v115 – Kamera in der Reihen-Darstellung wie v113

- Die v114-Regressionsursache behoben: Ein noch eingeschalteter, aber ausgesetzter Folgen-Schalter startete beim Reihenwechsel die Kamera-Nachführung erneut und ersetzte den gewohnten v113-Reihenausschnitt durch ein Objektzentrum und einen anderen Zoom.
- Nur bei tatsächlich aktivem `followedBodyId` wird die Kamera beim Wechsel der Reihenordnung oder Szene nachgeführt. Neu geladene Katalogdaten stellen unterbrochenes Folgen nicht mehr ungefragt wieder her; der erste Katalogstart aktiviert weiterhin standardmäßig Folgen.
- Blickwinkel und Abstände der Reihenansicht (Aus, Größe, Entfernung) sowie Cinema-Rückfahrten entsprechen wieder dem v113-Verhalten für nicht verfolgte Objekte. Der v114-Folgen-Toggle bleibt bewusst eingeschaltet und wird erst durch eine neue Objektauswahl erneut nachgeführt.
- Unverändert: v114-Reihenfolge der Toggle-Schalter, Kontrast-Toggle, Renderer-Auswahl ohne Zoom, Katalog-/Hero-Auswahl mit Zoom. `115.0.0`, HTML `V115.0`, Cache `sonnensystem-shell-v115`, Delta-Basis v114. Regressionstests: `tests/camera-row-v115.test.mjs`.

## v114 – Getrennte Darstellung, dauerhafter Folgen-Schalter und gezielter Objektfokus

- Maßstabs-Schalter auf **Reihe | Objekt | Bahn** sortiert. Im Layer-Panel wieder eigenständiger Kontrast-Schalter in Reihe zwei. Bahnmodus im Sonnensystem **Umlaufbahn → Galaktische Bewegung → Aus**, in Planetenansichten **Umlaufbahn → Aus**, jeweils unabhängig von `orbitContrast`. Kontrast wirkt sowohl auf Umlaufbahnen als auch auf galaktische Spuren.
- Nachführung stoppt bei zu schneller Objektbewegung oder manueller Kamerabewegung, ohne global `followEnabled` zu deaktivieren. Keine ungewollte Wiederaufnahme in der Render-Schleife; explizite Auswahl nimmt sie wieder auf.
- Renderer-Klick zentriert ohne Zoomänderung; Katalogauswahl und Klick auf das Objektbild in der Detailansicht zentrieren inklusive Zoom. Hero-Bild ist ein Button mit passendem ARIA-Label.
- Paketversion `114.0.0`, HTML `V114.0`, PWA-Shell `sonnensystem-shell-v114`, Delta-Basis v113. Regressionen für die neuen Interaktionen und angepasste bestehende Tests.

## v113 – Kontinuierliche Spuraufzeichnung, Reduktion ausschließlich älterer Abschnitte

- Zu langsame Bewegungen und ein Wechsel von hoher zu niedriger Zeitgeschwindigkeit führen nicht mehr zu neu entstehenden langen Geraden hinter dem Planeten: Jeder tatsächlich erreichte Simulationsschritt wird als Stützpunkt übernommen, unabhängig von Biegung oder Mindestzeitabstand.
- Beim Limit von 1.000 Punkten pro Objekt bleiben die neuesten 20 % der gespeicherten Punkte inklusive des Live-Endes ohne Vereinfachung; ältere Punkte werden weiterhin nach 3D- und Bildschirmfehler reduziert. Der erste Punkt wird weiterhin nur nach dem 30/50/100-Jahres-Fenster vorgezogen.
- Die exakt gerade Sonne bleibt auf zwei Endpunkte reduziert. Pausen, verdeckte Layer, Sternenparallaxe und Zeitsteuerung sind unverändert. Keine rückwirkende Bahnberechnung für bei sehr schneller Simulation übersprungene Zwischenzeiten.
- Tests: `tests/galactic-continuous-trails-v113.test.mjs` einschließlich Realgeometrie- und Tempoänderungsregressionen. Version `113.0.0`, PWA-Shell `sonnensystem-shell-v113`, Delta-Basis v112.

## v112 – Verbesserte galaktische Spuraufzeichnung

- Standardlimit pro sichtbarem Objekt von 240 auf 1.000 Punkte angehoben (einschließlich Live-Endpunkt). Anfang und laufendes Ende bleiben bei der Reduktion geschützt; die 50-/30-/100-Jahres-Fenster bleiben unverändert.
- Kurvenpunkte anhand der tatsächlich dargestellten galaktischen 3D-Flugbahn und, wenn verfügbar, der Bildschirmprojektion ausgewählt. Mehrfache Vereinfachung berücksichtigt bereits ausgelassene Kurvenstücke durch konservative Abweichungsgrenzen und bevorzugt subpixelgenaue Reduktionen statt auffälliger Linienkürzungen.
- Wiederverwendbarer Puffer für Projektionswerte, unveränderte Simulationsuhr und unveränderte Sternenparallaxe. Version `112.0.0`, Offline-Shell `sonnensystem-shell-v112`, Delta-Basis v111.

## v111 – Sternenparallaxe bei galaktischer Bewegung

- Die 2.200 Sternpunkte werden nur bei aktivem galaktischen Modus perspektivisch leicht gegen den festen Sonnen-Flugvektor verschoben. Der Einfluss hängt vom im Sternmodell bereits vorhandenen Abstand ab (nahe stärker, ferne kaum).
- Die Parallaxe folgt der seit dem Einstieg durchlaufenen Simulationszeit. Pause, Rückwärtslauf und Änderung der Abspielgeschwindigkeit wirken ohne Änderung der Zeitsteuerung; Ein-/Austritt wird weich interpoliert.
- Verschiebung auf acht Weltkoordinaten begrenzt, keine Sternenschweife oder zusätzlichen Draw-Calls. Mit neuem Modul `src/renderer/galactic-parallax.js` und eigenständigen Regressionstests.
- Version `111.0.0`, PWA-Shell `sonnensystem-shell-v111`, Delta-Basis v110.

## v110 – AR-Bewegung entfernen; geradlinige, längere und sparsame galaktische Spuren

- Der zweite AR-Button (Vier-Wege-Kreuz) und der entsprechende `devicemotion`-Code aus v106 sind entfernt. Sensorblick über `deviceorientation` bleibt bestehen.
- Illustrative Sonnenbewegung mit konstantem, festem Vektor statt sinusförmiger Abweichungen: Sonnen-Spur geometrisch exakt gerade.
- Neue Zeitfenster für aufgezeichnete Spuren: Sonne 50 Jahre; innere Planeten 30 Jahre; äußere Planeten und transneptunische Objekte 100 Jahre. Weitere Kleinkörper nach 5-AE-Grenze.
- Kurvenabhängige, auf höchstens 240 Punkte je Objekt begrenzte Aufzeichnung mit aktuellem Live-Endpunkt; bei Erreichen des Punktbudgets werden unwichtige Zwischenpunkte entfernt, der Startpunkt erst nach Ablauf der zeitlichen Spurlänge vorgezogen. Unsichtbare Objektlayer erzeugen keine Spur und behalten keine Aufzeichnung.
- Bestehendes Simulationszeitmodell, WebP- und GitHub-Pages-Verhalten bleiben unverändert. Paketversion `110.0.0`, HTML `V110.0`, PWA-Shell `sonnensystem-shell-v110`, Delta-Basis v109.

## v109 – Texturabrufe ohne Zeitstempel auf GitHub Pages; fehlende Dateien nur beim Neustart erneut suchen

- Auf statischen GitHub Pages verwendet der Renderer für WebP-Texturen saubere relative URLs ohne zeitbasierte `?v=`-Parameter.
- Fehlgeschlagene Bilddateien werden nach allen vorgesehenen Qualitäts-/Namensalternativen für die gesamte Sitzung vorgemerkt, statt sie alle 30 Sekunden erneut zu laden. Auch Qualitätswechsel und spätere Node-Manifeständerungen erzwingen keinen erneuten Versuch; der nächste reguläre Versuch folgt erst mit App-Neustart oder manuellem Neuladen.
- Fehlt das optionale Node-Texturmanifest, wird es nur einmal pro Sitzung geprüft. Mit verfügbarem Node-Manifest bleiben SHA-256-Parameter und automatische Aktualisierung bereits erfolgreicher Texturen erhalten.
- Paketversion `109.0.0`, HTML `V109.0`, PWA-Shell `sonnensystem-shell-v109`, Delta-Basis v108.

## v108 – Texturdateisuche nur als WebP

- Die Kandidatenliste für alle drei Texturstufen (`mobile`, `standard`, `high`) verwendet nur noch `.webp`, einschließlich der historischen 2K-Aliasnamen im Ordner `standard`.
- `.jpg`, `.jpeg` und `.png` werden nicht mehr als Objekttexturen angefragt, im optionalen Node-Texturmanifest gelistet oder durch die Texturroute des Service Workers verarbeitet. PWA-Icons bleiben PNG-Dateien.
- Die Qualitäts-Fallbacks, relative GitHub-Pages-Verzeichnisse, Cache-Strategie und prozedurale Oberfläche bei fehlenden Bildern bleiben erhalten. Bilder sind nicht Bestandteil des Delta-Pakets; ggf. vorhandene JPG/PNG-Bilder separat zu WebP konvertieren.
- Paketversion `108.0.0`, HTML `V108.0`, PWA-Cache `sonnensystem-shell-v108`, Delta-Basis v107.

## v107 – GitHub Pages: relative Objekttextur-URLs

- Texturdateien werden aus der Lage der installierten App (ES-Modul-URL) angefordert; GitHub Pages-Projektseiten unter `/Sonnensystem/` und tiefer verschachtelte Pfade funktionieren ohne festen Repositorynamen. Interne `/textures/...`-Manifest-Schlüssel, Dateinamens-Aliase, Qualitäts-Fallback und Offline-Cache bleiben erhalten.
- Optionaler Endpunkt `api/textures/manifest` wird ebenfalls relativ zum Installationsverzeichnis abgefragt. Bei rein statischem Hosting ohne Node-Server bleibt der Direktabruf der Bilddateien aktiv.
- Keine Bildtexturen im Delta enthalten; die Dateien müssen im veröffentlichten `textures/`-Verzeichnis bereitgestellt werden.
- Paketversion `107.0.0`, HTML `V107.0`, PWA-Cache `sonnensystem-shell-v107`, Basis v106.

## v106 – AR-Bewegungsnavigation

- Zusätzlicher Toggle unmittelbar neben dem AR-Button; sichtbar nur bei aktivem AR.
- Optionales Verschieben der Ansicht durch Bewegungssensor-Impulse vor/zurück/links/rechts, analog zur Ein-Finger-Geste. Orientierungsgeste und Zeitsteuerung bleiben unverändert.
- Eigene Sensorfreigabe, Zustandsanzeige, Entprellung, Dämpfung, Sicherheitsgrenzen und Bereinigung bei Deaktivierung/Hintergrundwechsel. Kein absolutes AR-Positionstracking.
- Paketversion 106.0.0, HTML V106.0 und PWA-Cache `sonnensystem-shell-v106`.

## v105 – Objektgeschwindigkeitsbegrenzung im Rendering

- Die sichtbare Umlaufbewegung und Eigendrehung von Objekten ist auf maximal **5 Umdrehungen je realer Sekunde** begrenzt (auch rückwärts).
- Die Begrenzung arbeitet mit unabhängigen visuellen Zeitständen pro Objekt und Rotationstyp; synchron rotierende Monde orientieren sich anhand ihrer begrenzten Umlaufphase.
- Die Simulationszeit, Wiedergabegeschwindigkeit, Zeitregler und Kalenderwerte bleiben unverändert.

# Versionshistorie – Sonnensystem

Dieses Dokument enthält die **vollständigen ursprünglichen Delta-Notizen für v2 bis v67** sowie den historischen Hotfix v6.1. Die früheren Einzeldateien wurden in v68 zusammengelegt. Die Releases v69 bis v112 stehen vor den archivierten Deltas. Angaben über frühere Bedienoberflächen, Testzahlen und Installationswege sind **historisch**; maßgeblich für den aktuellen Stand sind [README](../README.md), [Architektur](ARCHITECTURE.md) und [Hilfe](HILFE.md).

## Schnellindex

- [v104 – Cinema-Kamerafahrten, Zwei-Finger-Richtung und Folgen](#release-v104)
- [v103 – Galaktische Spuren nur aus neuer Bewegung](#release-v103)
- [v102 – Galaktische Linien starten bei Länge 0](#release-v102)
- [v101 – Galaktische Spur mit 3D-Abwärtsrichtung](#release-v101)
- [v100 – Galaktische Ansicht und Bezugssystemwechsel](#release-v100)
- [v99 – Reihenzeit und Cinema-Fade](#release-v99)
- [v98 – Eigenrotation, Achsneigung und Texturausrichtung](#release-v98)
- [v97 – Drei lokale Texturstufen und automatische Cache-Aktualisierung](#release-v97)
- [v96 – Gemeinsamer Umlaufbahn-/Kontrast-Button und 2×2-Layout](#release-v96)
- [v95 – Radar-Rahmen ohne starre 560-px-Grenze](#release-v95)
- [v94 – Radar-Rahmen wächst nur bis zu den HUD-Informationen](#release-v94)
- [v93 – Sonne auf ein Drittel bei Objekt aus / Bahn an](#release-v93)
- [v92 – Punktmodus nur für kleine oder selektierte Objekte](#release-v92)
- [v91 – Cinema mit 5 Sekunden und gemerkte Detail-Tabs](#release-v91)
- [v90 – Zusammengefasste Objektkategorie-Filter](#release-v90)
- [v89 – Mobile Cinema-Zeitleiste direkt am Sheet](#release-v89)
- [v88 – Daten-Tab als Standard, stabiler Scrollbereich und Cinema-2x](#release-v88)
- [v87 – Drei Beschriftungsmodi und eigenständige Planetennavigation](#release-v87)
- [v86 – Smart Labels mit Bahnbewegungsfilter und Vierergrenze](#release-v86)
- [v85 – Smart Labels ohne Geschwindigkeitsfilter](#release-v85)
- [v84 – Smart Labels mit Mittelpunkt-Markern](#release-v84)
- [v83 – Smart Labels ohne Kollisions-Ausblendung](#release-v83)
- [v82 – Flachere Schemabahnverteilung und größere Sonne](#release-v82)
- [v81 – Direktes Reihen-HUD und Cinema-Pause](#release-v81)
- [v80 – Reihenvermessung, Parent-Pfeil und AR-Neuausrichtung](#release-v80)
- [v79 – Fix: Abstandspfeil in der Reihendarstellung](#release-v79)
- [v78 – Animierter Reihen-Scanner und Entfernungspfeil](#release-v78)
- [v77 – Reihenmodi und kompakte Objektdetails](#release-v77)
- [v76 – Kompakte Temperaturkachel](#release-v76)
- [v75 – Entfernung in km und Mondgruppierung](#release-v75)
- [v74 – SVG-Detailwerte und Related-Kataloglink](#release-v74)

- [v73 – Sortier-Toggle und Planetenfilter als Standard](#release-v73)
- [v72 – Objektphysik und kleineres Mobile-Sheet](#release-v72)
- [v71 – Zwei-Finger-Blickrichtung und AR-Vertikalbewegung korrigiert](#release-v71)
- [v70 – Kamerafahrten beim Perspektivwechsel und invertiertes vertikales AR-Umsehen](#release-v70)
- [v69 – Kamerasymbole zeigen die aktuelle Blickrichtung](#release-v69)

- [v67 – CSS-Bereinigung](#release-v67)
- [v66 – Performance bei Rendering, Animation und Speicher](#release-v66)
- [v65 – doppelten Code entfernen](#release-v65)
- [v64 – aufgeräumte Modulstruktur](#release-v64)
- [v63 – AR-Button und vertikale Blicksteuerung](#release-v63)
- [v62 – freies Umschauen ohne Objektauswahl](#release-v62)
- [v61 – Kamera-SVG für Schrägansicht nach unten links](#release-v61)
- [v60 – Layer-Kategorie kürzer beschriftet](#release-v60)
- [v59 – Layer-Dropdown: feste Breite 155 px](#release-v59)
- [v58 – SVG-Perspektivicons und Perspektivwechsel im AR-Modus](#release-v58)
- [v57 – Layer-Dropdown-Presets und Kamera zur Ansicht zurücksetzen](#release-v57)
- [v56 – Katalogerweiterung und relevanzsortierte Suche](#release-v56)
- [v55 – Control-Panel ohne Maßstab-Dropdown](#release-v55)
- [v54 – Cinema-Zoom und neues Maßstab-Panel](#release-v54)
- [v53 – Cinema-Modus für Objekt-Reihen-Darstellung](#release-v53)
- [v52 – Layer-Dropdown und Objektkatalog](#release-v52)
- [v51 – Größen in Reihe und sanfte Bahnwelle](#release-v51)
- [v50 – Kamera zurücksetzen im AR-Modus](#release-v50)
- [v49 – schmalere Control-Panel-Buttons und Reihen-Beschriftung](#release-v49)
- [v48 – AR-Modus / Bewegungsgeste zum Umsehen](#release-v48)
- [v47 – Raumsteuerung und verdichtete Objekt-Reihe](#release-v47)
- [v46 – sichtbare Gummiband-Übergänge für Maßstab und Ansichten](#release-v46)
- [v45 – Reihe und Übergangsanimationen](#release-v45)
- [v44 – Optimierte Größenverhältnisse](#release-v44)
- [v43 – Kompaktes Maßstab-Menü und Status-Snackbars](#release-v43)
- [v42 – maßstabsbezogene Darstellungsoptionen](#release-v42)
- [v41 – Control-Panel „Maßstab“](#release-v41)
- [v40 – horizontales Control-Panel](#release-v40)
- [v39 – Folgen öffnet das übergeordnete Planetensystem](#release-v39)
- [v38 – kompakter Planetenansicht-Button und globales Folgen](#release-v38)
- [v37 – kompakte Dropdowns und Objekt-Nachführung](#release-v37)
- [v36 – Zeitsteuerung: Reglerlänge und seitliche Endwerte](#release-v36)
- [v35 – Sichtbare Höhe des eingeklappten Mobile-Sheets](#release-v35)
- [v34 – Beleuchtung als An/Aus-Schalter](#release-v34)
- [v33 – Mobiles Sheet über Browser-/Android-Zurück schließen](#release-v33)
- [v32 – Kategoriepunkte im Objektkatalog](#release-v32)
- [v31 – Layer-Dropdown und mobiler Objektfokus](#release-v31)
- [v30 – Objektdetails und mobiler Kamera-Button](#release-v30)
- [v29 – Beleuchtung und vier größte Monde](#release-v29)
- [v28 – Drei Kameraperspektiven](#release-v28)
- [v27 – Viewport, Detailindex und mobiles Sheet](#release-v27)
- [v26 – Kamera-Reset, schlankes Control-Panel und erweiterte Planetenansicht](#release-v26)
- [v25 – Objektlayer-Standards und kompaktes Dropdown](#release-v25)
- [v24 – unabhängiger Objektkatalog und erweiterte Suche](#release-v24)
- [v23 – getrennte Objektlayer und 5 Tage/s](#release-v23)
- [v22 – linke Tab-Seitenleiste und vollständige Sonnenbahnen](#release-v22)
- [v21 – kompakte Zeitsteuerung und dynamische Sliderfüllung](#release-v21)
- [v20 – Zeitregler, Beschriftung und mobiles Control-Panel](#release-v20)
- [v19 – Rechtsbündige Dropdowns und kompakte Zeitsteuerung](#release-v19)
- [v18 – Kompakte Zeitsteuerung](#release-v18)
- [v17 – Standardansicht und Umlaufbahn-Optionen](#release-v17)
- [v16 – Standard-Sterne und stabile Label-Dichte](#release-v16)
- [v15 – Kompaktes Control-Panel und Objektlayer](#release-v15)
- [v14 – Schmales Control-Panel und mobile Steuerung](#release-v14)
- [v13 – Control-Panel, Objekt-Registerkarten und reduzierte Navigation](#release-v13)
- [v12 – lokale Texturen, Raumsonden und Zeitleiste](#release-v12)
- [v11 – Objekt-Auswahl und Oberflächenbilder](#release-v11)
- [v10 – Ruhige Labels und smarte Zeitleiste](#release-v10)
- [v9 – Smarte Labels](#release-v9)
- [v8 – echter Katalogbestand und Redaktion](#release-v8)
- [v7 – Datenarchitektur und Redaktionsschicht](#release-v7)
- [v6 – Vollständige Umstrukturierung](#release-v6)
- [v5 – Planetenansicht mit Monden und Satelliten](#release-v5)
- [v4 – Sonnensystem: Bewegungen in der Umlaufbahnebene](#release-v4)
- [v3 – Sonnensystem: Kamerasteuerung](#release-v3)
- [v2 – Sonnensystem](#release-v2)
- [Hotfix v6.1](#hotfix-v61)

---

<a id="release-v104"></a>

## Release v104 – Cinema-Kamerafahrten, freie Touch-Richtung, Folgen ab Start

**Delta v103 → v104:** Nur die Neuordnung der **Größenreihe** vom größten zum kleinsten Objekt beim Filmstart bleibt eine Überblendung mit vollständig dunklem Kameraschnitt. Im laufenden Cinema erhalten **sämtliche Objektwechsel** wieder die stetigen Kamerafahrten und logarithmisch interpolierten Zooms der v98. Die Entfernungsreihe behält ihre Reihenfolge und fährt ohne Einstiegsausblendung zum ersten Körper. Auch beim Beenden und nach dem letzten Stopp erfolgt die Rückkehr zur gespeicherten Ausgangsansicht als Kamerafahrt statt per Fade. Die mobile Zwei-Finger-Blicksteuerung ohne Auswahl wird vertikal vertauscht: unten = unten, oben = oben; ausgewählte Objekte, horizontale Bewegung, Maus und AR bleiben unverändert. **Folgen** ist beim initialen Katalogladen aktiv, richtet sich auf das selektierte Objekt und bleibt per Schalter abschaltbar. App `104.0.0`, PWA-Shell `sonnensystem-shell-v104`, unveränderte Datensätze/Texturen und Schemastruktur. Neue und aktualisierte Regressionstests prüfen Einstieg, Objektfahrten, Rückkehr, Gesten und Folge-Zustand.

<a id="release-v103"></a>

## Release v103 – Galaktische Schweife wachsen nur durch Simulationsbewegung

**Delta v102 → v103:** Die alte Zeitlupenanimation zum Aufdecken vorausberechneter Bahnen entfällt. Beim Einstieg in **Galaktische Bewegung** beginnen Sonne und Objekte ohne sichtbare Linie. Ab diesem Moment werden nur real durchlaufene Simulationspositionen gespeichert und als Schweif mit 3D-Abwärtsdrift dargestellt; Pause lässt die Linie stehen und ein Wiedereinstieg löscht alle vorherigen Aufzeichnungen. Keine alten Ephemeriden werden beim Wechsel rückwärts gesampelt. Rückwärts laufende Zeit und die Heute-/Horizons-Sprünge löschen die laufende Aufzeichnung. Pro Körper ist die Spur zeitlich und durch eine Stichprobenobergrenze begrenzt. Kamera und Bewegungsrechnung bleiben unbeeinflusst. Version `103.0.0`, Offline-Shell `sonnensystem-shell-v103`, kein Daten- oder Schemawechsel.

<a id="release-v102"></a>

## Release v102 – Galaktische Linien starten bei Länge 0

**Delta v101 → v102:** Beim Umschalten auf **Galaktische Bewegung** werden die geschlossenen Umlaufbahnen nicht mehr in die historischen Flugbahnen gemorpht. Stattdessen beginnt jeder sichtbare 3D-Schweif **an der aktuellen Position des zugehörigen Körpers ohne sichtbare Länge**, einschließlich der Sonne. Während einer monotonen, 2,4 Sekunden langen Animation wächst die Linie rückwärts entlang der historischen Bewegung. Simulation und Kamerasteuerung bleiben davon unabhängig; bei `prefers-reduced-motion` erscheinen die fertigen Linien ohne Animation. Die 3D-Abwärtsrichtung aus v101 bleibt unverändert. Version `102.0.0`, Offline-Shell `sonnensystem-shell-v102`, Datenkatalog und Texturen unverändert.

<a id="release-v101"></a>

## Release v101 – Galaktische Spur mit 3D-Abwärtsrichtung

**Delta v100 → v101:** Die historische Sonnenbewegung führt nun überwiegend in **negative Y-Richtung im Szenenraum**, mit geringer Tiefenkomponente (Z) und schwacher Seitenabweichung (X). Das ersetzt die seitlich nach links laufende Hauptbewegung der v100. Die historischen Spuren der Planeten benutzen dieselbe Funktion, sodass Sonne und Planeten konsistent im selben illustrativen galaktischen Bezugssystem bleiben. Kamera und Kamerasteuerung, Objektpositionen, Cinema und Orbit-Morph bleiben unverändert. Die Ausrichtung hängt von der Kameraperspektive ab und ist **nicht bildschirmfest**. Keine astronomisch exakte Rekonstruktion der Sonnenbahn. App `101.0.0`, PWA-Shell `sonnensystem-shell-v101`, Katalog und Texturmanifest unverändert.

<a id="release-v100"></a>

## Release v100 – Galaktische Ansicht und Bezugssystemwechsel

**Delta v99 → v100:** Der Umlaufbahn-Schalter der Sonnensystemansicht besitzt nun zusätzlich den Modus **Galaktische Bewegung**. Statt bloßer Linienvariation wechselt dabei das dargestellte Bezugssystem für die Bahngeometrie: Die Sonne erhält eine leicht leuchtende Spur, heliocentrische Objekte zeigen historische offene 3D-Flugbahnen, und die Kamera bleibt auf die aktuelle Sonnenposition bezogen. Beim Umschalten werden klassische Ellipsen und galaktische Spuren weich ineinander überführt. In der Planetenansicht bleibt die bisherige Dreifach-Umschaltung erhalten. PWA-Shell `sonnensystem-shell-v100`, App `100.0.0`, Datenkatalog und Texturmanifest unverändert.

<a id="release-v99"></a>

## Release v99 – Reihenansicht und Cinema-Fade

**Delta v98 → v99:** In der Reihen-Darstellung gilt fest **30 Minuten Simulationszeit je Echtzeitsekunde**. Die gespeicherten Geschwindigkeiten für Sonnensystem- und Planetenansicht bleiben unverändert; das Zeit-/Geschwindigkeitsmenü wird nur in der Reihe versteckt. Der Layer-Dialog verbirgt in dieser Ansicht Beschriftung, Umlaufbahn, Alle-Monde-Steuerung und die Kategorien Monde und Satelliten, ohne die gespeicherten Filter zu verändern. Der Cinema-Wechsel erfolgt mit zeitgesteuerter Überblendung und diskretem Kameraschnitt am dunkelsten Punkt anstelle einer panoramierenden/zoomenden Transitfahrt. Der Eintritt wird ebenfalls überblendet, um den Übergang vom vorherigen Reihen-Kamerastandpunkt abzufangen. Cinema-Timeline und Playback bleiben unverändert. PWA-Shell `sonnensystem-shell-v99`, App `99.0.0`, Datenkatalog und Texturmanifest unverändert.

<a id="release-v98"></a>

## Release v98 – Siderische Eigenrotation und Equirektangular-Ausrichtung

**Delta v97 → v98:** `src/renderer/object-orientation.js` berechnet eine zeitabhängige, deterministische Oberfläche aus Rotationsperiode (Stunden), Obliquität, optionaler Kartenphase und synchroner Mondbindung. Die Standarddaten enthalten Referenzrotationen für Sonne, Planeten, Ceres und Pluto sowie gebundene Bewegung großer Monde. `SolarRenderer.drawSphere()` übergibt eine rotierte Modelmatrix und die entsprechend transformierte Sonnenlichtrichtung an WebGL. Saturns Ringe benutzen die gleiche körpergebundene Neigung wie die Kugel und bleiben von deren Eigenrotation unabhängig. Das Kugelmesh verwendet nicht gespiegelte Equirektangular-UVs (Nord oben, Ost rechts, Mitte +Z); fehlende Rotationsdaten bedeuten einen ruhenden Körper. NASA/NSSDCA-Faktenblatt: https://nssdc.gsfc.nasa.gov/planetary/factsheet/ . Neue Regressionen: `tests/object-rotation-v98.test.mjs`. Schema und Textur-Cache bleiben abwärtskompatibel (`1`, Texturcache `sonnensystem-textures-v1`). Version und Offline-Shell: `98.0.0` / `sonnensystem-shell-v98`.

<a id="release-v97"></a>

## Release v97 – Drei Texturverzeichnisse, WebP und Cache-Refresh

**Delta v96 → v97:** Die lokalen Texturen werden getrennt nach `textures/mobile/` (512 px), `textures/standard/` (2048 px) und `textures/high/` (4096 px) geladen. Innerhalb einer Stufe hat WebP Vorrang vor JPG/JPEG/PNG; die alte Alias-Namensgebung funktioniert in `standard/` weiterhin. Fehlende mobile Texturen werden aus `standard/` nachgeladen und zur GPU-Aufbereitung auf höchstens 512 px reduziert. Die neue lokale Manifest-API liefert SHA-256-Hashes der vorhandenen Bilder. Der Renderer erkennt Veränderungen oder neue Dateien bei fortlaufender Darstellung maximal 30 Sekunden später und ersetzt die GPU-Ressourcen mit versionsabhängigen URLs. Der PWA-Service-Worker lädt Bilddateien netzwerkpriorisiert und hält pro Bildpfad eine Fallback-Kopie im separaten Offline-Cache. Sicherheits- und Regressionstests wurden ergänzt. Neue Release-Version `97.0.0`, PWA-Cache `sonnensystem-shell-v97`. Das Delta enthält keine Bilddateien, da das Quellpaket keine enthält.

---

<a id="release-v96"></a>

## Release v96 – Umlaufbahn mit drei Stufen, Darstellungsraster 2×2

**Basis:** v95.0.0. **Ziel:** v96.0.0. **Paket:** `Sonnensystem-Delta-v96.zip`. **Cache:** `sonnensystem-shell-v96`.

- **Umlaufbahn** ist jetzt ein Dreifach-Toggle: **An (Standard)** → **An + Bahnkontrast** → **beides Aus** → An. Die Datenflags `orbits` und `orbitContrast` bleiben für Darstellung und Presets getrennt.
- Der eigenständige Kontrast-Button wird entfernt. Das Orbit-Icon zeigt im Kontrast-Modus kräftigere Kreise; Titel und ARIA nennen aktuellen und nächsten Zustand.
- Die Darstellungsoptionen liegen in zwei Reihen: **Beschriftung | Umlaufbahn** und **Beleuchtung | Monde** (auch auf Mobilgeräten).
- Presets, Objektfilter, unabhängige Sonnensystem-/Planetenansicht-Einstellungen und WebGL-Orbits bleiben erhalten. Aktualisierte Regressionstests plus `tests/orbit-toggle-v96.test.mjs`.

<a id="release-v95"></a>

## Release v95 – Radar-Rahmen ohne starre 560-px-Grenze

**Basis:** v94.0.0. **Ziel:** v95.0.0. **Paket:** `Sonnensystem-Delta-v95.zip`. **Cache:** `sonnensystem-shell-v95`.

- Der alte **560-px-Höchstwert** in der Rahmengrößenberechnung wird entfernt, ebenso die proportionale Obergrenze auf 80 % einer Viewport-Abmessung.
- Der Rahmen wächst mit dem projizierten Planetendurchmesser und stoppt erst bei den tatsächlichen Abständen zu **Name**, **Gravitation/Temperatur** und **Abstandspfeil**, inklusive Cinema-Leiste.
- Die gewohnten kleineren Rahmen in engen Ansichten, Kugelgröße, Pfeile, Daten, Animationen und Layoutpositionen bleiben unverändert.
- Regressionstest `tests/row-scanner-growth-v95.test.mjs` prüft einen großen Hover-Rahmen **über 560 px** und die weiterhin freien Messwerte im Hover- und Cinema-Modus.

<a id="release-v94"></a>

## Release v94 – Radar-Rahmen wächst nur bis zu den HUD-Informationen

**Basis:** v93.0.0. **Ziel:** v94.0.0. **Paket:** `Sonnensystem-Delta-v94.zip` (nur geänderte bzw. neue Dateien). **Cache:** `sonnensystem-shell-v94`.

- Im Reihen-Hover und während Cinema-Haltephasen wächst der Scanner proportional zur projizierten Objektgröße, bis er an die Grenzbereiche für **Objektname oberhalb, Gravitation/Temperatur unterhalb und Abstandspfeil** heranreicht.
- Ab diesem Punkt bleibt die **Rahmengröße** begrenzt, auch wenn der gezeichnete Planet weiter größer wird; die untere Messwertgruppe bleibt zusätzlich außerhalb der Distanzpfeillinie; die 160-px-Mindestgröße des Körpers bleibt bestehen.
- Im engen Bildschirmbereich darf nur der Scanner kleiner als 160 px werden, damit seine Dekoration nicht über die HUD-Angaben ragt. Der Distanzpfeil, die Messwerte und die Cinema-Steuerung bleiben unverändert.
- Neue Regressionstests `tests/row-scanner-clearance-v94.test.mjs` decken Grenzwerte, tatsächliche DOM-Positionen, Cinema und das Fehlen eines Parent-Pfeils ab. Katalog, Texturen und APIs sind unverändert.

<a id="release-v93"></a>

## Release v93 – Sonne auf ein Drittel bei Objekt aus / Bahn an

**Basis:** v92.0.0. **Ziel:** v93.0.0. **Paket:** `Sonnensystem-Delta-v93.zip` (nur geänderte bzw. neue Dateien). **Cache:** `sonnensystem-shell-v93`.

- In der Sonnensystemübersicht wird der Radius der Sonne bei **Objekt aus / Bahn an** auf ein Drittel ihres bisherigen schematischen Radius reduziert.
- Die sonstigen Körperradien, Umlaufbahnen und Objektpositionen bleiben unverändert.
- Die Maßstabskombinationen **Objekt aus / Bahn aus**, **Objekt an / Bahn aus** und **Objekt an / Bahn an** sowie lokale Planetenansichten behalten ihre bisherigen Größen.
- Neue Regressionstests `tests/scale-v93.test.mjs` prüfen die Größenverhältnisse und den tatsächlichen Rendererpfad; Katalog, Texturen und APIs sind unverändert.

<a id="release-v92"></a>

## Release v92 – Punktmodus nur für kleine oder selektierte Objekte

**Basis:** v91.0.0. **Ziel:** v92.0.0. **Paket:** `Sonnensystem-Delta-v92.zip` (nur geänderte bzw. neue Dateien). **Cache:** `sonnensystem-shell-v92`.

- Der reine Modus **Planetenpunkt** verwendet jetzt die gleiche Objektgrößenprüfung wie **Beschriftung an**. Nur Körper mit projiziertem Radius **unter 2,2 CSS-Pixel** bekommen den Kategorienpunkt.
- Ein selektierter Körper trägt **immer** seinen goldfarbenen Mittelpunkt-Punkt (2,6 px) und Selektionsring, auch wenn der Körper deutlich größer dargestellt wird.
- Namenslabels im Punktmodus bleiben ausgeblendet. Der Bahngeschwindigkeitsfilter sowie die Viererregel gelten weiterhin nur für Textlabels.
- Neuer Regressionstest `tests/label-points-v92.test.mjs` und angepasste v87-Prüfungen. Die restliche UI, Katalog, Texturen und externe Dienste bleiben unverändert.

<a id="release-v91"></a>

## Release v91 – Fünf Sekunden Cinema und gespeicherte Detail-Tab-Auswahl

**Basis:** v90.0.0. **Ziel:** v91.0.0. **Paket:** `Sonnensystem-Delta-v91.zip` (nur geänderte bzw. neue Dateien). **Cache:** `sonnensystem-shell-v91`.

- Die Cinema-Haltezeit ist für **alle Objekttypen 5000 ms**, unabhängig vom Planetenstatus; die Fahrzeit bleibt 1300 ms. 2x verkürzt die tatsächliche Verweildauer auf 2,5 Sekunden.
- Der zuletzt gewählte Tab **Daten** oder **Wissen** wird pro Browser im lokalen Speicher hinterlegt und nach einem Neustart wiederhergestellt; ohne gespeicherte Auswahl bleibt **Daten** der Standard.
- Objektwechsel, Auswahlaufhebung und Öffnen einer Planetenansicht ändern die Tab-Auswahl nicht mehr. Bei blockiertem Speicher bleibt die Tab-Bedienung funktionsfähig.
- Aktualisierte Cinema-Zeitregressionen und neue `tests/cinema-detail-memory-v91.test.mjs`. Keine Änderungen an den Quelldaten, Texturen oder externen Diensten.

<a id="release-v90"></a>

## Release v90 – Zusammengefasste Objektkategorie-Filter

**Basis:** v89.0.0. **Ziel:** v90.0.0. **Paket:** `Sonnensystem-Delta-v90.zip` (nur geänderte und neue Dateien). **Cache:** `sonnensystem-shell-v90`.

- Die sichtbaren Checkboxen **Asteroiden** und **Doppelasteroiden** sind zu **Asteroiden** zusammengelegt. Ein Schalter aktiviert/deaktiviert beide wissenschaftlichen Typen.
- **Zwergplaneten** und **transneptunische Objekte** sind im Filter **Zwergplaneten** zusammengefasst. Beide werden gemeinsam geschaltet.
- Acht bedienbare Filter steuern weiterhin zehn eigenständige wissenschaftliche Objekttypen. Detailansicht, Katalog, Kategoriepunkte, Bahn-/Objektmodell und die Originaldaten behalten ihre bisherigen Typbezeichnungen und Farben.
- Presets und Planetenansichten berücksichtigen die gekoppelten Filter; Tests decken kombinierte Sichtbarkeit, Attributerhalt, Gruppenverfügbarkeit und frühere Teilzustände ab.

<a id="release-v89"></a>

## Release v89 – Mobile Cinema-Zeitleiste über dem Sheet

**Basis:** v88.0.0. **Ziel:** v89.0.0. **Paket:** `Sonnensystem-Delta-v89.zip` (nur geänderte bzw. neue Dateien). **Cache:** `sonnensystem-shell-v89`.

- Auf Mobilgeräten (bis 770 px) schließt die Cinema-Zeitleiste direkt an den oberen Rand des mobilen Sheets an statt einen festen Abstand zum Bildschirmrand zu haben.
- Sie folgt den Snapstufen (geschlossen/halb/voll) und dem manuellen Verschieben des Sheets ohne Offset oder verzögerte Drag-Bewegung.
- Die Zeitleiste überdeckt im Cinema-Modus die AR- und Perspektive-Buttons; das Sheet bleibt darüber. Desktop und Cinema-Abspiellogik unverändert.
- Neue Tests `tests/cinema-mobile-timeline-v89.test.mjs` und zusätzliche Assertions in `tests/pwa-bottom-sheet-v2.test.mjs`.

<a id="release-v88"></a>

## Release v88 – Daten-Tab als Standard und Cinema-2x

**Basis:** v87.0.0. **Ziel:** v88.0.0. **Paket:** `Sonnensystem-Delta-v88.zip` (nur geänderte bzw. neue Dateien). **Cache:** `sonnensystem-shell-v88`.

- Objektdetails beginnen im Tab **Daten**, sowohl visuell als auch über ARIA und Initialisierungslogik. **Wissen** bleibt über die Tabs erreichbar.
- Im Desktop-Detailbereich bleibt durch `scrollbar-gutter:stable` die Scrollleistenbreite reserviert; damit springt das Layout nicht beim Wechsel zwischen langen und kurzen Tab-Inhalten.
- Cinema verweilt **3000 ms auf Planeten/Zwergplaneten** und ansonsten **1500 ms** auf einem Körper. Die Fahrten zwischen den Stopps bleiben unverändert.
- Ein **2x**-Button unmittelbar rechts von Play/Pause wechselt die Geschwindigkeit der Cinema-Kamerafahrt 1x ↔ 2x, ohne die Simulationsuhr oder die Pausensteuerung zu beeinflussen.
- Neue Tests `tests/detail-cinema-v88.test.mjs` und aktualisierte ältere Cinema-Laufzeiterwartungen. Katalog, Texturen, externe API unverändert.

<a id="release-v87"></a>

## Release v87 – Drei Beschriftungsmodi und Planetennavigation

**Basis:** v86.0.0. **Ziel:** v87.0.0. **Paket:** `Sonnensystem-Delta-v87.zip` (nur neue und geänderte Dateien). **Cache:** `sonnensystem-shell-v87`.

- Der Beschriftungsschalter durchläuft **An → Planetenpunkt → Aus → An**; der neue Modus zeigt einen Mittelpunkt statt des Textlabel-Icons.
- Im Punktmodus verschwinden sämtliche Objektlabeltexte; alle gerenderten sichtbaren Körper erhalten Kategoriepunkte direkt in ihrer Mitte, selektierte Objekte behalten Punkt und Auswahlring. Die v86-Geschwindigkeits- und Vier-Textlabelgrenze betrifft diesen Modus nicht.
- Ein neuer, nur in der Planetenansicht sichtbarer Button **„Sonnensystem“** mit Zurück-Pfeil oben links übernimmt den Rückweg in die Übersicht.
- Der Kamera-Button schaltet ab jetzt auch in der Planetenansicht ausschließlich **Schräg/oben → Topdown → Seitlich** um; AR-Neuausrichtung bleibt erhalten.
- Neue Regressionstests für SVG/Icon, Zustand, Marker, Ansichtsnavigation und AR. Keine Änderungen am Katalog und an API-/Texturdaten.

<a id="release-v86"></a>

## Release v86 – Smart Labels mit Bahnbewegungsfilter und Vierergrenze

**Basis:** v85.0.0. **Ziel:** v86.0.0. **Paket:** `Sonnensystem-Delta-v86.zip` (nur neue/geänderte Dateien). **Cache:** `sonnensystem-shell-v86`.

- **Orbitale Geschwindigkeit:** Objektpositionen werden relativ zu ihren Elternkörpern und bei unveränderter Kameraprojektion pro realer Sekunde verglichen. Ab **190 px/s** verschwinden unlesbare Labels, unter **135 px/s** kommen sie sofort zurück. Kamerapans/-zooms, Parent-Translation, Reihenanimationen und manuelle große Zeitsprünge blenden sie nicht aus.
- **Selektierte Objekte:** Auch bei unterdrücktem Labeltext bleiben Mittelpunktmarker kleiner Objekte sowie Selektionspunkt und Ring sichtbar.
- **Sonnensystemübersicht:** Höchstens **vier größte direkte Begleiter** pro Planet/Zwergplanet erhalten Labels, unabhängig von **„Alle Monde“**. Natürliche Monde und Satelliten konkurrieren nach ihrem `radiusKm`; ein ausgewählter kleinerer Begleiter ersetzt den vierten. Weder die Kugeldarstellung noch die isolierte Planetenszene werden begrenzt.
- **Unverändert:** Label-Kollisionsfreiheit, manuelle Schalter, Katalogdaten, Texturen, API. Neue Regressionstests `tests/smart-labels-v86.test.mjs`.

<a id="release-v85"></a>

## Release v85 – Smart Labels ohne Geschwindigkeitsfilter

**Basis:** v84.0.0. **Ziel:** v85.0.0. **Paket:** `Sonnensystem-Delta-v85.zip` (nur geänderte und neue Dateien). **Cache:** `sonnensystem-shell-v85`.

- Labels werden bei schnellen Kamera- und Objektbewegungen nicht mehr ausgeblendet, auch nicht während Kamerafahrten oder auf Monitoren mit hoher Bildwiederholfrequenz.
- Schwellwerte, Hysterese, Wartezeit und Bewegungs-Sampling aus `src/renderer/labels.js` entfernt; alle ansonsten anzeigbaren Labels bleiben auf dem Bildschirm.
- Unverändert: sichtbarer Viewport, Szenen-/Layer-Schalter, Reihen-Hover-HUD, kollisionsfreie Label-Platzierung, Auswahl- und Mittelpunktmarker.
- Neue Tests `tests/label-speed-v85.test.mjs` und Aktualisierung der betroffenen Legacy-Tests. Keine Katalog-, Textur-, API- oder Orbitdatenänderungen.

<a id="release-v84"></a>

## Release v84 – Smart Labels mit Mittelpunkt-Markern

**Basis:** v83.0.0. **Ziel:** v84.0.0. **Paket:** `Sonnensystem-Delta-v84.zip` (nur geänderte und neue Dateien). **Cache:** `sonnensystem-shell-v84`.

- Der frühere Punkt vor jedem Objektlabel entfällt vollständig.
- Wenn ein gelabeltes Objekt kleiner dargestellt wird als der Label-Marker, erscheint stattdessen ein Punkt **im Zentrum des Objekts**.
- Der Mittelpunkt-Punkt übernimmt die **Farbe der Objektkategorie**.
- Für **selektierte Objekte** ist der Mittelpunkt-Punkt **immer sichtbar** und verwendet die Selektionsfarbe.
- Neuer Regressionstest `tests/label-markers-v84.test.mjs`; Katalog, Texturen, APIs und die kollisionsfreie Sichtbarkeitslogik der Labels bleiben unverändert.

<a id="release-v83"></a>

## Release v83 – Smart Labels ohne Kollisions-Ausblendung

**Basis:** v82.0.0. **Ziel:** v83.0.0. **Paket:** `Sonnensystem-Delta-v83.zip` (nur geänderte und neue Dateien). **Cache:** `sonnensystem-shell-v83`.

- Die verbliebene Dichtebegrenzung von zwei Labels pro 160 × 110 Pixel entfällt ersatzlos. Es gibt keine Filter für Text-/Körperüberlappung und keine gekoppelten Raster- oder Dichteprioritätsregeln mehr; alle ansonsten sichtbaren Labels können zugleich gezeichnet werden.
- Die Priorität beeinflusst ausschließlich die Zeichenreihenfolge (Auswahl zuletzt). Die bestehenden Bildschirmgrenzen, Bewegungsfilter, Szenen-/Layeroptionen und das separate Reihen-HUD bleiben unangetastet.
- Bestehende Regressionstests für dichte Szenen angepasst und neue v83-Tests für Überlagerungen, Bildschirmbereiche, Vordergrund und unabhängige Sichtbarkeitsregeln ergänzt. Katalog, Texturen, API und Orbitberechnungen unverändert.

---

<a id="release-v82"></a>

## Release v82 – Flachere Schemabahnverteilung und größere Sonne

**Basis:** v81.0.0. **Ziel:** v82.0.0. **Paket:** `Sonnensystem-Delta-v82.zip` (nur geänderte und neue Dateien). **Cache:** `sonnensystem-shell-v82`.

- **Objekt aus / Bahn aus:** Statt des Wurzelprofils erhalten Merkur bis Neptun gleichmäßige radiale Bahnlücken (2,25 Szeneneinheiten). Zusätzliche sonnenzentrierte Körper folgen einer stetigen AU-Interpolation; jenseits Neptuns verläuft die Verteilung zunehmend flach.
- **Objekt an / Bahn aus:** Die Sonne vergrößert sich um Faktor 3 gegenüber dem bisherigen optimierten Sonnenradius (neu 13,56 Einheiten). Die mittleren Planeten-Orbitradii werden zu 19,5 / 25 / 29 / 33 / 41 / 49 / 58 / 67 Einheiten neu angeordnet; die inneren Orbits weichen der Sonne, die äußeren liegen dichter als vorher. Die planetaren Körpergrößen sowie die Größenreihe/Cinema bleiben unverändert. Die optimierte Ansicht ist bewusst nicht physikalisch proportional zwischen Sonnenradius und Planetenradien.
- **Live-Positionen:** JPL-Sonnenvektoren werden mit demselben Halbachsenmaßstab transformiert wie die gezeichneten Kepler-Orbits. Die Kombination **Bahn an**, lokale Planetenansichten und das Reihen-/Cinema-Verhalten bleiben unverändert.
- Neue v82-Regressionstests für Gleichverteilung, Überlappungsfreiheit, monotone Interpolation, JPL-Positionen und unberührte Modi. Keine Änderung an Katalog, Quellen, Texturen oder APIs.

---

<a id="release-v81"></a>

## Release v81 – Direktes Reihen-HUD und Cinema-Pause

**Basis:** v80.0.0. **Ziel:** v81.0.0. **Paket:** `Sonnensystem-Delta-v81.zip` (nur geänderte und neue Dateien). **Cache:** `sonnensystem-shell-v81`.

- Hover-Vektorabstand unter der vergrößerten Kugel von 23 auf 69 Pixel verdreifacht; direkter Parent-Außenrand statt projiziertem Zentrum, Clipping am Viewport und Schutz gegen rückwärts gerichtete Vektoren.
- Planetname im cyanfarbenen Scanner-Stil oberhalb, Gravitation/Temperatur mit wiederverwendeten SVG-Objektdetailicons in zwei Spalten darunter; Durchmesser bleibt oben im Messrahmen. Seitliche Hover-Analysekarte entfernt.
- Cinema-Zeitleiste mit linksseitigem, zugänglichem Play/Pause-Button. Pause wirkt nur auf die Kamerafahrt, Suchen und Scrubbing bleiben funktionsfähig. Scanner-/Größeneffekt bei stabiler Kamerahalteposition, aus während Anfahrt, Bewegung, Scrubbing und Transitionen.
- Neue v81-Tests sowie Aktualisierung historischer Regressionen, Versionsnummer und PWA-Cache. Keine Änderung an Katalog- oder Texturdaten.

---

<a id="release-v80"></a>

## Release v80 – Reihenvermessung und AR-Neuausrichtung

**Basis:** v79.0.0. **Ziel:** v80.0.0. **Paket:** `Sonnensystem-Delta-v80.zip`. **Cache:** `sonnensystem-shell-v80`.

- Die Hover-Anzeige ersetzt `SCAN // AKTIV` durch den Durchmesser und verbreitert die Eckmarkierungen mit animierten Messpfeilen. Die physikalische Messkarte bleibt bestehen.
- Die Beschriftung „Abstand zum Parent“ entfällt; die km-/AE-Zahl bleibt. Der SVG-Pfeil reicht ohne die frühere 300px-Grenze bis zum Parent-Zentrum oder zu dem Bildschirmrand, hinter dem das Zentrum liegt.
- Bei aktivem AR richtet die Auswahl eines Katalogobjekts mit Fokus sowie „Planetenansicht“ in den Objektdetails die Sensorblickbasis auf die aktuelle Kameraansicht aus. Kein erneuter Permission-Dialog, keine Änderung der AR-Neigungsrichtung.
- Neue Regressionstests für Bildschirmkanten, echte Zentrum-X-Koordinaten, Durchmesser-HUD und Sensor-Rekalibrierung; bestehende v78/v79-Tests erhalten die neue HUD-Test-ID.

---

<a id="release-v79"></a>

## Release v79 – Fix: Abstandspfeil in der Reihendarstellung

**Basis:** v78.0.0. **Ziel:** v79.0.0. **Paket:** `Sonnensystem-Delta-v79.zip`. **Cache:** `sonnensystem-shell-v79`.

- Der animierte Abstandspfeil war trotz berechneter Geometrie nicht sichtbar, weil das SVG-Element sein `hidden`-Attribut behielt. Die Anzeige entfernt nun beim Rendern das echte SVG-Attribut und setzt es beim Ausblenden wieder.
- Der Pfeil zeigt weiterhin zum Parent, die Distanz wird km/AE formatiert. Scanner, Animation, Reihenpositionen, Katalog und Cinema sind unverändert.
- Regressionstest mit DOM-naher SVG-Attributsemantik, anschließend vollständige Projektsuite und Overlay-Prüfung gegen die veröffentlichte v78-Basis.

---

<a id="release-v78"></a>

## Release v78 – Animierter Reihen-Scanner und Entfernungspfeil

**Basis:** v77.0.0. **Ziel:** v78.0.0. **Paket:** `Sonnensystem-Delta-v78.zip` mit ausschließlich geänderten/neuen Dateien. **Cache:** `sonnensystem-shell-v78`. **Katalog:** unverändert, Schema 1.

- Bei Maus-/Stift-Hover über ein tatsächlich sichtbares Reihenobjekt vergrößert sich die WebGL-Kugel animiert auf mindestens 160 px Durchmesser. Der physikalische Reihensatz, die Sortierung und die Cinema-Stoppfolge bleiben unverändert. Saturns Ring skaliert gemeinsam mit dem Planeten.
- Ein Sci-Fi-Scanner mit Transparenz, Sichtmarkierungen, Sweep-Animation und Messkarte blendet **Durchmesser, Gravitation und mittlere Temperatur** aus den Katalogdaten ein. Nicht vorliegende Werte bleiben offen.
- Ein unter dem Objekt ausfahrender Pfeil weist in Richtung des projizierten Parent-/Zentralobjekts. Das Entfernungslabel steht beim Objekt; km werden bis einschließlich 0,2 AE verwendet, sonst AE. Das Zentrum hat keinen Pfeil.
- Die Hover-Ebene greift nicht in Canvas-Auswahl, Kamerasteuerung, Cinema oder AR ein; Bedienung mit Berührungsbildschirm unverändert. Reduzierte Bewegung wird respektiert. Regressionstests: `tests/row-inspection-v78.test.mjs`.

---

<a id="release-v77"></a>

## Release v77 – Reihenmodi und kompakte Objektdetails

**Basis:** v76.0.0. **Ziel:** v77.0.0. **Paket:** `Sonnensystem-Delta-v77.zip` mit neuen/geänderten Dateien gegenüber v76. **Cache:** `sonnensystem-shell-v77`.

- Physikalische Temperaturwerte belegen eine halbe Rasterbreite. Tabs in Reihenfolge Daten/Wissen; Wissen bleibt als Starttab ausgewählt.
- Reihe blendet verschachtelte Objekte und Objekte ohne bekannten positiven Radius aus. Dadurch keine leeren Cinema-Haltephasen.
- Reihen-Toggle: Aus → Größe → Entfernung → Aus. Neues Entfernungssymbol: ein großer und drei kleine Punkte. Die Distanzreihe verläuft nach mittlerer Parent-Entfernung aufsteigend; Cinema fährt bei Play von links nach rechts ohne Umordnung. Die Größenreihe behält das Cinema-Verhalten von v76.

<a id="release-v76"></a>

## Release v76 – Kompakte Temperaturkachel

**Basis:** v75.0.0 (v71 + Delta v72–v75). **Ziel:** v76.0.0. **Paket:** `Sonnensystem-Delta-v76.zip` mit den geänderten Dateien gegenüber v75.

- **Mittelwert:** Halb gefülltes schwarzes SVG-Thermometer ohne hellen Kachelhintergrund; kontrastierende Kontur bleibt auf dunklem Untergrund erkennbar.
- **Extremwerte:** Wenn verfügbar, werden Min. und Max. in kleinen Zeilen **untereinander rechts neben dem Mittelwert** angezeigt. Bei fehlenden Messwerten entfällt die betreffende Zeile. Die Kachel wird dadurch flacher und lässt sich auf schmalen Bildschirmen nutzen.
- **Kompatibilität:** Datenformat und Messwerte unverändert (Katalog `10.1.0`, Schema `1`); App `76.0.0`, HTML `V76.0`, PWA-Cache `sonnensystem-shell-v76`.

---

<a id="release-v75"></a>

## Release v75 – Entfernungssortierung und Mondentfernungen

**Basis:** v74.0.0 (v71 + Delta v72, v73 und v74). **Ziel:** v75.0.0. **Paket:** `Sonnensystem-Delta-v75.zip`, nur neue oder geänderte Dateien gegenüber v74.

- **Einheiten:** Bei Entfernungssortierung werden mittlere Abstände bis einschließlich **0,2 AE** als **km** angezeigt; darüber bleibt **AE**. Die numerische Sortierung bleibt einheitlich in AE.
- **Monde:** Ohne Suche und ohne aktiven Planetenfilter erhalten Monde **für die Katalogliste** den Entfernungswert ihres Elternkörpers, um bei ihm einsortiert zu werden. Bei Suche oder aktiver Planetenfilterung verwenden sie wieder ihren eigenen Bahnradius. Andere Objekttypen, Datenwerte und Objektdetails bleiben unverändert.
- **Kompatibilität:** Katalogdaten weiterhin `10.1.0`, Schema `1`; App `75.0.0`, HTML `V75.0`, Offline-Cache `sonnensystem-shell-v75`.

---

<a id="release-v74"></a>

## Release v74 – SVG-Icons, Temperaturkarte und Related-Katalogsuche

**Basis:** v73.0.0 (v71 + Delta v72 + Delta v73). **Ziel:** v74.0.0. **Paket:** `Sonnensystem-Delta-v74.zip`, ausschließlich Änderungen gegenüber v73.

- **Physik-Kacheln:** Individuelle Inline-SVG-Symbole vor allen Datenwerten, inkl. Radius, Orbit, Periode, Exzentrizität, mittlerem Abstand, Druck und Gravitation (bei Sonden auch Start und Status).
- **Temperatur:** Ein gemeinsamer Bereich statt drei getrennten Kacheln: große Mitteltemperatur mit halb gefülltem schwarzem Thermometer auf heller Fläche, kleine blaue Min.- und rote Max.-Angaben mit entsprechend niedriger/hoher Füllung. Unbekannte Werte bleiben `—`.
- **Gravitation:** Anzeige als G relativ zu standardisierter Erdbeschleunigung (1 G = 9,80665 m/s²); intern unverändert in m/s². Bei Gasriesen weiterhin als Gravitation auf dem 1-bar-Niveau ausgewiesen.
- **Zugehörige Objekte:** Über den physikalischen Daten; ein anklickbares `+N ↗` öffnet den Objektkatalog mit vorausgefüllter Suche nach dem ausgewählten Elternobjekt. Dies funktioniert in Desktop- und mobiler Sheet-Navigation.
- **Kompatibilität:** Katalogdaten unverändert, Schema `1`, Katalogversion `10.1.0`; App `74.0.0`, HTML `V74.0`, Cache `sonnensystem-shell-v74`.

---

<a id="release-v73"></a>

## Release v73 – Objektkatalog sortieren, Planetenfilter standardmäßig aktiv

**Basis:** v72.0.0 (v71 + Delta v72). **Ziel:** v73.0.0. **Paket:** `Sonnensystem-Delta-v73.zip`, ausschließlich neue oder geänderte Dateien relativ zu v72.

- **Katalogüberschrift als Toggle:** Bei jedem Klick Wechsel Standard → Entfernung (nah nach fern) → Größe (groß nach klein) → Standard. Die bisherige Feature-/Kategorie- und Suchrelevanz-Sortierung bleibt für Standard unverändert. Suche und Filter werden in allen Modi vor der Sortierung angewendet.
- **Maßzahlen rechts:** Entfernung ist die mittlere Separation zum jeweiligen Parent (oder die große Halbachse als Modellwert), einheitlich als AE angezeigt; die Größe ist der physikalische Durchmesser aus `2 × radiusKm` in km. Sehr kleine Distanzen nutzen wissenschaftliche Notation, ungültige/fehlende Werte stehen als `—` am Ende.
- **Planetenansicht:** Erfolgreiches Öffnen einer neuen Planetenszene setzt den Katalogfilter standardmäßig aktiv; manuelles Abschalten zeigt wieder alle Objekte. Außerhalb der Planetenansicht ist der Filter wirkungslos.
- **Kompatibilität:** Keine Katalogänderung (`10.1.0`, Schema `1`). Paketversion `73.0.0`, HTML `V73.0`, PWA-Cache `sonnensystem-shell-v73`.

---

<a id="release-v72"></a>

## Release v72 – Objektphysik und Mobile-Sheet

**Basis:** v71.0.0. **Ziel:** v72.0.0. **Paket:** ausschließlich geänderte/neue Dateien in `Sonnensystem-Delta-v72.zip`, über das vollständige v71-Projekt legen.

- **Objektkatalog 10.1.0:** Optionale Temperaturminimum-/maximum-/mittel-Werte in Kelvin, Druck in Pa, Gravitation in m/s² sowie mittlerer Elternkörperabstand in Orbiteinheiten. Datensätze werden auf gültige Messwerte, Temperaturreihenfolge und HTTPS-Belege geprüft. Die Objekt-Detailansicht zeigt alle Maße und die Quellen; unbelegte Werte bleiben `—`.
- **Beispieldaten:** NASA/NSSDCA-Grunddaten für Sonne, acht Planeten, Erdmond, Pluto und Charon; extreme Tag-/Nachttemperaturen nur für Merkur und Erdmond. Gasriesenwerte sind 1-bar-Referenzen, keine festen Oberflächenmessungen. Als mittlerer Abstand wird ohne individuellen Dateneintrag die große Halbachse des Modellorbits verwendet.
- **Mobile-Sheet:** Halb-Snap von 56 % auf **39 %** verringert. Sichtfeldmittelpunkt folgt dem offenen/gezogenen Sheet auch ohne Objektfokus und bei manuell veränderter Kamera, statt nur automatisch fokussierte Körper zu berücksichtigen.
- **Versionen:** `72.0.0`, Katalog `10.1.0`, PWA-Cache `sonnensystem-shell-v72`. Bestehendes Daten-Schema 1 bleibt kompatibel.

---

<a id="release-v71"></a>

## Release v71 – Zwei-Finger-Umschauen und vertikales AR

**Basis:** v70.0.0. **Ziel:** v71.0.0. **Paket:** vollständiges `Sonnensystem-v71.zip`.

- **Freie Perspektive:** Beim gemeinsamen vertikalen Wischen zweier Finger blickt die Kamera nun in die entgegengesetzte Richtung der Fingerbewegung: unten → oben, oben → unten. Nur diese Touch-Geste wird invertiert; horizontales Wischen, Zoom, Mausblick und ausgewählte Objektansichten bleiben unverändert.
- **AR:** Die in v70 eingeführte vertikale Invertierung der Sensorrotation entfällt. Der Blick folgt wieder der Gerätebewegung: oben → oben, unten → unten. Hoch- und Querformat, Horizontaldrehung und Kamerafahrten bleiben unterstützt.
- **Tests und PWA:** Sieben neue Regressionstests in `tests/look-directions-v71.test.mjs`; v70- und v64-Testerwartungen für die nun geänderte Richtung aktualisiert. Projektversion `71.0.0`, App-Version `V71.0`, Cache `sonnensystem-shell-v71`. Katalog und Datenstruktur bleiben unverändert.

---

<a id="release-v70"></a>

## Release v70 – Kamerafahrt und vertikales AR-Umsehen

**Basis:** v69.0.0. **Ziel:** v70.0.0. **Paket:** vollständiges `Sonnensystem-v70.zip`.

- **Kamera zurücksetzen:** Perspektivwechsel Schräg/oben → Topdown → Seitlich und Rückkehr zur Sonnensystemübersicht fliegen über **1.050 ms** weich zur Zielposition. Blickrichtung (auch bei zuvor freiem Umsehen oder geneigtem AR-Sensor), räumliche Kameraposition und Zoom werden interpoliert; der Flug beeinflusst weder die Perspektivenreihenfolge noch die aktuellen Richtungssymbole.
- **Unterbrechung:** Ein weiterer Perspektivklick startet eine neue Fahrt von der gerade gezeichneten Pose. Panning, Rotation und Zoom brechen den Flug ohne plötzlichen Blicksprung ab. Die Betriebssystemeinstellung „Bewegung reduzieren“ deaktiviert die Kamerafahrt.
- **AR:** Die **vertikale Sensorblickrichtung** wurde relativ zu v69 invertiert (Hoch- und Querformat). Horizontalrichtung und Sensorberechtigung bleiben unverändert. Während der Kamerafahrt bleiben spätere Sensor-Updates an die aktuelle Gerätehaltung gebunden, ohne die Animation zu überschreiben; AR bleibt nach der Fahrt aktiv und auch ein Abbruch ist möglich.
- **Technik/Qualität:** Separate Kamera-Flugbahn in `src/renderer/renderer.js` und Interpolation in `src/renderer/camera.js`, kalibrierte vertikale Quaternion-Inversion in `src/renderer/ar-mode.js`, acht neue Regressionstests in `tests/camera-flight-ar-v70.test.mjs`. Versionen und PWA-Cache auf v70 aktualisiert; der Katalog ist unverändert.

---

<a id="release-v69"></a>

## Release v69 – Kamerasymbole zeigen die aktuelle Blickrichtung

**Basis:** v68.0.0. **Ziel:** v69.0.0. **Paket:** vollständiges `Sonnensystem-v69.zip`.

- Der Kamera-Button visualisiert die **momentane Ansicht** und nicht mehr die nächste Aktion: Standardansicht schräg nach unten, Topdown nach unten, Seitenansicht nach links. Nach manueller Bewegung oder bei Rückkehr aus einer isolierten Planetenansicht zeigt die Kamera frontal zum eigenen Standort (freier Blick/Reset).
- Der Drei-Schritt-Wechsel Schräg/oben → Topdown → Seitlich bleibt bestehen. Die Beschriftung benennt weiterhin die nächste Perspektive; AR-Perspektivwechsel bleiben innerhalb der Szene.
- Vier SVG-Symbole, Regressionstests und aktualisierte Hilfedokumentation. Versionsangaben auf 69.0.0 und PWA-Shell-Cache auf `sonnensystem-shell-v69` aktualisiert.

---

<a id="release-v67"></a>

## Release v67

# Delta v67 – CSS-Bereinigung

**Basis:** v66.0.0 (vollständige v64 + Delta v65 + Delta v66). **Ziel:** v67.0.0. **Paket:** `Sonnensystem-Delta-v67.zip`.

## Änderungen

- **CSS-Audit gegen aktuellen Code:** `index.html`, sämtliche `src/**/*.js` und die datengetriebenen Objekt-Stile wurden abgeglichen. Unbenutzte Selektor-Alternativen wurden auch aus gemischten Selektorlisten entfernt; weiterhin verwendete Alternativen bleiben erhalten.
- **Entfernte historische Komponenten:** Styles für die frühere obere Kopfzeile, freie Szene-Werkzeugleiste, Ansichtsauswahl, Maßstab-Popover, alte Zeit-/Orbitgruppen und die alte Hilfe-Modaldarstellung wurden entfernt, da sie nicht mehr in der aktiven Oberfläche vorkommen.
- **Kaskade vereinfacht:** Deklarationen entfernt, wenn eine spätere Deklaration derselben Eigenschaft mit demselben Selektor unter identischer Media-Bedingung sie in jedem Fall übersteuert. CSS-Spezifität und `!important` wurden berücksichtigt. Die historische Reihenfolge der übrigen Regeln und Media-Queries wurde beibehalten.
- **Theme:** sieben unbenutzte globale CSS-Variablen gestrichen; verwendete Farben, Abstände und Schriftdefinitionen bleiben erhalten.
- **Struktur:** Statt chronologischer Versionskommentare enthält die CSS-Datei fachliche Abschnittsüberschriften. Responsive Breakpoints, `prefers-reduced-motion`, mobile Sheets, AR/Cinema und Popover-Verankerungen bleiben erhalten.
- **PWA:** `sw.js` verwendet `sonnensystem-shell-v67`; die bereinigte `css/styles.css` bleibt im Offline-Shell-Cache. Version in `package.json` und `index.html` auf 67.0.0 aktualisiert.

## Zahlen und Absicherung

| Kennzahl | Wert |
| --- | ---: |
| CSS vorher | 88.227 Bytes |
| CSS nachher | 59.064 Bytes |
| CSS-Reduktion | 29.163 Bytes, rund 33,1 % |
| Entfernte ungenutzte Selektor-Alternativen | 191 |
| Vollständig entfallene ungenutzte Regelblöcke | 182 |
| Entfernte sicher überschriebene Deklarationen | 200 |
| Entfernte unbenutzte CSS-Variablen | 7 |

- **38 statische Kaskadenvergleiche** zwischen v66 und v67: verschiedene Viewportgrößen (320–1280 px), Desktop- und mobil umgehängte Panels, offene/volle/gezogene Sheets und reduzierte Bewegung. Bei den verwendeten CSS-Eigenschaften **keine Unterschiede** für das geprüfte DOM; lediglich die sieben bewusst entfernten, nicht referenzierten Theme-Variablen fehlen. Pseudoelement-Selektoren des nativen Range-Sliders konnten im statischen Selektorvergleich nicht aufgelöst werden, wurden aber unverändert beibehalten.
- **343 von 343 automatisierten Tests bestanden** (`npm run check`). Fünf neue v67 Regressionstests prüfen verbliebene AR/Cinema-/Popover- und Sheet-Styles, CSS-Struktur, unbenutzte Variablen und PWA-Versionierung.
- **Ein vollständiger grafischer Browser-/Gerätetest wurde in der vorliegenden Umgebung nicht abgeschlossen.** Deshalb ist die Kaskaden-Äquivalenzprüfung keine Garantie für identisches Pixelrendering auf jedem Gerät.
- **Keine Funktionsänderungen beabsichtigt.** Der Objektkatalog, die Render- und Animationslogik sowie AR bleiben unverändert.

## Dateistatus

Neu: `docs/DELTA-V67.md` und `tests/css-cleanup-v67.test.mjs`. Geändert: `css/styles.css`, Release-/PWA-Metadaten, `README.md`, `docs/ARCHITECTURE.md` sowie historische Regressionstests, deren CSS- und Versionsassertionen auf überholte Varianten verwiesen. **Gelöscht: keine Dateien**. Es sind keine Löschschritte für die Installation nötig.

## Installation v66 → v67

Das Archiv `Sonnensystem-Delta-v67.zip` im Projektstamm von **v66** entpacken und die enthaltenen Dateien überschreiben. Danach die PWA online neu laden, sodass der Service Worker den neuen Cache `sonnensystem-shell-v67` aktivieren und die aktuelle CSS-Datei offline speichern kann.

---

<a id="release-v66"></a>

## Release v66

# Delta v66 – Performance bei Rendering, Animation und Speicher

**Basis:** v65.0.0 (`Sonnensystem-v64.zip` + `Sonnensystem-Delta-v65.zip`). **Ziel:** v66.0.0. **Paket:** `Sonnensystem-Delta-v66.zip`. Dieses Delta enthält ausschließlich neue und geänderte Dateien.

## Änderungen

| Bereich | Optimierung | Korrektheit / Begrenzung |
| --- | --- | --- |
| Umlaufbahnen | `src/renderer/orbit-cache.js` speichert Kepler-Stützpunkte (`Float64Array`) je Himmelskörper und verwendet einen wiederverwendbaren Weltkoordinatenpuffer (`Float32Array`). | LRU mit **maximal 256 Bahnen**. Berechnung erfolgt erneut, wenn Orbitalparameter, Epoche, Segmentzahl oder Bahnmaßstab wechseln. Bewegte Mittelpunkte aktualisieren die Weltkoordinaten. `setBodies()` leert den Cache bei Katalogwechsel. |
| Kontrastbahnen | `src/renderer/orbits.js` schreibt Segment-Dreiecke in einen wiederverwendbaren typisierten Puffer. Die Projektion benötigt nur noch zwei temporäre Punkte je Bahn statt eines Objekts pro Stützpunkt. Unsichtbare Bahnen werden vor Sampling und Upload abgebrochen. | Breite, Farbe, Alpha und die Übergangsbehandlung bleiben erhalten. Projektion durch Zufallsdaten mit **465.318 Ausgabewerten** gegen v65 numerisch identisch geprüft. |
| Renderer | Uniform- und Attributpositionen werden je WebGL-Programm einmal ermittelt. `drawSceneBodies()` verwendet sein Array erneut; Planeten-Kinder sind pro Katalogstand vorindiziert. | Vorhandene Zeichenreihenfolge inklusive Saturnringen und Labels bleibt erhalten. Für Fremdaufrufer, die `bodies` direkt ersetzen, bleibt die Filterfunktion als Fallback erhalten. |
| Positions-/Animationsrechnung | Bei unveränderter Simulationszeit, Szene und Maßstab werden Kepler-Positionen zwischen Frames wiederverwendet; bei laufenden Übergängen und Cinema weiterhin pro Frame neu berechnet. Die Reihenansicht berücksichtigt ihre Layer- und Mond-Signatur. | Kamera und WebGL-Bild werden weiterhin gezeichnet. Katalog- und Horizons-Updates invalidieren die Berechnung ausdrücklich. Ein Tab im Hintergrund pausiert das Rendern und den Fortschritt der Simulationszeit. |
| Canvas-Speicher | Ein wiederholtes `ResizeObserver`-Ereignis mit gleicher Pixelgröße initialisiert WebGL-/Label-Backbuffer nicht mehr neu. | Bei neuer Größe oder Gerätepixeldichte wird weiterhin skaliert und `gl.viewport` angepasst. |
| GPU-Speicher | Asynchrone Texturen werden nach `dispose()` nicht mehr hochgeladen; verspätet fertiggestellte GPU-Texturen werden gelöscht. Textur-LRU-Eviction scannt ohne Sortierarray; nach Programmlinks werden separate Shaderobjekte freigegeben. | Bestehende mobile/desktop Texturbudgets von 48 MiB und 192 MiB werden beibehalten. |

## Messung und Tests

- **338 / 338 automatisierte Tests bestanden** (`npm run check`); davon **12 neue v66-Regressionen**, u. a. für Cache-Invalidierung, Pufferwiederverwendung, Pausierung verdeckter Tabs und GPU-Texturfreigabe.
- **Isolierter CPU-Vergleich, keine FPS-Aussage:** Auf derselben Node-Laufzeit, mit 72 Bahnen über je 20 Bilder und simuliertem WebGL-Aufruf, benötigte v65 für die Umlaufbahn-Zeichenlogik je Lauf ca. **152–206 ms**, v66 ca. **26–56 ms** (etwa **3,7–6,7×** schneller in diesen Messläufen). Das betrifft nur diesen Ausschnitt und lässt keine Rückschlüsse auf echte GPU-Frametimes zu.
- Neuer Orbit-Ribbon-Aufbau mit **1.000 zufälligen Datensätzen / 465.318 Float-Werten** auf exakte Gleichheit mit v65 geprüft.
- Keine grafischen End-to-End- oder FPS-Messungen im Browser ausgeführt; echte Leistung hängt von Hardware, Anzahl aktiver Objekte, Ansichtsmodus und Datenbestand ab.
- Alle statischen `src/`-Module bleiben azyklisch und sind im Offline-Service-Worker erfasst.

## Version und Offlinebetrieb

- `package.json`: **66.0.0**; `index.html`: **V66.0**.
- `sw.js`: **`sonnensystem-shell-v66`** inklusive `src/renderer/orbit-cache.js`.
- Dokumentation in `README.md` und `docs/ARCHITECTURE.md` ergänzt.

## Dateistatus

**Neu:** 3 Dateien (Orbit-Cache, Performance-Tests, diese Dokumentation). **Geändert:** 27 Dateien (inklusive 15 historischer Tests mit aktualisierten Versionsassertionen). **Gelöscht:** **0 Dateien**. Keine Löschanweisungen erforderlich.

## Update v65 → v66

`Sonnensystem-Delta-v66.zip` in das Hauptverzeichnis der **bestehenden v65-Installation** entpacken und vorhandene Dateien überschreiben. Nichts löschen. PWA online neu laden, bis `sonnensystem-shell-v66` aktiviert und das neue Modul offline zwischengespeichert wurde.

---

<a id="release-v65"></a>

## Release v65

# Delta v65 – doppelten Code entfernen

**Basis:** `Sonnensystem-v64.zip` (v64.0.0). **Ziel:** v65.0.0. **Umfang:** veränderte und neue Dateien, keine vollständige Neuinstallation.

## Zusammengeführte Implementierungen

| Bereich | Gemeinsame Implementierung | Anbindung / erhaltenes Verhalten |
| --- | --- | --- |
| UI-Schalter | `src/ui/control-state.js` – `syncToggleState()` | `display-controls`, `animation-controls`, `catalog-controller`, `layer-panel`: CSS-Status, `aria-pressed`, optionaler Tooltip |
| Reihen-Kamera | `src/app/animation-controls.js` – `refreshRowCameraFrame()` | Live-Katalog-Merge, Layerwechsel, Darstellungspresets und Mond-Schalter verwenden dieselbe Kamera-/Positionsneuberechnung |
| Planetenbahnen | `src/renderer/scene-objects.js` – `planetOrbitIds()` | Planetenansicht und Übergangs-Snapshot verwenden dieselbe Auswahl einschließlich der bisherigen Grenzen von 80 Monden und 35 Satelliten |
| WebGL-Zeichenablauf | `src/renderer/scene-objects.js` – `drawSceneBodies()` | Sonnen- und Planetenansicht filtern und zeichnen Kugeln, Saturnring und Labels über eine gemeinsame Routine; solarer Sortiervergleich bleibt erhalten |
| JPL-Positionskoordinaten | `src/renderer/scene.js` – `eclipticVectorToScene()` | Ekliptikachsen `x,y,z` werden an einer Stelle auf die Szenenachsen `x,z,y` abgebildet; planetare/solare Faktoren bleiben verschieden |
| Meldungen | `src/ui/status.js` – `showTimedNotice()` | Toast und Schalter-Snackbar nutzen denselben Zeitablauf, aber jeweils eigene Timer, Dauer und Fehlerdarstellung |

Die UI-Bezeichnungen und Schalterzustände, die Auswahl-/Szenenlogik, die Simulationsdaten und die API-Routen wurden nicht absichtlich verändert. Bestehende Export-Schnittstellen bleiben verfügbar. Die bisherigen Snapshot-/Quelltexttests wurden für die gemeinsamen Funktionen aktualisiert, ohne die fachlichen Verhaltenstests zu entfernen.

## Release und Offlinebetrieb

- `package.json`: Version **65.0.0**.
- `index.html`: Metaversion **V65.0**.
- `sw.js`: Cache-Name **`sonnensystem-shell-v65`**; neue Hilfsmodule `src/ui/control-state.js` und `src/renderer/scene-objects.js` sind in der Shell-Liste.
- Dokumentation in `README.md` und `docs/ARCHITECTURE.md` aktualisiert.
- Neues Regressionstestpaket `tests/dedup-v65.test.mjs`.

## Gelöschte Dateien

**Keine. 0 bestehende Dateien gelöscht.** Alle Dateien aus v64 bleiben erhalten. Das Delta enthält keine Löschanweisungen.

## Prüfungen

- **326 von 326 automatisierten Tests erfolgreich** (`npm run check`) einschließlich 7 neuer v65-Testfälle.
- Alle statischen Frontend-Imports sind azyklisch; alle `src/*.js`-Module sind im PWA-Cache erfasst.
- Der Update-Vergleich gegen das ausgelieferte `Sonnensystem-v64.zip` unterscheidet neue, geänderte und entfernte Dateien; der Rückspieltest prüft die Vollständigkeit des Deltas.
- Kein grafischer End-to-End-Test im Chromium-Browser; der Browser kann in dieser Umgebung nicht zuverlässig starten.

## Update v64 → v65

`Sonnensystem-Delta-v65.zip` in den Stamm der vorhandenen v64-Installation entpacken und vorhandene Dateien überschreiben. **Keine Dateien manuell entfernen.** Server und PWA neu laden, bis `sonnensystem-shell-v65` aktiv ist. Für den Offlinebetrieb muss die App einmal mit Verbindung geöffnet werden, um die neu hinzugefügten Module zu cachen.

---

<a id="release-v64"></a>

## Release v64

# Delta v64 – aufgeräumte Modulstruktur

**Basis:** vollständiger Projektstand v63.0.0. **Ziel:** v64.0.0.

## Änderungen

Die bisherige zentrale Datei `src/app.js` ist jetzt ein minimaler Einstiegspunkt. Die Anwendungssteuerung liegt in eigenständigen, statisch importierten ES-Modulen. Es wurden keine Bedienkonzepte, Datensätze oder Berechnungsmodelle absichtlich geändert.

| Bereich | Neue Zuständigkeit | Bestehende fachliche Module |
| --- | --- | --- |
| Kamera und Szenen | `src/app/camera-controller.js` – Auswahl, Fokus, Planetenszene, Rückkehr | `src/renderer/camera.js`, `controls.js`, `scene-mode.js` |
| AR | `src/app/ar-controller.js` – Anbindung an Kamera und UI | `src/renderer/ar-mode.js` – Sensorik und Orientierung |
| Animation und Cinema | `src/app/animation-loop.js`, `animation-controls.js` – Bildschleife, Maßstab, Reihe, Cinema-UI | `src/renderer/transitions.js`, `cinema.js` – Animation und Kamerafahrt |
| UI | `src/ui/event-handlers.js`, `display-controls.js`, `layer-panel.js`, `popover-controls.js`, `catalog-controller.js` – Events und Darstellung | `bottom-sheet.js`, `object-details.js`, `object-list.js`, `timeline.js` |
| Objektkatalog | `src/app/object-catalog.js` – Live-Updates, API-Abrufe, JPL-Overrides | `src/data/catalog.js` – Manifest, Prüfung und Zusammenbau |
| Start und Zustand | `src/app/runtime.js`, `state.js`, `service-worker-registration.js` | `src/app.js` – nur Bootstrap |

Die Modulabhängigkeiten sind **azyklisch** (keine zirkulären ES-Imports). Der Katalog erhält seinen Auswahl-Callback beim Start über `connectCatalogSelection()`. Der Renderer, das mobile Sheet und der AR-Controller werden als Live-Bindings im gemeinsamen Zustand registriert; es gibt keine neue globale Browservariable.

Die UI-Ereignisse für Auswahl, Filter, Maßstab, Reihe, Cinema, AR-Perspektiven, Zeit, Follow und mobile Navigation sind weiterhin verbunden. Die bestehenden CSS-/HTML-Ansichten sowie die Katalog- und Redaktionstexte wurden nicht verändert (abgesehen von der sichtbaren App-Metaversion).

## Version und Offlinebetrieb

- `package.json`: **64.0.0**.
- `index.html`: **V64.0**.
- `sw.js`: **`sonnensystem-shell-v64`**. Der Offline-Shell-Cache enthält alle neuen statischen ES-Module. Der bestehende Manifest- und Editorial-Cache-Prozess bleibt erhalten.
- `docs/ARCHITECTURE.md` und `README.md` wurden um die neue Aufteilung ergänzt.

## Tests und Verifikation

**319 von 319 automatisierten Tests erfolgreich** (`npm run check`). Die bisherigen v2–v63-Prüfungen wurden für den modularen Aufbau angepasst: Ihre Quelltextprüfungen lesen nun die tatsächlichen, getrennten Moduldateien; vorhandene Verhaltens- und Renderer-Tests bleiben bestehen. Drei neue v64-Tests prüfen den schlanken Startpunkt, die Importierbarkeit und Zuständigkeit der Module, reale UI-Handler samt Zustandsänderungen und die Offline-Manifestaufnahme.

Die lokale Chromium-Headless-Instanz konnte in der Ausführungsumgebung keine Browserprüfung durchführen. Daher wird kein erfolgreicher visueller End-to-End-Test behauptet.

## Installation

**Vollständige Installation:** `Sonnensystem-v64.zip` entpacken, im Projektverzeichnis `npm start` ausführen und die angezeigte lokale URL öffnen.

**Update einer v63-Installation:** `Sonnensystem-Delta-v64.zip` im Projektstamm von v63 entpacken; vorhandene Dateien ersetzen. Das Delta enthält nur geänderte oder neue Dateien. Da ES-Module umgezogen sind, dürfen alte Browser-Cache-Stände nicht als v64 verwendet werden. Nach dem Update die PWA neu laden, bis der Cache `sonnensystem-shell-v64` aktiv ist.

---

<a id="release-v63"></a>

## Release v63

# Delta v63 – AR-Button und vertikale Blicksteuerung

**Basis:** vollständige Version v62.0. **Zielversion:** v63.0.0.

## Änderungen

- Der AR-Toggle `#ar-mode-btn` wurde aus dem oberen Control Panel in die vorhandene untere `.viewport-actions`-Leiste vor `#reset-camera` verschoben. Er sitzt links unten, Reset rechts unten, beide in derselben horizontalen Ebene.
- Die mobile Bottom-Sheet-Synchronisierung (Höhenvariable, Drag-Transition und Inert-Zustand) gilt nun automatisch für **beide** Buttons. Safe-Area-Ränder, Screenreader-Zustände und die Ausblendung ohne AR-Unterstützung bleiben wirksam. Wenn AR verborgen ist, bleibt Reset rechtsbündig.
- Für die freie Blicksteuerung ohne Selektion ist die vertikale Maus- und Zwei-Finger-Bewegung umgekehrt: Ziehen nach unten senkt die Blickrichtung. Horizontalsteuerung, Pan, Zoom, AR-Sensororientierung und Blickorbit bei bestehender Selektion sind unverändert.
- Version und Service-Worker-Cache auf v63 aktualisiert.

## Installation

`Sonnensystem-Delta-v63.zip` über **v62** entpacken, vorhandene Dateien ersetzen. Das ZIP enthält nur neue/geänderte Dateien. Offline-PWA nach dem Update neu laden, bis der Cache `sonnensystem-shell-v63` aktiv ist.

## Prüfung

**316 von 316 automatisierten Tests bestanden.** Layout geprüft in Chromium bei 1440, 390, 320 und 280 Pixeln; AR und Reset sind in derselben Zeile und werden beim mobilen Sheet gemeinsam angehoben. ZIP-Overlay-Vergleich auf den vollständigen v62-Bestand.

---

<a id="release-v62"></a>

## Release v62

# Delta v62 – freies Umschauen ohne Objektauswahl

**Basis:** vollständiger Projektstand v61. **Ziel:** v62.0.0. Nur geänderte bzw. neue Dateien im Delta enthalten.

## Layer-Dropdown

Der sichtbare Name der Kategorie bleibt **„Transnept. Objekte“**, wie bereits seit v60. Die Kategorie-ID `tno` und der ausgeschriebene, barrierefrei zugängliche Name bleiben erhalten.

## Kamerasteuerung ohne Selektion

- **Ohne ausgewähltes Objekt (`selectedId === null`):** Rechtsziehen, Shift+Linksziehen und synchrones **Zwei-Finger-Wischen** drehen die Blickrichtung wie AR am **unveränderten Augenpunkt**. Es wird keine Umlaufbewegung um ein Zentrum erzeugt. Der Blick kann auch oberhalb des Horizonts liegen.
- **Mit ausgewähltem Objekt:** Bisherige Winkel-/Orbitsteuerung bleibt unverändert.
- **Linksziehen, ein Finger, Pfeiltasten:** Weiterhin bodenparalleles Verschieben, nun in der aktuellen freien Blickrichtung.
- **Mausrad und Pinch:** Weiterhin Zoom. Zwei-Finger-Swipes werden von Pinch weiterhin über die Bewegung beider Kontakte unterschieden.
- **Auswahl, Kamera-/Perspektivwechsel, Szenenwechsel:** Die freie Orientierung wird entweder ohne Änderung von Augpunkt/Blickrichtung in die übliche Kamerasteuerung übertragen oder bei expliziter Neuausrichtung zurückgesetzt. Aktivierung des AR-Sensors übernimmt den freien Blick ohne Sprung.

## Installation und Prüfung

ZIP `Sonnensystem-Delta-v62.zip` auf **v61** überlagern. Projektversion `62.0.0`, Offline-Cache `sonnensystem-shell-v62`. `npm run check` prüft die vorhandenen Regressionstests sowie neue Tests der v62-Gesten, Kamera- und Übergangsinvarianten.

---

<a id="release-v61"></a>

## Release v61

# Delta v61 – Kamera-SVG für Schrägansicht nach unten links

Der Kamera-zurücksetzen-Button zeigt für die nächste Perspektive **Schräg/oben** jetzt ein Videokamera-Symbol, dessen Objektiv **diagonal nach links unten** gerichtet ist. Dafür wurde nur das `data-perspective="oblique"`-SVG in `index.html` von einer Drehung um 38° auf 142° geändert. Die übrigen beiden SVG-Symbole (Topdown, Seitlich), die Anzeigefolge und die AR-Steuerung bleiben unverändert.

## Installation

`Sonnensystem-Delta-v61.zip` über einen vollständigen v60-Stand entpacken und vorhandene Dateien ersetzen. App-Version `61.0.0`, Offline-Cache `sonnensystem-shell-v61`.

## Prüfung

`npm run check` führt die vorhandenen Regressionstests und `tests/camera-icon-v61.test.mjs` aus. Die beiden Tests prüfen die Richtung des Objektivs und die unveränderten übrigen SVGs.

---

<a id="release-v60"></a>

## Release v60

# Delta v60 – Layer-Kategorie kürzer beschriftet

Im Control Panel wird die Kategorie für transneptunische Objekte im **Layer-Dropdown** jetzt als **„Transnept. Objekte“** angezeigt. Die interne Kennung (`tno`), der vollständige Kategoriename **„Transneptunische Objekte“** in Katalog und Suche sowie das Filterverhalten bleiben unverändert. Der vollständig ausgeschriebene Kategoriename bleibt für Screenreader über `aria-label` zugänglich.

## Installation

`Sonnensystem-Delta-v60.zip` über einen vollständigen **v59**-Stand entpacken und vorhandene Dateien ersetzen. Projektversion `60.0.0`, Service-Worker-Cache `sonnensystem-shell-v60`.

## Prüfung

`npm run check` validiert den Katalog, die bestehenden Regressionstests und den neuen Test `tests/layer-label-v60.test.mjs`.

---

<a id="release-v59"></a>

## Release v59

# Delta v59 – Layer-Dropdown: feste Breite 155 px

## Änderung

- Das Dropdown `#layer-popover` erhält **155 px Breite** (`box-sizing: border-box`).
- Die bestehende responsive Maximalbreite `calc(100vw - 20px)` bleibt erhalten.
- Die veralteten Breitenangaben in früheren CSS-Regeln (145, 152 und 232 px) sind auf denselben Wert abgeglichen, damit keine widersprüchlichen Deklarationen mehr existieren.
- Presets, die fünf Darstellungs-Toggles und Objektkategorien behalten ihre Funktion und Reihenfolge.

## Installation

`Sonnensystem-Delta-v59.zip` über einen vollständigen **v58**-Stand entpacken. Projektversion `59.0.0`; PWA-Cache `sonnensystem-shell-v59`.

## Validierung

`npm run check` prüft den Objektkatalog, bestehende Tests und den neuen Regressionstest `tests/layer-popover-width-v59.test.mjs`.

---

<a id="release-v58"></a>

## Release v58

# Delta v58 – SVG-Perspektivicons und Perspektivwechsel im AR-Modus

**Basis:** v57.0.0. **Ziel:** v58.0.0. Das ZIP enthält nur die neuen oder gegenüber v57 geänderten Dateien.

## Kamera zurücksetzen

- Drei neue, eigenständige SVG-Icons ersetzen das alte Pfeil-/Ecken-Icon. **Schräg/oben:** Videokamera nach rechts unten. **Topdown:** Videokamera nach unten. **Seitlich:** frontal sichtbare Kameralinse.
- Der Button zeigt immer das **Icon für die nächste Ansicht**. Die Reihenfolge ist **Schräg/oben → Topdown → Seitlich → Schräg/oben**. Ist die aktuelle Perspektive Schräg/oben, erscheint Topdown. Nach einem Klick auf Schräg/oben erscheint ebenfalls Topdown als nächstes Icon.
- Bei manueller Kameraverschiebung, Rotation oder Zoom wird der nächste Schritt auf **Schräg/oben** zurückgesetzt und das Icon unmittelbar aktualisiert. Die Kamera-Preset-Winkel werden im Sonnensystem bei `.99` / `.16` / `1.54` Radiant Neigung angesetzt (Schräg/oben, Topdown, Seitlich); Planetenansichten beginnen in der Schrägansicht bei `.84`.
- Die **Planetenansicht ohne AR** behält ihre bisherige Aktion: zurück zur Sonnensystemübersicht. Die drei Perspektivicons bleiben derselbe Button, kein weiterer Trigger.

## Perspektiven im AR-Modus

- Der Kamera-Button wechselt bei aktivem AR jetzt **ebenfalls zwischen Perspektiven**, ohne AR zu deaktivieren oder die Planetenszene zu verlassen.
- Nach jedem Klick wird die **letzte gültige Sensorhaltung** neu am Kamera-Preset verankert. So ist das aktuelle Kamerabild in die neue Richtung ausgerichtet und reagiert anschließend wieder auf das Drehen/Neigen des Geräts. Es wird kein zweites Mal eine Sensorberechtigung angefragt.
- **Nur Umsehen per Geräteausrichtung** ist keine translatorische Kamerabewegung. Der Preset-Zyklus läuft dadurch weiter. Manuelles Schwenken/Zoomen der virtuellen Kamera unterbricht den Zyklus und bietet als Nächstes die Schrägansicht an.
- Die bestehende reine Sensor-Neuausrichtung `recenter()` ist als API-Funktion erhalten, aber nicht mehr auf dem sichtbaren Reset-Button hinterlegt.
- **Einschränkung:** DeviceOrientation liefert nur die Drehung/Neigung, **nicht die 3D-Position** des Smartphones. Physische Translation des Telefons kann ohne AR-Positions-Tracking nicht zuverlässig erkannt werden.

## Umsetzung / Tests

- Geänderte Module: `src/renderer/camera.js`, `src/renderer/renderer.js`, `src/renderer/ar-mode.js`, `src/ui/scene-mode.js`, `src/app.js`.
- Oberfläche: `index.html`, `css/styles.css`. Versionsdaten: `package.json`, `sw.js`.
- Neue Tests: `tests/perspective-icons-ar-v58.test.mjs`; ältere Tests auf die neue Perspektivreihenfolge und neue AR-Buttonaktion aktualisiert. **300 automatisierte Tests bestanden.**
- Katalog, Layer, Cinema und Satellitendaten unverändert. PWA-Cache `sonnensystem-shell-v58`.

**Installation:** ZIP im Projektstamm einer vollständigen **v57-Installation** entpacken und gleichnamige Dateien ersetzen. Eine installierte PWA danach neu laden.

---

<a id="release-v57"></a>

## Release v57

# Delta v57 – Layer-Dropdown-Presets und Kamera zur Ansicht zurücksetzen

**Basis:** Projektstand **v56.0.0**. **Ziel:** **v57.0.0**. Das Archiv `Sonnensystem-Delta-v57.zip` enthält nur neue und geänderte Dateien. Den Inhalt über eine vollständige v56-Installation entpacken und gleichnamige Dateien ersetzen.

## Layer-Dropdown

- Die sichtbare Überschrift **„Darstellung“** oberhalb der Darstellungsschalter und der Absatz `p.layer-note` mit den Standardwerten unter den Objektkategorien wurden entfernt. Der unsichtbare ARIA-Gruppenname bleibt bestehen.
- Die drei Buttons **Beschriftung**, **Beleuchtung** und **Alle Monde** belegen die obere Reihe, die Buttons **Umlaufbahn** und **Kontrast** stehen zentriert in einer zweiten Reihe darunter. Die Objektkategorien folgen wie bisher.
- **Alle** aktiviert **alle Objektlayer und alle fünf Darstellungsschalter**. Das entspricht `labels:true`, `lighting:'realistic'`, `fourMoons:false` (UI „Alle Monde“ ist somit **An**), `orbits:true`, `orbitContrast:true`.
- **Standard** setzt Kategorien **und** Darstellungsschalter für die **aktuelle Ansicht** auf die von `createViewSettings(view)` definierten Vorgaben zurück. Sonnensystem: Beleuchtung optimiert, vier Monde je Planet, Beschriftung an, Bahnen an, Kontrast aus. Planetenansicht: Beleuchtung realistisch, alle Monde, Beschriftung an, Bahnen an, Kontrast aus. Eine manuelle Änderung hebt die Preset-Auswahl-Markierung auf. **Objekt**, **Bahn** und **Reihe** bleiben bei Presets unverändert; die andere Ansicht behält ihre eigenen Einstellungen.

## Kamera bei Maßstabswechsel

- Ein Klick auf **Objekt** oder **Bahn** führt auch nach manueller Kameraänderung die Kamera zur **Ausgangsperspektive der aktiven Szene** zurück. Dazu werden der manuelle Bewegungstatus und ein Fokus aufgehoben sowie eine aktive Folgen-Nachführung beendet.
- **Sonnensystem:** Ziel `[0,0,0]`, Startwinkel `.63/.99`, Abstand aus `solarOverviewDistance()` gemäß neuem Maßstab.
- **Planetenansicht:** Ziel `[0,0,0]`, Startwinkel `.63/.84`, Abstand aus `planetFrameDistance()`.
- **Objekt-Reihe:** Ziel und Abstand des Anfangsframes `rowFrame()` / `rowDistance()`, Blickwinkel `0/1.5`.
- Die bisherige Maßstab-Transition bleibt für Kamera und Objekte erhalten; die sanfte zeitversetzte Bahnwelle beim Ausschalten der Bahnabstände in der Planetenansicht wird nicht ersetzt.

## Technische Umsetzung und Prüfung

- `src/app.js`: `applyDisplayPreset` synchronisiert die fünf Darstellungszustände und den Preset-Status; `updateScale` ruft `renderer.resetViewCamera()` auf.
- `src/data/layers.js`: reine Hilfsfunktionen `displayPreset` und `displayMatchesPreset`, explizite Liste der Darstellungseinstellungen.
- `src/renderer/renderer.js`: `resetViewCamera` als szenenabhängige Startkamerasteuerung. `index.html`/`css/styles.css`: reduzierte Texte und 3+2-Raster.
- `tests/layer-presets-camera-v57.test.mjs`: Regressionstests für beide Presets, Darstellungsschalter, Markierung, Schalter-/Szenenunabhängigkeit und animierte Kamera-Rückführung. Desktop-/Mobil-Layoutkontrolle in Headless Chromium.
- Service-Worker-Cache **`sonnensystem-shell-v57`**, Projektversion **57.0.0**. Katalogdaten, Modellbahnen und API-Strukturen bleiben unverändert.

**Installation:** `Sonnensystem-Delta-v57.zip` im Stammverzeichnis eines vollständigen v56-Standes entpacken und Dateien ersetzen. Bei installierter PWA nach dem Update die Seite erneut laden, damit der neue Offline-Cache wirksam wird.

---

<a id="release-v56"></a>

## Release v56

# Delta v56 – Katalogerweiterung und relevanzsortierte Suche

**Basis:** vollständiger Projektstand **v55.0.0**. **Ziel:** **v56.0.0**. Die Datei `Sonnensystem-Delta-v56.zip` enthält ausschließlich neu angelegte und geänderte Dateien. **Kein vollständiges Projekt**: über eine vorhandene v55-Installation entpacken und Dateien ersetzen.

## Objektkatalog (+18)

| Kategorie | Ergänzungen |
|---|---|
| **Doppelasteroiden (2)** | **(65803) Didymos** und sein Begleiter **Dimorphos** |
| **Jupitermonde (3)** | S/2003 J 2, S/2003 J 4, S/2018 J 2 |
| **Saturnmonde (4)** | Loge, Skoll, Greip, Tarqeq |
| **Neptunmonde (2)** | S/2002 N 5, S/2021 N 1 |
| **Künstliche Erdsatelliten (7)** | Tiangong / Tianhe (NORAD 48274); GPS BIIF-6 (39741), GPS BIIF-10 (40730); NOAA-20 (43013), NOAA-21 (54234); GOES-16 (41866), GOES-18 (51850) |

Der neue Typ **Doppelasteroiden** erscheint im Layer-Dropdown und lässt sich unabhängig von anderen Objektkategorien ein- und ausschalten. Beide Objekte haben eine hierarchische Bahn (Didymos um die Sonne, Dimorphos um Didymos). Die neuen natürlichen Monde befinden sich in den bereits vorhandenen Mond-Objektkategorien und sind an ihre jeweiligen Planeten gebunden. Die Erdsatelliten ergänzen den bestehenden Satelliten-Layer. Die Suche zeigt diese Objekte auch dann, wenn ihr Layer ausgeschaltet ist.

Der Katalog umfasst jetzt **192 astronomische Objekte** mit **192 redaktionellen Artikeln**, `catalogVersion: 10.0.0` und 23 Quell-JSON-Dateien für Kategorien. Für alle neuen Einträge wurden Namen/Aliase, Bahndaten, Zuordnung zum Zentralkörper und Quellenbeschreibungen ergänzt.

### Genauigkeit

- **Didymos:** historische oskulierende Sonnenbahn; **Dimorphos:** modellhafte relative Umlaufbahn nach dem DART-Einschlag mit rund 11 Stunden 22 Minuten Umlaufzeit. Die dynamischen Auswirkungen sind vereinfacht.
- **Weitere Monde:** Mittlere Bahnelemente aus einem NASA/JPL-Tabellensatz; keine Echtzeit-Ephemeriden. Für unsichere körperliche Radien steht bewusst `radiusKm: 0` (in der Anzeige `—`).
- **Satelliten:** Die NORAD-IDs und typischen Bahnhöhen/Perioden dienen zur Identifizierung und einer illustrativen Darstellung. Knoten, Anfangsphase und Perizentrum sind schematisch. **Kein Live-TLE, keine reale aktuelle Satellitenposition und keine Bahnvorhersage.**

Quellen: [NASA – Didymos/Dimorphos](https://science.nasa.gov/solar-system/asteroids/didymos/), [JPL – DART Bahnänderung](https://www.jpl.nasa.gov/news/nasa-study-asteroids-orbit-shape-changed-after-dart-impact/), [NASA/JPL – Satelliten-Bahnelemente](https://ssd.jpl.nasa.gov/sats/elem/), [CelesTrak – NORAD-Kataloggruppen](https://celestrak.org/NORAD/elements/).

## Trefferreihenfolge

`src/ui/object-list.js` behält die bestehende UND-Suche über einzelne Wörter und alle Suchfelder bei; bei nichtleerem Suchfeld gilt nun folgende Priorität:

1. **Exakter Objektname, Alias oder ID:** z. B. wird `Saturn` immer als erster Treffer angezeigt.
2. **Exakter Kategoriename** (Singular/Plural): z. B. `Planeten`, `Monde`, `Doppelasteroiden`.
3. **Namenspräfix**, dann **Kategoriepräfix**.
4. **Exakte Elternreferenz**, dann **Teiltreffer in Namen/ID/Alias**, danach Kategorie- oder Elternteiltreffer.
5. **Verteilte Mehrworttreffer** (wie bisher), zuletzt im gemeinsamen Relevanzrang.

Bei gleicher Treffergüte: **Planeten → Zwergplaneten → Monde → andere Objekte**, dann alphabetisch nach Name. Ohne Suchbegriff bleibt die kuratierte Listenanordnung erhalten. Die planetenbezogene Katalogfilterung und die unabhängig von Layern zugängliche Suche bleiben bestehen.

## Umgesetzte technische Änderungen

- Neue Dateien: `data/catalog/binary-asteroids-v56.json`, `data/catalog/moons-additions-v56.json`, `data/catalog/satellites-additions-v56.json`, `data/editorial/de-objects-v56.json`.
- Manifest, Typnamen und Kategorienfarben, Layer-Checkbox, Sonnen- und Begleiterorbit, rekursive Positionierung, Detailstatistik (km/AE und Kleinkörpergrößen), Suchgewichtung und Offline-Cache aktualisiert.
- Version **56.0.0**, Offline-Cache **`sonnensystem-shell-v56`**.
- Integrationstests in `tests/catalog-search-v56.test.mjs` ergänzt, frühere Katalog-Zähltests an die nun vollständige Menge angepasst.

**Installation:** `Sonnensystem-Delta-v56.zip` über das Stammverzeichnis von **v55** entpacken. Bei vorhandenem PWA-Offline-Cache die Seite einmal neu laden, damit der aktualisierte Service Worker die neuen JSON-Dateien vorlädt.

---

<a id="release-v55"></a>

## Release v55

# Delta v55 – Control-Panel ohne Maßstab-Dropdown

**Basis:** vollständiger Projektstand **v54.0.0**. **Ziel:** **v55.0.0**. Die Datei `Sonnensystem-Delta-v55.zip` ist ein inkrementelles ZIP (kein Vollprojekt); über das Root einer v54-Installation entpacken und vorhandene Dateien ersetzen.

## Änderungen

1. **Direkte Maßstab-Schalter:** Die drei Toggle-Buttons **Objekt**, **Bahn** und **Reihe** stehen dauerhaft im oberen Control Panel neben **Layer** und **Zeit**. Icons, Beschriftungen und Aktivzustände bleiben vorhanden. Die Maßstab-Schaltfläche, ihre Dropdown-Box und die zugehörige Menü-Öffnungslogik sind entfernt.
2. **Darstellungs-Optionen im Layer-Dropdown:** Nach den Presets **Alle/Standard**, aber **oberhalb** der Objektkategorien, steht die neue Gruppe **Darstellung** mit den fünf bisherigen Schaltern **Beschriftung**, **Beleuchtung**, **Alle Monde** (Icon aus neun Kreis-Punkten), **Umlaufbahn**, **Kontrast**. Die Kategorie-Liste beginnt weiter mit **Sterne** und enthält alle bisherigen Objektkategorien.
3. **Unveränderte Funktion:** Alle Toggles behalten ihre Einstellungen und die bisherigen Zustandsrückmeldungen (Toast, `aria-pressed`, Tooltips). **Alle Monde**: Aus = höchstens vier größte Monde je Planet; An = alle natürlichen Monde des aktiven Mond-Layers. Cinema ist weiterhin nur mit **Reihe An / Objekt An / Bahn Aus** verfügbar; die Kamera-Zooms, Haltephasen und Stop-Rückkehr aus v54 bleiben unverändert.
4. **Responsive Bedienung:** Die Hauptleiste darf auf schmalen Geräten umbrechen. Layer- und Zeit-Popover stehen unterhalb der Leiste, und die fünf Darstellungsschalter bleiben in einer gemeinsamen Zeile, ohne die Objektkategorien zu überlagern.

## Geänderte Komponenten

- `index.html`: Neu angeordnete direkte Maßstab-Schalter und Layer-Darstellungsgruppe.
- `css/styles.css`: Hauptleiste, Layer-Toggles und responsive Popover-Positionen.
- `src/app.js`: Entfernte Listener für das nicht mehr existierende Maßstab-Dropdown; die vorhandenen Toggles bleiben verbunden.
- `package.json`, `sw.js`: Versionswechsel und neuer PWA-Cache.
- `tests/`: Regressionsprüfungen für das v55-Layout, unveränderte Steuerungsfunktionen und bisherige App-Funktionen.
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`: aktualisierte Bedien- und Architekturhinweise.

## Prüfung und Installation

- **277 von 277 automatisierten Tests erfolgreich** (`npm run check`, inklusive Datenvalidierung).
- Statische Chromium-Layoutprüfung für Desktop und mobile Viewports (1440, 390, 320 und 280 Pixel) sowie AR-/Cinema-Leistenvarianten: keine abgeschnittenen Schalter, kein horizontaler Überlauf. Die vollständige WebGL-Interaktion wurde in der Umgebung nicht ausgeführt.
- Nach Installation ggf. die Anwendung neu laden, damit die neue PWA-Cache-Version aktiv wird.

---

<a id="release-v54"></a>

## Release v54

# Delta v54 – Cinema-Zoom und neues Maßstab-Panel

**Basis:** vollständiger Projektstand **v53.0.0**. **Ziel:** **v54.0.0**. `Sonnensystem-Delta-v54.zip` ist ein inkrementelles ZIP, keine vollständige Anwendung. Über das Projekt-Root von v53 entpacken und vorhandene Dateien ersetzen.

## Funktionsänderungen

1. **Cinema-Play:** Sichtbar bei `row=true`, `scaleObjects=true` und `scaleOrbits=false`. Beim Aktivieren der Reihe wird der Objektgrößenmaßstab weiterhin automatisch aktiviert. Die bisherige Freigabe bei *beiden* ausgeschalteten Maßstäben entfällt.
2. **Kamerafahrt:** Aufsteigende Reihenfolge nach physikalischem Katalogradius, passender Zoom pro sichtbarem Objekt einschließlich Saturns Ringen. Die Kamera hält **1.500 ms** pro Objekt und benötigt rund **1.300 ms** für einen sanften horizontalen Übergang mit logarithmischem Zoom. Hinzu kommt die bisherige 1.100-ms-Anfahrt; ein Film mit N Objekten hat daher etwa **N × 1,5 s + (N−1) × 1,3 s** reine Fahr-/Haltezeit (plus Anfahrt und kurzer Abschluss). Die angezeigten Größen bleiben physikalisch proportional; es ist keine Videowiedergabe.
3. **Zeitleiste:** Ermittelt Ziel und Zoom aus derselben kontinuierlichen Filmposition und bleibt per Drag, Touch und Tastatur steuerbar. Stop und Ende stellen absteigende Größenreihenfolge und ursprüngliche Kamerapose wieder her. Ein Mondfilter-Wechsel während Cinema beendet die Tour ebenfalls.
4. **Maßstab-Dropdown:** Drei Hauptbuttons in einer oberen Reihe: **Objekt**, **Bahn**, **Reihe**. Reihe besitzt eine sichtbare Beschriftung. Unter Objekt und Bahn bleiben die sekundären Icon-Schalter.
5. **Mond-Toggle:** Das Icon besteht aus **neun im Kreis angeordneten Punkten**. Neuer Sinn: **Aus = maximal vier größte natürliche Monde pro Planet**, **An = alle natürlichen Monde** (sofern der entsprechende Objekt-Layer sichtbar ist). Die bisherige Begrenzungsvariable `fourMoons` wird intern unverändert verwendet, das sichtbare Schalterverhalten wird invertiert. Die Standardsichten behalten ihre alte tatsächliche Mondanzahl.

## Änderungen und Tests

- Geändert: `src/renderer/{cinema,renderer}.js`, `src/app.js`, `index.html`, `css/styles.css`, Release- und Dokumentationsdateien.
- Neu: `tests/cinema-scale-controls-v54.test.mjs`. Historische Tests wurden dort aktualisiert, wo ihre ehemaligen UI-Erwartungen den nun ausdrücklich geänderten Anforderungen widersprechen.
- `npm run check`: Katalogvalidierung und Node-Tests. Der Dropdown-Aufbau wurde zusätzlich mit Headless Chromium in 1440, 390, 320 und 280 Pixel Breite geprüft. Die vollständige WebGL-End-to-End-Interaktion ließ sich aufgrund einer Browser-Navigationssperre nicht ausführen.

## Hinweise

Die Gesamtdauer richtet sich nach der Anzahl **sichtbarer** Körper. Bei aktivierten zusätzlichen Mond- oder Asteroiden-Layern kann die Tour deutlich länger dauern als in v53, weil jeder Körper eine eigene Haltephase hat. Die Berechnung ist eine lokale WebGL-Animation; die Videoreferenz https://www.youtube.com/watch?v=HEheh1BH34Q wird nicht eingebettet.

---

<a id="release-v53"></a>

## Release v53

# Delta v53 – Cinema-Modus für Objekt-Reihen-Darstellung

**Basis:** vollständiger Projektstand v52.0.0. **Ziel:** 53.0.0. **Installation:** `Sonnensystem-Delta-v53.zip` in das Projekt-Root über v52 entpacken und alle Änderungen überschreiben. Das Archiv ist ein **Delta**, keine vollständige Installation.

## Funktionsumfang

- Kontext-Play-Button in der horizontalen Control-Panel-Leiste **nur dann**, wenn `row=true`, `scaleObjects=false` und `scaleOrbits=false`. Vorherige v51-Voreinstellung der Reihe (Objektmaßstab zunächst an) bleibt erhalten.
- Beim Start sortiert Cinema ausschließlich die **aktuell sichtbaren Himmelskörper der aktiven Szene** nach ihrem katalogisierten Radius **aufsteigend**. Die gewöhnliche absteigende Reihe wird nicht dauerhaft geändert. Schematische Objektradien werden fürs Bild beibehalten. Die Sonne bzw. der Zentralplanet und die Layerfilter wirken weiter.
- Von links nach rechts wandernde virtuelle Kamera mit gleichmäßig nach Objektrang getakteter Abfahrt und sichtbarkeitsgerechtem Kameraabstand. 1100 ms Anfahrt, danach etwa 18–150 Sekunden Filmdauer abhängig von der Menge sichtbarer Objekte. Abrupte Tab-Reaktivierung springt nicht zum Ende.
- Native HTML-Range-Zeitleiste unter der Szene. Position, Zeit und aktueller Name sind sichtbar und per Maus, Touch oder Tastatur steuerbar. Scrubbing unterbricht die automatische Bewegung vorübergehend.
- **Stop** setzt die Sortierung zurück auf **groß → klein**, animiert die vorherige Kamera-Zielposition, Distanz und Blickwinkel und blendet die Zeitleiste aus. `Esc`, manuelle Kameraeingriffe, ein Maßstabs-/Ansichts-/Layerwechsel sowie die automatische Fertigstellung stoppen ebenfalls. Normale Zeit-Play/Pause und AR bleiben eigenständige Funktionen.
- Desktop- und mobile Layouts nutzen den bestehenden Toolbar-Stil; die mobile Zeitleiste liegt oberhalb von Reset-Button und Bottom-Sheet.

## Technische Änderungen

- `src/renderer/cinema.js` neu: reine Steuerungs-/Framing- und Zeitformeln.
- `src/renderer/transitions.js`: optionaler `asc`-Layout-Parameter ohne Änderung des bisherigen `desc`-Verhaltens.
- `src/renderer/renderer.js`: Start/Stop/Scrub/Fortschritt, Kamera- und Layoutübergänge, Responsive-Verhalten.
- `src/app.js`, `index.html`, `css/styles.css`: zustandsabhängiger Transport, Timeline, AR-Interlock, Tastatur und Mobile-Position.
- `sw.js`, `package.json`, `README.md`, `docs/{ARCHITECTURE,HILFE}.md`: Release und Offline-Dateiliste aktualisiert.
- `tests/cinema-v53.test.mjs` neu; Versionschecks in bestehenden Tests auf v53 aktualisiert.

## Validierung

`npm run check` führt Katalog-Validierung und die Node-Test-Suite aus. Für UI-Layout wurde das HTML/CSS zusätzlich mit Headless Chromium auf Desktop (1440×900) und Mobilbreite (390×844) hinsichtlich Position und Überlagerung geprüft. Eine vollständige End-to-End-WebGL-Wiedergabe im Browser war in der Testumgebung wegen einer Navigationssperre nicht durchführbar.

**Videoreferenz:** https://www.youtube.com/watch?v=HEheh1BH34Q – nur Inspirationsbasis für die aufsteigende Größe und Kamerarichtung. Weder Video noch Ton werden in die App kopiert oder eingebettet.

---

<a id="release-v52"></a>

## Release v52

# Delta v52 – Layer-Dropdown und Objektkatalog

## Installation

`Sonnensystem-Delta-v52.zip` über eine **vollständige v51-Installation** direkt im Projektstamm entpacken; vorhandene Dateien überschreiben. Es handelt sich um ein **Delta**, nicht um ein vollständiges Projektarchiv. Danach ggf. eine installierte PWA neu öffnen, damit der Service Worker den neuen Katalog offline übernimmt. App-Version **52.0.0**, Offline-Cache `sonnensystem-shell-v52`, Katalogversion **9.0.0**.

## Änderungen

### Objektkategorien im Layer-Dropdown

**Sterne** steht an erster Stelle. Reihenfolge: Sterne → Planeten → Monde → Zwergplaneten → Transneptunische Objekte → Asteroiden → Satelliten → Kometen → Raumsonden. Die neue Kategorie **Transneptunische Objekte** hat eine eigene Layer-Farbe und kann wie die anderen Kategorien aktiviert werden. Die Popover-Breite bleibt 145 px; die lange Bezeichnung wird bei Bedarf umgebrochen. Der Preset **Standard** bleibt auf Sterne und Planeten beschränkt; **Alle** aktiviert sämtliche Kategorien.

### Neue Katalogobjekte

| Kategorie | Neue Objekte | Anzahl |
| --- | --- | ---: |
| Asteroiden | (16) Psyche, (10) Hygiea, (162173) Ryugu, (25143) Itokawa, (243) Ida | 5 |
| Kometen | 67P/Tschurjumow-Gerassimenko, 9P/Tempel 1, 103P/Hartley 2, 81P/Wild 2 | 4 |
| Transneptunische Objekte | Quaoar, Orcus, Gonggong, Sedna, Arrokoth | 5 |

**Gesamtbestand:** 174 Körper, 174 redaktionelle Einträge. Für alle Neuzugänge sind Namen, Typ, übergeordnetes Objekt (Sonne), physikalischer Radius, Bahnparameter/Epoche, Darstellung/Farbe, Beschreibung und Quellenlinks hinterlegt. Internationale Namen und historische Bezeichnungen sind als optionale `aliases` suchbar. Die neuartigen TNO-Körper und ihre Sonnenbahnen folgen denselben Rendering- und Filterregeln wie die bisherigen solaren Kleinkörper. Auch in der Objektsuche und den Details sind sie auswählbar.

### Datenherkunft und Grenzen

- **Asteroiden und Quaoar, Orcus, Gonggong, Sedna:** katalogisierte oskulierende Bahnelemente aus dem öffentlichen Stellarium-Kleinkörperdatensatz (astronomische Quelle JPL/MPC), einschließlich der dort angegebenen Epochen.
- **Kometen:** veröffentlichte Element- und Periheldaten aus astronomischen Kleinobjektquellen, für den Katalog in Kepler-Elemente mit einer angenäherten Phase umgerechnet.
- **Arrokoth:** gerundete historische Elemente mit grob geschätzter Bahnphase; Darstellung als vereinfachte Kugel, nicht als physikalisches Kontakt-Doppelkörper-3D-Modell.
- Radien sind überwiegend gerundete Literaturwerte. **Alle 14 Sonnenbahnen sind zweikörperbasierte Simulationen**, keine aktuellen präzisen Ephemeriden; Planeteneinflüsse und nichtgravitative Kometeneffekte werden nicht fortgerechnet. Bahnmodelle und Quellen sind in den Detaildaten kenntlich gemacht.

Weiterführende Ursprünge: [Stellarium-Kleinkörperdaten](https://github.com/Stellarium/stellarium/blob/master/data/ssystem_minor.ini), [NASA/JPL Small-Body-Orbits](https://ssd.jpl.nasa.gov/sb/orbits.html). Zusätzliche Herkunftslinks stehen in den jeweiligen `provenance`-Feldern und Artikeln.

### Technische Dateien

- `data/catalog/manifest.json` + drei neue Katalogdateien + `data/editorial/de-objects-v52.json`: Katalog auf v9.0.0 erweitert und getrennt validiert.
- `src/data/{bodies,catalog,layers,orbital-math}.js`: neuer Typ `tno`, Quell-/Alias-Validierung, Category-Layer und schematische Größen.
- `src/ui/{object-list,object-details}.js`: TNO-Suche, Aliase und Modellhinweise.
- `src/renderer/{solar-view,labels}.js`: solare TNO-Bahnen und Objektbeschriftungen.
- `index.html`, `css/styles.css`: Sterne zuerst, TNO-Checkbox mit textlichem Umbruch und App-Version.
- `sw.js`, `package.json`: Version 52 und Manifest-gesteuerter Offline-Katalog.
- Dokumentation und Tests für den neuen Stand.

## Qualitätssicherung

`npm run check` validiert Schema, Quellen-URLs, eindeutige IDs und Elternbeziehungen und führt automatisierte Regressionstests für bestehende und neue Funktionen aus. Zusätzlich zum bestehenden Testumfang deckt `tests/category-delta-v52.test.mjs` die Reihenfolge der Checkboxen, Katalogzählung, alle 14 Namen/Typen, Orbits an mehreren Zeitpunkten, Filter, Suche und neue Datenpfade ab.

---

<a id="release-v51"></a>

## Release v51

# Delta v51 – Größen in Reihe und sanfte Bahnwelle

## Installation

`Sonnensystem-Delta-v51.zip` im Projektstamm über die **vollständige v50-Installation** entpacken und betroffene Dateien ersetzen. Das ZIP enthält nur neue und geänderte Dateien gegenüber v50. Anwendungsversion **51.0.0**; Offline-PWA-Cache **sonnensystem-shell-v51**. Bei installierter PWA App nach Aktualisierung neu öffnen, damit der neue Service Worker aktiv wird.

## Objekt-Reihendarstellung

- Beim Umschalten **von Umlaufbahnen in die Reihe** wird **Objekt: maßstabsgetreu** automatisch eingeschaltet. Die vor dem Umschalten gezeichneten Positionen und Größen werden vor der Änderung gespeichert, damit der animierte Eintritt nahtlos bleibt.
- Die beiden Szenen teilen die Objektgrößen-Einstellung wie zuvor. `scaleObjects` wird deshalb für Sonnensystem und Planetenansicht gesetzt; die aktive UI zeigt unmittelbar den eingeschalteten Schalter. `Bahn` und andere Darstellungsoptionen ändern sich nicht.
- Manuelles Umschalten der Objektgrößen während einer Reihe bleibt möglich. Beim Verlassen bleibt der zuletzt gewählte Maßstab erhalten; erst ein erneutes Aktivieren von Reihe stellt Maßstabsgetreu wieder als Standard her.

## Animation beim Ausschalten der Bahnabstände in der Planetenansicht

- **Nur** für `Bahn: An → Aus` bei geöffneter Planetenansicht (und außerhalb der Reihendarstellung) ersetzt eine glatte, monotone Kurve den bisher stärker sichtbaren Gummiband-Effekt. Die Bahnradien schwingen nicht mehr über ihren Zielwert hinaus.
- Sichtbare Bahnen werden nach ihrem physischen Abstand zum Zentralplaneten sortiert. Die innerste Bahn beginnt zuerst, die äußerste bis zu **0,20 × 980 ms ≈ 196 ms** später. Alle Bahnen erreichen nach **980 ms** denselben endgültigen schematischen Maßstab. Monde/Satelliten nutzen dieselbe Verzögerung wie ihre Bahnen; Orbitlinien und Kugelpositionen bleiben synchron.
- Erneute Änderungen während einer Animation starten von der zuletzt sichtbaren Position und dem zuletzt sichtbaren Bahn-Radius. Der Gegenweg (Bahn aus → an), Änderungen in der Sonnenansicht, Größen-/Reihenwechsel und Ansichtsübergänge behalten die bisherige Federanimation. Bei `prefers-reduced-motion` findet keine Animationswelle statt. Keine Änderungen an Keplerparametern oder Katalogdaten.

## Prüfung

Neue automatische Tests für Skalierungs-Standard der Reihe in beiden Ansichten, `aria-pressed`-Synchronität, manuelle Änderung und erneutem Eintritt, korrekte Auswahl der Animationsart, monotone und nach Distanz gestaffelte Bahnen, synchronisierte Kugel-/Bahn-Geometrie, Unterbrechungsfreiheit und Bewegung-reduzieren. Bestehende Regressionen und PWA-Cache-/Versionsprüfungen bleiben erhalten. Zum Prüfen `npm run check` ausführen.

---

<a id="release-v50"></a>

## Release v50

# Delta v50 – Kamera zurücksetzen im AR-Modus

## Installation

`Sonnensystem-Delta-v50.zip` im Projektstamm über eine **vollständige v49-Installation** entpacken und vorhandene Dateien ersetzen. Das Archiv enthält ausschließlich geänderte oder neue Dateien. Version nach Aktualisierung: **50.0.0**; der PWA-Cache lautet **sonnensystem-shell-v50**.

## Verhalten

- **AR aktiv:** Der vorhandene Button **Kamera zurücksetzen** unten rechts dient nun der **Neuausrichtung des AR-Blicks** statt des Wechsels der Standard-Kameraperspektiven. Die letzte gültige Geräteorientierung wird zur neuen Referenz. Die aktuelle Kamerabasis der Szene wird als neue neutrale Blickrichtung verwendet; die Perspektive richtet sich unmittelbar dorthin aus. Weitere Drehungen des Smartphones wirken relativ zu diesem neuen Ausgangspunkt.
- **Kein Ortswechsel:** Augenposition, Kameradistanz und aktuelle Szene bleiben bestehen. AR bleibt eingeschaltet, Sensorereignisse laufen weiter und es ist keine erneute Berechtigungsabfrage nötig. Mehrfaches Neuausrichten ist möglich. Eine kurze Snackbar bestätigt die Aktion.
- **AR aus oder noch nicht bereit:** Der Reset-Button verhält sich wie zuvor: in der Sonnensystemansicht Wechsel zwischen drei Kamerapositionen bzw. nach manueller Bewegung Rückkehr zur Standardperspektive, in der Planetenansicht Rückkehr zur Gesamtübersicht.
- **Bedienbarkeit:** Tooltip und Screenreader-Beschriftung des Buttons passen sich dem AR-Zustand an. Nicht unterstützte Smartphones zeigen wie bisher keinen AR-Button.

## Prüfumfang

Automatisierte Tests für AR-Rekalibrierung nach Bewegung, unveränderte Kameraposition, erneute Gerätebewegung und wiederholte Resets, Berechtigung/Session-/Sensorlistener, AR-Off-Verhalten und korrekte App-Verdrahtung. Bestehende Regressionstests und v50-Version/Cache werden geprüft. Zusätzlich wird das Delta als Overlay über v49 auf Byte-Gleichheit mit dem aktualisierten Projekt verglichen.

---

<a id="release-v49"></a>

## Release v49

# Delta v49 – schmalere Control-Panel-Buttons und Reihen-Beschriftung

## Installation

`Sonnensystem-Delta-v49.zip` **über die vollständige v48** im Projektstamm entpacken und Dateien ersetzen. Aktuelle Version: **49.0.0**, PWA-Cache **sonnensystem-shell-v49**. Das ZIP enthält ausschließlich neue/geänderte Dateien gegenüber v48.

## Control Panel

- Die nur mit einem Icon versehenen Buttons **AR** (optional), **Maßstab** und **Objektlayer** werden bei üblicher Breite von **58 px auf 49 px** reduziert (−9 px bzw. rund **15,5 %**). Höhe und Icongröße bleiben gleich.
- Die **Zeitsteuerung** bleibt bei **58 px Breite**; ihre Dropdown-Funktionen und Datumstexte bleiben unverändert.
- Panelbreite mit drei Buttons: **172 px statt 190 px**; mit AR-Button: **229 px statt 256 px** (jeweils bei 8 px Abstand). Die drei Menüs bleiben am gleichen rechten Viewportrand ausgerichtet und verdecken die Trigger nicht. Auf sehr kleinen Displays gilt die bisherige reduzierte Breite ab 245 px weiterhin.

## Reihenansicht

- **Beschriftungen:** Für den nach realem Radius sortierten Reihenindex werden Labels abwechselnd **oben** (gerade Indizes) und **unten** (ungerade Indizes) positioniert. Dies gilt sowohl für das Sonnensystem als auch für die Planetenansicht und ist unabhängig von der Labelpriorität. Beim Verlassen der Reihe gilt wieder die freie, stabile Beschriftungsposition.
- **Abstände:** Erste Lücke (größtes zum zweitgrößten Objekt) unverändert; die größenabhängigen Lücken ab dem zweiten Objekt sind um **30 %** erweitert. Die Reihe bleibt bei kleinen Objekten verdichtet.
- **Saturnringe:** Für die Kollisionsvermeidung der Körper wird Saturns äußerer sichtbarer Ringradius von **1,20 × Ringskalierung** berücksichtigt. Auch die Label-Freiheit und das Reihen-Kameraframing verwenden den visuellen Außenradius. Der Planet selbst wird dabei **nicht** künstlich vergrößert.
- Reihenfolge, enger Ausschnitt des größten Körpers, Pan/Zoom und vorhandene Wechselanimationen bleiben erhalten.

## Prüfungen

Automatisierte v49-Regressionen sowie die bestehenden Tests. Nach dem Packen wird ein Overlay v48 + Delta v49 auf Byte-Gleichheit mit v49 und Test-Erfolg geprüft.

---

<a id="release-v48"></a>

## Release v48

# Delta v48 – AR-Modus / Bewegungsgeste zum Umsehen

## Installation

`Sonnensystem-Delta-v48.zip` über eine **vollständige v47-Version** im Projektstamm entpacken; vorhandene Dateien ersetzen. Nach dem Aktualisieren der Webseite/PWA ist die Version **48.0.0** aktiv (Cache `sonnensystem-shell-v48`). Das Archiv enthält nur neue oder geänderte Dateien gegenüber v47.

## Steuerung

- **Links im Control Panel:** Neuer SVG-Button mit Fadenkreuz/AR-Symbol. Er wird nur eingeblendet, wenn ein sicheres Browserfenster, eine Geräteausrichtungs-API und ein grobes Touch-Eingabeprofil auf einem mobilen Bildschirm vorhanden sind. Ohne diese Merkmale bleibt das ursprüngliche Control Panel mit drei Menüs erhalten. Startwert **Aus**.
- **Ein:** Tippen aktiviert die sensorbasierte Steuerung. Auf iOS und einigen Browsern wird die Motion-Berechtigung **erst innerhalb des Tipps** angefragt. Nach der ersten gültigen Sensorprobe wird die Blickrichtung kalibriert und der Button aktiv. Anschließend lenkt die reale Gerätebewegung die Blickrichtung in der 3D-Szene (Gier, Nick, Roll). Die Augenposition wird nicht um den selektierten Körper bewegt – man schaut vom aktuellen Standpunkt aus herum.
- **Aus:** Erneut tippen. Sensorlistener werden abgemeldet; letzte Blickrichtung wird in die Standard-Kamera zurückübertragen. Ein-Finger-Pan, Zwei-Finger-Umsehen/Pinch-Zoom und die Desktopsteuerung bleiben weiterhin vorhanden.
- **Fehlerfälle:** Bei verweigerter Berechtigung, fehlenden Sensorwerten oder Verlassen des Vordergrunds erfolgt keine weitere Sensorverarbeitung. Eine Snackbar nennt den aktuellen Status oder Fehler. Es wird **kein Kamerabild** angefordert und werden **keine Sensordaten** verschickt. Der AR-Blickmodus ist daher keine Kamera-Overlay-Augmented-Reality-Funktion.
- **Layout:** Der Zusatzbutton wird ausschließlich bei Unterstützung ganz links eingefügt. Die drei vorhandenen Dropdowns sind unabhängig davon weiterhin rechtsbündig am Bildschirmrand befestigt.

## Prüfung

Automatisierte Regressionen und neue Tests für Sensorverfügbarkeit, Berechtigungen, Kalibrierung, Quaternion-Drehung, Projektion und Ressourcensäuberung. Das ZIP wird als Overlay über der v47-Installation geprüft.

---

<a id="release-v47"></a>

## Release v47

# Delta v47 – Raumsteuerung und verdichtete Objekt-Reihe

## Installation

Archiv **`Sonnensystem-Delta-v47.zip`** über eine vollständige **v46-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Anschließend Webseite/PWA neu laden. Projektversion **47.0.0**, Offline-Cache **`sonnensystem-shell-v47`**. Das ZIP enthält nur neu hinzugekommene/geänderte Dateien, keine vollständige Grundinstallation.

## Navigation (Maus und Touch)

| Eingabe | Neue Wirkung |
| --- | --- |
| **Linke Maustaste ziehen** | Blickpunkt über die horizontale Bahnebene verschieben |
| **Rechte Maustaste ziehen** | Umschauen: Kamerawinkel und Neigung ändern |
| **Shift + links ziehen** | Alternative zum rechten Mausziehen: umschauen |
| **Ein Finger wischen** | Blickpunkt über die Bahnebene verschieben |
| **Zwei Finger gemeinsam wischen** | Umschauen durch Änderung des Kamerawinkels |
| **Zwei Finger auseinander/zusammen** | Stufenlos zoomen; keine unbeabsichtigte Rotation bei symmetrischem Pinch |
| **Mausrad / Pfeiltasten** | Weiterhin Zoomen / bodenparallel bewegen |
| **Linksklick / Antippen** | Weiterhin Objektauswahl ohne unbeabsichtigte Auswahl nach Drag/Gestenwechsel |

Gezieltes Verschieben beendet bei aktivem Folgen weiterhin die Nachführung; Drehung/Zoom nicht. Das Browser-Kontextmenü bleibt über der 3D-Bühne deaktiviert, damit Rechtsziehen zum Umschauen verwendet werden kann.

## Reihenansicht – nah herangezoomt

- **Sortierung:** unverändert absteigend nach hinterlegten tatsächlichen Radien; nur sichtbare Körper nehmen teil. Die Darstellungsradien folgen dem aktiven Objekt-Maßstab (schematisch / physikalisch).
- **Lücken:** nicht mehr konstant. Der freie Abstand ergibt sich aus **14 % der Summe benachbarter Darstellungsradien** (mit sehr kleinem Mindestabstand und Begrenzung nach oben). Große Körper dürfen mehr Abstand haben, kleine Nachbarn werden dicht gereiht. Kein Überlappen der Kugeln.
- **Kamera:** Die größte Kugel beginnt außerhalb des linken Bildausschnitts. Nur ihre letzten ca. **12 % des Durchmessers** reichen in die sichtbare Reihe hinein. Das Blickziel und der Zoom werden so berechnet, dass die folgenden größeren Körper gut erkennbar sind. Das erste Segment (bis zu sechs Folgeobjekte) wird bildfüllend gerahmt; die übrigen Objekte bleiben per Verschieben erreichbar, statt alle winzig auf eine Bildschirmbreite zu quetschen.
- **Ansichten:** Dasselbe Framing funktioniert im Sonnensystem und in der isolierten Planetenansicht sowie bei allen vier Maßstabs-Kombinationen; im Hochformat wird der Distanzwert an das engere Blickfeld angepasst.
- **Übergänge:** Positions- und Größenanimationen sowie Orbitfades/Gummibandeffekt aus v45/v46 bleiben bestehen. Die Kamera fährt weich zum neuen Ausschnitt.

## Prüfung

Automatisierte Eingabe-, Kamera-, Reihen-, Ansicht- und Regressionstests einschließlich symmetrischem Pinch, rein horizontaler Zwei-Finger-Geste, Auswahl nach Tippen, variabler Körperabstände, Foto-/Hochformat, physikalischem Maßstab und Szenenwechsel. Delta-Installation über v46 wird gesondert durch vollständige Datei- und Testprüfung abgesichert.

---

<a id="release-v46"></a>

## Release v46

# Delta v46 – sichtbare Gummiband-Übergänge für Maßstab und Ansichten

## Installation

`Sonnensystem-Delta-v46.zip` **über eine vollständige v45-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Das Archiv enthält ausschließlich gegenüber v45 geänderte oder neue Dateien. Die App bzw. PWA anschließend neu laden. Release **46.0.0**, Service-Worker-Cache **`sonnensystem-shell-v46`**.

## Verhalten

- **Schema ↔ Maßstab:** Positionen und Bahnradien werden stetig interpoliert. Kugelradien und Saturnringe wachsen bzw. schrumpfen weich. Die Zielgeometrie wird nach ungefähr **980 ms** mit leichtem elastischem Überschwingen erreicht.
- **Umlaufbahnen ↔ Reihe:** Die Objekte wandern in bzw. aus der nach Größe sortierten Reihe. Die Bahnlinien verblassen und erscheinen wieder, ohne beim direkten Zurückschalten ihre Helligkeit abrupt zu ändern. Die Orbits bleiben während der Bewegung an der Sonne bzw. am gewählten Zentralplaneten verankert.
- **Sonnensystem ↔ Planetenansicht:** Körper aus der bisherigen Szene bleiben vorübergehend als transparente Darstellung erhalten und verblassen; neue Körper erscheinen nach und nach. Dasselbe gilt für die vorher sichtbaren und neu hinzukommenden Bahnen. Auch die alten Orbitlinien können sich dabei mit der Szene bewegen; ihre historischen Radien werden nicht plötzlich auf den neuen Szenenmaßstab gesetzt.
- **Schneller erneuter Wechsel:** Ausgangspunkt sind die gerade angezeigten Koordinaten, Größen und Deckkräfte. Auch teilweise verblasste Körper und Bahnen werden weiter interpoliert, statt zu blinken oder zu springen.
- **Kamera und Bedienung:** Kameraziel, Abstand und Blickwinkel werden weiter weich nachgeführt. Manuelle Kamerabewegungen haben Vorrang; Objektfokus und Folgen bleiben nutzbar.
- **Barrierefreiheit:** Mit `prefers-reduced-motion: reduce` werden Übergänge weggelassen.

Die Änderung betrifft nur die **Darstellung**; Zeitsteuerung, Orbitalparameter, Katalog, Layer- und Maßstabsschalter sowie die beiden Ansichtsmodi bleiben erhalten. Es werden keine Bahndaten interpoliert oder überschrieben.

## Implementierung

- `src/renderer/renderer.js`: Sichtbarkeits-Snapshots vor Ansichtswechseln, Quell- und Ziel-Szenenüberblendung, Opazitäts-Interruption ohne Sprung, Tiefenpuffer-Schutz für transparente Objekte.
- `src/renderer/shaders.js`: `uOpacity` für Kugeln und Saturnringe.
- `src/renderer/orbits.js`: eigene Quell-Geometrie und Deckkraft für ausblendende Bahnlinien.
- `src/renderer/planet-view.js`, `solar-view.js`: animierte Bahnmittelpunkte.
- `tests/spring-view-transitions-v46.test.mjs`: sieben gezielte Regressionstests für Szenenblenden, unterbrechbare Opazitäten, Orbitzentrierung, Rendering-Fades und reduzierte Bewegung. Zusätzlich bestehen alle bestehenden Projektprüfungen.

## Grenzen der Prüfung

Die Rechenwege und Zeichnungsaufrufe sind durch automatisierte Tests abgedeckt. Ein vollständiger WebGL-Browserstart war in der verfügbaren Headless-Chromium-Umgebung mangels WebGL-Kontext nicht möglich.

---

<a id="release-v45"></a>

## Release v45

# Delta v45 – Reihe und Übergangsanimationen

## Installation

`Sonnensystem-Delta-v45.zip` über eine **vollständige v44-Installation** in denselben Projektstamm entpacken und vorhandene Dateien überschreiben. Dieses Archiv enthält nur neue bzw. geänderte Dateien. Anschließend Seite/PWA neu laden. Version **45.0.0** und Cache **`sonnensystem-shell-v45`**.

## Neuer Schalter „Reihe“

- Unter den beiden Bahndarstellungs-Schaltern **Umlaufbahn** und **Kontrast** sitzt ein neuer Toggle mit **drei von links nach rechts kleiner werdenden SVG-Punkten**; er belegt die Breite der Bahn-Spalte.
- **Standard Aus**, getrennt in der Sonnensystem- und isolierten Planetenansicht. `aria-pressed`, Aktiv-Stil, Tooltip und Snackbar geben den Zustand wieder.
- **An:** Alle durch den Layerfilter und ggf. die 4-Monde-Regel tatsächlich sichtbaren Körper werden horizontal **nach ihren hinterlegten physikalischen Radien absteigend** gereiht. Bei identischem Radius sortiert die ID deterministisch. Unbekannte Radien werden nicht geschätzt und stehen am Ende.
- Zwischen benachbarten Kugeln bleibt freier Raum. Ihre angezeigten Radien richten sich weiterhin nach **Objekt Aus/An**; die Aufreihung verändert weder reale Radien noch Bahnelemente. Auch der Platzbedarf im Hochformat wird beim Kameraframing berücksichtigt.
- Beim Aktivieren werden die Orbitlinien weich ausgeblendet; bei Deaktivierung erscheinen sie zurück, sofern **Umlaufbahn** weiterhin aktiviert ist. Die Option **Kontrast** und die dauerhafte Kategoriepalette bleiben unverändert. Das Sonnenglühen bleibt an der animierten Sonnenposition.

## Übergangsanimationen

Beim Wechsel der **Objekt-/Bahn-Maßstäbe**, der **Reihenansicht** sowie zwischen der **Sonnensystem-** und **Planetenansicht** wird der gerade gerenderte Zustand eingefroren und ca. **980 ms** in die neue Zielgeometrie überführt:

- **Positionen:** Kepler-/Horizons-Zielpositionen bleiben rechnerisch unverändert; die Grafik interpoliert zu den neuen Koordinaten.
- **Körper und Bahnen:** Kugelradien, Saturnring-Skalierung und gezeichnete Bahnradien verwenden denselben Interpolationsfortschritt. Ein leichter Überschwinger (unter 5 %) sorgt für den Gummiband-Effekt und endet exakt am Ziel.
- **Kamera:** Ziel und Distanz werden wie bisher weich nachgeführt; beim Reihen- und Szenenwechsel wird außerdem der Blickwinkel animiert. Objektfokus und globales Folgen bleiben auch während des Animationswegs nutzbar.
- **Schnelles Zurückschalten:** Neue Übergänge beginnen an der gerade dargestellten Zwischenposition und verhindern harte Sprünge. Benutzerbedienung der Kamera hat Vorrang vor einer laufenden Winkelanimation.
- **Barrierefreiheit:** Bei `prefers-reduced-motion: reduce` werden die Gummiband-Übergänge nicht ausgeführt.

Der Reihenmodus betrifft ausschließlich die 3D-Szenengeometrie. Er sortiert weder den Objektkatalog um noch ändert er die Simulation, Zeitsteuerung, gespeicherte Bahndaten oder den physischen Maßstab.

## Qualitätssicherung

- Bestehende Regressionstests und neue v45-Tests für den neuen Button, geometrische Sortierung, Kugelabstände, Hochformat-Framing, Planetenansicht, Zeit-/Ansichtsinterpolation, Orbit-Fades, Unterbrechbarkeit, Fokus/Folgen und reduzierte Bewegung.
- Isolierte Browserprüfung der Menüausrichtung bei Desktop- und Mobilbreiten sowie des Toggle- und Snackbar-Verhaltens.
- Delta-ZIP wird nach der Erstellung über eine unveränderte v44-Kopie installiert und auf byteidentische Wiederherstellung der v45-Arbeitskopie geprüft.

---

<a id="release-v44"></a>

## Release v44

# Delta v44 – Optimierte Größenverhältnisse

## Installation

Dieses Overlay-Delta baut auf einer **vollständigen v43-Installation** auf. `Sonnensystem-Delta-v44.zip` direkt in den Projektstamm entpacken, vorhandene Dateien überschreiben und die PWA beziehungsweise den Browser neu laden. Es werden nur neue/geänderte Dateien ausgeliefert.

## Neues Verhalten bei Objekt an / Bahn aus

Bei **maßstabsgetreuen Objektgrößen** und **schematischen Bahnen** verwendet die Sonnensystem-Ansicht den Modus **„Optimierte Größenverhältnisse“**:

1. **Sonne:** Radius genau `4 × renderRadius(sun)` = **4,52 Szeneneinheiten**, gegenüber 1,13 im Standard-Schema. Die Größe ist der Radius, nicht der Durchmesser.
2. **Planeten:** ihre Radien folgen demselben linearen Größenfaktor wie die Sonne: `radiusKm / 696340 × 4,52`. Dadurch bleiben die korrekten Größenverhältnisse aller Planeten untereinander und zur Sonne erhalten; für Objekte ohne bekannte physikalische Radien bleibt die Kugelgröße null.
3. **Bahnabstände:** jeder bislang schematisch berechnete Bahn-Halbachsenradius wird mit **4** multipliziert, ohne die Orbitalelemente oder ihre relativen Entfernungsverhältnisse zu verändern. Die vergrößerte Sonne überlappt damit die Merkurbahn nicht. Auch die Kepler-Positionen sowie gegebenenfalls eingespielte Horizons-Vektoren und Orbitlinien nutzen dieselbe Regel.
4. **Übersichtskamera:** Start-/Reset-Abstand 188 statt 47 Einheiten, maximaler Abstand 400 statt 100. Beim Wechsel in/aus dem Modus wird die Kamera automatisch neu gerahmt, sofern sie nicht manuell bewegt wurde. Manuelle Kameraführung, Objektfokus und Tracking bleiben erhalten.
5. **Bedienung:** Es gibt **keinen zusätzlichen Schalter**. Die bisherige Kombination der beiden Toggles aktiviert den Modus automatisch. Der Tooltip nennt „Optimierte Größenverhältnisse“; die Status-Snackbar zeigt den Modus beim Einschalten an.

## Bewusst unverändert

- **Objekt aus / Bahn aus:** bisherige schematische Größen und Bahnabstände, weiterhin beim Start aktiv.
- **Objekt aus / Bahn an:** schematische Objektgrößen mit physikalischen Bahnradien.
- **Objekt an / Bahn an:** physikalische Größen und Bahnabstände in derselben Maßeinheit; die astronomischen Größen-/Abstandsverhältnisse bleiben unverändert.
- **Isolierte Planetenansicht:** planetenzentrierte Radien und Orbitabstände sind weiterhin unabhängig von der speziellen solarzentrischen Optimierung; hier bleibt die bestehende lokale Kombination aus echten Körperradien und schematischen Mondbahnen bestehen.
- Layer, Beleuchtung, Farbpalette, Dropdown-Anordnung und alle sieben Toggle-Buttons.

## Mathematische Grundlage

Das Sonnenradius-Referenzmaß von **696340 km** ist aus `data/catalog/stars.json` übernommen. `OPTIMIZED_ORBIT_FACTOR = 4` multipliziert die vorhandene, nichtlineare **schematische** Distanzfunktion – dies ist keine Umstellung auf physikalisch korrekte Abstände. Insbesondere sind Größen und Bahnen in der optimierten Variante **bewusst nicht** mit demselben realen Kilometermaßstab gekoppelt. Das ist erst im Modus Objekt an / Bahn an der Fall. Die grafische Optimierung verbessert weder Bahnparameter noch Genauigkeit oder Aktualität der Daten.

## Qualitätssicherung

Die Tests überprüfen alle vier Toggle-Kombinationen, die tatsächlichen Größenverhältnisse, die vierfach erweiterten Umlaufbahnen, den freien Raum an der Merkurbahn, simulierte und externe Positionen, die unveränderte Planetenansicht sowie den automatischen Kamerawechsel und die Statusmeldungen. Die Installation wird durch Überlagern einer frischen v43-Kopie geprüft.

Version **44.0.0**, Service-Worker-Cache `sonnensystem-shell-v44`.

---

<a id="release-v43"></a>

## Release v43

# Delta v43 – Kompaktes Maßstab-Menü und Status-Snackbars

## Installation

Dies ist ein **Overlay-Delta für eine vollständige v42-Installation**. Den Inhalt von `Sonnensystem-Delta-v43.zip` direkt ins Stammverzeichnis der bestehenden App entpacken und gleichnamige Dateien ersetzen. Danach neu laden bzw. die installierte PWA aktualisieren. Das Archiv enthält nur neue/geänderte Dateien; unveränderte Daten, Texturen, Servermodule und Icons bleiben aus v42 erhalten.

## Änderungen

1. **Maßstab-Popover platzsparender:** Die Überschrift „Maßstab“ sowie `p.scale-popover-note` wurden vollständig entfernt. Die Status-Anzeigen „An/Aus“ innerhalb der ursprünglich acht Toggles wurden entfernt. Der Klickzustand bleibt über aktives Styling, aktualisierte Tooltips und `aria-pressed` erkennbar.
2. **Kompakte Zweispalten-Gruppierung:** Unter „Objekt“ stehen **Beschriftung** und **Beleuchtung** nebeneinander, **4 Monde** folgt als breite Zeile. Unter „Bahn“ stehen **Umlaufbahn** und **Kontrast** nebeneinander. Große Symbol-Buttons: 68 px Höhe für die Maßstabs-Toggles, 44 px für die Zusatz-Toggles. Das Maßstab-Popover ist 192 px breit und an derselben rechten Viewport-Kante wie die anderen beiden Dropdowns ausgerichtet.
3. **Farben immer an:** Der bisherige Farben-Schalter entfällt. `createViewSettings()` verwaltet kein `orbitColors` mehr. `orbitAppearance()` verwendet unabhängig von alten Einstellungen immer die Kategoriepalette (`CATEGORY_COLORS`), für die Erdumlaufbahn weiterhin `EARTH_ORBIT_COLOR`. `orbitContrast` verändert nur Linienstärke und Deckkraft.
4. **Status-Snackbars unten rechts:** Die sieben verbliebenen Buttons melden jede nutzerinitiierte Änderung mit Bezeichnung und aktuellem Zustand (Maßstab: schematisch/maßstabsgetreu; Beleuchtung: Optimiert/Realistisch). Eine dedizierte Live-Region zeigt die aktuelle Snackbar für rund 2,4 s; rasche Folgeaktionen ersetzen die vorherige Meldung und starten die Zeit neu. Der bereits vorhandene API-Toast bleibt unverändert.
5. **Release:** Versionskennung `V43.0`, Paketversion `43.0.0`, Service-Worker-Cache `sonnensystem-shell-v43`.

## Unverändert

- Die Start- und Umschaltwerte der beiden Szenen: Beleuchtung im Sonnensystem aus, in der Planetenansicht an; die übrigen Toggle-Defaults werden beibehalten.
- Der direkte Wechsel zwischen den drei Popovers und ihre gemeinsame Rechtsausrichtung.
- Die gemeinsame Objekt- und Bahn-Skalierung über beide Szenen sowie die bisherige Kamera-/Zoomlogik.
- Die für Monde hinterlegte Kategorie-Farbe `#E6EDF5`.

## Qualitätssicherung

Die bestehenden Regressionstests wurden an die entfernten Anzeigeelemente und die neue Version angepasst. Neue v43-Tests sichern sieben sichtbare Toggles, Grid-Gruppierung, dauerhaft farbige Orbitlinien, Bedienrückmeldungen, Snackbar-Timer und ARIA-Zustände ab.

---

<a id="release-v42"></a>

## Release v42

# Delta v42 – maßstabsbezogene Darstellungsoptionen

## Änderungen gegenüber v41

1. **Control Panel:** Die drei 58×54-px-Auslöser stehen oben rechts in der Reihenfolge **Maßstab → Objektlayer → Zeitsteuerung** (8 px Abstand). Alle drei Dropdowns liegen wie zuvor mit ihrer rechten Kante direkt am rechten Viewportrand, ohne die Buttonreihe zu verdecken. Die Breiten bleiben 186/145/120 px.
2. **Maßstab-Dropdown:** Zwei Spalten. Links steht der große Toggle **Objekt** über drei eigenständigen Schaltern für **Beschriftung** (SVG: Tab-Label), **Beleuchtung** (SVG: Taschenlampe) und **4 Monde** (SVG: vier Punkte). Rechts steht der große Toggle **Bahn** über **Umlaufbahn** (SVG: konzentrische Kreise), **Kontrast** (SVG: schwarz-weißer Kreis) und **Farben** (SVG: Farbpalette). Die sechs Zusatzschalter sind aus dem Layer-Dropdown entfernt. Jede Taste behält ihre ID und Funktion, den aktiven An/Aus-Zustand, `aria-pressed`, Tooltip und einen zugänglichen Namen.
3. **Beleuchtungs-Standard:** Sonnensystemansicht weiterhin **Aus / Optimiert**; Planetenansicht nun **An / Realistisch**. Beide Ansichten behalten ihre voneinander unabhängigen Beleuchtungszustände, auch beim Umschalten. Andere Defaults bleiben unverändert (Objekt-/Bahn-Maßstab beide Aus; 4 Monde im Sonnensystem An, in der Planetenansicht Aus).
4. **Mond-Kategoriefarbe:** `#E6EDF5`. Der Wert war bereits im v41-Quellcode unter `CATEGORY_COLORS.moon` hinterlegt und wird weiterhin konsistent in Kategorieindikatoren und orbitbezogener Färbung verwendet; keine Material-/Texturfarben wurden geändert.
5. **Versionierung:** Anwendung `42.0.0`, PWA-Shell-Cache `sonnensystem-shell-v42`.

## Dateien und Test

Geändert: `index.html`, `css/styles.css`, `src/app.js`, `src/data/layers.js`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md` sowie ältere Tests mit versionsbezogenen oder veralteten DOM-Annahmen. Neu: `docs/DELTA-V42.md`, `tests/control-panel-v42.test.mjs`.

**187/187** automatisierte Tests bestanden. Browser-Layoutkontrolle mit Chromium bei **1280×800, 375×812, 320×480 und 245×640**: Die drei Popovers sind rechtsbündig, liegen unter den Triggern und die horizontale Reihenfolge bleibt erhalten.

## Installation

Das Archiv **Sonnensystem-Delta-v42.zip** über eine **vollständige v41-Installation** entpacken und die geänderten Dateien überschreiben. Danach App/PWA neu laden; der neue PWA-Cache ersetzt den vorherigen.

---

<a id="release-v41"></a>

## Release v41

# Delta v41 – Control-Panel „Maßstab“

## Änderungen gegenüber v40

- Das obere, rahmenlose Control-Panel enthält jetzt **drei horizontale Buttons**: **Objektlayer**, **Maßstab** und **Zeitsteuerung**. Alle drei bleiben 58 px breit und 54 px hoch, mit je 8 px Abstand; die Leiste ist 190 px breit.
- Der neue **Maßstab-Button** verwendet ein SVG mit waagerechtem Doppelpfeil und zwei seitlichen Begrenzungsstrichen. Sein 186 px breites Dropdown öffnet wie die beiden bestehenden Menüs unterhalb der Buttonzeile und **rechts bündig zur Viewportkante**. Die vorhandenen Dropdownbreiten von Layer (145 px) und Zeit (120 px) bleiben unverändert.
- Im Dropdown stehen zwei **unabhängige Toggle-Buttons nebeneinander**: **„Objekt“** mit großem vertikalem Doppelpfeil und **„Bahn“** mit großem horizontalem Doppelpfeil; jeweils mit kleinem Label und An/Aus-Indikator.
- **Aus (Standard)**: Die bisherige schematische Darstellung. **An**: die jeweilige Dimension ist nach den vorhandenen Katalogdaten **physikalisch proportional**. Der Objekt-Toggle beeinflusst nur die Körperradien, der Bahn-Toggle nur die Abstände. Beide können gleichzeitig aktiviert werden.
- Bei aktivem Objekt-Maßstab berechnet der Renderer die Kugelgrößen aus `radiusKm`; bei aktivem Bahn-Maßstab wird die große Halbachse aus `a` ohne bisherige logarithmische/Wurzelkompression dargestellt. Sonnensystem: 1 AE = 3,4 Szeneneinheiten. Planetenansicht: Radius des Zentralkörpers = 1,28 Szeneneinheiten. Bei **beiden Schaltern auf An** teilen sich Größen und Abstände dieselbe physikalische Einheit innerhalb der Szene.
- Kugeln, Saturnringe, Trefferradien, Labels, Ortsberechnung und Bahnraster verwenden die passenden Skalierungswerte. In der Planetenansicht erweitert sich bei echten Abständen der mögliche Kamerabereich und die Clip-Distanz. Bei echten Objektgrößen ermöglichen engerer Nahzoom, angepasste Kamerafokussierung und eine dynamische Near-Clipping-Ebene das Betrachten kleiner Körper. Der Wechsel der Bahnskalierung passt eine noch nicht manuell geänderte Übersichtsansicht an.
- Die beiden Maßstabsschalter gelten für **beide Ansichtsarten gemeinsam**, während die übrigen Layer-/Bahndarstellungsoptionen szenenspezifisch bleiben. Menüwechsel mit nur einem Klick, Klick außerhalb und `Escape` unterstützen nun alle drei Menüs.
- Version **41.0.0**, PWA-Cache `sonnensystem-shell-v41`.

## Wissenschaftliche und praktische Grenzen

Das Umschalten ändert ausschließlich die **geometrische Skalierung**, nicht die Genauigkeit der zugrundeliegenden Ephemeriden oder die Herkunft der Bahndaten. Bei echten Größen sind viele Planeten, Monde und Satelliten im Überblick extrem klein oder nicht sichtbar; Labels bleiben zur Orientierung erhalten. Für unbekannte Radien (`radiusKm: 0`) wird **keine Größe erfunden**. Die reale Distanzskalierung kann in Planetensystemen eine deutlich größere Zoomstufe erfordern.

## Dateien

Geändert: `index.html`, `css/styles.css`, `src/app.js`, `src/data/layers.js`, `src/data/orbital-math.js`, `src/renderer/{camera.js,controls.js,index.js,labels.js,orbits.js,planet-view.js,renderer.js,scene.js}`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`. Neu: `docs/DELTA-V41.md`, `tests/scale-v41.test.mjs`. Die bisherigen Tests mit festen v40-Versions- oder DOM-Annahmen wurden aktualisiert.

## Prüfung

**182/182** automatisierte Tests bestanden, einschließlich v41-Skalierung, UI und Nahzoom.

## Installation

**Sonnensystem-Delta-v41.zip** in das Verzeichnis einer vollständigen **v40-Installation** entpacken und die Dateien überschreiben; anschließend die Anwendung/PWA neu laden. Das Archiv enthält nur neue und geänderte Dateien, nicht das komplette Projekt.

---

<a id="release-v40"></a>

## Release v40

# Delta v40 – horizontales Control-Panel

## Änderungen gegenüber v39

- Die zwei Auslöser **Objektlayer** und **Zeitsteuerung** stehen oben rechts **horizontal nebeneinander**, beide 58 px breit und 54 px hoch, mit 8 px Abstand. Das schwebende Control-Panel bleibt ohne Rahmen und Hintergrund (Gesamtbreite 124 px).
- Beide Dropdown-Panels öffnen **unterhalb der gesamten Buttonreihe**. Ihre **rechten Kanten liegen exakt an der rechten Viewport-/Bildschirmkante**: Das Layer-Menü bleibt 145 px breit, das Zeit-Menü 120 px. So bleibt ein möglichst großer Bereich der 3D-Ansicht frei.
- Beim Klick auf den anderen Auslöser wird das derzeit geöffnete Dropdown automatisch geschlossen und das andere direkt geöffnet – **kein voriges Schließen erforderlich**. Die bereits vorhandene Ein-Menü-Logik in `src/app.js` bleibt dafür unverändert; durch die horizontale Anordnung verdeckt kein Dropdown mehr den jeweils anderen Auslöser.
- Desktop und Mobil verwenden dieselbe Zeile. Berücksichtigt werden Safe-Area-Abstände der Auslöser, begrenzte Menühöhen und scrollbar bleibende Panelinhalte. Klick außerhalb, `Escape`, Slider-, Layer- und Szenenfunktionen bleiben bestehen.
- Versionswechsel auf **40.0.0** und PWA-Cache `sonnensystem-shell-v40`.

## Geänderte Dateien

- `css/styles.css` – horizontale Trigger und gemeinsame rechte Popover-Kante
- `index.html`, `package.json`, `sw.js` – Version und Cache
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V40.md` – Dokumentation
- `tests/control-panel-v40.test.mjs` – Regressionen für Layout und Menüwechsel
- bestehende Tests mit v39-Versionsannahmen – erwartete Versions-/Cache-Kennungen auf v40 angehoben

## Prüfung

`npm run check`: Katalogvalidierung und **174/174 Node-Tests bestanden**. Die Layoutpositionierung wurde zusätzlich rechnerisch für beide Dropdown-Anker geprüft; eine vollständige visuelle Chromium-Prüfung war in der Ausführungsumgebung nicht möglich.

## Installation

Das **Delta-v40-ZIP** über eine vollständige v39-Installation entpacken, vorhandene Dateien ersetzen und die Anwendung neu laden. Das ZIP enthält ausschließlich neu angelegte oder geänderte Dateien, nicht das vollständige Projekt.

---

<a id="release-v39"></a>

## Release v39

# Delta v39 – Folgen öffnet das übergeordnete Planetensystem

## Änderungen gegenüber v38

- Beim **Einschalten** von **Folgen** für ein Objekt mit direktem Parent vom Typ `planet` oder `dwarf` wird automatisch dessen isolierte Planetenansicht geöffnet (z. B. Mond → Erde, Charon → Pluto, ISS → Erde).
- Die **Auswahl bleibt beim Kindobjekt**; die Kamera verfolgt dieses Kind und nicht den übergeordneten Planeten.
- Ist bereits die Planetenansicht des richtigen Parents geöffnet, erfolgt kein redundanter Szenenwechsel.
- Der Szenenwechsel erfolgt nur beim **Einschalten** von Folgen. Ein erneuter Klick schaltet den globalen Toggle aus und belässt die aktuelle Szene.
- Bei Objekten ohne direkten (Zwerg-)Planeten als Parent wird Folgen wie bisher aktiviert, ohne eine Planetenansicht zu öffnen.
- Beim Szenenwechsel werden Kontrollpanel, Layer und Zeitsteuerung über `updateMode()` mit der Planetenansicht synchronisiert. Bestehende Abbruchregeln für aktives Folgen (Kameraschwenk und zu schnelle Bewegung), Zoom, Perspektivwechsel sowie der globale Toggle bleiben erhalten.
- Versionswechsel auf **39.0.0** und PWA-Cache `sonnensystem-shell-v39`.

## Installation

Das Delta über eine bestehende v38-Installation entpacken, vorhandene Dateien ersetzen und die Anwendung neu laden.

---

<a id="release-v38"></a>

## Release v38

# Delta v38 – kompakter Planetenansicht-Button und globales Folgen

## Änderungen gegenüber v37

- **Planetenansicht öffnen → Planetenansicht:** Die Beschriftung ist einzeilig; die bisherige Aufzählung von Monden und künstlichen Satelliten im Button wurde entfernt. Die Funktion für Planeten, Zwergplaneten und Monde bleibt erhalten; ein bereits aktives Planetensystem lässt sich weiterhin neu zentrieren.
- **Zentrieren → Folgen:** Fadenkreuz-Icon unverändert. Der Button ist ein globaler Toggle mit `aria-pressed` und aktiver Markierung, statt mit der gerade verfolgten Objekt-ID verknüpft zu sein.
- Ist Folgen eingeschaltet, wird die Kamera auf jedes neu selektierte, positionierbare Objekt ausgerichtet. Der globale Zustand bleibt beim Objektwechsel und beim Wechsel der Szene bestehen; die Geschwindigkeitsmessung wird dabei neu begonnen, sodass ein Zielwechsel nicht fälschlich als sehr schnelle Bewegung zählt.
- Drehbewegungen, manuelle Perspektivenwechsel, Reset-Perspektiven und Zoom mit Mausrad oder Pinch deaktivieren das Folgen nicht mehr. Bei Pinch ignoriert die Steuerung unabsichtliche Mittelpunktverschiebungen; bewusstes Zwei-Finger-Schwenken bleibt möglich.
- Bewusstes Verschieben der Kamera (Rechtsziehen, Shift+Ziehen, Pfeiltasten, Zwei-Finger-Pan) und die bestehende Grenze für zu schnelle Bewegung (> eine projizierte Bildschirmhöhe je Realzeitsekunde) schalten Folgen aus.
- Bei Auswahl einer Raumsonde ohne Ephemeride oder beim Aufheben der Auswahl wird das Ziel pausiert, ohne den globalen Toggle auszuschalten. Die nächste positionierbare Auswahl wird automatisch verfolgt.
- Die bisherige mobile Fokusprojektion oberhalb des halb geöffneten Sheets bleibt während des Folgens erhalten; das gilt auch nach Zoom und Drehung.
- Versionswechsel auf **38.0.0**; PWA-Cache `sonnensystem-shell-v38`.

## Tests

- Fortgeführte Regressionstests sowie neue Tests für globale Auswahl-/Szenenwechsel, Zoom, Drehung, Pinch, bewusstes Schwenken, Geschwindigkeitsabbruch und die reduzierten Objektdetails.
- Kompatibel mit einer bestehenden v37-Installation.

## Installation

Delta v38 über die v37-Installation entpacken und bestehende Dateien ersetzen. Die Anwendung neu laden, damit der neue PWA-Cache aktiviert wird.

---

<a id="release-v37"></a>

## Release v37

# Delta v37 – kompakte Dropdowns und Objekt-Nachführung

## Änderungen

- Layer-Dropdown von **166 px auf 145 px** verkleinert.
- Zeitsteuerungs-Dropdown von **160 px auf 120 px** verkleinert; der 182-px-Regler und die seitlichen Min-/Max-Werte bleiben erhalten, Labels können umbrechen.
- Neuer **Zentrieren**-Button in den Objektdetails direkt neben **Planetenansicht öffnen** (für andere darstellbare Objekte als alleinige Aktion).
- Aktiviert einen automatischen Kamera-Fokus auf das ausgewählte Objekt und aktualisiert die Kamera-Zielposition während dessen Bewegung (Sonnensystem und isolierte Planetenansicht).
- Beendet die Nachführung bei manueller Kamerabewegung (Drehen, Schwenken, Zoom, Tastatur), Wechsel des ausgewählten Objekts, Szenen-/Presetwechsel, erneutem Klick oder Bewegung von mehr als einer projizierten Bildschirmhöhe pro Realzeitsekunde.
- Die Nachführung nutzt weiterhin die geglättete Kamera und die mobile Zentrierung über dem halb geöffneten Bottom-Sheet. Bloße Auswahl bleibt einmaliger Fokus ohne Tracking.
- Für Raumsonden ohne berechnete Position gibt es keine Nachführung; es werden keine Positionen erfunden.
- PWA-Cache `sonnensystem-shell-v37`, Paketversion 37.0.0.

## Installation

Delta v37 über bestehende v36-Installation entpacken und Dateien ersetzen. PWA neu laden, damit der neue Cache aktiviert wird.

---

<a id="release-v36"></a>

## Release v36

# Delta v36 – Zeitsteuerung: Reglerlänge und seitliche Endwerte

## Änderungen

- Vertikaler Geschwindigkeitsregler in der Zeitsteuerung: **132 auf 182 px** (+50 px) verlängert, die zugehörige Schiene von **150 auf 200 px**.
- **Min-/Max-Beschriftung rechts neben dem Regler**: Max oben und Min unten, mit den Regler-Enden vertikal ausgerichtet. Die beiden Beschriftungen stehen nicht mehr ober- bzw. unterhalb des Sliders.
- Das Zeit-Dropdown wurde dafür von **116 auf 160 px** verbreitert; der 58-px-Auslöser bleibt unverändert.
- Auf niedrigen Bildschirmen (Höhe bis 690 px) ebenfalls um 50 px verlängert: Schiene 116 → 166 px, Regler 98 → 148 px. Das Popover bleibt bei Platzmangel scrollbar.
- Keine Änderung an Range, Geschwindigkeitsskala, Standardwert, Play/Pause, Datum, Desktop-/Mobile-Sheet oder Layer-Dropdown.
- Versionsnummer v36, Offline-Cache `sonnensystem-shell-v36`.

## Installation

**Delta v36** über eine bestehende **v35**-Installation entpacken und Dateien ersetzen. PWA neu laden, damit die neue Cache-Version aktiviert wird.

---

<a id="release-v35"></a>

## Release v35

# Delta v35 – Sichtbare Höhe des eingeklappten Mobile-Sheets

## Änderung

- **Geschlossenes Mobile-Sheet:** `--sheet-visible` von **52 px** auf **45 px** reduziert.
- **Kopfzeile:** die Tab-Leiste ist 44 px hoch; mit dem 1 px unteren Rahmen beträgt die gemessene Sheet-Höhe **45 px**. Beim Laden und bei erneutem Einklappen verwendet die Sheet-Steuerung diesen Messwert.
- **Kamera-Schaltfläche:** erhält dieselbe neue `--sheet-visible`-Höhe und bleibt unverändert 12 px (mindestens) über dem Sheet.
- **Unverändert:** halb und voll geöffnetes Sheet, Drag-/Wischgesten, Verlauf-Zurück, Desktop.
- CSS-Fallbacks für Sheet und Kamera-Schaltfläche angepasst. PWA-Cache zu `sonnensystem-shell-v35` erhöht.

## Prüfung

`npm run check` und Delta-Overlay über v34.

## Installation

**Delta v35** über eine vorhandene **v34**-Installation entpacken und gleichnamige Dateien ersetzen. Seite/PWA neu laden, damit der neue Cache aktiv wird.

---

<a id="release-v34"></a>

## Release v34

# Delta v34 – Beleuchtung als An/Aus-Schalter

## Änderung

Im Control-Panel / Layer-Dropdown zeigt der Toggle **Beleuchtung** nur noch **Aus** oder **An**:

- **Aus (Standard):** optimierter Beleuchtungsmodus; hellere unbeleuchtete Planetenseite.
- **An:** realistische Beleuchtung wie in v28.

`aria-pressed` und die aktive Schalterdarstellung folgen dem Zustand **An = Realistisch**. Titel und barrierefreier Name sind darauf abgestimmt. Die Standard-Beleuchtung bleibt intern `optimized` und wird weiterhin getrennt für Sonnensystem- und Planetenansicht verwaltet. Keine Änderung an Shader, Lichtberechnung oder den anderen Toggles.

## Geänderte Dateien

`src/app.js`, `index.html`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/DELTA-V34.md` und Regressionstests.

## Installation

**Delta v34** über eine vorhandene **v33**-Installation entpacken und die gleichnamigen Dateien ersetzen. Danach die Seite / PWA neu laden, damit `sonnensystem-shell-v34` aktiv wird.

---

<a id="release-v33"></a>

## Release v33

# Delta v33 – Mobiles Sheet über Browser-/Android-Zurück schließen

## Änderung gegenüber v32

- Beim Übergang **geschlossen → halb/voll** des mobilen Sheets legt die App mit `history.pushState` genau einen temporären Verlaufseintrag für das Sheet an. Die URL ändert sich dabei nicht; ein vorhandenes Objekt in `history.state` wird erhalten.
- **Browser-Zurück, Android-System-Zurück und PWA-Zurück** erreichen den `popstate`-Listener, der das Sheet aus **halb** oder **voll** direkt auf **geschlossen** setzt. Die Seite bleibt offen.
- Wechsel zwischen **Objekte/Details**, **halb/voll**, Drehung oder Größenänderung des Displays erzeugen keine weiteren Einträge.
- Schließen per Header, Wischen, Scrim, Escape, Kamera-Reset oder Ansichtswechsel ruft `history.back()` auf, um den temporären Eintrag zu verbrauchen. Wiederholtes Öffnen/Schließen stapelt keine zusätzlichen Einträge. Wird während eines noch ausstehenden Zurück-Vorgangs erneut geöffnet, wartet die neue Verlaufseintragung auf dessen Abschluss.
- **Vorwärts** zu einem noch vorhandenen Sheet-Eintrag stellt das mobile Sheet wieder halb geöffnet her. Ein Wechsel zur Desktopansicht entfernt einen offenen temporären Eintrag.
- Falls die History API im jeweiligen Kontext nicht verfügbar ist, bleiben die vorhandenen Bedienelemente des Sheets funktionsfähig.
- **Version/PWA:** Anwendung `33.0.0`, Cache `sonnensystem-shell-v33`. Keine Datenmigration.

## Installation

Delta v33 über einer **vollständigen Installation von v32** entpacken und bestehende Dateien ersetzen. Das ZIP ist keine Vollversion. Danach neu laden (bei installierter PWA auf Übernahme des neuen Service Workers achten).

## Prüfung

`npm run check` validiert den Katalog und führt die Regressionstests einschließlich der neuen History-Tests aus. Browserprüfung für mobiles Sheet: Zurück aus halb und voll, Vorwärts, manuelles Schließen, erneutes Öffnen sowie Desktopwechsel.

---

<a id="release-v32"></a>

## Release v32

# Delta v32 – Kategoriepunkte im Objektkatalog

## Änderungen gegenüber v31

- **Kategoriepunkt vor dem Objektnamen:** Jeder Listeneintrag besitzt direkt vor dem Namen einen **7 px großen, vertikal zentrierten Punkt**, dessen Farbe aus `CATEGORY_COLORS` für die Objektkategorie stammt. Der Punkt ist rein dekorativ (`aria-hidden`).
- **Objektsymbol:** Die 28 px große Kugel links verwendet die individuelle `body.color`-Eigenschaft statt der Kategoriefarbe. Für fehlende oder ungültige Farbangaben wird neutrales `#9ba9bc` genutzt. Der bestehende Shader-/Verlaufseffekt bleibt erhalten.
- **Anordnung:** Der neue Punkt bleibt auch bei abgeschnittenen langen Objektnamen sichtbar. Das Layout gilt in der Desktop-Seitenleiste und im mobilen Sheet.
- **Version/PWA:** Anwendung `32.0.0`, Cache `sonnensystem-shell-v32`. Keine Datenmigration.

## Installation

Delta v32 über einer **vollständigen Installation von v31** entpacken und bestehende Dateien ersetzen. Das ZIP ist keine Vollversion. Danach neu laden (bei installierter PWA auf die Übernahme des neuen Service Workers achten).

## Prüfung

`npm run check` validiert den Katalog und führt die Regressionstests aus. Zusätzliche v32-Tests überprüfen die Farben und die HTML-Struktur der Katalogeinträge und den neutralen Fallback. Die Darstellung wird auf Desktop und Mobil geprüft.

---

<a id="release-v31"></a>

## Release v31

# Delta v31 – Layer-Dropdown und mobiler Objektfokus

## Änderungen gegenüber v30

- **Layer-Popover:** Die feste Breite des Dropdowns im Control-Panel wurde von **188 px auf 166 px** reduziert. Dies gilt für Desktop und Mobilgeräte; die bestehende maximale Höhe und Scrollbarkeit bleiben erhalten.
- **Objektfokus auf Mobilgeräten:** Bei Auswahl eines Objekts aus dem Katalog öffnet sich wie bisher der Detail-Tab im halb geöffneten Bottom-Sheet. Die Kamera richtet den selektierten Himmelskörper nun auf die **Mitte der sichtbaren Szene oberhalb der Sheet-Oberkante** aus, nicht auf die verdeckte Mitte der gesamten Canvas.
- **Dynamische Geometrie:** Die tatsächlichen Bounding-Rects von Canvas und Sheet werden bei der Darstellung berücksichtigt. Der Zielmittelpunkt bleibt damit auch während des Sheet-Einrastens, beim Ziehen sowie bei einer Änderung der Bildschirmgröße passend zur freien Fläche.
- **Begrenzter Eingriff:** Die Szene nutzt eine vertikal verschobene Perspektivprojektion (off-axis). Die ursprüngliche Fokus-Zoomstufe und 3D-Position ändern sich nicht. Auf Desktop, bei geschlossenem Sheet, nach manueller Kamerabewegung sowie beim Kamera-Reset ist die reguläre Kameramitte aktiv. Ausgewählte Körper, Bahnen, Beschriftungen und Objekt-Picking nutzen dieselbe Projektionsmatrix.
- **Version/PWA:** Anwendung `31.0.0`, Cache `sonnensystem-shell-v31`. Keine Datenmigration.

## Installation

Delta v31 über einer **vollständigen Installation von v30** entpacken und die vorhandenen Dateien ersetzen. Dieses ZIP enthält nur neue oder geänderte Dateien gegenüber v30 und ist keine Vollversion. Danach neu laden (bei installierter PWA auf Übernahme des neuen Service Workers achten).

## Prüfung

`npm run check` validiert den Katalog und führt Regressionstests aus. Tests für v31 prüfen unter anderem die exakt reduzierte Dropdown-Breite, die mittige Projektion auf verschiedene sichtbare Bereiche und das Zurücksetzen des Fokus bei manuellen Kamerabewegungen.

---

<a id="release-v30"></a>

## Release v30

# Delta v30 – Objektdetails und mobiler Kamera-Button

## Änderungen gegenüber v29

- **„Objekt hinzufügen“ entfernt:** Der Footer mit JPL-SBDB-Suchfeld, Submit-Button und Erklärung unter der Objektliste entfällt in der Desktop-Seitenleiste und im mobilen Bottom-Sheet. Es gibt keine Submit-Listener mehr für die entfernten DOM-Elemente. Die normale Suchleiste, Objektliste und Objektdetails bleiben unverändert. Vorhandene Asteroiden beziehen beim Auswählen weiterhin bei Bedarf aktualisierte NASA/JPL-SBDB-Daten; die zugehörige API bleibt erhalten.
- **Kamera zurücksetzen auf Mobilgeräten:** `.viewport-actions` übernimmt jetzt mit `--sheet-visible` die tatsächlich angezeigte Höhe des mobilen Sheets. Der Button bleibt mit mindestens 12 px Abstand oberhalb der Sheet-Oberkante – insbesondere im halb geöffneten Zustand. Während einer Ziehbewegung werden beide Höhen synchron nachgeführt. Beim Wechsel zwischen geschlossen und halb geöffnet folgen die Positionen derselben Animation; reduzierte Bewegung wird respektiert.
- **Voll geöffnetes Sheet:** Die Kameraaktion verschwindet mit der Szene hinter bzw. oberhalb des vollständig geöffneten Sheets und wird aus der Tastaturnavigation genommen. Bei geschlossenem Sheet und auf dem Desktop ist sie normal bedienbar.
- **Version/PWA:** Anwendung `30.0.0`, Cache `sonnensystem-shell-v30`. Keine Datenmigration erforderlich.

## Installation

Delta v30 auf die **vollständige Installation v29** entpacken und alle bestehenden Dateien überschreiben. Das ZIP enthält ausschließlich seit v29 neue oder geänderte Dateien; es ist keine eigenständige Vollversion. Danach die Browserseite bzw. installierte PWA neu laden, damit der neue Service Worker übernommen wird.

## Prüfung

`npm run check` führt Katalogvalidierung und alle Regressionstests aus, einschließlich neuer Tests zum entfernten Formular und zum synchronen Kameraabstand beim Ziehen und Einrasten.

---

<a id="release-v29"></a>

## Release v29

# Delta v29 – Beleuchtung und vier größte Monde

## Änderungen gegenüber v28

- **Control-Panel:** Im Objektlayer-Dropdown stehen unter **Beschriftung** zwei neue Toggle-Buttons. **Beleuchtung** wechselt zwischen **Optimiert** und **Realistisch**, **4 Monde** zwischen **An** und **Aus**. Status und `aria-pressed` synchronisieren bei jedem Wechsel der Szene.
- **Beleuchtung:** Der Fragment-Shader verwendet in der Einstellung **Realistisch** unverändert die bisherige Beleuchtungsrechnung (`.13 + .89 * diffuse`, auf `.08 ... 1.0` begrenzt). **Optimiert** erhöht die Umgebungshelligkeit der dunklen Planetenseite auf mindestens 50 %, ohne das beleuchtete Maximum zu erhöhen. Die Sonne bleibt selbstleuchtend; lokale Texturen und prozedurale Oberflächen verwenden denselben Beleuchtungsmodus.
- **Voreinstellungen:** Beide Ansichten starten mit **Beleuchtung = Optimiert**. Der Schalter **4 Monde** steht in der Sonnensystemübersicht zunächst auf **An**, in der Planetenansicht auf **Aus**. Werte sind pro Ansicht unabhängig und bleiben beim Wechsel gespeichert.
- **4 Monde:** Der Renderer ermittelt nach jedem Katalogupdate die vier natürlichen Monde mit dem größten `radiusKm` **je übergeordnetem Planeten oder Zwergplaneten**. Ein aktiver Filter begrenzt **Körper, Klickziele, Beschriftungen und (in der Planetenansicht) deren Umlaufbahnen**. Ausgeblendete Monde bleiben im Katalog und in den Detaildaten; ihre Auswahl setzt die Filterung nicht außer Kraft. Bei deaktiviertem Filter zeigt ein aktivierter Mond-Layer alle vorhandenen Monde.
- **Layer-Kompatibilität:** Der normale Mond-Layer bleibt eine eigene Voraussetzung. **4 Monde = An** aktiviert die Monde nicht eigenständig. Das voreingestellte Sonnensystem-Layerpreset **Sterne + Planeten** und das Planeten-Layerpreset **Planeten + Monde + Satelliten** bleiben unverändert. Künstliche Satelliten zählen nicht als Monde.
- **PWA/Version:** Anwendung `29.0.0`, Cache `sonnensystem-shell-v29`. Das Layer-Menü ist für längere Zustandsbeschriftungen leicht verbreitert und bleibt scrollfähig.

## Aktualisierung

Delta v29 über eine **vollständige v28-Installation** entpacken; bestehende Dateien überschreiben. In diesem Delta sind nur seit v28 neue oder geänderte Dateien enthalten. Der lokale Katalog benötigt keine Datenmigration. Im Browser die PWA neu laden bzw. die installierte App aktualisieren, damit der neue Service-Worker-Cache aktiv wird.

## Testabdeckung

`npm run check` prüft Katalogvalidierung, bestehende Regressionstests und neue Tests für Beleuchtungs- und Mondschalter, die sichtbaren Körper, Umlaufbahnen und Ansichtsvoreinstellungen.

---

<a id="release-v28"></a>

## Release v28

# Delta v28 – Drei Kameraperspektiven

## Änderungen gegenüber v27

- Der runde Button `#reset-camera` innerhalb von `.viewport-actions` zeigt nun vier **nach außen gerichtete Pfeile** statt einer Zoom-Out-Lupe. Position, Größe und Zugänglichkeit des Buttons bleiben erhalten.
- Ohne zwischenzeitliche manuelle Kameraänderung wechselt die Taste zyklisch **Schräg/oben (phi 0,99)** → **Von der Seite (phi 1,54)** → **Draufsicht (phi 0,16)** → **Schräg/oben**. Die Blickrichtung (`theta 0,63`), Distanz (47) und Zielposition (Sonne/Ursprung) werden jeweils auf die Preset-Werte gesetzt.
- Nach manueller Bewegung durch Drehen, Schwenken, Zoom, Touchgesten oder Pfeiltasten wird die Perspektivenfolge unterbrochen: Der folgende Klick stellt **Schräg/oben** wieder her, danach darf wieder durchgeschaltet werden. Reine Klicks ohne Bewegung setzen den Zustand nicht zurück.
- Aus einer isolierten Planetenansicht führt die Taste weiterhin unmittelbar zurück zur Sonnensystemübersicht (Schräg/oben). Ein sonstiger programmatischer Reset bleibt ein Reset auf Schräg/oben.
- PWA-Version und Cache-Kennung auf v28 erhöht, damit bestehende Offlineinstallationen die Änderung erhalten.

## Delta-Dateien

`index.html`, `src/app.js`, `src/renderer/renderer.js`, `src/renderer/controls.js`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/DELTA-V28.md` sowie aktualisierte und neue Tests in `tests/`.

**Installation:** Delta v28 auf die vollständige bisherige v27-Arbeitskopie entpacken und gleichnamige Dateien ersetzen. Das ZIP enthält nur veränderte/neue Dateien.

---

<a id="release-v27"></a>

## Release v27

# Delta v27 – Viewport, Detailindex und mobiles Sheet

## Änderungen gegenüber v26

### Viewport-Aktionen

- Der einzige gerahmte, kreisrunde Kamera-Reset (`#reset-camera`) bleibt an `.viewport-actions` gebunden, wird aber von oben rechts nach **unten rechts** verschoben.
- Mobil liegt die Taste über dem geschlossenen Sheet-Header, um erreichbar zu bleiben. Beim Öffnen des Sheets wird die entsprechende Szenenfläche wie bisher überdeckt.

### Control-Panel

- `.viewport>.control-panel`: **width: 58px; padding: 0; border: 0; background: none**; auch Schatten und Hintergrundunschärfe des Panel-Containers entfallen.
- Die zwei Auslöser (`#layer-btn`, `#speed-btn`) besitzen **keine Dropdown-Pfeile** mehr. Alle SVG-Hauptsymbole, Texte, ARIA-Informationen und Klickfunktionen bleiben.
- Das Layer-Popover bleibt 152 px breit. Das Zeit-Popover ist bewusst **116 px breit**, unabhängig von der 58-px-Auslösertaste, damit Slider, Play/Pause, Heute und Datum weiterhin nutzbar sind.

### Objektdetails

- Im `detail-top` ergänzt eine Pfeilnavigation (`#detail-prev` / `#detail-next`) den Index (`#detail-index`). Die Elemente sind betitelte Buttons mit SVG-Pfeilen und zugänglichen Namen.
- Vorheriges/nächstes Objekt bezieht sich auf dieselbe **Objektkategorie** wie der angezeigte Index, einschließlich Raumsonden. Die Navigation ist zyklisch. Bei fehlender Auswahl oder nur einem Objekt sind beide Tasten deaktiviert.
- Ein Klick übernimmt das neue Objekt über den bestehenden `selectBody`-Pfad für Details, Katalog, Szene und mobile Anzeige.

### Mobile Ansicht

- Das separate DOM-Element `#sheet-handle` mit dem `.sheet-grabber` ist entfernt.
- Der gesamte Header `#sheet-header` übernimmt Wischgesten; ein Tipp auf freie Flächen oder die Tastatur (Eingabe/Leertaste) schaltet die Snap-Stufen weiter. Die Tabs wählen weiterhin unabhängig Katalog oder Details.
- **Scroll-Fix:** Das unten fixierte Sheet erhält bei `closed`/`half`/`full` die tatsächliche sichtbare Höhe über `--sheet-visible`, statt eine unsichtbare Vollhöhe nur zu verschieben. Für `half` entspricht damit die scrollbare Höhe genau dem sichtbaren Inhaltsbereich. Katalog- und Details-Scrollbereiche erreichen ihre letzten Einträge; Safe-Area-Padding bleibt erhalten.

## Geänderte Dateien

- `index.html`, `css/styles.css`
- `src/app.js`, `src/ui/object-details.js`, `src/ui/bottom-sheet.js`
- `package.json`, `sw.js`
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V27.md`
- Aktualisierte Versions-/Verhaltenstests unter `tests/`, einschließlich `viewport-detail-sheet-v27.test.mjs`

## Prüfung

- `npm run check`: Katalogvalidierung und 122 Node-Tests bestanden.
- Isolierte Chromium-Layoutprüfung bei **320, 375, 920 und 1360 px**: Panel 58 px, transparent und rahmenlos; Reset unten rechts; beide Popover innerhalb des Viewports.
- Bei 320/375 px: das halb geöffnete Sheet kann in Katalog und Details bis zum letzten Eintrag gescrollt werden; Header-Klick wechselt zum Vollbild; geschlossen ist ausschließlich der Header sichtbar.
- Die vollständige GPU-/WebGL-Integration wurde nicht über einen echten Server im Browser ausgeführt.

**Installation:** Das Delta v27 direkt über die bestehende vollständige v26-Arbeitskopie entpacken und Dateien ersetzen. Das ZIP enthält nur neue oder geänderte Dateien, kein vollständiges Projekt.

---

<a id="release-v26"></a>

## Release v26

# Delta v26 – Kamera-Reset, schlankes Control-Panel und erweiterte Planetenansicht

## Änderungen gegenüber v25

### Allgemein

- **Hilfe-Button entfernt und ersetzt:** `#reset-camera` liegt jetzt oben rechts in `.viewport-actions` (statt innerhalb von `.scene-tools`). Er ist 40 × 40 px groß, kreisrund und gerahmt. Das neue SVG zeigt eine Lupe mit Minuszeichen (Zoom-Out). `title` und `aria-label` bleiben dynamisch: im Sonnensystem „Kamera zurücksetzen“, in einer isolierten Ansicht „Zurück zum Sonnensystem“.
- Das bisherige Hilfe-Modal und seine Ereignisbehandler wurden entfernt. Die Anleitung bleibt unter `docs/HILFE.md`.

### Control-Panel

- Das vollständige Control-Panel (`#view-mode-status`) ist einschließlich Padding und Rahmen **100 px** breit, sowohl auf Desktop als auch auf Mobilgeräten.
- Das bisherige `#view-mode-select` samt Label und Change-Handler ist entfernt. Systemwechsel erfolgen ausschließlich über den Button in den Objektdetails sowie Kamera-Reset zur Rückkehr in die Sonnensystemübersicht.
- Der Objektlayer-Auslöser zeigt nur noch das gestapelte SVG-Icon und den Dropdown-Pfeil; `#layer-summary` wurde entfernt. Der zugängliche Name enthält weiterhin die aktuelle Preset-/Layerauswahl. Das eigentliche Layer-Menü behält 152 px Breite.
- Das Zeit-Dropdown, die ansichtsspezifische Geschwindigkeit und beide Layerzustände funktionieren wie zuvor.

### Objektdetails und Rendering

- Der Button „Planetenansicht öffnen“ erscheint bei **Planeten** und **Zwergplaneten**; ein Zwergplanet kann selbst das Zentrum der isolierten Ansicht sein (z. B. Pluto mit Charon, Nix, Hydra, Kerberos und Styx).
- Bei **Monden** erscheint der gleiche Button, wenn deren Parent ein Planet oder Zwergplanet ist. Der Klick öffnet das **Elternsystem** und wählt das Zentralobjekt in der Detailansicht aus; z. B. Mond → Erde oder Charon → Pluto.
- Renderer, Positionsermittlung und verfügbarer Layerkatalog erlauben nun `dwarf` als isolierten Szenenmittelpunkt. Beim Öffnen wird seine zentrale Kategorie für die Planetenansicht aktiviert. Die bestehenden Standardfilter für gewöhnliche Planeten bleiben erhalten.

### Mobile Ansicht

- Der separate Menübutton `#mobile-menu` wurde entfernt. Das bestehende Bottom-Sheet mit „Objekte“ und „Details“ lässt sich weiter über Griff und Tabs öffnen.
- Kamera-Reset und Control-Panel liegen rechts oben übereinander; die Menüs bleiben auch auf kleinen Bildschirmen im sichtbaren Viewport.

## Dateien

- `index.html`, `css/styles.css` – DOM-Änderungen, Zoom-Out-Icon, 100-px-Panel und Responsive-Positionierung
- `src/app.js`, `src/ui/scene-mode.js`, `src/ui/object-details.js` – Ereignisse, ARIA, Parent-Ziele und Detailaktionen
- `src/renderer/renderer.js`, `src/renderer/scene.js`, `src/data/orbital-math.js`, `src/data/layers.js` – lokales Zwergplanetensystem und Layerverfügbarkeit
- `package.json`, `sw.js` – Version und PWA-Cache
- `README.md`, `docs/ARCHITECTURE.md`, `docs/HILFE.md` – Dokumentation
- `tests/` – aktualisierte Regressionstests plus `scene-actions-v26.test.mjs`

## Prüfung

- Gesamter Katalog wird über `npm run check` validiert.
- Node-Regressionstests decken Standardlayer, PWA-Cache, Bedienung, neue Zwergplanetenansicht und den Parent-Wechsel von Monden ab.
- Responsive Layout isoliert im Headless-Browser bei 320, 375, 920 und 1360 px geprüft. Ein vollständiger GPU-/WebGL-End-to-End-Test ist davon zu unterscheiden.

**Installation:** Das v26-Delta direkt über die vollständige v25-Arbeitskopie entpacken und Dateien ersetzen. Kein vollständiges Projekt-ZIP.

---

<a id="release-v25"></a>

## Release v25

# Delta v25 – Objektlayer-Standards und kompaktes Dropdown

**Basis:** v24. Dieses Delta wird in das vorhandene Projektverzeichnis über v24 entpackt; andere Projektdateien bleiben unverändert.

## Neue Standardfilter

| Ansicht | Standardmäßig aktiv | Standardmäßig inaktiv |
| --- | --- | --- |
| Sonnensystem | **Sterne, Planeten** | Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen, Raumsonden |
| Planetenansicht | **Planeten, Monde, Satelliten** | alle übrigen, sofern sie beim aktuellen Planeten überhaupt vorkommen |

`STANDARD_LAYERS` ist jetzt `['star','planet']`; `PLANET_STANDARD_LAYERS` bleibt `['planet','moon','satellite']`. Beide Ansichten besitzen weiter unabhängige gespeicherte Renderlayer- und Bahneinstellungen. Die Anzeige im Objektkatalog bleibt unabhängig von den Renderfiltern.

## Layer-Dropdown

- **Breite:** 152 px statt 227 px (−33 %); auf Mobilgeräten weiterhin an die Viewport-Breite begrenzt und bei Bedarf scrollbar.
- **Presets:** „Alle“ und „Standard“ erscheinen als zwei zusammenhängende Segmente eines Schalters mit gemeinsamem Hintergrund und aktiver Hervorhebung. Die Trennlinie unter den Presets entfällt; Checkboxen bleiben einzeln wählbar. Bei individuellen Kombinationen ist kein Preset-Segment aktiviert.
- **Überschriften:** die sichtbaren Texte „Objektlayer“, „Umlaufbahnen“ und „Beschriftung“ wurden entfernt. Zugängliche Gruppenbeschriftungen bleiben erhalten.
- **Orbit-Steuerung:** „Umlaufbahn“ bleibt der Hauptschalter; „Kontrast“ und „Farben“ sind leicht eingerückt. Der zusätzliche Hinweisabsatz `.orbit-popover-note` wurde entfernt.
- **Beschriftungen:** Der ursprüngliche Toggle bleibt unverändert, nur die darüberliegende Zwischenüberschrift entfällt.
- **Hinweistext:** `#layer-note` zeigt die modusspezifische Standardauswahl kompakt an.

## Betroffene Dateien

- `src/data/layers.js` – modusspezifische Standardliste
- `index.html` – segmentierter Umschalter, reduzierte Überschriften, eingerückte Unteroptionen, Solar-Checkbox-Startwerte
- `css/styles.css` – schmaleres Dropdown und kompakter Umschalter
- `src/app.js` – knapper modusspezifischer Standardhinweis
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md` – Dokumentation
- `sw.js`, `package.json` – PWA-Cache und Paketversion v25
- `tests/` – aktualisierte Bestandsprüfungen und v25-Regressionstests

Prüfung mit `npm run check`.

---

<a id="release-v24"></a>

## Release v24

# Delta v24 – unabhängiger Objektkatalog und erweiterte Suche

**Basis:** v23. Delta-Update direkt über eine installierte v23-Installation im Workspace-Root entpacken. Die Objekt- und Renderdaten sind unverändert; das Paket enthält ausschließlich geänderte oder neue Dateien.

## Objektkatalog

- Der **gesamte geladene Objektbestand** erscheint unabhängig davon, welche Layer der aktiven 3D-Ansicht eingeschaltet sind. Die Layer-Einstellungen betreffen weiterhin nur den WebGL-Renderer (Körper, Bahnen, Labels, Picking).
- Die Auswahl eines Katalogobjekts bleibt bestehen, wenn seine Renderer-Kategorie ausgeblendet wird. Ein so verborgenes Objekt kann im Katalog und in den Details angesehen werden, ist aber nicht zwangsläufig in der 3D-Ansicht sichtbar oder anklickbar.
- In der **Planetenansicht** steht rechts neben dem Suchfeld ein kompakter **SVG-Planetensymbol-Toggle**, ohne sichtbaren Text. Der Schalter besitzt einen zugänglichen Namen und `aria-pressed`, startet auf **Aus** und filtert bei Aktivierung auf den aktuellen Zentralplaneten sowie über `parentId` zugeordnete Objekte, bei Bedarf auch indirekte Nachfahren. Die Wahl gilt für den Katalog und ändert keine Layer.
- Beim Wechsel zu einem anderen Planeten bezieht sich eine aktive Einschränkung automatisch auf den neuen Planeten. In der Sonnensystemansicht ist der Button verborgen und der gesamte Katalog sichtbar. Der letzte Katalogfilterzustand bleibt für die nächste Planetenansicht erhalten.
- Das Suchfeld und der Toggle werden als eine Zeile angeordnet. Die mobile Ansicht verwendet das vorhandene Katalog-Element im Bottom-Sheet, daher ist kein doppeltes Element nötig.

## Erweiterte Suche

- Die Suchanfrage wird akzent- und groß/kleinschreibungsunabhängig normalisiert und an Leerzeichen in Suchwörter zerlegt. **Jedes Wort** muss in **mindestens einem** Suchfeld vorkommen (UND). Suchfelder: Objektname, ID, Katalogfeld, Kategorie in Singular/Plural, Elternname/-ID.
- `uranus c` findet im vorhandenen lokalen Katalog die **neun Uranus-Monde** mit „c“ im Namen: Puck, Cordelia, Bianca, Cressida, Cupid, Caliban, Sycorax, Trinculo und Francisco. Auch `c uranus` funktioniert.
- Suche und Planetentoggle können gemeinsam benutzt werden; **Renderer-Layer schränken die Ergebnisse niemals ein**.

## Umsetzung und Prüfung

- `src/ui/object-list.js`: von Render-Layern unabhängige Listenauswahl, optionaler Planetenbezug, wortweise Suche.
- `src/app.js`: separater Katalogfilterzustand, Toolbar-Synchronisierung bei Ansichtswechsel, keine Aufhebung der Katalogauswahl durch Render-Layer.
- `index.html`, `css/styles.css`: responsiver Suchbereich mit reinem SVG-Icon-Button, sichtbarem Aktivzustand und zugänglicher Beschriftung.
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`: Dokumentation aktualisiert.
- `package.json`, `sw.js`: Versionsstand v24 und Offline-Cache `sonnensystem-shell-v24`.
- `tests/catalog-search-v24.test.mjs` und angepasste Bestandsprüfungen: Katalogunabhängigkeit, Planetenselektion, Wortsuche und UI-Anbindung.

```bash
npm run check
```

---

<a id="release-v23"></a>

## Release v23

# Delta v23 – getrennte Objektlayer und 5 Tage/s

**Basis:** v22. Dieses Delta-ZIP enthält ausschließlich neue oder geänderte Dateien. Direkt über eine v22-Installation im Workspace-Root entpacken und bestehende Dateien ersetzen. Katalogdaten, Texturen und Server-APIs sind unverändert.

## Sonnensystem: Zeitsteuerung

- Die Standardgeschwindigkeit der **Sonnensystemansicht** beträgt jetzt **5 simulierte Tage pro realer Sekunde** (`SPEED_MODES.solar.defaultSpeed = 5`). Der Start- und Dropdownwert im HTML zeigt `5 Tage / s`.
- Der vorhandene 241-Stufen-Regler bleibt logarithmisch. Sein Standardpunkt liegt bei **Stufe 101** (statt 23), damit die Sprünge unterhalb und oberhalb des neuen Standards ähnlich groß sind. Die Grenzen bleiben **1 Stunde/s** bis **10 Jahre/s**.
- Die **Planetenansicht** startet weiterhin mit **1 Stunde/s**, von **1 Minute/s** bis **1 Jahr/s**. Selbst gewählte Geschwindigkeiten bleiben wie bisher je Ansicht getrennt erhalten; Play/Pause und Simulationszeit werden nicht zurückgesetzt.

## Objektlayer: unabhängige Ansichten

- `S.viewSettings.solar` und `S.viewSettings.planet` verwalten jeweils eine eigene Auswahl für **Objektkategorien**, **Umlaufbahn ein/aus**, **Kontrast**, **Farben** und **Beschriftung**. Ein Ansichtswechsel aktiviert die bereits vorhandenen Werte des betreffenden Modus; er überschreibt die Werte des anderen Modus nicht.
- **Standard Sonnensystem:** Planeten, Monde und Satelliten **sowie Sterne**, damit die Sonne als Zentrum weiterhin sichtbar ist.
- **Standard Planetenansicht:** Planeten, Monde und Satelliten. Nicht vorhandene Kategorien erscheinen nicht als Optionen, behalten aber ihren Filterzustand für andere Planeten mit derselben Ansicht.
- Die **Planetenansicht zeigt nur Kategorien, die im Datensatz zum aktuellen Planeten vorkommen:** die Kategorie des Zentralplaneten und die Typen seiner direkten Kindobjekte (`parentId === planetId`). Der lokale Bestandskatalog bietet beispielsweise bei **Erde** Planeten, Monde und Satelliten, bei **Jupiter** Planeten und Monde. Sterne, Asteroiden, Zwergplaneten usw. fehlen in diesen Listen, solange keine passenden direkten Kindobjekte vorhanden sind.
- Änderungen an dynamisch geladenen Katalogdaten aktualisieren diese Verfügbarkeit. Sollte künftig z. B. ein Asteroid mit `parentId: 'earth'` vorkommen, wird dessen Kategorie für Erde angeboten und der Planet-Renderer berücksichtigt diesen direkten Orbiter.
- Die Voreinstellungen **Standard**, **Alle** und **Individuell** werden pro Ansicht getrennt berechnet. **Alle** aktiviert alle bekannten Typen im jeweiligen Ansichtsstatus; im Dropdown bleiben davon nur die vor Ort vorhandenen Typen sichtbar. Es kann nicht versehentlich die letzte in der aktuellen Szene verfügbare Kategorie abgewählt werden.
- Katalog und WebGL verwenden unverändert denselben gerade aktiven Layerstatus. Der Objektkatalog bleibt durchsuchbar; die dynamische Typenverfügbarkeit betrifft die **Checkboxen des Layer-Dropdowns**.

## Technische Änderungen

- `src/data/layers.js`: Standards pro Ansicht, Verfügbarkeit anhand der Eltern-Kind-Daten, unabhängige Zustandserzeugung und Schutz vor einer vollständig leeren lokalen Auswahl.
- `src/app.js`: aktiven Zustand beim Szenenwechsel wechseln; Dropdown-Optionen dynamisch zeigen/ausblenden; Kategorie-/Bahn-/Label-Toggles im jeweils aktuellen Zustand halten.
- `src/renderer/planet-view.js`: lokal gerenderte Begleiter aus allen direkt zugeordneten, positionierbaren Kategorien ableiten (bisher fest auf Monde/Satelliten beschränkt).
- `src/ui/timeline.js`, `index.html`: neuer Sonnensystem-Startwert und Slider-Pivot.
- `css/styles.css`: nicht verfügbare Layer-Optionen zuverlässig per `[hidden]` ausblenden.
- `package.json`, `sw.js`, `index.html`: Versionskennzeichnung v23 und neues PWA-Cache-Präfix `sonnensystem-shell-v23`.
- `tests/view-layers-speed-v23.test.mjs`: neue Regressionstests für die beiden Presets, verfügbare Kategorien, den Filter-/Orbit-/Label-Zustand, Renderbarkeit und 5 Tage/s. Bestehende Tests wurden an die neue Standardwahl angepasst.

## Prüfen

```bash
npm run check
```

Die Testausführung validiert den Katalog und prüft anschließend die Node-Regressionssuite. Offline-PWA-Installationen verwenden mit v23 einen neuen Cache und aktualisieren nach Neuladen der App-Shell die geänderten Module.

---

<a id="release-v22"></a>

## Release v22

# Delta v22 – linke Tab-Seitenleiste und vollständige Sonnenbahnen

**Basis:** v21. Dieses ZIP enthält nur neue und geänderte Dateien; über das Workspace-Root einer v21-Installation entpacken und vorhandene Dateien ersetzen. Die Katalog-JSON, Texturen, lokalen API-Endpunkte und der Zeitregler sind unverändert.

## Allgemein

- Die globale **Topbar entfällt vollständig**. Die 3D-Ansicht und linke Seitenleiste beginnen am oberen Fensterrand.
- Der bestehende Hilfetext liegt zusätzlich als lesbare Dokumentation unter **`docs/HILFE.md`**, ergänzt um die neue Tab-Anordnung und die Bahndarstellung.
- Damit die Bedienung zugänglich bleibt, stehen der **Hilfe-Button** und mobil der **Objekte-Button** als kleine Schaltflächen oben links über der 3D-Ansicht. Es gibt keine neue horizontale Leiste.

## Linke Sidebar

- Der Objektkatalog und die Objektdetails teilen sich auf Desktop eine **einzige linke Seitenleiste** mit den Tabs **„Objekte“** und **„Details“**. Die gesonderte rechte Detailspalte entfällt.
- Die Tabs nutzen dieselben, unvervielfältigten `#catalog`- und `#detail`-Elemente wie das mobile Bottom-Sheet. Beim Wechsel der Bildschirmbreite werden beide Elemente zwischen Sidebar und Sheet verschoben, ohne den aktuellen Tab zu verlieren.
- Beim Start ist **Objekte** aktiv. Eine gezielte Objektwahl aus dem Katalog oder der Szene öffnet **Details**. Suche und Tastenkürzel `/` öffnen den Katalog.
- Beide Tab-Gruppen lassen sich mit Pfeiltasten links/rechts sowie Home/End bedienen. `aria-selected`, Tastaturfokus und Sichtbarkeit bleiben synchron.

## 3D-Sonnensystem

- Wenn **Umlaufbahn** aktiviert ist, werden **alle** verfügbaren sonnenzentrierten Bahnen aktiver Layer gezeichnet: Planeten, Zwergplaneten, Asteroiden und Kometen. Die bisherige Beschränkung auf ausgewählte Asteroiden/Kometen bzw. einzelne Zwergplaneten ist entfernt.
- Bahnen werden durch `solarOrbitBodies()` anhand von `parentId === 'sun'`, Layerstatus und vorhandenen gültigen Bahndaten bestimmt. Ihre Linien verwenden den Ursprung `[0,0,0]` (Sonne). Das Bahnen-Toggle schaltet sie gemeinsam ab.
- Monde und künstliche Satelliten haben stattdessen **planetenbezogene** Bahnen. In der Sonnenübersicht werden deshalb keine falschen Sonnenkreise für sie gezeichnet; ihre lokalen Umlaufbahnen bleiben in der jeweiligen Planetenansicht erhalten. Für Raumsonden werden ohne echte Ephemeriden weiterhin keine Bahnen erfunden.
- In der Sonnenübersicht werden je Planet **höchstens vier Mondnamen** zur Beschriftung zugelassen, nach physikalischem Radius (größte zuerst). Ein explizit ausgewählter kleinerer Mond erhält weiterhin ein Label, ersetzt aber den viertgrößten der Gruppe. In der isolierten Planetenansicht gilt diese neue Beschränkung nicht. Die bestehenden Bewegungs- und Bildschirmdichtefilter bleiben zusätzlich aktiv.

## Dateien und Tests

- `index.html`, `css/styles.css`: zweispaltiger Seitenaufbau, gemeinsame Sidebar-Tabs und Ansicht ohne Topbar.
- `src/ui/bottom-sheet.js`, `src/app.js`: Tab-Synchronisation und responsive DOM-Übernahme, keine Topbar-Abhängigkeit.
- `src/renderer/solar-view.js`: alle aktiven, verfügbaren Sonnenbahnen statt Auswahl-/Listenlimit.
- `src/renderer/labels.js`: pro Planet maximal vier Mondbeschriftungen in der Übersicht.
- `docs/HILFE.md`: Hilfetext; `README.md` und `docs/ARCHITECTURE.md`: aktuelle Beschreibung.
- `package.json`: `22.0.0`; `sw.js`: Cache `sonnensystem-shell-v22`.
- Neue Regressionen in `tests/desktop-tabs-orbits-v22.test.mjs`; Versions- und Sidebar-Tests aktualisiert.

## Prüfung

`npm run check` validiert Daten und führt die Node-Regressionssuite aus. Das Layout wurde mit isoliert geladenem HTML/CSS und Tab-Steuerung in Chromium bei 320, 375, 920 und 1360 px geprüft. Ein direkter lokaler HTTP-Aufruf in Chromium wird in dieser Umgebung von der Browsersicherheitsrichtlinie blockiert; deshalb ist dies keine vollständige WebGL-End-to-End-Prüfung.

---

<a id="release-v21"></a>

## Release v21

# Delta v21 – kompakte Zeitsteuerung und dynamische Sliderfüllung

**Basis:** v20. Dieses Delta enthält nur neue oder geänderte Dateien. Ins Root einer vorhandenen v20-Installation entpacken und gleichnamige Dateien überschreiben. Texturen, Katalogdaten und Renderer sind unverändert.

## Änderungen

1. **Zentrierter Reglergriff:** Der logarithmische Range-Slider bleibt vertikal bedienbar, wird aber browserübergreifend als um 90 Grad gedrehter nativer Horizontalregler gerendert. Griff (26 × 26 px) und 6 px breite Spur liegen auf einer gemeinsamen Mittelachse; Beschriftungen und Grenzen bleiben erhalten.
2. **Füllfarbe:** Der bereits durchlaufene Bereich wird von unten bis zum Griff bernsteinfarben dargestellt. `syncControls` setzt `--speed-progress` passend zum aktuellen Slider-Schritt (0–240); die Darstellung reagiert auf Änderungen in Sonnen- und Planetenansicht.
3. **Heute-Button:** Nur das Rücksetzsymbol ist sichtbar. Der bestehende zugängliche Name, Tooltip und die Klickfunktion für die aktuelle lokale Zeit bleiben bestehen.
4. **Menüanordnung:** Einspaltiges Popup mit Slider, darunter zwei gleich breite Buttons (Play/Pause und Zurücksetzen), darunter Datum und Uhrzeit in zwei Zeilen. Keine seitliche Zwei-Spalten-Anordnung mehr.
5. **Breite:** Das Zeit-Popup ist exakt so breit wie der auslösende Dropdown-Button – auf Desktop und Mobilgeräten; auf niedrigen Viewports wird die Höhe angepasst.

## Technische Details

- `index.html`: Slider-Slot und Button-Reihe, Icon-only Reset, Versionslabel.
- `css/styles.css`: einspaltiges Dropdown, zentrierter gedrehter Range-Input, Track-Gradient und kompakte Größen.
- `src/ui/timeline.js`: synchronisierter Füllstand als CSS-Variable.
- `package.json`: `21.0.0`; `sw.js`: neuer Cache `sonnensystem-shell-v21` zum Ausrollen des Updates.
- Bestehende Strukturtests aktualisiert; zusätzliche Tests prüfen die neuen Layout- und Füllanforderungen.

## Kontrolle

`npm run check` für Datenvalidierung und Node-Regressionen. Das Aussehen des Sliders wurde in Chromium bei mobilen (320/375 px) und Desktop-Breiten überprüft. Änderungen an Geschwindigkeit, Simulation, Pause und Datum wurden nicht vorgenommen.

---

<a id="release-v20"></a>

## Release v20

# Delta v20 – Zeitregler, Beschriftung und mobiles Control-Panel

**Basis:** v19. Dieses ZIP enthält ausschließlich die neuen oder geänderten Dateien. Für die Installation direkt im vorhandenen v19-Workspace-Root entpacken und die gleichnamigen Dateien überschreiben. `textures/standard/`, Katalog-JSON und Server-APIs bleiben unverändert.

## Änderungen

1. **Zeitsteuerung:** Der vertikale 241-Stufen-Range-Slider hat in Chromium/WebKit und Firefox einen **26 × 26 px großen, hellen Griff** mit dunklem Rand und farblichem Außenring. Die Spur bleibt dunkel, der Touch-Bereich ist 44 px breit. Geschwindigkeit, Grenzen und Play/Pause-/Heute-Verhalten bleiben unverändert.
2. **Objektlayer:** Der **Beschriftung**-Schalter (An/Aus) wurde mit seiner bestehenden `toggle-labels`-ID und Renderer-Anbindung in das Layer-Dropdown versetzt. Ein zugänglicher gedrückter Zustand und die sichtbare Anzeige werden bei jedem Umschalten aktualisiert. „Übersicht“ bleibt als eigener Button im Control-Panel.
3. **Standardansicht:** Der Startwert für **Umlaufbahn-Kontrast ist aus** (`orbitContrast:false`). Umlaufbahn und Farben bleiben aktiviert; Beschriftungen ebenfalls. Der Kontrastschalter zeigt von Beginn an „Aus“ und lässt sich unabhängig einschalten.
4. **Mobil bis 770 px:** Das Sheet besitzt nur noch **Objekte** und **Details**; der Tab „Steuerung“ entfällt. Das **vollständige Control-Panel** mit Ansicht, Objektlayer, Zeit und Übersicht bleibt im Viewport oben rechts und wird nicht mehr in das Sheet verschoben. Dropdowns öffnen wie auf Desktop rechtsbündig unter ihren Auslösern. Die Layerliste kann auf kleinen Geräten intern gescrollt werden. Bei Öffnen eines Sheet-Tabs werden offene Menüs geschlossen.

## Technische Änderungen

- Markup: `index.html`; responsive Styles und Range-Slider-Pseudoelemente: `css/styles.css`.
- Zustand und Schalter-Synchronisation: `src/app.js`; nur noch zwei mobile Sheet-Panels und kein DOM-Verschieben des Übersicht-Buttons: `src/ui/bottom-sheet.js`.
- Version: `package.json` = `20.0.0`, Header `V20.0`, Service-Worker-Cache `sonnensystem-shell-v20`.
- Aktualisierte Regressionstests und zusätzliche v20-Prüfungen; `README.md` beschreibt die neue Steuerung.

## Verifikation

`npm run check` prüft Katalog, Anwendungsmodule, PWA und UI-/Steuerungs-Regressionen. Der Renderer und die logarithmischen Bereiche werden nicht verändert. Die visuellen Browserprüfungen sind von der Ausführungsumgebung abhängig.

---

<a id="release-v19"></a>

## Release v19

# Delta v19 – Rechtsbündige Dropdowns und kompakte Zeitsteuerung

**Basis:** v18. Die im ZIP enthaltenen geänderten Dateien direkt in das v18-Workspace-Root entpacken und überschreiben. Frühere Deltas sind in dieser Datei nicht erneut enthalten. `textures/standard` wird nicht verändert.

## Steuerung und Positionierung

- **Layer-Dropdown:** Direkt unter dem Layer-Button, rechte Kante mit Button ausgerichtet. Auf dem Desktop 227 px breit und bei niedrigem Bildschirm scrollbar. Innerhalb des Layer-Menüs: Alle/Standard, die acht Objektkategorien und darunter **Umlaufbahn**, **Kontrast** und **Farben** als drei unabhängige Ein/Aus-Schalter. Der eigenständige Bahnen-Button und sein Popover entfallen. Bestehende Statuswerte, Farbcodes und Standardvorgaben (alle drei an) bleiben erhalten.
- **Zeit-Dropdown:** Direkt unter dem Zeit-Button, ebenfalls rechtsbündig. Breite 196 px auf Desktop, mobil bis 220 px. Der Header zeigt ausschließlich die aktuelle Geschwindigkeit (ohne „Zeitsteuerung“). Der Body hat zwei Spalten: **links** den 241-stufigen vertikalen Geschwindigkeitsregler; **rechts** Play/Pause, Heute, lokales Datum und lokale Uhrzeit in zwei Zeilen. Die obere zweizeilige Trigger-Beschriftung bleibt Geschwindigkeit plus Datum ohne Uhrzeit.
- **Mobil:** Beide Menüs öffnen im dritten Tab „Steuerung“ und bleiben im normalen Layoutfluss. Das Zeitmenü ist innerhalb seines Triggers rechts ausgerichtet. Das Sheet wird bei Bedarf vollständig ausgeklappt; Wechsel zum Katalog oder zu Details schließt offene Menüs. Der Übersicht-Button bleibt im Bild.

## Unveränderte Semantik

- Logarithmische Geschwindigkeiten, getrennt für Sonnensystem (3 h/s Standard; 1 h/s bis 10 Jahre/s) und Planetenansicht (1 h/s Standard; 1 min/s bis 1 Jahr/s).
- Heute setzt die Simulation auf `Date.now()` in lokaler Browserzeit, ohne Play/Pause, Ansicht oder Kamera zu verändern.
- Objektlayer-Voreinstellung „Standard“: nur Sonne und Planeten.
- Umlaufbahn, Kontrast und Farben sind weiterhin getrennte Optionen. Kein Eingriff in WebGL, Katalogdaten oder lokale Texturen.

## Technische Änderungen

`index.html`, `css/styles.css`, `src/app.js`, `src/ui/timeline.js`, `src/ui/bottom-sheet.js`, `package.json`, `sw.js`. Tests wurden an das Layout angepasst und um `tests/popovers-v19.test.mjs` ergänzt. Cache-Version: `sonnensystem-shell-v19`.

**Validierung:** `npm run check`, mit zusätzlichem Layout- und DOM-Strukturtest. Ein echter interaktiver Browsertest ist getrennt zu beurteilen, da die Headless-Umgebung zeitweise keine lokale Navigation zulässt.

---

<a id="release-v18"></a>

## Release v18

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

---

<a id="release-v17"></a>

## Release v17

# Delta v17 – Standardansicht und Umlaufbahn-Optionen

**Basis:** v16. Das ZIP enthält nur geänderte und neue Dateien. Über das vollständige v16-Workspace-Root entpacken; `textures/standard` bleibt erhalten.

## Standardansicht

- Voreinstellung **Standard**: Sonne und acht Planeten (`star`, `planet`), **keine Monde**.
- „Alle“ und die freie Kategoriemehrfachauswahl bleiben unverändert. Mond-/Satellitenbahnen erscheinen erst, wenn der entsprechende Layer eingeschaltet ist.
- Die Auswahl wirkt weiterhin auf Katalog, Objekte, Orbits, Labels und Anklickbarkeit. Die Planetenansicht folgt derselben Layer-Auswahl.

## Umlaufbahn-Dropdown

- Das bestehende Bahnen-SVG ist jetzt ein Menüknopf. Das Dropdown enthält exakt drei unabhängige Umschalter: **Umlaufbahn**, **Kontrast**, **Farben**; alle sind standardmäßig **An**.
- **Umlaufbahn**: Ein/Aus ohne Verlust der beiden Darstellungsoptionen. **Kontrast**: gut sichtbare, gegenüber v16 breitere Linien mit höherer Deckkraft. Echte projizierte 2D-Dreiecke (2,4 px normal / 3,4 px ausgewählt) statt browserabhängiger `gl.lineWidth`-Werte. Wenn Kontrast aus ist, werden die dünnen früheren Linien verwendet.
- **Farben**: Kategorienpalette an/aus; bei Aus werden alle Bahnen einheitlich graublau angezeigt. Die ausgewählte Bahn bleibt durch zusätzliche Breite/Helligkeit unterscheidbar.
- Das Menü öffnet auf Desktop **links** vom 110-px-Panel und auf Mobilgeräten **innerhalb** des dritten Tabs „Steuerung“. Layer-Menü, Geschwindigkeitsregler und Umlaufbahn-Menü schließen einander.
- Die Bahnfarben ändern nicht die lokalen Oberflächentexturen oder die natürlichen Planetenfarben.

## Farbpalette

| Kategorie | Bezeichnung | Hex-Code |
|---|---|---|
| Planeten | Weiß | `#E6EDF5` |
| Erdumlaufbahn | Klares Blau | `#4DA3FF` |
| Zwergplaneten | Violett | `#B68CFF` |
| Monde | Weiß | `#E6EDF5` |
| Asteroiden | Bernstein | `#E9B44C` |
| Kometen | Korallrosa | `#FF7597` |
| Künstliche Satelliten | Limettengrün | `#A7D86D` |
| Raumsonden | Orange | `#FF8B4A` |
| Sterne | Warmgelb | `#FFE5A0` |

Die blaue Farbe gilt für die Sonnenumlaufbahn **der Erde**, während alle übrigen Planetenbahnen weiß sind. Raumsonden sind weiterhin katalogbasiert, bis reale Ephemeriden vorhanden sind.

## Version, Validierung und Grenzen

- Version `17.0.0`; PWA-Cache `sonnensystem-shell-v17`.
- `npm run check` enthält bestehende Regressionstests plus v17-Prüfungen für Palette, Layer, Orbit-Liniengeometrie und die Oberfläche.
- Die Darstellung wurde nicht in einem vollständigen interaktiven Browserlauf verifiziert, weil die lokale Chromium-Navigation in der Testumgebung blockiert war. Die automatisierten Modell- und Komponententests sind separat ausgeführt.

---

<a id="release-v16"></a>

## Release v16

# Delta v16 – Standard-Sterne und stabile Label-Dichte

Basis: v15. Installieren: ZIP direkt über v15 entpacken und gleichnamige Dateien ersetzen. Lokale Texturen bleiben unverändert.

## Layer

- `Standard`: Planeten + Monde + Sterne (einschließlich Sonne).
- `Alle` und individuelle Kategorien bleiben unverändert.
- Katalog, Szene, Labels und Orbitlayer verwenden weiterhin dieselbe Layer-Auswahl.

## Beschriftungen

- Entfernt die automatische Unterdrückung wegen Überlappung von Texten oder Planetenscheiben.
- Pro Zelle von 160 × 110 CSS-Pixeln maximal zwei nicht ausgewählte Beschriftungen; ausgewählte Objekte sind zusätzlich immer zulässig.
- Prioritätsreihenfolge und Bonus für bislang sichtbare Labels bleiben erhalten.
- Die Rasterzelle bleibt bei kleinen Bewegungen über Zellgrenzen durch 18 px Randpuffer stabil.
- Die bisherige Label-Seite bleibt erhalten und ändert sich nur, um den sichtbaren Bildschirm nicht zu verlassen.
- Der unabhängige Geschwindigkeitsfilter und der manuelle Namen-Schalter bleiben erhalten.

## Validierung

- `npm run check`: 71 automatische Prüfungen einschließlich vier neuer v16-Tests.
- Das Delta enthält keine Texturdateien und ändert keine Katalogdaten.

---

<a id="release-v15"></a>

## Release v15

# Delta v15 – Kompaktes Control-Panel und Objektlayer

## Installation

Delta v15 direkt **über v14** im Workspace-Root entpacken und vorhandene Dateien ersetzen. Nur geänderte bzw. neue Dateien sind im ZIP enthalten; der lokale Ordner `textures/standard/`, astronomische Katalogdaten und vorhandene Bilder werden nicht verändert. Für eine Neuinstallation: v8 → v9.1 → v10 → v11 → v12 → v13 → v14 → v15.

## Control-Panel

- Desktop-Panel von **184 auf 110 Pixel** reduziert (−40,2 %), weiterhin oben rechts. Die Zeitsteuerung bleibt vertikal; das Datum wird kompakt innerhalb des Buttons angezeigt.
- Die sichtbare Beschriftung **„Ansicht“** oberhalb der Ansichtsauswahl ist entfernt, die zugängliche Beschriftung bleibt erhalten.
- Neues **Layer-Dropdown** zwischen Ansicht und Zeitsteuerung. Auf Desktop öffnet es nach links; auf Mobilgeräten erweitert es sich innerhalb des dritten Bottom-Sheet-Tabs „Steuerung“.
- Die bestehenden SVG-Buttons Bahnen, Namen und Übersicht bleiben erhalten; mobil bleibt weiterhin nur Übersicht über der Szene sichtbar.

## Kategorie-Layer

- Preset **Standard (Startwert): Planeten + Monde**.
- Preset **Alle:** alle acht katalogisierten Kategorien.
- Beliebige Einzel- und Mehrfachkombinationen per Checkbox; mindestens eine Kategorie aktiv.
- Wirkt sowohl auf die Objektliste als auch auf gerenderte Objekte, Orbitlinien, Labels und Trefferauswahl in beiden 3D-Ansichten. Ausgeblendete Objekte können nicht per Canvas-Klick ausgewählt werden.
- Sind aktive Objekte durch einen Layerwechsel ausgeblendet, wird die aktuelle Objektauswahl aufgehoben; Kamera und Simulation bleiben unangetastet.
- Die Sonne gehört zur Kategorie Sterne und ist deshalb im Standard-Preset nicht sichtbar; das rein dekorative Hintergrund-Sternenfeld bleibt erhalten.
- Raumsonden bleiben ohne Ephemeriden ausschließlich als redaktionelle Katalogeinträge verfügbar.

## Katalogsuche

- Alte Kategorie-Filterchips unter dem Suchfeld entfernt.
- Die Freitextsuche durchsucht zusätzlich zur Objekt-ID, Name und Katalognummer die **deutsche Kategoriebezeichnung** (z. B. `Mond` / `Monde`) und **Name/ID des direkten Mutterobjekts** (z. B. `Erde`, `Jupiter`).
- Groß-/Kleinschreibung und Akzente werden ignoriert. Der Layerfilter bleibt auch bei Suchanfragen wirksam.

## Kompatibilität und Tests

- Keine Änderungen an Katalog-JSON, Texturbildern, Server-APIs oder Simulationsgeschwindigkeiten.
- PWA-Cache-Version auf `sonnensystem-shell-v15` angehoben; `src/data/layers.js` wird offline mit ausgeliefert.
- Automatisierte Regressionstests für Presets, Checkbox-Mehrfachauswahl, Suche nach Eltern/Kategorien, WebGL-Layer, Mobil-/Desktop-Struktur und PWA.
- Browser-Sichtprüfung: Desktop, Tablet, Mobil (inkl. geöffneter Layer-Auswahl); die dynamische WebGL-Laufzeit kann im Headless-Browser dieser Umgebung wegen einer lokalen Navigationssperre nicht vollständig geprüft werden.

---

<a id="release-v14"></a>

## Release v14

# Delta v14 – Schmales Control-Panel und mobile Steuerung

## Installation

Delta v14 direkt über **v13** im Workspace-Root entpacken und bestehende Dateien ersetzen. Nur neue oder geänderte Dateien befinden sich im ZIP; der lokale Texturordner `textures/standard` und sämtliche Astronomiedaten bleiben erhalten. Die bisherige Installationsreihenfolge für Neuinstallationen ist v8 → v9.1 → v10 → v11 → v12 → v13 → v14.

## Desktop und Tablet ab 771 px

- Control-Panel bleibt **oben rechts**, aber rund **180–184 px schmal**.
- Ansicht-Dropdown bleibt bestehen; Play/Pause, Geschwindigkeit und Datum sind **untereinander** angeordnet.
- **Bahnen, Namen und Übersicht** werden als reine SVG-Icon-Buttons dargestellt. `aria-label`, Tooltips und `aria-pressed` bleiben für Bedienbarkeit und Zustandsanzeige erhalten.
- Der logarithmische Geschwindigkeitsregler mit 241 Stufen öffnet links neben dem schmalen Panel.
- Bei 771–1030 px Bildschirmbreite beginnt die überlagernde Detailansicht unter dem erweiterten Panel, um die Werkzeug-Buttons nicht zu verdecken.

## Mobil bis 770 px

- Drei Bottom-Sheet-Tabs: **Objekte, Details, Steuerung** (statt der bisherigen Registerkarte „Zeit“).
- Der dritte Tab enthält die **vollständige Ansicht- und Zeitsteuerung** sowie die Bahnen-/Namen-Schalter. Es werden keine zweiten Bedienelemente erzeugt.
- Nur der bestehende **Übersicht-Button** bleibt schwebend im Sichtbereich der 3D-Szene. Er folgt beim Öffnen und Ziehen dem oberen Rand des Bottom-Sheets und bleibt erreichbar, solange Bühne sichtbar ist.
- Beim Zurückwechseln zu Desktop werden Panel und Übersicht-Button an ihre ursprünglichen Positionen versetzt, ohne Ereignisbehandler oder gesetzte Geschwindigkeiten zu verlieren.
- Das Öffnen des Geschwindigkeitsreglers vergrößert das Bottom-Sheet automatisch auf volle Höhe, damit der komplette vertikale Regler bedienbar ist. Beim Tab-Wechsel wird ein eventuell offener Popover geschlossen.

## Kompatibilität

Keine Änderungen an 3D-Bewegung, Katalogdaten, Texturdateien, API-Routen, Simulation oder den bisherigen Geschwindigkeitsbereichen. Die PWA-Cache-Kennung wurde auf `sonnensystem-shell-v14` geändert.

## Verifikation

Automatische Tests für mobile DOM-Verlagerung, Tabzustand, SVG-Steuerung, dynamisch nachgeführten Übersicht-Button und Bestandsregressionen; zusätzlich statische Layout- und Browserprüfungen für mehrere Viewport-Größen. Diese prüfen nicht die reale WebGL-Szene.

---

<a id="release-v13"></a>

## Release v13

# Delta v13 – Control-Panel, Objekt-Registerkarten und reduzierte Navigation

## Installation

Delta v13 über **v12** im Workspace-Root entpacken. Bestehende Dateien werden ersetzt. `textures/standard/` und der astronomische Katalog werden nicht verändert. Das Delta enthält ausschließlich geänderte/neue Dateien. Für ein frisches System zunächst v8 und die folgenden Deltas nacheinander installieren: v9.1 → v10 → v11 → v12 → v13.

## Control-Panel (oben rechts)

- Der bisherige Text zur heliozentrischen Ansicht entfällt. Stattdessen zeigt ein zugängliches **Ansicht-Dropdown** die heliozentrische, ausdrücklich nicht maßstabsgetreue Darstellung sowie die acht Planetensysteme. Die Auswahl synchronisiert sich nach jedem Ansichtswechsel; ein Wechsel zu einem Planetensystem wählt den entsprechenden Planeten aus.
- **Play/Pause, Geschwindigkeit und Heute** befinden sich zusammen mit dem Ansicht-Dropdown im Control-Panel. Play/Pause bleibt ein reiner SVG-Icon-Button. Die Geschwindigkeit zeigt **nur den gewählten Wert**; der Regler öffnet mit logarithmischen Stufen. Der Heute-Button zeigt nur das Datum (lokal `DD.MM.YYYY hh:mm`) und das Zurücksetzen-Symbol; das Wort „Heute“ entfällt.
- Die bisherigen Buttons **Bahnen, Namen, Übersicht** sind in die untere Zeile des Panels umgezogen. Bestehende Funktionen und die getrennten Geschwindigkeitsbereiche bleiben erhalten.
- Auf Mobilgeräten bleibt die vorhandene Bottom-Sheet-Funktion für die drei Zeitbuttons erhalten („Zeit“), damit die kompakte Szene nicht durch die Zeitleiste verdeckt wird. Die Ansichts- und Szenenwahl bleibt oben rechts.
- Die dekorativen `camera-hints` wurden aus Markup und Styles entfernt.

## Objektdetails

- Die obere Überschrift lautet jetzt **Name des gewählten Objekts**, nicht mehr „02 / Objektdetails“.
- **Objekttyp und Zuordnung** (z. B. `PLANET / SONNENSYSTEM`) sind als `hero-ref` direkt im Objekt-Schaubild eingeblendet. Das alte Feld für die interne Ziel-ID entfällt.
- **Wissen** zeigt die redaktionelle Beschreibung, Artikelabschnitte und Quellenlinks.
- **Daten** zeigt physikalische Werte, Orbitdetails, zugehörige Objekte, den Horizons-Abgleich sowie die Datenquellen. Auch Raumsonden trennen ihre Missionsbeschreibung von den Fakten.
- Beim Wechsel des gewählten Objekts wird „Wissen“ wieder aktiv; die Tabs unterstützen Pfeiltasten, Home und End sowie sichtbare Fokusmarkierungen.
- `detail-sources` befindet sich **innerhalb von `detail-scroll`** unter den Daten und ist nicht mehr fixiert. Es scrollt mit den astronomischen Werten.
- Im Sidebar-Katalog entfällt `catalog-intro`. Die Suche steht direkt oben.

## Daten und Kompatibilität

Das Update verändert keine Katalog-Einträge, Datenquellen, lokalen Texturpfade oder 3D-Bahnmodelle. Die Service-Worker-Cache-Version wird auf `sonnensystem-shell-v13` erhöht, damit installierte PWAs neue HTML-, CSS- und JavaScript-Dateien beziehen.

## Prüfungen

Automatisierte Node-Regressionstests einschließlich v13-UI-Struktur, Ansichts-Synchronisation, zugänglichem Tabzustand und Katalogvalidierung. Die Browser-Sichtprüfung einer direkt per URL geladenen Anwendung ist in dieser Umgebung durch Browser-Netzwerkregeln blockiert; statische Desktop/Tablet-/Mobil-Layout-Screenshots wurden separat geprüft.

---

<a id="release-v12"></a>

## Release v12

# Delta v12 – lokale Texturen, Raumsonden und Zeitleiste

## Installation

Delta v12 über v11 entpacken. Eigene Texturdateien liegen in `textures/standard/` und werden nicht mit diesem Delta überschrieben oder mitgeliefert. Der Server liefert sie direkt vom lokalen Dateisystem. Unterstützt: `.jpg`, `.jpeg`, `.png`, `.webp`; Basisname ist die Objekt-ID (z. B. `earth.jpg`, `moon.png`, `titan.webp`); zusätzlich werden einige bekannte originale 2K-Dateinamen wie `2k_earth_daymap.jpg` erkannt. Die Auflösung wird bei der GPU-Übertragung begrenzt: mobil 512, Sonnensystem 2048, Planetenansicht 4096 Pixel. Die Auflösung einer kleineren Quelldatei wird nicht künstlich erhöht.

**Keine CORS- oder externen Texturzugriffe:** v11-Fallback auf Fremdhosts und v11-Server-Downloadproxy entfallen. Fehlende Karten werden schematisch dargestellt. Die eigenen Bilddateien sind nicht Bestandteil dieses Deltas. Bei anderen Dateinamen müssen Dateien entsprechend umbenannt werden.

## Raumsonden

Die Kategorie **Raumsonden** enthält Voyager 1/2, Pioneer 10/11, New Horizons, Cassini, Galileo und Huygens mit Startdatum, Zielen, Missionsstatus und Link zur NASA-Quellseite. Missionsdaten sind getrennt von künstlichen Erdsatelliten. **Keine erfundenen Positionsdaten oder Keplerbahnen:** Für die Sonden werden keine 3D-Positionen gezeichnet. Missionsstatus sind redaktionelle Momentaufnahmen, keine Live-Telemetrie.

## Zeitleiste

Play/Pause ist ein reiner Icon-Button mit SVG-Pfad. Das Datum wird nach `DD.MM.YYYY hh:mm` in der lokalen Browser-Zeitzone im Heute-Button angezeigt. „Heute“ setzt den Zeitsimulationswert auf `Date.now()`. Die obere Zeile „Zeitreise“ wurde entfernt. Die separat gespeicherten Geschwindigkeitsbereiche aus v10 bleiben bestehen.

### Aufräumen nach dem Update

Die beiden v11-Dateien `server/providers/textures.mjs` und `scripts/cache-textures.mjs` werden in v12 nicht mehr importiert bzw. aufgerufen. Beim Überlagern eines Delta-ZIPs bleiben ältere, nicht mehr benötigte Dateien auf der Festplatte; sie können daher gelöscht werden. Die Anwendung führt unabhängig davon keine externen Texturabrufe aus.

---

<a id="release-v11"></a>

## Release v11

# Delta v11 – Objekt-Auswahl und Oberflächenbilder

**Basis:** vollständiger v8-Workspace-Root, Delta v9.1, danach Delta v10. Das v11-Delta enthält **nur geänderte und neue Dateien** und wird direkt ins Workspace-Root entpackt.

## Objekt-Auswahl

- Ein kurzer linker Mausklick oder Tipp auf den leeren 3D-Himmel hebt eine vorherige Objektauswahl auf (`SolarRenderer.pick → onClearSelect → state.selected=null`). Treffer auf Himmelskörper wählen diese weiterhin aus. Rotation, Zoom und Panning ändern die Auswahl nicht.
- Die Detailanzeige und Katalogmarkierung werden nach dem Abwählen aktualisiert. Die aktuelle Planetenansicht und Kameraposition bleiben bestehen.
- Bei ausgewähltem Objekt setzt die Label-Priorität keine automatischen Unterdrückungen mehr durch: schnelle Satelliten, Durchflüge, Text-/Körperkollision und temporäre Sichtüberdeckung blenden dieses Label nicht aus. Seine Positionsseite bleibt stabil. Bei **manuell deaktivierter Beschriftung** bleibt auch das ausgewählte Label unsichtbar.
- Alle bisherigen v9/v10-Hysterese- und Kollisionsregeln gelten weiterhin für *nicht ausgewählte* Labels. Die Regressionstests wurden entsprechend präzisiert.

## Oberflächentexturen

- UV-Sphäre (neues Vertex-Layout mit acht Floats), Shader-Sampling `uDiffuse`/`uHasTexture`; prozedurale Texturen als jederzeit funktionsfähiger Fallback.
- Registrierte equirektangulare Bilder: NASA-basierte Solar-System-Scope-Karten aller acht Planeten, Sonne und Mond; NASA/JPL- und USGS-Mosaike für Phobos, Deimos und die großen Monde der äußeren Planeten; Cassini-Mosaik für Titan und OSIRIS-REx-Fotomosaik für Bennu.
- Dynamischer Qualitätsmodus: **2K** für Standardansicht, **bis 4K** für Körper mit verfügbarer hochaufgelöster Karte in der Planetenansicht, **512 px** für mobile/speicherschwache Geräte. Nicht höher als das verfügbare Originalbild und das Gerätelimit.
- Quellen in `src/renderer/texture-sources.js` fest zugelassen; Browser lädt über `/textures/<tier>/<id>.jpg`, Node-Proxy prüft echte HTTPS-Ursprünge, Datenformat und Größe. Private Dateiablage unter `.texture-cache/`. Bildanzeige im GPU-Cache mit begrenzter Parallelität/LRU.
- PWA auf `sonnensystem-shell-v11` umgestellt: neue Module gehören zur App-Shell, Bilder werden **erst nach erfolgreicher Anfrage** in den Cache aufgenommen.
- Texturquellen werden als Attribution/Quellenlink in der Detailansicht angezeigt. Alle Quellen und Rechteangaben sind in [TEXTURE-SOURCES.md](TEXTURE-SOURCES.md) dokumentiert.

**Einschränkung:** Die Bilddateien sind **nicht Bestandteil des ZIPs**, können hier nicht direkt von den Quellenservern geladen und daher nicht live visuell verifiziert werden. Erster Online-Abruf über den mitgelieferten Node-Server (`npm start`) erforderlich; andernfalls bleibt die bisherige schematische Optik erhalten. Die tatsächliche Größe der JPL-Missionstexturen liegt teilweise unter 2K; Uranus und Neptun besitzen im Register keine hochauflösenden 4K-Varianten. Für die Mehrzahl der kleinen Monde und Asteroiden ist noch kein kartografisch passendes Raster registriert.

## Tests

`npm run check`: bestehende v2–v10-Regressionen und neue v11-Tests für Auswahl, immer sichtbare ausgewählte Labels in beiden Modi, Quellen-Allowlist, Sicherheit, UV-/Shader-Integration, GPU-Downscaling, Details-Attribution, PWA-Integration und Textur-Stufen.

## Installation

1. Im bestehenden v10-Workspace das ZIP `Sonnensystem-Delta-v11.zip` entpacken und Dateien überschreiben. **Nicht** als eigenständiges Projekt starten.
2. `npm run check` ausführen.
3. `npm start`; anschließend im Browser neu laden. Bei einer vorhandenen installierten PWA auf Aktivierung des `v11`-Service-Workers achten.
4. Bei Onlinezugang optional `npm run textures:cache` zum Vorwärmen der Standardbilder ausführen.

---

<a id="release-v10"></a>

## Release v10

# Delta v10.0 – Ruhige Labels und smarte Zeitleiste

Dieses **inkrementelle** Update setzt auf dem **vollständigen Workspace-Root v8 plus Delta v9.1** auf. Es enthält ausschließlich geänderte und neue Dateien. Die 160 astronomischen Objekte und 160 Artikel bleiben unverändert.

## Installation

1. Das bestehende Workspace-Root mit v8 und Delta v9.1 beibehalten.
2. `Sonnensystem-Delta-v10.zip` **direkt in diesem Workspace-Root** entpacken (bestehende Dateien überschreiben, keine Dateien löschen).
3. `npm run check` ausführen und mit `npm start` starten.
4. Eine installierte PWA neu öffnen/neu laden; `sw.js` wechselt auf `sonnensystem-shell-v10` und entfernt alte Shell-Caches.

## 1. Smarte Labels – Positionen stabilisieren

* Ein je Objekt persistierter Seitenanker (rechts / links / oben / unten) verhindert Seitenwechsel durch kurzlebige Überlagerungen – gerade im dichten Satellitenfeld um die Erde.
* Ist die gewählte Seite blockiert, wird das betreffende Label vorübergehend **ausgeblendet**, nicht sofort umgehängt. Bei dauerhaft blockierter Seite wird erst nach **650 ms** anhaltender Blockade und **1300 ms** Seitenhaltezeit eine alternative Position erwogen; sie muss weitere **180 ms** frei bleiben.
* Wieder freie ursprüngliche Positionen werden bevorzugt. Historische Anker verfallen nach 6 Sekunden außerhalb der Projektion. Bereits sichtbare Labels haben innerhalb ihrer Kategorie einen kleinen Bestandsbonus.
* Die v9-Regeln für Kollisionen mit anderen Labels/Himmelskörpern und das Ausblenden schnell bewegter Beschriftungen (>220 Pixel/s, Wiedereinblenden <140 Pixel/s nach 140 ms) bleiben aktiv.
* Bei dauerhaftem Platzmangel wird lieber **kein** Label gezeigt als ein überlappendes oder häufig springendes Label. Objekte selbst bleiben sichtbar und auswählbar.

## 2. Smarte Zeitleiste – drei Buttons

* **Play/Pause**: startet bzw. hält die Simulation an. Der Geschwindigkeitswert bleibt auch beim Pausieren und Einstellen erhalten.
* **Geschwindigkeit**: öffnet einen vertikalen, logarithmischen Slider mit **241 diskreten Positionen** von unten langsam bis oben schnell. Der gewählte Wert wird direkt auf dem Button und im Popover gezeigt; Escape und Klick außerhalb schließen das Popover.
* **Heute**: setzt das Simulationsdatum auf die **aktuelle Systemzeit** (`Date.now()`) zurück und lässt Ansicht, Kamera, Pausezustand und Geschwindigkeit unverändert.
* Im Kopf der Zeitleiste bleiben simuliertes Datum und Uhrzeit in UTC lesbar. Der bisherige Datumspicker und der horizontale Slider sind entfernt.

| Ansicht | Minimum | Default | Maximum |
|---|---:|---:|---:|
| Sonnensystem | 1 h / s | **3 h / s** | 10 Jahre / s |
| Planetenansicht | 1 min / s | **1 h / s** | 1 Jahr / s |

Die logarithmische Positionierung nutzt zwei Segmente, sodass **beide Standardgeschwindigkeiten** exakt auf einem Slider-Schritt liegen. Die Ansichten merken sich ihre manuell gewählten Geschwindigkeiten getrennt; beim ersten Wechsel wird der jeweilige Default verwendet.

## Geänderte und neue Dateien

* `src/renderer/labels.js` – Seitenanker, Wechsel-Hysterese und Bestandsbonus.
* `src/ui/timeline.js`, `src/app.js` – neue Geschwindigkeitsbereiche, Formatierung, Play/Pause und Moduswechsel.
* `index.html`, `css/styles.css` – drei Bedienelemente, Popover, responsives Layout.
* `sw.js`, `package.json`, `server/server.mjs` – Release v10 und PWA-Cache.
* `README.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V10.md` – Dokumentation.
* `tests/smart-timeline-v10.test.mjs`, `tests/stable-labels-v10.test.mjs` – neue Tests.
* Bestehende Tests – Anpassung der erwarteten Version sowie des Datumsformats.

## Prüfung und Grenzen

Der Testlauf `npm run check` validiert die unveränderten Katalogdaten und prüft die alten UI-/Renderer-Regeln sowie die neuen Mindest-/Maximalwerte, logarithmischen Stufen, Moduswechsel und Seitenanker. Der Renderer bleibt eine **schematische astronomische Visualisierung**, keine Echtzeit-Ephemeride. Bei extrem beschleunigter Zeitsimulation oder hohem Projektionsspeed können Satelliten-Labels bewusst länger ausgeblendet bleiben.

---

<a id="release-v9"></a>

## Release v9

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

---

<a id="release-v8"></a>

## Release v8

# Sonnensystem v8.0 – echter Katalogbestand und Redaktion

## Inhalt gegenüber v7

- **123 reale neue Objekte**: 120 Planetenmonde, `(3) Juno`, `1P/Halley`, `2P/Encke`.
- **160 Objekte insgesamt**: Stern 1, Planeten 8, Monde 136, Zwergplaneten 5, Asteroiden 6, Kometen 2, künstliche Satelliten 2.
- **160 deutsche Artikel**: alle 37 bisherigen Texte erhalten und erweitert, 123 neue Texte, für 69 Objekte zusätzlicher wissenschaftlicher Hintergrund.
- **Neue Datenpakete**: neun Mond-Kategoriedateien und je eine Asteroiden- und Kometendatei; zwei zusätzliche Redaktionsdateien.
- **Loader**: Unterstützt mehrere redaktionelle Dateien pro Sprache mit globaler Duplikatprüfung; Datenherkunft und Bahnmodell werden an das UI weitergegeben.
- **Detailansicht**: Zeigt bei JPL-Importen die Einschränkungen des verwendeten Bahnmodells.
- **Offline-PWA**: Neuer Cache `sonnensystem-shell-v8`; manifestgesteuert werden alle JSON-Dateien offline gespeichert.
- **Bestehende Funktionen**: Kamera, Gesten, Pfeiltasten, Planetensystemansicht, API-Proxies und Workspace-Root bleiben erhalten.

## Quellen

- NASA/JPL – [Planetary Satellite Mean Elements](https://ssd.jpl.nasa.gov/sats/elem/sep.html)
- NASA/JPL – [Physical Parameters of Natural Satellites](https://ssd.jpl.nasa.gov/sats/phys_par/)
- NASA/JPL – [Small-Body Element Tables](https://ssd.jpl.nasa.gov/sb/elem_tables.html)
- NASA Science – Direktverweise in den einzelnen Redaktionsartikeln

### Einschränkungen

- Schematische Darstellung **keine aktuelle Ephemeride**. Bezugsrahmen der Mond-Tabellen wurden nicht vollständig transformiert. Historische Kometenbahnen unterliegen nicht der dynamischen Störungsrechnung.
- Fehlende Radien wurden nicht erfunden (`radiusKm: 0` ist ein technisches Fehlwert-Sentinel).
- Artikelstatus `imported` statt ungeprüftem `published`.
- Bei sehr vielen weiteren Objekten sind Performance-/Renderer-Optimierungen notwendig.

## Prüfschritte

`npm run check:data` validiert Katalog und redaktionelle Verweise. `npm run check` prüft auch Schemafehler, Duplikate, Loader, Layout-Logik, Bedienung, planetenzentrierte Ansicht, PWA-Offline-Dateiliste und HTTP-Auslieferung.

Das Projekt wird als **vollständiges ZIP ohne übergeordneten Ordner** geliefert und wird direkt in das Workspace-Root entpackt. Eine v7-Installation kann durch Überlagern der neuen Dateien aktualisiert werden; nicht mehr benötigte Dateien bleiben dann aber liegen. Sauberer ist ein frischer Workspace-Ordner, in den bei Bedarf die `.env` übernommen wird.

---

<a id="release-v7"></a>

## Release v7

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

---

<a id="release-v6"></a>

## Release v6

# Version 6 – Vollständige Umstrukturierung

**Ausgangsbasis:** vollständiger Projektstand v5 (mit allen vorherigen v2–v5 Änderungen). **Art:** komplette Ausgabe, **kein Delta-ZIP**.

## Änderungen

* Die ursprüngliche Root-Oberfläche wurde nach `public/` verschoben, die Stilvorlage nach `public/css/`.
* Der einst monolithische 3D-Renderer wurde in separate Module für WebGL, Shader, Geometrie, Kamerasteuerung, Umlaufbahnen, Labels sowie die beiden Darstellungsmodi geteilt.
* Startdaten, Bahnberechnung und Daten-Normalisierung sind jetzt getrennt in `src/data/` organisiert.
* Katalog, Objekt-Details, Mobilmenü, Ansichtsmodus, Zeitleistenformate und Provider-Status sind in `src/ui/` ausgelagert.
* Die Browser-API-Anbindung ist in `src/services/` untergebracht.
* Der Node-Server wurde in `server/` nach HTTP-Routing, externen Providern, Konfiguration und Cache aufgeteilt. Die Startdatei ist `server/server.mjs`.
* Die PWA-Cache-Liste enthält nun **alle** statischen Browser-Module aus `src/`; Cache-Schlüssel `sonnensystem-shell-v6`.
* Tests wurden nach `tests/` verschoben und um Integrations-, Architektur- und Sicherheitsprüfungen ergänzt.
* `.env.example` und eine `.gitignore` sind enthalten.

## Nicht geändert

Das Benutzerverhalten aus v5 bleibt erhalten: Sonnen- und Planetenansicht, natürlicher und künstlicher Satellitenkatalog, rechte Maus, Shift-Maus, Pfeiltasten, Ein-/Zwei-Finger-Gesten, Bodenebenennavigation, Zeitreise, Suchfilter, mobile Menüs, PWA und alle vier externen Datenquellen.

Die Visualisierung bleibt bewusst schematisch und ist kein wissenschaftlicher Orbit-Simulator.

## Installation / Wechsel von v5

**Nicht** einfach auf die alte v5-Dateistruktur überlagern: Die alten Root-Dateien werden in v6 nicht mehr verwendet. Stattdessen:

1. Das vollständige `Sonnensystem-v6.zip` in ein neues Verzeichnis entpacken.
2. Die eigene `.env` bei Bedarf in das neue Projektverzeichnis kopieren. Keine privaten Schlüssel ins ZIP legen.
3. `npm start` aus dem Projektverzeichnis aufrufen.
4. Im Browser `http://localhost:4173` öffnen und bei bereits installierter PWA neu laden.
5. `npm run check` ausführen, um die lokale Runtime zu prüfen.

## Testumfang

* Regressionstests aus v2–v5: 37 Startkörper, Orbitberechnung, Maus-/Touch-/Pfeiltastenbewegung, neigungsunabhängiges Verschieben, Planetenszenen, Mobile-Bottom-Sheet, Offline-PWA.
* Neue Tests: Validierung aller relativen Modul-Imports, vollständige Offline-Dateiliste, HTTP-Auslieferung, API-Status und Fehlerrouten, Schutz privater Serverdateien, Provider-Normalisierung und UI-Ausgabe.
* **Noch offen:** visueller Chromium-End-to-End-Test sowie Prüfung auf echten mobilen Geräten. Der Browserzugriff war in der aktuellen Laufzeitumgebung eingeschränkt; die Tests wurden daher ohne visuelle Behauptungen abgeschlossen.

---

<a id="release-v5"></a>

## Release v5

# Delta v5 – Planetenansicht mit Monden und Satelliten

Dieses ZIP aktualisiert ein **bestehendes Sonnensystem-v4-Projekt** auf v5. Es enthält nur Dateien, die gegenüber v4 geändert wurden, sowie den neuen v5-Test und diese Anleitung. Die Dateien `data.js`, `server.mjs`, `manifest.webmanifest`, die Icons und die v2-Tests bleiben unverändert.

## Installation

1. Das bestehende Projekt **v4** beibehalten.
2. `Sonnensystem-Delta-v5.zip` in das Projektstammverzeichnis entpacken, also dorthin, wo `app.js`, `renderer.js` und `server.mjs` liegen. Vorhandene Dateien ersetzen.
3. Seite neu laden. Bei installierter PWA gegebenenfalls ein zweites Mal neu laden, bis der aktualisierte Service Worker aktiv ist (`sonnensystem-shell-v5`).
4. Optional testen: `npm run check` (Node.js 20 oder neuer).

**Wichtig:** Nur über v4 installieren. Bei älterem Projekt vorher die Deltas v3 und v4 in der richtigen Reihenfolge einspielen.

## Neu in v5

- In den **Objektdetails eines Planeten** erscheint der Button **„Planetenansicht öffnen“**. In Details anderer Objekttypen wird dieser Button nicht gezeigt.
- Die **3D-Planetenansicht** zeigt ausschließlich den ausgewählten Planeten und alle zum jeweiligen Zeitpunkt im Atlas geladenen natürlichen Monde sowie künstlichen Satelliten des Planeten. Dazu gehören auch später nachgeladene Objekte aus Solar OpenData bzw. CelesTrak.
- Die lokale Szene benutzt eigene, nicht maßstabsgetreue Größen und Bahnradius-Skalierungen sowie einen passenden Kameraabstand, damit Begleitobjekte besser erkennbar sind. Zeitsteuerung, Zoomen, Drehen, horizontales Verschieben, Bahnen und Namen bleiben nutzbar.
- Ein Klick auf ein Begleitobjekt öffnet dessen Details **ohne** die Planetenansicht zu verlassen. Die Auswahl eines anderen Planeten wechselt direkt zu dessen System. Die Auswahl eines Objekts außerhalb des Systems führt zurück in den Sonnensystemmodus und fokussiert dieses Objekt.
- **„Übersicht“ (Kamera zurücksetzen)** wechselt **sofort** zurück zur vollständigen Sonnensystemansicht und setzt die Kamera zurück. „Heute“ setzt wie bisher ebenfalls die Kamera zurück.
- Auf Mobilgeräten schließt sich das Bottom Sheet beim Umschalten in die Planetenansicht bzw. beim Wechsel zur Übersicht, sodass die Szene bedienbar ist.
- Der Anzeigemodus wird in der Bühne benannt; auf schmalen Mobilgeräten ist der Name sichtbar, solange die Planetenansicht aktiv ist.

## Darstellungs- und Datenhinweise

Die Planetenansicht zeigt nur **im Atlas vorhandene** Monde und Satelliten, keinen vollständigen wissenschaftlichen Katalog. Bei vollen API-Katalogen werden alle geladenen Begleitobjekte dargestellt; um die Szene lesbar zu halten, sind die Anzahl der gleichzeitig beschrifteten Objekte und der gezeichneten Orbitlinien begrenzt. CelesTrak-Orbits bleiben illustrative Näherungen, keine genaue Satellitenortung. Es wurden **keine** neuen API-Endpunkte oder externen Bibliotheken ergänzt.

## Prüfungen

`npm run check` führt Syntax- und Regressionstests für v2, v3, v4 und v5 durch. Neu getestet werden unter anderem die planetenzentrierte Auswahl, die direkte Rückkehr per Übersicht, Mond- und Satellitenpositionen, Zeitfortschritt, Kamerarahmen, Rendering-Filter sowie die UI-Ereignisse des Buttons.

---

<a id="release-v4"></a>

## Release v4

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

---

<a id="release-v3"></a>

## Release v3

# Delta v3 – Sonnensystem: Kamerasteuerung

Dieses Delta baut auf **Sonnensystem v2** auf. Es ersetzt nur Dateien, die sich gegenüber dem
beigefügten Projektstand `Sonnensystem.zip` (v2) geändert haben, und ergänzt den neuen Test.

## Installation

1. Das vorhandene Sonnensystem-v2-Projekt beibehalten (nicht löschen).
2. Alle Dateien aus `Sonnensystem-Delta-v3.zip` **in das Stammverzeichnis des Projekts** kopieren
   (dort, wo `index.html`, `renderer.js`, `sw.js` und `server.mjs` liegen), vorhandene Dateien ersetzen.
3. `node server.mjs` ausführen, anschließend `http://localhost:4173` öffnen.
4. Bei bereits installierter PWA die Anwendung online neu laden. Der Service Worker wechselt auf
   Cache `sonnensystem-shell-v3`, damit die bisherige Steuerungslogik nicht offline weiterläuft.
5. Optional prüfen: `npm run check` (Node.js 20 oder neuer).

## Steuerung in v3

| Eingabe | Verhalten |
|---|---|
| Linke Maustaste ziehen / Mobil: ein Finger wischen | Ansicht drehen (wie zuvor) |
| Mausrad | Hinein- / herauszoomen (wie zuvor) |
| Rechte Maustaste ziehen oder Umschalt + linke Maustaste | In der aktuellen Kameraebene in Zugrichtung verschieben, ohne Verzögerung |
| Pfeiltasten halten | Kameraposition kontinuierlich links / rechts / hoch / runter bewegen |
| Zwei Finger spreizen / zusammenführen | Vergrößern / verkleinern nach Abstand der Finger |
| Zwei Finger gemeinsam wischen | In Wischrichtung verschieben, kombinierbar mit Pinch-Zoom |

Weitere Details:

- Bewegung orientiert sich an den aktuellen Kameraachsen. Horizontale und vertikale Züge sind
  nicht länger an starre X-/Z-Koordinaten gekoppelt.
- Manuelles Verschieben ist direkt; die animierte automatische Kamerafahrt bei Objektauswahl
  und „Übersicht“ bleibt erhalten.
- Die Zwei-Finger-Erkennung wird beim Hinzufügen oder Entfernen eines Fingers neu angesetzt;
  ein Mehrfingergestus löst keine unbeabsichtigte Objektauswahl aus.
- Pfeiltasten greifen nicht in Textfeldern, bei fokussierten Bedienelementen oder bei
  geöffneter Hilfe ein. Sondertasten-Kombinationen des Browsers bleiben unberührt.
- Die Hilfetexte, Versionsanzeige, README und der Offline-Cache wurden aktualisiert.

## Enthaltene Dateien (nur Delta)

- `renderer.js` – Maus-/Touch-Eingaben, kursorgetreue Kameraverschiebung, Pfeiltasten.
- `index.html` – Hilfe, zugängliche Kamerafläche und Versionsanzeige.
- `styles.css` – sichtbarer Tastaturfokus auf der Kamerafläche.
- `sw.js` – Cache-Version v3, damit geänderte Module zuverlässig geladen werden.
- `package.json` – Version und Testskript.
- `README.md` – Bedienung und PWA-Hinweise.
- `test-v3.mjs` – Regressionstests für Maus, Pfeiltasten, Touch und Pick-Verhalten.
- `DELTA-V3.md` – diese Änderungs- und Installationsanleitung.

Die übrigen Dateien aus v2, einschließlich `app.js`, `data.js`, `server.mjs`, Manifest, Icons
und `test-v2.mjs`, bleiben unverändert erhalten. Keine zusätzlichen Abhängigkeiten.

---

<a id="release-v2"></a>

## Release v2

# Delta v2 – Sonnensystem

Ersetzt die bisherige App-Bezeichnung „ORBITAL“ durch **Sonnensystem**, entfernt die drei Texte
„Live-Rendering / 3D Szene“, „Das Sonnensystem.“ und „Eine Reise durch Raum und Zeit“
aus der sichtbaren 3D-Ansicht und ergänzt die PWA-Funktionen sowie das mobile Bottom Sheet.

## Installation des Delta-ZIPs

1. Das ursprüngliche ZIP `ORBITAL-WebGL-App.zip` entpacken, falls noch nicht geschehen.
2. Den Inhalt dieses Delta-ZIPs **über den Ordner `helio-webgl/`** kopieren und die vorhandenen Dateien ersetzen.
3. Im Ordner `helio-webgl/` `node server.mjs` aufrufen.
4. `http://localhost:4173` öffnen und bei einem zuvor installierten App-Stand neu laden.

Das Delta enthält nur geänderte oder hinzugefügte Dateien. Die unveränderten Module
`renderer.js`, `data.js`, `test.mjs`, `.env.example` und `.gitignore` verbleiben aus v1.
Keine weiteren Dependencies. Für PWA-Installation außerhalb von localhost ist HTTPS erforderlich.

## Änderungen

- Name, HTML-Metadaten, App-Icon und Serverkennung aktualisiert
- Bisheriger Szenentitel entfernt (semantische Überschrift bleibt für Screenreader erhalten)
- Mobile Menüs unter 770 px als gemeinsames Bottom Sheet mit drei Reitern, Griff, Swipe- und Snap-Zuständen
- Mobile Menüs beim Start eingeklappt; Auswahl öffnet Details, Zeitsteuerung wird im Sheet angezeigt
- Manifest, Service Worker, PNG-Icons und Offline-Fallback für den integrierten Katalog
- Server liefert neue PWA-Dateien mit geeigneten MIME-Typen aus; API-Cache bleibt unverändert

---

<a id="hotfix-v61"></a>

## Hotfix v6.1

# Sonnensystem v6.1 - Workspace-Root / Service Worker

## Behobenes Problem

In v6 lagen `index.html`, `sw.js`, `manifest.webmanifest`, die CSS-Datei und die Icons
unter `public/`. Eine IDE-Vorschau oder ein statischer Dateiserver mit dem Workspace-Root
als Document Root kann dann `./sw.js` nicht finden ("Failed to fetch sw.js").

## Korrekturen

- Alle Dateien und Unterordner aus `public/` liegen jetzt direkt im Workspace-Root.
- `public/` entfällt. Die modularen Ordner `src/`, `server/`, `tests/` und `docs/` bleiben bestehen.
- `server/static.mjs` liest die statischen Webdateien aus dem Root und gibt weiter nur
  explizit erlaubte Pfade frei (keine `.env`, keine Tests/Serverquellen).
- Die relativen Referenzen in HTML, PWA-Manifest und Service Worker bleiben gültig.
- Die Offline-Cache-Version wurde auf `sonnensystem-shell-v6.1` angehoben.
- README, Architektur- und Regressionstests wurden aktualisiert.

## Installation

Das ZIP enthält **keinen zusätzlichen äußeren Projektordner**. Es muss direkt im
gewünschten Workspace-Root entpackt werden: `index.html`, `sw.js` und `package.json`
liegen dort auf derselben Ebene. Bei einer bestehenden v6-Installation muss der alte
Ordner `public/` entfernt werden. Danach Server oder Vorschau neu starten und die
Seite einmal neu laden; falls der alte Service Worker die Seite kontrolliert, erneut
laden oder die bisherige PWA-Installation aktualisieren.

Start mit Node.js 20+: `npm start`; Prüfung: `npm run check`.
Ohne den Node-Server zeigt ein statischer Workspace-Server die eingebauten Objekte,
aber die Endpunkte `/api/...` stehen dann nicht zur Verfügung.
