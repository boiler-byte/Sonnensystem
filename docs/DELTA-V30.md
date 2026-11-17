# Delta v30 – Objektdetails und mobiler Kamera-Button

## Änderungen gegenüber v29

- **„Objekt hinzufügen“ entfernt:** Der Footer mit JPL-SBDB-Suchfeld, Submit-Button und Erklärung unter der Objektliste entfällt in der Desktop-Seitenleiste und im mobilen Bottom-Sheet. Es gibt keine Submit-Listener mehr für die entfernten DOM-Elemente. Die normale Suchleiste, Objektliste und Objektdetails bleiben unverändert. Vorhandene Asteroiden beziehen beim Auswählen weiterhin bei Bedarf aktualisierte NASA/JPL-SBDB-Daten; die zugehörige API bleibt erhalten.
- **Kamera zurücksetzen auf Mobilgeräten:** `.viewport-actions` übernimmt jetzt mit `--sheet-visible` die tatsächlich angezeigte Höhe des mobilen Sheets. Der Button bleibt mit mindestens 12 px Abstand oberhalb der Sheet-Oberkante – insbesondere im halb geöffneten Zustand. Während einer Ziehbewegung werden beide Höhen synchron nachgeführt. Beim Wechsel zwischen geschlossen und halb geöffnet folgen die Positionen derselben Animation; reduzierte Bewegung wird respektiert.
- **Voll geöffnetes Sheet:** Die Kameraaktion verschwindet mit der Szene hinter bzw. oberhalb des vollständig geöffneten Sheets und wird aus der Tastaturnavigation genommen. Bei geschlossenem Sheet und auf dem Desktop ist sie normal bedienbar.
- **Version/PWA:** Anwendung `30.0.0`, Cache `sonnensystem-shell-v30`. Keine Datenmigration erforderlich.

## Installation

Delta v30 auf die **vollständige Installation v29** entpacken und alle bestehenden Dateien überschreiben. Das ZIP enthält ausschließlich seit v29 neue oder geänderte Dateien; es ist keine eigenständige Vollversion. Danach die Browserseite bzw. installierte PWA neu laden, damit der neue Service Worker übernommen wird.

## Prüfung

`npm run check` führt Katalogvalidierung und alle Regressionstests aus, einschließlich neuer Tests zum entfernten Formular und zum synchronen Kameraabstand beim Ziehen und Einrasten.
