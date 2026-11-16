# Texturen v12: nur lokale Dateien

Der frühere externe v11-Texturproxy und alle direkten Fremdhostzugriffe wurden entfernt. Die Anwendung liest Dateien ausschließlich unter `/textures/standard/` vom eigenen HTTP-Server. Gültige Dateiendungen: `.jpg`, `.jpeg`, `.png`, `.webp`. Typische Namen: `earth.jpg`, `mars.jpg`, `moon.jpg`, `titan.webp`. Ein Teil der Solar System Scope-Quelldateinamen wird als Alias akzeptiert, z. B. `2k_earth_daymap.jpg`.

Die Bildrechte und Urhebernennung hängen von den selbst bereitgestellten Texturen ab. Die App kann diese Angaben für lokale Dateien nicht automatisch ermitteln; ihre Herkunft ist vom Betreiber zu dokumentieren.

**Achtung:** Dieser Ordner enthält keinen automatisch heruntergeladenen Bildbestand. **Mobiler Modus 512px**, **Sonnensystem 2K**, **Planetenansicht 4K** sind Obergrenzen für die GPU-Aufbereitung, keine Zusicherung der Quelle.
