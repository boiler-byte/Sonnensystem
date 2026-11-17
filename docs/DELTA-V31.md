# Delta v31 – Layer-Dropdown und mobiler Objektfokus

## Änderungen gegenüber v30

- **Layer-Popover:** Die feste Breite des Dropdowns im Control-Panel wurde von **188 px auf 166 px** reduziert. Dies gilt für Desktop und Mobilgeräte; die bestehende maximale Höhe und Scrollbarkeit bleiben erhalten.
- **Objektfokus auf Mobilgeräten:** Bei Auswahl eines Objekts aus dem Katalog öffnet sich wie bisher der Detail-Tab im halb geöffneten Bottom-Sheet. Die Kamera richtet den selektierten Himmelskörper nun auf die **Mitte der sichtbaren Szene oberhalb der Sheet-Oberkante** aus, nicht auf die verdeckte Mitte der gesamten Canvas.
- **Dynamische Geometrie:** Die tatsächlichen Bounding-Rects von Canvas und Sheet werden bei der Darstellung berücksichtigt. Der Zielmittelpunkt bleibt damit auch während des Sheet-Einrastens, beim Ziehen sowie bei einer Änderung der Bildschirmgröße passend zur freien Fläche.
- **Begrenzter Eingriff:** Die Szene nutzt eine vertikal verschobene Perspektivprojektion (off-axis). Die ursprüngliche Fokus-Zoomstufe und 3D-Position ändern sich nicht. Auf Desktop, bei geschlossenem Sheet, nach manueller Kamerabewegung sowie beim Kamera-Reset ist die reguläre Kameramitte aktiv. Ausgewählte Körper, Bahnen, Beschriftungen und Objekt-Picking nutzen dieselbe Projektionsmatrix.
- **Version/PWA:** Anwendung `31.0.0`, Cache `sonnensystem-shell-v31`. Keine Datenmigration.

## Installation

Delta v31 über einer **vollständigen Installation von v30** entpacken und die vorhandenen Dateien ersetzen. Dieses ZIP enthält nur neue oder geänderte Dateien gegenüber v30 und ist keine Vollversion. Danach neu laden (bei installierter PWA auf Übernahme des neuen Service Workers achten).

## Prüfung

`npm run check` validiert den Katalog und führt Regressionstests aus. Tests für v31 prüfen unter anderem die exakt reduzierte Dropdown-Breite, die mittige Projektion auf verschiedene sichtbare Bereiche und das Zurücksetzen des Fokus bei manuellen Kamerabewegungen.
