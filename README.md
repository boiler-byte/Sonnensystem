# Sonnensystem – interaktiver 3D-Atlas v56.0

**Aktueller Stand v56.** Der Objektkatalog enthält **192 Himmelskörper**. Neu sind das Doppelasteroiden-System **Didymos und Dimorphos** (eigene Layer-Kategorie), **neun kleine Jupiter-, Saturn- und Neptunmonde** und **sieben künstliche Erdsatelliten** einschließlich Tiangong, GPS und Wetterbeobachtung. Die Suche sortiert nun nach **exaktem Namen oder Alias**, **exakter Objektkategorie**, **Präfix** und erst danach **Teiltreffern**. Bei vergleichbarer Treffergüte erhalten Planeten Vorrang vor Zwergplaneten, Monden und anderen Objekten. Die Bedienung aus v55 bleibt unverändert.

## Neue Körper und priorisierte Suche (v56)

- **Doppelasteroiden (2):** (65803) Didymos auf einer Sonnenbahn und sein Begleiter **Dimorphos** mit separater, vereinfacht dargestellter Relativbahn. Die Kategorie **Doppelasteroiden** kann im Layer-Dropdown ein- und ausgeschaltet werden.
- **Weitere natürliche Monde (9):** bei **Jupiter** S/2003 J 2, S/2003 J 4, S/2018 J 2; bei **Saturn** Loge, Skoll, Greip, Tarqeq; bei **Neptun** S/2002 N 5, S/2021 N 1.
- **Künstliche Erdsatelliten (7):** Tiangong (Tianhe), GPS BIIF-6 (PRN 06), GPS BIIF-10 (PRN 08), NOAA-20 (JPSS-1), NOAA-21 (JPSS-2), GOES-16 und GOES-18. Die NORAD-Nummern sind im Katalog hinterlegt.
- **Suche:** Die Eingabe `Saturn` zeigt **Saturn selbst zuerst**, vor passenden Namenspräfixen, Einträgen mit Saturn als Zentralplanet und Einträgen, die den Begriff nur mitten im Namen tragen. Bei `Planeten`, `Zwergplaneten`, `Monde` usw. stehen **exakte Kategorietreffer** vor nur teilweise passenden Namen. Bei gleicher Trefferklasse: **Planeten → Zwergplaneten → Monde → weitere Typen**. Mehrere Suchwörter, Kategorie-/Alias-Suche und Planet-Filter funktionieren weiter.
- **Datengenauigkeit:** Die neuen Bahnkurven sind lokale Kepler- oder schematische Modellbahnen. Besonders die Positionen von Tiangong, GPS- und Wettersatelliten sind **keine Live-Orbits** und dürfen nicht als TLE oder Echtzeitstandorte interpretiert werden. Unbekannte Größen kleiner Monde/Satelliten bleiben im Datensatz `0` statt erfundener Radien. Redaktionelle Beschreibungen enthalten Quellenlinks.

**Installation:** `Sonnensystem-Delta-v56.zip` ist ein **inkrementelles Update für v55**. Den ZIP-Inhalt über das Projektroot von v55 entpacken und alte Dateien überschreiben. App-Version **56.0.0**, PWA-Cache `sonnensystem-shell-v56`. Änderungsprotokoll: [Delta v56](docs/DELTA-V56.md).

## Direktwahlschalter und Layer-Darstellung (v55)

- **Hauptleiste:** Die drei eigenständigen Toggle-Buttons **Objekt**, **Bahn** und **Reihe** (je mit Icon und Text) stehen unmittelbar neben dem Layer- und Zeitsteuerungsbutton. Ein Maßstab-Trigger und das Maßstab-Popover existieren nicht mehr. Auf schmalen Bildschirmen kann sich die Leiste über zwei Zeilen verteilen.
- **Layer-Dropdown:** Unter den Presets **Alle** und **Standard** folgt eine Gruppe **Darstellung** mit den fünf bisherigen Schaltern **Beschriftung**, **Beleuchtung**, **Alle Monde** (neun Kreis-Punkte), **Umlaufbahn**, **Kontrast**. Darunter bleiben die einzeln wählbaren Objektkategorien in der bisherigen Reihenfolge, beginnend mit **Sterne**.
- **Unveränderte Schalterwirkung:** Anzeige- und Maßstabszustände bleiben erhalten; die Cinema-Startbedingung lautet weiterhin **Reihe An / Objekt An / Bahn Aus**. Für **Alle Monde** gilt **Aus = höchstens vier Monde je Planet**, **An = alle Monde**. Die getrennten Szenenoptionen werden weiter berücksichtigt.
- **Kompatibilität:** Die bisherigen Schalter-IDs und Ereignisverknüpfungen bleiben bestehen; nur der Menü-Auslöser Maßstab und dessen Öffnungslogik wurden entfernt.

**Installation:** `Sonnensystem-Delta-v55.zip` über eine vollständige **v54-Installation** entpacken und vorhandene Dateien ersetzen. App-Version **55.0.0**, Offline-Cache `sonnensystem-shell-v55`. Siehe [Delta v55](docs/DELTA-V55.md).

## Bisherige Neuerungen v54 (unverändert)

**Stand v54.** Cinema erscheint in der Reihenansicht bei **Objekt An / Bahn Aus**. Die Kamerafahrt zoomt für jeden Himmelskörper passend zu seinem Größenmaßstab und hält ungefähr **1,5 Sekunden**. Die Maßstab-Einstellungen sind in drei Spalten angeordnet; der Mond-Schalter zeigt nun **neun kreisförmige Punkte** und bedeutet bei **Aus** eine Grenze von vier Monden. Der Objektkatalog bleibt unverändert.

## Cinema-Kamerafahrt und Maßstab-Panel (historischer Stand v54; Bedienposition in v55 geändert)

- **Play-Bedingung:** Reihe **An**, Objektmaßstab **An**, Bahnabstände **Aus**. Die standardmäßige Aktivierung des Objektmaßstabs beim Betreten der Reihe erlaubt es, Cinema direkt zu starten, solange „Bahn“ ausgeschaltet ist.
- **Kamerafahrt:** Der Film sortiert nur die in der Szene sichtbaren Objekte nach ihren Katalogradien aufsteigend. Die tatsächlichen Objektgrößen bleiben proportional. Für jedes Objekt wird ein neuer Kameraabstand anhand der sichtbaren Kugel- bzw. Ringausdehnung und des Bildschirmformats gewählt; zwischen den Objekten erfolgt ein sanfter, logarithmischer Zoom und eine Fahrt nach rechts. **1.500 ms Haltezeit** pro Objekt und etwa **1.300 ms Überfahrt** zum nächsten Objekt. Eine kurze Anfahrt (1.100 ms) geht dem Film voraus. Die Gesamtdauer wächst mit der Anzahl sichtbarer Objekte.
- **Zeitleiste und Stop:** Die Zeitleiste lässt sich weiterhin ziehen. Beim Stoppen und am Ende werden Reihenfolge (groß nach klein), Kameraposition und Zoom wiederhergestellt. Größenmaßstabs- oder Layerwechsel und Änderungen der Mondanzahl beenden eine laufende Fahrt.
- **Control Panel:** Im Maßstab-Dropdown stehen **Objekt**, **Bahn** und **Reihe** in einer horizontalen Zeile. Der dritte Button besitzt nun die sichtbare Beschriftung **Reihe**. Die übrigen Optionen bleiben unter Objekt bzw. Bahn.
- **Monde:** Der Schalter mit **neun Punkten auf einem Kreis** ist nun als „Alle Monde“ beschriftet (Tooltip und Barrierefreiheitsname). **Aus = höchstens vier größte Monde pro Planet**, **An = alle natürlichen Monde des eingeschalteten Mond-Layers**. Die ursprünglichen inhaltlichen Voreinstellungen bleiben erhalten: Sonnensystem Aus (max. vier), Planetenansicht An (alle).

**Installation:** `Sonnensystem-Delta-v54.zip` über den vollständigen **v53-Stand** entpacken; vorhandene Dateien ersetzen. App-Version **54.0.0**, Offline-Cache `sonnensystem-shell-v54`. Weitere Details: [Delta v54](docs/DELTA-V54.md).

## Objekt-Reihen-Darstellung: Cinema-Modus (historischer Stand v53, in v54 ersetzt)

1. **Reihe** im Maßstab-Dropdown einschalten. Aus v51 wird der Größen-Toggle **Objekt** hierbei zunächst automatisch auf „maßstabsgetreu“ geschaltet.
2. **Objekt** und **Bahn** beide auf **schematisch / Aus** stellen. Nur in diesem Zustand erscheint im Control Panel ein zusätzlicher **Cinema-Play-Button**. Alle anderen Maßstabs- und Ansichtsmodi bleiben unverändert.
3. **Play** startet einen Größenvergleich der im aktuellen Layer sichtbaren Himmelskörper **von klein nach groß**, anhand ihres echten Katalogradius. Dabei sind die *angezeigten* Kugelgrößen absichtlich **schematisch**, nicht physikalisch proportional (beide Maßstabs-Toggles sind aus). Die Kamera fährt entlang der Reihe von links nach rechts. Ein neuer Abschnitt erhält jeweils ungefähr seinen eigenen Zeitanteil; die Gesamtdauer richtet sich nach der Zahl der sichtbaren Objekte (ca. 18–150 s).
4. Eine **Zeitleiste am unteren Bildschirmrand** zeigt Objektname, Fortschrittsposition und Zeit. Ihre Position lässt sich mit Maus, Touch oder Tastatur verändern. Während des Ziehens pausiert der automatische Fortschritt; danach geht die Kamerafahrt ab dieser Stelle weiter.
5. Während Cinema läuft, wird **Play** zu **Stop**. Stop setzt die gewöhnliche Reihenfolge **groß → klein** wieder ein und fährt die Kamera sanft zur **gespeicherten Position, Zoomstufe und Blickrichtung** zurück. Nach dem letzten Objekt endet die Fahrt automatisch. Ein Ansichts-/Maßstabswechsel, eine neue Auswahl oder manuelle Kamerabewegung beendet sie ebenfalls; der Reset-Button und `Esc` können die Fahrt abbrechen.

Die Funktionen gelten für Sonnensystem- und Planetenansicht und funktionieren ohne Videodateien, externe Aufrufe oder Medienrechte. Der Inspirationslink [Star Size Comparison](https://www.youtube.com/watch?v=HEheh1BH34Q) dient nur als visuelle Referenz; die 3D-Fahrt ist eine eigene Darstellung. Bei Verwendung des AR-Sensorblicks wird dieser vor Cinema abgeschaltet, damit er die Kamerafahrt nicht überschreibt.

**Installation:** `Sonnensystem-Delta-v53.zip` über den vollständigen **v52-Stand** entpacken; vorhandene Dateien ersetzen. App-Version **53.0.0**, PWA-Cache `sonnensystem-shell-v53`. Die Release-Änderungen und Testhinweise stehen unter [Delta v53](docs/DELTA-V53.md).

## Neues Layer-Dropdown und 14 weitere Himmelskörper (v52)

- **Layer-Reihenfolge:** **Sterne** steht als erste Objektkategorie, gefolgt von Planeten, Monden, Zwergplaneten, transneptunischen Objekten, Asteroiden, Satelliten, Kometen und Raumsonden.
- **Asteroiden:** (16) Psyche, (10) Hygiea, (162173) Ryugu, (25143) Itokawa, (243) Ida.
- **Kometen:** 67P/Tschurjumow-Gerassimenko, 9P/Tempel 1, 103P/Hartley 2, 81P/Wild 2.
- **Transneptunische Objekte:** Quaoar, Orcus, Gonggong, Sedna, Arrokoth. Diese fünf Objekte lassen sich über den neuen Layer gemeinsam anzeigen/verbergen.
- Jeder Neuzugang besitzt einen Katalogeintrag, ein vereinfachtes Kepler-Bahnmodell und redaktionelle Detailinformationen mit Quellenlinks. Internationale Bezeichnungen sind auch über die Katalogsuche auffindbar.
- Die Auswahl **Standard** zeigt weiterhin nur Sonne und Planeten, **Alle** aktiviert auch die neuen Objekte. In der Planetenansicht bleiben die passenden lokalen Layer sichtbar.

**Installation:** `Sonnensystem-Delta-v52.zip` über eine vollständige **v51-Installation** entpacken; vorhandene Dateien ersetzen. Version **52.0.0**, neuer Offline-Cache `sonnensystem-shell-v52`. Die Bahnen sind schematische Kepler-Fortschreibungen katalogisierter Elemente und **keine hochpräzisen Ephemeriden**. Details und Quellen: [Delta v52](docs/DELTA-V52.md).

## Reihenansicht mit maßstabsgetreuen Größen und sanfte Bahnwelle (v51)

- **Reihe aktivieren:** Beim Einschalten von **Reihe** wird **Objekt** automatisch auf **Maßstabsgetreu** gestellt (auch in der anderen Ansicht, da beide Ansichten denselben Objekt-Maßstab-Schalter teilen). Die physikalischen Radiusverhältnisse gelten sofort für die Reihen-Anordnung; der Wechsel wird wie bisher weich animiert. **Bahn** bleibt unberührt. Wer die Objektgrößen in der Reihe manuell auf schematisch schaltet, kann dies weiterhin tun; beim nächsten Einschalten der Reihe gilt erneut die maßstabsgetreue Voreinstellung. Das Verlassen der Reihe schaltet **Objekt** nicht automatisch zurück.
- **Planetenansicht, Bahn an → aus:** Statt des bisherigen Gummiband-Überschwingens werden Bahnen und zugehörige Körperpositionen **monoton und weich** auf die schematischen Abstände überführt. Die innerste sichtbare Bahn beginnt zuerst, die äußerste startet um maximal **ca. 200 ms** später – eine sanfte Welle von innen nach außen bei weiterhin etwa **980 ms** Gesamtdauer. Schnelles Zurückschalten beginnt aus dem bereits sichtbaren Zwischenstand, ohne zu springen. Andere Maßstabs- und Ansichtswechsel behalten ihre bisherige Animation; bei `prefers-reduced-motion` wird auch die Welle übersprungen. Details: [Delta v51](docs/DELTA-V51.md).

## Kamera neu ausrichten im AR-Modus (v50)

Bei aktivem AR-Modus dient **Kamera zurücksetzen** (unten rechts) zur **Neuausrichtung des AR-Blicks**: Die aktuelle Haltung des Smartphones wird als neue Referenz übernommen und die Blickrichtung auf die aktuelle Standardausrichtung der Szene gesetzt. Die Kamera bleibt am selben Standort, AR läuft ohne erneute Berechtigungsabfrage weiter, und eine kurze Meldung bestätigt die Neuausrichtung. Bei deaktiviertem AR bleibt die bisherige Funktion des Buttons unverändert (Kameraperspektiven umschalten bzw. Planetenansicht verlassen). Während auf die erste Sensorprobe gewartet wird, gilt weiterhin die normale Reset-Funktion. [Delta v50](docs/DELTA-V50.md).

## Kompakte Icon-Leiste und lesbare Reihe (v49)

- **Platzersparnis:** AR (falls eingeblendet), Maßstab und Objektlayer sind jeweils **49 statt 58 px** breit (etwa 15,5 % schmaler), unveränderte Höhe und Icons. Der **Zeitsteuerungsbutton bleibt 58 px** breit. Alle Dropdowns schließen weiterhin an der rechten Bildschirmkante ab, unabhängig vom optionalen AR-Button und den Safe-Area-Abständen.
- **Reihen-Beschriftung:** Labels stehen nach Größenrang abwechselnd **oberhalb** und **unterhalb** der Körper, unabhängig von ihrer Zeichenpriorität. Der Wechsel zurück zu Bahnen stellt die gewöhnliche Label-Ausrichtung wieder her.
- **Abstände:** Die erste Lücke bleibt unverändert, ab der zweiten Lücke wächst der größenabhängige freie Zwischenraum um **30 %**. Saturns sichtbarer Ringaußenrand wird bei der Platzverteilung und Label-Positionierung zusätzlich zum Planetenradius berücksichtigt. Die bisherige Reihenfolge, der linke Anschnitt des größten Objekts und die Übergangsanimationen bleiben erhalten. Details: [Delta v49](docs/DELTA-V49.md).

## AR-Modus: Mit dem Smartphone umsehen (v48)

- **Verfügbarkeit:** Links neben Maßstab erscheint ein AR-Button (Fadenkreuz-SVG) nur bei geeignetem Touch-Smartphone mit Geräteausrichtungs-API in sicherem Kontext (HTTPS bzw. localhost). Ohne Unterstützung bleibt die gewohnte Dreierleiste unverändert. Dies ist ein sensorbasierter AR-*Blickmodus*, kein Kamera-Livebild.
- **Bedienung:** Beim Antippen wird, falls nötig, die Browserberechtigung für Bewegungssensoren angefragt. Sobald eine gültige Sensormessung eintrifft, ist der Button aktiv (deutlich hervorgehoben); das Drehen, Neigen und Kippen des Smartphones ändert den Blick aus dem aktuellen Kamerastandort. Die Startausrichtung wird kalibriert, sodass kein Bildsprung entsteht. Erneutes Antippen deaktiviert. Pan- und Pinch-Gesten bleiben verwendbar.
- **Sicherheit und Fehlerfälle:** Keine Bildkamera-, Standort- oder Mikrofonberechtigung; es werden keine Sensordaten übertragen. Bei abgelehnter Berechtigung, fehlenden Sensordaten oder unsicherem Kontext wird AR nicht aktiviert. Beim Verlassen der Seite bzw. im Hintergrund stoppt die Sensorsteuerung. Eine kurze Snackbar unten rechts meldet Status und Fehler. Die zwei bisherigen und das Zeit-Dropdown bleiben unverändert rechtsbündig. Details: [Delta v48](docs/DELTA-V48.md).

## Neue Raumsteuerung und verdichtete Nah-Reihe (v47)

- **Maus:** **Links ziehen** verschiebt die Kamera entlang der Bahnebene; **rechts ziehen** dreht den Blickwinkel. **Shift + links** dient als alternative Drehgeste. Ein Klick links wählt weiterhin Objekte aus; das Mausrad zoomt. Pfeiltasten verschieben die Kamera unverändert.
- **Touch:** **Ein Finger wischen** verschiebt die Kamera; **zwei Finger gemeinsam wischen** drehen den Blickwinkel. **Zwei Finger spreizen/zusammenziehen** zoomen weiterhin. Beim Abheben eines Fingers entsteht keine versehentliche Objektauswahl.
- **Reihe:** Die Körper bleiben nach den hinterlegten realen Radien absteigend sortiert, ihre **Zwischenräume skalieren jetzt mit den Größen beider Nachbarn**. Die Übersichtskamera zeigt nur eine **schmale Randpartie (ca. 12 % des Durchmessers)** des größten Körpers am linken Rand und zoomt näher zu den folgenden Körpern. Statt alle oft winzigen Objekte gleichzeitig ins Bild zu zwingen, kann man die Reihe mit der neuen linken Maus-/Ein-Finger-Geste entlangfahren. Das Framing gilt in beiden Szenen und bei allen Maßstabskombinationen, auch im Hochformat. Bestehende Gummiband-Übergänge bleiben aktiv. Details: [Delta v47](docs/DELTA-V47.md).

## Durchgehende Szenenwechsel ohne Sprünge (v46)

Beim Umschalten zwischen **Schema und Maßstab**, der **Reihenansicht** und der **Sonnensystem-/Planetenansicht** werden Körperpositionen, Körperradien, Saturnringe und Umlaufbahnen weiterhin ca. **980 ms** mit einem leichten Gummiband-Effekt überblendet. In v46 bleibt jetzt zusätzlich beim **Ansichtswechsel die bisherige Szene während der Animation sichtbar**: Nicht mehr benötigte Körper und ihre Bahnen verblassen, neu auftauchende Körper und Bahnen werden sanft eingeblendet. Die Bahnlinien bleiben dabei an den **animierten Positionen der Sonne bzw. des Zentralplaneten** ausgerichtet.

Bei einem schnellen Zurückschalten beginnt sowohl die Objekt- als auch die Bahn-Deckkraft bei ihrem **momentan sichtbaren Wert**. So entstehen weder Helligkeitsblitze noch abrupt ein- oder ausgeblendete Planeten. Kamera, Objektfokus und Folgen werden weiterhin weich nachgeführt. Bei aktivierter Systemoption **„Bewegung reduzieren“** erfolgen die Szenenwechsel ohne diesen Federübergang. Es ändern sich weder die astronomischen Rohdaten noch die Schalterbelegung. Siehe [Delta v46](docs/DELTA-V46.md).

## Reihe und animierte Ansichtswechsel (v45)

Das **Maßstab-Dropdown** hat einen achten Toggle **Reihe** mit drei nach rechts kleiner werdenden SVG-Punkten, direkt unter **Umlaufbahn / Kontrast**. **Standard: Aus.** Bei **An** stehen die derzeit sichtbaren Körper in einer waagerechten Reihe – nach **katalogisiertem physikalischem Radius absteigend**, beginnend mit dem größten. Die Körper behalten dabei die Größe ihres aktuellen Objekt-Maßstabs. Zur Kollisionsvermeidung bleiben größenabhängige Zwischenräume; der Kamerabildausschnitt vergrößert die Folgeobjekte und schneidet das größte Objekt links gezielt an. Weitere Körper erreicht man durch Verschieben der Reihe. Die Einstellung ist getrennt für Sonnensystem- und isolierte Planetenansicht verfügbar. Bei aktivierter Reihe werden die Bahnlinien weich ausgeblendet, beim Verlassen wieder eingeblendet; die bisherige Umlaufbahn-Einstellung bleibt erhalten. Der Toggle meldet jede Änderung per Snackbar unten rechts.

**Animationen:** Umschalten zwischen schematischen und maßstabsgetreuen Größen/Entfernungen, Ein-/Ausschalten der Reihe sowie Wechsel zwischen Sonnensystem und Planetenansicht interpolieren Körperpositionen, Kugelradien, Saturnring-Größe und Bahnradien über rund **980 ms**, mit einem leichten elastischen Überschwingen am Ende. Die Kamera führt Zoom, Ziel und gegebenenfalls Blickwinkel nach. Während eines Übergangs sind erneute Klicks zulässig; sie starten von der aktuellen Zwischenposition ohne Sprung. `prefers-reduced-motion` unterdrückt die Federanimationen. Die tatsächlichen Bahnparameter und die bisherige Zeitsteuerung bleiben unverändert. Details: [Delta v45](docs/DELTA-V45.md).

## Optimierte Größenverhältnisse (v44)

Bei der Schalterkombination **Objekt an / Bahn aus** erhält die Sonnensystem-Übersicht den Modus **„Optimierte Größenverhältnisse“**:

- **Sonne:** exakt **4 ×** der bisherige schematische Sonnenradius (4,52 Szeneneinheiten gegenüber 1,13).
- **Planeten:** die Kugelradien bleiben proportional zu ihren physikalischen Radien (`radiusKm`). Derselbe gemeinsame Umrechnungsfaktor gilt für Sonne, Planeten und andere Körper. Planeten behalten damit ihre Größenverhältnisse untereinander sowie zur Sonne bei. Unbekannte Radien werden nicht ergänzt.
- **Bahnen:** die bisherige schematische Abstandszuordnung bleibt erhalten, wird aber in der Sonnensystem-Übersicht einheitlich **4 ×** vergrößert. So bleibt insbesondere zwischen der vergrößerten Sonne und Merkur Platz, ohne die relative Anordnung der schematischen Bahnen zu verändern.
- **Kamera:** die automatische Sonnensystem-Übersicht und ihr maximaler Zoomabstand passen sich an die erweiterten Bahnen an. Bei manuell verschobener Kamera wird der eingestellte Blickwinkel nicht überschrieben. Eine Snackbar meldet das Betreten des Modus; der Tooltip des Maßstab-Buttons nennt den Modus ebenfalls.

Die anderen drei Schalterkombinationen bleiben unverändert: **Aus/Aus** = schematisch; **Aus/An** = schematische Körper mit physikalischen Bahnen; **An/An** = physikalisch proportionale Größen und Bahnabstände. In der isolierten **Planetenansicht** bleibt die vorhandene lokale Skalierung unverändert; die modifizierten Sonnen-/Bahn-Faktoren betreffen nur die Sonnensystem-Übersicht. Die Darstellung ist eine Visualisierung und verbessert nicht die Genauigkeit der Bahndaten. Siehe [Delta v44](docs/DELTA-V44.md).

## Kompaktes Maßstab-Dropdown (v43)

Das Maßstab-Menü enthält zwei Spalten ohne eigene Überschrift und ohne Fußnote. Insgesamt **sieben Toggle-Buttons** bleiben erhalten. Ihre An/Aus-Zustände werden durch das aktive Styling, die aktualisierten Tooltips und `aria-pressed` vermittelt; Text-Statusindikatoren direkt in den Buttons entfallen. Jede manuelle Statusänderung blendet eine **Snackbar unten rechts** für etwa 2,4 Sekunden ein.

- **Objekt** (vertikaler Doppelpfeil): **Beschriftung** und **Beleuchtung** direkt nebeneinander, darunter **4 Monde** über die gesamte Spaltenbreite.
- **Bahn** (horizontaler Doppelpfeil): **Umlaufbahn** und **Kontrast** nebeneinander.

Der **Farben-Schalter entfällt**: Bahnen verwenden immer die jeweilige Objektkategorie-Farbe; für die Erdumlaufbahn bleibt die besondere Akzentfarbe aktiv. Kontrast schaltet weiterhin unabhängig Breite und Deckkraft der Orbitlinien. Die Mond-Kategoriefarbe bleibt `#E6EDF5`.

Die Beleuchtungs-Standards bleiben **Sonnensystem: Aus (Optimiert)** und **Planetenansicht: An (Realistisch)**. Alle weiteren Optionen außer den beiden szenenübergreifenden Maßstabs-Toggles behalten ihre separaten Einstellungen für beide Szenen.

Details: [Delta v43](docs/DELTA-V43.md); neuer Skalierungsmodus: [Delta v44](docs/DELTA-V44.md).

## Maßstab: Objektgrößen und Bahnabstände (v41)

Im Dropdown **Maßstab** (SVG: waagerechter Doppelpfeil mit Begrenzungsstrichen) stehen zwei große Icon-Toggles nebeneinander:

- **Objekt** (vertikaler Doppelpfeil): skaliert Kugelgrößen nach den physischen Radien der Himmelskörper.
- **Bahn** (horizontaler Doppelpfeil): skaliert Bahnradien nach den tatsächlichen großen Halbachsen der Katalogdaten.

**Aus/Aus** ist die bisherige schematische Darstellung und bleibt der Standard. Beide Schalter lassen sich unabhängig betätigen. **An/An** zeigt Körperradien und Abstände in einer gemeinsamen geometrischen Einheit je Szene; **An/Aus** nutzt seit v44 in der Sonnenübersicht die optimierten Größenverhältnisse statt der ursprünglichen v41-Skalierung. Die Einstellungen gelten gleichermaßen für Sonnensystem- und Planetenansicht. Bei echten Größen sind kleinere Objekte im Überblick teilweise nur noch anhand der Labels erkennbar; das ist eine Konsequenz der sehr großen astronomischen Größenverhältnisse. Unbekannte Radien bleiben nicht darstellbar, statt durch fiktive Werte ersetzt zu werden. Der Maßstabsschalter verbessert **nicht** die Genauigkeit der zugrunde liegenden Bahnelemente. Siehe [Delta v41](docs/DELTA-V41.md).

## Horizontales Control-Panel (seit v40, erweitert in v42)

Das in v40 eingeführte horizontale Panel erhielt in v41 den Maßstab-Button. Seit v42 stehen **Maßstab**, **Objektlayer** und **Zeitsteuerung** in dieser Reihenfolge nebeneinander oben rechts. Alle drei Dropdown-Panels erscheinen darunter mit einer gemeinsamen, bis zum rechten Rand reichenden Kante; das schmale Zeitmenü verdeckt so nur den rechten Bildbereich. Auf Desktop und Mobil kann durch direkten Klick auf einen anderen Button **in einem Schritt** zwischen den Menüs gewechselt werden. Das bisher geöffnete Menü schließt sich automatisch. `Escape` und Klicks außerhalb schließen die Popovers weiterhin; Bedien- und Filterfunktionen bleiben unverändert. Siehe [Delta v40](docs/DELTA-V40.md).

## Folgen: Ansicht des übergeordneten Planeten (v39)

Bei **Folgen → An** für ein Objekt, das einen Planeten oder Zwergplaneten direkt umkreist (z. B. Mond, Charon oder künstlicher Satellit), öffnet die App zuerst die **Planetenansicht des Parents** und verfolgt anschließend das **gewählte Kindobjekt**. Die Auswahl wechselt nicht zum Parent. Bei bereits geöffneter passender Planetenansicht erfolgt kein erneuter Szenenwechsel. Bei anderen Objekten (z. B. Sonne, Planet, Zwergplanet oder Asteroid mit Sonne als Parent) bleibt die bisherige Ansicht erhalten. **Folgen → Aus** ändert die Ansicht nicht.

Der globale Folgen-Toggle, seine Abbruchbedingungen und die Szenensteuerung bleiben ansonsten unverändert. Siehe [Delta v39](docs/DELTA-V39.md).

## Objektdetails: Planetenansicht und globales Folgen (v38)

- Der Button **„Planetenansicht“** ersetzt **„Planetenansicht öffnen“**. Die bisherige Unterzeile mit den Zahlen zu Monden und Satelliten entfällt. Monden bleibt die Aktion auf das übergeordnete Planetensystem erhalten; eine bereits geöffnete Planetenansicht kann damit weiterhin neu zentriert werden.
- Der bisherige **„Zentrieren“**-Button heißt jetzt **„Folgen“** und behält sein Fadenkreuz-Symbol. Er ist ein **globaler An/Aus-Toggle** (grün bei An, `aria-pressed` synchron), unabhängig von der Kategorie oder der aktuellen Szene.
- Ist **Folgen An**, zentriert die Kamera das aktuelle Objekt und führt dessen berechnete Position nach. Bei Auswahl eines anderen darstellbaren Objekts springt das Tracking automatisch auf das neue Ziel, ohne den Toggle auszuschalten.
- **Drehen, Perspektivenwechsel und Zoomen (Mausrad oder Touch-Pinch)** lassen Folgen eingeschaltet. Ein bewusstes **Verschieben/Schwenken** der Kameraposition (Rechtsziehen, Shift-Ziehen, Pfeiltasten oder Zwei-Finger-Pan) schaltet Folgen aus. Ebenso beendet eine zu schnelle Bewegung (> eine projizierte Bildschirmhöhe pro Echtzeitsekunde) die Nachführung, um abrupte Kamerasprünge zu vermeiden.
- Bei fehlender Auswahl oder einer Raumsonde ohne Ephemeride pausiert die aktive Nachführung, bleibt jedoch eingeschaltet und folgt nach der nächsten gültigen Auswahl automatisch weiter. Änderungen zwischen Sonnensystem- und Planetenansicht behalten den globalen Zustand bei. Die mobile Fokussierung berücksichtigt weiterhin die freie Fläche oberhalb des geöffneten Sheets.

Die Menübreiten aus v37 bleiben unverändert. Weitere Details: [Delta v38](docs/DELTA-V38.md). Die ursprüngliche Ein-Ziel-Nachführung ist in [Delta v37](docs/DELTA-V37.md) dokumentiert.

## Zeitsteuerung: längerer Range-Slider mit seitlichen Endwerten (v36)

Der vertikale Geschwindigkeitsregler ist jetzt **50 px länger** (Range von 132 auf 182 px, zugehörige Schiene von 150 auf 200 px). **Maximum und Minimum stehen rechts neben dem Regler**, jeweils auf Höhe des oberen bzw. unteren Endpunkts statt darüber und darunter. Das Zeit-Popover ist dafür 160 px breit; damit bleiben beide Beschriftungen lesbar und die Slider-Spalte hat mehr Platz in der Höhe. Bei niedrigen Viewports wird die bisherige kompaktere Variante ebenfalls um 50 px verlängert. Geschwindigkeitsbereich, logarithmische Stufen und Wiedergabefunktionen bleiben unverändert.

Details: [Delta v36](docs/DELTA-V36.md).

## Mobile Ansicht: eingeklapptes Sheet 45 px (v35)

Im **geschlossenen** Zustand ragt das Mobile-Sheet jetzt **45 px statt 52 px** über den unteren Bildschirmrand. Die Tab-Leiste ist 44 px hoch zuzüglich 1 px Rahmen, sodass die dynamische Höhe `--sheet-visible` ebenfalls exakt 45 px beträgt. Der Kamera-Button hält den bisherigen Abstand oberhalb der sichtbaren Sheet-Kante ein. Halb und vollständig geöffnetes Sheet sowie Wischgesten und History-Back bleiben unverändert.

Details: [Delta v35](docs/DELTA-V35.md).

## Beleuchtungsschalter als An/Aus-Toggle (v34)

Der Schalter **Beleuchtung** im Layer-Dropdown zeigt jetzt **Aus** (Standard, **Optimiert**) bzw. **An** (**Realistisch**). Nur die Beschriftung und die Schalterzustände wurden umgestellt: Die beiden Rendering-Modi und ihre bisherigen Beleuchtungsformeln bleiben identisch. `aria-pressed` und die aktive Schalterdarstellung sind nur bei **An / Realistisch** gesetzt. Die Sonnensystem- und Planetenansicht behalten ihre separaten Einstellungen.

Details: [Delta v34](docs/DELTA-V34.md).

## Mobiles Sheet mit Verlauf-Zurück schließen (v33)

- Beim Öffnen des mobilen Sheets wird **genau ein temporärer Eintrag im Browser-Verlauf** angelegt, ohne die URL zu ändern. **Zurück** (Browser, Android oder PWA) schließt das halb oder vollständig geöffnete Sheet und bleibt auf der Sonnensystemseite.
- Tabs und die drei Sheet-Positionen erzeugen keine zusätzlichen Verlaufseinträge.
- Schließen per Sheet-Header, Wischgeste, Bildschirmabdeckung, Escape oder Kamera-Button entfernt auch den temporären Verlaufseintrag. **Vorwärts** kann das Sheet nach einem Zurück erneut öffnen.
- Beim Wechsel zur Desktopansicht wird ein offenes mobiles Sheet ebenfalls geschlossen und sein temporärer Verlaufseintrag entfernt.

Details: [Delta v33](docs/DELTA-V33.md).

## Katalog: Kategoriepunkt und Objektfarben (v32)

- Vor dem Objektnamen steht ein **vertikal zentrierter, 7 px großer Kategoriepunkt**. Seine Farbe entspricht der Objektkategorie (dieselbe Farbpalette wie für die Layer).
- Das runde Objektsymbol links verwendet wieder die **individuelle Objektfarbe aus dem Katalog** statt die Kategorie-Farbe. Für Objekte ohne gültige Objektfarbe gilt ein neutraler, blaugrauer Ersatzwert.
- Die Änderung gilt gleichermaßen für den Desktop-Katalog und den mobilen Katalog im Bottom-Sheet. Namen werden weiterhin bei Platzmangel mit Auslassungspunkten gekürzt; der Kategoriepunkt bleibt sichtbar.

Details: [Delta v32](docs/DELTA-V32.md).

## Layer-Dropdown und mobiler Objektfokus (v31)

- Das **Layer-Popover ist 166 px breit** (bisher 188 px), sowohl am Desktop als auch mobil.
- Bei der **Auswahl eines Objekts aus dem mobilen Katalog** fokussiert die Kamera den Mittelpunkt des sichtbaren 3D-Bereichs **oberhalb des halb geöffneten Bottom-Sheets** statt die verdeckte Mitte der gesamten Canvas. Die freie Fläche wird anhand der tatsächlichen Sheet-Kante bestimmt, auch bei Animation, Drag und Änderung der Fensterhöhe. Die Kamera verwendet dafür eine angepasste Perspektivprojektion; Zoom-Entfernung und 3D-Position des ausgewählten Objekts bleiben erhalten.
- Bei geschlossenem Sheet, auf dem Desktop und nach manueller Kamerabewegung gilt die normale Bildmitte. Das Zurücksetzen und der Perspektivwechsel funktionieren wie zuvor.

Details: [Delta v31](docs/DELTA-V31.md).

## Objektdetails und mobiler Kamera-Button (v30)

- Der Bereich **„Objekt hinzufügen“** samt NASA-Suchformular unter dem Objektkatalog ist in der Desktop-Seitenleiste und im mobilen Sheet entfernt. Die reguläre Katalogsuche bleibt erhalten. Bereits vorhandene Asteroiden können weiterhin beim Auswählen durch JPL SBDB aktualisiert werden.
- Mobil steht der runde **Kamera-zurücksetzen**-Button **12 px (mindestens) oberhalb der jeweils sichtbaren Sheet-Kante**, sowohl bei geschlossenem als auch halb geöffnetem Sheet. Beim Hoch- und Runterziehen folgt der Button der Kante, und beim Einrasten animieren beide synchron. Bei voll geöffnetem Sheet liegt der Button außerhalb des sichtbaren Szenenbereichs und ist nicht fokussierbar. Desktop bleibt unverändert.

Details: [Delta v30](docs/DELTA-V30.md).

## Beleuchtung und „4 Monde“ (v29)

Im Layer-Dropdown befinden sich direkt unter **Beschriftung** zwei zusätzliche Toggles:

- **Beleuchtung:** Der Schalter steht standardmäßig auf **Aus = Optimiert** in beiden Ansichten (hellere unbeleuchtete Planetenseite). **An = Realistisch** bewahrt die bisherige v28-Beleuchtung unverändert. Die Sonne bleibt in beiden Modi selbstleuchtend.
- **4 Monde:** zeigt höchstens die **vier größten natürlichen Monde pro Planet bzw. Zwergplanet** anhand des Katalogradius. Der Schalter ist in der Sonnensystemansicht standardmäßig **An**, in der isolierten Planetenansicht standardmäßig **Aus**. Bei „Aus“ werden alle Monde des aktivierten Mond-Layers gezeigt. Die Auswahl gilt auch für Objektkörper, Mond-Umlaufbahnen in der Planetenansicht, Anklickbarkeit und Labels. Katalogeinträge bleiben vollständig erhalten. Ein ausgeschalteter Mond-Layer bleibt durch „4 Monde“ ausgeschaltet.

Die Beleuchtungs- und Mond-Einstellungen werden wie die anderen Ansichtsoptionen getrennt pro Szenentyp beibehalten. Details: [Delta v29](docs/DELTA-V29.md).

## Kamera-Perspektiven (v28)

Der Kamera-Button unten rechts zeigt jetzt vier nach außen weisende Pfeile. Bei unveränderter Ansicht schaltet er zyklisch zwischen **Schräg/oben** (Standard), **Von der Seite** und **Draufsicht**. Nach manuellem Drehen, Verschieben oder Zoomen führt der nächste Klick zuerst zurück zur **Schräg/oben**-Übersicht; erst danach wird weitergeschaltet. In einer isolierten Planetenansicht führt der Button zunächst wie bisher zur Sonnensystem-Übersicht.

## Details-Navigation und mobiles Sheet (v27)

Der Index im Kopf der **Objektdetails** hat jetzt zwei Pfeiltasten: vorheriges und nächstes Objekt **derselben Kategorie**. Die Auswahl springt am Ende wieder zum Anfang (und umgekehrt). Bei nur einem Objekt oder ohne Auswahl sind die Tasten deaktiviert; beim Wechsel werden Details und Szenenauswahl aktualisiert.

Mobil entfällt der separate Sheet-Griff. Der **gesamte Header** mit den zwei Tabs lässt sich nach oben bzw. unten ziehen. Die Tabs bleiben einzeln auswählbar; ein Tipp in den freien Headerbereich oder Eingabe/Leertaste bei fokussiertem Header wechselt den Öffnungszustand. Das Sheet nimmt im halb geöffneten Zustand jetzt wirklich nur seine sichtbare Höhe ein; dadurch können Katalog und Details **bis ganz unten gescrollt** werden.

Die Zwergplaneten- und Mondfunktionen von v26 bleiben erhalten. Anleitung: [docs/HILFE.md](docs/HILFE.md), Änderungen: [Delta v27](docs/DELTA-V27.md).

## Starten

1. **Zuerst das vollständige v8-ZIP** direkt ins Workspace-Root entpacken; danach **Delta v9.1, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27, v28, v29, v30, v31, v32, v33, v34, v35 und v36 in dieser Reihenfolge** in dasselbe Verzeichnis überlagern und vorhandene Dateien ersetzen. `index.html`, `sw.js`, `package.json`, `data/`, `src/`, `server/` müssen dort liegen. Keinen `public/`-Ordner erstellen.
2. Node.js 20+ verwenden. Zusätzliche npm-Pakete sind nicht erforderlich.
3. `npm start` im Workspace-Root aufrufen und `http://localhost:4173` öffnen.
4. Die Anwendung kann auch von einem einfachen statischen Workspace-HTTP-Server geladen werden; dann fehlen die optionalen Live-API-Funktionen.

```bash
npm start           # HTTP-Server und optionale NASA/andere Proxies
npm run check       # Datenvalidierung und Regressionstests
npm run check:data  # Struktur, IDs, Querverweise und Quellenlinks
```

## Objekt-Auswahl und Labels (v11)

Ein kurzer Klick/Tipp **auf einen Himmelskörper** wählt ihn aus. Ein kurzer Klick/Tipp **in den freien 3D-Hintergrund** hebt die Auswahl auf, ohne die Kamera oder die aktuelle Ansicht zurückzusetzen. Der Tab „Details“ zeigt danach den neutralen Zustand. Zieh-/Dreh- und Zwei-Finger-Gesten lösen keine Abwahl aus.

**Das Label eines ausgewählten Objekts bleibt sichtbar**, auch wenn Satelliten vorbeifliegen, eine Kollision mit anderen Beschriftungen entsteht oder die Kamera kurz schnell schwenkt. Seine letzte passende Seite bleibt möglichst erhalten; andere Labels haben niedrigere Priorität. Nur ein manuelles Abschalten aller Labels oder ein nicht mehr projizierbares Objekt unterbindet die Beschriftung.

## Oberflächentexturen (v12, lokal)

Die App liest **ausschließlich lokale Bilder** aus `textures/standard/`, z. B. `earth.jpg`, `moon.png`, `titan.webp` oder vorhandene 2K-Quelldateinamen wie `2k_earth_daymap.jpg`. Gültige Formate: JPG, JPEG, PNG und WebP. JPEG ist nicht vorgeschrieben. Dateinamen verwenden die Objekt-ID aus dem Katalog; einige bekannte 2K-Aliasnamen werden ebenfalls erkannt. Die Bilder müssen vom Betreiber selbst in diesen Ordner gelegt werden; sie werden **nicht** ins Delta-ZIP gepackt. Fehlende Texturen fallen auf den bestehenden schematischen Shader zurück.

Es gibt **keinen externen Textur-Download, kein CORS-Fallback und keinen Texturproxy** mehr. Die maximalen GPU-Auflösungen sind 2048 px (Sonnensystem), 4096 px (Planetenansicht) und 512 px (Mobil). Kleinere Quelldateien werden nicht hochgerechnet.

## Raumsonden (v12)

Neue Layer-Kategorie „Raumsonden“ mit **Voyager 1, Voyager 2, Pioneer 10, Pioneer 11, New Horizons, Cassini, Galileo und Huygens**. In der Liste und Detailansicht erscheinen belegte Startdaten, Ziele, Missionsstatus und NASA-Quellenlinks. **Keine schematischen 3D-Positionen:** Interplanetare und interstellare Bahnen werden ohne echte Ephemeriden nicht als künstliche Kreisbahnen dargestellt. Diese Kategorie enthält daher Missionsinformationen, keine live berechneten Ortsdaten.

## Smarte Labels (v16)

In beiden Ansichten werden Beschriftungen nach Bedeutung sortiert. **Statt Überlagerungskollisionen auszuwerten, begrenzt v16 die Anzahl der normalen Labels je Bildschirmfeld von 160 × 110 CSS-Pixeln auf zwei.** Labelüberlappungen sind daher bewusst möglich. Die wichtigste Beschriftung gewinnt; zuvor sichtbare Labels erhalten einen kleinen Prioritätsbonus. Eine 18-Pixel-Randzone um ein zuvor zugewiesenes Feld verhindert Flackern beim Überschreiten der Feldgrenze.

**Ausgewählte Objekte sind vom Dichtelimit ausgenommen** und bleiben beschriftet. Labels behalten ihre Ankerseite und wechseln diese nur, wenn die Beschriftung sonst den sichtbaren Bildschirm verlassen würde. Vorbeifliegende Satelliten, andere Labels und Himmelskörper lösen keinen positionsbedingten Seitenwechsel und keine kollisionsbedingte Ausblendung mehr aus.

Der separate Geschwindigkeitsfilter aus v9 bleibt erhalten: Normale Labels bei mehr als 220 Bildschirmpixeln/s werden vorübergehend unterdrückt und kehren nach einer Ruhephase zurück. Ausgewählte Labels sind hiervon ausgenommen. Das manuelle Ein-/Ausschalten der Namen bleibt unverändert.

## Objektlayer und Katalogsuche (historischer Stand v15; aktueller Stand siehe v25)

Im historischen v15-Stand war das Control-Panel oben rechts **110 px breit statt 184 px**; in v26 **100 px**, seit v27 **58 px** (rahmenlos). Der sichtbare Schriftzug „Ansicht“ über der Ansichtsauswahl entfällt (ein Screenreader-Label bleibt vorhanden). Auf Mobilgeräten bleibt das vollständige Control-Panel **dauerhaft oben rechts in der 3D-Szene**.

Das neue **Layer-Dropdown** bietet zwei Voreinstellungen und eine freie Mehrfachauswahl:

- **Standard (v25):** Sonnensystem: Sterne und Planeten. Planetenansicht: Planeten, Monde und Satelliten.
- **Alle:** alle acht Objektkategorien (Planeten, Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen, Raumsonden, Sterne).
- **Individuell:** beliebige Kombinationen über Checkboxen, mindestens eine Kategorie bleibt aktiv. Bei exakt den Standard-/Alle-Kategorien wird der jeweilige Preset-Status automatisch angezeigt. „Alle“ und „Standard“ liegen als zwei Segmente eines gemeinsamen Umschalters ohne Trennstrich zu den Checkboxen direkt nebeneinander.

**Seit v24 filtern die Layer ausschließlich den WebGL-Renderer**, einschließlich Körpern, Bahnen, Labels und Anklickbarkeit in der 3D-Ansicht. Der Katalog listet dagegen unabhängig von den Layern **alle geladenen Objekte**; eine bestehende Katalogauswahl wird beim Ausblenden der Renderer-Kategorie nicht aufgehoben. Seit v23 behalten Sonnensystem- und Planetenansicht **eigene** Layer-, Bahn- und Beschriftungseinstellungen. In der Planetenansicht zeigt „Standard“ den Planeten sowie seine vorhandenen Monde und Satelliten. Kategorien ohne direkt dem Planeten zugeordnete Objekte werden ausgeblendet. Die Sonne zählt zur Kategorie „Sterne“ und ist im Sonnensystem-Standard sichtbar. Das Sternenfeld im Hintergrund bleibt als Szenendekoration bestehen. Raumsonden bleiben ohne Ephemeriden wie in v12 reine Katalogeinträge.

Der Katalog hat keine Kategorie-Filterchips. Die Suche prüft zusätzlich zum Namen, zur Objekt-ID und zur Katalognummer die **deutsche Objektkategorie (Singular/Plural)** sowie den **Namen bzw. die ID des direkten übergeordneten Objekts**. Seit v24 werden Leerzeichen als UND-Verknüpfung behandelt; jedes Suchwort darf in einem anderen Feld vorkommen. Beispiel: `uranus c` findet die Uranus-Monde mit „c“ im Namen; `Monde Jupiter` findet Jupitermonde, unabhängig von der Wortreihenfolge. Groß- und Kleinschreibung sowie Akzente werden normalisiert. In der Planetenansicht erscheint rechts neben der Suche ein **Planetensymbol-Button** (anfangs aus); er zeigt auf Wunsch nur den aktiven Planeten und seine zugehörigen Objekte. In der Sonnenansicht ist dieser Schalter verborgen.

## Control-Panel und Zeitsteuerung (v21)

Das seit v40 horizontale, rahmenlose Control-Panel bleibt oben rechts. Seit v42 stehen darin **Maßstab, Objektlayer und Zeit-Dropdown** (ohne Ansichtsauswahl). Sein zweizeiliges Label zeigt die aktuelle **Simulationsgeschwindigkeit** (z. B. `5 Tage / s`) und das **lokale Simulationsdatum** im Format `DD.MM.YYYY` (keine Uhrzeit). Die zwei Einzelknöpfe für Play/Pause und „Heute“ sind nicht mehr direkt im Panel sichtbar.

Ein Klick auf den Zeitknopf öffnet ein **an der rechten Bildschirmkante bündiges Menü unter der horizontalen Buttonreihe**. Seit v27 ist das Menü **116 px** breit, unabhängig von der **58 px** breiten Auslösertaste. Oben steht die Geschwindigkeit. Darunter befindet sich der vertikale 241-Stufen-Regler mit mittigem, kontrastreichem Griff und dynamisch gefüllter Spur (von unten bis zum aktuellen Wert). **Unter dem Slider** liegen Play/Pause und der auf ein Symbol reduzierte Heute-Button **nebeneinander**. Zuletzt folgen **Datum und Uhrzeit** in zwei Zeilen (`DD.MM.YYYY` / `hh:mm`). Der Heute-Button behält den zugänglichen Namen und die Zurücksetzfunktion. `Esc` schließt das Menü und setzt den Tastaturfokus auf den Auslöser; Klick außerhalb schließt es ebenfalls. Beim Öffnen der Objektlayer-Auswahl wird das Zeitmenü geschlossen.

Auf Smartphones und Tablets bis 770 px befindet sich das vollständige Control-Panel **direkt über der 3D-Szene**. Layer und Zeit sind dort erreichbar; der separate runde Kamera-Reset sitzt rechts unten oberhalb der geschlossenen Sheet-Leiste. Beide Dropdowns öffnen unter der Buttonreihe bündig an der rechten Bildschirmkante; das Layer-Menü ist für kleine Bildschirme scrollbar. Das Bottom-Sheet hat nur die zwei Tabs **„Objekte“** und **„Details“**. Der Regler besitzt einen größeren, hellen Griff mit dunkler Umrandung und seit v21 eine zentrierte Position und eine füllende Farbspur.

- **Play/Pause:** Stellt nur den Wiedergabestatus um und behält die Geschwindigkeit.
- **Regler:** 241 Stufen logarithmisch; nach oben schneller. Die beiden Ansichten speichern die zuletzt gewählte Geschwindigkeit separat.
- **Heute:** Setzt `S.time = Date.now()` in der lokalen Anzeige; Kameraposition, Ansicht, Geschwindigkeit und Play/Pause bleiben unverändert.

| Ansicht | Minimum | Standard | Maximum |
|---|---:|---:|---:|
| Sonnensystem | 1 Stunde / s | 5 Tage / s | 10 Jahre / s |
| Planetenansicht | 1 Minute / s | 1 Stunde / s | 1 Jahr / s |

Der **Kamera-zurücksetzen**-Button sitzt seit v27 außerhalb des Panels unten rechts: in der Sonnensystemansicht wechselt er zwischen drei Kameraperspektiven (nach manueller Bewegung zuerst zurück zur Standardperspektive), in einer isolierten Ansicht führt er zur Sonnensystemübersicht. **Bei aktivem AR** kalibriert derselbe Button stattdessen die Blickrichtung neu. Der **Beschriftung**-Schalter liegt seit v20 im Objektlayer-Dropdown, zusammen mit den Bahneinstellungen; darunter stehen seit v29 **Beleuchtung** und **4 Monde**.

## Katalog unabhängig vom Renderer (v24)

Unabhängig von den Renderer-Layern erscheinen alle Objekte in der Liste und bleiben durchsuchbar. Der optionale Planetensymbol-Filter neben dem Suchfeld ist nur in der Planetenansicht sichtbar, startet ausgeschaltet und begrenzt die Liste auf den aktuellen Planeten samt zugehörigen Begleitern. Beim Wechsel des Planeten folgt er dem neu gewählten System; beim Wechsel zur Sonnenansicht ist er ohne Wirkung. Die Suche kombiniert Suchwörter feldübergreifend, z. B. `uranus c`. Siehe [Delta v24](docs/DELTA-V24.md).

## Kompaktes Objektlayer-Dropdown und neue Standards (v25)

**Sonnensystem:** Standard = **Sterne + Planeten**; Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen und Raumsonden sind zunächst aus. **Planetenansicht:** Standard = **Planeten + Monde + Satelliten**, soweit beim aktuellen Planeten vorhanden. Die Zustände beider Ansichten werden weiterhin unabhängig geführt; „Alle“ schaltet alle verfügbaren Kategorien ein, benutzerdefinierte Kombinationen bleiben möglich.

Das Layer-Menü ist von **227 px auf 152 px** reduziert (ca. 33 %). „Alle“ und „Standard“ bilden einen gemeinsamen segmentierten Umschalter; die frühere Trennlinie zwischen diesem Umschalter und den Kategorie-Checkboxen entfällt. Die Überschriften „Objektlayer“, „Umlaufbahnen“ und „Beschriftung“ sowie der Textabsatz unter den Bahnschaltern wurden entfernt. **Umlaufbahn** bleibt als Hauptschalter erhalten; **Kontrast** und **Farben** sind leicht eingerückt. **Beschriftung** bleibt als eigenständiger Schalter sichtbar. Siehe [Delta v25](docs/DELTA-V25.md).

## Getrennte Layer und Standardgeschwindigkeit (v23)

Die Sonnensystemansicht startet mit **5 simulierten Tagen pro realer Sekunde** (Reglerstufe 101). Die Planetenansicht bleibt bei **1 Stunde/s**. Die beiden Geschwindigkeiten sind weiterhin unabhängig.

**Objektlayer, Umlaufbahnen, Kontrast und Beschriftungen** werden getrennt für die beiden Ansichten gespeichert; die Bahnfarben sind seit v43 fest aktiv. Bei einem Szenenwechsel werden die Einstellungen der Zielansicht wiederhergestellt. In v23/v24 umfasste der Standard **Planeten, Monde und Satelliten** und in der Sonnenübersicht zusätzlich **Sterne**. Seit v25 startet die Sonnenübersicht dagegen ausschließlich mit **Sterne und Planeten**; die planetenzentrierte Voreinstellung bleibt unverändert. Bei einem ausgewählten Planeten erscheinen im Layer-Dropdown nur der Planetentyp und die tatsächlich im Katalog unter `parentId` dieses Planeten verzeichneten Kindkategorien. Bei Erde sind dies Planeten, Monde und Satelliten, bei Jupiter Planeten und Monde. In der Szene verbleiben immer mindestens eine aktivierte verfügbare Kategorie; verdeckte Kategorien bleiben als Status für andere Planeten erhalten. Details: [Delta v23](docs/DELTA-V23.md).

## Vollständige Sonnenbahnen und Mondbeschriftungen (v22)

In der Sonnensystemansicht erscheinen bei aktivierten Umlaufbahnen die Pfade **aller** Objekte mit Sonne als direktem Elternkörper, die einer aktiven Layer-Kategorie angehören und gültige Bahnparameter haben. Dies umfasst die nicht ausgewählten Zwergplaneten, Asteroiden und Kometen. Monde und Satelliten umkreisen stattdessen Planeten; ihre Bahnen werden unverändert in den Planetenansichten gezeichnet, nicht fälschlich als Kreise um die Sonne. Historisch (v22–v28) konkurrierten pro Planet nur die **vier größten Monde** um ein Label; ein ausgewählter kleinerer Mond konnte den viertgrößten Kandidaten ersetzen. **Seit v29** steuert der neue „4 Monde“-Toggle die tatsächliche Sichtbarkeit: Bei **An** sind nur die vier größten Monde samt Labels sichtbar, bei **Aus** alle aktiven Monde mit den üblichen Dichte- und Bewegungsfiltern.

## Objektlayer und Orbitdarstellung (seit v20; aktualisiert v43)

Das Objektlayer-Dropdown öffnet unter der horizontalen Buttonreihe rechtsbündig am Bildschirmrand und enthält heute nur Layer-Presets und Kategorie-Checkboxen. Im benachbarten Maßstab-Menü sind **Umlaufbahn** (ein-/ausblenden), **Kontrast** (breitere und deckendere Striche) und **Beschriftung** untergebracht. Die Bahnfarben entsprechen seit v43 stets der Kategoriepalette; ein Farben-Schalter ist nicht mehr vorhanden. Beim Start sind Umlaufbahnen und Beschriftungen an, Kontrast aus. Die Ansichtseinstellungen bleiben getrennt; Klick außerhalb, Escape und direkter Menüwechsel schließen das offene Popover.

| Objekt / Umlaufbahn | Farbe |
|---|---|
| Planeten und Monde | `#E6EDF5` |
| Erdumlaufbahn (Sonderfall) | `#4DA3FF` |
| Zwergplaneten | `#B68CFF` |
| Asteroiden | `#E9B44C` |
| Kometen | `#FF7597` |
| Künstliche Satelliten | `#A7D86D` |
| Raumsonden | `#FF8B4A` |
| Sterne | `#FFE5A0` |

Raumsonden verfügen bislang über keine Ephemeriden und deshalb über keine 3D-Orbitbahnen. Ihre Kategoriefarbe wird im Katalog angezeigt. Die natürliche Oberflächenfarbgebung und lokalen Planetentexturen ändern sich nicht.

## Gemeinsame linke Sidebar und Objektdetails (v22)

Auf dem Desktop sind **Objekte** und **Details** jetzt zwei Tabs in einer gemeinsamen linken Seitenleiste. Eine rechte Detailspalte und die obere globale Leiste gibt es nicht mehr. Beim Start ist „Objekte“ geöffnet; eine gezielte Auswahl öffnet „Details“. Mobil bleiben diese zwei Tabs im Bottom-Sheet und das vollständige Control-Panel liegt weiterhin oben rechts über der Szene. Der runde Kamera-Reset mit nach außen weisenden Pfeilen ersetzt die frühere Hilfe (?)-Taste und liegt seit v27 unten rechts. Der mobile Menü-Button (☰) und der gesonderte Sheet-Griff entfallen; die gesamte Tab-Kopfleiste ist ziehbar. Siehe [Hilfe](docs/HILFE.md).

## Objektdetails (v13)

Die Überschrift der Details zeigt nun den **Objektnamen**; Typ und Herkunft stehen als Text im Schaubild (`hero-ref`). Mit **Wissen** wird die redaktionelle Darstellung angezeigt, mit **Daten** die astronomischen Werte, Orbit- und Quelleninformationen. Die Quellenliste befindet sich im scrollbaren Bereich statt als feststehender Footer. Im Katalog entfällt der bisherige Einleitungstext (`catalog-intro`), die Suche steht an erster Stelle. Die Kamera-Hinweise innerhalb der Ansicht wurden entfernt.

## Katalogumfang

| Typ | Objekte |
|---|---:|
| Stern | 1 |
| Planeten | 8 |
| Monde | 136 |
| Zwergplaneten | 5 |
| Asteroiden | 6 |
| Kometen | 2 |
| Künstliche Satelliten (lokaler Startbestand) | 2 |
| **Gesamt** | **160** |

**Katalogergänzungen aus v8 (in v9 erhalten):** 120 Monde von Jupiter, Saturn, Uranus, Neptun und Pluto, der Asteroid **(3) Juno** sowie die Kometen **1P/Halley** und **2P/Encke**. Die 37 Bestandsobjekte sind erhalten. Die meisten zusätzlichen Monde sind relativ klein oder irregulär und werden wie zuvor im Sonnensystem je nach Auswahl sichtbar; in der Planetenansicht erscheinen die Begleiter des ausgewählten Planeten.

**160 Artikel** sind mit den Objekt-IDs verknüpft: 37 erweiterte Bestandsartikel, 120 Mondartikel und 3 Kleinkörperartikel. Für 69 Objekte gibt es einen zusätzlichen thematischen Hintergrundabschnitt. Alle sind zur transparenten redaktionellen Nachprüfung weiterhin mit Status `imported` markiert – **nicht** automatisch als journalistisch freigegeben.

## Struktur

```text
Workspace-Root/
├── index.html, sw.js, manifest.webmanifest, favicon.svg
├── css/, icons/
├── data/
│   ├── catalog/
│   │   ├── manifest.json
│   │   ├── stars.json, planets.json, dwarf-planets.json
│   │   ├── moons.json, asteroids.json, satellites.json, comets.json
│   │   ├── moons-*-jpl.json      # acht neue Mondgruppen
│   │   └── asteroids-jpl.json, comets-jpl.json
│   └── editorial/
│       ├── de.json              # 37 erweiterte Bestandsartikel
│       ├── de-moons.json        # 120 weitere Mondartikel
│       └── de-small-bodies.json # Juno, Halley, Encke
├── src/data/catalog.js         # lädt und validiert ALLE Redaktionsdateien
├── src/renderer/, src/ui/, src/services/
├── server/                     # Node-Server / optionale API-Proxies
├── tests/                      # v2–v11 Regressionstests
├── scripts/validate-catalog.mjs
└── docs/                       # Datenarchitektur, Herkunft, Änderungen
```

## Datenherkunft und Grenzen

Die neuen Mondumlaufbahnen basieren auf **NASA/JPL – Planetary Satellite Mean Elements**: <https://ssd.jpl.nasa.gov/sats/elem/sep.html>. Soweit verfügbar stammen Radien aus **NASA/JPL – Physical Parameters of Natural Satellites**: <https://ssd.jpl.nasa.gov/sats/phys_par/>. Juno, Halley und Encke nutzen **historische Beispiel-Bahnelemente** aus <https://ssd.jpl.nasa.gov/sb/elem_tables.html>. Zusätzliche Besonderheiten und wissenschaftliche Hintergründe sind durch NASA-Science-Links im jeweiligen Artikel belegt.

**Wichtige Einschränkung:** Die Planetensysteme zeigen **schematische Umlaufbahnen**, keine astrophysikalisch präzisen Positionen. JPL-Mondelemente können verschiedene Referenzebenen verwenden; die vorhandene Visualisierung führt noch keine vollständige Koordinatentransformation durch. Historische Kometenbahnen werden nicht dynamisch nachgeführt. Wo ein Radius fehlt, steht **„—“** statt eines geratenen Werts (intern `radiusKm: 0` als Sentinel).

## Bedienung

- **Desktop:** Links ziehen: bodenparallel durch den Raum bewegen. Rechts ziehen oder Shift + links ziehen: umschauen. Mausrad: Zoom. Pfeiltasten: bodenparallel bewegen.
- **Mobil:** Ein Finger: bodenparallel durch den Raum bewegen. Zwei Finger gemeinsam bewegen: umschauen. Zwei Finger spreizen/zusammenziehen: Zoom.
- **Planetenansicht:** In Planet-, Zwergplanet- oder Monddetails „Planetenansicht“ wählen. Bei Monden wird das übergeordnete Planeten-/Zwergplanetensystem geöffnet. Der runde Kamera-Reset rechts oben kehrt zur Sonnensystemübersicht zurück.
- **Redaktion:** In den Objektdetails unter den Kennzahlen erscheinen Hintergrundabschnitte und direkte Quellenlinks (auf Mobilgeräten Detail-Panel erweitern).

## PWA und Updates

`sw.js` liegt unmittelbar im Workspace-Root unter `/sw.js`. Die v43-PWA verwendet den Cache `sonnensystem-shell-v43` und speichert beim Installieren die App-Shell und alle im Katalog-Manifest genannten JSON-Dateien für den Offline-Betrieb. Bei installiertem Altbestand gegebenenfalls aktualisieren und die PWA neu öffnen. API-Antworten werden nicht mitgespeichert.

## Weiterarbeiten

Astronomische Objekte werden nur in `data/catalog/` verwaltet; Texte, Status und Links nur in `data/editorial/`. Mehrere Dateien pro Kategorie und Sprache sind möglich, die Dateiübersicht steht im `manifest.json`. Beim Hinzufügen neuer Objekte auch `catalogVersion` und `CACHE_NAME` erhöhen. Ein Import-Job und ein visuelles CMS sind **nicht** Bestandteil dieser Version. Bei sehr viel größeren Katalogen werden Filter, Indexierung, stufenweises Laden und Renderer-Optimierungen erforderlich.

**Dokumentation:** [Delta v25](docs/DELTA-V25.md), [Delta v24](docs/DELTA-V24.md), [Delta v23](docs/DELTA-V23.md), [Delta v22](docs/DELTA-V22.md), [Hilfe](docs/HILFE.md), [Delta v21](docs/DELTA-V21.md), [Delta v20](docs/DELTA-V20.md), [Delta v19](docs/DELTA-V19.md), [Delta v18](docs/DELTA-V18.md), [Delta v17](docs/DELTA-V17.md), [Delta v16](docs/DELTA-V16.md), [Delta v14](docs/DELTA-V14.md), [Delta v13](docs/DELTA-V13.md), [Delta v12](docs/DELTA-V12.md), [Delta v11](docs/DELTA-V11.md), [Texturquellen](docs/TEXTURE-SOURCES.md), [Delta v10](docs/DELTA-V10.md), [Datenarchitektur](docs/DATA-ARCHITECTURE.md), [Architektur](docs/ARCHITECTURE.md), [Delta v9](docs/DELTA-V9.md), [Änderungen v8](docs/DELTA-V8.md).
