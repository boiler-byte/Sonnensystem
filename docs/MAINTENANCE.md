## v140: LOD-Wartung und Prüfung

Der LOD-Mechanismus ist im Modul `src/renderer/lod.js` zusammengefasst. Die Schwellen **32/8/2 CSS-Pixel (Durchmesser)** liegen in `LOD_DIAMETERS`; nach Änderungen an FOV, Projektion oder Body-Scale `npm run check` ausführen und `tests/object-lod-v140.test.mjs` beachten. Für LOD 0 bleiben Oberflächentexturen und das originale Shaderprogramm erhalten, LOD 1 verwendet reduzierte Geometrie und einen einfachen farbigen Lichtshader, LOD 2/3 verwenden GPU-Point-Sprites. Punkte werden nach Kugeln und vor Umlaufbahnen gezeichnet, und der dynamische Marker-Puffer wird nach jedem Bild zurückgesetzt. Bei neuem Frontend-Modul den PWA-`SHELL` in `sw.js` aktualisieren. Der Cache-Name lautet `sonnensystem-shell-v140`.

Eine messbare FPS-Steigerung ist abhängig von Szene, Hardware und Sichtbarkeit; für Vergleichsmessungen gleiche Kameraposition und dieselben Objekt-/Bahn-Layer verwenden. Für visuelle QA im Browser besonders Mondansichten, Satelliten, Saturn-Ringe, Szenenübergänge und Reihen-Hover prüfen.

## Änderung in v139

**Delta v138 → v139:** Das bisherige `detail-top` einschließlich Titel entfernt; die zugängliche `detail-index-nav` ist stattdessen als eigenständige Bediengruppe rechts oben in `detail-hero` platziert. Die Vergleichslegende nutzt den freien Bereich links davon. `src/ui/bottom-sheet.js` hängt den mobilen Pointer-Drag-Handle an `detail-hero`; bei Swipe-Klicks werden Navigation, Zoom und der Referenz-Toggle weiter geschützt. Verwaiste CSS-Regeln und Detailschreibzugriffe wurden entfernt. Tests inklusive `detail-hero-nav-v139.test.mjs`. Version `139.0.0`, Cache `sonnensystem-shell-v139`, Basis v138.

## Änderung in v130

**Delta v129 → v130:** `src/ui/bottom-sheet.js` verwendet gemeinsam genutzte Dragfunktionen für `sheet-header`, `detail-top` sowie für Abwärts-Wischgesten in `object-list` und `detail-scroll` am Scrollanfang. Bei normalem Scrollen wird nicht in die Sheet-Höhe eingegriffen; erst nach Erreichen des oberen Scrollrands wird der Touch-Drag mit `passive:false` übernommen. Die Drag-Klassen, History-Interaktion und der Kamerabedienelementabstand werden wie beim Header aktualisiert. Die beiden Scroll-Container und `detail-top` sind per ID adressierbar. `clearSceneSelection()` in `src/app/runtime.js` unterscheidet zwischen einem ersten leeren Szenenklick, der die Selektion aufhebt, und einem zweiten leeren Klick, der das bereits unselektierte mobile Sheet schließt. Version `130.0.0`, Offline-Cache `sonnensystem-shell-v130`, Basis v129.

## Änderung in v129

**Delta v128 → v129:** `clearSelection()` schaltet bei aufgehobener oder bereits leerer Auswahl zur gemeinsamen Kategorie **Objekte**. Die Bottom-Sheet-API `selectPanel('catalog')` wechselt Desktop- und Mobil-Tab, ohne einen geschlossenen mobilen Sheet zu öffnen oder einen History-Eintrag zu erzeugen. `catalogListingDistance()` berücksichtigt zusätzlich künstliche Satelliten in der ungefilterten Entfernungssortierung; die bestehende Option `useParentForMoons` bleibt für Aufrufer erhalten und gilt nun auch für Satelliten. Die Suche, aktive Planetenfilter, Probes, Datenbasis und physikalischen Detailansichten bleiben unverändert. Regressionen in `tests/selection-satellite-v129.test.mjs`, überarbeiteten v75/v127-Katalogtests und ergänztem v33-Sheet-Test. App-Version `129.0.0`, Shell `sonnensystem-shell-v129`, Basis v128.

## Änderung in v128

**Delta v127 → v128:** Entfernt sind Folgen-Toggle, Eventhandler, Status-Synchronisierung und CSS. `follow()` ist idempotent und kann das permanent eingeschaltete Folgen nicht ausschalten; `returnToStandardCamera()` zentriert bei überhöhter Objektgeschwindigkeit auf die neutrale Schräg/oben-Ansicht. `#back-to-solar` löscht zuerst UI- und Renderer-Selektion und stellt nach `updateMode()` die Standardkamera der Sonnensystemansicht her. Die frei bleibende Detail-Aktionszeile wird bei Objekten ohne Planetenansicht verborgen. Tests: `follow-overview-v128.test.mjs` sowie aktualisierte ältere Regressionen, Version `128.0.0`, Shell `sonnensystem-shell-v128`, Basis v127.

## Änderung in v121

**Delta v120 → v121:** `src/ui/event-handlers.js` sorgt beim Aktivieren der uneingeschränkten Monde (`settings.fourMoons=false`) dafür, dass die Objektkategorie `moon` über den bestehenden `updateLayerSelection`/`changeLayers`-Pfad aktiviert ist, auch wenn sie zuvor abgewählt war. Beim Ausschalten wird die Kategorie nicht zurückgesetzt. Die 8 übrigen Kategorie-Filter und die anderen vier Darstellungs-Toggles bleiben unangetastet. `css/styles.css` färbt ausschließlich `#toggle-labels[data-label-mode="points"].active` und `#orbit-visibility-btn[data-orbit-mode="galactic"].active` in blau ein. Test `tests/layer-panel-modes-v121.test.mjs`, Version `121.0.0`, Cache `sonnensystem-shell-v121`, Basis v120.

## Änderung in v120

**Delta v119 → v120:** Die fünf Toggles im Layer-Control-Panel (`index.html`) sind in zwei explizite Zeilen gegliedert. `layer-display-toggles` behält zwei Spalten für **Beschriftung/Umlaufbahn**, während die neue `layer-display-secondary` drei gleiche Spalten für **Kontrast/Beleuchtung/Monde** nutzt. Für `row-layer-options` fällt die zweite Zeile auf eine volle Spalte zurück, da dort nur Beleuchtung angezeigt wird. Die SVGs für Kontrast (Halbmond-Halbkreis) und Monde (9 unregelmäßige Punkte) ersetzen ausschließlich die Symbolgeometrie; IDs, ARIA, Events, Layerzustände und alle anderen Einstellungen sind unverändert. Test `tests/layer-control-layout-v120.test.mjs`, Version `120.0.0`, Cache `sonnensystem-shell-v120`, Basis v119.

## Änderung in v119

**Delta v118 -> v119:** Die Cinema-Verbindung zwischen Reihenobjekten in `src/renderer/cinema.js` verwendet eine deterministische kubische Bezier-Kurve statt eines linearen Kameraziels. Horizontale Kontrollpunkte liegen bei 25/75 Prozent der Strecke, Y/Z werden für einen sanften Anstieg und Rückzug bei An- und Abflug über einen doppelseitig begrenzten Bogen interpoliert. Das bisherige Smoothstep-Timing und der logarithmische Zoom bleiben. Je Objekt sind Zielkoordinaten, Haltezeit, Ausrichtung und UI-Verhalten unverändert. `cinemaSceneAt`, Slider-Scrubbing, Pause/2x und Kamera-Rückkehr nutzen weiterhin dieselbe geteilte Berechnung. Tests `tests/cinema-curve-v119.test.mjs`, Version `119.0.0`, Cache `sonnensystem-shell-v119`, Basis v118.

## Änderung in v118

**Delta v117 → v118:** `syncRowControl()` versteckt den Bahnmaßstab-Schalter in beiden Reihenmodi, ohne die für die Normalansicht gespeicherten `scaleOrbits`-Werte zu ändern. `orbitScaleActive()` schaltet den Bahnabstandseinfluss während der Reihe für Objektgrößen und Bahnberechnungen ab (einschließlich optionaler JPL-Overrides), außerhalb der Reihe bleibt die bisherige Berechnung erhalten. Cinema-Berechtigung und UI-Freigabe hängen nur noch von `row=true` ab; die laufende Kamerafahrt stoppt nicht mehr allein wegen eines anderen Maßstabswerts. Neue CSS-Farben gelten spezifisch für `data-row-mode=size` (grün) bzw. `distance` (blau). Regressionen `tests/row-controls-v118.test.mjs`, aktualisierte v53/v54 Cinema-Tests. Version `118.0.0`, Shell `sonnensystem-shell-v118`, Basis v117.

## Änderung in v117

**Delta v116 → v117:** `src/app/state.js` und `src/renderer/renderer.js` starten ohne Objektauswahl (`selected` / `selectedId` = `null`). Die Kataloginitialisierung in `src/app/runtime.js` respektiert diesen Zustand und wählt nicht das erste Objekt als Ersatz; bei tatsächlich ungültigen Nicht-null-Auswahlen bleibt die alte Fallback-Regel erhalten. Die neutralen Initial-Platzhalter in `index.html` entsprechen der Detailanzeige vor dem ersten Rendern. Sidebar und Mobile-Sheet beginnen weiterhin im Tab „Objekte“; die Kamera weiterhin bei Preset 0 „Schräg/oben“. Der globale Folgen-Schalter bleibt eingeschaltet, bekommt aber erst bei expliziter Auswahl ein Ziel. Neue Regressionen: `tests/start-defaults-v117.test.mjs`; der veraltete v115-HTML-Fixwerttest wurde aktualisiert. Version `117.0.0`, Cache `sonnensystem-shell-v117`, Basis v116.

## Änderung in v116

**Delta v115 → v116:** Die Cinema-Zeitleiste ist auf eine einzelne, rechts der Play-/2x-Tasten in einer 36-px-Spalte angeordnete Kopfzeile mit darunter liegendem Slider verkürzt. Der Text oben und die Schieberegler-Unterkante sind an die beiden Bedientasten gekoppelt, die dynamische Beschriftung „Klein/Groß“ bzw. „Nah/Fern“ entfällt vollständig. Die mobile Bottom-Sheet-Anbindung und die Cinema-Steuerlogik bleiben unverändert. Tests: `tests/cinema-timeline-v116.test.mjs`. Paket `116.0.0`, PWA-Shell `sonnensystem-shell-v116`, Basis v115.

## Änderung in v115

**Delta v114 → v115:** Das visuelle Reihen-Kameraverhalten aus v113 wird wiederhergestellt. Beim Umschalten der Reihensortierung darf der seit v114 dauerhaft eingeschaltete Folgen-Schalter eine zuvor unterbrochene Kamera-Nachführung nicht automatisch reaktivieren. Nur bei bestehendem `followedBodyId` wird die Position mitgeführt. Nach Katalog-Aktualisierungen und Szenenwechseln bleiben unterbrochene Nachführungen ebenfalls ausgesetzt; die erste Katalogladung übernimmt weiterhin das standardmäßig aktive Folgen. Cinema, Reihen-Geometrie, Blickwinkel, Kameraentfernung und die v114-UI bleiben unverändert. Regressionen in `tests/camera-row-v115.test.mjs`, Version `115.0.0`, PWA-Shell `sonnensystem-shell-v115`, Basis v114.

## Änderung in v114

**Delta v113 → v114:** Der Reihe-Schalter steht links neben Objekt; die separate Bahnkontrast-Option kehrt in die zweite Darstellungsreihe zurück. `orbits`, `galacticMotion` und `orbitContrast` werden unabhängig verwaltet, sodass Kontrast zu normalen und galaktischen Spuren schaltbar ist. `followEnabled` ist ein rein nutzergesteuerter Schalter; bei schnellem Objekt oder manueller Kameraaktion wird nur das aktuelle `followedBodyId` ausgesetzt. WebGL-Auswahl zentriert ohne Zoom, Katalog und Detail-Hero zentrieren mit Zoom. Hero-Objektbild ist ein echter Button. Tests prüfen die UI-Struktur, Umschaltzustände und Kamera-/Folgeabbruch. Version `114.0.0`, PWA-Cache `sonnensystem-shell-v114`, Basis v113.

## Änderung in v113

**Delta v112 → v113:** Die Aufnahme im galaktischen Modus speichert für alle Nicht-Sonnenobjekte jeden weiteren beobachteten Simulationsschritt, anstatt erst nach Krümmungs- oder Zeitschwellwerten einen Stützpunkt zu übernehmen. Damit wachsen auch bei langsamen äußeren Planeten und unmittelbar nach einer Geschwindigkeitsreduzierung gleichmäßig kurze jüngste Liniensegmente. Wenn das 1.000-Punkte-Limit erreicht wird, schützt `simplify(..., olderOnly=true)` die jüngsten 20 % der Historie; nur ältere Segmente werden unter Beibehaltung der v112-Fehlerkontrolle reduziert. Ein einzelnes Live-Ende bleibt reserviert, die geradlinige Sonne speichert weiterhin nur den Anfang und das aktuelle Ende. Neue Regressionen `tests/galactic-continuous-trails-v113.test.mjs`; bestehende v112-Geometrieprüfung wurde auf die konservative kumulierte Fehlergrenze abgestimmt und durch einen Test der tatsächlichen Weltkurvenabweichung ergänzt. Version `113.0.0`, Cache `sonnensystem-shell-v113`, Basis v112.

## Änderung in v112

**Delta v111 → v112:** Galaktische Spuraufzeichnung auf maximal 1.000 Punkte einschließlich des Live-Endes erweitert. Bei der kurvenabhängigen Punktaufnahme und dem Entfernen am Budgetlimit wird jetzt der vollständige Flugpfad (Sonnenbewegung plus Umlauf) genutzt. Zusätzlich fließt der projizierte Bildschirmfehler ein; Segment-Fehlergrenzen verhindern unbemerkte Kumulation gelöschter Kurven. Optimierte Wiederverwendung eines Projektionspuffers, bestehende 50/30/100-Jahre-Fenster bleiben. Neue Regressionstests unter `tests/galactic-smart-trails-v112.test.mjs`. Version `112.0.0`, Cache `sonnensystem-shell-v112`, Basis v111.

## Änderung in v111

**Delta v110 → v111:** Sternenparallaxe im galaktischen Modus: pro Stern GPU-seitig berechneter Tiefenfaktor aus dem bestehenden Abstandsradius (100–225 Einheiten). Eine einheitliche, dezente Shader-Verschiebung entgegen `galacticOffsetAt()` folgt der simulierten Zeitdifferenz seit Modeintritt. Geschwindigkeitsänderungen wirken direkt über die Simulationszeit, Pausieren lässt die Sterne stehen, Rückwärtslauf kehrt die Richtung um. Offset ist auf 8 Einheiten begrenzt und wird für Ein-/Austritt und Datumssprünge geglättet. Kein CPU-Neuaufbau des Sternbuffers. `src/renderer/galactic-parallax.js`, Renderer, Shader und Service-Worker-Paket erweitert. Version `111.0.0`, PWA-Shell `sonnensystem-shell-v111`, Basis v110. Regressionen in `tests/galactic-parallax-v111.test.mjs`.

## Änderung in v110

**Delta v109 → v110:** AR-Vier-Wege-Toggle und `devicemotion` vollständig entfernt, AR-Blicksteuerung unverändert. Galaktische Sonnenbahn auf konstante lineare Bewegung ohne Sinus umgestellt; Spurdauer: Sonne 50, innere Planeten 30, äußere und transneptunische 100 Jahre. Speicheroptimierte, kurvenabhängige Aufzeichnung mit maximal 240 Punkten pro sichtbarem Körper, ältestes Ende bleibt bis zum maximalen Zeitfenster; nicht sichtbare Layer verlieren ihre Aufzeichnung und beginnen beim erneuten Anzeigen neu. Kein Eingriff in Zeitsimulation oder Texturlogik. Version `110.0.0`, PWA-Shell `sonnensystem-shell-v110`, Basis v109. Neue Regressionen: `tests/galactic-v110.test.mjs`, ersetzter `tests/ar-motion-v106.test.mjs` sowie aktualisierte historische galaktische Tests. Keine Bilddaten im Delta.

## Änderung in v109

**Delta v108 → v109:** Der statische GitHub-Pages-Fallback lädt WebP-Texturen ohne `?v=Date.now()`; die SHA-256-Versionierung bei vorhandenem Node-Manifest bleibt. `TextureManager` behält fehlgeschlagene Objektsuchen und einzelne fehlende Texturpfade bis zum nächsten App-Neustart/manuellen Neuladen (kein Retry nach 30 Sekunden, auch nicht bei Qualitätswechsel oder Manifeständerung). Ein nicht erreichbarer optionaler Manifest-Endpunkt wird auf statischem Hosting nur einmal pro Sitzung angefragt. Erfolgreich geladene Texturen bleiben mit Node-Manifest automatisch aktualisierbar. Version `109.0.0`, PWA-Shell `sonnensystem-shell-v109`, Basis v108. Tests: `tests/texture-retry-v109.test.mjs` plus Regressionen. Keine Bilddaten enthalten.

## Änderung in v108

**Delta v107 → v108:** Die zulässigen Objekttextur-Pfade in `src/renderer/texture-sources.js` enden nur noch auf `.webp`. Dasselbe Muster verwendet das Node-Manifest / die lokale Texturroute; der Service Worker behandelt WebP-Objekttexturen weiterhin netzwerkpriorisiert, ohne andere Bildformate als Texturen zu erkennen. Ordner-Fallbacks, 2K-Dateinamens-Aliase als `.webp`, GitHub-Pages-Unterverzeichnisse und das bestehende Textur-Cache-Format bleiben erhalten. Version `108.0.0`, PWA-Shell `sonnensystem-shell-v108`, Basis v107. Keine Bilddaten enthalten.

## Änderung in v107

**Delta v106 → v107:** Objekttextur-Downloads und der optionale Textur-Manifestabruf werden relativ zur installierten App statt ab Domain-Wurzel aufgelöst. Die kanonischen `/textures/...`-Manifestpfade, Texturqualität und Offline-Speicherung bleiben erhalten. Funktioniert bei GitHub Pages unter `/Sonnensystem/`; die eigentlichen Bilddateien werden weiterhin separat bereitgestellt. `tests/github-pages-textures-v107.test.mjs` prüft verschachtelte URLs, fehlenden Manifest-Endpunkt und den Service Worker. Version `107.0.0`, Cache `sonnensystem-shell-v107`, Basis v106.

# Projektpflege und Releases

## Prüfungen

`npm run check` führt Katalogprüfung und alle Verhaltenstests aus. Neue Regressionen gehören in einen passenden Feature-Test; Versionsnummern dürfen nur an einer Stelle geprüft werden: `tests/release-contract.test.mjs` liest die Paketversion und vergleicht sie dynamisch mit HTML-Metadaten, Service-Worker-Cache und dokumentiertem Release.

Vor Auslieferung zusätzlich prüfen: ES-Module auflösbar, Offline-Shell vollständig, lokale Daten und Quellen validiert, keine toten relativen Dokumentationslinks und Delta-Paket auf Basis des **veröffentlichten** vorherigen Releases reproduzierbar. Ein automatisierter Test ersetzt keine visuelle Prüfung der tatsächlichen Oberfläche.

## Änderung in v104

**Delta v103 → v104:** Der bisherige v99-Schwarzschnitt zwischen sämtlichen Cinema-Objekten entfällt; `cinemaSceneAt()` benutzt die stetige v98-Positions- und Zoominterpolation aus `cinemaPoseAt()`. Ausschließlich der Größenreihen-Start (größter → kleinster Körper) verwendet die unveränderte Einstiegsausblendung; in der Entfernungsreihe startet stattdessen eine echte Kamerafahrt. Auch beim Stop/Ende wird das vorherige Reihenbild per `cinema`-Transition und Kameraanimation erreicht statt durch einen End-Fade. Der vertikale Zwei-Finger-Swipe in freier Sicht ist invertiert zurückgestellt (oben = oben, unten = unten), bei unveränderter Auswahl-, Maus-, Pinch- und AR-Steuerung. **Folgen** startet global aktiv und wird beim Einlesen der Katalogdaten mit dem ausgewählten Objekt verbunden; manuelles Ausschalten bleibt wirksam. Release `104.0.0`, Shell `sonnensystem-shell-v104`, Basis `103.0.0`, keine Katalog-/Schemaänderungen. Regressionen: `tests/release-v104.test.mjs`, aktualisierte Cinema- und Gestentests sowie vollständige Suite.

## Änderung in v98

**Delta v97 → v98:** Neue pure Orientierungsrechnung (`src/renderer/object-orientation.js`) dreht Planetenoberflächen entsprechend einer katalogisierten siderischen Periode in der **simulierten Zeit**. Gültige Solar-OpenData-Rotationsfelder können aktualisieren; unbekannte Perioden werden nicht geschätzt. Gebundene Monde beziehen ihre Phase aus derselben Kepler-Berechnung wie ihre Bahnen. Achsneigung und Saturnring sind gekoppelt, die Ringebene dreht sich nicht um die Planetenachse. Der Kugel-UV-Ursprung richtet equirektanguläre Karten mit Nord oben, Ost rechts und Mitte +Z aus. Die Beleuchtungsrichtung wird vor dem Shader-Einsatz in den Objektkoordinatenraum gedreht. Regressionen: `tests/object-rotation-v98.test.mjs` plus vollständige Alt-Suite. Version `98.0.0`, Offline-Cache `sonnensystem-shell-v98`, **Basis v97.0.0**. Keine Bildtexturen im Delta.

## Änderung in v97

**Delta v96 → v97:** Lokale Texturen liegen in den klar getrennten Stufen `textures/mobile` (512 px), `textures/standard` (2048 px) und `textures/high` (4096 px). WebP hat vor JPG/JPEG/PNG Vorrang, historische 2K-Namen bleiben im `standard`-Ordner verwendbar. Bei fehlenden Mobildateien wird auf vorhandene Standardbilder zurückgegriffen, die auf 512 px GPU-Breite verkleinert werden. Der neue Node-Endpunkt `GET /api/textures/manifest` veröffentlicht pro Bild SHA-256-Versionen. Der Renderer prüft regelmäßig auf Änderungen, löscht alte GPU-Handles und verhindert, dass vor einer Aktualisierung begonnene Bilddownloads wieder als aktuell erscheinen. Der Service Worker nutzt einen separaten, netzwerkpriorisierten Texturcache mit einem Offline-Eintrag pro Pfad. Der vormals defekte Download-Hilfsscript `scripts/cache-textures.mjs` listet nun lokale SHA-256-Dateiversionen via `npm run textures:list`. Kein automatischer Bilddownload oder -export. `tests/textures-v97.test.mjs` prüft Dateien, Hashes, HTTP, Fallbacks, Nachladen, Race-Bedingungen und den Service Worker. Version `97.0.0`, Shell-Cache `sonnensystem-shell-v97`, **Basis v96.0.0**. Im Delta liegen keine Bilddateien, nur Platzhalter für die drei Verzeichnisse.

## Änderung in v96

**Delta v95 → v96:** Der separate Button `orbit-contrast-btn` entfällt. Der weiterhin sichtbare `orbit-visibility-btn` nutzt über `advanceOrbitDisplayMode()` einen **Drei-Stufen-Zyklus** (`orbits:true/contrast:false` → `true/true` → `false/false`). `syncOrbitControls()` setzt den aktiven Modus, ARIA, Titel und SVG-Zustand; `src/ui/event-handlers.js` meldet jede Stufe. Das Raster der Darstellungsschalter wurde auf vier Buttons in zwei Spalten umgestellt (**Beschriftung/Umlaufbahn**, **Beleuchtung/Monde**). „Standard“ startet mit Umlaufbahn ohne Kontrast, „Alle“ mit Kontrast. Szenen behalten getrennte Einstellungen; Renderer-/Katalogdaten bleiben unverändert. Alte Tests mit zwei getrennten Buttons und 3+2-Raster wurden auf v96 aktualisiert; `tests/orbit-toggle-v96.test.mjs` prüft Zustandszyklus, Standard/Alle, Screenreadertexte, Ansichtsisolation und Anordnung. Version `96.0.0`, Offline-Cache `sonnensystem-shell-v96`, **Basis v95.0.0**.

## Änderung in v95

**Delta v94 → v95:** Der mathematisch verbliebene Maximalwert von **560px** (`Math.min(560, ...)` plus Viewport-Prozentlimit) in `rowScannerSize()` verhinderte trotz des v94-Fix tatsächlich große HUD-Radare. Die Zielgröße ist nun ausschließlich `max(160, 2 × projizierter Radius + 26)`; erst die bereits in v94 eingeführten tatsächlich verfügbaren oberen/unteren Abstände zu Objektname, Gravitation/Temperatur, Distanzpfeil und Cinema-Leiste begrenzen die Fläche. Für große Desktop-Viewports ist der Rahmen dadurch deutlich größer als 560px. `tests/row-scanner-growth-v95.test.mjs` testet das Durchwachsen der alten Obergrenze, die dynamische Endgröße und die Platzierung in Hover/Cinema. Unverändert: WebGL-Kugelradius, Messwerte, Pfeilgeometrie und CSS. Version `95.0.0`, Cache `sonnensystem-shell-v95`, **Basis v94.0.0**.

## Änderung in v94

**Delta v93 → v94:** `rowScannerSize()` in `src/renderer/row-inspection.js` begrenzt die mit dem real gezeichneten Kugeldurchmesser wachsende Scanner-Fläche anhand der verfügbaren oberen/unteren HUD-Grenzen und der projizierten Pfeillinie. Ein Abstand von 12 CSS-Pixeln verhindert Überschneidungen mit Objektname, Gravitations-/Temperaturanzeige und Distanzpfeil; die Messwertgruppe wird zusätzlich mindestens 46 px vor der Pfeillinie gehalten; Cinema berücksichtigt seinen reservierten Zeitleistenbereich. Die bisherige CSS-Mindestgröße von 160 px wird allein für den Scanner entfernt, falls der Viewport kleiner ist (die 160-px-Kugelvergrößerung bleibt bestehen). Die angezeigten Daten, Pfeilposition, 69-px-Pfeilabstand, Hover-/Cinema-Mechanik und Renderobjekte bleiben unverändert. `tests/row-scanner-clearance-v94.test.mjs` testet dynamische Größenbegrenzung, mobile/desktop Cinema-Bereiche und DOM-Positionen. Version `94.0.0`, Cache `sonnensystem-shell-v94`, **Basis v93.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v93

**Delta v92 → v93:** Die schematische Sonnengröße wird in `src/data/orbital-math.js` ausschließlich bei **Objekt aus / Bahn an** in der Sonnensystemübersicht auf **ein Drittel** reduziert. Alle anderen Objekte behalten ihre Größen; die real skalierte Umlaufbahngeometrie, die übrigen Maßstabskombinationen und die isolierte Planetenansicht bleiben unverändert. `tests/scale-v93.test.mjs` prüft die vier Maßstabskombinationen, Renderer-Radien, Orbitgeometrie und die lokale Ansicht. Version `93.0.0`, Cache `sonnensystem-shell-v93`, **Basis v92.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v92

**Delta v91 → v92:** Im Mittelpunkt-Punkt-Modus (`labels === 'points'`) entfernt `src/renderer/labels.js` das bisherige `force`-Flag, das Marker für alle sichtbaren Objekte erzwang. `drawScenePoints()` nutzt nun dieselbe Schwelle wie normale Labels: **nur projizierter Radius unter 2,2 CSS-Pixel**, bei selektierten Objekten unabhängig von der Größe ein **2,6-Pixel-Marker in Selektionsfarbe** und der Selektionsring. Der Saturn-Ring wird in der Reihenansicht in beiden Modi gleichermaßen berücksichtigt. Unverändert: Kategoriefarben, keine Texte im Punktmodus, Unabhängigkeit vom orbitalen Text-Geschwindigkeitsfilter und von der Vierer-Textlabelgrenze. Aktualisierter v87-Test und vier neue Regressionen unter `tests/label-points-v92.test.mjs`. Version `92.0.0`, Cache `sonnensystem-shell-v92`, **Basis v91.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v91

**Delta v90 → v91:** `src/renderer/cinema.js` setzt die Haltezeit für **jeden** Reihen-Cinema-Stopp auf **5000 ms** (bisher planetenspezifisch 3000 ms, sonst 1500 ms), behält aber Reisezeit, Pause, Scrubbing und den unabhängigen 2x-Modus bei. Die bisherige Planetenkonstante bleibt als Alias auf den neuen einheitlichen Wert kompatibel. In `src/ui/object-details.js` wird die letzte Tab-Auswahl `Daten`/`Wissen` beim manuellen Umschalten sicher in `localStorage` abgelegt und beim Start geladen; Standard bei fehlender Auswahl ist `Daten`. `src/app/camera-controller.js` und `src/ui/event-handlers.js` setzen den Tab bei Objekt-, Auswahl- und Szenenwechseln nicht mehr zurück. Fehler beim Speicherzugriff behindern die Nutzung nicht. Bestehende Cinema-Tests wurden auf 5 Sekunden angepasst; `tests/cinema-detail-memory-v91.test.mjs` prüft Zeitablauf, Varianten der Objekttypen, Tab-Wiederherstellung und blockierten Speicher. Version `91.0.0`, Cache `sonnensystem-shell-v91`, **Basis v90.0.0**. Katalog, Texturen, CSS und APIs unverändert.

## Änderung in v90

**Delta v89 → v90:** Die Objektkategorie-Auswahl zeigt statt zehn nur noch acht Checkboxen. `src/data/layers.js` definiert `LAYER_FILTER_TYPES` und die Paargruppen `asteroid + binary` sowie `dwarf + tno`. `updateLayerSelection` schaltet beide Mitglieder jeder Gruppe gemeinsam; der Renderer arbeitet weiterhin mit den zehn ursprünglichen Datentypen, einschließlich Kategoriepunkten und genauen Detailnamen. Das Layer-Panel zeigt die Gruppen mit den sichtbaren Titeln **Asteroiden** und **Zwergplaneten**; eine bisher nur teilweise ausgewählte Gruppe kann gemischt dargestellt werden. Presets, verfügbare Layer pro Planetenansicht und Layer-Summary sind entsprechend angepasst. Frühere DOM-Erwartungen wurden aktualisiert und die neue Suite `tests/grouped-layer-filters-v90.test.mjs` ergänzt. Version `90.0.0`, Cache `sonnensystem-shell-v90`, **Basis v89.0.0**. Keine Änderungen an Katalog, Texturen oder API.

## Änderung in v89

**Delta v88 → v89:** Die mobile Cinema-Zeitleiste verwendet keine feste `bottom:131px`-Position mehr. Sie übernimmt die von `src/ui/bottom-sheet.js` gemessene Höhe `--sheet-visible` und liegt dadurch bündig an der Oberkante des mobilen Sheets, auch beim Wechsel der Snapstufe und bei Drag-Gesten. Die Timeline erhält mobil `z-index:37` und liegt damit vor den AR-/Perspektive-Buttons (`z-index:36`), aber hinter dem Sheet (`z-index:40`). Übergänge folgen der Sheet-Animation; Drag und reduzierte Bewegung deaktivieren Übergänge. Desktop-Position, Cinema-Wiedergabe, 2x und Pause bleiben unverändert. Neue Tests in `tests/cinema-mobile-timeline-v89.test.mjs`; der bestehende Bottom-Sheet-Test prüft die dynamische Höhen- und Drag-Synchronisation. Version `89.0.0`, Cache `sonnensystem-shell-v89`, **Basis v88.0.0**. Keine Daten-/API-Änderungen.

## Änderung in v88

**Delta v87 → v88:** **Daten** ist der standardmäßig sichtbare und ARIA-selektierte Objektdetails-Tab (HTML-Startzustand und Initialisierung in `src/ui/event-handlers.js`). Der Desktop-Scrollbereich `.detail-scroll` reserviert mit `scrollbar-gutter:stable` bei Breiten über 770 px dauerhaft den Scrollleistenplatz, um seitliches Springen beim Wechsel nach **Wissen** zu vermeiden. Die Cinema-Tour verwendet mit Body-Typen **3000 ms für Planeten und Zwergplaneten**, für alle übrigen Körper unverändert 1500 ms. Rechts neben dem Play/Pause-Button schaltet ein `2x`-Button die reine Cinema-Uhr auf doppelte Geschwindigkeit und zurück (Pause/Scrubbing/Simulationszeit unabhängig). Neue Tests: `tests/detail-cinema-v88.test.mjs`, ältere Cinema-Zeit-Erwartungen aktualisiert. Version `88.0.0`, Offline-Cache `sonnensystem-shell-v88`, **Basis v87.0.0**. Keine Katalog-, Textur- oder API-Änderungen.

## Änderung in v87

**Delta v86 → v87:** Beschriftung schaltet über `src/ui/event-handlers.js` und `src/ui/display-controls.js` durch **An / Planetenpunkt / Aus**. `'points'` ist ein expliziter dritter Wert in den bereits ansichtsspezifischen `labels`-Einstellungen. `src/renderer/labels.js` zeichnet in diesem Modus alle sichtbaren Objektmittelpunkte in den Kategoriefarben ohne Text, wobei das ausgewählte Objekt weiterhin einen goldfarbenen Mittelpunkt und einen Selektionsring trägt. Im Modus `false` bleibt die Label-Ebene leer; in `true` greifen die v86-Bahngeschwindigkeits- und Vierer-Textlabelregeln unverändert. Ein neues SVG im `index.html` wird abhängig von `data-label-mode` durch CSS anstelle des Textlabel-Icons eingeblendet. Der eigene **„Sonnensystem“**-Button liegt oben links und übernimmt die einzige explizite Rückkehr aus einer isolierten Planetenansicht. Der Kamera-Button verwendet in jeder Szene `cycleCameraPerspective({keepPlanetScene:true})`; AR wird nach beiden Aktionen neu ausgerichtet. Neue Tests in `tests/label-points-navigation-v87.test.mjs`, ältere Toggle-/Kamera-Regressionen angepasst. Version `87.0.0`, PWA-Cache `sonnensystem-shell-v87`, **Basis v86.0.0**. Katalog, Bildtexturen und externe APIs unverändert.

## Änderung in v86

**Delta v85 → v86:** Die simulierte Bewegung eines Objekts relativ zu seinem Parent wird pro Frame unter einer unveränderten aktuellen Kameraprojektion in **CSS px/s** gemessen (`src/renderer/labels.js`). Die Schwellwerte **190 px/s ausblenden** und **135 px/s wieder anzeigen** verhindern unlesbare schnell umlaufende Labels ohne Kameraschwenks als Ursache zu werten. Pausierte Zeit, unrealistische manuelle Datumsprünge, Szenen-/Layouttransitionen und die Reihendarstellung lösen keine Ausblendung aus. Mittelpunktmarker kleiner Objekte sowie der Punkt und Ring einer Selektion bleiben bei ausgeblendetem Namen sichtbar. Im Sonnenüberblick werden auch bei aktiviertem **„Alle Monde“** höchstens vier direkte Begleiter-Labels je Planet/Zwergplanet angezeigt, nach Radius sortiert, natürliche Monde und Satelliten gemeinsam; bei Auswahl eines kleineren Objekts ersetzt es Rang vier. Der Filter gilt nicht in einer isolierten Planetenansicht und verändert keine 3D-Objekte. Der historische Export `solarMoonLabelIds()` bleibt erhalten. Neue Testfälle: `tests/smart-labels-v86.test.mjs`, aktualisierte v9-Regression; kein Eingriff in Katalog, Texturen oder API. Version `86.0.0`, Cache `sonnensystem-shell-v86`, **Basis v85.0.0**.

## Änderung in v85

**Delta v84 → v85:** `src/renderer/labels.js` entfernt die bisherige Bildschirmgeschwindigkeits-Hysterese vollständig, einschließlich `LABEL_MOTION`, `isTooFast`, Positionsbeobachtungen und der Filterbedingung für schnelle, nicht selektierte Objekte. Sichtbare Labels bleiben auch bei sehr schnellen Kamerabewegungen und Animationen ohne erneute Einblendverzögerung gezeichnet. Unverändert sind stabile Seitenanker, Viewport-Grenzen, die manuellen Label-/Layer-/Vier-Monde-Schalter, das Reihen-Hover-HUD, Kollisionsfreiheit sowie die Mittelpunkt-/Selektionsmarker aus v84. Neue Tests in `tests/label-speed-v85.test.mjs` sowie korrigierte Bewegungs-Regressionstests aus v9–v11 und v83. Version `85.0.0`, Offline-Cache `sonnensystem-shell-v85`, **Basis v84.0.0**. Katalog, Texturen und APIs bleiben unverändert.

## Änderung in v84

**Delta v83 → v84:** In `src/renderer/labels.js` entfällt der bisherige Punkt vor dem Labeltext. Stattdessen rendert die Beschriftung einen Mittelpunkt-Marker direkt im gelabelten Objekt, sobald dessen projizierter Radius kleiner als der Marker wäre. Der Marker verwendet die Kategoriefarbe aus `CATEGORY_COLORS`; für selektierte Objekte ist derselbe Marker immer sichtbar und nutzt die Selektionsfarbe `#e7b979`, unabhängig von der dargestellten Objektgröße. Der bestehende Selektionsring, die kollisionsfreie Label-Platzierung, Bewegungsfilter und Layer-/Vier-Monde-Regeln bleiben unverändert. Der neue Regressionstest `tests/label-markers-v84.test.mjs` sichert Kategorie-Marker, Wegfall des führenden Textpunkts und das immer sichtbare Selektionszentrum ab. Version `84.0.0`, Offline-Cache `sonnensystem-shell-v84`, **Basis v83.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v83

**Delta v82 → v83:** Der verbliebene Label-Dichtefilter in `src/renderer/labels.js` wird restlos entfernt (maximal zwei nicht ausgewählte Labels pro 160 × 110 CSS-Pixel, stabilisierte Rasterzellen, Dichte-Prioritätsauswahl). Damit werden auch bei voll überlappenden Beschriftungen sämtliche berechtigten Labels platziert. Die Priorität bestimmt nur noch die Zeichenreihenfolge; das ausgewählte Label liegt oben. Seitenanker, Viewport-Grenzen, Geschwindigkeitsfilter, manuelles Abschalten, Layer-/Vier-Monde-Steuerung und Reihen-HUD bleiben erhalten. Die früheren `tests/label-density-v16.test.mjs` und `tests/smart-labels-v9.test.mjs` wurden auf den neuen Sollzustand aktualisiert; `tests/label-collisions-v83.test.mjs` sichert dichtes Überlappen gegen Regressionen ab. Version `83.0.0`, Offline-Cache `sonnensystem-shell-v83`, **Basis v82.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v82

**Delta v81 → v82:** Zwei monotone, AU-gestützte Szenenmaßstäbe ersetzen die bisherige Wurzelverteilung bei `Bahn aus` im Sonnenüberblick: gleichmäßige 2,25 Einheiten zwischen den acht schematischen Planetenbahnen; optimierte Abstände zwischen 19,5 und 67 Szeneneinheiten mit nach außen verschobenen inneren und verdichteten äußeren Orbits. Die Sonne wird in der optimierten Kombination **Objekt an / Bahn aus** exakt dreimal so groß wie in v81, ohne die bisherigen Planetengrößen und die separate Reihe/Cinema zu verändern. Live-/JPL-Vektoren erhalten denselben Halbachsenmaßstab wie die Keplerbahnen. Die Fälle `Bahn an`, lokale Planetenansicht und Reihenlayout bleiben unverändert. Ergänzt wurden `tests/scale-v82.test.mjs` sowie die v82-konformen Erwartungen älterer Maßstabs-Tests. Version `82.0.0`, Offline-Cache `sonnensystem-shell-v82`, **Basis v81.0.0**. Update enthält nur die modifizierten und neuen Dateien.

## Änderung in v81

**Delta v80 → v81:** Hover-Pfeilabstand unter dem Körper von 23 auf 69 CSS-Pixel verdreifacht; Spitze auf den nahen projizierten Parent-Außenrand versetzt, mit Clipping bei Eltern außerhalb des Viewports. Das HUD verzichtet auf die seitliche Objektanalysekarte, platziert den cyanfarbenen Namen oberhalb des Körpers und stellt unterhalb Gravitation links und Temperatur rechts ohne Labels mit `physicalStatIcon('gravity')` und `thermometerIcon('mean')` dar. Cinema erhält einen eigenen, vom Simulations-Play entkoppelten Pause-/Fortsetzen-Button; der Scanner erscheint während tatsächlich eingeschwungener Kamera-Haltephasen und nicht bei Übergang, Scrubbing oder Kameranachlauf. `tests/row-cinema-v81.test.mjs` sichert Geometrie, Layout, Icons und Wiedergabesteuerung ab; überholte v78–v80-DOM- und Pfeil-Erwartungen wurden an den aktuellen Sollzustand angepasst. Version `81.0.0`, Offline-Cache `sonnensystem-shell-v81`, **Basis v80.0.0**. Das Delta enthält ausschließlich geänderte und neue Dateien; der Katalog bleibt unverändert.

## Änderung in v80

**Delta v79 → v80:** Das Hover-HUD zeigt in `index.html` und `src/ui/row-inspection.js` den tatsächlichen Durchmesser im oberen Messrahmen statt des „Scan aktiv“-Textes. Der verbreiterte Rahmen und seine Pfeilspitzen werden per CSS animiert; das Textlabel vor dem Abstandswert entfällt. `src/renderer/row-inspection.js` führt die horizontale Parent-Markierung bis zur Bildschirmposition des Zentrums bzw. bis zum nächstgelegenen Rand (keine 300px-Grenze). Bei aktivem AR ruft die Fokussierung eines Katalogobjekts sowie der explizite Button „Planetenansicht“ die bestehende Methode `alignToPerspective()` auf. Dadurch bleibt die bestehende DeviceOrientation-Sitzung samt Permission erhalten. Tests: `tests/row-hover-ar-v80.test.mjs` und angepasste DOM-Fakes in den v78/v79-Regressionssuiten. Version `80.0.0`, Cache `sonnensystem-shell-v80`, Basis `79.0.0`.

## Änderung in v79

**Hotfix v78 → v79:** Das Pfeil-SVG in `src/ui/row-inspection.js` wurde beim ersten Rendern durch `hidden` unterdrückt; `.hidden = false` entfernte das Attribut am SVG nicht. Stattdessen wird das Attribut nun explizit gesetzt und entfernt. CSS kennzeichnet das eingeblendete SVG als Blockelement. Der neue Regressionstest `tests/row-inspection-svg-v79.test.mjs` modelliert diese unterschiedliche DOM-Semantik und stellt sicher, dass Sichtbar-/Unsichtbarschalten bei gültigen und fehlenden Entfernungswerten funktioniert. Versionsmetadaten und Offline-Cache auf v79 erhöht. Keine Änderung an den Katalogdaten, Layoutpositionen oder der Cinema-Logik.

## Änderung in v78

**Delta v77 → v78:** `src/renderer/row-inspection.js` kapselt WebGL-konforme Zeigerhitprüfung, die mindestens 160 px große Hover-Kugel, physikalische Messwertformatierung und Parent-Pfeilrichtung. `src/renderer/renderer.js` verwaltet Hover-Tween, Zeichengrößen und Ringproportionen; `src/renderer/controls.js` leitet nur echte Maus-/Stift-Hover-Koordinaten weiter. `src/ui/row-inspection.js` aktualisiert eine pointer-transparente SVG/HTML-Messebene im neuen `index.html`-Viewport mit Animationsstilen aus `css/styles.css`. Der v78-Test prüft Anvisieren, Umschalten/Verlassen, 160px-Grenze, echte Parent-Distanzen, G/°C-Formatierung und SVG-Pfeil. `src/app/animation-loop.js` synchronisiert die UI pro Renderframe; `sw.js` cached beide neuen Clientmodule unter `sonnensystem-shell-v78`. Der Objektkatalog bleibt identisch; Delta-Basis **v77.0.0**.

## Änderung in v77

**Delta v76 → v77:** `css/styles.css` begrenzt die Temperaturkachel auf eine normale Gridspalte und zeigt Min/Max ohne abgeschnittenes Zweispaltenlayout. `index.html` tauscht die Tab-Reihenfolge, `src/ui/event-handlers.js` passt die Home-/End-Navigation an. Die Reihenmodi in `src/app/animation-controls.js` verwalten jetzt Größe und Entfernung zusätzlich zum Aus-Zustand. `src/renderer/renderer.js` filtert beim Reihenrendern auf das aktuelle Zentrum und seine direkten Kinder mit positivem bekanntem Radius; `src/renderer/transitions.js` sortiert bei Entfernung nach mittlerer Parent-Distanz. In Cinema bleibt die Entfernungsreihe räumlich unverändert, während die bisherige kleine-zu-große Größenrunde erhalten bleibt. `rowGeometry()` schließt unbekannte Größen aus, daher gibt es keine Cinema-Leerstopps. Rückwärtskompatibles Katalogschema; Release `77.0.0`, Cache `sonnensystem-shell-v77`, Basis `76.0.0`. Neue v77-Regressionstests decken die Reihenfolge, Kamera und Details ab.

## Änderung in v76

**Delta v75 → v76**: Reine Darstellung der Temperaturkachel im Daten-Tab. Die schwarze, halb gefüllte Mittelwert-Thermometerform verzichtet auf den bisher hellen Hintergrund; eine helle Kontur hält sie auf dunklen Karten sichtbar. `src/ui/object-details.js` blendet nicht vorhandene Min.-/Max.-Zeilen aus und gruppiert die vorhandenen rechts vom Mittelwert. `css/styles.css` richtet diese Werte in einer kompakten vertikalen Spalte aus, einheitlich auf Desktop und im Mobile-Sheet. Kein Eingriff in Berechnung, Datenschema oder Katalogwerte. Regressionstests unter `tests/object-temperature-v76.test.mjs` und angepasste Styling-Erwartung in der v74-Testsuite. Release `76.0.0`, Cache `sonnensystem-shell-v76`, Basis `75.0.0`.

## Änderung in v75

**Delta v74 → v75**: Anpassung der Entfernungssortierung und der rechten Maßeinheit im Katalog, ausschließlich in `src/ui/object-list.js`. Die interne Sortierskala bleibt AE, angezeigte Entfernungen bis einschließlich `0,2 AE` werden in km formatiert. Monde übernehmen bei leerer Suche und **inaktivem** Planetenfilter die Entfernung ihres direkten Elternkörpers sowohl für die Sortierung als auch die Katalogzeile. Mit Suchtext oder aktivem Planetenfilter verwenden sie ihren eigenen Orbitabstand. Sonnenübersicht: der Planetenfilter gilt trotz gespeicherter Toggle-Einstellung als inaktiv. Fehlende Messwerte bleiben `—`; Katalogdaten, -schema und Objektdetails unverändert. Tests: angepasste v73-Sortiertests und `tests/catalog-distance-v75.test.mjs`; Release `75.0.0`, Cache `sonnensystem-shell-v75`, Basis `74.0.0`.

## Änderung in v74

**Delta v73 → v74**: UI-only-Änderung ohne Katalogmigration. Im `Daten`-Tab stehen die verwandten Objekte zuerst. Der `related-overflow` ist ein Button; er ruft eine vom `catalog-controller` bereitgestellte Navigation auf, um den aktuellen Elternobjektnamen in die Suche zu schreiben und die Katalogansicht auf Desktop/Mobil zu aktivieren. Der parent-sensitive Suchindex liefert die betreffenden Kinder. SVG-Messicons und drei Thermometerfüllstände liegen in `src/ui/physical-stat-icons.js`; in `src/ui/object-details.js` werden sie zusammen mit den Werten in einer konsistenten Kachelstruktur gerendert. G-Umrechnung erfolgt **ausschließlich für die Anzeige** über `displaySurfaceGravity`, Datenbasis bleibt m/s². Neue v74-Regressionstests prüfen SVGs, Temperatur, Einheiten, Related-Button und Tab-Navigation. `sw.js` precacht das neue Icon-Modul und verwendet `sonnensystem-shell-v74`. Zielrelease `74.0.0`; Basis `73.0.0`.

## Änderung in v73

**Delta v72 → v73**: Sortierbutton anstelle der Katalogüberschrift: Standard (alte Featured-Reihenfolge bzw. Suchrelevanz), Entfernung aufsteigend und Größe absteigend. Entfernung = mittlere Parent-Distanz, nach AE umgerechnet; Größe = Durchmesser in km, abgeleitet aus Katalogradius. Fehlende, ungültige und 0-Placeholder-Werte bleiben als `—` erkennbar und werden ans Ende sortiert. Rechts am Eintrag erscheint die aktive Maßeinheit. Die Steuerung liegt in `src/ui/object-list.js`, `src/ui/event-handlers.js`, `src/app/state.js` und `index.html`, mit gemeinsamen CSS für Desktop und Mobile-Sheet. Der Planetenfilter ist beim erfolgreichen Öffnen eines Planeten-/Zwergplanetensystems aktiviert, bleibt aber ausschaltbar. Katalogschema und -inhalte unverändert: `10.1.0` / Schema `1`; Release `73.0.0`, Cache `sonnensystem-shell-v73`. Delta-Archiv enthält nur die Unterschiede gegenüber dem veröffentlichten v72-Stand (v71 + Delta v72).

## Änderung in v72

**Delta v71 → v72**: 39-%-Snap für `mobile-sheet`, dynamisches Rezentrieren anhand des real sichtbaren Canvas-Ausschnitts in allen Kamerazuständen (einschließlich Drag-Gesten). Bei geschlossener Kopfzeile ist das Offset null; bei geöffnetem Sheet folgt es der tatsächlichen Bildschirmgeometrie. Physikalische Katalogfelder (optionale Temperatur-Min./Max./Mittel-K, Druck-Pa, Gravitation m/s² und mittlere Parent-Distanz) sind validiert und im Daten-Tab sichtbar; unbekannte Daten werden nicht gefüllt. Modell-Abstände folgen den Bahnelementen auch nach Live-Updates. NASA/NSSDCA-Beispieldaten betreffen 12 Objekte. `catalogVersion: 10.1.0`, Release `72.0.0`, PWA `sonnensystem-shell-v72`; Delta-Archiv enthält ausschließlich neue bzw. geänderte Dateien relativ zum veröffentlichten v71-Archiv.

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
