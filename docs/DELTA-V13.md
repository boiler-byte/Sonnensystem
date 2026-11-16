# Delta v13 – Control-Panel, Objekt-Registerkarten und reduzierte Navigation

## Installation

Delta v13 über **v12** im Workspace-Root entpacken. Bestehende Dateien werden ersetzt. `textures/standard/` und der astronomische Katalog werden nicht verändert. Das Delta enthält ausschließlich geänderte/neue Dateien. Für ein frisches System zunächst v8 und die folgenden Deltas nacheinander installieren: v9.1 → v10 → v11 → v12 → v13.

## Control-Panel (oben rechts)

- Der bisherige Text zur heliozentrischen Ansicht entfällt. Stattdessen zeigt ein zugängliches **Ansicht-Dropdown** die heliozentrische, ausdrücklich nicht maßstabsgetreue Darstellung sowie die acht Planetensysteme. Die Auswahl synchronisiert sich nach jedem Ansichtswechsel; ein Wechsel zu einem Planetensystem wählt den entsprechenden Planeten aus.
- **Play/Pause, Geschwindigkeit und Heute** befinden sich zusammen mit dem Ansicht-Dropdown im Control-Panel. Play/Pause bleibt ein reiner SVG-Icon-Button. Die Geschwindigkeit zeigt **nur den gewählten Wert**; der Regler öffnet mit logarithmischen Stufen. Der Heute-Button zeigt nur das Datum (lokal `DD.MM.YYYY hh:mm`) und das Zurücksetzen-Symbol; das Wort „Heute“ entfällt.
- Die bisherigen Buttons **Bahnen, Namen, Übersicht** sind in die untere Zeile des Panels umgezogen. Bestehende Funktionen und die getrennten Geschwindigkeitsbereiche bleiben erhalten.
- Auf Mobilgeräten bleibt die vorhandene Bottom-Sheet-Funktion für die drei Zeitbuttons erhalten („Zeit“), damit die kompakte Szene nicht durch die Zeitleiste verdeckt wird. Die Ansichts- und Szenenwahl bleibt oben rechts.
- Die dekorativen `camera-hints` wurden aus Markup und Styles entfernt.

## Objektdetails

- Die obere Überschrift lautet jetzt **Name des gewählten Objekts**, nicht mehr „02 / Objektdetails“.
- **Objekttyp und Zuordnung** (z. B. `PLANET / SONNENSYSTEM`) sind als `hero-ref` direkt im Objekt-Schaubild eingeblendet. Das alte Feld für die interne Ziel-ID entfällt.
- **Wissen** zeigt die redaktionelle Beschreibung, Artikelabschnitte und Quellenlinks.
- **Daten** zeigt physikalische Werte, Orbitdetails, zugehörige Objekte, den Horizons-Abgleich sowie die Datenquellen. Auch Raumsonden trennen ihre Missionsbeschreibung von den Fakten.
- Beim Wechsel des gewählten Objekts wird „Wissen“ wieder aktiv; die Tabs unterstützen Pfeiltasten, Home und End sowie sichtbare Fokusmarkierungen.
- `detail-sources` befindet sich **innerhalb von `detail-scroll`** unter den Daten und ist nicht mehr fixiert. Es scrollt mit den astronomischen Werten.
- Im Sidebar-Katalog entfällt `catalog-intro`. Die Suche steht direkt oben.

## Daten und Kompatibilität

Das Update verändert keine Katalog-Einträge, Datenquellen, lokalen Texturpfade oder 3D-Bahnmodelle. Die Service-Worker-Cache-Version wird auf `sonnensystem-shell-v13` erhöht, damit installierte PWAs neue HTML-, CSS- und JavaScript-Dateien beziehen.

## Prüfungen

Automatisierte Node-Regressionstests einschließlich v13-UI-Struktur, Ansichts-Synchronisation, zugänglichem Tabzustand und Katalogvalidierung. Die Browser-Sichtprüfung einer direkt per URL geladenen Anwendung ist in dieser Umgebung durch Browser-Netzwerkregeln blockiert; statische Desktop/Tablet-/Mobil-Layout-Screenshots wurden separat geprüft.
