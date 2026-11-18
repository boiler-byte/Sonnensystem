# Delta v48 – AR-Modus / Bewegungsgeste zum Umsehen

## Installation

`Sonnensystem-Delta-v48.zip` über eine **vollständige v47-Version** im Projektstamm entpacken; vorhandene Dateien ersetzen. Nach dem Aktualisieren der Webseite/PWA ist die Version **48.0.0** aktiv (Cache `sonnensystem-shell-v48`). Das Archiv enthält nur neue oder geänderte Dateien gegenüber v47.

## Steuerung

- **Links im Control Panel:** Neuer SVG-Button mit Fadenkreuz/AR-Symbol. Er wird nur eingeblendet, wenn ein sicheres Browserfenster, eine Geräteausrichtungs-API und ein grobes Touch-Eingabeprofil auf einem mobilen Bildschirm vorhanden sind. Ohne diese Merkmale bleibt das ursprüngliche Control Panel mit drei Menüs erhalten. Startwert **Aus**.
- **Ein:** Tippen aktiviert die sensorbasierte Steuerung. Auf iOS und einigen Browsern wird die Motion-Berechtigung **erst innerhalb des Tipps** angefragt. Nach der ersten gültigen Sensorprobe wird die Blickrichtung kalibriert und der Button aktiv. Anschließend lenkt die reale Gerätebewegung die Blickrichtung in der 3D-Szene (Gier, Nick, Roll). Die Augenposition wird nicht um den selektierten Körper bewegt – man schaut vom aktuellen Standpunkt aus herum.
- **Aus:** Erneut tippen. Sensorlistener werden abgemeldet; letzte Blickrichtung wird in die Standard-Kamera zurückübertragen. Ein-Finger-Pan, Zwei-Finger-Umsehen/Pinch-Zoom und die Desktopsteuerung bleiben weiterhin vorhanden.
- **Fehlerfälle:** Bei verweigerter Berechtigung, fehlenden Sensorwerten oder Verlassen des Vordergrunds erfolgt keine weitere Sensorverarbeitung. Eine Snackbar nennt den aktuellen Status oder Fehler. Es wird **kein Kamerabild** angefordert und werden **keine Sensordaten** verschickt. Der AR-Blickmodus ist daher keine Kamera-Overlay-Augmented-Reality-Funktion.
- **Layout:** Der Zusatzbutton wird ausschließlich bei Unterstützung ganz links eingefügt. Die drei vorhandenen Dropdowns sind unabhängig davon weiterhin rechtsbündig am Bildschirmrand befestigt.

## Prüfung

Automatisierte Regressionen und neue Tests für Sensorverfügbarkeit, Berechtigungen, Kalibrierung, Quaternion-Drehung, Projektion und Ressourcensäuberung. Das ZIP wird als Overlay über der v47-Installation geprüft.
