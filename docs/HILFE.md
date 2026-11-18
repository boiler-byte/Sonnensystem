# Hilfe – Sonnensystem (v63)

**v63:** Der **AR-Button** sitzt links unten, waagerecht gegenüber **Kamera zurücksetzen** rechts unten. Auf Smartphones verschieben sich beide Buttons zusammen mit der Oberkante des mobilen Detail-Panels. Ohne selektiertes Objekt ist die Vertikalbewegung beim freien Umsehen **umgekehrt**: mit gedrückter rechter Maustaste bzw. mit zwei Fingern **nach unten ziehen → nach unten sehen**; nach oben ziehen → nach oben sehen. Das freie Umschauen bleibt am festen Kamerastandort. Bei Selektion und beim gerätegesteuerten AR bleibt die bisherige Steuerung erhalten.

**v62:** Ohne ausgewähltes Objekt drehen Rechtsziehen (Maus) und Zwei-Finger-Wischen die Blickrichtung **am selben Kamerastandort**, wie im AR-Modus. Die linke Maustaste bzw. ein Finger verschiebt weiterhin; Zoom per Mausrad/Pinch bleibt unverändert. Mit ausgewähltem Objekt bleibt die bisherige Kamerarotation bestehen. Nach erneuter Auswahl oder Kamera-Reset kehrt die normale Perspektivsteuerung zurück. Im Layer-Menü heißt die Kategorie weiterhin **Transnept. Objekte**.

**v61:** Das Kamerasymbol für die Perspektive **Schräg/oben** zeigt jetzt diagonal **nach unten links**. Die Perspektivfolge und das AR-Verhalten bleiben unverändert.

**v60:** Im Layer-Dropdown steht **„Transnept. Objekte“** statt „Transneptunische Objekte“. Die Suche und die Kategoriezuordnung verwenden weiterhin den ausgeschriebenen Namen.

**v59:** Das Layer-Dropdown ist **155 px** breit. Seine Presets, Darstellungsoptionen und Objektkategorien bleiben unverändert.

### Kameraansichten und AR (v58)

Der **Kamera-Button** unten rechts zeigt immer die **nächste** Kameraansicht als SVG: die diagonale Videokamera für **Schräg/oben**, die nach unten gerichtete für **Topdown** und die frontal sichtbare Videokamera für **Seitlich**. Die Reihenfolge lautet **Schräg/oben → Topdown → Seitlich → Schräg/oben**. Aus der ursprünglichen Schrägansicht wird daher als nächstes **Topdown** angeboten. Nach manuellem Schwenken oder Zoomen wird die Schrägansicht wieder zur nächsten Wahl. Die Schaltfläche trägt einen entsprechenden Tooltip und einen zugänglichen Namen.

Bei aktivem **AR-Modus** bleibt das Gerät mit dem Orientierungssensor gekoppelt. Mit dem Kamera-Button schalten Sie in der **aktuellen Szene**, auch in einer Planetenansicht, durch die drei Perspektiven. Jede Auswahl orientiert den momentanen Sensorwinkel an der neuen Perspektive aus. **Nur Umsehen** – das Drehen und Neigen des Telefons – verändert die Blickrichtung, nicht die nächste Preset-Auswahl. Ein manuelles Verschieben/Zoomen der virtuellen Kamera stellt dagegen die nächste Preset-Auswahl wieder auf Schräg/oben. Es ist keine erneute Berechtigungsabfrage erforderlich. Ein Orientierungssensor kann tatsächliche Ortsänderungen des Smartphones nicht erfassen.

Ist **AR ausgeschaltet**, wechselt der Button in der normalen Sonnensystemansicht zwischen den drei Ansichten. In der **Planetenansicht** führt er weiterhin zur Sonnensystemübersicht zurück.

---

### Layer-Dropdown und Presets (v57)

Im **Layer-Dropdown** stehen nach **Alle | Standard** direkt die Icons **Beschriftung**, **Beleuchtung** und **Alle Monde**. In der **zweiten Zeile** befinden sich **Umlaufbahn** und **Kontrast**. Darunter stehen die Objektkategorien mit **Sterne** an erster Stelle. Die frühere sichtbare Überschrift „Darstellung“ und der beschreibende Text mit den Standard-Kategorien am Ende des Menüs entfallen.

**Alle** schaltet jetzt **alle Objektkategorien und alle fünf Darstellungsschalter ein**. **Standard** stellt sowohl Kategorien als auch die fünf Anzeigeoptionen auf die Vorgaben der *aktuellen* Ansicht zurück. Im **Sonnensystem** sind dies: Sterne + Planeten; Beschriftung an, Beleuchtung optimiert/aus, „Alle Monde“ aus (höchstens vier), Umlaufbahn an, Kontrast aus. In der **Planetenansicht**: Planeten + Monde + Satelliten; Beschriftung an, Beleuchtung realistisch/an, „Alle Monde“ an, Umlaufbahn an, Kontrast aus. Einstellungen der anderen Ansicht bleiben bestehen. Objektmaßstab, Bahnabstände und Reihenansicht werden durch die Presets nicht verändert.

Wenn man nach der Preset-Auswahl eine Objektkategorie oder eine Darstellungsoption individuell ändert, wird die Hervorhebung von „Alle“ beziehungsweise „Standard“ entfernt, bis wieder alle Werte der jeweiligen Voreinstellung entsprechen.

### Maßstabs-Toggles und Kameraposition (v57)

Ein Wechsel von **Objekt** oder **Bahn** im Control Panel bewegt die Kamera wieder in die **Ausgangsposition der gerade geöffneten Ansicht**. Das gilt auch nach Drehen, Schwenken, Zoomen, Fokussieren eines Himmelskörpers oder aktivierter Objekt-Nachführung. Eine aktive Nachführung wird dabei beendet. Für die Sonnensystemansicht ist die Schrägübersicht der Ausgangspunkt; in der Planetenansicht wird das Planetensystem zentriert; in der Reihenansicht die Anfangs-Rahmung der Reihe. Der Übergang ist animiert; die Bahn-Wellenanimation der Planetenansicht bleibt erhalten.

---

### Neue Katalogeinträge und Trefferreihenfolge (v56)

Im Objektkatalog sind **Didymos und Dimorphos** (neue Layer-Kategorie **Doppelasteroiden**), **neun weitere kleine natürliche Monde** bei Jupiter, Saturn und Neptun sowie **sieben künstliche Erdsatelliten** verfügbar: Tiangong (Tianhe), zwei GPS-, zwei NOAA- und zwei GOES-Satelliten. Sie können die Objekte über Namen oder Alias suchen und im Detailbereich ihre Bahnangaben und Quellen öffnen.

**Exakte Treffer stehen oben:** `Saturn` liefert zuerst den Planeten Saturn. Auch eine vollständige Objektkategorie wie `Monde`, `Planeten` oder `Doppelasteroiden` wird vor nur teilweise passenden Namen behandelt. Es folgen Namensanfänge, Bezug zum Zentralobjekt und am Ende reine Teiltreffer im Namen. Bei gleichwertigen Trefferarten gilt **Planeten vor Zwergplaneten vor Monden vor allen anderen Typen**. Die bisherige Suche über mehrere Wörter bleibt erhalten.

**Darstellung:** Die neue Kategorie **Doppelasteroiden** kann im Layer-Dropdown separat aktiviert werden. Für die neu aufgenommenen kleinen Monde liegen überwiegend mittlere Bahnelemente vor; neue künstliche Satelliten besitzen schematische Umlaufbahnen auf Basis typischer Bahndaten. Besonders GPS- und Wettersatelliten werden **nicht in Echtzeit** verfolgt. Bei unbekanntem Radius steht im Katalog `—`; es wird kein Wert geschätzt.

## Vorherige Bedienung (v55)

### Control Panel und Layer-Dropdown (v55)

Die Schalter **Objekt**, **Bahn** und **Reihe** liegen **direkt im Control Panel** oben rechts, mit Icon und sichtbarer Beschriftung. Ein separates **Maßstab-Dropdown gibt es nicht mehr**. Alle drei Schalter lassen sich ohne vorheriges Öffnen eines Menüs einschalten. Bei schmalen Bildschirmen ordnen sie sich in einer umgebrochenen Leiste an.

Das **Layer-Dropdown** öffnen Sie über das Ebenen-Icon. Auf **Alle | Standard** folgt direkt der Abschnitt **Darstellung** mit fünf Icon-Schaltern: **Beschriftung**, **Beleuchtung**, **Alle Monde** (neun Punkte im Kreis), **Umlaufbahn**, **Kontrast**. Erst darunter folgen die **Objektkategorien**, beginnend mit **Sterne**. Die Schalter beeinflussen die Darstellung unabhängig von den ausgewählten Objektkategorien. **Alle Monde Aus** begrenzt weiterhin auf höchstens vier Monde pro Planet; **An** zeigt alle natürlichen Monde des sichtbaren Mond-Layers.

### Cinema-Modus in der Objekt-Reihenansicht (v54, unverändert in v55)

**Aktivieren:** Das Control Panel enthält direkt nebeneinander **Objekt**, **Bahn** und **Reihe**. **Reihe** einschalten. Objektgrößen werden dabei wie bisher automatisch auf **maßstabsgetreu** gestellt. **Bahn** ausschalten. Nur bei **Reihe An + Objekt An + Bahn Aus** erscheint im Control Panel der Cinema-**Play-Button**.

**Wiedergabe:** **Play** sortiert die sichtbaren Körper von **klein links** nach **groß rechts** und fährt sie ab. Die Körper bleiben physikalisch proportional. Die Kamera zoomt für jeden Körper auf eine passende Entfernung, verweilt etwa **1,5 Sekunden** und gleitet mit stufenloser Zoomänderung zum nächsten. Die gesamte Filmdauer richtet sich nach der Anzahl sichtbarer Objekte.

**Zeitleiste:** Unten stehen der aktuelle Körper und die Filmzeit. Den Regler per Maus, Touch oder Tastatur verschieben, um direkt zu einem anderen Körper oder einer Übergangsphase zu springen. Solange gezogen wird, pausiert der automatische Fortschritt.

**Beenden:** Das **Stop-Symbol** beendet Cinema, stellt die Reihenfolge **groß → klein** wieder her und fährt die Kamera zur gespeicherten Ausgangsposition einschließlich Zoom und Blickrichtung zurück. Am Filmende geschieht dies automatisch. Auch ein Maßstabs- oder Ansichtswechsel, eine Änderung der sichtbaren Layer/Monde, manuelle Kamerabewegung oder `Esc` beendet den Film.

### Mondbegrenzung und Schalter-Beschriftung (v54; Position in v55 geändert)

**Reihe** sitzt weiterhin direkt neben **Objekt** und **Bahn** und hat eine sichtbare Beschriftung. Seit v55 sind alle drei direkt im Control Panel zu finden; Beschriftung, Beleuchtung, Umlaufbahn, Kontrast und Alle Monde befinden sich im Layer-Dropdown.

Der frühere „4 Monde“-Button zeigt jetzt **neun im Kreis angeordnete Punkte** und heißt **Alle Monde**. **Aus = maximal vier größte Monde je Planet** (Sonnensystem-Standard). **An = alle natürlichen Monde** (Planetenansicht-Standard). Ein ausgeschalteter Mond-Layer bleibt ausgeschaltet; die Katalogeinträge werden nicht reduziert.

### Layer und neue Objekte (v52)

Im Layer-Dropdown rechts oben steht **Sterne** nun ganz oben. Daneben gibt es die eigene Objektkategorie **Transneptunische Objekte**. Mit **Alle** werden alle Kategorien aktiv, mit **Standard** bleibt die Sonnensystemansicht auf Sonne und Planeten beschränkt. Die Katalogsuche findet zusätzliche Namen auch dann, wenn ihre Layer gerade ausgeschaltet sind.

Neu im Katalog: die Asteroiden **(16) Psyche, (10) Hygiea, (162173) Ryugu, (25143) Itokawa, (243) Ida**; die Kometen **67P/Tschurjumow-Gerassimenko, 9P/Tempel 1, 103P/Hartley 2, 81P/Wild 2**; sowie **Quaoar, Orcus, Gonggong, Sedna, Arrokoth**. Die Objekte lassen sich über ihren Namen oder eine alternative Schreibweise suchen und im Detailfenster auswählen. Ihre Sonnenumlaufbahnen werden mit schematischen Kepler-Elementen dargestellt. Sehr ferne oder kleine Objekte können je nach Zoom und gewähltem Maßstab außerhalb des Blickfelds liegen; für sie kann die Katalog-Auswahl und Fokussierung genutzt werden.

### Reihenansicht und neue Bahnanimation (v51)

Beim Aktivieren von **Reihe** stellt die Anwendung den **Objekt**-Schalter automatisch auf **maßstabsgetreue Größen**. Die Objektgrößen stammen dann proportional aus den Katalogradien. Der **Bahn**-Schalter ändert sich dabei nicht. Auch bei aktiver Reihe kann **Objekt** manuell wieder auf schematisch geschaltet werden; beim erneuten Aktivieren von Reihe gilt wieder maßstabsgetreu. Beim Verlassen der Reihe bleibt die gewählte Größenoption bestehen. Beide Szenen teilen weiterhin dieselbe Objektmaßstab-Einstellung.

In der **Planetenansicht** bewegen sich beim Ausschalten von **Bahn** die Umlaufbahnen ohne Gummiband-Rückschwingen auf die schematischen Abstände. Die inneren Bahnen beginnen etwas früher als die äußeren, sodass eine dezente, von innen nach außen laufende Welle entsteht; dazugehörige Monde und Satelliten bewegen sich mit ihrer jeweiligen Bahn. Die Animation dauert insgesamt etwa eine Sekunde. Beim Wiedereinschalten von Bahn oder in der Sonnensystemansicht bleibt die bisherige Animation bestehen. Mit aktivierter Systemoption **Bewegung reduzieren** geschieht der Übergang direkt.

### Früheres AR-Neuausrichten (v50; durch den v58-Perspektivwechsel ersetzt)

Bis einschließlich v57 richtete der Kamera-Button bei aktivem AR die Perspektive neu aus: Das Smartphone in die gewünschte neue Neutralhaltung bringen und den Reset-Button antippen. Der aktuelle Sensorwinkel wird als neuer Nullpunkt übernommen; der Blick wird auf die aktuelle Kamera-Grundausrichtung dieser Szene ausgerichtet. Es gibt **keinen** Wechsel zwischen Kamera-Presets und **keinen** Szenenwechsel. AR bleibt aktiv, und eine Statusmeldung bestätigt die Neukalibrierung. Die Augenposition und der Zoom bleiben erhalten. Wiederholtes Antippen ist möglich.

In v58 ist die AR-Reset-Taste dagegen ein **Perspektivwechsel**; die Beschreibung oben ist maßgeblich. Ohne AR bleibt die Planetenansicht-Rückkehr erhalten.

### Control Panel und Reihenansicht (v49)

- Oben rechts sparen die Buttons AR (nur bei Unterstützung), Maßstab und Objektlayer jeweils ca. 15 % Breite. Der Zeitsteuerungs-Button behält seine bisherige Größe.
- In **Reihe** wechseln die Beschriftungen entsprechend der Sortierung nach Größe zwischen **oben** und **unten**. Ab dem zweiten Objekt sind die Zwischenräume etwas großzügiger; die Ringe von Saturn werden mit freigehalten. Die Ansicht bleibt verschiebbar, sodass weitere Objekte erreichbar sind.
- Alle drei Dropdowns bleiben rechtsbündig. Die bisherigen Größen- und Ansichtsanimationen bleiben erhalten.

### AR-Modus – Umsehen mit Gerätebewegungen (v48)

Auf geeigneten Smartphones erscheint im Control Panel **links neben Maßstab** ein zusätzlicher AR-Button mit einem Fadenkreuz-SVG. Er ist standardmäßig **aus** und nur über eine sichere Webseite (HTTPS oder localhost) mit unterstützter Geräteausrichtung verfügbar. Einmal tippen, gegebenenfalls die Browserberechtigung erlauben und das Smartphone bewegen: **Drehen, Neigen und seitliches Kippen** verändern Blickrichtung bzw. Horizont bei festem Kamerastandort. Die Blickrichtung wird bei der ersten Sensorprobe auf die bisherige Ansicht kalibriert. Die gewohnte Ein-Finger-Bewegung und der Zwei-Finger-Zoom bleiben möglich. Nochmaliges Antippen deaktiviert den AR-Modus. Der Button zeigt seinen Zustand; unten rechts erscheint eine Snackbar. Bei verweigerter Sensorerlaubnis oder ausbleibenden Daten bleibt die Steuerung aus. Beim Wechsel in den Hintergrund schaltet sie sich ab.

**Hinweis:** Hier bedeutet „AR“ ausschließlich sensorbasiertes Umsehen innerhalb der 3D-Szene; es wird kein Kamerabild eingeblendet. Die Sensorwerte werden nicht an einen Server übermittelt.

## Dein Observatorium

Steuere die 3D-Ansicht per Maus, Pfeiltasten oder Touch. Die Desktop-Seitenleiste links bietet zwei Tabs: **Objekte** (Katalog und Suche) sowie **Details** (Wissen und Daten zum gewählten Objekt). Auf dem Smartphone lassen sich dieselben beiden Bereiche vom unteren Rand hochziehen; ein separater Menü-Button ist nicht vorhanden. Das Control Panel mit den drei direkten Maßstab-Schaltern, dem Layer- und dem Zeit-Button befindet sich oben rechts in der 3D-Ansicht. Der runde Kamera-Reset mit nach außen zeigenden Pfeilen befindet sich unten rechts. Bei halb geöffnetem mobilem Sheet wandert er mit der Sheet-Oberkante nach oben; bei voll geöffnetem Sheet ist er ausgeblendet.

### 01 — Navigation

**Desktop:** Links ziehen = verschieben (über die Bahnebene bewegen), Rechts ziehen = umschauen. Mit Umschalttaste + links ziehen ebenfalls umschauen, mit dem Mausrad zoomen. Pfeiltasten = über die Bahnebene bewegen (unabhängig vom Neigungswinkel).

**Mobil:** Mit einem Finger wischen = durch den Raum verschieben. Zwei Finger gemeinsam wischen = umschauen. Zwei Finger spreizen/zusammenziehen = zoomen. Ein Tippen wählt weiterhin ein Objekt.

### Objektkatalog und Suche (v30–v32)

Das frühere Formular **„Objekt hinzufügen“** wurde entfernt; Asteroiden aus dem Katalog erhalten beim Auswählen weiterhin zusätzliche JPL-Daten, sofern die API verfügbar ist. **Mobil** wird das gewählte Objekt bei halb geöffnetem Sheet in der Mitte des **nicht vom Sheet verdeckten** 3D-Bereichs angezeigt. Die Position passt sich auch beim Ziehen oder Drehen des Geräts an. Auf dem Desktop und bei geschlossenem Sheet bleibt die normale Bildschirmmitte maßgeblich.


**Katalogfarben (v32):** Ein kleiner, vertikal zentrierter Punkt direkt vor dem Namen trägt die Farbe der Objektkategorie. Das große runde Symbol links zeigt dagegen die individuelle Objektfarbe. Dies gilt auch im mobilen Katalog.

Der Katalog enthält **alle geladenen Objekte**, unabhängig davon, welche Layer in der 3D-Darstellung eingeschaltet sind. Die Filter im Control-Panel verändern nur die 3D-Szene. In der Planetenansicht erscheint neben dem Suchfeld ein Planetensymbol. Dieser Schalter ist standardmäßig **aus** und kann die Katalogliste auf den aktuellen Planeten und seine zugehörigen Objekte begrenzen. In der Sonnensystemansicht wird er ausgeblendet.

Die Suche verarbeitet mehrere Wörter unabhängig und verknüpft sie mit UND, auch über Name, ID, Kategorie und übergeordneten Himmelskörper hinweg. **`uranus c`** zeigt beispielsweise alle Uranus-Monde mit „c“ im Namen; die Reihenfolge der Wörter ist beliebig. Die Suche ist unabhängig von den Renderer-Layern.

### 02 — Zeitreise und Anzeige

Im Control Panel stehen **Objekt**, **Bahn** und **Reihe** als direkt zugängliche Buttons neben **Objektlayer** und **Zeitsteuerung**. Nur Layer und Zeit haben Dropdowns. Diese erscheinen unter den Buttons und liegen rechtsbündig am Bildschirmrand. Zum Wechseln reicht ein Klick auf den gewünschten Button; das zuvor geöffnete Dropdown schließt sich. Ein Klick außerhalb oder `Escape` schließt ein Menü ebenfalls.

Der Zeitknopf zeigt die Geschwindigkeit und das lokale Datum. Im Zeit-Dropdown befindet sich der vertikale logarithmische Regler mit Minimal- und Maximalwert rechts, darunter Play/Pause und Heute sowie Datum und Uhrzeit. **Die Sonnensystemansicht startet mit 5 Tagen/s, die Planetenansicht mit 1 Stunde/s.**

Das **Objektlayer-Dropdown** enthält „Alle | Standard“ sowie die an-/abwählbaren Objektkategorien. **Sonnensystem-Standard:** Sterne und Planeten. **Planetenansicht-Standard:** Planeten, Monde und Satelliten. Nicht vorhandene Kategorien werden in der Planetenansicht ausgeblendet. Die Darstellungsoptionen (Beschriftung, Beleuchtung, Alle Monde, Umlaufbahn, Kontrast) stehen oberhalb der Objektkategorien im **Layer-Dropdown** und bleiben unabhängig von den Layer-Checkboxen einstellbar. Bahnen verwenden stets die Kategoriepalette.

Die **Beleuchtung** steht standardmäßig im Sonnensystem auf **Aus = Optimiert**, in der Planetenansicht auf **An = Realistisch**. Der **Alle-Monde-Schalter** ist im Sonnensystem standardmäßig **Aus** (höchstens vier Monde), in der Planetenansicht **An** (alle Monde). Beide Szenen speichern ihre Anzeigeoptionen unabhängig voneinander.

### Maßstab und Darstellungs-Schalter (seit v55 direkt in der Hauptleiste)

Die drei Schalter **Objekt**, **Bahn** und **Reihe** mit jeweils großem Icon und kleinem Label stehen **direkt im Control Panel** nebeneinander. Das frühere Maßstab-Dropdown ist entfernt.

- **Objekt Aus**: bisherige schematische Objektgrößen. **Objekt An**: physikalisch proportionale Radien der Körper aus den hinterlegten Kilometern.
- **Bahn Aus**: bisherige komprimierte Bahnabstände. **Bahn An**: physikalisch proportionale Abstände der Bahnen aus ihren großen Halbachsen.

Unter **Objekt** stehen **Beschriftung** (Tab-Label) und **Beleuchtung** (Taschenlampe) nebeneinander, darunter **Alle Monde** (neun kreisförmig angeordnete Punkte). Unter **Bahn** stehen **Umlaufbahn** (zwei ineinanderliegende Kreise) und **Kontrast** (Schwarz/Weiß-Kreis) nebeneinander. **Reihe** (drei von links nach rechts kleiner werdende Punkte) steht in der oberen Reihe. Die Menüüberschrift, die Erläuterungs-Fußnote und alle An/Aus-Statusindikatoren innerhalb der acht Buttons wurden entfernt. Der Zustand wird weiterhin farblich, im Tooltip und über `aria-pressed` angezeigt. Bei jedem Klick erscheint eine kurzlebige **Snackbar unten rechts**, z. B. „Beleuchtung: An (Realistisch)“. Der bisherige Farben-Toggle ist entfallen, da Orbitlinien nun immer die Objektkategorie-Farben verwenden. Für **Monde** gilt `#E6EDF5`.

**Reihe** ist standardmäßig **Aus**. Bei **An** ordnet sie alle aktuell sichtbaren Körper von links nach rechts nach ihrer echten Größe aus dem Katalog (groß → klein) an; der angezeigte Kugelradius folgt weiterhin dem gewählten Objekt-Maßstab. Das gilt sowohl für die Sonnensystemansicht als auch für die Planetenansicht. Umlaufbahnlinien verschwinden während der Aufreihung sanft und erscheinen beim Zurückschalten wieder. Die Kamera zoomt nun gezielt näher heran und zeigt vom größten Körper nur einen schmalen, links angeschnittenen Teil (ca. 12 % seines Durchmessers). Die Lücken zwischen den folgenden Objekten sind abhängig von ihren Radien enger; weitere Körper lassen sich durch Verschieben erreichen. Auch auf schmalen Geräten bleibt der linke Anschnitt erhalten. Ein Umschalten wird unten rechts per Snackbar bestätigt. Die Reihe ist für jede Ansicht separat einstellbar.

**Wechsel-Animationen (v46):** Beim Umschalten zwischen Schema und Maßstab, beim Ein-/Ausschalten der Reihe sowie beim Wechsel zwischen Sonnensystem- und Planetenansicht bewegen sich Kugeln und Umlaufbahnen über ca. eine Sekunde weich mit einem leichten Gummiband-Nachschwingen. Beim Wechsel der gesamten Ansicht verblassen die Körper und Bahnen der alten Szene, während die neue Szene eingeblendet wird. Bahnlinien folgen dem bewegten Zentralobjekt. Auch schnelles Zurückschalten beginnt am gerade sichtbaren Zwischenstand – ohne Positions- oder Helligkeitssprung. Die Kamera folgt dem neuen Ziel. Die Systemeinstellung **Bewegung reduzieren** deaktiviert den Federübergang.

Beide sind beim Start **Aus**, lassen sich unabhängig kombinieren und gelten beim Wechsel in die Planetenansicht weiter. **Objekt an + Bahn aus** heißt in der Sonnensystem-Übersicht **„Optimierte Größenverhältnisse“**: Die Sonne hat den **vierfachen schematischen Radius**, die schematischen Bahnen werden einheitlich viermal weiter dargestellt und die Planeten behalten ihre echten Größenverhältnisse zueinander. Die Übersichtskamera passt den Abstand an. Im Tooltip des Maßstab-Buttons und in der Snackbar erscheint der Modusname beim Wechsel. Die Planetenansicht behält dagegen ihre eigene lokale Skalierung. Bei beiden auf **An** werden Größe und Entfernung innerhalb der jeweiligen Szene im gleichen Maßstab dargestellt. **Achtung:** Auf echtem Maßstab sind viele Himmelskörper im Überblick kaum sichtbar; ihre Labels helfen bei der Orientierung. Die echte Skalierung macht vorhandene schematische/ungefähre Bahndaten nicht astronomisch genauer. Fehlende physikalische Radien werden nicht geschätzt.

### 03 — Live-Daten

Solar OpenData nutzt einen optionalen API-Key. Asteroiden, Satelliten und Horizons laufen über den lokalen Server. Fehlende Live-Daten werden nicht durch erfundene Messwerte ersetzt.

### 04 — Darstellung

In den Details von Planeten und Zwergplaneten öffnet „Planetenansicht“ das jeweilige Himmelskörpersystem mit seinen verfügbaren Monden und künstlichen Satelliten. In Monddetails öffnet derselbe Button die Planetenansicht des übergeordneten Planeten oder Zwergplaneten, z. B. Charon → Pluto. Der runde **Kamera-zurücksetzen**-Button mit vier nach außen gerichteten Pfeilen rechts unten schaltet in der Sonnensystemansicht durch **Schräg/oben → Von der Seite → Draufsicht → Schräg/oben**. Nach einer manuellen Dreh-, Schwenk- oder Zoombewegung kehrt der nächste Klick immer zuerst zu **Schräg/oben** zurück; aus einer isolierten Planetenansicht führt er zum Sonnensystem zurück. Der bisherige Hilfe-Button und der mobile Menü-Button sind entfernt. Diese Hilfe liegt nur noch im Verzeichnis `docs/`. Größen und Abstände sind standardmäßig illustrativ skaliert und können direkt über **Objekt** und **Bahn** proportional umgeschaltet werden; Satellitenpositionen sind nur angenähert.

**Sonnensystemansicht:** Bei eingeschalteten Umlaufbahnen erscheinen alle verfügbaren Bahnen direkt um die Sonne, deren Objekttyp im Layer-Dropdown aktiv ist (Planeten, Zwergplaneten, Asteroiden, Kometen). Monde und künstliche Satelliten umkreisen Planeten und werden daher in dieser Ansicht nicht als künstliche Sonnenbahnen gezeichnet. Ihre lokalen Umlaufbahnen sind in der Planetenansicht sichtbar. Bei ausgeschaltetem **Alle Monde** sind pro Planet nur die vier größten natürlichen Monde sichtbar und beschriftbar. Die Auswahl eines kleineren Monds im Katalog hebt die Begrenzung nicht auf. Wenn der Schalter **An** ist, werden alle Monde des aktiven Mond-Layers dargestellt; ihre Beschriftungen unterliegen weiter den allgemeinen Dichte- und Bewegungsregeln.

### 05 — Details durchschalten und mobiles Sheet (v27)

Im Kopf der Objektdetails befinden sich neben dem Index (`02 / 08`) nun Pfeiltasten nach links und rechts. Sie wechseln zum **vorherigen bzw. nächsten Objekt derselben Kategorie** – etwa von einem Planeten zum nächsten. Am Listenende beginnt die Reihenfolge von vorn. Ist nur ein Objekt in dieser Kategorie vorhanden, sind beide Tasten deaktiviert.

**Mobile Zurück-Navigation (v33):** Ist das mobile Sheet halb oder vollständig geöffnet, schließt **Zurück** (Browser/Android/PWA) zuerst das Sheet, ohne die Sonnensystemseite zu verlassen. Umschalten zwischen Objekte und Details oder Vergrößern auf Vollhöhe erstellt keinen weiteren Verlaufseintrag. Wird das Sheet per Header, Wischen, Escape oder durch eine Aktion auf der Bühne geschlossen, wird auch sein temporärer Eintrag im Verlauf entfernt. Mit **Vorwärts** lässt sich ein durch Zurück geschlossenes Sheet wieder öffnen.

Im geschlossenen Zustand ist die mobile Menüleiste **45 px** hoch (statt 52 px); der Kamera-Button bleibt darüber. Das mobile Sheet hat **keinen separaten Griff** mehr. Stattdessen dient die gesamte Kopfzeile mit **„Objekte“** und **„Details“** als ziehbare Fläche. Die Tabs selbst wechseln weiterhin die Inhalte; Antippen einer freien Headerfläche durchläuft die Positionen geschlossen → halb → voll → geschlossen. Der fokussierte Header reagiert auch auf Eingabe- und Leertaste. Im halb geöffneten Zustand ist der Inhaltsbereich auf die sichtbare Sheet-Höhe begrenzt und kann bis zum letzten Eintrag bzw. Abschnitt gescrollt werden. Der Kamera-zurücksetzen-Button bleibt dabei direkt über der Oberkante des Sheets; während des Ziehens folgt er der Bewegung.

Die drei Dropdown-Auslöser besitzen keine nach unten gerichteten Pfeile. Der Zeitregler öffnet ein 120 px breites Menü, damit die Bedienung trotz des nur 58 px breiten Zeit-Buttons erhalten bleibt.

## „Folgen“: globales Objekt-Tracking (v38)

**Neu in v39:** Wird Folgen bei einem Mond, künstlichen Satelliten oder einem anderen Objekt aktiviert, dessen direkter Parent ein Planet oder Zwergplanet ist, wechselt die Ansicht zunächst in das Planetensystem des Parents. Die Auswahl und die aktive Nachführung bleiben auf dem gewählten Kindobjekt. Ein Klick zum Ausschalten wechselt die Szene nicht. Bei nicht gebundenen Objekten bleibt die Ansicht unverändert.


Neben **Planetenansicht** (ohne die frühere Unterzeile mit Mond-/Satellitenzahlen) befindet sich der Fadenkreuz-Button **Folgen**. Ein Klick schaltet die Nachführung global **An**, der Button ist dann grün markiert. Die Kamera zentriert das ausgewählte Objekt und folgt seiner berechneten Bewegung. Beim Objektwechsel wechselt die Nachführung automatisch zum neu gewählten Ziel; ein erneuter Klick schaltet Folgen **Aus**.

**Drehen, Zoomen und Umschalten der Kameraperspektive** lassen Folgen aktiv. Ein gezieltes **Verschieben der Kameraposition** per Linksziehen, Ein-Finger-Wischen oder Pfeiltasten beendet Folgen. Rechtsziehen, Shift-Linksziehen und Zwei-Finger-Umschauen lassen Folgen aktiv. Bei einer zu schnellen simulierten Bewegung beendet die Sicherheitsgrenze die Nachführung ebenfalls. Ohne Auswahl oder bei Raumsonden ohne bekannte 3D-Position bleibt Folgen aktiv, aber ohne Nachführungsziel; die nächste gültige Auswahl wird wieder verfolgt. Beim Wechsel zwischen Sonnensystem und Planetenansicht bleibt der Toggle erhalten.

Aktuell beträgt die Breite des Layer-Dropdowns **155 px** (v59). Die Angaben zu Maßstab und Zeitsteuerung aus älteren Versionen beziehen sich auf die jeweilige damalige Anordnung.
