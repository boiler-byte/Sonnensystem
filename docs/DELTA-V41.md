# Delta v41 – Control-Panel „Maßstab“

## Änderungen gegenüber v40

- Das obere, rahmenlose Control-Panel enthält jetzt **drei horizontale Buttons**: **Objektlayer**, **Maßstab** und **Zeitsteuerung**. Alle drei bleiben 58 px breit und 54 px hoch, mit je 8 px Abstand; die Leiste ist 190 px breit.
- Der neue **Maßstab-Button** verwendet ein SVG mit waagerechtem Doppelpfeil und zwei seitlichen Begrenzungsstrichen. Sein 186 px breites Dropdown öffnet wie die beiden bestehenden Menüs unterhalb der Buttonzeile und **rechts bündig zur Viewportkante**. Die vorhandenen Dropdownbreiten von Layer (145 px) und Zeit (120 px) bleiben unverändert.
- Im Dropdown stehen zwei **unabhängige Toggle-Buttons nebeneinander**: **„Objekt“** mit großem vertikalem Doppelpfeil und **„Bahn“** mit großem horizontalem Doppelpfeil; jeweils mit kleinem Label und An/Aus-Indikator.
- **Aus (Standard)**: Die bisherige schematische Darstellung. **An**: die jeweilige Dimension ist nach den vorhandenen Katalogdaten **physikalisch proportional**. Der Objekt-Toggle beeinflusst nur die Körperradien, der Bahn-Toggle nur die Abstände. Beide können gleichzeitig aktiviert werden.
- Bei aktivem Objekt-Maßstab berechnet der Renderer die Kugelgrößen aus `radiusKm`; bei aktivem Bahn-Maßstab wird die große Halbachse aus `a` ohne bisherige logarithmische/Wurzelkompression dargestellt. Sonnensystem: 1 AE = 3,4 Szeneneinheiten. Planetenansicht: Radius des Zentralkörpers = 1,28 Szeneneinheiten. Bei **beiden Schaltern auf An** teilen sich Größen und Abstände dieselbe physikalische Einheit innerhalb der Szene.
- Kugeln, Saturnringe, Trefferradien, Labels, Ortsberechnung und Bahnraster verwenden die passenden Skalierungswerte. In der Planetenansicht erweitert sich bei echten Abständen der mögliche Kamerabereich und die Clip-Distanz. Bei echten Objektgrößen ermöglichen engerer Nahzoom, angepasste Kamerafokussierung und eine dynamische Near-Clipping-Ebene das Betrachten kleiner Körper. Der Wechsel der Bahnskalierung passt eine noch nicht manuell geänderte Übersichtsansicht an.
- Die beiden Maßstabsschalter gelten für **beide Ansichtsarten gemeinsam**, während die übrigen Layer-/Bahndarstellungsoptionen szenenspezifisch bleiben. Menüwechsel mit nur einem Klick, Klick außerhalb und `Escape` unterstützen nun alle drei Menüs.
- Version **41.0.0**, PWA-Cache `sonnensystem-shell-v41`.

## Wissenschaftliche und praktische Grenzen

Das Umschalten ändert ausschließlich die **geometrische Skalierung**, nicht die Genauigkeit der zugrundeliegenden Ephemeriden oder die Herkunft der Bahndaten. Bei echten Größen sind viele Planeten, Monde und Satelliten im Überblick extrem klein oder nicht sichtbar; Labels bleiben zur Orientierung erhalten. Für unbekannte Radien (`radiusKm: 0`) wird **keine Größe erfunden**. Die reale Distanzskalierung kann in Planetensystemen eine deutlich größere Zoomstufe erfordern.

## Dateien

Geändert: `index.html`, `css/styles.css`, `src/app.js`, `src/data/layers.js`, `src/data/orbital-math.js`, `src/renderer/{camera.js,controls.js,index.js,labels.js,orbits.js,planet-view.js,renderer.js,scene.js}`, `package.json`, `sw.js`, `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`. Neu: `docs/DELTA-V41.md`, `tests/scale-v41.test.mjs`. Die bisherigen Tests mit festen v40-Versions- oder DOM-Annahmen wurden aktualisiert.

## Prüfung

**182/182** automatisierte Tests bestanden, einschließlich v41-Skalierung, UI und Nahzoom.

## Installation

**Sonnensystem-Delta-v41.zip** in das Verzeichnis einer vollständigen **v40-Installation** entpacken und die Dateien überschreiben; anschließend die Anwendung/PWA neu laden. Das Archiv enthält nur neue und geänderte Dateien, nicht das komplette Projekt.
