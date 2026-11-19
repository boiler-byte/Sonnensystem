# Sonnensystem – interaktiver 3D-Atlas (v86.0.0)

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
```

## Aktuelle Funktionen

- **Szenen:** Sonnensystemübersicht und Planeten-/Zwergplanetensysteme; Objektfokus, Nachführung und drei Kameraperspektiven.
- **Kamera:** Maus, Touch und Tastatur; freie Perspektive mit umgekehrtem vertikalem Zwei-Finger-Umschauen; gleitende Fahrten beim Perspektivwechsel per Kamerataste; optional AR-Blicksteuerung mit natürlicher vertikaler Sensorbewegung (nur auf geeigneten Geräten in sicherem Kontext).
- **Darstellung:** getrennte Objektkategorien, Beschriftungen, Beleuchtung, Monde, Umlaufbahnen und Kontrast; unabhängig gespeicherte Ansichtsoptionen.
- **Maßstab:** Objektgrößen, Bahnabstände sowie drei Reihenmodi **Aus → Größe (groß bis klein) → Entfernung (nah bis fern)**. Die Reihe enthält nur das Zentralobjekt der Ansicht und seine direkten Kinder mit bekanntem Radius. Beim Maus-Hover wird ein kleiner Körper bis mindestens 160 px Durchmesser vergrößert und erhält einen animierten Sci-Fi-Messrahmen mit dem Durchmesser oben und darunter zwei ikonbasierten Messwerten (Gravitation und mittlere Temperatur) sowie einem zum Parent-Rand gerichteten Entfernungspfeil (km/AE). Der Name steht über dem Körper. Cinema besitzt Play/Pause und zeigt die Scannerwirkung an Kamerahaltepunkten. Cinema startet in der Größenreihe wie bisher klein-zu-groß; in der Entfernungsreihe läuft es ohne Neuordnung von links nach rechts.
- **Zeit:** Simulationsgeschwindigkeit und Datum; schematische Bahnen sind keine präzisen Ephemeriden.
- **Katalog:** 192 Himmelskörper und 192 deutsche redaktionelle Einträge; Sortier-Toggle **Standard → Entfernung (aufsteigend) → Größe (absteigend)** mit mittlerem Abstand in AE bzw. bei maximal 0,2 AE in km sowie Durchmesser in km rechts im Listeneintrag. Ohne Suche und ohne aktiven Planetenfilter zeigen Monde die Entfernung ihres Parent-Objekts und werden entsprechend einsortiert. In der Planetenansicht ist der Filter für den aktuellen Planeten beim Öffnen aktiv und manuell ausschaltbar. Temperatur (halbe Kachelbreite; halb gefülltes schwarzes Thermometer ohne Hintergrund für den Mittelwert, verfügbare Min./Max.-Werte kompakt rechts übereinander), mittlerer Parent-Abstand, Atmosphärendruck und Gravitation in G mit SVG-Symbolen sind im Daten-Tab verfügbar; unbekannte Werte bleiben offen.
- **Offline:** App-Shell und Katalogdaten werden vom Service Worker gespeichert; lokale Texturen werden bei Bedarf gecacht. API-Daten sind nicht Bestandteil des Offline-Caches.

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
| `sw.js` | Offline-Cache mit manifestgesteuerten Katalogdaten |

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
