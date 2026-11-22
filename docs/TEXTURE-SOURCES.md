# Lokale Texturen und Cache (Stand v134)

Die Anwendung verwendet ausschließlich selbst bereitgestellte Bilddateien aus dem lokalen Projekt. Es gibt weder automatische Downloads noch externe Texturdienste. **Auch im Quellarchiv v133/v134 sind keine WebP-Dateien enthalten**. Die Bilddateien müssen in der bestehenden Installation bzw. beim Hosting unter den beschriebenen Pfaden vorhanden sein.

## Katalogbasierte Bild-Metadaten (v134)

Für Objekte mit vorhandenen WebP-Texturen wird direkt am jeweiligen Objekt in `data/catalog/*.json` ein optionales `images`-Array geführt. Es gibt aktuell **29 `type: "texture"`-Einträge**; ein zukünftiger Eintrag mit einem anderen `type` (z. B. `image`) kann weitere Objektbilder dokumentieren. Jede Abbildung enthält `author`, `sourceUrl` (HTTPS), `license`, `licenseUrl` (HTTPS oder null) und `modifications` (Text oder null). Diese Werte werden beim Katalogladen validiert und an die Laufzeit weitergereicht.

```json
"images": [
  {
    "type": "texture",
    "author": "Solar System Scope",
    "sourceUrl": "https://www.solarsystemscope.com/textures/",
    "license": "CC BY 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
    "modifications": "Konvertierung nach WebP"
  }
]
```

Der Dateipfad ist **nicht** separat gespeichert, sondern wird aus der Objekt-ID gebildet: Desktop `textures/standard/{id}.webp`, Mobil `textures/mobile/{id}.webp`. Der Renderer lädt nur noch als `texture` deklarierte Katalogobjekte; bisherige Ausweichstufen (`high`, `standard`, `mobile` sowie alte Standard-Basisnamen) bleiben für die Abwärtskompatibilität bestehen. Der Webserver prüft weiterhin, ob die Dateien wirklich existieren.

**Quellzuordnung (Katalogdaten):**

- **Solar System Scope**, 14 Einträge: Sonne, acht Planeten, Erdmond sowie Ceres, Haumea, Makemake und Eris. Urheber `Solar System Scope`, Quellen-URL [Solar System Scope / Textures](https://www.solarsystemscope.com/textures/), Lizenz **CC BY 4.0** ([Lizenz](https://creativecommons.org/licenses/by/4.0/)). Die vier Kleinkörper-Texturen sind auf der Quellseite als *fictional* gekennzeichnet.
- **NASA/JPL-Kartensammlung**, 15 Einträge: Io, Europa, Ganymed, Kallisto, Phobos, Deimos, Mimas, Enceladus, Rhea, Titan, Iapetus, Titania, Oberon, Triton, Pluto. Quellseiten in [JPL Texture Maps](https://space.jpl.nasa.gov/tmaps/), gruppiert nach Muttersystem. Als Lizenzhinweis sind die [NASA Media Usage Guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/) verlinkt; sie sind **keine pauschale Public-Domain-Freigabe für sämtliche Caltech-/USGS-/künstlerischen Bearbeitungen**.

**Prüfstatus:** Die ursprünglichen WebP-Dateien sind nicht Teil des bereitgestellten ZIP. Die Zuordnung zu Sammlungen und die angegebene WebP-Konvertierung folgen der Nutzerangabe und den veröffentlichten Quellseiten; eine Dateifür-Datei-Verifikation von Bild, Ursprung, Autor, spezifischer Bearbeitung und Rechten ist erst anhand der konkreten lokalen Dateien möglich. Insbesondere fiktive JPL-Karten (z. B. eine historische Pluto-Darstellung) können andere Rechteinhaber haben. Die `sourceUrl` bezeichnet daher derzeit die **Sammlung**, nicht nachweislich die exakte Quelldatei. Vor einer externen Veröffentlichung sollte die Herkunft jedes Assets bestätigt werden.

## Orientierung auf der WebGL-Kugel (v98)

Die Dateien werden als **equirektanguläre 2:1-Karten** interpretiert. Bildmitte (`u=0,5`) ist der 0°-Meridian, der obere Bildrand ist der Nordpol, der untere der Südpol; östliche Längengrade steigen auf der Kugel von vorne gesehen nach rechts. Diese Konvention setzt voraus, dass die verwendete Karte nicht selbst horizontal oder vertikal gespiegelt ist. Eigendrehung erfolgt anhand von Rotationsdaten und der Simulationszeit. Bei synchronen Monden ist die Kartenvorderseite näherungsweise zum Planeten ausgerichtet.

Zur Korrektur eines abweichenden karteneigenen Nullmeridians kann im jeweiligen JSON-Eintrag `appearance.texturePhaseDeg` als Gradzahl gesetzt werden (z. B. `90` für eine Vierteldrehung). Die Neigung orientiert sich an `physical.axialTiltDeg`; falls die Neigungsrichtung für eine spezielle Karte angepasst werden muss, ist `appearance.axisHeadingDeg` verfügbar. Ohne konkrete Kartendatei ist eine astronomisch genaue Phase einzelner Oberflächenmerkmale nicht überprüfbar; aufwändige IAU-Orientierungsephimeriden sind nicht implementiert. Das 2:1-Verhältnis ist die erwartete Kartenkonvention, aber keine technische Voraussetzung für den Upload.

## Verzeichnisaufteilung

```text
textures/
├── mobile/       # maximal 512 px breit
├── standard/     # maximal 2048 px breit
└── high/         # maximal 4096 px breit
```

Benennen Sie ein Objekt in jeder Stufe identisch, z. B. `earth.webp`, `mars.webp`, `moon.webp`. Ab v108 wird **ausschließlich `.webp`** gesucht. `.jpg`, `.jpeg` und `.png` werden nicht mehr als Objekttexturen abgefragt; vorhandene Dateien dieser Formate müssen vorher in WebP konvertiert werden. In `standard/` werden bekannte historische Basisnamen weiterhin akzeptiert, z. B. `2k_earth_daymap.webp`. Bilder unter `textures/detail/` werden **nicht** erkannt; die 4096-px-Stufe heißt `high/`.

Die gewünschte Qualitätsstufe wird so ermittelt:

| Darstellung | Zuerst | Wenn nicht vorhanden |
|---|---|---|
| Mobil | `mobile/` – 512 px | `standard/`, dann `high/` |
| Desktop-Sonnensystem | `standard/` – 2048 px | `high/`, dann `mobile/` |
| Desktop-Planetenansicht | `standard/` – 2048 px | `high/`, dann `mobile/` |

Die genannten Pixelzahlen begrenzen die vom WebGL-Renderer hochgeladene **Bildbreite**. Ein größeres Ersatzbild wird beim Laden verkleinert, niemals automatisch hochskaliert. Damit sind die derzeit ausschließlich unter `standard/` abgelegten Texturen auch auf Mobilgeräten sichtbar. Für geringeren mobilen Datentransfer empfiehlt sich, echte 512-px-WebP-Dateien in `mobile/` bereitzustellen.

## Cache-Aktualisierung und fehlgeschlagene Texturen (v109)

Bei Verwendung des mitgelieferten Node-Servers (`npm start`) liest `/api/textures/manifest` alle erlaubten Bilddateien aus den drei Ordnern und liefert pro Bild einen SHA-256-Hash. Beim Ersetzen, Ändern, Hinzufügen oder Entfernen einer Datei ändert sich die Version bzw. Verfügbarkeit. Der Renderer prüft dieses Manifest beim ersten Texturladen und bei aktivem Rendering spätestens alle 30 Sekunden; **erfolgreich geladene** veraltete GPU-Texturen werden verworfen und geänderte Dateien mit `?v=<SHA-256>` erneut geladen. Die Prüfsummen werden serverseitig auf Basis von Dateistatistiken wiederverwendet, bis sich die Datei ändert. Änderungen mit gleicher Dateigröße und gleichem Dateinamen werden erkannt. **Fehlgeschlagene Texturladevorgänge bleiben dagegen während der gesamten App-Sitzung gesperrt**, auch wenn sich das Manifest zwischenzeitlich ändert.

Der PWA-Service-Worker verwendet `sonnensystem-shell-v109` für Anwendung/Katalog und weiterhin `sonnensystem-textures-v1` für bereits gespeicherte WebP-Bilddateien. **Netzwerk zuerst**: Online wird der aktuelle Stand geladen und als einzige Offline-Kopie unter der versionsfreien URL gespeichert. Bei Netzwerkausfall wird die letzte erfolgreich gespeicherte Bildversion verwendet. Alte Versionen sammeln sich nicht pro Hash an. Fehlt eine Datei vollständig, zeichnet die App weiterhin ihre prozedurale Oberfläche.

Auf **GitHub Pages ohne `/api/textures/manifest`** fragt die App jedes WebP-Bild mit seinem relativen Pfad **ohne Zeitstempel oder sonstige Query-Parameter** an. Der nicht verfügbare Manifest-Endpunkt wird einmal pro Sitzung getestet, nicht alle 30 Sekunden. Scheitert das Laden einer Textur (z. B. durch 404), versucht die Anwendung alle noch nicht getesteten Qualitäts-/Namensalternativen. Anschließend werden die fehlgeschlagenen Dateien und die fehlgeschlagene Objektsuche **nicht automatisch erneut angefragt**, auch nicht bei einem Qualitätswechsel. **Erst nach App-Neustart oder manuellem Neuladen** beginnt die Suche erneut. Das gilt auch für zuvor fehlgeschlagene Texturen am lokalen Node-Server. Die automatische Aktualisierung bereits *erfolgreich geladener* Texturen innerhalb einer Sitzung ist weiterhin über den Node-Endpunkt möglich.

## Installation und Prüfung

1. Delta v109 direkt über eine v108-Installation entpacken; vorhandene Bilddateien nicht überschreiben oder löschen.
2. Texturen bei Bedarf unter `mobile/`, `standard/`, `high/` nach Dateinamen sortieren. Alle für den Renderer gewünschten Objekttexturen müssen `.webp` sein (`earth.jpg` ist nicht mehr gültig).
3. Node-Server neu starten (`npm start`), dann die installierte PWA einmal **online** neu laden.
4. Optional `npm run textures:list` ausführen. Das Kommando listet die gefundenen lokalen Bilder und ihre SHA-256-Versionen. Mit `/api/textures/manifest` kann derselbe Stand im Browser geprüft werden.
5. Test: Beim Node-Server eine **bereits erfolgreich geladene** Bilddatei ersetzen und bei aktiver 3D-Ansicht höchstens 30 Sekunden warten oder die Seite online neu laden. Bei **zuvor fehlenden** Bildern ist ein App-Neustart oder manuelles Neuladen erforderlich. Auf GitHub Pages die Textur-URL direkt prüfen und nach einem Upload die App manuell neu laden.

**Bildrechte:** Das Katalogfeld `images` dokumentiert die angegebenen Quellen und Lizenzen. Es beweist nicht die Herkunft einer konkret installierten Datei. Solar System Scope erfordert Namensnennung, Lizenzlink und Kennzeichnung von Änderungen (CC BY 4.0). Für NASA/JPL-/USGS- und künstlerische Werke ist die spezifische Nutzungsberechtigung zu prüfen.

## GitHub Pages: Projekt-Unterverzeichnis (v107)

Die App kann unter `https://<account>.github.io/Sonnensystem/` oder in einem tieferen Verzeichnis gehostet werden. Der Browser lädt beispielsweise `https://<account>.github.io/Sonnensystem/textures/standard/earth.webp`. Absolute Domain-Wurzel-Pfade wie `https://<account>.github.io/textures/standard/earth.webp` werden nicht mehr verwendet.

**Vorbedingung:** GitHub Pages muss die tatsächlichen Bilddateien unterhalb des veröffentlichten App-Verzeichnisses bereitstellen. Der Quell-/Delta-Download enthält keine Texturdateien. Fehlt eine Datei, bleibt die prozedurale Darstellung sichtbar. Eine Datei per Browser-Direktaufruf testen; 404 bedeutet fehlende Datei bzw. falsche Verzeichnisstruktur auf dem Hosting. Auf GitHub Pages gibt es keinen Node-Endpunkt zur Erzeugung eines Textur-Manifests, deshalb wird dort die vorhandene direkte Bildsuche verwendet.
