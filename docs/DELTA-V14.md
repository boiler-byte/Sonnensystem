# Delta v14 – Schmales Control-Panel und mobile Steuerung

## Installation

Delta v14 direkt über **v13** im Workspace-Root entpacken und bestehende Dateien ersetzen. Nur neue oder geänderte Dateien befinden sich im ZIP; der lokale Texturordner `textures/standard` und sämtliche Astronomiedaten bleiben erhalten. Die bisherige Installationsreihenfolge für Neuinstallationen ist v8 → v9.1 → v10 → v11 → v12 → v13 → v14.

## Desktop und Tablet ab 771 px

- Control-Panel bleibt **oben rechts**, aber rund **180–184 px schmal**.
- Ansicht-Dropdown bleibt bestehen; Play/Pause, Geschwindigkeit und Datum sind **untereinander** angeordnet.
- **Bahnen, Namen und Übersicht** werden als reine SVG-Icon-Buttons dargestellt. `aria-label`, Tooltips und `aria-pressed` bleiben für Bedienbarkeit und Zustandsanzeige erhalten.
- Der logarithmische Geschwindigkeitsregler mit 241 Stufen öffnet links neben dem schmalen Panel.
- Bei 771–1030 px Bildschirmbreite beginnt die überlagernde Detailansicht unter dem erweiterten Panel, um die Werkzeug-Buttons nicht zu verdecken.

## Mobil bis 770 px

- Drei Bottom-Sheet-Tabs: **Objekte, Details, Steuerung** (statt der bisherigen Registerkarte „Zeit“).
- Der dritte Tab enthält die **vollständige Ansicht- und Zeitsteuerung** sowie die Bahnen-/Namen-Schalter. Es werden keine zweiten Bedienelemente erzeugt.
- Nur der bestehende **Übersicht-Button** bleibt schwebend im Sichtbereich der 3D-Szene. Er folgt beim Öffnen und Ziehen dem oberen Rand des Bottom-Sheets und bleibt erreichbar, solange Bühne sichtbar ist.
- Beim Zurückwechseln zu Desktop werden Panel und Übersicht-Button an ihre ursprünglichen Positionen versetzt, ohne Ereignisbehandler oder gesetzte Geschwindigkeiten zu verlieren.
- Das Öffnen des Geschwindigkeitsreglers vergrößert das Bottom-Sheet automatisch auf volle Höhe, damit der komplette vertikale Regler bedienbar ist. Beim Tab-Wechsel wird ein eventuell offener Popover geschlossen.

## Kompatibilität

Keine Änderungen an 3D-Bewegung, Katalogdaten, Texturdateien, API-Routen, Simulation oder den bisherigen Geschwindigkeitsbereichen. Die PWA-Cache-Kennung wurde auf `sonnensystem-shell-v14` geändert.

## Verifikation

Automatische Tests für mobile DOM-Verlagerung, Tabzustand, SVG-Steuerung, dynamisch nachgeführten Übersicht-Button und Bestandsregressionen; zusätzlich statische Layout- und Browserprüfungen für mehrere Viewport-Größen. Diese prüfen nicht die reale WebGL-Szene.
