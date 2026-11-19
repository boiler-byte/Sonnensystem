# Hilfe – Sonnensystem (aktuelle Bedienung)

## Navigation

**Desktop:** Linke Maustaste ziehen oder Pfeiltasten: Kamera parallel zur Szenenebene bewegen, **unabhängig vom Neigungswinkel**. Rechte Maustaste ziehen bzw. `Shift` + linke Taste ziehen: Blickrichtung ändern. Mausrad: zoomen. Ohne ausgewähltes Objekt bleibt die Kamera beim freien Umsehen am festen Standort; Ziehen nach unten blickt nach unten, Ziehen nach oben nach oben. Bei ausgewähltem Objekt ist die Blicksteuerung weiterhin objektbezogen.

**Mobil:** Mit einem Finger verschieben, mit zwei gemeinsam bewegten Fingern umsehen und mit zwei Fingern per Spreizgeste zoomen. Das mobile Detail-Sheet lässt sich über seine Kopfleiste öffnen und schließen.

## Kamera und AR

Der Kamera-Button sitzt rechts unten, der **AR-Button** links unten. Die Kameraperspektiven wechseln von **Schräg/oben → Topdown → Seitlich → Schräg/oben**; das Symbol zeigt jeweils die *nächste* Aktion. Nach einer manuellen Kamerabewegung ist die Schrägansicht wieder die nächste Wahl. Außerhalb von AR führt der Button aus einer isolierten Planetenansicht zur Sonnensystemübersicht zurück.

Auf unterstützten Mobilgeräten mit Orientierungssensor erlaubt **AR** die Blicksteuerung durch Drehen oder Neigen des Geräts. Es können Berechtigungen und ein sicherer Browserkontext erforderlich sein. Die gewählte Perspektive lässt sich bei aktiviertem AR umschalten, ohne den Sensor erneut anzumelden. **AR erfasst keine räumliche Ortsänderung** des Telefons. Kamera-Reset richtet die virtuelle Kamera beziehungsweise bei AR den Sensorbezug neu aus.

## Objekte und Details

Links (mobil: im Bottom-Sheet) zwischen **Objekte** und **Details** umschalten. Die Suche findet Objektname, Kategorien, Elternkörper und bekannte Aliasse. Exakte Namen und Kategorien haben Vorrang vor Teiltreffern. Katalogsuche und Details sind auch für ausgeblendete Layer verfügbar. Ein Eintrag zeigt Wissensartikel, messbare Daten, Bahnmodell und Quellen an.

Mit **Planetenansicht** kann eine isolierte Ansicht des Zentralobjekts geöffnet werden. Bei einem Mond bezieht sie sich auf seinen übergeordneten Planeten oder Zwergplaneten. **Folgen** hält das gewählte Objekt im Blick.

## Layer und Darstellungsoptionen

Das **Layer-Dropdown** oben rechts bietet **Alle** und **Standard** sowie die fünf Anzeigeoptionen **Beschriftung, Beleuchtung, Alle Monde, Umlaufbahn, Kontrast**. Darunter stehen die Objektkategorien einschließlich Doppelasteroiden und **Transnept. Objekte**.

**Standard** wählt im Sonnensystem Sterne und Planeten, in Planetenansichten Planet/Monde/Satelliten (soweit verfügbar). **Alle** aktiviert sämtliche verfügbaren Kategorien und Anzeigeoptionen. Die Darstellungszustände verschiedener Ansichten werden unabhängig gespeichert. Bei „Alle Monde“ *aus* bleiben maximal vier große Monde je Planet sichtbar; die Katalogeinträge bleiben vollständig.

## Maßstab, Reihe und Cinema

Die Schalter **Objekt**, **Bahn** und **Reihe** liegen direkt im Control-Panel. Objekt verändert die Körpergrößen, Bahn die Distanzen; beides dient dem Vergleich und ersetzt keine wissenschaftlich exakte Maßstabsdarstellung. Der Schalter Reihe ordnet Körper nach Größen.

In der vergrößerten Reihe können große Körper bewusst **angeschnitten** sein, damit kleine Körper vergleichbar bleiben.

Für den **Cinema-Modus** die Kombination **Reihe an + Objekt an + Bahn aus** wählen, dann **Play** drücken. Die Kamera durchläuft die nach Größe sortierten sichtbaren Körper mit Zoom und einer Haltephase von etwa 1,5 Sekunden. Der Regler der Cinema-Zeitleiste erlaubt Springen und Pausieren; Stop und `Esc` beenden den Ablauf. Änderungen an Szene, Layern oder Kamera können Cinema ebenfalls beenden.

## Zeitreise, Live-Daten und Offline-Nutzung

Im Zeitmenü Geschwindigkeit und Simulationsdatum wählen, Wiedergabe pausieren oder auf heute zurücksetzen. Sonnensystem- und Planetenansicht speichern getrennte Simulationsgeschwindigkeiten. Bahnen beruhen auf Näherungsmodellen, nicht auf präzisen aktuellen Ephemeriden.

Nach dem ersten erfolgreichen Online-Laden kann die PWA ohne Netzwerk mit lokalem Katalog genutzt werden. Bilder werden bei Bedarf lokal gespeichert. Optionale **Live-Daten** stammen aus externen Diensten. API-Aktualisierungen sind offline nicht verfügbar.

Bei Störungen nach einem Update die App vollständig neu öffnen, damit der neue Service Worker und die App-Shell übernommen werden.

Weitere Informationen: [Datenarchitektur](DATA-ARCHITECTURE.md) und [Versionshistorie](RELEASE-HISTORY.md).
