# Delta v24 – unabhängiger Objektkatalog und erweiterte Suche

**Basis:** v23. Delta-Update direkt über eine installierte v23-Installation im Workspace-Root entpacken. Die Objekt- und Renderdaten sind unverändert; das Paket enthält ausschließlich geänderte oder neue Dateien.

## Objektkatalog

- Der **gesamte geladene Objektbestand** erscheint unabhängig davon, welche Layer der aktiven 3D-Ansicht eingeschaltet sind. Die Layer-Einstellungen betreffen weiterhin nur den WebGL-Renderer (Körper, Bahnen, Labels, Picking).
- Die Auswahl eines Katalogobjekts bleibt bestehen, wenn seine Renderer-Kategorie ausgeblendet wird. Ein so verborgenes Objekt kann im Katalog und in den Details angesehen werden, ist aber nicht zwangsläufig in der 3D-Ansicht sichtbar oder anklickbar.
- In der **Planetenansicht** steht rechts neben dem Suchfeld ein kompakter **SVG-Planetensymbol-Toggle**, ohne sichtbaren Text. Der Schalter besitzt einen zugänglichen Namen und `aria-pressed`, startet auf **Aus** und filtert bei Aktivierung auf den aktuellen Zentralplaneten sowie über `parentId` zugeordnete Objekte, bei Bedarf auch indirekte Nachfahren. Die Wahl gilt für den Katalog und ändert keine Layer.
- Beim Wechsel zu einem anderen Planeten bezieht sich eine aktive Einschränkung automatisch auf den neuen Planeten. In der Sonnensystemansicht ist der Button verborgen und der gesamte Katalog sichtbar. Der letzte Katalogfilterzustand bleibt für die nächste Planetenansicht erhalten.
- Das Suchfeld und der Toggle werden als eine Zeile angeordnet. Die mobile Ansicht verwendet das vorhandene Katalog-Element im Bottom-Sheet, daher ist kein doppeltes Element nötig.

## Erweiterte Suche

- Die Suchanfrage wird akzent- und groß/kleinschreibungsunabhängig normalisiert und an Leerzeichen in Suchwörter zerlegt. **Jedes Wort** muss in **mindestens einem** Suchfeld vorkommen (UND). Suchfelder: Objektname, ID, Katalogfeld, Kategorie in Singular/Plural, Elternname/-ID.
- `uranus c` findet im vorhandenen lokalen Katalog die **neun Uranus-Monde** mit „c“ im Namen: Puck, Cordelia, Bianca, Cressida, Cupid, Caliban, Sycorax, Trinculo und Francisco. Auch `c uranus` funktioniert.
- Suche und Planetentoggle können gemeinsam benutzt werden; **Renderer-Layer schränken die Ergebnisse niemals ein**.

## Umsetzung und Prüfung

- `src/ui/object-list.js`: von Render-Layern unabhängige Listenauswahl, optionaler Planetenbezug, wortweise Suche.
- `src/app.js`: separater Katalogfilterzustand, Toolbar-Synchronisierung bei Ansichtswechsel, keine Aufhebung der Katalogauswahl durch Render-Layer.
- `index.html`, `css/styles.css`: responsiver Suchbereich mit reinem SVG-Icon-Button, sichtbarem Aktivzustand und zugänglicher Beschriftung.
- `README.md`, `docs/HILFE.md`, `docs/ARCHITECTURE.md`: Dokumentation aktualisiert.
- `package.json`, `sw.js`: Versionsstand v24 und Offline-Cache `sonnensystem-shell-v24`.
- `tests/catalog-search-v24.test.mjs` und angepasste Bestandsprüfungen: Katalogunabhängigkeit, Planetenselektion, Wortsuche und UI-Anbindung.

```bash
npm run check
```
