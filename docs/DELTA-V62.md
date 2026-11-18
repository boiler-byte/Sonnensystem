# Delta v62 – freies Umschauen ohne Objektauswahl

**Basis:** vollständiger Projektstand v61. **Ziel:** v62.0.0. Nur geänderte bzw. neue Dateien im Delta enthalten.

## Layer-Dropdown

Der sichtbare Name der Kategorie bleibt **„Transnept. Objekte“**, wie bereits seit v60. Die Kategorie-ID `tno` und der ausgeschriebene, barrierefrei zugängliche Name bleiben erhalten.

## Kamerasteuerung ohne Selektion

- **Ohne ausgewähltes Objekt (`selectedId === null`):** Rechtsziehen, Shift+Linksziehen und synchrones **Zwei-Finger-Wischen** drehen die Blickrichtung wie AR am **unveränderten Augenpunkt**. Es wird keine Umlaufbewegung um ein Zentrum erzeugt. Der Blick kann auch oberhalb des Horizonts liegen.
- **Mit ausgewähltem Objekt:** Bisherige Winkel-/Orbitsteuerung bleibt unverändert.
- **Linksziehen, ein Finger, Pfeiltasten:** Weiterhin bodenparalleles Verschieben, nun in der aktuellen freien Blickrichtung.
- **Mausrad und Pinch:** Weiterhin Zoom. Zwei-Finger-Swipes werden von Pinch weiterhin über die Bewegung beider Kontakte unterschieden.
- **Auswahl, Kamera-/Perspektivwechsel, Szenenwechsel:** Die freie Orientierung wird entweder ohne Änderung von Augpunkt/Blickrichtung in die übliche Kamerasteuerung übertragen oder bei expliziter Neuausrichtung zurückgesetzt. Aktivierung des AR-Sensors übernimmt den freien Blick ohne Sprung.

## Installation und Prüfung

ZIP `Sonnensystem-Delta-v62.zip` auf **v61** überlagern. Projektversion `62.0.0`, Offline-Cache `sonnensystem-shell-v62`. `npm run check` prüft die vorhandenen Regressionstests sowie neue Tests der v62-Gesten, Kamera- und Übergangsinvarianten.
