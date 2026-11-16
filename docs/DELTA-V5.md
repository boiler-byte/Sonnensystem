# Delta v5 – Planetenansicht mit Monden und Satelliten

Dieses ZIP aktualisiert ein **bestehendes Sonnensystem-v4-Projekt** auf v5. Es enthält nur Dateien, die gegenüber v4 geändert wurden, sowie den neuen v5-Test und diese Anleitung. Die Dateien `data.js`, `server.mjs`, `manifest.webmanifest`, die Icons und die v2-Tests bleiben unverändert.

## Installation

1. Das bestehende Projekt **v4** beibehalten.
2. `Sonnensystem-Delta-v5.zip` in das Projektstammverzeichnis entpacken, also dorthin, wo `app.js`, `renderer.js` und `server.mjs` liegen. Vorhandene Dateien ersetzen.
3. Seite neu laden. Bei installierter PWA gegebenenfalls ein zweites Mal neu laden, bis der aktualisierte Service Worker aktiv ist (`sonnensystem-shell-v5`).
4. Optional testen: `npm run check` (Node.js 20 oder neuer).

**Wichtig:** Nur über v4 installieren. Bei älterem Projekt vorher die Deltas v3 und v4 in der richtigen Reihenfolge einspielen.

## Neu in v5

- In den **Objektdetails eines Planeten** erscheint der Button **„Planetenansicht öffnen“**. In Details anderer Objekttypen wird dieser Button nicht gezeigt.
- Die **3D-Planetenansicht** zeigt ausschließlich den ausgewählten Planeten und alle zum jeweiligen Zeitpunkt im Atlas geladenen natürlichen Monde sowie künstlichen Satelliten des Planeten. Dazu gehören auch später nachgeladene Objekte aus Solar OpenData bzw. CelesTrak.
- Die lokale Szene benutzt eigene, nicht maßstabsgetreue Größen und Bahnradius-Skalierungen sowie einen passenden Kameraabstand, damit Begleitobjekte besser erkennbar sind. Zeitsteuerung, Zoomen, Drehen, horizontales Verschieben, Bahnen und Namen bleiben nutzbar.
- Ein Klick auf ein Begleitobjekt öffnet dessen Details **ohne** die Planetenansicht zu verlassen. Die Auswahl eines anderen Planeten wechselt direkt zu dessen System. Die Auswahl eines Objekts außerhalb des Systems führt zurück in den Sonnensystemmodus und fokussiert dieses Objekt.
- **„Übersicht“ (Kamera zurücksetzen)** wechselt **sofort** zurück zur vollständigen Sonnensystemansicht und setzt die Kamera zurück. „Heute“ setzt wie bisher ebenfalls die Kamera zurück.
- Auf Mobilgeräten schließt sich das Bottom Sheet beim Umschalten in die Planetenansicht bzw. beim Wechsel zur Übersicht, sodass die Szene bedienbar ist.
- Der Anzeigemodus wird in der Bühne benannt; auf schmalen Mobilgeräten ist der Name sichtbar, solange die Planetenansicht aktiv ist.

## Darstellungs- und Datenhinweise

Die Planetenansicht zeigt nur **im Atlas vorhandene** Monde und Satelliten, keinen vollständigen wissenschaftlichen Katalog. Bei vollen API-Katalogen werden alle geladenen Begleitobjekte dargestellt; um die Szene lesbar zu halten, sind die Anzahl der gleichzeitig beschrifteten Objekte und der gezeichneten Orbitlinien begrenzt. CelesTrak-Orbits bleiben illustrative Näherungen, keine genaue Satellitenortung. Es wurden **keine** neuen API-Endpunkte oder externen Bibliotheken ergänzt.

## Prüfungen

`npm run check` führt Syntax- und Regressionstests für v2, v3, v4 und v5 durch. Neu getestet werden unter anderem die planetenzentrierte Auswahl, die direkte Rückkehr per Übersicht, Mond- und Satellitenpositionen, Zeitfortschritt, Kamerarahmen, Rendering-Filter sowie die UI-Ereignisse des Buttons.
