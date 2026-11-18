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
