# Delta v38 – kompakter Planetenansicht-Button und globales Folgen

## Änderungen gegenüber v37

- **Planetenansicht öffnen → Planetenansicht:** Die Beschriftung ist einzeilig; die bisherige Aufzählung von Monden und künstlichen Satelliten im Button wurde entfernt. Die Funktion für Planeten, Zwergplaneten und Monde bleibt erhalten; ein bereits aktives Planetensystem lässt sich weiterhin neu zentrieren.
- **Zentrieren → Folgen:** Fadenkreuz-Icon unverändert. Der Button ist ein globaler Toggle mit `aria-pressed` und aktiver Markierung, statt mit der gerade verfolgten Objekt-ID verknüpft zu sein.
- Ist Folgen eingeschaltet, wird die Kamera auf jedes neu selektierte, positionierbare Objekt ausgerichtet. Der globale Zustand bleibt beim Objektwechsel und beim Wechsel der Szene bestehen; die Geschwindigkeitsmessung wird dabei neu begonnen, sodass ein Zielwechsel nicht fälschlich als sehr schnelle Bewegung zählt.
- Drehbewegungen, manuelle Perspektivenwechsel, Reset-Perspektiven und Zoom mit Mausrad oder Pinch deaktivieren das Folgen nicht mehr. Bei Pinch ignoriert die Steuerung unabsichtliche Mittelpunktverschiebungen; bewusstes Zwei-Finger-Schwenken bleibt möglich.
- Bewusstes Verschieben der Kamera (Rechtsziehen, Shift+Ziehen, Pfeiltasten, Zwei-Finger-Pan) und die bestehende Grenze für zu schnelle Bewegung (> eine projizierte Bildschirmhöhe je Realzeitsekunde) schalten Folgen aus.
- Bei Auswahl einer Raumsonde ohne Ephemeride oder beim Aufheben der Auswahl wird das Ziel pausiert, ohne den globalen Toggle auszuschalten. Die nächste positionierbare Auswahl wird automatisch verfolgt.
- Die bisherige mobile Fokusprojektion oberhalb des halb geöffneten Sheets bleibt während des Folgens erhalten; das gilt auch nach Zoom und Drehung.
- Versionswechsel auf **38.0.0**; PWA-Cache `sonnensystem-shell-v38`.

## Tests

- Fortgeführte Regressionstests sowie neue Tests für globale Auswahl-/Szenenwechsel, Zoom, Drehung, Pinch, bewusstes Schwenken, Geschwindigkeitsabbruch und die reduzierten Objektdetails.
- Kompatibel mit einer bestehenden v37-Installation.

## Installation

Delta v38 über die v37-Installation entpacken und bestehende Dateien ersetzen. Die Anwendung neu laden, damit der neue PWA-Cache aktiviert wird.
