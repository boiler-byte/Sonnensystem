# Delta v43 – Kompaktes Maßstab-Menü und Status-Snackbars

## Installation

Dies ist ein **Overlay-Delta für eine vollständige v42-Installation**. Den Inhalt von `Sonnensystem-Delta-v43.zip` direkt ins Stammverzeichnis der bestehenden App entpacken und gleichnamige Dateien ersetzen. Danach neu laden bzw. die installierte PWA aktualisieren. Das Archiv enthält nur neue/geänderte Dateien; unveränderte Daten, Texturen, Servermodule und Icons bleiben aus v42 erhalten.

## Änderungen

1. **Maßstab-Popover platzsparender:** Die Überschrift „Maßstab“ sowie `p.scale-popover-note` wurden vollständig entfernt. Die Status-Anzeigen „An/Aus“ innerhalb der ursprünglich acht Toggles wurden entfernt. Der Klickzustand bleibt über aktives Styling, aktualisierte Tooltips und `aria-pressed` erkennbar.
2. **Kompakte Zweispalten-Gruppierung:** Unter „Objekt“ stehen **Beschriftung** und **Beleuchtung** nebeneinander, **4 Monde** folgt als breite Zeile. Unter „Bahn“ stehen **Umlaufbahn** und **Kontrast** nebeneinander. Große Symbol-Buttons: 68 px Höhe für die Maßstabs-Toggles, 44 px für die Zusatz-Toggles. Das Maßstab-Popover ist 192 px breit und an derselben rechten Viewport-Kante wie die anderen beiden Dropdowns ausgerichtet.
3. **Farben immer an:** Der bisherige Farben-Schalter entfällt. `createViewSettings()` verwaltet kein `orbitColors` mehr. `orbitAppearance()` verwendet unabhängig von alten Einstellungen immer die Kategoriepalette (`CATEGORY_COLORS`), für die Erdumlaufbahn weiterhin `EARTH_ORBIT_COLOR`. `orbitContrast` verändert nur Linienstärke und Deckkraft.
4. **Status-Snackbars unten rechts:** Die sieben verbliebenen Buttons melden jede nutzerinitiierte Änderung mit Bezeichnung und aktuellem Zustand (Maßstab: schematisch/maßstabsgetreu; Beleuchtung: Optimiert/Realistisch). Eine dedizierte Live-Region zeigt die aktuelle Snackbar für rund 2,4 s; rasche Folgeaktionen ersetzen die vorherige Meldung und starten die Zeit neu. Der bereits vorhandene API-Toast bleibt unverändert.
5. **Release:** Versionskennung `V43.0`, Paketversion `43.0.0`, Service-Worker-Cache `sonnensystem-shell-v43`.

## Unverändert

- Die Start- und Umschaltwerte der beiden Szenen: Beleuchtung im Sonnensystem aus, in der Planetenansicht an; die übrigen Toggle-Defaults werden beibehalten.
- Der direkte Wechsel zwischen den drei Popovers und ihre gemeinsame Rechtsausrichtung.
- Die gemeinsame Objekt- und Bahn-Skalierung über beide Szenen sowie die bisherige Kamera-/Zoomlogik.
- Die für Monde hinterlegte Kategorie-Farbe `#E6EDF5`.

## Qualitätssicherung

Die bestehenden Regressionstests wurden an die entfernten Anzeigeelemente und die neue Version angepasst. Neue v43-Tests sichern sieben sichtbare Toggles, Grid-Gruppierung, dauerhaft farbige Orbitlinien, Bedienrückmeldungen, Snackbar-Timer und ARIA-Zustände ab.
