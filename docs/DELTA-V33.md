# Delta v33 – Mobiles Sheet über Browser-/Android-Zurück schließen

## Änderung gegenüber v32

- Beim Übergang **geschlossen → halb/voll** des mobilen Sheets legt die App mit `history.pushState` genau einen temporären Verlaufseintrag für das Sheet an. Die URL ändert sich dabei nicht; ein vorhandenes Objekt in `history.state` wird erhalten.
- **Browser-Zurück, Android-System-Zurück und PWA-Zurück** erreichen den `popstate`-Listener, der das Sheet aus **halb** oder **voll** direkt auf **geschlossen** setzt. Die Seite bleibt offen.
- Wechsel zwischen **Objekte/Details**, **halb/voll**, Drehung oder Größenänderung des Displays erzeugen keine weiteren Einträge.
- Schließen per Header, Wischen, Scrim, Escape, Kamera-Reset oder Ansichtswechsel ruft `history.back()` auf, um den temporären Eintrag zu verbrauchen. Wiederholtes Öffnen/Schließen stapelt keine zusätzlichen Einträge. Wird während eines noch ausstehenden Zurück-Vorgangs erneut geöffnet, wartet die neue Verlaufseintragung auf dessen Abschluss.
- **Vorwärts** zu einem noch vorhandenen Sheet-Eintrag stellt das mobile Sheet wieder halb geöffnet her. Ein Wechsel zur Desktopansicht entfernt einen offenen temporären Eintrag.
- Falls die History API im jeweiligen Kontext nicht verfügbar ist, bleiben die vorhandenen Bedienelemente des Sheets funktionsfähig.
- **Version/PWA:** Anwendung `33.0.0`, Cache `sonnensystem-shell-v33`. Keine Datenmigration.

## Installation

Delta v33 über einer **vollständigen Installation von v32** entpacken und bestehende Dateien ersetzen. Das ZIP ist keine Vollversion. Danach neu laden (bei installierter PWA auf Übernahme des neuen Service Workers achten).

## Prüfung

`npm run check` validiert den Katalog und führt die Regressionstests einschließlich der neuen History-Tests aus. Browserprüfung für mobiles Sheet: Zurück aus halb und voll, Vorwärts, manuelles Schließen, erneutes Öffnen sowie Desktopwechsel.
