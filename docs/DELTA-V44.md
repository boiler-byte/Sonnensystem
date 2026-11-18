# Delta v44 – Optimierte Größenverhältnisse

## Installation

Dieses Overlay-Delta baut auf einer **vollständigen v43-Installation** auf. `Sonnensystem-Delta-v44.zip` direkt in den Projektstamm entpacken, vorhandene Dateien überschreiben und die PWA beziehungsweise den Browser neu laden. Es werden nur neue/geänderte Dateien ausgeliefert.

## Neues Verhalten bei Objekt an / Bahn aus

Bei **maßstabsgetreuen Objektgrößen** und **schematischen Bahnen** verwendet die Sonnensystem-Ansicht den Modus **„Optimierte Größenverhältnisse“**:

1. **Sonne:** Radius genau `4 × renderRadius(sun)` = **4,52 Szeneneinheiten**, gegenüber 1,13 im Standard-Schema. Die Größe ist der Radius, nicht der Durchmesser.
2. **Planeten:** ihre Radien folgen demselben linearen Größenfaktor wie die Sonne: `radiusKm / 696340 × 4,52`. Dadurch bleiben die korrekten Größenverhältnisse aller Planeten untereinander und zur Sonne erhalten; für Objekte ohne bekannte physikalische Radien bleibt die Kugelgröße null.
3. **Bahnabstände:** jeder bislang schematisch berechnete Bahn-Halbachsenradius wird mit **4** multipliziert, ohne die Orbitalelemente oder ihre relativen Entfernungsverhältnisse zu verändern. Die vergrößerte Sonne überlappt damit die Merkurbahn nicht. Auch die Kepler-Positionen sowie gegebenenfalls eingespielte Horizons-Vektoren und Orbitlinien nutzen dieselbe Regel.
4. **Übersichtskamera:** Start-/Reset-Abstand 188 statt 47 Einheiten, maximaler Abstand 400 statt 100. Beim Wechsel in/aus dem Modus wird die Kamera automatisch neu gerahmt, sofern sie nicht manuell bewegt wurde. Manuelle Kameraführung, Objektfokus und Tracking bleiben erhalten.
5. **Bedienung:** Es gibt **keinen zusätzlichen Schalter**. Die bisherige Kombination der beiden Toggles aktiviert den Modus automatisch. Der Tooltip nennt „Optimierte Größenverhältnisse“; die Status-Snackbar zeigt den Modus beim Einschalten an.

## Bewusst unverändert

- **Objekt aus / Bahn aus:** bisherige schematische Größen und Bahnabstände, weiterhin beim Start aktiv.
- **Objekt aus / Bahn an:** schematische Objektgrößen mit physikalischen Bahnradien.
- **Objekt an / Bahn an:** physikalische Größen und Bahnabstände in derselben Maßeinheit; die astronomischen Größen-/Abstandsverhältnisse bleiben unverändert.
- **Isolierte Planetenansicht:** planetenzentrierte Radien und Orbitabstände sind weiterhin unabhängig von der speziellen solarzentrischen Optimierung; hier bleibt die bestehende lokale Kombination aus echten Körperradien und schematischen Mondbahnen bestehen.
- Layer, Beleuchtung, Farbpalette, Dropdown-Anordnung und alle sieben Toggle-Buttons.

## Mathematische Grundlage

Das Sonnenradius-Referenzmaß von **696340 km** ist aus `data/catalog/stars.json` übernommen. `OPTIMIZED_ORBIT_FACTOR = 4` multipliziert die vorhandene, nichtlineare **schematische** Distanzfunktion – dies ist keine Umstellung auf physikalisch korrekte Abstände. Insbesondere sind Größen und Bahnen in der optimierten Variante **bewusst nicht** mit demselben realen Kilometermaßstab gekoppelt. Das ist erst im Modus Objekt an / Bahn an der Fall. Die grafische Optimierung verbessert weder Bahnparameter noch Genauigkeit oder Aktualität der Daten.

## Qualitätssicherung

Die Tests überprüfen alle vier Toggle-Kombinationen, die tatsächlichen Größenverhältnisse, die vierfach erweiterten Umlaufbahnen, den freien Raum an der Merkurbahn, simulierte und externe Positionen, die unveränderte Planetenansicht sowie den automatischen Kamerawechsel und die Statusmeldungen. Die Installation wird durch Überlagern einer frischen v43-Kopie geprüft.

Version **44.0.0**, Service-Worker-Cache `sonnensystem-shell-v44`.
