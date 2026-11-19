# Architektur – Sonnensystem v80

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
- Texturen kommen aus erlaubten lokalen Pfaden unter `textures/standard/`; fehlen diese Dateien, verbleiben schematische Materialien. Ladevorgänge und GPU-Ressourcen werden aufgeräumt.
- Die 2D-Label-Ebene priorisiert Auswahl und begrenzt gleichzeitige Beschriftungen.
- Im Hintergrundtab pausiert die Animation, ohne Simulationszeit nachzuholen.
- `cycleCameraPerspective()` steuert eine vom Layoutübergang getrennte 1.050-ms-Kamerafahrt (`cameraFlight`) über Blickrichtung, Position und Distanz. `cameraView()` nutzt in dieser Zeit die interpolierte Pose; währenddessen dürfen Layout-/AR-Updates die Fahrt nicht überschreiben. Ein manueller Eingriff kann sie bildsprungfrei beenden. Bei reduzierter Bewegung wird sie übersprungen.
- Freies Umschauen per Zwei-Finger-Wischen invertiert nur die vertikale Touch-Mittelpunktsbewegung, bevor sie an `lookAroundFixedEye()` übergeben wird. Maus-Umschauen, Pinch-Zoom und objektbezogene Gesten bleiben unberührt. Im AR-Modus wird die ursprüngliche, **nicht invertierte** relative Sensorrotation verwendet (Gerät nach oben = Blick nach oben); während eines Kameraflugs wird die Sensorausrichtung laufend neu verankert, ohne den Flug zu überschreiben.

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

## Reihenmessung und AR-Navigation (v80)

Der Reihen-Scanner nutzt weiterhin CSS-Pixel und die Projektion des aktuellen Frames. `rowArrowGeometry` projiziert das Parent-Zentrum in den Bildschirmraum und beschränkt die X-Spitze nur noch auf `[0, viewportWidth]`: Bei sichtbarem Zentrum trifft der Pfeil dessen X-Position, sonst den jeweiligen Bildschirmrand. Die reine Längenbegrenzung der Vorversion wurde entfernt. Das unter dem Objekt platzierte Distanzlabel enthält nur den Zahlenwert. Die SVG-Scannerfläche nutzt verbreiterte Winkelmarkierungen sowie eine animierte horizontale Breitenmessung mit Pfeilspitzen; der Durchmesser aus `rowInspectionMetrics` wird im Hauptscanner angezeigt. Der restliche Messkarteninhalt bleibt unverändert.

Bei aktiver AR-Sensorsteuerung verankern `selectBody(id, true)` im `camera-controller` und der „Planetenansicht“-Handler nach dem Ansichtswechsel die aktuelle Gerätehaltung mit `arMode.alignToPerspective()` neu. So übernimmt die Sensorblickbasis die neue Orbit-Perspektive, ohne AR zu deaktivieren oder erneut Berechtigungen anzufordern. Bei nicht aktiviertem AR und bei Auswahl ohne Fokus erfolgt keine Neuausrichtung. Tests: `tests/row-hover-ar-v80.test.mjs`.

## SVG-Abstandspfeil: Sichtbarkeit (v79)

Das initial verborgene `row-inspection-vector-svg` ist ein SVG-Element, kein `HTMLElement`. Das DOM-Attribut `hidden` muss für den sichtbaren Zustand explizit mit `removeAttribute('hidden')` entfernt und beim Ausblenden mit `setAttribute('hidden', '')` gesetzt werden. `svg.hidden=false` reicht nicht aus, da das SVG sonst weiterhin die CSS-Regel `[hidden]{display:none!important}` erfüllt. Ein Regressionstest nutzt ein SVG-attributgetreues DOM-Mock; die zugehörige Entfernungsanzeige und die Pfeilrichtung bleiben unverändert. Offline-Cache: `sonnensystem-shell-v79`.

## Sci-Fi-Reiheninspektion (v78)

Nur im stabilen Reihenmodus erkennt `src/renderer/controls.js` ungedrückte Maus-/Stiftbewegungen über dem WebGL-Canvas. `src/renderer/row-inspection.js` projiziert die gezeichneten Körper und wählt den getroffenen echten Kugelbereich (mit kleiner Touch-/Zeigertoleranz), **nicht** ein unsichtbares 160px-Hitfeld. `SolarRenderer.advanceRowInspection()` verarbeitet den Zustand bei jedem Renderframe und vergrößert allein den WebGL-Zeichenradius des Körpers bei Hover weich auf mindestens 160 CSS-Pixel Durchmesser; `rowGeometry()` und damit Positionen, Sortierung sowie die Cinema-Ziele bleiben unverändert. Saturns Ring wird beim Hover im gleichen Verhältnis vergrößert. Nach Verlassen des Planeten verkleinert sich die Kugel weich. Während einer Messanzeige übernimmt das HUD den Objektnamen anstelle des normalen Canvas-Labels.

`src/ui/row-inspection.js` verwendet eine **pointer-events:none**-Ebene im Viewport. Ein transparenter SVG-Scanner, eine kompakte Messkarte (Durchmesser/km, Gravitation/G, mittlere Temperatur/°C) und ein SVG-Pfeil mit Richtung zum projizierten Parent werden in Canvas-CSS-Pixeln positioniert. Der Pfeil fährt zeitbasiert **vom Körper zum Parent** aus, sein Entfernungslabel steht unter dem Körper. Die physikalische Distanz stammt unverändert aus dem Katalog (`meanDistanceToParent`, sonst `a`) und wird bis 0,2 AE in km, darüber in AE formatiert; unbekannte Werte werden als `—` dargestellt (kein Pfeil). Bei Cinema, AR, Ziehen, Szenen-/Layoutübergängen und außerhalb der Reihe bleibt das HUD aus. Ein reduzierter-Bewegung-Modus deaktiviert CSS-Dekoration und setzt den Vergrößerungsfaktor ohne Tween. Neue Dateien sind im Service-Worker-SHELL eingetragen; Cache `sonnensystem-shell-v78`.

## Offline-PWA

`sw.js` liegt im Projektstamm und verwendet `sonnensystem-shell-v80`. Bei Installation werden die App-Shell und alle im Katalog-Manifest referenzierten JSON-Dateien gecacht; große Bildtexturen werden nur beim Abruf abgelegt. Beim Aktivieren werden ältere `sonnensystem-shell-*`-Caches entfernt. Da alte Servicer-Worker-Installationen noch frühere Assets enthalten können, nach Updates neu laden.

## Server und Sicherheit

Der statische Server erlaubt nur definierte Root-Assets, auflösbare Frontend-ES-Module, gültige Datenpfade und erlaubte lokale Texturen. Serverkonfiguration, `.env` und Testdateien werden nicht als Browserressourcen ausgeliefert. API-Zugangsdaten bleiben serverseitig; Antwortdaten externer Dienste werden nicht für Offline-Betrieb garantiert.

## Tests und Wartung

`npm run check` validiert den vollständigen Katalog und startet die Node-Regressionssuite in `tests/*.test.mjs`. Die historisch benannten Feature-Suites bleiben erhalten, damit Fehler in Kamera, AR, Darstellung, Katalog und mobilem UI weiterhin erkannt werden. Die **Release-Metadaten** (Paketversion, HTML-Meta und Cache), PWA-Assets und aktuelle Dokumentationslinks werden dagegen in `tests/release-contract.test.mjs` zentral geprüft; die Feature-Tests sind von einer fest einkodierten Release-Nummer befreit. Neue Funktionsänderungen erhalten eigenständige Verhaltenstests.

Weitere Informationen: [Datenarchitektur](DATA-ARCHITECTURE.md), [Projektpflege](MAINTENANCE.md), [Versionshistorie](RELEASE-HISTORY.md).
