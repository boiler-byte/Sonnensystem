# Delta v29 – Beleuchtung und vier größte Monde

## Änderungen gegenüber v28

- **Control-Panel:** Im Objektlayer-Dropdown stehen unter **Beschriftung** zwei neue Toggle-Buttons. **Beleuchtung** wechselt zwischen **Optimiert** und **Realistisch**, **4 Monde** zwischen **An** und **Aus**. Status und `aria-pressed` synchronisieren bei jedem Wechsel der Szene.
- **Beleuchtung:** Der Fragment-Shader verwendet in der Einstellung **Realistisch** unverändert die bisherige Beleuchtungsrechnung (`.13 + .89 * diffuse`, auf `.08 ... 1.0` begrenzt). **Optimiert** erhöht die Umgebungshelligkeit der dunklen Planetenseite auf mindestens 50 %, ohne das beleuchtete Maximum zu erhöhen. Die Sonne bleibt selbstleuchtend; lokale Texturen und prozedurale Oberflächen verwenden denselben Beleuchtungsmodus.
- **Voreinstellungen:** Beide Ansichten starten mit **Beleuchtung = Optimiert**. Der Schalter **4 Monde** steht in der Sonnensystemübersicht zunächst auf **An**, in der Planetenansicht auf **Aus**. Werte sind pro Ansicht unabhängig und bleiben beim Wechsel gespeichert.
- **4 Monde:** Der Renderer ermittelt nach jedem Katalogupdate die vier natürlichen Monde mit dem größten `radiusKm` **je übergeordnetem Planeten oder Zwergplaneten**. Ein aktiver Filter begrenzt **Körper, Klickziele, Beschriftungen und (in der Planetenansicht) deren Umlaufbahnen**. Ausgeblendete Monde bleiben im Katalog und in den Detaildaten; ihre Auswahl setzt die Filterung nicht außer Kraft. Bei deaktiviertem Filter zeigt ein aktivierter Mond-Layer alle vorhandenen Monde.
- **Layer-Kompatibilität:** Der normale Mond-Layer bleibt eine eigene Voraussetzung. **4 Monde = An** aktiviert die Monde nicht eigenständig. Das voreingestellte Sonnensystem-Layerpreset **Sterne + Planeten** und das Planeten-Layerpreset **Planeten + Monde + Satelliten** bleiben unverändert. Künstliche Satelliten zählen nicht als Monde.
- **PWA/Version:** Anwendung `29.0.0`, Cache `sonnensystem-shell-v29`. Das Layer-Menü ist für längere Zustandsbeschriftungen leicht verbreitert und bleibt scrollfähig.

## Aktualisierung

Delta v29 über eine **vollständige v28-Installation** entpacken; bestehende Dateien überschreiben. In diesem Delta sind nur seit v28 neue oder geänderte Dateien enthalten. Der lokale Katalog benötigt keine Datenmigration. Im Browser die PWA neu laden bzw. die installierte App aktualisieren, damit der neue Service-Worker-Cache aktiv wird.

## Testabdeckung

`npm run check` prüft Katalogvalidierung, bestehende Regressionstests und neue Tests für Beleuchtungs- und Mondschalter, die sichtbaren Körper, Umlaufbahnen und Ansichtsvoreinstellungen.
