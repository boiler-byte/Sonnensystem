# Delta v2 – Sonnensystem

Ersetzt die bisherige App-Bezeichnung „ORBITAL“ durch **Sonnensystem**, entfernt die drei Texte
„Live-Rendering / 3D Szene“, „Das Sonnensystem.“ und „Eine Reise durch Raum und Zeit“
aus der sichtbaren 3D-Ansicht und ergänzt die PWA-Funktionen sowie das mobile Bottom Sheet.

## Installation des Delta-ZIPs

1. Das ursprüngliche ZIP `ORBITAL-WebGL-App.zip` entpacken, falls noch nicht geschehen.
2. Den Inhalt dieses Delta-ZIPs **über den Ordner `helio-webgl/`** kopieren und die vorhandenen Dateien ersetzen.
3. Im Ordner `helio-webgl/` `node server.mjs` aufrufen.
4. `http://localhost:4173` öffnen und bei einem zuvor installierten App-Stand neu laden.

Das Delta enthält nur geänderte oder hinzugefügte Dateien. Die unveränderten Module
`renderer.js`, `data.js`, `test.mjs`, `.env.example` und `.gitignore` verbleiben aus v1.
Keine weiteren Dependencies. Für PWA-Installation außerhalb von localhost ist HTTPS erforderlich.

## Änderungen

- Name, HTML-Metadaten, App-Icon und Serverkennung aktualisiert
- Bisheriger Szenentitel entfernt (semantische Überschrift bleibt für Screenreader erhalten)
- Mobile Menüs unter 770 px als gemeinsames Bottom Sheet mit drei Reitern, Griff, Swipe- und Snap-Zuständen
- Mobile Menüs beim Start eingeklappt; Auswahl öffnet Details, Zeitsteuerung wird im Sheet angezeigt
- Manifest, Service Worker, PNG-Icons und Offline-Fallback für den integrierten Katalog
- Server liefert neue PWA-Dateien mit geeigneten MIME-Typen aus; API-Cache bleibt unverändert
