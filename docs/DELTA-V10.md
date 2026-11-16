# Delta v10.0 – Ruhige Labels und smarte Zeitleiste

Dieses **inkrementelle** Update setzt auf dem **vollständigen Workspace-Root v8 plus Delta v9.1** auf. Es enthält ausschließlich geänderte und neue Dateien. Die 160 astronomischen Objekte und 160 Artikel bleiben unverändert.

## Installation

1. Das bestehende Workspace-Root mit v8 und Delta v9.1 beibehalten.
2. `Sonnensystem-Delta-v10.zip` **direkt in diesem Workspace-Root** entpacken (bestehende Dateien überschreiben, keine Dateien löschen).
3. `npm run check` ausführen und mit `npm start` starten.
4. Eine installierte PWA neu öffnen/neu laden; `sw.js` wechselt auf `sonnensystem-shell-v10` und entfernt alte Shell-Caches.

## 1. Smarte Labels – Positionen stabilisieren

* Ein je Objekt persistierter Seitenanker (rechts / links / oben / unten) verhindert Seitenwechsel durch kurzlebige Überlagerungen – gerade im dichten Satellitenfeld um die Erde.
* Ist die gewählte Seite blockiert, wird das betreffende Label vorübergehend **ausgeblendet**, nicht sofort umgehängt. Bei dauerhaft blockierter Seite wird erst nach **650 ms** anhaltender Blockade und **1300 ms** Seitenhaltezeit eine alternative Position erwogen; sie muss weitere **180 ms** frei bleiben.
* Wieder freie ursprüngliche Positionen werden bevorzugt. Historische Anker verfallen nach 6 Sekunden außerhalb der Projektion. Bereits sichtbare Labels haben innerhalb ihrer Kategorie einen kleinen Bestandsbonus.
* Die v9-Regeln für Kollisionen mit anderen Labels/Himmelskörpern und das Ausblenden schnell bewegter Beschriftungen (>220 Pixel/s, Wiedereinblenden <140 Pixel/s nach 140 ms) bleiben aktiv.
* Bei dauerhaftem Platzmangel wird lieber **kein** Label gezeigt als ein überlappendes oder häufig springendes Label. Objekte selbst bleiben sichtbar und auswählbar.

## 2. Smarte Zeitleiste – drei Buttons

* **Play/Pause**: startet bzw. hält die Simulation an. Der Geschwindigkeitswert bleibt auch beim Pausieren und Einstellen erhalten.
* **Geschwindigkeit**: öffnet einen vertikalen, logarithmischen Slider mit **241 diskreten Positionen** von unten langsam bis oben schnell. Der gewählte Wert wird direkt auf dem Button und im Popover gezeigt; Escape und Klick außerhalb schließen das Popover.
* **Heute**: setzt das Simulationsdatum auf die **aktuelle Systemzeit** (`Date.now()`) zurück und lässt Ansicht, Kamera, Pausezustand und Geschwindigkeit unverändert.
* Im Kopf der Zeitleiste bleiben simuliertes Datum und Uhrzeit in UTC lesbar. Der bisherige Datumspicker und der horizontale Slider sind entfernt.

| Ansicht | Minimum | Default | Maximum |
|---|---:|---:|---:|
| Sonnensystem | 1 h / s | **3 h / s** | 10 Jahre / s |
| Planetenansicht | 1 min / s | **1 h / s** | 1 Jahr / s |

Die logarithmische Positionierung nutzt zwei Segmente, sodass **beide Standardgeschwindigkeiten** exakt auf einem Slider-Schritt liegen. Die Ansichten merken sich ihre manuell gewählten Geschwindigkeiten getrennt; beim ersten Wechsel wird der jeweilige Default verwendet.

## Geänderte und neue Dateien

* `src/renderer/labels.js` – Seitenanker, Wechsel-Hysterese und Bestandsbonus.
* `src/ui/timeline.js`, `src/app.js` – neue Geschwindigkeitsbereiche, Formatierung, Play/Pause und Moduswechsel.
* `index.html`, `css/styles.css` – drei Bedienelemente, Popover, responsives Layout.
* `sw.js`, `package.json`, `server/server.mjs` – Release v10 und PWA-Cache.
* `README.md`, `docs/ARCHITECTURE.md`, `docs/DELTA-V10.md` – Dokumentation.
* `tests/smart-timeline-v10.test.mjs`, `tests/stable-labels-v10.test.mjs` – neue Tests.
* Bestehende Tests – Anpassung der erwarteten Version sowie des Datumsformats.

## Prüfung und Grenzen

Der Testlauf `npm run check` validiert die unveränderten Katalogdaten und prüft die alten UI-/Renderer-Regeln sowie die neuen Mindest-/Maximalwerte, logarithmischen Stufen, Moduswechsel und Seitenanker. Der Renderer bleibt eine **schematische astronomische Visualisierung**, keine Echtzeit-Ephemeride. Bei extrem beschleunigter Zeitsimulation oder hohem Projektionsspeed können Satelliten-Labels bewusst länger ausgeblendet bleiben.
