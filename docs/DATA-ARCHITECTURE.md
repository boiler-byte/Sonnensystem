# Datenmodell und redaktionelle Inhalte – v8.0

## Prinzip und Quellen

Die Astronomie und die Redaktion bleiben unabhängig und sind über **stabile IDs** verknüpft:

- `data/catalog/manifest.json`: Katalogversion, Standard-Locale und eine **Liste** aller Astronomie- und Redaktionsdateien.
- `data/catalog/*.json`: `schemaVersion: 1`, `type`, `provenance` (Herkunft, Quelle, Quell-URL, Review-Notizen), `objects` mit `physical`, `orbit` und `appearance`.
- `data/editorial/*.json`: `schemaVersion: 1`, `locale`, `revision`, `articles` mit `id`, `status`, `title`, `summary`, `sections` und `references`.
- `src/data/catalog.js`: prüft alle Datensätze, Elternbeziehungen, Einheiten, Schemata, Links und doppelte IDs; fügt pro Locale **alle** gelisteten redaktionellen JSON-Dateien zusammen und erzeugt die bisherigen Renderer-Felder.

### v8-Dateien

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

Die Punkte `…` sind nur Kürzungen in diesem Doku-Beispiel. Der tatsächlich ausgelieferte Artikel enthält vollständige Texte. Alle **160** Katalogkörper haben sichtbare Artikel mit mindestens einer Sektion und einer HTTPS-Referenz; **69** enthalten außerdem einen individuell verfassten thematischen Hintergrundabschnitt. Die Astronomie-Texte sind paraphrasiert; keine längeren Quellentexte werden kopiert.

**Status:** `draft` wird nicht gezeigt, `imported` ist sichtbar, aber noch nicht abschließend redaktionell freigegeben, `published` ist sichtbar und für geprüfte/freigegebene Texte vorgesehen. v8 setzt die zusätzlichen und erweiterten Artikel **bewusst auf `imported`**: Quellenlinks und Plausibilitätsprüfungen ersetzen keine inhaltliche wissenschaftliche Endredaktion. `revision` dient der Versionierung pro Artikel und Datei. URLs müssen HTTPS nutzen; HTML wird im UI escaped.

## Neue Einträge hinzufügen

1. Eine zuverlässige Quelle prüfen und eindeutige `id` (Kleinbuchstaben/Zahlen/Bindestriche) auswählen. Bei unbekannten Werten **nicht raten**.
2. In einer passenden Kategoriedatei oder einer neuen Datei der gleichen Kategorie ein Objekt ergänzen. Bei neuen Dateien `manifest.categories` erweitern. Die vorhandenen Objekttypen sind `star`, `planet`, `moon`, `dwarf`, `asteroid`, `comet`, `satellite`.
3. In einer passenden Redaktionsdatei mit derselben `id` `summary`, Abschnitte, `references` und `status` anlegen. Für größere Bestände sind weitere `de-*.json`-Dateien möglich; diese in `manifest.editorial` ergänzen.
4. `npm run check:data` und `npm run check` ausführen. Doppelte IDs, unbekannte Eltern, falsche Orbiteinheiten, Zyklen, ungültige Epochen oder fehlerhafte Links werden abgelehnt.
5. Bei einem Release `catalogVersion` im Manifest und `CACHE_NAME` in `sw.js` erhöhen. Alle JSON-Dateien werden automatisch anhand des Manifests offline vorgehalten.

## Grenzen / zukünftige Architektur

Noch kein CMS, automatisierter Import oder wissenschaftlich genauer Ephemeridenrechner. Der Browser lädt alle JSON-Dokumente und hält sie im Speicher. Für mehrere Tausend Körper empfehlen sich zunächst gefilterte/lazy geladene Kategorien, Suchindizes, visuelle Ausdünnung und Renderer-Level-of-Detail. Änderungen des Schemavertrags erfordern eine neue `schemaVersion` und Migration.

**Fehlerbehebung:** `sw.js` befindet sich zwingend im Root unter `/sw.js`, `data/catalog/manifest.json` unter `/data/catalog/manifest.json`. Im lokalen Node-Server sind nur öffentlich benötigte JSON-Dateien, Browsermodule und Root-Webdateien auslieferbar.
