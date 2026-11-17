# Delta v21 – kompakte Zeitsteuerung und dynamische Sliderfüllung

**Basis:** v20. Dieses Delta enthält nur neue oder geänderte Dateien. Ins Root einer vorhandenen v20-Installation entpacken und gleichnamige Dateien überschreiben. Texturen, Katalogdaten und Renderer sind unverändert.

## Änderungen

1. **Zentrierter Reglergriff:** Der logarithmische Range-Slider bleibt vertikal bedienbar, wird aber browserübergreifend als um 90 Grad gedrehter nativer Horizontalregler gerendert. Griff (26 × 26 px) und 6 px breite Spur liegen auf einer gemeinsamen Mittelachse; Beschriftungen und Grenzen bleiben erhalten.
2. **Füllfarbe:** Der bereits durchlaufene Bereich wird von unten bis zum Griff bernsteinfarben dargestellt. `syncControls` setzt `--speed-progress` passend zum aktuellen Slider-Schritt (0–240); die Darstellung reagiert auf Änderungen in Sonnen- und Planetenansicht.
3. **Heute-Button:** Nur das Rücksetzsymbol ist sichtbar. Der bestehende zugängliche Name, Tooltip und die Klickfunktion für die aktuelle lokale Zeit bleiben bestehen.
4. **Menüanordnung:** Einspaltiges Popup mit Slider, darunter zwei gleich breite Buttons (Play/Pause und Zurücksetzen), darunter Datum und Uhrzeit in zwei Zeilen. Keine seitliche Zwei-Spalten-Anordnung mehr.
5. **Breite:** Das Zeit-Popup ist exakt so breit wie der auslösende Dropdown-Button – auf Desktop und Mobilgeräten; auf niedrigen Viewports wird die Höhe angepasst.

## Technische Details

- `index.html`: Slider-Slot und Button-Reihe, Icon-only Reset, Versionslabel.
- `css/styles.css`: einspaltiges Dropdown, zentrierter gedrehter Range-Input, Track-Gradient und kompakte Größen.
- `src/ui/timeline.js`: synchronisierter Füllstand als CSS-Variable.
- `package.json`: `21.0.0`; `sw.js`: neuer Cache `sonnensystem-shell-v21` zum Ausrollen des Updates.
- Bestehende Strukturtests aktualisiert; zusätzliche Tests prüfen die neuen Layout- und Füllanforderungen.

## Kontrolle

`npm run check` für Datenvalidierung und Node-Regressionen. Das Aussehen des Sliders wurde in Chromium bei mobilen (320/375 px) und Desktop-Breiten überprüft. Änderungen an Geschwindigkeit, Simulation, Pause und Datum wurden nicht vorgenommen.
