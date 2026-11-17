# Delta v37 – kompakte Dropdowns und Objekt-Nachführung

## Änderungen

- Layer-Dropdown von **166 px auf 145 px** verkleinert.
- Zeitsteuerungs-Dropdown von **160 px auf 120 px** verkleinert; der 182-px-Regler und die seitlichen Min-/Max-Werte bleiben erhalten, Labels können umbrechen.
- Neuer **Zentrieren**-Button in den Objektdetails direkt neben **Planetenansicht öffnen** (für andere darstellbare Objekte als alleinige Aktion).
- Aktiviert einen automatischen Kamera-Fokus auf das ausgewählte Objekt und aktualisiert die Kamera-Zielposition während dessen Bewegung (Sonnensystem und isolierte Planetenansicht).
- Beendet die Nachführung bei manueller Kamerabewegung (Drehen, Schwenken, Zoom, Tastatur), Wechsel des ausgewählten Objekts, Szenen-/Presetwechsel, erneutem Klick oder Bewegung von mehr als einer projizierten Bildschirmhöhe pro Realzeitsekunde.
- Die Nachführung nutzt weiterhin die geglättete Kamera und die mobile Zentrierung über dem halb geöffneten Bottom-Sheet. Bloße Auswahl bleibt einmaliger Fokus ohne Tracking.
- Für Raumsonden ohne berechnete Position gibt es keine Nachführung; es werden keine Positionen erfunden.
- PWA-Cache `sonnensystem-shell-v37`, Paketversion 37.0.0.

## Installation

Delta v37 über bestehende v36-Installation entpacken und Dateien ersetzen. PWA neu laden, damit der neue Cache aktiviert wird.
