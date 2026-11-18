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
