# Lokale Texturen und Cache (v97)

Die Anwendung verwendet ausschließlich selbst bereitgestellte, gleichursprüngliche Bilddateien. Es gibt weder automatische Downloads noch externe Texturdienste. Im gelieferten Quellarchiv waren **keine Bilddateien enthalten**. Die neuen Ordner sind vorbereitet, bleiben aber bis zum Hinzufügen eigener Bilder leer.

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

Benennen Sie ein Objekt in jeder Stufe identisch, z. B. `earth.webp`, `mars.webp`, `moon.webp`. Unterstützt werden `.webp` (bevorzugt), `.jpg`, `.jpeg` und `.png`. Browserseitig wird zuerst die gewählte Stufe und darin WebP vor JPG/JPEG/PNG geprüft. In `standard/` werden weiterhin bekannte historische Quelldateinamen wie `2k_earth_daymap.jpg` und `2k_earth_daymap.webp` unterstützt. Bilder unter `textures/detail/` werden **nicht** erkannt; die 4096-px-Stufe heißt `high/`.

Die gewünschte Qualitätsstufe wird so ermittelt:

| Darstellung | Zuerst | Wenn nicht vorhanden |
|---|---|---|
| Mobil | `mobile/` – 512 px | `standard/`, dann `high/` |
| Desktop-Sonnensystem | `standard/` – 2048 px | `high/`, dann `mobile/` |
| Desktop-Planetenansicht | `high/` – 4096 px | `standard/`, dann `mobile/` |

Die genannten Pixelzahlen begrenzen die vom WebGL-Renderer hochgeladene **Bildbreite**. Ein größeres Ersatzbild wird beim Laden verkleinert, niemals automatisch hochskaliert. Damit sind die derzeit ausschließlich unter `standard/` abgelegten Texturen auch auf Mobilgeräten sichtbar. Für geringeren mobilen Datentransfer empfiehlt sich, echte 512-px-WebP-Dateien in `mobile/` bereitzustellen.

## Automatische Cache-Aktualisierung

Bei Verwendung des mitgelieferten Node-Servers (`npm start`) liest `/api/textures/manifest` alle erlaubten Bilddateien aus den drei Ordnern und liefert pro Bild einen SHA-256-Hash. Beim Ersetzen, Ändern, Hinzufügen oder Entfernen einer Datei ändert sich die Version bzw. Verfügbarkeit. Der Renderer prüft dieses Manifest beim ersten Texturladen und bei aktivem Rendering spätestens alle 30 Sekunden; er verwirft veraltete GPU-Texturen und lädt die geänderten Dateien mit `?v=<SHA-256>` neu. Die Prüfsummen werden serverseitig auf Basis von Dateistatistiken wiederverwendet, bis sich die Datei ändert. Änderungen mit gleicher Dateigröße und gleichem Dateinamen werden erkannt.

Der PWA-Service-Worker verwendet `sonnensystem-shell-v97` für Anwendung/Katalog und `sonnensystem-textures-v1` für Bilddateien. **Netzwerk zuerst**: Online wird der aktuelle Stand geladen und als einzige Offline-Kopie unter der versionsfreien URL gespeichert. Bei Netzwerkausfall wird die letzte erfolgreich gespeicherte Bildversion verwendet. Alte Versionen sammeln sich nicht pro Hash an. Fehlt eine Datei vollständig, zeichnet die App weiterhin ihre prozedurale Oberfläche.

Für **rein statisches Hosting ohne `/api/textures/manifest`** bleibt der Bildabruf mit Cache-brechender URL und Netzwerk-vor-Cache erhalten. Ein neu hochgeladenes oder geändertes Bild wird dann bei erneutem **Online-Laden** der Anwendung übernommen. Die automatische Änderungserkennung innerhalb einer offenen Sitzung erfordert den lokalen Node-Endpunkt.

## Installation und Prüfung

1. Delta v97 direkt im Stamm der bestehenden v96-Installation entpacken; vorhandene Bilddateien nicht überschreiben oder löschen.
2. Texturen bei Bedarf unter `mobile/`, `standard/`, `high/` nach Dateinamen sortieren. `earth.webp` ist die bevorzugte neue Bezeichnung; `earth.jpg` bleibt gültig.
3. Node-Server neu starten (`npm start`), dann die installierte PWA einmal **online** neu laden.
4. Optional `npm run textures:list` ausführen. Das Kommando listet die gefundenen lokalen Bilder und ihre SHA-256-Versionen. Mit `/api/textures/manifest` kann derselbe Stand im Browser geprüft werden.
5. Test: eine Bilddatei ersetzen, 30 Sekunden bei aktiver 3D-Ansicht abwarten oder die Seite online neu laden. Sie sollte ohne manuelles Browsercache-Löschen mit neuer Prüfsumme geladen werden.

**Bildrechte:** Bildrechte und korrekte Urhebernennung hängen von den selbst bereitgestellten Texturen ab. Der Betreiber muss Herkunft und Lizenz separat dokumentieren; die App kann diese aus lokalen Bildern nicht ableiten.
