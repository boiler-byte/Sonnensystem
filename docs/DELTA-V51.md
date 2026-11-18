# Delta v51 – Größen in Reihe und sanfte Bahnwelle

## Installation

`Sonnensystem-Delta-v51.zip` im Projektstamm über die **vollständige v50-Installation** entpacken und betroffene Dateien ersetzen. Das ZIP enthält nur neue und geänderte Dateien gegenüber v50. Anwendungsversion **51.0.0**; Offline-PWA-Cache **sonnensystem-shell-v51**. Bei installierter PWA App nach Aktualisierung neu öffnen, damit der neue Service Worker aktiv wird.

## Objekt-Reihendarstellung

- Beim Umschalten **von Umlaufbahnen in die Reihe** wird **Objekt: maßstabsgetreu** automatisch eingeschaltet. Die vor dem Umschalten gezeichneten Positionen und Größen werden vor der Änderung gespeichert, damit der animierte Eintritt nahtlos bleibt.
- Die beiden Szenen teilen die Objektgrößen-Einstellung wie zuvor. `scaleObjects` wird deshalb für Sonnensystem und Planetenansicht gesetzt; die aktive UI zeigt unmittelbar den eingeschalteten Schalter. `Bahn` und andere Darstellungsoptionen ändern sich nicht.
- Manuelles Umschalten der Objektgrößen während einer Reihe bleibt möglich. Beim Verlassen bleibt der zuletzt gewählte Maßstab erhalten; erst ein erneutes Aktivieren von Reihe stellt Maßstabsgetreu wieder als Standard her.

## Animation beim Ausschalten der Bahnabstände in der Planetenansicht

- **Nur** für `Bahn: An → Aus` bei geöffneter Planetenansicht (und außerhalb der Reihendarstellung) ersetzt eine glatte, monotone Kurve den bisher stärker sichtbaren Gummiband-Effekt. Die Bahnradien schwingen nicht mehr über ihren Zielwert hinaus.
- Sichtbare Bahnen werden nach ihrem physischen Abstand zum Zentralplaneten sortiert. Die innerste Bahn beginnt zuerst, die äußerste bis zu **0,20 × 980 ms ≈ 196 ms** später. Alle Bahnen erreichen nach **980 ms** denselben endgültigen schematischen Maßstab. Monde/Satelliten nutzen dieselbe Verzögerung wie ihre Bahnen; Orbitlinien und Kugelpositionen bleiben synchron.
- Erneute Änderungen während einer Animation starten von der zuletzt sichtbaren Position und dem zuletzt sichtbaren Bahn-Radius. Der Gegenweg (Bahn aus → an), Änderungen in der Sonnenansicht, Größen-/Reihenwechsel und Ansichtsübergänge behalten die bisherige Federanimation. Bei `prefers-reduced-motion` findet keine Animationswelle statt. Keine Änderungen an Keplerparametern oder Katalogdaten.

## Prüfung

Neue automatische Tests für Skalierungs-Standard der Reihe in beiden Ansichten, `aria-pressed`-Synchronität, manuelle Änderung und erneutem Eintritt, korrekte Auswahl der Animationsart, monotone und nach Distanz gestaffelte Bahnen, synchronisierte Kugel-/Bahn-Geometrie, Unterbrechungsfreiheit und Bewegung-reduzieren. Bestehende Regressionen und PWA-Cache-/Versionsprüfungen bleiben erhalten. Zum Prüfen `npm run check` ausführen.
