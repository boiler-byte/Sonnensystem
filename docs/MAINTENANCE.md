# Projektpflege und Releases

## Prüfungen

`npm run check` führt Katalogprüfung und alle Verhaltenstests aus. Neue Regressionen gehören in einen passenden Feature-Test; Versionsnummern dürfen nur an einer Stelle geprüft werden: `tests/release-contract.test.mjs` liest die Paketversion und vergleicht sie dynamisch mit HTML-Metadaten, Service-Worker-Cache und dokumentiertem Release.

Vor Auslieferung zusätzlich prüfen: ES-Module auflösbar, Offline-Shell vollständig, lokale Daten und Quellen validiert, keine toten relativen Dokumentationslinks und Delta-Paket auf Basis des **veröffentlichten** vorherigen Releases reproduzierbar. Ein automatisierter Test ersetzt keine visuelle Prüfung der tatsächlichen Oberfläche.

## Änderung in v86

**Delta v85 → v86:** Die simulierte Bewegung eines Objekts relativ zu seinem Parent wird pro Frame unter einer unveränderten aktuellen Kameraprojektion in **CSS px/s** gemessen (`src/renderer/labels.js`). Die Schwellwerte **190 px/s ausblenden** und **135 px/s wieder anzeigen** verhindern unlesbare schnell umlaufende Labels ohne Kameraschwenks als Ursache zu werten. Pausierte Zeit, unrealistische manuelle Datumsprünge, Szenen-/Layouttransitionen und die Reihendarstellung lösen keine Ausblendung aus. Mittelpunktmarker kleiner Objekte sowie der Punkt und Ring einer Selektion bleiben bei ausgeblendetem Namen sichtbar. Im Sonnenüberblick werden auch bei aktiviertem **„Alle Monde“** höchstens vier direkte Begleiter-Labels je Planet/Zwergplanet angezeigt, nach Radius sortiert, natürliche Monde und Satelliten gemeinsam; bei Auswahl eines kleineren Objekts ersetzt es Rang vier. Der Filter gilt nicht in einer isolierten Planetenansicht und verändert keine 3D-Objekte. Der historische Export `solarMoonLabelIds()` bleibt erhalten. Neue Testfälle: `tests/smart-labels-v86.test.mjs`, aktualisierte v9-Regression; kein Eingriff in Katalog, Texturen oder API. Version `86.0.0`, Cache `sonnensystem-shell-v86`, **Basis v85.0.0**.

## Änderung in v85

**Delta v84 → v85:** `src/renderer/labels.js` entfernt die bisherige Bildschirmgeschwindigkeits-Hysterese vollständig, einschließlich `LABEL_MOTION`, `isTooFast`, Positionsbeobachtungen und der Filterbedingung für schnelle, nicht selektierte Objekte. Sichtbare Labels bleiben auch bei sehr schnellen Kamerabewegungen und Animationen ohne erneute Einblendverzögerung gezeichnet. Unverändert sind stabile Seitenanker, Viewport-Grenzen, die manuellen Label-/Layer-/Vier-Monde-Schalter, das Reihen-Hover-HUD, Kollisionsfreiheit sowie die Mittelpunkt-/Selektionsmarker aus v84. Neue Tests in `tests/label-speed-v85.test.mjs` sowie korrigierte Bewegungs-Regressionstests aus v9–v11 und v83. Version `85.0.0`, Offline-Cache `sonnensystem-shell-v85`, **Basis v84.0.0**. Katalog, Texturen und APIs bleiben unverändert.

## Änderung in v84

**Delta v83 → v84:** In `src/renderer/labels.js` entfällt der bisherige Punkt vor dem Labeltext. Stattdessen rendert die Beschriftung einen Mittelpunkt-Marker direkt im gelabelten Objekt, sobald dessen projizierter Radius kleiner als der Marker wäre. Der Marker verwendet die Kategoriefarbe aus `CATEGORY_COLORS`; für selektierte Objekte ist derselbe Marker immer sichtbar und nutzt die Selektionsfarbe `#e7b979`, unabhängig von der dargestellten Objektgröße. Der bestehende Selektionsring, die kollisionsfreie Label-Platzierung, Bewegungsfilter und Layer-/Vier-Monde-Regeln bleiben unverändert. Der neue Regressionstest `tests/label-markers-v84.test.mjs` sichert Kategorie-Marker, Wegfall des führenden Textpunkts und das immer sichtbare Selektionszentrum ab. Version `84.0.0`, Offline-Cache `sonnensystem-shell-v84`, **Basis v83.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v83

**Delta v82 → v83:** Der verbliebene Label-Dichtefilter in `src/renderer/labels.js` wird restlos entfernt (maximal zwei nicht ausgewählte Labels pro 160 × 110 CSS-Pixel, stabilisierte Rasterzellen, Dichte-Prioritätsauswahl). Damit werden auch bei voll überlappenden Beschriftungen sämtliche berechtigten Labels platziert. Die Priorität bestimmt nur noch die Zeichenreihenfolge; das ausgewählte Label liegt oben. Seitenanker, Viewport-Grenzen, Geschwindigkeitsfilter, manuelles Abschalten, Layer-/Vier-Monde-Steuerung und Reihen-HUD bleiben erhalten. Die früheren `tests/label-density-v16.test.mjs` und `tests/smart-labels-v9.test.mjs` wurden auf den neuen Sollzustand aktualisiert; `tests/label-collisions-v83.test.mjs` sichert dichtes Überlappen gegen Regressionen ab. Version `83.0.0`, Offline-Cache `sonnensystem-shell-v83`, **Basis v82.0.0**. Keine Änderungen an Katalog, Texturen oder APIs.

## Änderung in v82

**Delta v81 → v82:** Zwei monotone, AU-gestützte Szenenmaßstäbe ersetzen die bisherige Wurzelverteilung bei `Bahn aus` im Sonnenüberblick: gleichmäßige 2,25 Einheiten zwischen den acht schematischen Planetenbahnen; optimierte Abstände zwischen 19,5 und 67 Szeneneinheiten mit nach außen verschobenen inneren und verdichteten äußeren Orbits. Die Sonne wird in der optimierten Kombination **Objekt an / Bahn aus** exakt dreimal so groß wie in v81, ohne die bisherigen Planetengrößen und die separate Reihe/Cinema zu verändern. Live-/JPL-Vektoren erhalten denselben Halbachsenmaßstab wie die Keplerbahnen. Die Fälle `Bahn an`, lokale Planetenansicht und Reihenlayout bleiben unverändert. Ergänzt wurden `tests/scale-v82.test.mjs` sowie die v82-konformen Erwartungen älterer Maßstabs-Tests. Version `82.0.0`, Offline-Cache `sonnensystem-shell-v82`, **Basis v81.0.0**. Update enthält nur die modifizierten und neuen Dateien.

## Änderung in v81

**Delta v80 → v81:** Hover-Pfeilabstand unter dem Körper von 23 auf 69 CSS-Pixel verdreifacht; Spitze auf den nahen projizierten Parent-Außenrand versetzt, mit Clipping bei Eltern außerhalb des Viewports. Das HUD verzichtet auf die seitliche Objektanalysekarte, platziert den cyanfarbenen Namen oberhalb des Körpers und stellt unterhalb Gravitation links und Temperatur rechts ohne Labels mit `physicalStatIcon('gravity')` und `thermometerIcon('mean')` dar. Cinema erhält einen eigenen, vom Simulations-Play entkoppelten Pause-/Fortsetzen-Button; der Scanner erscheint während tatsächlich eingeschwungener Kamera-Haltephasen und nicht bei Übergang, Scrubbing oder Kameranachlauf. `tests/row-cinema-v81.test.mjs` sichert Geometrie, Layout, Icons und Wiedergabesteuerung ab; überholte v78–v80-DOM- und Pfeil-Erwartungen wurden an den aktuellen Sollzustand angepasst. Version `81.0.0`, Offline-Cache `sonnensystem-shell-v81`, **Basis v80.0.0**. Das Delta enthält ausschließlich geänderte und neue Dateien; der Katalog bleibt unverändert.

## Änderung in v80

**Delta v79 → v80:** Das Hover-HUD zeigt in `index.html` und `src/ui/row-inspection.js` den tatsächlichen Durchmesser im oberen Messrahmen statt des „Scan aktiv“-Textes. Der verbreiterte Rahmen und seine Pfeilspitzen werden per CSS animiert; das Textlabel vor dem Abstandswert entfällt. `src/renderer/row-inspection.js` führt die horizontale Parent-Markierung bis zur Bildschirmposition des Zentrums bzw. bis zum nächstgelegenen Rand (keine 300px-Grenze). Bei aktivem AR ruft die Fokussierung eines Katalogobjekts sowie der explizite Button „Planetenansicht“ die bestehende Methode `alignToPerspective()` auf. Dadurch bleibt die bestehende DeviceOrientation-Sitzung samt Permission erhalten. Tests: `tests/row-hover-ar-v80.test.mjs` und angepasste DOM-Fakes in den v78/v79-Regressionssuiten. Version `80.0.0`, Cache `sonnensystem-shell-v80`, Basis `79.0.0`.

## Änderung in v79

**Hotfix v78 → v79:** Das Pfeil-SVG in `src/ui/row-inspection.js` wurde beim ersten Rendern durch `hidden` unterdrückt; `.hidden = false` entfernte das Attribut am SVG nicht. Stattdessen wird das Attribut nun explizit gesetzt und entfernt. CSS kennzeichnet das eingeblendete SVG als Blockelement. Der neue Regressionstest `tests/row-inspection-svg-v79.test.mjs` modelliert diese unterschiedliche DOM-Semantik und stellt sicher, dass Sichtbar-/Unsichtbarschalten bei gültigen und fehlenden Entfernungswerten funktioniert. Versionsmetadaten und Offline-Cache auf v79 erhöht. Keine Änderung an den Katalogdaten, Layoutpositionen oder der Cinema-Logik.

## Änderung in v78

**Delta v77 → v78:** `src/renderer/row-inspection.js` kapselt WebGL-konforme Zeigerhitprüfung, die mindestens 160 px große Hover-Kugel, physikalische Messwertformatierung und Parent-Pfeilrichtung. `src/renderer/renderer.js` verwaltet Hover-Tween, Zeichengrößen und Ringproportionen; `src/renderer/controls.js` leitet nur echte Maus-/Stift-Hover-Koordinaten weiter. `src/ui/row-inspection.js` aktualisiert eine pointer-transparente SVG/HTML-Messebene im neuen `index.html`-Viewport mit Animationsstilen aus `css/styles.css`. Der v78-Test prüft Anvisieren, Umschalten/Verlassen, 160px-Grenze, echte Parent-Distanzen, G/°C-Formatierung und SVG-Pfeil. `src/app/animation-loop.js` synchronisiert die UI pro Renderframe; `sw.js` cached beide neuen Clientmodule unter `sonnensystem-shell-v78`. Der Objektkatalog bleibt identisch; Delta-Basis **v77.0.0**.

## Änderung in v77

**Delta v76 → v77:** `css/styles.css` begrenzt die Temperaturkachel auf eine normale Gridspalte und zeigt Min/Max ohne abgeschnittenes Zweispaltenlayout. `index.html` tauscht die Tab-Reihenfolge, `src/ui/event-handlers.js` passt die Home-/End-Navigation an. Die Reihenmodi in `src/app/animation-controls.js` verwalten jetzt Größe und Entfernung zusätzlich zum Aus-Zustand. `src/renderer/renderer.js` filtert beim Reihenrendern auf das aktuelle Zentrum und seine direkten Kinder mit positivem bekanntem Radius; `src/renderer/transitions.js` sortiert bei Entfernung nach mittlerer Parent-Distanz. In Cinema bleibt die Entfernungsreihe räumlich unverändert, während die bisherige kleine-zu-große Größenrunde erhalten bleibt. `rowGeometry()` schließt unbekannte Größen aus, daher gibt es keine Cinema-Leerstopps. Rückwärtskompatibles Katalogschema; Release `77.0.0`, Cache `sonnensystem-shell-v77`, Basis `76.0.0`. Neue v77-Regressionstests decken die Reihenfolge, Kamera und Details ab.

## Änderung in v76

**Delta v75 → v76**: Reine Darstellung der Temperaturkachel im Daten-Tab. Die schwarze, halb gefüllte Mittelwert-Thermometerform verzichtet auf den bisher hellen Hintergrund; eine helle Kontur hält sie auf dunklen Karten sichtbar. `src/ui/object-details.js` blendet nicht vorhandene Min.-/Max.-Zeilen aus und gruppiert die vorhandenen rechts vom Mittelwert. `css/styles.css` richtet diese Werte in einer kompakten vertikalen Spalte aus, einheitlich auf Desktop und im Mobile-Sheet. Kein Eingriff in Berechnung, Datenschema oder Katalogwerte. Regressionstests unter `tests/object-temperature-v76.test.mjs` und angepasste Styling-Erwartung in der v74-Testsuite. Release `76.0.0`, Cache `sonnensystem-shell-v76`, Basis `75.0.0`.

## Änderung in v75

**Delta v74 → v75**: Anpassung der Entfernungssortierung und der rechten Maßeinheit im Katalog, ausschließlich in `src/ui/object-list.js`. Die interne Sortierskala bleibt AE, angezeigte Entfernungen bis einschließlich `0,2 AE` werden in km formatiert. Monde übernehmen bei leerer Suche und **inaktivem** Planetenfilter die Entfernung ihres direkten Elternkörpers sowohl für die Sortierung als auch die Katalogzeile. Mit Suchtext oder aktivem Planetenfilter verwenden sie ihren eigenen Orbitabstand. Sonnenübersicht: der Planetenfilter gilt trotz gespeicherter Toggle-Einstellung als inaktiv. Fehlende Messwerte bleiben `—`; Katalogdaten, -schema und Objektdetails unverändert. Tests: angepasste v73-Sortiertests und `tests/catalog-distance-v75.test.mjs`; Release `75.0.0`, Cache `sonnensystem-shell-v75`, Basis `74.0.0`.

## Änderung in v74

**Delta v73 → v74**: UI-only-Änderung ohne Katalogmigration. Im `Daten`-Tab stehen die verwandten Objekte zuerst. Der `related-overflow` ist ein Button; er ruft eine vom `catalog-controller` bereitgestellte Navigation auf, um den aktuellen Elternobjektnamen in die Suche zu schreiben und die Katalogansicht auf Desktop/Mobil zu aktivieren. Der parent-sensitive Suchindex liefert die betreffenden Kinder. SVG-Messicons und drei Thermometerfüllstände liegen in `src/ui/physical-stat-icons.js`; in `src/ui/object-details.js` werden sie zusammen mit den Werten in einer konsistenten Kachelstruktur gerendert. G-Umrechnung erfolgt **ausschließlich für die Anzeige** über `displaySurfaceGravity`, Datenbasis bleibt m/s². Neue v74-Regressionstests prüfen SVGs, Temperatur, Einheiten, Related-Button und Tab-Navigation. `sw.js` precacht das neue Icon-Modul und verwendet `sonnensystem-shell-v74`. Zielrelease `74.0.0`; Basis `73.0.0`.

## Änderung in v73

**Delta v72 → v73**: Sortierbutton anstelle der Katalogüberschrift: Standard (alte Featured-Reihenfolge bzw. Suchrelevanz), Entfernung aufsteigend und Größe absteigend. Entfernung = mittlere Parent-Distanz, nach AE umgerechnet; Größe = Durchmesser in km, abgeleitet aus Katalogradius. Fehlende, ungültige und 0-Placeholder-Werte bleiben als `—` erkennbar und werden ans Ende sortiert. Rechts am Eintrag erscheint die aktive Maßeinheit. Die Steuerung liegt in `src/ui/object-list.js`, `src/ui/event-handlers.js`, `src/app/state.js` und `index.html`, mit gemeinsamen CSS für Desktop und Mobile-Sheet. Der Planetenfilter ist beim erfolgreichen Öffnen eines Planeten-/Zwergplanetensystems aktiviert, bleibt aber ausschaltbar. Katalogschema und -inhalte unverändert: `10.1.0` / Schema `1`; Release `73.0.0`, Cache `sonnensystem-shell-v73`. Delta-Archiv enthält nur die Unterschiede gegenüber dem veröffentlichten v72-Stand (v71 + Delta v72).

## Änderung in v72

**Delta v71 → v72**: 39-%-Snap für `mobile-sheet`, dynamisches Rezentrieren anhand des real sichtbaren Canvas-Ausschnitts in allen Kamerazuständen (einschließlich Drag-Gesten). Bei geschlossener Kopfzeile ist das Offset null; bei geöffnetem Sheet folgt es der tatsächlichen Bildschirmgeometrie. Physikalische Katalogfelder (optionale Temperatur-Min./Max./Mittel-K, Druck-Pa, Gravitation m/s² und mittlere Parent-Distanz) sind validiert und im Daten-Tab sichtbar; unbekannte Daten werden nicht gefüllt. Modell-Abstände folgen den Bahnelementen auch nach Live-Updates. NASA/NSSDCA-Beispieldaten betreffen 12 Objekte. `catalogVersion: 10.1.0`, Release `72.0.0`, PWA `sonnensystem-shell-v72`; Delta-Archiv enthält ausschließlich neue bzw. geänderte Dateien relativ zum veröffentlichten v71-Archiv.

## Änderung in v71

Nur das **vertikale Zwei-Finger-Umschauen** in der freien Perspektive (`selectedId === null`) wird in `src/renderer/controls.js` gedreht: Wischen nach unten richtet den Blick nach oben. Rechtsklick-Umschauen, Objektorbit, horizontale Gesten und Pinch-Zoom bleiben unverändert. Im **AR-Modus** ist der Sensor-Pitch wieder wie in v69 nicht invertiert (`src/renderer/ar-mode.js`). Die sieben neuen Verhaltenstests in `tests/look-directions-v71.test.mjs` prüfen freie Gesten, unveränderte Nachbarfunktionen und die AR-Neigung in allen vier Bildschirmausrichtungen. Das vollständige v71-Paket verwendet `sonnensystem-shell-v71`.

## Änderung in v70 (historisch; AR-Inversion in v71 zurückgenommen)

Der Button **Kamera zurücksetzen** führt den Perspektivwechsel als 1.050-ms-Kamerafahrt aus (Blickrichtung, Kamerastandort und Zoom). Die reine Kamerafahrt ist von Szene-/Layouttransitions getrennt; erneute Wechsel übernehmen die sichtbare Zwischenpose und manuelle Eingaben beenden die Fahrt. In AR bleibt der Bewegungssensor erhalten, darf jedoch während des Flugs nicht die Kamerabasis überschreiben. Zusätzlich wurde die **vertikale AR-Sensorblickrichtung** für Hoch- und Querformat invertiert. Tests dazu: `tests/camera-flight-ar-v70.test.mjs`. Das vollständige v70-Paket verwendet `sonnensystem-shell-v70`.

## Änderung in v69

Die Bedienung des Kamera-Buttons zeigt nun über vier SVGs die **aktuelle Kamerarichtung** statt des nächsten Perspektiv-Icons: freie Kamera / Rückkehr zur Übersicht frontal, Schräg/oben schräg nach unten, Topdown nach unten, Seitlich nach links. Der Perspektivwechsel und die nächste Aktion in der `aria-label`-Beschriftung bleiben unverändert. Das vollständige Projekt kann aus dem v69-Archiv installiert werden; `sw.js` verwendet `sonnensystem-shell-v69`, damit die neue Oberfläche auch als PWA aktualisiert wird.

## Dokumentationsordnung seit v68

| Datei | Inhalt |
|---|---|
| `README.md` | Einrichten, Funktionen, aktuelle Projektstruktur |
| `docs/ARCHITECTURE.md` | Gültige Modulgrenzen und Laufzeit |
| `docs/DATA-ARCHITECTURE.md` | Datenmodell, Quellen, Grenzen |
| `docs/HILFE.md` | Aktuelle Bedienung |
| `docs/TEXTURE-SOURCES.md` | Bild- und Quellenhinweise |
| `docs/RELEASE-HISTORY.md` | Vollständige historische Delta-Notizen für v2–v67 und v6.1 |

Die 66 Einzeldateien `docs/DELTA-V2.md` bis `docs/DELTA-V67.md` und `docs/HOTFIX-V6.1.md` wurden nach vollständiger Übernahme in `RELEASE-HISTORY.md` entfernt. Alte Versionsabschnitte aus README, Hilfe und Architektur wurden durch gegenwartsbezogene Anleitungen ersetzt. Funktionstests aus frühen Versionen bleiben erhalten, soweit sie noch relevantes Verhalten überprüfen. Vier Testdateien wurden unter neuen, versionsneutralen Namen beibehalten: `modular-v64` → `module-boundaries`, `dedup-v65` → `shared-logic`, `performance-v66` → `render-performance`, `css-cleanup-v67` → `styles-regression` (jeweils mit `.test.mjs`).

## Sicheres Delta-Update v67 → v68

1. `Sonnensystem-Delta-v68.zip` im Projektroot von v67 entpacken und überschreiben.
2. Im Projektroot `node apply-v68.mjs` ausführen. Nur die **71 bekannten veralteten Dateipfade** (67 Dokumente und vier umbenannte Tests) werden bei unverändertem SHA-256-Inhalt gelöscht. Abweichende oder bearbeitete Dateien bleiben bestehen; der Updater meldet sie und kann erneut aufgerufen werden. Nach erfolgreicher Bereinigung entfernt sich die einmalige Update-Datei selbst.
3. `npm run check` ausführen, App neu laden und den aktualisierten PWA-Cache `sonnensystem-shell-v68` aktivieren.

**Hinweis:** Entpacken allein kann bestehende Dateien nicht löschen; daher gehört der zweite Schritt zu diesem Delta. Für komplette Neuinstallationen wird ein bereinigtes vollständiges v68-Projektpaket bereitgestellt.
