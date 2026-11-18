# Delta v60 – Layer-Kategorie kürzer beschriftet

Im Control Panel wird die Kategorie für transneptunische Objekte im **Layer-Dropdown** jetzt als **„Transnept. Objekte“** angezeigt. Die interne Kennung (`tno`), der vollständige Kategoriename **„Transneptunische Objekte“** in Katalog und Suche sowie das Filterverhalten bleiben unverändert. Der vollständig ausgeschriebene Kategoriename bleibt für Screenreader über `aria-label` zugänglich.

## Installation

`Sonnensystem-Delta-v60.zip` über einen vollständigen **v59**-Stand entpacken und vorhandene Dateien ersetzen. Projektversion `60.0.0`, Service-Worker-Cache `sonnensystem-shell-v60`.

## Prüfung

`npm run check` validiert den Katalog, die bestehenden Regressionstests und den neuen Test `tests/layer-label-v60.test.mjs`.
