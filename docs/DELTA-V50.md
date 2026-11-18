# Delta v50 – Kamera zurücksetzen im AR-Modus

## Installation

`Sonnensystem-Delta-v50.zip` im Projektstamm über eine **vollständige v49-Installation** entpacken und vorhandene Dateien ersetzen. Das Archiv enthält ausschließlich geänderte oder neue Dateien. Version nach Aktualisierung: **50.0.0**; der PWA-Cache lautet **sonnensystem-shell-v50**.

## Verhalten

- **AR aktiv:** Der vorhandene Button **Kamera zurücksetzen** unten rechts dient nun der **Neuausrichtung des AR-Blicks** statt des Wechsels der Standard-Kameraperspektiven. Die letzte gültige Geräteorientierung wird zur neuen Referenz. Die aktuelle Kamerabasis der Szene wird als neue neutrale Blickrichtung verwendet; die Perspektive richtet sich unmittelbar dorthin aus. Weitere Drehungen des Smartphones wirken relativ zu diesem neuen Ausgangspunkt.
- **Kein Ortswechsel:** Augenposition, Kameradistanz und aktuelle Szene bleiben bestehen. AR bleibt eingeschaltet, Sensorereignisse laufen weiter und es ist keine erneute Berechtigungsabfrage nötig. Mehrfaches Neuausrichten ist möglich. Eine kurze Snackbar bestätigt die Aktion.
- **AR aus oder noch nicht bereit:** Der Reset-Button verhält sich wie zuvor: in der Sonnensystemansicht Wechsel zwischen drei Kamerapositionen bzw. nach manueller Bewegung Rückkehr zur Standardperspektive, in der Planetenansicht Rückkehr zur Gesamtübersicht.
- **Bedienbarkeit:** Tooltip und Screenreader-Beschriftung des Buttons passen sich dem AR-Zustand an. Nicht unterstützte Smartphones zeigen wie bisher keinen AR-Button.

## Prüfumfang

Automatisierte Tests für AR-Rekalibrierung nach Bewegung, unveränderte Kameraposition, erneute Gerätebewegung und wiederholte Resets, Berechtigung/Session-/Sensorlistener, AR-Off-Verhalten und korrekte App-Verdrahtung. Bestehende Regressionstests und v50-Version/Cache werden geprüft. Zusätzlich wird das Delta als Overlay über v49 auf Byte-Gleichheit mit dem aktualisierten Projekt verglichen.
