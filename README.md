# Sonnensystem – interaktiver 3D-Atlas v16.0

**Delta-Update auf v15.** V16 ergänzt die Sterne im Standard-Layer und ersetzt kollisionsbedingtes Flackern der Beschriftungen durch eine stabile maximale Labelzahl pro Bildschirmfeld. V15 reduzierte das Desktop-Control-Panel von 184 auf 110 px (rund 40 % schmaler), entfernt die sichtbare Ansicht-Beschriftung und bringt die Objektkategorien in ein Mehrfachauswahl-Dropdown „Layer“. Die Katalogsuche berücksichtigt zusätzlich Kategorien und direkte Elternobjekte. Layer bestimmen Katalog und 3D-Szene; alle Texturdateien bleiben unverändert.
## Starten

1. **Zuerst das vollständige v8-ZIP** direkt ins Workspace-Root entpacken; danach **Delta v9.1, v10, v11, v12, v13, v14, v15 und v16 in dieser Reihenfolge** in dasselbe Verzeichnis überlagern und vorhandene Dateien ersetzen. `index.html`, `sw.js`, `package.json`, `data/`, `src/`, `server/` müssen dort liegen. Keinen `public/`-Ordner erstellen.
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

Neue Layer-Kategorie „Raumsonden“ mit **Voyager 1, Voyager 2, Pioneer 10, Pioneer 11, New Horizons, Cassini, Galileo und Huygens**. In der Liste und Detailansicht erscheinen belegte Startdaten, Ziele, Missionsstatus und NASA-Quellenlinks. **Keine schematischen 3D-Positionen:** Interplanetare und interstellare Bahnen werden ohne echte Ephemeriden nicht als künstliche Kreisbahnen dargestellt. Diese Kategorie enthält daher Missionsinformationen, keine live berechneten Ortsdaten.

## Smarte Labels (v16)

In beiden Ansichten werden Beschriftungen nach Bedeutung sortiert. **Statt Überlagerungskollisionen auszuwerten, begrenzt v16 die Anzahl der normalen Labels je Bildschirmfeld von 160 × 110 CSS-Pixeln auf zwei.** Labelüberlappungen sind daher bewusst möglich. Die wichtigste Beschriftung gewinnt; zuvor sichtbare Labels erhalten einen kleinen Prioritätsbonus. Eine 18-Pixel-Randzone um ein zuvor zugewiesenes Feld verhindert Flackern beim Überschreiten der Feldgrenze.

**Ausgewählte Objekte sind vom Dichtelimit ausgenommen** und bleiben beschriftet. Labels behalten ihre Ankerseite und wechseln diese nur, wenn die Beschriftung sonst den sichtbaren Bildschirm verlassen würde. Vorbeifliegende Satelliten, andere Labels und Himmelskörper lösen keinen positionsbedingten Seitenwechsel und keine kollisionsbedingte Ausblendung mehr aus.

Der separate Geschwindigkeitsfilter aus v9 bleibt erhalten: Normale Labels bei mehr als 220 Bildschirmpixeln/s werden vorübergehend unterdrückt und kehren nach einer Ruhephase zurück. Ausgewählte Labels sind hiervon ausgenommen. Das manuelle Ein-/Ausschalten der Namen bleibt unverändert.

## Objektlayer und Katalogsuche (v15)

Das Control-Panel oben rechts ist im Desktoplayout jetzt **110 px breit statt 184 px**. Der sichtbare Schriftzug „Ansicht“ über der Ansichtsauswahl entfällt (ein Screenreader-Label bleibt vorhanden). Beim mobilen Layout bleiben das Panel und die Layer-Auswahl im **dritten Tab „Steuerung“**.

Das neue **Layer-Dropdown** bietet zwei Voreinstellungen und eine freie Mehrfachauswahl:

- **Standard (beim Start aktiv):** Planeten, natürliche Monde und Sterne.
- **Alle:** alle acht Objektkategorien (Planeten, Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen, Raumsonden, Sterne).
- **Individuell:** beliebige Kombinationen über Checkboxen, mindestens eine Kategorie bleibt aktiv. Bei exakt den Standard-/Alle-Kategorien wird der jeweilige Preset-Status automatisch angezeigt.

Die Layer-Auswahl filtert **gleichzeitig den Katalog und die WebGL-Objekte** in Sonnensystem- und Planetenansicht, einschließlich Bahnen, Labels und Anklickbarkeit. Die Sonne zählt zur Kategorie „Sterne“ und ist in „Standard“ sichtbar. Das Sternenfeld im Hintergrund bleibt als Szenendekoration bestehen. Raumsonden bleiben ohne Ephemeriden wie in v12 reine Katalogeinträge. Beim Ausblenden der ausgewählten Objektkategorie wird auch die Auswahl aufgehoben. Suchergebnisse sind immer auf die aktiven Layer beschränkt.

Der Katalog hat keine Filterchips mehr. Die Suche prüft zusätzlich zum Namen, zur Objekt-ID und zur Katalognummer die **deutsche Objektkategorie (Singular/Plural)** sowie den **Namen bzw. die ID des direkten übergeordneten Objekts**. Beispiel: „Jupiter“ findet Jupiter und seine Monde, „Satelliten“ findet bei aktivierter Satelliten-Ebene künstliche Erdsatelliten. Groß- und Kleinschreibung sowie Akzente werden normalisiert.

## Control-Panel und Zeitleiste (v14)

Auf dem Desktop befindet sich oben rechts ein **schmales, vertikales Control-Panel** mit dem Ansicht-Dropdown (heliozentrische Darstellung oder Planetensysteme). **Play/Pause, Geschwindigkeitswert und Datumsbutton** stehen einzeln untereinander; **Bahnen, Namen und Übersicht** sind kompakte SVG-Icon-Buttons ohne sichtbaren Text, aber mit zugänglichen Beschriftungen. Der lokale Zeitpunkt wird als `DD.MM.YYYY hh:mm` im Datumsbutton angezeigt.

Auf Smartphones und schmalen Tablets (bis 770 px) wird **das komplette Control-Panel ohne Duplikate** in den dritten Bottom-Sheet-Tab **„Steuerung“** verschoben. Dort stehen Ansicht, die drei Zeitbuttons sowie Bahnen und Namen bereit. **Nur Übersicht bleibt als einzelner SVG-Button auf der 3D-Bühne**, folgt der geöffneten Höhe des Bottom-Sheets und wandert bei einem Wechsel zum Desktop wieder an seinen Platz im Panel.

- **Play/Pause** startet oder stoppt die Simulation, ohne den eingestellten Wert zu verändern.
- **Geschwindigkeitswert** öffnet einen **vertikalen Schieberegler mit 241 logarithmischen Stufen** (schneller nach oben); die ausgewählte Geschwindigkeit wird direkt angezeigt. Klick außerhalb bzw. Escape schließt den Regler. Auf Mobilgeräten befindet er sich im dritten Bottom-Sheet-Tab „Steuerung“; das Öffnen erweitert das Sheet automatisch, damit der Regler vollständig bedienbar bleibt.
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

`sw.js` liegt unmittelbar im Workspace-Root unter `/sw.js`. Die v14-PWA verwendet den Cache `sonnensystem-shell-v14` und speichert beim Installieren die App-Shell und alle im Katalog-Manifest genannten JSON-Dateien für den Offline-Betrieb. Bei installiertem Altbestand gegebenenfalls aktualisieren und die PWA neu öffnen. API-Antworten werden nicht mitgespeichert.

## Weiterarbeiten

Astronomische Objekte werden nur in `data/catalog/` verwaltet; Texte, Status und Links nur in `data/editorial/`. Mehrere Dateien pro Kategorie und Sprache sind möglich, die Dateiübersicht steht im `manifest.json`. Beim Hinzufügen neuer Objekte auch `catalogVersion` und `CACHE_NAME` erhöhen. Ein Import-Job und ein visuelles CMS sind **nicht** Bestandteil dieser Version. Bei sehr viel größeren Katalogen werden Filter, Indexierung, stufenweises Laden und Renderer-Optimierungen erforderlich.

**Dokumentation:** [Delta v14](docs/DELTA-V14.md), [Delta v13](docs/DELTA-V13.md), [Delta v12](docs/DELTA-V12.md), [Delta v11](docs/DELTA-V11.md), [Texturquellen](docs/TEXTURE-SOURCES.md), [Delta v10](docs/DELTA-V10.md), [Datenarchitektur](docs/DATA-ARCHITECTURE.md), [Architektur](docs/ARCHITECTURE.md), [Delta v9](docs/DELTA-V9.md), [Änderungen v8](docs/DELTA-V8.md).
