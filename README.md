# Sonnensystem – interaktiver 3D-Atlas v13.0

**Delta-Update auf v12.** Ausgangsbasis ist v11. Das v12-ZIP enthält ausschließlich geänderte und zusätzliche Dateien und ersetzt die externen Texturabrufe durch lokale Bilddateien. Die bestehenden 160 astronomischen Objekte bleiben erhalten; acht dokumentierte historische bzw. laufende Raumfahrtmissionen sind als eigene Info-Kategorie ergänzt.
## Starten

1. **Zuerst das vollständige v8-ZIP** direkt ins Workspace-Root entpacken; danach **Delta v9.1, v10, v11, v12 und v13 in dieser Reihenfolge** in dasselbe Verzeichnis überlagern und vorhandene Dateien ersetzen. `index.html`, `sw.js`, `package.json`, `data/`, `src/`, `server/` müssen dort liegen. Keinen `public/`-Ordner erstellen.
2. Node.js 20+ verwenden. Zusätzliche npm-Pakete sind nicht erforderlich.
3. `npm start` im Workspace-Root aufrufen und `http://localhost:4173` öffnen.
4. Die Anwendung kann auch von einem einfachen statischen Workspace-HTTP-Server geladen werden; dann fehlen die optionalen Live-API-Funktionen.

```bash
npm start           # HTTP-Server und optionale NASA/andere Proxies
npm run check       # Datenvalidierung und Regressionstests
npm run check:data  # Struktur, IDs, Querverweise und Quellenlinks
```

## Objekt-Auswahl und Labels (v11)

Ein kurzer Klick/Tipp **auf einen Himmelskörper** wählt ihn aus. Ein kurzer Klick/Tipp **in den freien 3D-Hintergrund** hebt die Auswahl auf, ohne die Kamera oder die aktuelle Ansicht zurückzusetzen. Das rechte Detailpanel zeigt danach den neutralen Zustand. Zieh-/Dreh- und Zwei-Finger-Gesten lösen keine Abwahl aus.

**Das Label eines ausgewählten Objekts bleibt sichtbar**, auch wenn Satelliten vorbeifliegen, eine Kollision mit anderen Beschriftungen entsteht oder die Kamera kurz schnell schwenkt. Seine letzte passende Seite bleibt möglichst erhalten; andere Labels haben niedrigere Priorität. Nur ein manuelles Abschalten aller Labels oder ein nicht mehr projizierbares Objekt unterbindet die Beschriftung.

## Oberflächentexturen (v12, lokal)

Die App liest **ausschließlich lokale Bilder** aus `textures/standard/`, z. B. `earth.jpg`, `moon.png`, `titan.webp` oder vorhandene 2K-Quelldateinamen wie `2k_earth_daymap.jpg`. Gültige Formate: JPG, JPEG, PNG und WebP. JPEG ist nicht vorgeschrieben. Dateinamen verwenden die Objekt-ID aus dem Katalog; einige bekannte 2K-Aliasnamen werden ebenfalls erkannt. Die Bilder müssen vom Betreiber selbst in diesen Ordner gelegt werden; sie werden **nicht** ins Delta-ZIP gepackt. Fehlende Texturen fallen auf den bestehenden schematischen Shader zurück.

Es gibt **keinen externen Textur-Download, kein CORS-Fallback und keinen Texturproxy** mehr. Die maximalen GPU-Auflösungen sind 2048 px (Sonnensystem), 4096 px (Planetenansicht) und 512 px (Mobil). Kleinere Quelldateien werden nicht hochgerechnet.

## Raumsonden (v12)

Neue Filterkategorie „Raumsonden“ mit **Voyager 1, Voyager 2, Pioneer 10, Pioneer 11, New Horizons, Cassini, Galileo und Huygens**. In der Liste und Detailansicht erscheinen belegte Startdaten, Ziele, Missionsstatus und NASA-Quellenlinks. **Keine schematischen 3D-Positionen:** Interplanetare und interstellare Bahnen werden ohne echte Ephemeriden nicht als künstliche Kreisbahnen dargestellt. Diese Kategorie enthält daher Missionsinformationen, keine live berechneten Ortsdaten.

## Smarte Labels (v9 + v10)

In **Sonnensystem- und Planetenansicht** werden Beschriftungen nun nach Relevanz zugeordnet: Das ausgewählte Objekt, der Planet in der Planetenansicht und weitere bedeutende Objekte haben Vorrang. Andere sichtbare Objekte können bei genügend freier Fläche ebenfalls ein Label erhalten (die bisherige feste 14-Monde-/5-Satelliten-Auswahl entfällt).

Die nicht ausgewählten Beschriftungen weichen einander und größeren Himmelskörpern auf dem Bildschirm aus. Dafür prüft der Renderer alternative Positionen und zeigt nur Labels an, die vollständig in den Sichtbereich passen. Text hat eine lesbarere Mindestgröße und eine dunkle Kontur; lange Namen werden bei Bedarf mit Auslassungszeichen gekürzt.

Bewegen sich nicht ausgewählte Objekte über **220 Bildschirmpixel pro realer Sekunde**, wird ihre Beschriftung ausgeblendet. Nach Verlangsamung auf weniger als 140 Pixel/s und 140 ms Ruhe kehrt sie zurück. Der Schwellenwert bezieht Kamerabewegung und Zeitsimulation ein; das jeweilige Objekt bleibt sichtbar und auswählbar. Mit der bestehenden Labels-Schaltfläche lassen sich Beschriftungen weiterhin vollständig ausblenden.

**Neu in v10:** Hat ein Label eine passende Seite gefunden, bleibt diese als Anker erhalten. Kurzzeitige Konflikte führen zum vorübergehenden Ausblenden statt zu einem sofortigen Sprung auf eine andere Seite. Erst nach mindestens 650 ms anhaltender Blockade, 1300 ms seit dem letzten Seitenwechsel und 180 ms stabil freier Ausweichposition darf eine neue Seite verwendet werden. Der bestehende Bewegungsfilter bleibt erhalten. Das gilt für beide Ansichten und insbesondere für schnell umlaufende Erdsatelliten.

## Control-Panel und Zeitleiste (v13)

Oben rechts ersetzt ein **Control-Panel** die alte Ansichtsbezeichnung. Es enthält ein Dropdown für die heliozentrische Darstellung (nicht maßstabsgetreu) und die acht Planetensysteme, dazu Play/Pause, logarithmische Geschwindigkeitswahl, die Zeit-Zurücksetzung sowie **Bahnen, Namen, Übersicht**. Beschriftungen „Geschwindigkeit“ und „Heute“ werden auf den Buttons nicht angezeigt: die Geschwindigkeit steht als Wert, die lokale Uhrzeit als `DD.MM.YYYY hh:mm` neben dem Zurücksetzen-Symbol. Auf Mobilgeräten bleiben die Zeitbuttons im Menü „Zeit“ des Bottom Sheets.

- **Play/Pause** startet oder stoppt die Simulation, ohne den eingestellten Wert zu verändern.
- **Geschwindigkeitswert** öffnet einen **vertikalen Schieberegler mit 241 logarithmischen Stufen** (schneller nach oben); die ausgewählte Geschwindigkeit wird direkt angezeigt. Klick außerhalb bzw. Escape schließt den Regler. Auf Mobilgeräten befindet er sich im bestehenden Bottom-Sheet-Menü „Zeit“.
- **Datumsbutton** setzt nur das Simulationsdatum auf die tatsächliche aktuelle Uhrzeit zurück. Kameraposition, Ansicht, Geschwindigkeit und Play/Pause-Zustand bleiben erhalten.

| Ansicht | Minimum | Standard | Maximum |
|---|---:|---:|---:|
| Sonnensystem | 1 Stunde / s | 3 Stunden / s | 10 Jahre / s |
| Planetenansicht | 1 Minute / s | 1 Stunde / s | 1 Jahr / s |

Die Ansichten speichern ihre gewählten Geschwindigkeiten separat. Beim **ersten** Wechsel in eine Ansicht greift jeweils deren Standardwert; beim Zurückwechseln der zuletzt gewählte Wert.

## Objektdetails und Sidebar (v13)

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

- **Desktop:** Links ziehen: umschauen. Mausrad: Zoom. Rechts ziehen oder Shift + links ziehen: bodenparallel bewegen. Pfeiltasten: bodenparallel bewegen.
- **Mobil:** Ein Finger: umschauen. Zwei Finger spreizen/zusammenziehen: Zoom. Zwei Finger gemeinsam bewegen: bodenparallel verschieben.
- **Planetenansicht:** In den Planetendetails „Planetenansicht öffnen“ wählen; „Übersicht“ kehrt zum Sonnensystem zurück.
- **Redaktion:** In den Objektdetails unter den Kennzahlen erscheinen Hintergrundabschnitte und direkte Quellenlinks (auf Mobilgeräten Detail-Panel erweitern).

## PWA und Updates

`sw.js` liegt unmittelbar im Workspace-Root unter `/sw.js`. Die v13-PWA verwendet den Cache `sonnensystem-shell-v13` und speichert beim Installieren die App-Shell und alle im Katalog-Manifest genannten JSON-Dateien für den Offline-Betrieb. Bei installiertem Altbestand gegebenenfalls aktualisieren und die PWA neu öffnen. API-Antworten werden nicht mitgespeichert.

## Weiterarbeiten

Astronomische Objekte werden nur in `data/catalog/` verwaltet; Texte, Status und Links nur in `data/editorial/`. Mehrere Dateien pro Kategorie und Sprache sind möglich, die Dateiübersicht steht im `manifest.json`. Beim Hinzufügen neuer Objekte auch `catalogVersion` und `CACHE_NAME` erhöhen. Ein Import-Job und ein visuelles CMS sind **nicht** Bestandteil dieser Version. Bei sehr viel größeren Katalogen werden Filter, Indexierung, stufenweises Laden und Renderer-Optimierungen erforderlich.

**Dokumentation:** [Delta v13](docs/DELTA-V13.md), [Delta v12](docs/DELTA-V12.md), [Delta v11](docs/DELTA-V11.md), [Texturquellen](docs/TEXTURE-SOURCES.md), [Delta v10](docs/DELTA-V10.md), [Datenarchitektur](docs/DATA-ARCHITECTURE.md), [Architektur](docs/ARCHITECTURE.md), [Delta v9](docs/DELTA-V9.md), [Änderungen v8](docs/DELTA-V8.md).
