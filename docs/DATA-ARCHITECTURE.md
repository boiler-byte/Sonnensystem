# Datenmodell und redaktionelle Inhalte (aktuell: Katalog 10.1.0)

> **Aktueller Stand (v75):** Katalogversion `10.1.0`, Schema `1`, **192 Himmelskörper** und **192 redaktionelle Einträge**. Das Manifest lädt 23 Kategorien-Dateien und fünf deutschsprachige Redaktionsdateien. Gegenüber dem historischen v8-Stand sind die Typen `tno` und `binary` sowie weitere Monde und Satelliten hinzugekommen. Die folgenden als v8/v52 gekennzeichneten Zahlen und Beispiele beschreiben **historische Ausbaustufen**, nicht die aktuelle Gesamtanzahl. Maßgeblich ist `data/catalog/manifest.json`.

## Entfernungssortierung im Objektkatalog (v75; keine Datenmigration)

Die Katalogfelder `orbit.meanDistance` und `orbit.unit` bleiben unverändert. Die Sortierung normalisiert in AE, die **Anzeige** verwendet für Distanzen **bis einschließlich 0,2 AE km**, darüber AE. Im vollständig geöffneten Atlas **ohne Suchtext und ohne aktiven Planetenfilter** erben Monde lediglich in der **Liste** die mittlere Entfernung ihres direkten Elternkörpers. Eine Suche oder ein aktiver Planetenfilter zeigt und sortiert nach der **eigenen Bahnentfernung** des Mondes. Messwerte, Stern- und Planetenbahnen und physikalische Objektdetails sind davon nicht betroffen. Diese kontextabhängigen Listenwerte sind keine zusätzlichen astronomischen Messungen.

## Zusätzliche physikalische Katalogfelder (v72)

Die **192 Katalogobjekte bleiben erhalten**; `schemaVersion: 1` bleibt gültig. Die folgenden Felder sind **optional**. Fehlende oder explizit auf `null` gesetzte Werte sind unbekannt (`—`), kein Nullmesswert. Ein numerischer Wert `0` ist dagegen ein echter Mess-/Modellwert. `src/data/catalog.js` prüft numerische Grenzen, die Reihenfolge Min. ≤ Mittel ≤ Max. (soweit vorhanden), Einheiten und HTTPS-Quellenangaben.

```json
{
  "physical": {
    "radiusKm": 6371,
    "temperatureMinK": null,
    "temperatureMaxK": null,
    "temperatureMeanK": 288.15,
    "atmosphericPressurePa": 100000,
    "surfaceGravityMs2": 9.8,
    "dataSourceUrl": "https://nssdc.gsfc.nasa.gov/planetary/factsheet/"
  },
  "orbit": {
    "semiMajorAxis": 1,
    "unit": "AU",
    "meanDistance": 1
  }
}
```

Der JSON-Ausschnitt zeigt **nur die betroffenen Felder**; vollständige Objekte benötigen die bisherigen Orbit- und Aussehensangaben. `orbit.meanDistance` übernimmt die Einheit von `orbit.unit`: **AE für eine Sonnenbahn**, **km für eine Parent-Bahn** (z. B. Monde und Satelliten). Falls nicht gesetzt, wird die vorhandene **große Halbachse** als charakteristische mittlere Bahndistanz angezeigt und explizit als **Modellwert** gekennzeichnet. Dieser Bahnradius ist kein minutengenauer Abstand und kein echtes zeitgewichtetes Abstandsmittel. Bei der Sonne selbst gibt es keinen Parent-Abstand. Bei aktualisierten Live-Bahnelementen wird der Halbachsen-Fallback mit aktualisiert; ausdrücklich hinterlegte Werte bleiben stabil.

Im Daten-Tab (ab v74 als gemeinsame Temperaturkachel) stehen Temperaturminimum, -maximum und -mittel in **°C**, Druck in **bar/Pa**, Gravitation in **G** (standardisierte Erdbeschleunigung, 1 G = 9,80665 m/s²), mittlerer Abstand in **AE/km**. Die Gravitation wird **nur für die Anzeige** aus dem gespeicherten SI-Wert in m/s² umgerechnet. Gespeichert werden stets **Kelvin und Pascal**, damit Einheiten eindeutig sind. Der bestehende Wert `physical.temperatureK` wird für Altbestände weiter gelesen; `temperatureMeanK` hat Vorrang. Bei Gasriesen gelten NASAs Temperaturen und Schwerebeschleunigungen für das **1-bar-Niveau**; dort existiert kein definierter fester Oberflächendruck. Raketen-/Raumsondeneinträge sind keine Oberflächenkörper und erhalten keine erfundenen Physikwerte.

v72 enthält belegte Beispielwerte für **Sonne, acht Planeten, Erdmond, Pluto und Charon** (12 Katalogobjekte). Spezifische Min-/Max-Temperaturen sind vorerst nur für **Merkur** (NASA Science: Tages-/Nacht-Extrema) und den **Mond** (NASA NSSDCA: äquatorialer Tagesgang) eingetragen. Sie sind **nicht** dieselbe statistische Größe wie ein planetenweit gemitteltes Temperaturminimum/maximum. Alle übrigen Temperaturgrenzen bleiben unbekannt. Auch Druck und Gravitation werden nur dort gepflegt, wo sie begründet sind. Quellen-URLs werden pro physikalischem Objekt hinterlegt: [NASA/NSSDCA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), [NASA Mercury Facts](https://science.nasa.gov/mercury/facts/), [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) und [NASA Pluto Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/plutofact.html). Andere Körper werden nicht stillschweigend geschätzt.

## Historische Katalogerweiterung v56 – Doppelasteroiden, neun Monde und sieben Erdsatelliten

Das Manifest enthält jetzt **23 Kategoriedateien** und **5 deutsche Redaktionsdateien** (`catalogVersion: 10.0.0`). Drei zusätzliche, unverändert validierbare JSON-Kategoriedateien und ein Redaktionspaket ergänzen den bestehenden Katalog um **18 Objekte** auf insgesamt **192**. Das Schema (`schemaVersion: 1`) wurde nicht geändert.

| Datenquelle | Typ | Neue IDs | Genauigkeitsgrenze |
|---|---|---|---|
| `data/catalog/binary-asteroids-v56.json` | `binary` | `didymos`, `dimorphos` | Didymos: historische Sonnenbahn; Dimorphos: **vereinfachte Post-DART-Relativbahn** (Halbachse in km) |
| `data/catalog/moons-additions-v56.json` | `moon` | S/2003 J 2, S/2003 J 4, S/2018 J 2, Loge, Skoll, Greip, Tarqeq, S/2002 N 5, S/2021 N 1 | NASA/JPL mittlere Elemente, nicht präzise Ephemeriden; unbekannte Größen explizit null |
| `data/catalog/satellites-additions-v56.json` | `satellite` | NORAD 48274, 39741, 40730, 43013, 54234, 41866, 51850 | CelesTrak-Katalogreferenz: charakteristische Bahnhöhen/Perioden; Knoten, Perizentrum und Phase bewusst schematisch, **kein aktuelles TLE** |

Die neue Oberkategorie `binary` wird in `src/data/bodies.js` und `src/data/layers.js` geführt. Die Relativbahn von **Dimorphos** ist mit `parentId: didymos` an Didymos gebunden. Der Orbitalrechner verwendet für dessen Abstände Kilometereinheiten; für Didymos selbst, dessen `parentId: sun` lautet, gelten Astronomische Einheiten. Die Formate der Detailansicht zeigen Größen unter einem Kilometer in Metern an. Ein Radius von `0` bedeutet weiterhin **unbekannt**, nicht einen punktförmigen Körper.

**Quellen:** [NASA – Didymos](https://science.nasa.gov/solar-system/asteroids/didymos/), [JPL – Bahnänderung durch DART](https://www.jpl.nasa.gov/news/nasa-study-asteroids-orbit-shape-changed-after-dart-impact/), [NASA/JPL – Planetary Satellite Mean Elements](https://ssd.jpl.nasa.gov/sats/elem/), [CelesTrak – NORAD Orbital Elements](https://celestrak.org/NORAD/elements/). Die Angaben werden nicht laufend synchronisiert.

## Erweiterung v52: 14 neue Objekte

Der Katalog wurde von **160 auf 174** Datensätze und von drei auf vier deutsche Redaktionsdateien erweitert. Die Katalogversion ist **9.0.0**; das Schema bleibt **1**. Die neuen Astronomie-Dateien enthalten fünf Asteroiden (`asteroids-v52.json`), vier Kometen (`comets-v52.json`) und fünf transneptunische Objekte (`transneptunian-v52.json`, Typ `tno`). Dazu passt die vierte redaktionelle Datei `de-objects-v52.json`. Alle werden über `data/catalog/manifest.json` geladen und für Offline-Verfügbarkeit vorgemerkt. Freiwillige `aliases` sind geprüfte Namenslisten und werden in der Katalogsuche berücksichtigt.

**Bahninterpretation:** Die angegebenen oskulierenden Elemente beziehen sich auf jeweils benannte Epochen. Für Arrokoth liegt eine vereinfachte historische Abschätzung vor. Der Renderer integriert keine Störungen oder nichtgravitativen Kräfte; die Positionen sind Modellpositionen und keine tagesaktuellen Ephemeriden.

## Prinzip und Quellen

Die Astronomie und die Redaktion bleiben unabhängig und sind über **stabile IDs** verknüpft:

- `data/catalog/manifest.json`: Katalogversion, Standard-Locale und eine **Liste** aller Astronomie- und Redaktionsdateien.
- `data/catalog/*.json`: `schemaVersion: 1`, `type`, `provenance` (Herkunft, Quelle, Quell-URL, Review-Notizen), `objects` mit `physical`, `orbit` und `appearance`.
- `data/editorial/*.json`: `schemaVersion: 1`, `locale`, `revision`, `articles` mit `id`, `status`, `title`, `summary`, `sections` und `references`.
- `src/data/catalog.js`: prüft alle Datensätze, Elternbeziehungen, Einheiten, Schemata, Links und doppelte IDs; fügt pro Locale **alle** gelisteten redaktionellen JSON-Dateien zusammen und erzeugt die bisherigen Renderer-Felder.

### Historischer Stand v8 (nicht der aktuelle Bestand)

Der astronomische Bestand ist 160 Objekte groß, davon 37 aus v7 und **123 neue**. Acht thematische `moons-*-jpl.json`-Dateien enthalten 120 neue Monde (Jupiter, Saturn, Uranus, Neptun, Pluto), `asteroids-jpl.json` einen neuen Asteroiden und `comets-jpl.json` zwei Kometen.

Die Redaktion umfasst drei Dateien in deutscher Sprache: `de.json` (37 bisherige Objekte), `de-moons.json` (120 zusätzliche Monde) und `de-small-bodies.json` (3 Kleinkörper). Die Reihenfolge in `manifest.editorial` ist für die inhaltliche Zuordnung unerheblich. **Doppelte Artikel-IDs in verschiedenen Dateien werden abgelehnt.**

## Astronomische JSON-Daten

```json
{
  "id": "amalthea",
  "name": "Amalthea",
  "parentId": "jupiter",
  "physical": { "radiusKm": 83.5 },
  "orbit": {
    "semiMajorAxis": 181400,
    "unit": "km",
    "periodDays": 0.499918,
    "eccentricity": 0.003,
    "inclinationDeg": 0.4,
    "ascendingNodeDeg": 282.9,
    "periapsisDeg": 180.1,
    "meanAnomalyDeg": 310.6,
    "epoch": "2000-01-01T12:00:00.000Z",
    "referenceFrame": "mixed: Laplace (inner), ecliptic (irregular)",
    "model": "mean-elements"
  },
  "appearance": { "color": "#b5b8be", "style": "moon" }
}
```

Einheiten: Radius und Mond-Abstand in km; Sonnenumlaufbahnen in AE; Umlaufperioden in Tagen; Winkel in Grad; Epoche als ISO-UTC. `radiusKm: 0` bedeutet **unbekannt** und wird im UI als `—` angezeigt. Dieses Null-Sentinel ist kein physikalischer Nullradius.

Optionale Metadaten der neuen Objekte: `orbit.referenceFrame` und `orbit.model`. Der Adapter übernimmt sie als `orbitFrame`/`orbitModel` in die Renderer-Objekte und zeigt die schematische Art der Bahn in der Detailansicht an. Aktuell werden nur gebundene Ellipsen `0 ≤ e < 1` akzeptiert. Bei Elternobjekt `sun` ist die Bahn-Achse in AE, sonst in km.

### Quellen und Genauigkeit

1. **Mondbahnen:** <https://ssd.jpl.nasa.gov/sats/elem/sep.html> (NASA/JPL, mittlere Bahnelemente). Für Radiusangaben: <https://ssd.jpl.nasa.gov/sats/phys_par/>.
2. **(3) Juno, 1P/Halley, 2P/Encke:** <https://ssd.jpl.nasa.gov/sb/elem_tables.html> (JPL-Beispielzeilen aus historischen Epochen; für Halley/Encke Ausrichtung auf das angegebene Periheldatum und daraus abgeleitete periodische Näherung).
3. **Artikel:** Weiterführende NASA-Science-Quellen stehen direkt bei den jeweiligen Artikeln, z. B. <https://science.nasa.gov/saturn/moons/enceladus/> und <https://science.nasa.gov/solar-system/comets/1p-halley/>.

**Keine Ephemeriden:** Die Quellen liefern **mittlere oder historische** Bahnelemente. Manche Mondbahnen sind in unterschiedlichen Bezugssystemen tabelliert; der Renderer macht hierfür keine genaue Transformation in einen einheitlichen physikalischen Rahmen. Zudem werden Sonne/Planeten/Monde maßstabsverändert, Zeit und gravitative Störungen nur vereinfacht behandelt. Die angezeigten Bahnen und Positionen sind daher **anschauliche Visualisierungen**, nicht für die Planung realer Beobachtungen, Bahnmanöver oder exakte Konjunktionen geeignet.

## Redaktion

Beispiel in `data/editorial/de-moons.json`:

```json
{
  "id": "amalthea",
  "status": "imported",
  "revision": 1,
  "title": "Amalthea",
  "summary": "Amalthea ist ein Mond von Jupiter. …",
  "sections": [
    { "heading": "Besonderheit", "text": "…" },
    { "heading": "Umlaufbahn und Größe", "text": "…" }
  ],
  "references": [
    { "title": "NASA/JPL – Mittlere Bahnelemente der Planetenmonde", "url": "https://ssd.jpl.nasa.gov/sats/elem/sep.html" }
  ]
}
```

Die Punkte `…` sind nur Kürzungen in diesem Doku-Beispiel. Der tatsächlich ausgelieferte Artikel enthält vollständige Texte. Im historischen v8-Stand hatten alle **160** Katalogkörper sichtbare Artikel mit mindestens einer Sektion und einer HTTPS-Referenz; **69** enthalten außerdem einen individuell verfassten thematischen Hintergrundabschnitt. Die Astronomie-Texte sind paraphrasiert; keine längeren Quellentexte werden kopiert.

**Status:** `draft` wird nicht gezeigt, `imported` ist sichtbar, aber noch nicht abschließend redaktionell freigegeben, `published` ist sichtbar und für geprüfte/freigegebene Texte vorgesehen. v8 setzt die zusätzlichen und erweiterten Artikel **bewusst auf `imported`**: Quellenlinks und Plausibilitätsprüfungen ersetzen keine inhaltliche wissenschaftliche Endredaktion. `revision` dient der Versionierung pro Artikel und Datei. URLs müssen HTTPS nutzen; HTML wird im UI escaped.

## Neue Einträge hinzufügen

1. Eine zuverlässige Quelle prüfen und eindeutige `id` (Kleinbuchstaben/Zahlen/Bindestriche) auswählen. Bei unbekannten Werten **nicht raten**.
2. In einer passenden Kategoriedatei oder einer neuen Datei der gleichen Kategorie ein Objekt ergänzen. Bei neuen Dateien `manifest.categories` erweitern. Die vorhandenen Objekttypen sind `star`, `planet`, `moon`, `dwarf`, `asteroid`, `binary`, `comet`, `satellite` und `tno`.
3. In einer passenden Redaktionsdatei mit derselben `id` `summary`, Abschnitte, `references` und `status` anlegen. Für größere Bestände sind weitere `de-*.json`-Dateien möglich; diese in `manifest.editorial` ergänzen.
4. `npm run check:data` und `npm run check` ausführen. Doppelte IDs, unbekannte Eltern, falsche Orbiteinheiten, Zyklen, ungültige Epochen oder fehlerhafte Links werden abgelehnt.
5. Bei einem Release `catalogVersion` im Manifest und `CACHE_NAME` in `sw.js` erhöhen. Alle JSON-Dateien werden automatisch anhand des Manifests offline vorgehalten.

## Grenzen / zukünftige Architektur

Noch kein CMS, automatisierter Import oder wissenschaftlich genauer Ephemeridenrechner. Der Browser lädt alle JSON-Dokumente und hält sie im Speicher. Für mehrere Tausend Körper empfehlen sich zunächst gefilterte/lazy geladene Kategorien, Suchindizes, visuelle Ausdünnung und Renderer-Level-of-Detail. Änderungen des Schemavertrags erfordern eine neue `schemaVersion` und Migration.

**Fehlerbehebung:** `sw.js` befindet sich zwingend im Root unter `/sw.js`, `data/catalog/manifest.json` unter `/data/catalog/manifest.json`. Im lokalen Node-Server sind nur öffentlich benötigte JSON-Dateien, Browsermodule und Root-Webdateien auslieferbar.

## Rotation und Ausrichtung (v98)

Alle Angaben sind optional und erhalten die bestehende Katalog-Schemaversion `1`:

| Pfad | Typ / Einheit | Bedeutung |
|---|---|---|
| `physical.rotationPeriodHours` | endliche Zahl ungleich 0; Stunden | Siderische Rotationsperiode relativ zu Fixsternen, bei retrograder Rotation negativ |
| `physical.axialTiltDeg` | Zahl von 0 bis 180; Grad | Neigung der Eigenachse relativ zur (angenäherten) Bahnebene; Werte über 90° kennzeichnen eine invertierte Achse |
| `physical.synchronousRotation` | boolean | Modellierte synchrone Rotation; die Oberfläche zeigt annähernd zum Parent, berechnet aus den Kepler-Elementen |
| `appearance.texturePhaseDeg` | endliche Zahl; Grad | Optionaler Korrekturwinkel der Karte um die Eigenachse relativ zur Modellphase (J2000/Objektepoche) |
| `appearance.axisHeadingDeg` | endliche Zahl; Grad | Optionale Azimut-Ausrichtung der Achsneigung im XZ-Szenenraum |

Ohne `rotationPeriodHours` und ohne explizite Synchronbindung wird eine Textur nicht künstlich gedreht. Ohne `axialTiltDeg` gilt eine modellierte Neigung von 0°. Von Solar System OpenData werden gültige Felder `sideralRotation` und `axialTilt` übernommen und andernfalls lokale Werte beibehalten.

**Datenherkunft und Grenzen:** Für Planeten, Erdmond und Pluto wurden NASA/NSSDCA-Mittelwerte verwendet (https://nssdc.gsfc.nasa.gov/planetary/factsheet/). Die Quelle beschreibt mittlere, nicht absolut-phasenrichtige Rotationen; Sonne (25,38 Tage / 7,25°) und Ceres (9,074 Stunden / ca. 4°) nutzen vereinfachte Rotationswerte. Die Synchronbindung ausgewählter Monde approximiert die Sichtseite zum Elternkörper, ohne physikalische Librationen/Polpräzession. Die Ausrichtung von 0° relativ zum Himmelskoordinatensystem kann nicht ohne texturspezifische Herkunft und vollständige IAU-Pol-/Meridianparameter zugesichert werden. Ältere JSON-Dateien ohne diese Felder bleiben gültig.
