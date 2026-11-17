# Hilfe – Sonnensystem (v33)

## Dein Observatorium

Steuere die 3D-Ansicht per Maus, Pfeiltasten oder Touch. Die Desktop-Seitenleiste links bietet zwei Tabs: **Objekte** (Katalog und Suche) sowie **Details** (Wissen und Daten zum gewählten Objekt). Auf dem Smartphone lassen sich dieselben beiden Bereiche vom unteren Rand hochziehen; ein separater Menü-Button ist nicht vorhanden. Das rahmenlose, 58 px breite Control-Panel bleibt oben rechts in der 3D-Ansicht. Der runde Kamera-Reset mit nach außen zeigenden Pfeilen befindet sich unten rechts. Bei halb geöffnetem mobilem Sheet wandert er mit der Sheet-Oberkante nach oben; bei voll geöffnetem Sheet ist er ausgeblendet.

### 01 — Navigation

**Desktop:** Links ziehen = umschauen, Mausrad = zoomen, rechts oder mit Umschalttaste ziehen = direkt verschieben. Pfeiltasten = über die Bahnebene bewegen (unabhängig vom Neigungswinkel).

**Mobil:** Mit einem Finger umschauen, mit zwei Fingern spreizen/zusammenziehen = zoomen, mit zwei Fingern gemeinsam wischen = parallel zur Bahnebene verschieben.

### Objektkatalog und Suche (v30–v32)

Das frühere Formular **„Objekt hinzufügen“** wurde entfernt; Asteroiden aus dem Katalog erhalten beim Auswählen weiterhin zusätzliche JPL-Daten, sofern die API verfügbar ist. **Mobil** wird das gewählte Objekt bei halb geöffnetem Sheet in der Mitte des **nicht vom Sheet verdeckten** 3D-Bereichs angezeigt. Die Position passt sich auch beim Ziehen oder Drehen des Geräts an. Auf dem Desktop und bei geschlossenem Sheet bleibt die normale Bildschirmmitte maßgeblich.


**Katalogfarben (v32):** Ein kleiner, vertikal zentrierter Punkt direkt vor dem Namen trägt die Farbe der Objektkategorie. Das große runde Symbol links zeigt dagegen die individuelle Objektfarbe. Dies gilt auch im mobilen Katalog.

Der Katalog enthält **alle geladenen Objekte**, unabhängig davon, welche Layer in der 3D-Darstellung eingeschaltet sind. Die Filter im Control-Panel verändern nur die 3D-Szene. In der Planetenansicht erscheint neben dem Suchfeld ein Planetensymbol. Dieser Schalter ist standardmäßig **aus** und kann die Katalogliste auf den aktuellen Planeten und seine zugehörigen Objekte begrenzen. In der Sonnensystemansicht wird er ausgeblendet.

Die Suche verarbeitet mehrere Wörter unabhängig und verknüpft sie mit UND, auch über Name, ID, Kategorie und übergeordneten Himmelskörper hinweg. **`uranus c`** zeigt beispielsweise alle Uranus-Monde mit „c“ im Namen; die Reihenfolge der Wörter ist beliebig. Die Suche ist unabhängig von den Renderer-Layern.

### 02 — Zeitreise

Im 58 px breiten, transparenten Control-Panel befinden sich nur der Stapel-Icon-Button für die Objektlayer und die Zeitsteuerung; ein Ansicht-Auswahlmenü gibt es nicht mehr. Der Zeitknopf zeigt Geschwindigkeit und lokales Datum. Im Dropdown findest du den logarithmischen Geschwindigkeitsregler, darunter Play/Pause und den Rücksetz-Button sowie Datum und Uhrzeit. **In der Sonnensystemansicht startet die Simulation mit 5 Tagen pro Sekunde, in der Planetenansicht mit 1 Stunde pro Sekunde.** Objektlayer, Umlaufbahn- und Beschriftungseinstellungen bleiben zwischen den beiden Ansichten unabhängig. Die Planetenansicht bietet nur die zum jeweiligen Planeten vorhandenen Objektkategorien an. Die Bahneinstellungen und der Beschriftungsschalter stehen im Layer-Dropdown. **Standard in der Sonnensystemansicht:** Sterne und Planeten; **Standard in der Planetenansicht:** Planeten, Monde und Satelliten. Das **166 px breite**, scrollbare Layer-Menü hat oben den gemeinsamen „Alle | Standard“-Schalter. „Umlaufbahn“ steuert die Bahnen, darunter stehen leicht eingerückt „Kontrast“ und „Farben“; „Beschriftung“ bleibt separat schaltbar. Mobil bleibt das vollständige Control-Panel in der 3D-Ansicht sichtbar.

Unter **Beschriftung** stehen jetzt zwei zusätzliche Schalter: **Beleuchtung** (Optimiert/Realistisch; Optimiert ist Standard) und **4 Monde** (An/Aus). **4 Monde** zeigt ausschließlich die vier nach Radius größten natürlichen Monde je Planet oder Zwergplanet und schränkt in der Planetenansicht auch ihre Umlaufbahnen ein. Im Sonnensystem ist dieser Schalter standardmäßig **An**, in der isolierten Planetenansicht **Aus**. Er aktiviert den Mond-Layer nicht automatisch; die normalen Layer-Checkboxen gelten weiter. Beim Ausschalten werden alle vorhandenen Monde des eingeschalteten Layers sichtbar. Beide Ansichten behalten ihre Schalterstellungen unabhängig voneinander.

### 03 — Live-Daten

Solar OpenData nutzt einen optionalen API-Key. Asteroiden, Satelliten und Horizons laufen über den lokalen Server. Fehlende Live-Daten werden nicht durch erfundene Messwerte ersetzt.

### 04 — Darstellung

In den Details von Planeten und Zwergplaneten öffnet „Planetenansicht öffnen“ das jeweilige Himmelskörpersystem mit seinen verfügbaren Monden und künstlichen Satelliten. In Monddetails öffnet derselbe Button die Planetenansicht des übergeordneten Planeten oder Zwergplaneten, z. B. Charon → Pluto. Der runde **Kamera-zurücksetzen**-Button mit vier nach außen gerichteten Pfeilen rechts unten schaltet in der Sonnensystemansicht durch **Schräg/oben → Von der Seite → Draufsicht → Schräg/oben**. Nach einer manuellen Dreh-, Schwenk- oder Zoombewegung kehrt der nächste Klick immer zuerst zu **Schräg/oben** zurück; aus einer isolierten Planetenansicht führt er zum Sonnensystem zurück. Der bisherige Hilfe-Button und der mobile Menü-Button sind entfernt. Diese Hilfe liegt nur noch im Verzeichnis `docs/`. Größen und Abstände sind illustrativ skaliert; Satellitenpositionen sind nur angenähert.

**Sonnensystemansicht:** Bei eingeschalteten Umlaufbahnen erscheinen alle verfügbaren Bahnen direkt um die Sonne, deren Objekttyp im Layer-Dropdown aktiv ist (Planeten, Zwergplaneten, Asteroiden, Kometen). Monde und künstliche Satelliten umkreisen Planeten und werden daher in dieser Ansicht nicht als künstliche Sonnenbahnen gezeichnet. Ihre lokalen Umlaufbahnen sind in der Planetenansicht sichtbar. Bei eingeschaltetem **4 Monde** sind pro Planet nur die vier größten natürlichen Monde sichtbar und beschriftbar. Die Auswahl eines kleineren Monds im Katalog hebt die Begrenzung nicht auf. Wenn der Schalter **Aus** ist, werden alle Monde des aktiven Mond-Layers dargestellt; ihre Beschriftungen unterliegen weiter den allgemeinen Dichte- und Bewegungsregeln.

### 05 — Details durchschalten und mobiles Sheet (v27)

Im Kopf der Objektdetails befinden sich neben dem Index (`02 / 08`) nun Pfeiltasten nach links und rechts. Sie wechseln zum **vorherigen bzw. nächsten Objekt derselben Kategorie** – etwa von einem Planeten zum nächsten. Am Listenende beginnt die Reihenfolge von vorn. Ist nur ein Objekt in dieser Kategorie vorhanden, sind beide Tasten deaktiviert.

**Mobile Zurück-Navigation (v33):** Ist das mobile Sheet halb oder vollständig geöffnet, schließt **Zurück** (Browser/Android/PWA) zuerst das Sheet, ohne die Sonnensystemseite zu verlassen. Umschalten zwischen Objekte und Details oder Vergrößern auf Vollhöhe erstellt keinen weiteren Verlaufseintrag. Wird das Sheet per Header, Wischen, Escape oder durch eine Aktion auf der Bühne geschlossen, wird auch sein temporärer Eintrag im Verlauf entfernt. Mit **Vorwärts** lässt sich ein durch Zurück geschlossenes Sheet wieder öffnen.

Das mobile Sheet hat **keinen separaten Griff** mehr. Stattdessen dient die gesamte Kopfzeile mit **„Objekte“** und **„Details“** als ziehbare Fläche. Die Tabs selbst wechseln weiterhin die Inhalte; Antippen einer freien Headerfläche durchläuft die Positionen geschlossen → halb → voll → geschlossen. Der fokussierte Header reagiert auch auf Eingabe- und Leertaste. Im halb geöffneten Zustand ist der Inhaltsbereich auf die sichtbare Sheet-Höhe begrenzt und kann bis zum letzten Eintrag bzw. Abschnitt gescrollt werden. Der Kamera-zurücksetzen-Button bleibt dabei direkt über der Oberkante des Sheets; während des Ziehens folgt er der Bewegung.

Die zwei Dropdown-Auslöser besitzen keine nach unten gerichteten Pfeile mehr. Der Zeitregler öffnet ein 116 px breites Menü, damit die Bedienung trotz des nur 58 px breiten Control-Panels erhalten bleibt.
