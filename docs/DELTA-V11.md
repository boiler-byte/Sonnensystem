# Delta v11 – Objekt-Auswahl und Oberflächenbilder

**Basis:** vollständiger v8-Workspace-Root, Delta v9.1, danach Delta v10. Das v11-Delta enthält **nur geänderte und neue Dateien** und wird direkt ins Workspace-Root entpackt.

## Objekt-Auswahl

- Ein kurzer linker Mausklick oder Tipp auf den leeren 3D-Himmel hebt eine vorherige Objektauswahl auf (`SolarRenderer.pick → onClearSelect → state.selected=null`). Treffer auf Himmelskörper wählen diese weiterhin aus. Rotation, Zoom und Panning ändern die Auswahl nicht.
- Die Detailanzeige und Katalogmarkierung werden nach dem Abwählen aktualisiert. Die aktuelle Planetenansicht und Kameraposition bleiben bestehen.
- Bei ausgewähltem Objekt setzt die Label-Priorität keine automatischen Unterdrückungen mehr durch: schnelle Satelliten, Durchflüge, Text-/Körperkollision und temporäre Sichtüberdeckung blenden dieses Label nicht aus. Seine Positionsseite bleibt stabil. Bei **manuell deaktivierter Beschriftung** bleibt auch das ausgewählte Label unsichtbar.
- Alle bisherigen v9/v10-Hysterese- und Kollisionsregeln gelten weiterhin für *nicht ausgewählte* Labels. Die Regressionstests wurden entsprechend präzisiert.

## Oberflächentexturen

- UV-Sphäre (neues Vertex-Layout mit acht Floats), Shader-Sampling `uDiffuse`/`uHasTexture`; prozedurale Texturen als jederzeit funktionsfähiger Fallback.
- Registrierte equirektangulare Bilder: NASA-basierte Solar-System-Scope-Karten aller acht Planeten, Sonne und Mond; NASA/JPL- und USGS-Mosaike für Phobos, Deimos und die großen Monde der äußeren Planeten; Cassini-Mosaik für Titan und OSIRIS-REx-Fotomosaik für Bennu.
- Dynamischer Qualitätsmodus: **2K** für Standardansicht, **bis 4K** für Körper mit verfügbarer hochaufgelöster Karte in der Planetenansicht, **512 px** für mobile/speicherschwache Geräte. Nicht höher als das verfügbare Originalbild und das Gerätelimit.
- Quellen in `src/renderer/texture-sources.js` fest zugelassen; Browser lädt über `/textures/<tier>/<id>.jpg`, Node-Proxy prüft echte HTTPS-Ursprünge, Datenformat und Größe. Private Dateiablage unter `.texture-cache/`. Bildanzeige im GPU-Cache mit begrenzter Parallelität/LRU.
- PWA auf `sonnensystem-shell-v11` umgestellt: neue Module gehören zur App-Shell, Bilder werden **erst nach erfolgreicher Anfrage** in den Cache aufgenommen.
- Texturquellen werden als Attribution/Quellenlink in der Detailansicht angezeigt. Alle Quellen und Rechteangaben sind in [TEXTURE-SOURCES.md](TEXTURE-SOURCES.md) dokumentiert.

**Einschränkung:** Die Bilddateien sind **nicht Bestandteil des ZIPs**, können hier nicht direkt von den Quellenservern geladen und daher nicht live visuell verifiziert werden. Erster Online-Abruf über den mitgelieferten Node-Server (`npm start`) erforderlich; andernfalls bleibt die bisherige schematische Optik erhalten. Die tatsächliche Größe der JPL-Missionstexturen liegt teilweise unter 2K; Uranus und Neptun besitzen im Register keine hochauflösenden 4K-Varianten. Für die Mehrzahl der kleinen Monde und Asteroiden ist noch kein kartografisch passendes Raster registriert.

## Tests

`npm run check`: bestehende v2–v10-Regressionen und neue v11-Tests für Auswahl, immer sichtbare ausgewählte Labels in beiden Modi, Quellen-Allowlist, Sicherheit, UV-/Shader-Integration, GPU-Downscaling, Details-Attribution, PWA-Integration und Textur-Stufen.

## Installation

1. Im bestehenden v10-Workspace das ZIP `Sonnensystem-Delta-v11.zip` entpacken und Dateien überschreiben. **Nicht** als eigenständiges Projekt starten.
2. `npm run check` ausführen.
3. `npm start`; anschließend im Browser neu laden. Bei einer vorhandenen installierten PWA auf Aktivierung des `v11`-Service-Workers achten.
4. Bei Onlinezugang optional `npm run textures:cache` zum Vorwärmen der Standardbilder ausführen.
