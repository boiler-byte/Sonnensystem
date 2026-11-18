# Hilfe – Sonnensystem (v49)

### Control Panel und Reihenansicht (v49)

- Oben rechts sparen die Buttons AR (nur bei Unterstützung), Maßstab und Objektlayer jeweils ca. 15 % Breite. Der Zeitsteuerungs-Button behält seine bisherige Größe.
- In **Reihe** wechseln die Beschriftungen entsprechend der Sortierung nach Größe zwischen **oben** und **unten**. Ab dem zweiten Objekt sind die Zwischenräume etwas großzügiger; die Ringe von Saturn werden mit freigehalten. Die Ansicht bleibt verschiebbar, sodass weitere Objekte erreichbar sind.
- Alle drei Dropdowns bleiben rechtsbündig. Die bisherigen Größen- und Ansichtsanimationen bleiben erhalten.

### AR-Modus – Umsehen mit Gerätebewegungen (v48)

Auf geeigneten Smartphones erscheint im Control Panel **links neben Maßstab** ein zusätzlicher AR-Button mit einem Fadenkreuz-SVG. Er ist standardmäßig **aus** und nur über eine sichere Webseite (HTTPS oder localhost) mit unterstützter Geräteausrichtung verfügbar. Einmal tippen, gegebenenfalls die Browserberechtigung erlauben und das Smartphone bewegen: **Drehen, Neigen und seitliches Kippen** verändern Blickrichtung bzw. Horizont bei festem Kamerastandort. Die Blickrichtung wird bei der ersten Sensorprobe auf die bisherige Ansicht kalibriert. Die gewohnte Ein-Finger-Bewegung und der Zwei-Finger-Zoom bleiben möglich. Nochmaliges Antippen deaktiviert den AR-Modus. Der Button zeigt seinen Zustand; unten rechts erscheint eine Snackbar. Bei verweigerter Sensorerlaubnis oder ausbleibenden Daten bleibt die Steuerung aus. Beim Wechsel in den Hintergrund schaltet sie sich ab.

**Hinweis:** Hier bedeutet „AR“ ausschließlich sensorbasiertes Umsehen innerhalb der 3D-Szene; es wird kein Kamerabild eingeblendet. Die Sensorwerte werden nicht an einen Server übermittelt.

## Dein Observatorium

Steuere die 3D-Ansicht per Maus, Pfeiltasten oder Touch. Die Desktop-Seitenleiste links bietet zwei Tabs: **Objekte** (Katalog und Suche) sowie **Details** (Wissen und Daten zum gewählten Objekt). Auf dem Smartphone lassen sich dieselben beiden Bereiche vom unteren Rand hochziehen; ein separater Menü-Button ist nicht vorhanden. Das rahmenlose, 190 px breite Control-Panel mit drei nebeneinanderliegenden Tasten bleibt oben rechts in der 3D-Ansicht. Der runde Kamera-Reset mit nach außen zeigenden Pfeilen befindet sich unten rechts. Bei halb geöffnetem mobilem Sheet wandert er mit der Sheet-Oberkante nach oben; bei voll geöffnetem Sheet ist er ausgeblendet.

### 01 — Navigation

**Desktop:** Links ziehen = verschieben (über die Bahnebene bewegen), Rechts ziehen = umschauen. Mit Umschalttaste + links ziehen ebenfalls umschauen, mit dem Mausrad zoomen. Pfeiltasten = über die Bahnebene bewegen (unabhängig vom Neigungswinkel).

**Mobil:** Mit einem Finger wischen = durch den Raum verschieben. Zwei Finger gemeinsam wischen = umschauen. Zwei Finger spreizen/zusammenziehen = zoomen. Ein Tippen wählt weiterhin ein Objekt.

### Objektkatalog und Suche (v30–v32)

Das frühere Formular **„Objekt hinzufügen“** wurde entfernt; Asteroiden aus dem Katalog erhalten beim Auswählen weiterhin zusätzliche JPL-Daten, sofern die API verfügbar ist. **Mobil** wird das gewählte Objekt bei halb geöffnetem Sheet in der Mitte des **nicht vom Sheet verdeckten** 3D-Bereichs angezeigt. Die Position passt sich auch beim Ziehen oder Drehen des Geräts an. Auf dem Desktop und bei geschlossenem Sheet bleibt die normale Bildschirmmitte maßgeblich.


**Katalogfarben (v32):** Ein kleiner, vertikal zentrierter Punkt direkt vor dem Namen trägt die Farbe der Objektkategorie. Das große runde Symbol links zeigt dagegen die individuelle Objektfarbe. Dies gilt auch im mobilen Katalog.

Der Katalog enthält **alle geladenen Objekte**, unabhängig davon, welche Layer in der 3D-Darstellung eingeschaltet sind. Die Filter im Control-Panel verändern nur die 3D-Szene. In der Planetenansicht erscheint neben dem Suchfeld ein Planetensymbol. Dieser Schalter ist standardmäßig **aus** und kann die Katalogliste auf den aktuellen Planeten und seine zugehörigen Objekte begrenzen. In der Sonnensystemansicht wird er ausgeblendet.

Die Suche verarbeitet mehrere Wörter unabhängig und verknüpft sie mit UND, auch über Name, ID, Kategorie und übergeordneten Himmelskörper hinweg. **`uranus c`** zeigt beispielsweise alle Uranus-Monde mit „c“ im Namen; die Reihenfolge der Wörter ist beliebig. Die Suche ist unabhängig von den Renderer-Layern.

### 02 — Zeitreise und Anzeige

Die drei Buttons im Control-Panel sind von links nach rechts **Maßstab**, **Objektlayer** und **Zeitsteuerung**. Alle Dropdowns erscheinen unter den Buttons und liegen rechtsbündig am Bildschirmrand. Zum Wechseln reicht ein Klick auf den gewünschten Button; das zuvor geöffnete Dropdown schließt sich. Ein Klick außerhalb oder `Escape` schließt ein Menü ebenfalls.

Der Zeitknopf zeigt die Geschwindigkeit und das lokale Datum. Im Zeit-Dropdown befindet sich der vertikale logarithmische Regler mit Minimal- und Maximalwert rechts, darunter Play/Pause und Heute sowie Datum und Uhrzeit. **Die Sonnensystemansicht startet mit 5 Tagen/s, die Planetenansicht mit 1 Stunde/s.**

Das **Objektlayer-Dropdown** enthält „Alle | Standard“ sowie die an-/abwählbaren Objektkategorien. **Sonnensystem-Standard:** Sterne und Planeten. **Planetenansicht-Standard:** Planeten, Monde und Satelliten. Nicht vorhandene Kategorien werden in der Planetenansicht ausgeblendet. Die Darstellungsoptionen (Beschriftung, Beleuchtung, 4 Monde, Umlaufbahn, Kontrast) liegen im Maßstab-Menü und bleiben unabhängig von den Layer-Checkboxen einstellbar. Bahnen verwenden stets die Kategoriepalette.

Die **Beleuchtung** steht standardmäßig im Sonnensystem auf **Aus = Optimiert**, in der Planetenansicht auf **An = Realistisch**. Der **4-Monde-Schalter** ist im Sonnensystem standardmäßig **An**, in der Planetenansicht **Aus**. Eingeschaltet zeigt er nur die vier größten natürlichen Monde je Planet oder Zwergplanet in der 3D-Szene. Beide Szenen speichern ihre Anzeigeoptionen unabhängig voneinander.

### Maßstab und Darstellungs-Schalter (v45)

Das linke **Maßstab-Dropdown** hat das Icon eines horizontalen Doppelpfeils mit linken und rechten Begrenzungsstrichen. Darin stehen zwei Schalter mit jeweils großem Icon und kleinem Label **nebeneinander**: **Objekt** mit vertikalem Doppelpfeil und **Bahn** mit horizontalem Doppelpfeil.

- **Objekt Aus**: bisherige schematische Objektgrößen. **Objekt An**: physikalisch proportionale Radien der Körper aus den hinterlegten Kilometern.
- **Bahn Aus**: bisherige komprimierte Bahnabstände. **Bahn An**: physikalisch proportionale Abstände der Bahnen aus ihren großen Halbachsen.

Unter **Objekt** stehen **Beschriftung** (Tab-Label) und **Beleuchtung** (Taschenlampe) nebeneinander, darunter **4 Monde** (vier Punkte). Unter **Bahn** stehen **Umlaufbahn** (zwei ineinanderliegende Kreise) und **Kontrast** (Schwarz/Weiß-Kreis) nebeneinander, darunter **Reihe** (drei von links nach rechts kleiner werdende Punkte). Die Menüüberschrift, die Erläuterungs-Fußnote und alle An/Aus-Statusindikatoren innerhalb der acht Buttons wurden entfernt. Der Zustand wird weiterhin farblich, im Tooltip und über `aria-pressed` angezeigt. Bei jedem Klick erscheint eine kurzlebige **Snackbar unten rechts**, z. B. „Beleuchtung: An (Realistisch)“. Der bisherige Farben-Toggle ist entfallen, da Orbitlinien nun immer die Objektkategorie-Farben verwenden. Für **Monde** gilt `#E6EDF5`.

**Reihe** ist standardmäßig **Aus**. Bei **An** ordnet sie alle aktuell sichtbaren Körper von links nach rechts nach ihrer echten Größe aus dem Katalog (groß → klein) an; der angezeigte Kugelradius folgt weiterhin dem gewählten Objekt-Maßstab. Das gilt sowohl für die Sonnensystemansicht als auch für die Planetenansicht. Umlaufbahnlinien verschwinden während der Aufreihung sanft und erscheinen beim Zurückschalten wieder. Die Kamera zoomt nun gezielt näher heran und zeigt vom größten Körper nur einen schmalen, links angeschnittenen Teil (ca. 12 % seines Durchmessers). Die Lücken zwischen den folgenden Objekten sind abhängig von ihren Radien enger; weitere Körper lassen sich durch Verschieben erreichen. Auch auf schmalen Geräten bleibt der linke Anschnitt erhalten. Ein Umschalten wird unten rechts per Snackbar bestätigt. Die Reihe ist für jede Ansicht separat einstellbar.

**Wechsel-Animationen (v46):** Beim Umschalten zwischen Schema und Maßstab, beim Ein-/Ausschalten der Reihe sowie beim Wechsel zwischen Sonnensystem- und Planetenansicht bewegen sich Kugeln und Umlaufbahnen über ca. eine Sekunde weich mit einem leichten Gummiband-Nachschwingen. Beim Wechsel der gesamten Ansicht verblassen die Körper und Bahnen der alten Szene, während die neue Szene eingeblendet wird. Bahnlinien folgen dem bewegten Zentralobjekt. Auch schnelles Zurückschalten beginnt am gerade sichtbaren Zwischenstand – ohne Positions- oder Helligkeitssprung. Die Kamera folgt dem neuen Ziel. Die Systemeinstellung **Bewegung reduzieren** deaktiviert den Federübergang.

Beide sind beim Start **Aus**, lassen sich unabhängig kombinieren und gelten beim Wechsel in die Planetenansicht weiter. **Objekt an + Bahn aus** heißt in der Sonnensystem-Übersicht **„Optimierte Größenverhältnisse“**: Die Sonne hat den **vierfachen schematischen Radius**, die schematischen Bahnen werden einheitlich viermal weiter dargestellt und die Planeten behalten ihre echten Größenverhältnisse zueinander. Die Übersichtskamera passt den Abstand an. Im Tooltip des Maßstab-Buttons und in der Snackbar erscheint der Modusname beim Wechsel. Die Planetenansicht behält dagegen ihre eigene lokale Skalierung. Bei beiden auf **An** werden Größe und Entfernung innerhalb der jeweiligen Szene im gleichen Maßstab dargestellt. **Achtung:** Auf echtem Maßstab sind viele Himmelskörper im Überblick kaum sichtbar; ihre Labels helfen bei der Orientierung. Die echte Skalierung macht vorhandene schematische/ungefähre Bahndaten nicht astronomisch genauer. Fehlende physikalische Radien werden nicht geschätzt.

### 03 — Live-Daten

Solar OpenData nutzt einen optionalen API-Key. Asteroiden, Satelliten und Horizons laufen über den lokalen Server. Fehlende Live-Daten werden nicht durch erfundene Messwerte ersetzt.

### 04 — Darstellung

In den Details von Planeten und Zwergplaneten öffnet „Planetenansicht“ das jeweilige Himmelskörpersystem mit seinen verfügbaren Monden und künstlichen Satelliten. In Monddetails öffnet derselbe Button die Planetenansicht des übergeordneten Planeten oder Zwergplaneten, z. B. Charon → Pluto. Der runde **Kamera-zurücksetzen**-Button mit vier nach außen gerichteten Pfeilen rechts unten schaltet in der Sonnensystemansicht durch **Schräg/oben → Von der Seite → Draufsicht → Schräg/oben**. Nach einer manuellen Dreh-, Schwenk- oder Zoombewegung kehrt der nächste Klick immer zuerst zu **Schräg/oben** zurück; aus einer isolierten Planetenansicht führt er zum Sonnensystem zurück. Der bisherige Hilfe-Button und der mobile Menü-Button sind entfernt. Diese Hilfe liegt nur noch im Verzeichnis `docs/`. Größen und Abstände sind standardmäßig illustrativ skaliert und können im Maßstab-Menü proportional umgeschaltet werden; Satellitenpositionen sind nur angenähert.

**Sonnensystemansicht:** Bei eingeschalteten Umlaufbahnen erscheinen alle verfügbaren Bahnen direkt um die Sonne, deren Objekttyp im Layer-Dropdown aktiv ist (Planeten, Zwergplaneten, Asteroiden, Kometen). Monde und künstliche Satelliten umkreisen Planeten und werden daher in dieser Ansicht nicht als künstliche Sonnenbahnen gezeichnet. Ihre lokalen Umlaufbahnen sind in der Planetenansicht sichtbar. Bei eingeschaltetem **4 Monde** sind pro Planet nur die vier größten natürlichen Monde sichtbar und beschriftbar. Die Auswahl eines kleineren Monds im Katalog hebt die Begrenzung nicht auf. Wenn der Schalter **Aus** ist, werden alle Monde des aktiven Mond-Layers dargestellt; ihre Beschriftungen unterliegen weiter den allgemeinen Dichte- und Bewegungsregeln.

### 05 — Details durchschalten und mobiles Sheet (v27)

Im Kopf der Objektdetails befinden sich neben dem Index (`02 / 08`) nun Pfeiltasten nach links und rechts. Sie wechseln zum **vorherigen bzw. nächsten Objekt derselben Kategorie** – etwa von einem Planeten zum nächsten. Am Listenende beginnt die Reihenfolge von vorn. Ist nur ein Objekt in dieser Kategorie vorhanden, sind beide Tasten deaktiviert.

**Mobile Zurück-Navigation (v33):** Ist das mobile Sheet halb oder vollständig geöffnet, schließt **Zurück** (Browser/Android/PWA) zuerst das Sheet, ohne die Sonnensystemseite zu verlassen. Umschalten zwischen Objekte und Details oder Vergrößern auf Vollhöhe erstellt keinen weiteren Verlaufseintrag. Wird das Sheet per Header, Wischen, Escape oder durch eine Aktion auf der Bühne geschlossen, wird auch sein temporärer Eintrag im Verlauf entfernt. Mit **Vorwärts** lässt sich ein durch Zurück geschlossenes Sheet wieder öffnen.

Im geschlossenen Zustand ist die mobile Menüleiste **45 px** hoch (statt 52 px); der Kamera-Button bleibt darüber. Das mobile Sheet hat **keinen separaten Griff** mehr. Stattdessen dient die gesamte Kopfzeile mit **„Objekte“** und **„Details“** als ziehbare Fläche. Die Tabs selbst wechseln weiterhin die Inhalte; Antippen einer freien Headerfläche durchläuft die Positionen geschlossen → halb → voll → geschlossen. Der fokussierte Header reagiert auch auf Eingabe- und Leertaste. Im halb geöffneten Zustand ist der Inhaltsbereich auf die sichtbare Sheet-Höhe begrenzt und kann bis zum letzten Eintrag bzw. Abschnitt gescrollt werden. Der Kamera-zurücksetzen-Button bleibt dabei direkt über der Oberkante des Sheets; während des Ziehens folgt er der Bewegung.

Die drei Dropdown-Auslöser besitzen keine nach unten gerichteten Pfeile. Der Zeitregler öffnet ein 120 px breites Menü, damit die Bedienung trotz des nur 58 px breiten Zeit-Buttons erhalten bleibt.

## „Folgen“: globales Objekt-Tracking (v38)

**Neu in v39:** Wird Folgen bei einem Mond, künstlichen Satelliten oder einem anderen Objekt aktiviert, dessen direkter Parent ein Planet oder Zwergplanet ist, wechselt die Ansicht zunächst in das Planetensystem des Parents. Die Auswahl und die aktive Nachführung bleiben auf dem gewählten Kindobjekt. Ein Klick zum Ausschalten wechselt die Szene nicht. Bei nicht gebundenen Objekten bleibt die Ansicht unverändert.


Neben **Planetenansicht** (ohne die frühere Unterzeile mit Mond-/Satellitenzahlen) befindet sich der Fadenkreuz-Button **Folgen**. Ein Klick schaltet die Nachführung global **An**, der Button ist dann grün markiert. Die Kamera zentriert das ausgewählte Objekt und folgt seiner berechneten Bewegung. Beim Objektwechsel wechselt die Nachführung automatisch zum neu gewählten Ziel; ein erneuter Klick schaltet Folgen **Aus**.

**Drehen, Zoomen und Umschalten der Kameraperspektive** lassen Folgen aktiv. Ein gezieltes **Verschieben der Kameraposition** per Linksziehen, Ein-Finger-Wischen oder Pfeiltasten beendet Folgen. Rechtsziehen, Shift-Linksziehen und Zwei-Finger-Umschauen lassen Folgen aktiv. Bei einer zu schnellen simulierten Bewegung beendet die Sicherheitsgrenze die Nachführung ebenfalls. Ohne Auswahl oder bei Raumsonden ohne bekannte 3D-Position bleibt Folgen aktiv, aber ohne Nachführungsziel; die nächste gültige Auswahl wird wieder verfolgt. Beim Wechsel zwischen Sonnensystem und Planetenansicht bleibt der Toggle erhalten.

Die Breiten der Dropdowns sind **145 px (Layer)**, **192 px (Maßstab)** und **120 px (Zeitsteuerung)**.
