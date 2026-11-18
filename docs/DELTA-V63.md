# Delta v63 – AR-Button und vertikale Blicksteuerung

**Basis:** vollständige Version v62.0. **Zielversion:** v63.0.0.

## Änderungen

- Der AR-Toggle `#ar-mode-btn` wurde aus dem oberen Control Panel in die vorhandene untere `.viewport-actions`-Leiste vor `#reset-camera` verschoben. Er sitzt links unten, Reset rechts unten, beide in derselben horizontalen Ebene.
- Die mobile Bottom-Sheet-Synchronisierung (Höhenvariable, Drag-Transition und Inert-Zustand) gilt nun automatisch für **beide** Buttons. Safe-Area-Ränder, Screenreader-Zustände und die Ausblendung ohne AR-Unterstützung bleiben wirksam. Wenn AR verborgen ist, bleibt Reset rechtsbündig.
- Für die freie Blicksteuerung ohne Selektion ist die vertikale Maus- und Zwei-Finger-Bewegung umgekehrt: Ziehen nach unten senkt die Blickrichtung. Horizontalsteuerung, Pan, Zoom, AR-Sensororientierung und Blickorbit bei bestehender Selektion sind unverändert.
- Version und Service-Worker-Cache auf v63 aktualisiert.

## Installation

`Sonnensystem-Delta-v63.zip` über **v62** entpacken, vorhandene Dateien ersetzen. Das ZIP enthält nur neue/geänderte Dateien. Offline-PWA nach dem Update neu laden, bis der Cache `sonnensystem-shell-v63` aktiv ist.

## Prüfung

**316 von 316 automatisierten Tests bestanden.** Layout geprüft in Chromium bei 1440, 390, 320 und 280 Pixeln; AR und Reset sind in derselben Zeile und werden beim mobilen Sheet gemeinsam angehoben. ZIP-Overlay-Vergleich auf den vollständigen v62-Bestand.
