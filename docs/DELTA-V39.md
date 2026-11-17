# Delta v39 – Folgen öffnet das übergeordnete Planetensystem

## Änderungen gegenüber v38

- Beim **Einschalten** von **Folgen** für ein Objekt mit direktem Parent vom Typ `planet` oder `dwarf` wird automatisch dessen isolierte Planetenansicht geöffnet (z. B. Mond → Erde, Charon → Pluto, ISS → Erde).
- Die **Auswahl bleibt beim Kindobjekt**; die Kamera verfolgt dieses Kind und nicht den übergeordneten Planeten.
- Ist bereits die Planetenansicht des richtigen Parents geöffnet, erfolgt kein redundanter Szenenwechsel.
- Der Szenenwechsel erfolgt nur beim **Einschalten** von Folgen. Ein erneuter Klick schaltet den globalen Toggle aus und belässt die aktuelle Szene.
- Bei Objekten ohne direkten (Zwerg-)Planeten als Parent wird Folgen wie bisher aktiviert, ohne eine Planetenansicht zu öffnen.
- Beim Szenenwechsel werden Kontrollpanel, Layer und Zeitsteuerung über `updateMode()` mit der Planetenansicht synchronisiert. Bestehende Abbruchregeln für aktives Folgen (Kameraschwenk und zu schnelle Bewegung), Zoom, Perspektivwechsel sowie der globale Toggle bleiben erhalten.
- Versionswechsel auf **39.0.0** und PWA-Cache `sonnensystem-shell-v39`.

## Installation

Das Delta über eine bestehende v38-Installation entpacken, vorhandene Dateien ersetzen und die Anwendung neu laden.
