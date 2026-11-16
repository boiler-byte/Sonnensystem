# Delta v3 – Sonnensystem: Kamerasteuerung

Dieses Delta baut auf **Sonnensystem v2** auf. Es ersetzt nur Dateien, die sich gegenüber dem
beigefügten Projektstand `Sonnensystem.zip` (v2) geändert haben, und ergänzt den neuen Test.

## Installation

1. Das vorhandene Sonnensystem-v2-Projekt beibehalten (nicht löschen).
2. Alle Dateien aus `Sonnensystem-Delta-v3.zip` **in das Stammverzeichnis des Projekts** kopieren
   (dort, wo `index.html`, `renderer.js`, `sw.js` und `server.mjs` liegen), vorhandene Dateien ersetzen.
3. `node server.mjs` ausführen, anschließend `http://localhost:4173` öffnen.
4. Bei bereits installierter PWA die Anwendung online neu laden. Der Service Worker wechselt auf
   Cache `sonnensystem-shell-v3`, damit die bisherige Steuerungslogik nicht offline weiterläuft.
5. Optional prüfen: `npm run check` (Node.js 20 oder neuer).

## Steuerung in v3

| Eingabe | Verhalten |
|---|---|
| Linke Maustaste ziehen / Mobil: ein Finger wischen | Ansicht drehen (wie zuvor) |
| Mausrad | Hinein- / herauszoomen (wie zuvor) |
| Rechte Maustaste ziehen oder Umschalt + linke Maustaste | In der aktuellen Kameraebene in Zugrichtung verschieben, ohne Verzögerung |
| Pfeiltasten halten | Kameraposition kontinuierlich links / rechts / hoch / runter bewegen |
| Zwei Finger spreizen / zusammenführen | Vergrößern / verkleinern nach Abstand der Finger |
| Zwei Finger gemeinsam wischen | In Wischrichtung verschieben, kombinierbar mit Pinch-Zoom |

Weitere Details:

- Bewegung orientiert sich an den aktuellen Kameraachsen. Horizontale und vertikale Züge sind
  nicht länger an starre X-/Z-Koordinaten gekoppelt.
- Manuelles Verschieben ist direkt; die animierte automatische Kamerafahrt bei Objektauswahl
  und „Übersicht“ bleibt erhalten.
- Die Zwei-Finger-Erkennung wird beim Hinzufügen oder Entfernen eines Fingers neu angesetzt;
  ein Mehrfingergestus löst keine unbeabsichtigte Objektauswahl aus.
- Pfeiltasten greifen nicht in Textfeldern, bei fokussierten Bedienelementen oder bei
  geöffneter Hilfe ein. Sondertasten-Kombinationen des Browsers bleiben unberührt.
- Die Hilfetexte, Versionsanzeige, README und der Offline-Cache wurden aktualisiert.

## Enthaltene Dateien (nur Delta)

- `renderer.js` – Maus-/Touch-Eingaben, kursorgetreue Kameraverschiebung, Pfeiltasten.
- `index.html` – Hilfe, zugängliche Kamerafläche und Versionsanzeige.
- `styles.css` – sichtbarer Tastaturfokus auf der Kamerafläche.
- `sw.js` – Cache-Version v3, damit geänderte Module zuverlässig geladen werden.
- `package.json` – Version und Testskript.
- `README.md` – Bedienung und PWA-Hinweise.
- `test-v3.mjs` – Regressionstests für Maus, Pfeiltasten, Touch und Pick-Verhalten.
- `DELTA-V3.md` – diese Änderungs- und Installationsanleitung.

Die übrigen Dateien aus v2, einschließlich `app.js`, `data.js`, `server.mjs`, Manifest, Icons
und `test-v2.mjs`, bleiben unverändert erhalten. Keine zusätzlichen Abhängigkeiten.
