# Sonnensystem – interaktiver 3D-Atlas (v106.0.0)

Browserbasierter Sonnensystematlas mit WebGL, lokalem Katalog, deutschsprachigen Objektartikeln, Planetenansichten, AR-Blicksteuerung und Offline-PWA. Kein Frontend-Buildprozess und keine Laufzeit-Abhängigkeiten aus npm.

## Start und Prüfung

Voraussetzung: **Node.js 20 oder neuer**. Im Projektverzeichnis:

```sh
npm start
```

Anschließend `http://localhost:4173` öffnen. Optional kann `PORT` in `.env` konfiguriert werden; `.env.example` zeigt die unterstützten Variablen. Für optionale externe Datendienste sind Kontaktdaten oder API-Schlüssel erforderlich. Lokale Katalog- und Redaktionsdaten funktionieren ohne diese Dienste.

```sh
npm run check         # Katalogvalidierung und komplette Regressionstests
npm run check:data    # Nur Katalog und redaktionelle Daten prüfen
npm run textures:list # Lokale Texturen und ihre SHA-256-Versionen anzeigen
```

## Aktuelle Funktionen

- **Szenen:** Sonnensystemübersicht und Planeten-/Zwergplanetensysteme; Objektfokus, standardmäßig aktiviertes **Folgen** des ausgewählten Körpers und drei Kameraperspektiven. Die Nachführung lässt sich in den Objektdetails ausschalten.
- **Kamera:** Maus, Touch und Tastatur; freie Perspektive mit Zwei-Finger-Umschauen (unten = Blick nach unten, oben = Blick nach oben); gleitende Fahrten beim Perspektivwechsel per Kamerataste **innerhalb der aktuellen Ansicht**. In isolierten Planetensystemen führt ein separater Button **„Sonnensystem“** oben links zurück; optional AR-Blicksteuerung mit natürlicher vertikaler Sensorbewegung (nur auf geeigneten Geräten in sicherem Kontext).
- **Darstellung:** acht gemeinsam schaltbare Kategorie-Filter (Asteroiden inklusive Doppelasteroiden; Zwergplaneten inklusive transneptunischen Objekten) bei weiterhin getrennten wissenschaftlichen Objekttypen; Beschriftung in drei Modi (Namen und Punkte → nur Planetenpunkte → Aus), Beleuchtung und Monde sowie ein Umlaufbahn-Button mit vier Stufen im Sonnensystem (Umlaufbahn → Umlaufbahn + Bahnkontrast → Galaktische Bewegung → Aus) und drei Stufen in Planetenansichten; getrennte Ansichts-Einstellungen.
- **Maßstab:** Objektgrößen, Bahnabstände sowie drei Reihenmodi **Aus → Größe (groß bis klein) → Entfernung (nah bis fern)**. Die Reihe enthält nur das Zentralobjekt der Ansicht und seine direkten Kinder mit bekanntem Radius. Beim Maus-Hover wird ein kleiner Körper bis mindestens 160 px Durchmesser vergrößert und erhält einen animierten Sci-Fi-Messrahmen mit dem Durchmesser oben und darunter zwei ikonbasierten Messwerten (Gravitation und mittlere Temperatur) sowie einem zum Parent-Rand gerichteten Entfernungspfeil (km/AE). Der Name steht über dem Körper. Cinema besitzt Play/Pause und einen zuschaltbaren 2x-Button; jedes Objekt erhält bei 1x eine Verweildauer von 5 Sekunden. Die Scannerwirkung erscheint an Kamerahaltepunkten. Cinema startet in der Größenreihe mit einer Überblendung vom größten zum kleinsten Körper und fährt danach kontinuierlich von klein nach groß. In der Entfernungsreihe bleibt die Anordnung unverändert; bereits der Einstieg erfolgt per Kamerafahrt. Auch das Beenden führt die Kamera weich zurück.
- **Zeit:** Simulationsgeschwindigkeit und Datum; schematische Bahnen sind keine präzisen Ephemeriden.
- **Katalog:** 192 Himmelskörper und 192 deutsche redaktionelle Einträge; Sortier-Toggle **Standard → Entfernung (aufsteigend) → Größe (absteigend)** mit mittlerem Abstand in AE bzw. bei maximal 0,2 AE in km sowie Durchmesser in km rechts im Listeneintrag. Ohne Suche und ohne aktiven Planetenfilter zeigen Monde die Entfernung ihres Parent-Objekts und werden entsprechend einsortiert. In der Planetenansicht ist der Filter für den aktuellen Planeten beim Öffnen aktiv und manuell ausschaltbar. Temperatur (halbe Kachelbreite; halb gefülltes schwarzes Thermometer ohne Hintergrund für den Mittelwert, verfügbare Min./Max.-Werte kompakt rechts übereinander), mittlerer Parent-Abstand, Atmosphärendruck und Gravitation in G mit SVG-Symbolen sind im bei der ersten Nutzung standardmäßig geöffneten Daten-Tab verfügbar; unbekannte Werte bleiben offen. Die zuletzt gewählte Registerkarte (Daten oder Wissen) bleibt über Objektwechsel und Neustarts gespeichert. Der Desktop-Detailbereich reserviert die Scrollleistenbreite, sodass beim Umschalten kein seitliches Springen entsteht.
- **Texturen:** Drei getrennte Verzeichnisse `textures/mobile/` (512 px), `textures/standard/` (2048 px) und `textures/high/` (4096 px). WebP wird gegenüber JPG bevorzugt, fehlende Stufen werden aus vorhandenen Nachbarstufen geladen und GPU-seitig verkleinert.
- **Offline:** App-Shell und Katalogdaten werden vom Service Worker gespeichert. Texturen nutzen einen separaten, netzwerkpriorisierten Cache; bei geänderten Dateien werden SHA-256-Versionen automatisch erkannt. Bereits geladene Bilder bleiben offline verfügbar. Andere API-Daten sind nicht Bestandteil des Offline-Caches.

## Projektaufbau

| Pfad | Aufgabe |
|---|---|
| `index.html`, `css/`, `icons/` | Oberfläche und PWA-Assets |
| `src/app/` | Start, Laufzeit, Kamera, AR, Animation und Katalog-Workflows |
| `src/renderer/` | WebGL, Szenen, Orbits, Labels, Texturen |
| `src/ui/` | Interaktion, Detailansicht, Katalog, Layer und Zeitleiste |
| `src/data/` | Katalogadapter, Schichtmodell und Bahnberechnungen |
| `data/catalog/`, `data/editorial/` | Astronomische und redaktionelle JSON-Datensätze |
| `server/`, `src/services/` | Lokaler Server und optionale externe API-Aufrufe |
| `scripts/`, `tests/` | Katalogprüfung, Wartungswerkzeuge und Regressionstests |
| `sw.js` | Offline-Cache mit manifestgesteuerten Katalogdaten und aktualisierbaren Texturen |
| `textures/mobile/`, `textures/standard/`, `textures/high/` | Lokale Bilddateien, pro Stufe 512 / 2048 / 4096 px |

## Dokumentation

- [Bedienungsanleitung](docs/HILFE.md) – aktuelle Bedienoberfläche, Kamera, AR, Layer und Cinema.
- [Architektur](docs/ARCHITECTURE.md) – Modulgrenzen, Datenfluss, WebGL, Service Worker und Teststrategie.
- [Datenarchitektur](docs/DATA-ARCHITECTURE.md) – JSON-Schema, Quellen und Grenzen der Modelle.
- [Texturquellen](docs/TEXTURE-SOURCES.md) – Bild- und Quellenangaben.
- [Versionshistorie](docs/RELEASE-HISTORY.md) – ältere Delta-Dokumente v2–v67 und Hotfix v6.1 in einem Archiv.
- [Projektpflege](docs/MAINTENANCE.md) – Releases, Prüfungen und aktuelle Änderungen.

## Delta-Update v72 auf v71

**`Sonnensystem-Delta-v72.zip` enthält ausschließlich neue/geänderte Dateien** relativ zum vollständig veröffentlichten Archiv `Sonnensystem-v71.zip`; es ist kein vollständiges, eigenständig startbares Projekt. Die Verzeichnisstruktur des Deltas in den Stamm des bestehenden v71-Projekts entpacken und die gleichnamigen Dateien überschreiben (bei Bedarf vorher sichern). Danach `npm run check` ausführen und die PWA online neu laden. Für ältere Basisversionen zuerst auf v71 aktualisieren.

- **Objektkatalog 10.1.0:** Optionale physikalische Messwerte in Kelvin (`temperatureMinK`, `temperatureMaxK`, `temperatureMeanK`), Pascal (`atmosphericPressurePa`) und m/s² (`surfaceGravityMs2`), dazu `orbit.meanDistance` in der vorhandenen Orbit-Einheit. Die Details zeigen Werte in °C, bar/Pa, m/s² und AE/km. Die große Halbachse dient als gekennzeichneter Modellwert, falls kein eigener mittlerer Abstand vorliegt. Beispielwerte aus NASA/NSSDCA für 12 Objekte; nicht belegte Temperaturen bzw. nicht definierte Gasriesen-Oberflächendrücke erscheinen als `—`.
- **Mobile-Sheet:** Die mittlere Öffnungsstufe ist **39 %** (statt 56 %) der Fensterhöhe. Bei Öffnen, Ziehen und Schließen rückt die aktuelle Kameramitte in den **noch sichtbaren Bildbereich**; das funktioniert auch ohne Objektauswahl und nach manuellen Kamerabewegungen. Die vollständig geöffnete Ansicht und Bedienung bleiben erhalten.
- **Cache:** `sonnensystem-shell-v72`; Schema `1` bleibt rückwärtskompatibel (neue Angaben sind optional).

## Delta-Update auf v73

`Sonnensystem-Delta-v73.zip` enthält **nur neue und geänderte Dateien gegenüber v72**. Es wird über eine bestehende **v72-Installation** gelegt (v71 plus Delta v72). Alle Pfade sind relativ zum Projektstamm; gleichnamige Dateien überschreiben. Danach `npm run check` ausführen und die PWA online neu laden, um `sonnensystem-shell-v73` zu aktivieren. Die Katalogdaten bleiben unverändert (Katalogversion `10.1.0`, Schema `1`).

Die Schaltfläche in der Katalogüberschrift wechselt per Klick zwischen **Standard** (bisherige Gruppierung und Suchrelevanz), **Entfernung ↑** (mittlerer Abstand zum jeweiligen Elternkörper in AE, nah bis fern) und **Größe ↓** (Durchmesser in km, groß bis klein). Bei fehlenden Werten erscheint `—` am Ende; sehr kleine AE-Werte werden kompakt in wissenschaftlicher Schreibweise dargestellt. Die Sortierung gilt auch bei aktiver Suche und im mobilen Katalog.

Die Planetenansicht öffnet den Objektkatalog standardmäßig mit aktiviertem Filter **„Nur [Planet] und zugehörige Objekte anzeigen“**. Der Button kann ihn weiterhin ausschalten; ein neu geöffnetes Planetensystem setzt den Startzustand zurück.

## Delta-Update auf v74

`Sonnensystem-Delta-v74.zip` enthält **nur neue und geänderte Dateien gegenüber v73**. Das Paket über die bestehende **v73-Installation** legen (v71 + Delta v72 + Delta v73); gleichnamige Pfade überschreiben. Mit `npm run check` prüfen und die PWA online neu laden, damit der Cache `sonnensystem-shell-v74` aktiv wird. Datenkatalog und Schema bleiben unverändert (`10.1.0` / `1`).

Im Detail-Tab **Daten** erhält jede physikalische Messwertkachel ein eigenes Inline-SVG-Icon. Die drei Temperaturwerte bilden jetzt eine gemeinsame Karte: Mittelwert groß mit halb gefülltem **schwarzem** Thermometer auf hellem Icon-Hintergrund; Minimum und Maximum kleiner mit niedrig gefülltem **blauem** bzw. hoch gefülltem **rotem** Thermometer. Fehlende Werte werden unverändert als `—` gezeigt. Gravitation erscheint als Vielfaches der **Normfallbeschleunigung** in `G` (1 G = 9,80665 m/s²); die Katalogdaten werden weiterhin in m/s² gespeichert. Sehr kleine Werte bleiben lesbar.

**Zugehörige Objekte** stehen jetzt **oberhalb** der physikalischen Werte. Bei mehr als fünf zugehörigen Objekten ist `+N ↗` ein tastaturbedienbarer Button: Er öffnet die Katalogansicht (Desktop/Sheet) und trägt den Namen des aktuellen Elternobjekts in die Suche ein. Die vorhandene Suche findet damit sowohl den Elternkörper als auch dessen direkte Kinder; ein widersprechender Planetenfilter wird nur dann deaktiviert, wenn er alle Treffer verbergen würde.

## Delta-Update auf v75

`Sonnensystem-Delta-v75.zip` enthält **nur neue oder geänderte Dateien gegenüber v74**. Es wird über die bestehende **v74-Installation** gelegt (v71 + Delta v72 + v73 + v74). Anschließend `npm run check` ausführen und die App online neu laden, um `sonnensystem-shell-v75` zu aktivieren. Katalogdaten und Schema (`10.1.0` / `1`) bleiben unverändert.

In der Sortierung **Entfernung ↑** werden mittlere Abstände **bis einschließlich 0,2 AE in km** angezeigt, darüber weiterhin in AE. Die numerische Sortierung verwendet durchgehend intern AE. **Ohne Suchbegriff und ohne aktiven Planetenfilter** übernehmen Monde die Entfernung ihres Elternkörpers für **Sortierung und Listenanzeige** (z. B. Mond → Erde → 1 AE). Bei eingegebenem Suchbegriff oder eingeschaltetem Planetenfilter gilt wieder die eigene mittlere Bahnentfernung des Mondes (z. B. Mond → 384.400 km). Ein in der Sonnenübersicht sichtbarer, aber nicht aktiver Filterzustand schränkt die Regel nicht ein. Andere Objekttypen, Größe und Standardsortierung bleiben unverändert; unbekannte Entfernungen bleiben am Ende.

## Delta-Update auf v76

`Sonnensystem-Delta-v76.zip` enthält **nur neue oder geänderte Dateien gegenüber v75**. Es wird über eine bestehende **v75-Installation** gelegt (v71 + Delta v72–v75). Nach dem Überschreiben `npm run check` ausführen und die App online neu laden; der neue Offline-Cache heißt `sonnensystem-shell-v76`. Katalogdaten, Quellen, Messwerte und Schema (`10.1.0` / `1`) bleiben unverändert.

Die **Temperaturkachel** im Daten-Tab ist jetzt platzsparend: Der Mittelwert steht links mit halb gefülltem schwarzem Thermometer **ohne helle Icon-Fläche**, aber mit kontrastierender Kontur. Vorhandene Min.- und Max.-Temperaturen stehen **rechts in zwei schmalen Zeilen untereinander** mit kleinem blauem bzw. rotem Thermometer. Fehlende Extremwerte werden nicht als leere Zeilen belegt; ohne Min./Max. bleibt nur der Mittelwert sichtbar. Desktop und Mobile-Sheet verwenden dieselbe Darstellung.

## Delta-Update auf v104 – Cinema-Kamerafahrten, Touch-Richtung und Folgen

`Sonnensystem-Delta-v104.zip` enthält **nur neue oder geänderte Dateien gegenüber v103.0.0**. Über eine vollständig installierte v103-Version im Projektstamm entpacken und gleichnamige Dateien überschreiben. Danach `npm run check` ausführen, Server neu starten und die PWA einmal online neu laden, damit `sonnensystem-shell-v104` aktiv wird.

- **Cinema in der Größenreihe:** Beim Start wird die Neuordnung und der Kamerasprung vom größten zum kleinsten Objekt mit dem bisherigen Fade verdeckt. Danach erfolgen **alle Objektwechsel als kontinuierliche Kamerafahrten mit weichem Zoom** wie in v98; Haltezeiten, Scanner und Scrubbing bleiben erhalten. Beim Stop/Ende führt die Kamera ebenfalls animiert zur vorherigen Ansicht zurück.
- **Cinema in der Entfernungsreihe:** Keine Neuordnung und kein Fade beim Einstieg; die Kamera fährt direkt zum ersten Objekt, danach wie üblich von links nach rechts.
- **Mobile freie Sicht:** Zwei-Finger-Wischen nach unten richtet den Blick nach unten, nach oben richtet ihn nach oben, sofern kein Objekt ausgewählt ist. Die horizontale Richtung, Pinch-Zoom, Maus und die ausgewählte Objektsteuerung bleiben unverändert.
- **Objektdetails:** **Folgen** ist beim ersten Laden aktiviert und verfolgt das anfänglich gewählte Objekt. Ein manueller Klick kann Folgen jederzeit ausschalten; die bisherigen Abbruchregeln bleiben bestehen. Datenkatalog, Schema und Texturen wurden nicht verändert.

## Delta-Update auf v103 – Galaktische Schweife nur ab dem Einschaltzeitpunkt

`Sonnensystem-Delta-v103.zip` auf eine **vollständige v102.0.0-Installation** entpacken und gleichnamige Dateien überschreiben. Danach `npm run check` ausführen, den Server neu starten und die PWA einmal online neu laden, damit `sonnensystem-shell-v103` geladen wird.

- **Keine rückwirkend berechnete Spur:** Im Modus **Galaktische Bewegung** startet die Sonne ebenso wie jedes Objekt mit einer **Linienlänge von 0**. Die App speichert ausschließlich tatsächlich erreichte Positionen ab dem Aktivieren; v102s 2,4-Sekunden-Reveal der alten Bahn entfällt vollständig.
- **Zeitgesteuertes Wachstum:** Die Linien verlängern sich durch die simulierte Zeit, nicht durch Realzeit. **Pause hält die Spur an**, höhere Geschwindigkeit lässt sie schneller wachsen; bei langsamer Zeit vergeht mehr Realzeit bis zur erkennbaren Länge.
- **Jeder Neueinstieg setzt zurück:** Verlassen und erneutes Aktivieren von Galaktische Bewegung setzt alle Spuren zurück, ebenso ein Rücksprung im Simulationsdatum, ein Zeitsprung zu Heute oder eine erneute Horizons-Ausrichtung. Alte Daten werden nicht wieder eingeblendet. Die Speicherung bleibt je Objekt begrenzt.
- **Unverändert:** 3D-Abwärtsrichtung aus v101, Ansicht und Kameraführung, Planetendynamik, Objektfilter, Katalog und Schemakompatibilität.

## Delta-Update auf v102 – Spuren wachsen ab Länge 0

`Sonnensystem-Delta-v102.zip` über die **vollständige v101.0.0-Installation** im Projektstamm entpacken und Dateien ersetzen. `npm run check` ausführen, den Server neu starten und die PWA einmal online neu laden, damit `sonnensystem-shell-v102` aktiv wird.

- **Start bei Länge 0:** Beim Umschalten von **Umlaufbahn + Bahnkontrast** zu **Galaktische Bewegung** verschwinden die geschlossenen Ellipsen unmittelbar. Die Sonne und alle weiteren Objekte mit angezeigter Bahn beginnen mit **keiner sichtbaren Spur** unmittelbar an ihrer aktuellen Position.
- **Wachstum:** Jede Linie wächst während einer etwa **2,4 Sekunden** langen, sanft beschleunigten und abbremsenden Animation vom jeweiligen Körper in die **historische** 3D-Flugbahn hinein (rückwärts durch die Zeit). Es gibt keinen geometrischen Morph zwischen Ellipse und Schweif mehr. Bei deaktivierten Animationen steht sofort die vollständige Spur.
- **Unverändert:** Der gemeinsame 3D-Abwärtsdrift von Sonne und Planeten aus v101, der Kamerastandpunkt, Navigation, reguläre Umlaufbahnen und die drei Umlaufbahn-Modi in isolierten Planetenansichten bleiben bestehen. Der Wechsel zu „Aus“ entfernt die Linien unmittelbar.

## Delta-Update auf v101 – Galaktischer Schweif nach unten im 3D-Raum

`Sonnensystem-Delta-v101.zip` über die **vollständige v100.0.0-Installation** im Projektstamm entpacken und Dateien ersetzen. Anschließend `npm run check` ausführen, den Server neu starten und die Anwendung/PWA **einmal online neu laden**, damit `sonnensystem-shell-v101` aktiv wird. Das Paket enthält ausschließlich geänderte oder neue Dateien.

- **Sonnenbewegung:** Die historische Sonnen-Spur läuft nicht mehr überwiegend nach links (negative X-Achse), sondern überwiegend **nach unten entlang der negativen Y-Achse der 3D-Szene**, mit kleiner Rückwärtskomponente auf der Z-Achse und leichtem räumlichem Schwung. Die aktuelle Sonne bleibt am Ursprung des mitbewegten Kamerabezugssystems.
- **Historische Planetenspuren:** Sie verwenden exakt dieselbe geänderte räumliche Sonnenbewegung. Die offenen Bahnen, der Morph zwischen Orbit und Spur sowie alle Kamera- und Steuerungsfunktionen bleiben erhalten. Die Ausrichtung ist im Raum fest und **nicht bildschirmfixiert**; aus anderen Perspektiven erscheint der Schweif entsprechend anders.
- **Einordnung:** Richtung und Geschwindigkeit der gezeigten galaktischen Spur sind ein **illustratives Modell** und keine astronomisch vermessene Bahn der Sonne um das Milchstraßenzentrum.

## Delta-Update auf v100 – Galaktische Ansicht und offene 3D-Spuren

`Sonnensystem-Delta-v100.zip` über die **vollständige v99.0.0-Installation** im Projektstamm entpacken und Dateien ersetzen. Anschließend `npm run check` ausführen, den Server neu starten und die Anwendung/PWA **einmal online neu laden**, damit der Service Worker `sonnensystem-shell-v100` übernimmt. Das Paket enthält nur die neuen und geänderten Dateien.

- **Neuer Orbit-Modus:** Der Umlaufbahn-Button besitzt in der Sonnensystemansicht jetzt einen zusätzlichen Modus **Galaktische Bewegung**. Die Reihenfolge lautet: `Umlaufbahn` → `Umlaufbahn + Bahnkontrast` → `Galaktische Bewegung` → `Aus`. In der Planetenansicht bleibt die bisherige Dreierfolge erhalten.
- **Bezugssystemwechsel statt anderer Linienart:** Im galaktischen Modus werden die klassischen Kepler-Ellipsen nicht nur umgefärbt, sondern in historische offene 3D-Spuren überführt. Die aktuelle Objektlage bleibt unverändert; die Kamera und die Interaktion folgen weiterhin der aktuellen Sonnenposition.
- **Sonnenspur:** Die Sonne erhält eine lange, leicht leuchtende Spur durch den Raum.
- **Planetenspuren:** Planeten und weitere heliocentrische Kleinkörper zeigen ihre historischen Flugbahnen im gewählten galaktischen Bezugssystem.
- **Fließender Wechsel:** Beim Umschalten in oder aus dem Galaktik-Modus werden die Bahnen animiert zwischen geschlossener Umlaufbahn und offener 3D-Spur morpht.

## Delta-Update auf v99 – feste Reihenzeit und Cinema-Fade

`Sonnensystem-Delta-v99.zip` über die **vollständige v98.0.0-Installation** im Projektstamm entpacken und Dateien ersetzen. Anschließend `npm run check` ausführen, den Server neu starten und die Anwendung/PWA **einmal online neu laden**, damit der Service Worker `sonnensystem-shell-v99` übernimmt. Das Paket enthält nur die neuen und geänderten Dateien.

- **Reihen-Darstellung:** Die Simulation läuft ausschließlich während der Reihenansicht mit **30 simulierten Minuten pro Echtzeitsekunde** (Pause bleibt möglich). Die individuell gespeicherten Simulationsgeschwindigkeiten der normalen Sonnen- und Planetenansichten bleiben erhalten und werden nach dem Verlassen der Reihenansicht wieder verwendet. Der Geschwindigkeits-/Zeit-Dropdown-Button ist in der Reihe ausgeblendet.
- **Layer-Dropdown:** Während der Reihe sind die Buttons **Beschriftung**, **Umlaufbahn**, **Alle Monde** sowie die Kategorien **Monde** und **Satelliten** verborgen. Die zugrundeliegenden Einstellungen und Objektfilter bleiben unverändert; beim Verlassen sind alle Controls wieder verfügbar.
- **Cinema:** Der Wechsel zwischen den Körpern wird jetzt als **Fade-out → direkter Kamerawechsel bei verdeckter Szene → Fade-in** gezeigt, statt mit schnellen Zoom-/Pan-Bewegungen. Auch der Eintritt in die Tour wird überblendet. Die 5-Sekunden-Haltezeiten, 1,3-Sekunden-Übergänge, Zeitleiste, Scrubbing und Cinema-2x bleiben erhalten. Die Oberfläche läuft währenddessen mit der Reihenzeit weiter.

## Delta-Update auf v98 – Eigenrotation und Texturausrichtung

`Sonnensystem-Delta-v98.zip` im **Projektstamm einer vollständigen v97.0.0-Installation** entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen, den Node-Server neu starten und die PWA einmal **online neu laden**, sodass `sonnensystem-shell-v98` aktiv wird. Das Delta liefert nur geänderte oder neue Dateien; die lokalen Bildtexturen unter `textures/` bleiben unberührt.

**Objektrotation:** Sonnensystem- und isolierte Planetenansicht nutzen eine gemeinsame 3D-Ausrichtung. Die Oberfläche rotiert mit der siderischen Rotationsperiode relativ zur **simulierten Zeit** (Wiedergabe, Pause, Geschwindigkeit und Zeitsprung). Der lokale Katalog wurde um Werte für Sonne, acht Planeten, Pluto und Ceres ergänzt. Bei großen gebundenen Monden richtet sich die Textur anhand der modellierten Kepler-Position zum Elternkörper aus. Die Datenfelder `physical.rotationPeriodHours` (Stunden, negativ bei rückläufiger Rotation), `physical.axialTiltDeg` (0–180°, Grad) und `physical.synchronousRotation` (bool) sind optional: Ohne belegte Werte wird keine willkürliche Eigendrehung angenommen. Der optionale Solar-OpenData-Abgleich übernimmt `sideralRotation` und `axialTilt`, falls gültig.

**Texturausrichtung:** Equirektanguläre Karten werden mit **Nord oben**, **0°-Meridian in der Kartenmitte** (`u=0,5`), **Ost nach rechts** abgebildet. WebGL lädt die Bildzeilen weiterhin mit aktiviertem vertikalen Flip; die UV-Abbildung erzeugt dadurch keine gespiegelten oder kopfstehenden Oberflächen. Die Kugel und Saturns Ringe benutzen dieselbe Achsneigung (26,7° für Saturn), während die Ringe nicht mit der Oberflächenrotation mitdrehen. Die Beleuchtungsrichtung wird in den lokalen Objektraum umgerechnet; der Tag-Nacht-Übergang rotiert daher nicht mit einer festen Texturstelle. Pro Objekt sind `appearance.texturePhaseDeg` (Nullmeridian-Verschiebung) und `appearance.axisHeadingDeg` (Ausrichtung der Neigung im Szenenraum) optional.

**Genauigkeitsgrenzen:** Die planetaren Rotationsperioden und Neigungen sind gerundete Referenzwerte, **keine vollständigen IAU-Pol-/Prime-Meridian-Ephemeriden**. Die Anfangsausrichtung von Bildmerkmalen hängt vom gelieferten Texture-Atlas ab und kann über `texturePhaseDeg` angepasst werden. Die Mond-Achsneigung wird vereinfacht abgebildet; physikalische Libration, differentielle Sonnenrotation und unabhängige Ringtexturen sind nicht modelliert. Die ursprüngliche v97-Texturordner- und Cache-Logik bleibt unverändert. Einzelheiten: [Datenarchitektur](docs/DATA-ARCHITECTURE.md) und [Texturquellen](docs/TEXTURE-SOURCES.md).

## Delta-Update auf v97 – Texturen und Cache

`Sonnensystem-Delta-v97.zip` über eine bestehende **v96.0.0-Installation** im Projektstamm entpacken und gleichnamige Dateien überschreiben. Danach `npm run check` ausführen, den Node-Server neu starten und die PWA **online neu laden**, damit `sonnensystem-shell-v97` aktiv wird. Das Paket enthält nur neue oder geänderte Dateien gegenüber dem beigefügten v96-Quellarchiv. **Die Texturbilder selbst sind nicht enthalten**, da sie nicht im Ausgangsarchiv liegen. Bestehende Bilder in `textures/standard/` nicht löschen.

Empfohlene Dateinamen (alle Stufen): `earth.webp`, `mars.webp`, `moon.webp`, `titan.webp`. Die Ordner `mobile/` (512 px), `standard/` (2048 px) und `high/` (4096 px) sind voneinander getrennt. Die Dateisuche bevorzugt WebP vor JPG/JPEG/PNG und fällt bei fehlenden Mobilbildern zuerst auf `standard/` zurück. Bereits vorhandene historische 2K-Namen wie `2k_earth_daymap.jpg` bleiben im `standard/`-Ordner lesbar. Die angegebenen Pixelgrößen sind **Maximalbreiten für den GPU-Upload**; v97 erzeugt keine neuen Bilddateien und skaliert vorhandene Bilder nur im Browser herunter.

Der lokale Node-Server stellt `/api/textures/manifest` bereit. Dessen SHA-256-Prüfsummen werden beim Rendern spätestens alle 30 Sekunden (und nach einem erneuten Öffnen der Seite) geprüft. Geänderte oder neu hinzugefügte Bilder erhalten eine andere URL-Version und ersetzen ihre bisherigen GPU-Texturen. Der Service Worker holt Texturen **zuerst vom Netzwerk** und hält die letzte erfolgreiche Version pro Dateipfad für Offline-Nutzung vor. Für rein statisches Hosting ohne diesen Endpunkt funktioniert der Dateifallback weiterhin; dort werden Änderungen mit einem Online-Neuladen der Anwendung zuverlässig übernommen, nicht fortlaufend während einer offenen Sitzung. Details: [Texturquellen](docs/TEXTURE-SOURCES.md).

## Delta-Update auf v96

`Sonnensystem-Delta-v96.zip` über eine vollständige **v95.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit der Offline-Cache `sonnensystem-shell-v96` aktiviert wird. Das Paket enthält ausschließlich geänderte und neue Dateien.

**Control Panel:** Der Umlaufbahn-Button wechselt zyklisch zwischen **Umlaufbahn (Standard)**, **Umlaufbahn + Bahnkontrast** und **beides aus**; der bisher separate Kontrast-Button entfällt. Die vier Darstellungs-Toggles bilden jetzt zwei Reihen: **Beschriftung | Umlaufbahn** über **Beleuchtung | Monde**. Der Kontrastmodus verwendet ein stärkeres Orbit-SVG. Alle/Standard und die separate Speicherung für Sonnensystem-/Planetenansichten bleiben erhalten: „Standard“ startet ohne Bahnkontrast, „Alle“ schaltet ihn ein.

## Delta-Update auf v95

`Sonnensystem-Delta-v95.zip` über eine vollständige **v94.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit `sonnensystem-shell-v95` aktiviert wird. Das Archiv enthält nur geänderte und neue Dateien.

**Reihen-Hover und Cinema:** Der Radar-Rahmen ist nicht mehr auf **560 CSS-Pixel** begrenzt. Gerade auf großen Bildschirmen wächst er nun mit dem projizierten Planetendurchmesser (inklusive 26 px Messrahmenzugabe), bis tatsächlich der Platz für Objektname, Gravitation, Temperatur oder Abstandspfeil aufgebraucht ist. Nur diese räumlichen Grenzen stoppen das Wachstum; die Planetengröße, Beschriftungen und Pfeilgeometrie bleiben unverändert.

## Delta-Update auf v94

`Sonnensystem-Delta-v94.zip` über eine vollständige **v93.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit `sonnensystem-shell-v94` aktiviert wird. Das Archiv enthält nur geänderte und neue Dateien.

**Reihen-Hover und Cinema:** Der Radar-Messrahmen wächst mit dem dargestellten Körper, bleibt aber bei der größten noch verfügbaren Größe stehen, bevor er den **Objektnamen über dem Rahmen**, die **Gravitations-/Temperaturwerte darunter** oder die **Abstandsangabe mit Pfeil** überdecken würde. Die Messwerte halten auch zur Pfeillinie Abstand. Bei wenig Platz (z. B. in der mobilen Cinema-Ansicht oder an Bildschirmrändern) darf der Rahmen kleiner als 160 px werden; die Kugel-Vergrößerung, Objekt- und Pfeilpositionen bleiben davon unabhängig. Keine Änderung an den wissenschaftlichen Werten.

## Delta-Update auf v93

`Sonnensystem-Delta-v93.zip` über eine vollständige **v92.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit `sonnensystem-shell-v93` aktiviert wird. Das Archiv enthält nur geänderte und neue Dateien.

**Maßstab – Objekt aus / Bahn an:** In der Sonnensystemübersicht hat die Sonne nur noch **ein Drittel ihres bisherigen schematischen Radius** (und damit ein Drittel des Durchmessers). Die Körpergrößen aller anderen Objekte sowie sämtliche Bahnabstände bleiben erhalten. Die übrigen Maßstabskombinationen und die isolierte Planetenansicht sind unverändert.

## Delta-Update auf v92

`Sonnensystem-Delta-v92.zip` über einer vollständigen **v91.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit `sonnensystem-shell-v92` aktiviert wird. Das Archiv enthält nur geänderte und neue Dateien.

**Beschriftung – Planetenpunkt:** Der Punkt erscheint wie im normalen Beschriftungsmodus nur, wenn der projizierte Objektradius kleiner als der Punkt ist (**2,2 CSS-Pixel**) oder das Objekt selektiert wurde. Ein selektierter Körper erhält immer einen **goldfarbenen Mittelpunkt-Punkt** (2,6 px) samt Selektionsring, unabhängig von seiner Größe. Große unselektierte Objekte bleiben ohne zusätzlichen Punkt; Namenslabels sind in diesem Modus weiterhin verborgen. Der Modus **An** sowie Geschwindigkeits-, Layer- und Vierer-Textlabelregeln bleiben unverändert.

## Delta-Update auf v91

`Sonnensystem-Delta-v91.zip` über eine vollständige **v90.0.0-Installation** im Projektstamm entpacken und bestehende Dateien überschreiben. Anschließend `npm run check` ausführen und die Anwendung neu laden, damit der Offline-Cache `sonnensystem-shell-v91` aktiv wird. Das Delta enthält nur geänderte und neue Dateien.

**Reihen-Cinema:** Jeder Körper – Sonne, Planet, Zwergplanet, Mond oder anderes Objekt – erhält bei **1x genau 5 Sekunden Haltezeit**. Reisezeiten bleiben bei 1,3 Sekunden pro Fahrt. Der **2x**-Schalter spielt den Film doppelt schnell (also 2,5 Sekunden pro Stopp) und verändert die Zeitleistenstruktur nicht.

**Objektdetails:** **Daten** ist der Standard ohne gespeicherte Auswahl. Wird **Wissen** oder **Daten** gewählt, bleibt dieser Tab beim Objektwechsel, bei Szenenwechseln und nach einem erneuten App-Start geöffnet. Die Auswahl wird im Browser gespeichert; bei deaktiviertem Speicher funktioniert das Umschalten weiterhin ohne Fehler.

## Delta-Update auf v90

`Sonnensystem-Delta-v90.zip` über eine vollständige **v89.0.0-Installation** im Projektstamm entpacken und bestehende Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit der Offline-Cache `sonnensystem-shell-v90` aktiv wird. Das Delta enthält nur neue und geänderte Dateien.

**Zusammengefasste Kategorie-Filter:** Die sichtbare Checkbox **Asteroiden** steuert jetzt Asteroiden **und Doppelasteroiden** gleichzeitig. **Zwergplaneten** steuert Zwergplaneten **und transneptunische Objekte**. Die Zahl der einzeln bedienbaren Objektfilter sinkt von zehn auf acht. Die **wissenschaftlichen Typen, Katalogdaten, Kategorienfarben und genauen Detailbezeichnungen** bleiben getrennt und unverändert; die Gruppierung betrifft ausschließlich den gemeinsamen An/Aus-Filter. Auch in der Planetenansicht und bei **Alle/Standard** bleibt die Filterfunktion konsistent.

## Delta-Update auf v89

`Sonnensystem-Delta-v89.zip` über eine vollständige **v88.0.0-Installation** im Projektstamm entpacken und bestehende Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit der Offline-Cache `sonnensystem-shell-v89` aktiv wird. Enthalten sind nur geänderte und neue Dateien.

**Mobiler Reihen-Cinema-Modus:** Die Cinema-Zeitleiste sitzt direkt an der **Oberkante des Mobile-Sheets**. Sie folgt dessen tatsächlicher Höhe bei geschlossenem, halb geöffnetem und vollständig geöffnetem Sheet sowie beim Ziehen/Animieren. Die Zeitleiste liegt über den unteren **AR- und Perspektive-Buttons** und überdeckt diese während Cinema; das Mobile-Sheet selbst bleibt im Vordergrund. Am Desktop ist die Position unverändert.

## Delta-Update auf v88

`Sonnensystem-Delta-v88.zip` über eine vollständige **v87.0.0-Installation** im Projektstamm entpacken und bestehende Dateien überschreiben. Danach `npm run check` ausführen und die Anwendung online neu laden, damit der Cache `sonnensystem-shell-v88` aktiv wird. Enthalten sind nur geänderte und neue Dateien.

**Objektdetails:** **Daten** ist beim Start aktiv, **Wissen** bleibt als zweite Registerkarte verfügbar. Für den Desktop-Scrollbereich wird die Breite der Scrollleiste stabil reserviert, wodurch der Inhalt beim Tabwechsel nicht mehr horizontal springt.

**Reihen-Cinema:** Planeten und Zwergplaneten erhalten **3 Sekunden** Haltezeit, Sterne, Monde und andere Körper weiterhin **1,5 Sekunden**. Der neue **2x**-Button direkt rechts neben Play/Pause wechselt die Cinema-Geschwindigkeit zwischen normal und doppelt; er verändert weder die Simulationsgeschwindigkeit noch den Pausezustand.

## Delta-Update auf v87

`Sonnensystem-Delta-v87.zip` über eine vollständige **v86.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die PWA online neu laden, damit `sonnensystem-shell-v87` aktiviert wird. Das Archiv enthält ausschließlich geänderte oder neue Dateien.

**Beschriftungsschalter:** Der Button im Layer-Panel wechselt zyklisch **An → Planetenpunkt → Aus → An**. Im Modus **Planetenpunkt** zeigt das Icon einen zentrierten Punkt; Objektlabel-Texte werden nicht gezeichnet, stattdessen erscheinen an allen sichtbaren Objektzentren Punkte in Kategoriefarben (Selektion in Selektionsfarbe). Die Punkte bleiben auch bei schneller simulierter Bahnbewegung sichtbar; die Viererbeschränkung aus v86 betrifft weiterhin nur Textlabels. In **Aus** sind beide Varianten verborgen. Standard-/Alle-Presets setzen wieder **An**; Sonnensystem- und Planetenansicht behalten getrennte Einstellungen.

**Planetenansicht:** Ein oben links platzierter Button **„Sonnensystem“** mit Zurück-Pfeil beendet die isolierte Ansicht. Der untere Kamera-Button wechselt dort nur noch die Perspektiven, auch ohne AR. Im AR-Modus bleibt die Kalibrierung beim Wechsel bzw. Zurücknavigieren konsistent.

## Delta-Update auf v86

`Sonnensystem-Delta-v86.zip` über eine vollständige **v85.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die PWA online neu laden, damit `sonnensystem-shell-v86` aktiviert wird. Es werden nur geänderte und neue Dateien geliefert.

**Smart Labels v86:** Eine Beschriftung wird ausgeblendet, wenn der Körper wegen der **simulierten Bahnbewegung** schneller als **190 CSS-Pixel/Sekunde** im aktuellen Kamerabild wandert. Unter **135 CSS-Pixel/Sekunde** erscheint das Label wieder (Hysterese gegen Flackern, keine Wartezeit). Dazu wird die Verschiebung relativ zum Parent bei unveränderter Kameraprojektion gemessen: reine Kameraschwenks, Zooms, Layoutübergänge und Zeitsprünge lassen Labels sichtbar. Auch wenn der Text wegen einer schnellen Bahn verschwindet, bleiben Mittelpunktmarker kleiner Objekte sowie Selektionspunkt und Ring sichtbar.

**Sonnensystemübersicht:** Je Planet (auch Zwergplanet) werden höchstens die **vier größten direkt zugehörigen Objekte** beschriftet; Monde und Satelliten zählen gemeinsam nach Katalogradius. Eine ausgewählte kleinere Begleitobjekt-Beschriftung ersetzt gegebenenfalls Rang vier, statt die Grenze zu erhöhen. Diese Begrenzung ist unabhängig von **„Alle Monde“** und ändert nur Labels, nicht Kugeln, Umlaufbahnen oder Klickziele. In der isolierten Planetenansicht gibt es keine Vierergrenze. Keine Textkollisions- oder Raster-Dichtefilter.

## Delta-Update auf v85 (historisch)

`Sonnensystem-Delta-v85.zip` über eine vollständige **v84.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die PWA online neu laden, damit `sonnensystem-shell-v85` aktiviert wird. Es werden nur geänderte und neue Dateien geliefert.

**Smart Labels v85:** Bei **schnellen Kameraschwenks, Zooms und Objektbewegungen** bleiben alle ansonsten darstellbaren Labels durchgehend sichtbar. Die früheren Geschwindigkeits- und Wartezeitregeln entfallen. Ansichtsränder, aktivierte Layer, Beschriftungsschalter und Reihen-Hover-HUD funktionieren weiterhin wie zuvor; Mittelpunkt-Marker und Selektionsfarbe aus v84 bleiben erhalten.

## Frühere Smart-Label-Änderungen (v84/v83)

**Smart Labels v84:** Der führende Punkt vor jedem Objektlabel entfällt. Stattdessen erscheint bei sehr klein gezeichneten, gelabelten Objekten ein Mittelpunkt-Punkt in der **Farbe der Objektkategorie** direkt auf dem Objekt. **Selektierte Objekte** tragen diesen Mittelpunkt-Punkt **immer** in der Selektionsfarbe, auch wenn das Objekt größer dargestellt wird.

**Smart Labels:** Die bisherige Dichtegrenze von zwei nicht ausgewählten Beschriftungen je 160 × 110 CSS-Pixel wurde vollständig entfernt. Alle durch die Kamera sichtbaren und innerhalb des Viewports platzierbaren Objektlabels dürfen nun gleichzeitig erscheinen – auch wenn sich Texte oder Planetenscheiben überlappen. Die Auswahl wird zuletzt gezeichnet und bleibt damit visuell vorn. Die unabhängigen Regeln für die manuell gewählte Beschriftungsoption, aktivierte Objektlayer/„Alle Monde“, die Bildschirmgrenzen und das Reihen-Hover-HUD gelten weiterhin; die Geschwindigkeitsfilterung entfällt in v85.

## Delta-Update auf v82

`Sonnensystem-Delta-v82.zip` über eine vollständige **v81.0.0-Installation** im Projektstamm entpacken und vorhandene Dateien überschreiben. Danach `npm run check` ausführen und die PWA online neu laden, damit `sonnensystem-shell-v82` aktiviert wird. Es werden nur geänderte und neue Dateien geliefert; die Katalog- und Texturdaten bleiben unverändert.

- **Schematisch (Objekt aus, Bahn aus):** Die acht Planetenbahnen liegen in der Sonnensystemübersicht auf nahezu gleichmäßigen Abständen von **2,25 Szeneneinheiten**. Die alte Wurzelkurve mit großen äußeren Lücken wird durch eine stückweise, stetige Verteilung mit flacherem Zuwachs ersetzt. Kleinobjekte werden nach ihrem realen Bahnhalbachsenwert zwischen den Planeten eingeordnet; jenseits Neptuns wächst die Distanz logarithmisch weiter.
- **Optimiert (Objekt an, Bahn aus):** Die Sonne hat den **dreifachen v81-Optimiert-Radius** (insgesamt zwölfmal den schematischen Sonnenradius). Die inneren Bahnen wandern nach außen, die äußeren werden gegenüber v81 zusammengezogen. Merkurbahn und Sonnenoberfläche bleiben auch am Perihel getrennt. Die übrigen Körper behalten ihre bisherigen Größen; die Reihen-/Cinema-Darstellung behält auch ihre bisherige Sonnenproportion. Diese Variante ist eine **illustrative Darstellung**, nicht physikalisch maßstabsgetreu.
- **Unverändert:** Bahn an (physikalische Abstandsmaßstäbe), einzelne Planetenansichten, Reihen-/Cinema-Modi. JPL-Koordinaten nutzen dieselbe Halbachsen-Umrechnung wie die gezeichneten Bahnen, damit Live-Positionen nicht versetzt erscheinen.

## Delta-Update auf v81

`Sonnensystem-Delta-v81.zip` über **v80.0.0** im Projektstamm entpacken und bestehende Dateien überschreiben. `npm run check` ausführen und die PWA online neu öffnen, damit der Cache `sonnensystem-shell-v81` aktiv wird. Das Archiv enthält ausschließlich neue und geänderte Dateien, keine Katalog- oder Texturkopien.

- **Reihen-Hover:** Der Abstand zwischen dem gehoverten Objekt und dem horizontalen Distanzpfeil wurde von 23 auf **69 CSS-Pixel** verdreifacht. Der Pfeil endet am dem Kind zugewandten **äußeren Rand des direkten Parent-Körpers**, nicht in dessen Zentrum. Bei Eltern außerhalb des Sichtbereichs wird der Pfeil am sichtbaren Außenrand oder an der Bildschirmkante begrenzt.
- **Direktes HUD:** Der Objektname steht in der türkisfarbenen Hover-Typografie **über dem Planeten**. Gravitation (G) und mittlere Temperatur (°C) erscheinen **links und rechts darunter**, mit exakt denselben SVGs aus den Objektdetails. Der Durchmesser bleibt im Messrahmen. Die seitliche Objektanalyse-/Hover-Karte entfällt.
- **Cinema:** Links in der Cinema-Zeitleiste steuert ein eigener Button **Pause/Fortsetzen**. Die Simulation ist davon unabhängig, und manuelles Scrubbing funktioniert auch bei Pause. Während die Kamera nach einer Anfahrt tatsächlich auf einem Objekt ruht, nutzt dieses denselben Scanner-/Vergrößerungseffekt wie ein Reihen-Hover; während der Fahrt bleibt er aus. Der Stop-Button und `Esc` beenden weiterhin Cinema.

## Delta-Update auf v80

`Sonnensystem-Delta-v80.zip` wird über **v79** installiert. Der Reihen-Scanner zeigt nun statt `SCAN // AKTIV` den formatierten Durchmesser an; verbreiterte Eckmarkierungen und animierte beidseitige Messpfeile kennzeichnen ihn visuell. Das Label „Abstand zum Parent“ entfällt; die Distanzzahl bleibt unter dem Objekt. Der waagerechte Entfernungspfeil erreicht die tatsächliche X-Position des projizierten Parent-Zentrums, wenn sie innerhalb des Viewports liegt, andernfalls den linken bzw. rechten Bildschirmrand (keine 300-px-Begrenzung). Eine Auswahl aus dem Katalog und der Button „Planetenansicht“ übernehmen bei aktivem AR die neue Kameraausrichtung als neutrale Sensorhaltung, ohne die Sensorberechtigung erneut anzufordern. Katalogschema, Datenwerte, Reihe und Cinema bleiben unverändert. PWA-Cache: `sonnensystem-shell-v80`.

## Delta-Update auf v79

`Sonnensystem-Delta-v79.zip` ist ein Hotfix für v78 (nur neue oder geänderte Dateien). Der bereits berechnete Entfernungspfeil war unsichtbar, weil beim SVG-Element das HTML-Attribut `hidden` durch Zuweisung an `.hidden` nicht entfernt wurde. Die Anzeige schaltet dieses Attribut jetzt ausdrücklich über `setAttribute`/`removeAttribute` um. Der Pfeil erscheint beim Hover in einer Reihe und wird ausgeblendet, wenn kein gültiger Parent-Abstand vorliegt. Tests decken diese DOM-SVG-Eigenschaft ab. `sonnensystem-shell-v79` aktualisiert den Offline-Cache; Katalog und Cinema bleiben unverändert.

## Delta-Update auf v78 (historischer Stand)

`Sonnensystem-Delta-v78.zip` enthält ausschließlich neue und geänderte Dateien gegenüber **v77**. Die bestehenden Dateien überschreiben, `npm run check` ausführen und die App online neu laden; der Offline-Cache heißt `sonnensystem-shell-v78`. Katalogwerte und Datenschema bleiben unverändert (`10.1.0` / `1`).

- **Reihen-Hover (Desktop mit Maus/Stift):** Über einem tatsächlich dargestellten Körper blendet die WebGL-Reihe einen animierten, türkisfarbenen Scanner ein. Die sichtbare Kugel wächst bei Bedarf weich auf mindestens **160 CSS-Pixel Durchmesser**, ohne die Reihenpositionen oder Cinema-Stopps zu verändern. Das HUD enthält den **Durchmesser in km**, die **Gravitation in G** und die **mittlere Temperatur in °C**. Fehlende Messwerte werden als `—` gezeigt, nicht ergänzt.
- **Entfernung zum Parent:** Ein unter dem Objekt beginnender Pfeil verlängert sich Richtung projiziertem Zentralobjekt. Der Wert steht direkt unter dem gehoverten Objekt. Bis einschließlich **0,2 AE** wird **km** gezeigt, darüber **AE**. Für das Zentralobjekt selbst wird kein Parent-Pfeil gezeigt.
- **Eingaben:** Der Scanner erschien in v78 nicht im normalen Orbitmodus, bei Cinema, während laufender Reihenübergänge, bei AR oder beim Ziehen; **seit v81 erscheint er auch bei ruhenden Cinema-Kameras**. Er blockiert weder Mausauswahl noch Kameraeingaben. `prefers-reduced-motion` deaktiviert dekorative HUD-Animationen. Auf Touchgeräten ohne Hover bleibt die Steuerung unverändert.

## Delta-Update auf v77

`Sonnensystem-Delta-v77.zip` enthält **nur neue oder geänderte Dateien gegenüber v76**. Es wird über eine bestehende **v76-Installation** entpackt; überschreiben, `npm run check` ausführen und die App online neu laden. Der PWA-Cache heißt `sonnensystem-shell-v77`; Katalog und Datenschema sind unverändert.

- **Objektdetails:** Temperatur belegt nur noch eine normale Spalte (halbe Breite des Datenrasters), Min/Max bleiben rechts kompakt gestapelt; der Tab **Daten** steht links vor **Wissen**. Die Standardauswahl *Wissen* bleibt erhalten; Home/End folgen der neuen Reihenfolge.
- **Reihe:** In der Sonnenübersicht nur Sonne und ihre direkten Kinder, in der Planetenansicht nur der Zentralplanet/-zwergplanet und seine direkten Kinder. Unbekannte/ungültige/Null-Radien werden nicht gezeichnet und nicht als Cinema-Stopp geführt. Nicht direkt zugehörige Monde oder verschachtelte Begleiter sind außerhalb der Reihenansicht weiterhin sichtbar, sofern ihre Layer aktiv sind.
- **Reihen-Button:** Dreistufig **Aus → Größe → Entfernung → Aus**, mit eigenem Distanz-SVG (ein großer und drei kleine Punkte). Entfernung sortiert den mittleren Parent-Abstand aufsteigend; das Zentralobjekt steht links, unbekannte Entfernungen zuletzt. In der Entfernungsreihe durchläuft **Cinema Play** die vorhandene Reihenanordnung von links nach rechts, ohne die Objekte zu sortieren. Die bisherige Größe-zu-Cinema-Umordnung bleibt erhalten.

## Historisches Update auf v71



Das **vollständige Projektarchiv v71** ändert die vertikale Richtung für **Zwei-Finger-Wischen beim freien Umsehen** (ohne ausgewähltes Objekt): Beide Finger nach **unten** bewegen den Blick nach **oben**, beide Finger nach **oben** bewegen ihn nach **unten**. Die horizontale Blickrichtung, Ein-Finger-Pan, Pinch-Zoom, Rechtsklick-Umschauen und die objektbezogene Kamerasteuerung bleiben unverändert.

Im **AR-Modus** ist die vertikale Sensorblickrichtung wieder wie in v69: **Smartphone nach oben = Blick nach oben; nach unten = Blick nach unten**, unabhängig von Hoch- oder Querformat. Die horizontale AR-Bewegung bleibt unverändert. Die in v70 eingeführte sanfte Kamerafahrt (1.050 ms), Perspektivsymbole und Übergangsregeln bleiben erhalten.

Mit `npm run check` lassen sich Katalog und Regressionstests prüfen. Der neue PWA-Cache heißt `sonnensystem-shell-v71`. Nach der Installation die Web-App online neu laden, damit der Service Worker die aktualisierten Dateien übernimmt.

## Frühere Migration von v67 auf v68

Das Paket `Sonnensystem-Delta-v68.zip` ist für **v67** vorgesehen. Entpacken und Dateien überschreiben, dann im Projektverzeichnis **`node apply-v68.mjs`** ausführen. Der Updater entfernt die 67 zuvor ausgelieferten historischen Delta-/Hotfix-Dokumente und die vier durch Umbenennung abgelösten Testdateien, jeweils nur bei unverändertem Inhalt, und anschließend sich selbst. Veränderte Dokumente werden sicherheitshalber **nicht** gelöscht.

Die damalige v68-Migration führte auf `68.0.0` mit dem Cache `sonnensystem-shell-v68`. Für Neuinstallationen wird mindestens das vollständige **v71-Projektarchiv** benötigt; danach kann das Delta v72 angewendet werden.

## Wissenschaftliche Grenzen

Körperpositionen und Bahnen dienen der anschaulichen Darstellung. Historische, mittlere und vereinfachte Orbitparameter liefern **keine** hochgenauen Echtzeit-Ephemeriden. Fehlende Größen werden nicht erfunden. Weitere Hinweise stehen in der Datenarchitektur und den jeweiligen Objektdetails.

## Delta-Update auf v105 – Begrenzung visueller Umdrehungen

`Sonnensystem-Delta-v105.zip` wird über die vollständige v104 installiert. Nur gerenderte Umlauf- und Eigendrehungen werden auf maximal fünf Umdrehungen pro realer Sekunde begrenzt. Die Zeitsteuerung ist unverändert.

## Delta v106 – AR-Bewegungsnavigation

Bei aktivem AR-Modus erscheint links unten **direkt neben dem AR-Schalter** ein zweiter, zunächst deaktivierter Bewegungs-Button (Vier-Richtungs-Symbol). Nach Antippen fordert der Browser bei Bedarf Zugriff auf den Bewegungssensor an. Erkennt er gültige Bewegungsdaten, kann das Smartphone durch physische Bewegungen vor/zurück/links/rechts den Kamerastandort wie beim Ein-Finger-Verschieben verändern. Der bestehende AR-Sensorblick bleibt aktiv. Erneutes Antippen schaltet die Bewegung aus. Beim Abschalten des AR-Modus oder beim Verlassen der Seite wird sie automatisch deaktiviert.

Diese Steuerung verwendet **Beschleunigungsdaten**, nicht eine räumliche Positionserfassung: kurze Bewegungsimpulse bewirken eine gedämpfte Kameraverschiebung. Es gibt kein präzises 6-DoF-Tracking, und Empfindlichkeit/Verfügbarkeit sind geräteabhängig. Funktioniert nur auf unterstützten Mobilgeräten in einem sicheren Browserkontext (HTTPS oder localhost). Simulation und Zeitsteuerung werden nicht geändert.

**Installation:** `Sonnensystem-Delta-v106-AR-Bewegung.zip` über eine vollständige v105-Installation entpacken und überschreiben. Danach die PWA neu laden.
