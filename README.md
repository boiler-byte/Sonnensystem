# Sonnensystem – interaktiver 3D-Atlas v33.0

**Aktueller Stand v33.** Der runde Kamera-Reset mit Pfeilen nach außen sitzt **unten rechts** in der 3D-Ansicht und weicht mobil dem geöffneten Sheet nach oben aus. Das rahmenlose Control-Panel oben rechts ist **58 px** breit. Seine Dropdown-Auslöser für Layer und Zeit enthalten keine Pfeilindikatoren; das Layer-Menü ist seit v31 **166 px**, das Zeitmenü **116 px** breit. Die bestehenden Ansichts- und Objektfunktionen bleiben erhalten.

## Mobiles Sheet mit Verlauf-Zurück schließen (v33)

- Beim Öffnen des mobilen Sheets wird **genau ein temporärer Eintrag im Browser-Verlauf** angelegt, ohne die URL zu ändern. **Zurück** (Browser, Android oder PWA) schließt das halb oder vollständig geöffnete Sheet und bleibt auf der Sonnensystemseite.
- Tabs und die drei Sheet-Positionen erzeugen keine zusätzlichen Verlaufseinträge.
- Schließen per Sheet-Header, Wischgeste, Bildschirmabdeckung, Escape oder Kamera-Button entfernt auch den temporären Verlaufseintrag. **Vorwärts** kann das Sheet nach einem Zurück erneut öffnen.
- Beim Wechsel zur Desktopansicht wird ein offenes mobiles Sheet ebenfalls geschlossen und sein temporärer Verlaufseintrag entfernt.

Details: [Delta v33](docs/DELTA-V33.md).

## Katalog: Kategoriepunkt und Objektfarben (v32)

- Vor dem Objektnamen steht ein **vertikal zentrierter, 7 px großer Kategoriepunkt**. Seine Farbe entspricht der Objektkategorie (dieselbe Farbpalette wie für die Layer).
- Das runde Objektsymbol links verwendet wieder die **individuelle Objektfarbe aus dem Katalog** statt die Kategorie-Farbe. Für Objekte ohne gültige Objektfarbe gilt ein neutraler, blaugrauer Ersatzwert.
- Die Änderung gilt gleichermaßen für den Desktop-Katalog und den mobilen Katalog im Bottom-Sheet. Namen werden weiterhin bei Platzmangel mit Auslassungspunkten gekürzt; der Kategoriepunkt bleibt sichtbar.

Details: [Delta v32](docs/DELTA-V32.md).

## Layer-Dropdown und mobiler Objektfokus (v31)

- Das **Layer-Popover ist 166 px breit** (bisher 188 px), sowohl am Desktop als auch mobil.
- Bei der **Auswahl eines Objekts aus dem mobilen Katalog** fokussiert die Kamera den Mittelpunkt des sichtbaren 3D-Bereichs **oberhalb des halb geöffneten Bottom-Sheets** statt die verdeckte Mitte der gesamten Canvas. Die freie Fläche wird anhand der tatsächlichen Sheet-Kante bestimmt, auch bei Animation, Drag und Änderung der Fensterhöhe. Die Kamera verwendet dafür eine angepasste Perspektivprojektion; Zoom-Entfernung und 3D-Position des ausgewählten Objekts bleiben erhalten.
- Bei geschlossenem Sheet, auf dem Desktop und nach manueller Kamerabewegung gilt die normale Bildmitte. Das Zurücksetzen und der Perspektivwechsel funktionieren wie zuvor.

Details: [Delta v31](docs/DELTA-V31.md).

## Objektdetails und mobiler Kamera-Button (v30)

- Der Bereich **„Objekt hinzufügen“** samt NASA-Suchformular unter dem Objektkatalog ist in der Desktop-Seitenleiste und im mobilen Sheet entfernt. Die reguläre Katalogsuche bleibt erhalten. Bereits vorhandene Asteroiden können weiterhin beim Auswählen durch JPL SBDB aktualisiert werden.
- Mobil steht der runde **Kamera-zurücksetzen**-Button **12 px (mindestens) oberhalb der jeweils sichtbaren Sheet-Kante**, sowohl bei geschlossenem als auch halb geöffnetem Sheet. Beim Hoch- und Runterziehen folgt der Button der Kante, und beim Einrasten animieren beide synchron. Bei voll geöffnetem Sheet liegt der Button außerhalb des sichtbaren Szenenbereichs und ist nicht fokussierbar. Desktop bleibt unverändert.

Details: [Delta v30](docs/DELTA-V30.md).

## Beleuchtung und „4 Monde“ (v29)

Im Layer-Dropdown befinden sich direkt unter **Beschriftung** zwei zusätzliche Toggles:

- **Beleuchtung:** **Optimiert** ist der neue Standard in beiden Ansichten (hellere unbeleuchtete Planetenseite). **Realistisch** bewahrt die bisherige v28-Beleuchtung unverändert. Die Sonne bleibt in beiden Modi selbstleuchtend.
- **4 Monde:** zeigt höchstens die **vier größten natürlichen Monde pro Planet bzw. Zwergplanet** anhand des Katalogradius. Der Schalter ist in der Sonnensystemansicht standardmäßig **An**, in der isolierten Planetenansicht standardmäßig **Aus**. Bei „Aus“ werden alle Monde des aktivierten Mond-Layers gezeigt. Die Auswahl gilt auch für Objektkörper, Mond-Umlaufbahnen in der Planetenansicht, Anklickbarkeit und Labels. Katalogeinträge bleiben vollständig erhalten. Ein ausgeschalteter Mond-Layer bleibt durch „4 Monde“ ausgeschaltet.

Die Beleuchtungs- und Mond-Einstellungen werden wie die anderen Ansichtsoptionen getrennt pro Szenentyp beibehalten. Details: [Delta v29](docs/DELTA-V29.md).

## Kamera-Perspektiven (v28)

Der Kamera-Button unten rechts zeigt jetzt vier nach außen weisende Pfeile. Bei unveränderter Ansicht schaltet er zyklisch zwischen **Schräg/oben** (Standard), **Von der Seite** und **Draufsicht**. Nach manuellem Drehen, Verschieben oder Zoomen führt der nächste Klick zuerst zurück zur **Schräg/oben**-Übersicht; erst danach wird weitergeschaltet. In einer isolierten Planetenansicht führt der Button zunächst wie bisher zur Sonnensystem-Übersicht.

## Details-Navigation und mobiles Sheet (v27)

Der Index im Kopf der **Objektdetails** hat jetzt zwei Pfeiltasten: vorheriges und nächstes Objekt **derselben Kategorie**. Die Auswahl springt am Ende wieder zum Anfang (und umgekehrt). Bei nur einem Objekt oder ohne Auswahl sind die Tasten deaktiviert; beim Wechsel werden Details und Szenenauswahl aktualisiert.

Mobil entfällt der separate Sheet-Griff. Der **gesamte Header** mit den zwei Tabs lässt sich nach oben bzw. unten ziehen. Die Tabs bleiben einzeln auswählbar; ein Tipp in den freien Headerbereich oder Eingabe/Leertaste bei fokussiertem Header wechselt den Öffnungszustand. Das Sheet nimmt im halb geöffneten Zustand jetzt wirklich nur seine sichtbare Höhe ein; dadurch können Katalog und Details **bis ganz unten gescrollt** werden.

Die Zwergplaneten- und Mondfunktionen von v26 bleiben erhalten. Anleitung: [docs/HILFE.md](docs/HILFE.md), Änderungen: [Delta v27](docs/DELTA-V27.md).

## Starten

1. **Zuerst das vollständige v8-ZIP** direkt ins Workspace-Root entpacken; danach **Delta v9.1, v10, v11, v12, v13, v14, v15, v16, v17, v18, v19, v20, v21, v22, v23, v24, v25, v26, v27, v28, v29, v30, v31, v32 und v33 in dieser Reihenfolge** in dasselbe Verzeichnis überlagern und vorhandene Dateien ersetzen. `index.html`, `sw.js`, `package.json`, `data/`, `src/`, `server/` müssen dort liegen. Keinen `public/`-Ordner erstellen.
2. Node.js 20+ verwenden. Zusätzliche npm-Pakete sind nicht erforderlich.
3. `npm start` im Workspace-Root aufrufen und `http://localhost:4173` öffnen.
4. Die Anwendung kann auch von einem einfachen statischen Workspace-HTTP-Server geladen werden; dann fehlen die optionalen Live-API-Funktionen.

```bash
npm start           # HTTP-Server und optionale NASA/andere Proxies
npm run check       # Datenvalidierung und Regressionstests
npm run check:data  # Struktur, IDs, Querverweise und Quellenlinks
```

## Objekt-Auswahl und Labels (v11)

Ein kurzer Klick/Tipp **auf einen Himmelskörper** wählt ihn aus. Ein kurzer Klick/Tipp **in den freien 3D-Hintergrund** hebt die Auswahl auf, ohne die Kamera oder die aktuelle Ansicht zurückzusetzen. Der Tab „Details“ zeigt danach den neutralen Zustand. Zieh-/Dreh- und Zwei-Finger-Gesten lösen keine Abwahl aus.

**Das Label eines ausgewählten Objekts bleibt sichtbar**, auch wenn Satelliten vorbeifliegen, eine Kollision mit anderen Beschriftungen entsteht oder die Kamera kurz schnell schwenkt. Seine letzte passende Seite bleibt möglichst erhalten; andere Labels haben niedrigere Priorität. Nur ein manuelles Abschalten aller Labels oder ein nicht mehr projizierbares Objekt unterbindet die Beschriftung.

## Oberflächentexturen (v12, lokal)

Die App liest **ausschließlich lokale Bilder** aus `textures/standard/`, z. B. `earth.jpg`, `moon.png`, `titan.webp` oder vorhandene 2K-Quelldateinamen wie `2k_earth_daymap.jpg`. Gültige Formate: JPG, JPEG, PNG und WebP. JPEG ist nicht vorgeschrieben. Dateinamen verwenden die Objekt-ID aus dem Katalog; einige bekannte 2K-Aliasnamen werden ebenfalls erkannt. Die Bilder müssen vom Betreiber selbst in diesen Ordner gelegt werden; sie werden **nicht** ins Delta-ZIP gepackt. Fehlende Texturen fallen auf den bestehenden schematischen Shader zurück.

Es gibt **keinen externen Textur-Download, kein CORS-Fallback und keinen Texturproxy** mehr. Die maximalen GPU-Auflösungen sind 2048 px (Sonnensystem), 4096 px (Planetenansicht) und 512 px (Mobil). Kleinere Quelldateien werden nicht hochgerechnet.

## Raumsonden (v12)

Neue Layer-Kategorie „Raumsonden“ mit **Voyager 1, Voyager 2, Pioneer 10, Pioneer 11, New Horizons, Cassini, Galileo und Huygens**. In der Liste und Detailansicht erscheinen belegte Startdaten, Ziele, Missionsstatus und NASA-Quellenlinks. **Keine schematischen 3D-Positionen:** Interplanetare und interstellare Bahnen werden ohne echte Ephemeriden nicht als künstliche Kreisbahnen dargestellt. Diese Kategorie enthält daher Missionsinformationen, keine live berechneten Ortsdaten.

## Smarte Labels (v16)

In beiden Ansichten werden Beschriftungen nach Bedeutung sortiert. **Statt Überlagerungskollisionen auszuwerten, begrenzt v16 die Anzahl der normalen Labels je Bildschirmfeld von 160 × 110 CSS-Pixeln auf zwei.** Labelüberlappungen sind daher bewusst möglich. Die wichtigste Beschriftung gewinnt; zuvor sichtbare Labels erhalten einen kleinen Prioritätsbonus. Eine 18-Pixel-Randzone um ein zuvor zugewiesenes Feld verhindert Flackern beim Überschreiten der Feldgrenze.

**Ausgewählte Objekte sind vom Dichtelimit ausgenommen** und bleiben beschriftet. Labels behalten ihre Ankerseite und wechseln diese nur, wenn die Beschriftung sonst den sichtbaren Bildschirm verlassen würde. Vorbeifliegende Satelliten, andere Labels und Himmelskörper lösen keinen positionsbedingten Seitenwechsel und keine kollisionsbedingte Ausblendung mehr aus.

Der separate Geschwindigkeitsfilter aus v9 bleibt erhalten: Normale Labels bei mehr als 220 Bildschirmpixeln/s werden vorübergehend unterdrückt und kehren nach einer Ruhephase zurück. Ausgewählte Labels sind hiervon ausgenommen. Das manuelle Ein-/Ausschalten der Namen bleibt unverändert.

## Objektlayer und Katalogsuche (historischer Stand v15; aktueller Stand siehe v25)

Im historischen v15-Stand war das Control-Panel oben rechts **110 px breit statt 184 px**; in v26 **100 px**, seit v27 **58 px** (rahmenlos). Der sichtbare Schriftzug „Ansicht“ über der Ansichtsauswahl entfällt (ein Screenreader-Label bleibt vorhanden). Auf Mobilgeräten bleibt das vollständige Control-Panel **dauerhaft oben rechts in der 3D-Szene**.

Das neue **Layer-Dropdown** bietet zwei Voreinstellungen und eine freie Mehrfachauswahl:

- **Standard (v25):** Sonnensystem: Sterne und Planeten. Planetenansicht: Planeten, Monde und Satelliten.
- **Alle:** alle acht Objektkategorien (Planeten, Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen, Raumsonden, Sterne).
- **Individuell:** beliebige Kombinationen über Checkboxen, mindestens eine Kategorie bleibt aktiv. Bei exakt den Standard-/Alle-Kategorien wird der jeweilige Preset-Status automatisch angezeigt. „Alle“ und „Standard“ liegen als zwei Segmente eines gemeinsamen Umschalters ohne Trennstrich zu den Checkboxen direkt nebeneinander.

**Seit v24 filtern die Layer ausschließlich den WebGL-Renderer**, einschließlich Körpern, Bahnen, Labels und Anklickbarkeit in der 3D-Ansicht. Der Katalog listet dagegen unabhängig von den Layern **alle geladenen Objekte**; eine bestehende Katalogauswahl wird beim Ausblenden der Renderer-Kategorie nicht aufgehoben. Seit v23 behalten Sonnensystem- und Planetenansicht **eigene** Layer-, Bahn- und Beschriftungseinstellungen. In der Planetenansicht zeigt „Standard“ den Planeten sowie seine vorhandenen Monde und Satelliten. Kategorien ohne direkt dem Planeten zugeordnete Objekte werden ausgeblendet. Die Sonne zählt zur Kategorie „Sterne“ und ist im Sonnensystem-Standard sichtbar. Das Sternenfeld im Hintergrund bleibt als Szenendekoration bestehen. Raumsonden bleiben ohne Ephemeriden wie in v12 reine Katalogeinträge.

Der Katalog hat keine Kategorie-Filterchips. Die Suche prüft zusätzlich zum Namen, zur Objekt-ID und zur Katalognummer die **deutsche Objektkategorie (Singular/Plural)** sowie den **Namen bzw. die ID des direkten übergeordneten Objekts**. Seit v24 werden Leerzeichen als UND-Verknüpfung behandelt; jedes Suchwort darf in einem anderen Feld vorkommen. Beispiel: `uranus c` findet die Uranus-Monde mit „c“ im Namen; `Monde Jupiter` findet Jupitermonde, unabhängig von der Wortreihenfolge. Groß- und Kleinschreibung sowie Akzente werden normalisiert. In der Planetenansicht erscheint rechts neben der Suche ein **Planetensymbol-Button** (anfangs aus); er zeigt auf Wunsch nur den aktiven Planeten und seine zugehörigen Objekte. In der Sonnenansicht ist dieser Schalter verborgen.

## Control-Panel und Zeitsteuerung (v21)

Das schmale vertikale Control-Panel bleibt oben rechts. Seit v26 stehen darin **nur der Icon-Button für Objektlayer und das Zeit-Dropdown** (ohne Ansichtsauswahl). Sein zweizeiliges Label zeigt die aktuelle **Simulationsgeschwindigkeit** (z. B. `5 Tage / s`) und das **lokale Simulationsdatum** im Format `DD.MM.YYYY` (keine Uhrzeit). Die zwei Einzelknöpfe für Play/Pause und „Heute“ sind nicht mehr direkt im Panel sichtbar.

Ein Klick auf den Zeitknopf öffnet ein **rechtsbündiges Menü direkt unter dem Knopf**. Seit v27 ist das Menü **116 px** breit, unabhängig von der **58 px** breiten Auslösertaste. Oben steht die Geschwindigkeit. Darunter befindet sich der vertikale 241-Stufen-Regler mit mittigem, kontrastreichem Griff und dynamisch gefüllter Spur (von unten bis zum aktuellen Wert). **Unter dem Slider** liegen Play/Pause und der auf ein Symbol reduzierte Heute-Button **nebeneinander**. Zuletzt folgen **Datum und Uhrzeit** in zwei Zeilen (`DD.MM.YYYY` / `hh:mm`). Der Heute-Button behält den zugänglichen Namen und die Zurücksetzfunktion. `Esc` schließt das Menü und setzt den Tastaturfokus auf den Auslöser; Klick außerhalb schließt es ebenfalls. Beim Öffnen der Objektlayer-Auswahl wird das Zeitmenü geschlossen.

Auf Smartphones und Tablets bis 770 px befindet sich das vollständige Control-Panel **direkt über der 3D-Szene**. Layer und Zeit sind dort erreichbar; der separate runde Kamera-Reset sitzt rechts unten oberhalb der geschlossenen Sheet-Leiste. Beide Dropdowns öffnen rechtsbündig unter ihrem Auslöser; das Layer-Menü ist für kleine Bildschirme scrollbar. Das Bottom-Sheet hat nur die zwei Tabs **„Objekte“** und **„Details“**. Der Regler besitzt einen größeren, hellen Griff mit dunkler Umrandung und seit v21 eine zentrierte Position und eine füllende Farbspur.

- **Play/Pause:** Stellt nur den Wiedergabestatus um und behält die Geschwindigkeit.
- **Regler:** 241 Stufen logarithmisch; nach oben schneller. Die beiden Ansichten speichern die zuletzt gewählte Geschwindigkeit separat.
- **Heute:** Setzt `S.time = Date.now()` in der lokalen Anzeige; Kameraposition, Ansicht, Geschwindigkeit und Play/Pause bleiben unverändert.

| Ansicht | Minimum | Standard | Maximum |
|---|---:|---:|---:|
| Sonnensystem | 1 Stunde / s | 5 Tage / s | 10 Jahre / s |
| Planetenansicht | 1 Minute / s | 1 Stunde / s | 1 Jahr / s |

Der **Kamera-zurücksetzen**-Button sitzt seit v27 außerhalb des Panels unten rechts: in der Sonnensystemansicht wechselt er zwischen drei Kameraperspektiven (nach manueller Bewegung zuerst zurück zur Standardperspektive), in einer isolierten Ansicht führt er zur Sonnensystemübersicht. Der **Beschriftung**-Schalter liegt seit v20 im Objektlayer-Dropdown, zusammen mit den Bahneinstellungen; darunter stehen seit v29 **Beleuchtung** und **4 Monde**.

## Katalog unabhängig vom Renderer (v24)

Unabhängig von den Renderer-Layern erscheinen alle Objekte in der Liste und bleiben durchsuchbar. Der optionale Planetensymbol-Filter neben dem Suchfeld ist nur in der Planetenansicht sichtbar, startet ausgeschaltet und begrenzt die Liste auf den aktuellen Planeten samt zugehörigen Begleitern. Beim Wechsel des Planeten folgt er dem neu gewählten System; beim Wechsel zur Sonnenansicht ist er ohne Wirkung. Die Suche kombiniert Suchwörter feldübergreifend, z. B. `uranus c`. Siehe [Delta v24](docs/DELTA-V24.md).

## Kompaktes Objektlayer-Dropdown und neue Standards (v25)

**Sonnensystem:** Standard = **Sterne + Planeten**; Monde, Zwergplaneten, Asteroiden, Satelliten, Kometen und Raumsonden sind zunächst aus. **Planetenansicht:** Standard = **Planeten + Monde + Satelliten**, soweit beim aktuellen Planeten vorhanden. Die Zustände beider Ansichten werden weiterhin unabhängig geführt; „Alle“ schaltet alle verfügbaren Kategorien ein, benutzerdefinierte Kombinationen bleiben möglich.

Das Layer-Menü ist von **227 px auf 152 px** reduziert (ca. 33 %). „Alle“ und „Standard“ bilden einen gemeinsamen segmentierten Umschalter; die frühere Trennlinie zwischen diesem Umschalter und den Kategorie-Checkboxen entfällt. Die Überschriften „Objektlayer“, „Umlaufbahnen“ und „Beschriftung“ sowie der Textabsatz unter den Bahnschaltern wurden entfernt. **Umlaufbahn** bleibt als Hauptschalter erhalten; **Kontrast** und **Farben** sind leicht eingerückt. **Beschriftung** bleibt als eigenständiger Schalter sichtbar. Siehe [Delta v25](docs/DELTA-V25.md).

## Getrennte Layer und Standardgeschwindigkeit (v23)

Die Sonnensystemansicht startet mit **5 simulierten Tagen pro realer Sekunde** (Reglerstufe 101). Die Planetenansicht bleibt bei **1 Stunde/s**. Die beiden Geschwindigkeiten sind weiterhin unabhängig.

**Objektlayer, Umlaufbahnen, Kontrast, Farben und Beschriftungen** werden getrennt für die beiden Ansichten gespeichert. Bei einem Szenenwechsel werden die Einstellungen der Zielansicht wiederhergestellt. In v23/v24 umfasste der Standard **Planeten, Monde und Satelliten** und in der Sonnenübersicht zusätzlich **Sterne**. Seit v25 startet die Sonnenübersicht dagegen ausschließlich mit **Sterne und Planeten**; die planetenzentrierte Voreinstellung bleibt unverändert. Bei einem ausgewählten Planeten erscheinen im Layer-Dropdown nur der Planetentyp und die tatsächlich im Katalog unter `parentId` dieses Planeten verzeichneten Kindkategorien. Bei Erde sind dies Planeten, Monde und Satelliten, bei Jupiter Planeten und Monde. In der Szene verbleiben immer mindestens eine aktivierte verfügbare Kategorie; verdeckte Kategorien bleiben als Status für andere Planeten erhalten. Details: [Delta v23](docs/DELTA-V23.md).

## Vollständige Sonnenbahnen und Mondbeschriftungen (v22)

In der Sonnensystemansicht erscheinen bei aktivierten Umlaufbahnen die Pfade **aller** Objekte mit Sonne als direktem Elternkörper, die einer aktiven Layer-Kategorie angehören und gültige Bahnparameter haben. Dies umfasst die nicht ausgewählten Zwergplaneten, Asteroiden und Kometen. Monde und Satelliten umkreisen stattdessen Planeten; ihre Bahnen werden unverändert in den Planetenansichten gezeichnet, nicht fälschlich als Kreise um die Sonne. Historisch (v22–v28) konkurrierten pro Planet nur die **vier größten Monde** um ein Label; ein ausgewählter kleinerer Mond konnte den viertgrößten Kandidaten ersetzen. **Seit v29** steuert der neue „4 Monde“-Toggle die tatsächliche Sichtbarkeit: Bei **An** sind nur die vier größten Monde samt Labels sichtbar, bei **Aus** alle aktiven Monde mit den üblichen Dichte- und Bewegungsfiltern.

## Objektlayer mit Umlaufbahn- und Beschriftungseinstellungen (v20)

Das Objektlayer-Dropdown öffnet direkt unter dem Layer-Button, rechtsbündig. Unterhalb der Kategorien enthält es die drei unabhängigen Umlaufbahn-Schalter: **Umlaufbahn** (anzeigen/ausblenden), **Kontrast** (breitere und stärker deckende Striche) und **Farben** (Kategoriefarben statt einheitlichem Graublau). Beim Start sind **Umlaufbahn an**, **Kontrast aus** und **Farben an**. Darunter gibt es den eigenen Schalter **Beschriftung** (beim Start an), der die Namen in der 3D-Szene ein- und ausschaltet. Bei deaktivierten Bahnen bleiben die beiden visuellen Einstellungen gespeichert. Ein Klick außerhalb, Escape oder der Wechsel zum Zeitmenü schließt die Layer-Auswahl. Mobil bleibt das Menü am Control-Panel der Szene. Es gibt keinen separaten Bahnen- oder Beschriftungs-Button im Panel.

| Objekt / Umlaufbahn | Farbe |
|---|---|
| Planeten und Monde | `#E6EDF5` |
| Erdumlaufbahn (Sonderfall) | `#4DA3FF` |
| Zwergplaneten | `#B68CFF` |
| Asteroiden | `#E9B44C` |
| Kometen | `#FF7597` |
| Künstliche Satelliten | `#A7D86D` |
| Raumsonden | `#FF8B4A` |
| Sterne | `#FFE5A0` |

Raumsonden verfügen bislang über keine Ephemeriden und deshalb über keine 3D-Orbitbahnen. Ihre Kategoriefarbe wird im Katalog angezeigt. Die natürliche Oberflächenfarbgebung und lokalen Planetentexturen ändern sich nicht.

## Gemeinsame linke Sidebar und Objektdetails (v22)

Auf dem Desktop sind **Objekte** und **Details** jetzt zwei Tabs in einer gemeinsamen linken Seitenleiste. Eine rechte Detailspalte und die obere globale Leiste gibt es nicht mehr. Beim Start ist „Objekte“ geöffnet; eine gezielte Auswahl öffnet „Details“. Mobil bleiben diese zwei Tabs im Bottom-Sheet und das vollständige Control-Panel liegt weiterhin oben rechts über der Szene. Der runde Kamera-Reset mit nach außen weisenden Pfeilen ersetzt die frühere Hilfe (?)-Taste und liegt seit v27 unten rechts. Der mobile Menü-Button (☰) und der gesonderte Sheet-Griff entfallen; die gesamte Tab-Kopfleiste ist ziehbar. Siehe [Hilfe](docs/HILFE.md).

## Objektdetails (v13)

Die Überschrift der Details zeigt nun den **Objektnamen**; Typ und Herkunft stehen als Text im Schaubild (`hero-ref`). Mit **Wissen** wird die redaktionelle Darstellung angezeigt, mit **Daten** die astronomischen Werte, Orbit- und Quelleninformationen. Die Quellenliste befindet sich im scrollbaren Bereich statt als feststehender Footer. Im Katalog entfällt der bisherige Einleitungstext (`catalog-intro`), die Suche steht an erster Stelle. Die Kamera-Hinweise innerhalb der Ansicht wurden entfernt.

## Katalogumfang

| Typ | Objekte |
|---|---:|
| Stern | 1 |
| Planeten | 8 |
| Monde | 136 |
| Zwergplaneten | 5 |
| Asteroiden | 6 |
| Kometen | 2 |
| Künstliche Satelliten (lokaler Startbestand) | 2 |
| **Gesamt** | **160** |

**Katalogergänzungen aus v8 (in v9 erhalten):** 120 Monde von Jupiter, Saturn, Uranus, Neptun und Pluto, der Asteroid **(3) Juno** sowie die Kometen **1P/Halley** und **2P/Encke**. Die 37 Bestandsobjekte sind erhalten. Die meisten zusätzlichen Monde sind relativ klein oder irregulär und werden wie zuvor im Sonnensystem je nach Auswahl sichtbar; in der Planetenansicht erscheinen die Begleiter des ausgewählten Planeten.

**160 Artikel** sind mit den Objekt-IDs verknüpft: 37 erweiterte Bestandsartikel, 120 Mondartikel und 3 Kleinkörperartikel. Für 69 Objekte gibt es einen zusätzlichen thematischen Hintergrundabschnitt. Alle sind zur transparenten redaktionellen Nachprüfung weiterhin mit Status `imported` markiert – **nicht** automatisch als journalistisch freigegeben.

## Struktur

```text
Workspace-Root/
├── index.html, sw.js, manifest.webmanifest, favicon.svg
├── css/, icons/
├── data/
│   ├── catalog/
│   │   ├── manifest.json
│   │   ├── stars.json, planets.json, dwarf-planets.json
│   │   ├── moons.json, asteroids.json, satellites.json, comets.json
│   │   ├── moons-*-jpl.json      # acht neue Mondgruppen
│   │   └── asteroids-jpl.json, comets-jpl.json
│   └── editorial/
│       ├── de.json              # 37 erweiterte Bestandsartikel
│       ├── de-moons.json        # 120 weitere Mondartikel
│       └── de-small-bodies.json # Juno, Halley, Encke
├── src/data/catalog.js         # lädt und validiert ALLE Redaktionsdateien
├── src/renderer/, src/ui/, src/services/
├── server/                     # Node-Server / optionale API-Proxies
├── tests/                      # v2–v11 Regressionstests
├── scripts/validate-catalog.mjs
└── docs/                       # Datenarchitektur, Herkunft, Änderungen
```

## Datenherkunft und Grenzen

Die neuen Mondumlaufbahnen basieren auf **NASA/JPL – Planetary Satellite Mean Elements**: <https://ssd.jpl.nasa.gov/sats/elem/sep.html>. Soweit verfügbar stammen Radien aus **NASA/JPL – Physical Parameters of Natural Satellites**: <https://ssd.jpl.nasa.gov/sats/phys_par/>. Juno, Halley und Encke nutzen **historische Beispiel-Bahnelemente** aus <https://ssd.jpl.nasa.gov/sb/elem_tables.html>. Zusätzliche Besonderheiten und wissenschaftliche Hintergründe sind durch NASA-Science-Links im jeweiligen Artikel belegt.

**Wichtige Einschränkung:** Die Planetensysteme zeigen **schematische Umlaufbahnen**, keine astrophysikalisch präzisen Positionen. JPL-Mondelemente können verschiedene Referenzebenen verwenden; die vorhandene Visualisierung führt noch keine vollständige Koordinatentransformation durch. Historische Kometenbahnen werden nicht dynamisch nachgeführt. Wo ein Radius fehlt, steht **„—“** statt eines geratenen Werts (intern `radiusKm: 0` als Sentinel).

## Bedienung

- **Desktop:** Links ziehen: umschauen. Mausrad: Zoom. Rechts ziehen oder Shift + links ziehen: bodenparallel bewegen. Pfeiltasten: bodenparallel bewegen.
- **Mobil:** Ein Finger: umschauen. Zwei Finger spreizen/zusammenziehen: Zoom. Zwei Finger gemeinsam bewegen: bodenparallel verschieben.
- **Planetenansicht:** In Planet-, Zwergplanet- oder Monddetails „Planetenansicht öffnen“ wählen. Bei Monden wird das übergeordnete Planeten-/Zwergplanetensystem geöffnet. Der runde Kamera-Reset rechts oben kehrt zur Sonnensystemübersicht zurück.
- **Redaktion:** In den Objektdetails unter den Kennzahlen erscheinen Hintergrundabschnitte und direkte Quellenlinks (auf Mobilgeräten Detail-Panel erweitern).

## PWA und Updates

`sw.js` liegt unmittelbar im Workspace-Root unter `/sw.js`. Die v33-PWA verwendet den Cache `sonnensystem-shell-v33` und speichert beim Installieren die App-Shell und alle im Katalog-Manifest genannten JSON-Dateien für den Offline-Betrieb. Bei installiertem Altbestand gegebenenfalls aktualisieren und die PWA neu öffnen. API-Antworten werden nicht mitgespeichert.

## Weiterarbeiten

Astronomische Objekte werden nur in `data/catalog/` verwaltet; Texte, Status und Links nur in `data/editorial/`. Mehrere Dateien pro Kategorie und Sprache sind möglich, die Dateiübersicht steht im `manifest.json`. Beim Hinzufügen neuer Objekte auch `catalogVersion` und `CACHE_NAME` erhöhen. Ein Import-Job und ein visuelles CMS sind **nicht** Bestandteil dieser Version. Bei sehr viel größeren Katalogen werden Filter, Indexierung, stufenweises Laden und Renderer-Optimierungen erforderlich.

**Dokumentation:** [Delta v25](docs/DELTA-V25.md), [Delta v24](docs/DELTA-V24.md), [Delta v23](docs/DELTA-V23.md), [Delta v22](docs/DELTA-V22.md), [Hilfe](docs/HILFE.md), [Delta v21](docs/DELTA-V21.md), [Delta v20](docs/DELTA-V20.md), [Delta v19](docs/DELTA-V19.md), [Delta v18](docs/DELTA-V18.md), [Delta v17](docs/DELTA-V17.md), [Delta v16](docs/DELTA-V16.md), [Delta v14](docs/DELTA-V14.md), [Delta v13](docs/DELTA-V13.md), [Delta v12](docs/DELTA-V12.md), [Delta v11](docs/DELTA-V11.md), [Texturquellen](docs/TEXTURE-SOURCES.md), [Delta v10](docs/DELTA-V10.md), [Datenarchitektur](docs/DATA-ARCHITECTURE.md), [Architektur](docs/ARCHITECTURE.md), [Delta v9](docs/DELTA-V9.md), [Änderungen v8](docs/DELTA-V8.md).
