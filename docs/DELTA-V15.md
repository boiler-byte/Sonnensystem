# Delta v15 – Kompaktes Control-Panel und Objektlayer

## Installation

Delta v15 direkt **über v14** im Workspace-Root entpacken und vorhandene Dateien ersetzen. Nur geänderte bzw. neue Dateien sind im ZIP enthalten; der lokale Ordner `textures/standard/`, astronomische Katalogdaten und vorhandene Bilder werden nicht verändert. Für eine Neuinstallation: v8 → v9.1 → v10 → v11 → v12 → v13 → v14 → v15.

## Control-Panel

- Desktop-Panel von **184 auf 110 Pixel** reduziert (−40,2 %), weiterhin oben rechts. Die Zeitsteuerung bleibt vertikal; das Datum wird kompakt innerhalb des Buttons angezeigt.
- Die sichtbare Beschriftung **„Ansicht“** oberhalb der Ansichtsauswahl ist entfernt, die zugängliche Beschriftung bleibt erhalten.
- Neues **Layer-Dropdown** zwischen Ansicht und Zeitsteuerung. Auf Desktop öffnet es nach links; auf Mobilgeräten erweitert es sich innerhalb des dritten Bottom-Sheet-Tabs „Steuerung“.
- Die bestehenden SVG-Buttons Bahnen, Namen und Übersicht bleiben erhalten; mobil bleibt weiterhin nur Übersicht über der Szene sichtbar.

## Kategorie-Layer

- Preset **Standard (Startwert): Planeten + Monde**.
- Preset **Alle:** alle acht katalogisierten Kategorien.
- Beliebige Einzel- und Mehrfachkombinationen per Checkbox; mindestens eine Kategorie aktiv.
- Wirkt sowohl auf die Objektliste als auch auf gerenderte Objekte, Orbitlinien, Labels und Trefferauswahl in beiden 3D-Ansichten. Ausgeblendete Objekte können nicht per Canvas-Klick ausgewählt werden.
- Sind aktive Objekte durch einen Layerwechsel ausgeblendet, wird die aktuelle Objektauswahl aufgehoben; Kamera und Simulation bleiben unangetastet.
- Die Sonne gehört zur Kategorie Sterne und ist deshalb im Standard-Preset nicht sichtbar; das rein dekorative Hintergrund-Sternenfeld bleibt erhalten.
- Raumsonden bleiben ohne Ephemeriden ausschließlich als redaktionelle Katalogeinträge verfügbar.

## Katalogsuche

- Alte Kategorie-Filterchips unter dem Suchfeld entfernt.
- Die Freitextsuche durchsucht zusätzlich zur Objekt-ID, Name und Katalognummer die **deutsche Kategoriebezeichnung** (z. B. `Mond` / `Monde`) und **Name/ID des direkten Mutterobjekts** (z. B. `Erde`, `Jupiter`).
- Groß-/Kleinschreibung und Akzente werden ignoriert. Der Layerfilter bleibt auch bei Suchanfragen wirksam.

## Kompatibilität und Tests

- Keine Änderungen an Katalog-JSON, Texturbildern, Server-APIs oder Simulationsgeschwindigkeiten.
- PWA-Cache-Version auf `sonnensystem-shell-v15` angehoben; `src/data/layers.js` wird offline mit ausgeliefert.
- Automatisierte Regressionstests für Presets, Checkbox-Mehrfachauswahl, Suche nach Eltern/Kategorien, WebGL-Layer, Mobil-/Desktop-Struktur und PWA.
- Browser-Sichtprüfung: Desktop, Tablet, Mobil (inkl. geöffneter Layer-Auswahl); die dynamische WebGL-Laufzeit kann im Headless-Browser dieser Umgebung wegen einer lokalen Navigationssperre nicht vollständig geprüft werden.
